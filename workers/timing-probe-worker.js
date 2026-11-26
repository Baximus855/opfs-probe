// FROST timing probe worker
// Measures read latency from the probe file in high-frequency loops
// measure-worker.js
// Holds its own OPFS sync access handle and performs timed random 4KB
// reads on request, reporting raw latencies in microseconds back to the
// main thread for one block at a time.

let accessHandle = null;
let fileSizeBytes = 0;
const BLOCK_SIZE = 4096;

async function ensureFile(fileSizeMB) {
  const root = await navigator.storage.getDirectory();
  const fh = await root.getFileHandle("frost_measure.bin", { create: true });
  accessHandle = await fh.createSyncAccessHandle();
  fileSizeBytes = fileSizeMB * 1024 * 1024;

  const currentSize = accessHandle.getSize();
  if (currentSize !== fileSizeBytes) {
    accessHandle.truncate(fileSizeBytes);
    const chunkSize = 4 * 1024 * 1024;
    const chunk = new Uint8Array(chunkSize);
    crypto.getRandomValues(chunk.subarray(0, 65536));
    for (let p = 65536; p < chunkSize; p += 65536) {
      chunk.copyWithin(p, 0, 65536);
    }
    let offset = 0;
    while (offset < fileSizeBytes) {
      const thisChunk = Math.min(chunkSize, fileSizeBytes - offset);
      accessHandle.write(chunk.subarray(0, thisChunk), { at: offset });
      offset += thisChunk;
      postMessage({ type: "load-progress", writtenMB: Math.round(offset / (1024 * 1024)) });
    }
    accessHandle.flush();
  }
}

function timedRead(buf) {
  const maxOffsetBlocks = Math.floor((fileSizeBytes - buf.length) / BLOCK_SIZE);
  const offset = Math.floor(Math.random() * maxOffsetBlocks) * BLOCK_SIZE;
  const t0 = performance.now();
  accessHandle.read(buf, { at: offset });
  const t1 = performance.now();
  return (t1 - t0) * 1000; // ms -> us
}

self.onmessage = async (e) => {
  const msg = e.data;
  if (msg.cmd === "init") {
    await ensureFile(msg.fileSizeMB);
    postMessage({ type: "ready" });
  } else if (msg.cmd === "measureBlock") {
    const buf = new Uint8Array(BLOCK_SIZE);
    const latenciesUs = new Array(msg.reads);
    for (let i = 0; i < msg.reads; i++) {
      latenciesUs[i] = timedRead(buf);
    }
    postMessage({ type: "block-result", blockId: msg.blockId, phase: msg.phase, latenciesUs });
  } else if (msg.cmd === "close") {
    if (accessHandle) accessHandle.close();
  }
};
