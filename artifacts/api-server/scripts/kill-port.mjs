#!/usr/bin/env node
/**
 * kill-port.mjs — kills any process currently listening on $PORT
 *
 * Uses /proc/net/tcp6 (Linux-only) to find the inode for the listening
 * socket, then walks /proc/<pid>/fd to find which process owns it, and
 * sends SIGKILL.  Exits silently if nothing is found.
 */
import { readFileSync, readdirSync, readlinkSync } from "node:fs";

const port = parseInt(process.env.PORT ?? "8080", 10);

function hexPort(p) {
  return p.toString(16).toUpperCase().padStart(4, "0");
}

function findInodeTcp6(targetPort) {
  try {
    const hex = hexPort(targetPort);
    const lines = readFileSync("/proc/net/tcp6", "utf8").split("\n");
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 10) continue;
      const localAddr = parts[1];
      const colonIdx = localAddr.lastIndexOf(":");
      if (colonIdx === -1) continue;
      const portHex = localAddr.slice(colonIdx + 1);
      const state = parts[3];
      if (portHex === hex && state === "0A") {
        return parts[9];
      }
    }
  } catch {
    // /proc/net/tcp6 not available — skip
  }
  return null;
}

function findInodeTcp4(targetPort) {
  try {
    const hex = hexPort(targetPort);
    const lines = readFileSync("/proc/net/tcp", "utf8").split("\n");
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 10) continue;
      const localAddr = parts[1];
      const colonIdx = localAddr.lastIndexOf(":");
      if (colonIdx === -1) continue;
      const portHex = localAddr.slice(colonIdx + 1);
      const state = parts[3];
      if (portHex === hex && state === "0A") {
        return parts[9];
      }
    }
  } catch {
    // /proc/net/tcp not available — skip
  }
  return null;
}

function findPidByInode(inode) {
  try {
    const target = `socket:[${inode}]`;
    for (const pid of readdirSync("/proc")) {
      if (!/^\d+$/.test(pid)) continue;
      try {
        const fds = readdirSync(`/proc/${pid}/fd`);
        for (const fd of fds) {
          try {
            const link = readlinkSync(`/proc/${pid}/fd/${fd}`);
            if (link === target) return parseInt(pid, 10);
          } catch {
            // fd may have disappeared
          }
        }
      } catch {
        // process may have exited
      }
    }
  } catch {
    // /proc not available
  }
  return null;
}

const inode = findInodeTcp6(port) ?? findInodeTcp4(port);

if (!inode) {
  process.exit(0);
}

const pid = findPidByInode(inode);

if (!pid || pid === process.pid) {
  process.exit(0);
}

try {
  process.kill(pid, "SIGKILL");
  console.log(`[kill-port] Killed PID ${pid} on port ${port}`);
} catch {
  // Already dead
}
