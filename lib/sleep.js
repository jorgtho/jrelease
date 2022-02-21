module.exports = (ms) => {
  if (!ms) throw new Error('Missing required parameter "ms"')
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}
