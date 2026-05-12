/**
 * Google Drive API helper — Task #310
 * Uses the Replit Connectors SDK (google-drive integration) for all requests.
 * Never cache the connectors instance — tokens expire.
 */
import { ReplitConnectors } from "@replit/connectors-sdk";

function getConnectors(): ReplitConnectors {
  return new ReplitConnectors();
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

/**
 * List all markdown files directly inside a Drive folder (non-recursive).
 */
export async function listFilesInFolder(folderId: string): Promise<DriveFile[]> {
  const connectors = getConnectors();
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false and mimeType='text/markdown'`);
  const resp = await connectors.proxy(
    "google-drive",
    `/drive/v3/files?q=${q}&fields=files(id,name,mimeType)&pageSize=100`,
    { method: "GET" },
  );
  const data = (await resp.json()) as { files?: DriveFile[] };
  return data.files ?? [];
}

/**
 * List all subfolders directly inside a Drive folder.
 */
export async function listFoldersInFolder(folderId: string): Promise<DriveFile[]> {
  const connectors = getConnectors();
  const q = encodeURIComponent(
    `'${folderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
  );
  const resp = await connectors.proxy(
    "google-drive",
    `/drive/v3/files?q=${q}&fields=files(id,name,mimeType)&pageSize=100`,
    { method: "GET" },
  );
  const data = (await resp.json()) as { files?: DriveFile[] };
  return data.files ?? [];
}

/**
 * Download a Drive file and return its full text content.
 */
export async function downloadFileAsText(fileId: string): Promise<string> {
  const connectors = getConnectors();
  const resp = await connectors.proxy(
    "google-drive",
    `/drive/v3/files/${fileId}?alt=media`,
    { method: "GET" },
  );
  return resp.text();
}

/**
 * Retrieve file metadata including the parent folder IDs.
 */
export async function getFileMetadata(fileId: string): Promise<DriveFile & { parents: string[] }> {
  const connectors = getConnectors();
  const resp = await connectors.proxy(
    "google-drive",
    `/drive/v3/files/${fileId}?fields=id,name,mimeType,parents`,
    { method: "GET" },
  );
  return resp.json() as Promise<DriveFile & { parents: string[] }>;
}

/**
 * Move a file from its current parent(s) to a new folder.
 * Uses the Drive v3 addParents / removeParents mechanism.
 */
export async function moveFileToFolder(fileId: string, newFolderId: string): Promise<void> {
  const meta = await getFileMetadata(fileId);
  const oldParents = (meta.parents ?? []).join(",");
  const connectors = getConnectors();
  await connectors.proxy(
    "google-drive",
    `/drive/v3/files/${fileId}?addParents=${encodeURIComponent(newFolderId)}&removeParents=${encodeURIComponent(oldParents)}&fields=id,parents`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    },
  );
}

/**
 * Upload a plain-text or markdown file to a Drive folder.
 * Uses the multipart upload API (uploadType=multipart).
 * Returns the created file's Drive ID.
 */
export async function uploadTextFile(
  folderId: string,
  fileName: string,
  content: string,
  mimeType: string = "text/markdown",
): Promise<string> {
  const connectors = getConnectors();
  const boundary = "cortea_boundary_" + Date.now();
  const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`;

  const resp = await connectors.proxy(
    "google-drive",
    `/upload/drive/v3/files?uploadType=multipart&fields=id,name`,
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  const data = (await resp.json()) as { id: string; name: string };
  return data.id;
}

export async function resolveDoneFolder(sourceFolderId: string): Promise<string | null> {
  const doneRoot = process.env.DRIVE_IMPORT_DONE_FOLDER_ID;
  if (!doneRoot) return null;

  const sourceMeta = await getFileMetadata(sourceFolderId);
  const folderName = sourceMeta.name;

  const subs = await listFoldersInFolder(doneRoot);
  const match = subs.find((f) => f.name === folderName);
  return match?.id ?? null;
}
