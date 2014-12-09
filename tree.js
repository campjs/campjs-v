var mat4     = require('gl-matrix').mat4
var unindex  = require('unindex-mesh')
var normals  = require('face-normals')
var Geometry = require('gl-geometry')
var Shader   = require('glslify')
var shader
var geom

var TerrainShader = Shader({
    vert: './shaders/terrain.vert'
  , frag: './shaders/tree.frag'
  , transform: ['glslify-hex']
})

module.exports = function(gl, x, y, z) {
  var model = mat4.create()
  var scale = Math.random() * 0.3 + 0.3

  mat4.translate(model, model, [x, y, z])
  mat4.scale(model, model, [scale, scale, scale])
  mat4.rotateY(model, model, Math.random() * Math.PI * 2)

  shader = shader || TerrainShader(gl)
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
    var pos = require('./models/tree2.obj')(false)
    var nor = normals(pos)

    return Geometry(gl)
      .attr('position', pos)
      .attr('normal', nor)
  }
}
