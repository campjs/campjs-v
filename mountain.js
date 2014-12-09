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

module.exports = function(gl) {
  var model = mat4.create()
  var scale = 4.5

  mat4.translate(model, model, [-50, -5, -30])
  mat4.scale(model, model, [scale, scale, scale])
  mat4.rotateY(model, model, 0.1)

  shader = shader || TerrainShader(gl)
  geom = geom || createGeom()

  render.prerender = prerender
  render.postrender = postrender
  return render

  function render(params) {
    prerender(params)
    shader.uniforms.uModel = model
    geom.draw()
    postrender(params)
  }

  function prerender(params) {
    geom.bind(shader)
    shader.uniforms.uLightDirection = params.lightDirection
    shader.uniforms.uLightThreshold = params.lightThreshold
    shader.uniforms.uProjection = params.proj
    shader.uniforms.uView = params.view
  }

  function postrender(params) {
    geom.unbind()
  }

  function createGeom() {
    var pos = require('./models/mountain.obj')(false)
    var nor = normals(pos)

    return Geometry(gl)
      .attr('position', pos)
      .attr('normal', nor)
  }
}
