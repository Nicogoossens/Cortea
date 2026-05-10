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
