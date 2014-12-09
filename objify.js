var encode  = require('tab64').encode
var unindex = require('unindex-mesh')
var through = require('through')
var obj     = require('dot-obj')
var deobj   = require.resolve('./deobj')

module.exports = objify

function objify(file, opts) {
  if (!/\.obj$/g.test(file)) return through()

  var stream = through(write, flush)
  var buffer = []

  return stream

  function write(data) {
    buffer.push(data)
  }

  function flush() {
    stream.queue('module.exports = function(separate, indices) {return ')
    stream.queue('require("'+deobj+'")([')

    var models = obj(buffer.join(''))

    for (var i = 0; i < models.length; i++) {
      var model = models[i]
      var positions = unindex(model.positions, model.cells)

      if (i) stream.queue(',')
      stream.queue('"')
      stream.queue(encode(positions).replace(/\s/g, ''))
      stream.queue('"')
    }

    stream.queue('], separate, indices)}')
    stream.queue(null)
  }
}
