// FROST load generator worker
// Creates and deletes swap files to generate SSD contention// load-worker.js
// Continuously hammers its own OPFS file with read/write while the shared
// flag is set to 1. Yields back to the event loop every small batch so it
// can respond to start/stop promptly via the shared flag.

let accessHandle = null;
let fileSizeBytes = 0;
let flagView = null; // Int32Array view on a SharedArrayBuffer, index 0 = on/off
let workerId = 0;

async function ensureFile(fileSizeMB, id) {
  const root = await navigator.storage.getDirectory();
  const fh = await root.getFileHandle(`frost_load_${id}.bin`, { create: true });
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
    }
    accessHandle.flush();
  }
}

function startLoop() {
  const buf = new Uint8Array(65536);
  crypto.getRandomValues(buf);
  const maxOffsetBlocks = Math.floor((fileSizeBytes - buf.length) / 4096);

  function tick() {
    if (Atomics.load(flagView, 0) === 0) {
      setTimeout(tick, 5);
      return;
    }
    // Small synchronous batch of contention I/O, then yield so the flag
    // can be rechecked quickly instead of spinning forever uninterruptibly.
    for (let i = 0; i < 8; i++) {
      const offset = Math.floor(Math.random() * maxOffsetBlocks) * 4096;
      accessHandle.write(buf, { at: offset });
      accessHandle.read(buf, { at: offset });
    }
    setTimeout(tick, 0);
  }
  tick();
}

self.onmessage = async (e) => {
  const msg = e.data;
  if (msg.cmd === "init") {
    workerId = msg.id;
    flagView = new Int32Array(msg.sab);
    await ensureFile(msg.fileSizeMB, workerId);
    postMessage({ type: "ready", id: workerId });
    startLoop();
  } else if (msg.cmd === "close") {
    if (accessHandle) accessHandle.close();
  }
};
