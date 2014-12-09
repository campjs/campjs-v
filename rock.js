var mat4     = require('gl-matrix').mat4
var unindex  = require('unindex-mesh')
var normals  = require('face-normals')
var Geometry = require('gl-geometry')

module.exports = function(obj, Shader) {
  var shader
  var geom

  return function(gl, x, y, z) {
    var model = mat4.create()
    var scale = Math.random() * 0.1 + 0.2

    mat4.translate(model, model, [x, y, z])
    mat4.scale(model, model, [scale, scale, scale])
    mat4.rotateY(model, model, Math.random() * Math.PI * 2)

    shader = shader || Shader(gl)
    geom = geom || createGeom()

    render.prerender = prerender
    render.postrender = postrender
    return render

    function render(params) {
      shader.uniforms.uModel = model
      geom.draw()
    }

    function prerender(params) {
      geom.bind(shader)
      shader.uniforms.uLightDirection = params.lightDirection
      shader.uniforms.uLightThreshold = params.lightThreshold
      shader.uniforms.uProjection = params.proj
      shader.uniforms.uView = params.view
    }

    function postrender(params) {
      // geom.unbind()
    }

    function createGeom() {
      var geom = Geometry(gl)

      if (obj.pos) {
        var pos = obj.pos
        var nor = normals(pos)
        var idx = obj.idx
      } else {
        var pos = obj
        var nor = normals(pos)
      }

      geom
        .attr('position', pos)
        .attr('normal', nor)

      if (idx) geom
        .attr('index', idx)

      return geom
    }
  }
}
