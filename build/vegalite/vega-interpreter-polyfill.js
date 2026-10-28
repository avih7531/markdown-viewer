;(function () {
  var root = typeof globalThis !== 'undefined'
    ? globalThis
    : typeof self !== 'undefined'
      ? self
      : window

  var vega = root.vega
  if (!vega) {
    return
  }

  // vega-interpreter's browser UMD passes globalThis.vega as the vega-util
  // import; vega-util's DisallowedObjectProperties must exist on that object.
  if (!vega.DisallowedObjectProperties) {
    vega.DisallowedObjectProperties = new Set(Object.getOwnPropertyNames(Object.prototype))
  }
})()
