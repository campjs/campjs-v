var perlin    = require('perlin').noise.perlin2
var heightmap = require('heightmap-mesher')
var pack      = require('array-pack-2d')
var unindex   = require('unindex-mesh')
var reindex   = require('mesh-reindex')
var normals   = require('face-normals')
var Geometry  = require('gl-geometry')
var mat4      = require('gl-matrix').mat4
var fill      = require('ndarray-fill')
var Texture   = require('gl-texture2d')
var ndarray   = require('ndarray')
var Shader    = require('glslify')
var Tree      = require('./tree')
var zeros     = require('zeros')

var RockShader = Shader({
    vert: './shaders/terrain.vert'
  , frag: './shaders/rock.frag'
  , transform: ['glslify-hex']
})

var TentShader = Shader({
    vert: './shaders/tent.vert'
  , frag: './shaders/tent.frag'
  , transform: ['glslify-hex']
})

var RockFactory = require('./rock')
var Rock = RockFactory(require('./models/stone2.obj')(false), RockShader)
var Tent = RockFactory(require('./models/tent.obj')(true, [1, 0, 0]), TentShader)

module.exports = createTerrain

var AMPLITUDE     = 1
var TREE_DENSITY  = 0.22
var ROCK_DENSITY  = 0.035
var TENT_DENSITY  = 0.009
var SCALE = 140
var SIZE  = 64
var HALF_SIZE = SIZE / 2

var identity = mat4.create()
var TerrainShader = Shader({
    vert: './shaders/terrain.vert'
  , frag: './shaders/terrain.frag'
  , transform: ['glslify-hex']
})

function createTerrain(gl) {
  var shader = TerrainShader(gl)
  var trees = []
  var rocks = []
  var tents = []
  var mesh = createMesh()
  var geom = Geometry(gl)
    .attr('position', mesh.positions)
    .attr('normal', mesh.normals)

  var texture = Texture(gl, require('./textures/grass'))

  texture.minFilter = gl.LINEAR
  texture.magFilter = gl.LINEAR

  shader.bind()
  shader.attributes.position.location = 0
  shader.attributes.normal.location = 1

  var scaler = 2 + 7 / HALF_SIZE
  var w = mesh.map.shape[0]
  var h = mesh.map.shape[1]
  for (var x = 0; x < w; x++)
  for (var y = 0; y < h; y++) {
    var X = (x - HALF_SIZE + 0.5) * scaler
    var Y = (y - HALF_SIZE + 0.5) * scaler
    var Z = mesh.height(x, y) - 0.1
    var r = Math.random()

    if (Z < -2 && x > w/2) continue
    if (r < TREE_DENSITY) {
      trees.push(Tree(gl, X, Z, Y))
      continue
    }

    r -= TREE_DENSITY
    if (r < ROCK_DENSITY) {
      rocks.push(Rock(gl, X, Z, Y))
      continue
    }

    r -= ROCK_DENSITY
    if (r < TENT_DENSITY) {
      tents.push(Tent(gl, X, Z, Y))
      continue
    }
  }

  return render

  function render(params) {
    trees[0].prerender(params)
    for (var i = 0; i < trees.length; i++) trees[i](params)
    trees[0].postrender(params)

    rocks[0].prerender(params)
    for (var i = 0; i < rocks.length; i++) rocks[i](params)
    rocks[0].postrender(params)

    tents[0].prerender(params)
    for (var i = 0; i < tents.length; i++) tents[i](params)
    tents[0].postrender(params)

    geom.bind(shader)

    shader.uniforms.tOverlay = texture.bind(0)
    shader.uniforms.uLightDirection = params.lightDirection
    shader.uniforms.uLightThreshold = params.lightThreshold
    shader.uniforms.uProjection = params.proj
    shader.uniforms.uView = params.view
    shader.uniforms.uModel = identity

    geom.draw(gl.TRIANGLES)
    // geom.unbind()
  }
}

function createMesh() {
  var map = fill(zeros([SIZE, SIZE]), function(x, y) {
    x -= HALF_SIZE; y -= HALF_SIZE
    x /= SIZE;      y /= SIZE

    var h = 0

    h += (perlin(
        x * 3.1 + 293.94288
      , y * 3.1 + 12.238383
    ) + 1) * 0.075

    h += (perlin(
        x * 125.5 + 293.94288
      , y * 125.5 + 12.238383
    ) + 1) * 0.006125

    h *= AMPLITUDE

    return h > 0 ? h : 0
  })

  var pos = heightmap(map)
  var lowest = 0
  var ax = 0
  var ay = 0
  var az = 0
  var l = 1 / (pos.length / 3)
  for (var i = 0; i < pos.length;) {
    var x = pos[i] = (pos[i++] - 0.5) * SCALE
    var y = pos[i] = (pos[i++] - 0.5) * SCALE
    var z = pos[i] = (pos[i++] - 0.5) * SCALE
    ax += x * l; ay += y * l; az += z * l
  }

  for (var i = 0; i < pos.length;) {
    pos[i++] -= ax
    pos[i++] -= ay
    pos[i++] -= az
  }

  return {
    positions: pos
    , normals: normals(pos)
    , toWorld: toWorld
    , height: getHeight
    , map: map
  }

  function toWorld(p) {
    p[0] = (x - 0.5) * SCALE - ax
    p[1] = (y - 0.5) * SCALE - ay
    p[2] = (z - 0.5) * SCALE - az
  }

  function getHeight(x, z) {
    return (map.get(x, z) - 0.5) * SCALE - ay
  }
}
