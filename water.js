module.exports = createTerrain

var Shader   = require('glslify')
var grid     = require('grid-mesh')
var Geometry = require('gl-geometry')
var unindex  = require('unindex-mesh')
var mat4     = require('gl-matrix').mat4
var normals  = require('face-normals')
var Texture  = require('gl-texture2d')

var model = mat4.create()
var TerrainShader = Shader({
    vert: './shaders/water.vert'
  , frag: './shaders/water.frag'
  , transform: ['glslify-hex']
})

mat4.scale(model, model, [5, 5, 5])

function createTerrain(gl) {
  var texture = Texture(gl, require('./textures/water'))
  var shader = TerrainShader(gl)
  var mesh = createMesh()
  var geom = Geometry(gl)
    .attr('position', mesh.positions)
    .attr('normal', mesh.normals)

  shader.bind()
  shader.attributes.position.location = 0
  shader.attributes.normal.location = 1
  shader.uniforms.tWaves = texture.bind(0)

  return render

  function render(params) {
    geom.bind(shader)

    texture.bind(0)
    shader.uniforms.uLightDirection = params.lightDirection
    shader.uniforms.uLightThreshold = params.lightThreshold
    shader.uniforms.uScreenSize = params.screenSize
    shader.uniforms.uProjection = params.proj
    shader.uniforms.uView = params.view
    shader.uniforms.uTime = params.time
    shader.uniforms.uModel = model

    geom.draw(gl.TRIANGLES)
    // geom.unbind()
  }
}

function createMesh() {
  var size = 30
  var hsize = size / 2
  var pos = grid(hsize, size, [0, 0, 0])

  for (var i = 0; i < pos.positions.length; i++) {
    var p = pos.positions[i]
    // p[0] -= hsize
    p[2] = p[1] - hsize
    p[1] = -0.5
  }

  for (var i = 0; i < pos.cells.length; i++) {
    var C = pos.cells[i]
    var a = C[0]
    var b = C[1]
    var c = C[2]
    C[0] = b
    C[1] = a
    C[2] = c
  }

  pos = unindex(pos)

  return {
    positions: pos
    , normals: normals(pos)
  }
}
