var normals = require('face-normals')
var Buffer  = require('gl-buffer')
var decode  = require('tab64').decode

module.exports = deobj

function deobj(arr, separate, indices) {
  var size = 0

  for (var x = 0; x < arr.length; x++) {
    size += (
      arr[x] = decode(arr[x], 'float32')
    ).length
  }

  var mesh = new Float32Array(size)
  for (var x = 0, i = 0; x < arr.length; x++) {
    var el = arr[x]
    for (var y = 0; y < el.length; y++) {
      mesh[i++] = el[y]
    }
  }

  if (separate && indices) {
    var idx = new Float32Array(size)
    for (var x = 0, i = 0; x < arr.length; x++) {
      var el = arr[x]

      indices[x] = indices[x] || 0
      for (var y = 0; y < el.length; y++) {
        idx[i++] = indices[x]
      }
    }

    return { pos: mesh, idx: idx }
  }

  return mesh
}
