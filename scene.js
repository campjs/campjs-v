//
// Constants
//
var SCROLL_AMOUNT = 0.0015
var DAY_LENGTH    = 8000
var RETINA        = false
var CONTROLLABLE  = false
var FPS_MIN       = 52
var FPS_MAX       = 60
var FPS_GAP       = 120

//
// Dependencies
//
var canvas   = document.querySelector('#viewbox canvas')
var gl       = require('gl-context')(canvas, render)
var Camera   = require('canvas-orbit-camera')
var mouse    = require('mouse-position')()
var debounce = require('frame-debounce')
var triangle = require('a-big-triangle')
var mat4     = require('gl-matrix').mat4
var vec3     = require('gl-matrix').vec3
var quat     = require('gl-matrix').quat
var terrain  = require('./terrain')(gl)
var Texture  = require('gl-texture2d')
var water    = require('./water')(gl)
var fit      = require('canvas-fit')
var Shader   = require('glslify')
var FBO      = require('gl-fbo')
var clear    = require('gl-clear')({
  color: [0xE0/0xFF, 0xEC/0xFF, 0xEF/0xFF, 0]
})
//
// General Setup
//
var stats  = null
var camera = Camera(canvas, {
    rotate: CONTROLLABLE
  , scale: CONTROLLABLE
  , pan: CONTROLLABLE
})

camera.center[2] = 40
quat.rotateX(camera.rotation, camera.rotation, -0.05)

var scales = [1]
var ratio  = (RETINA && window.devicePixelRatio) || 1
if (ratio !== 1) scales.push(ratio)

var scaler = require('canvas-autoscale')(canvas, {
    parent: window
  , target: [FPS_MIN, FPS_MAX]
  , scales: scales
  , gap: FPS_GAP
}, render)

//
// Framebuffers
//
var ray = FBO(gl, [256, 256], { color: 1, depth: true })
var fbo = FBO(gl, [256, 256], { color: 1, depth: true })

//
// Assets: LUTs
//
var luts = {
    normal: lf(Texture(gl, require('./luts/normal')))
  , sunset: lf(Texture(gl, require('./luts/sunset')))
  , night: lf(Texture(gl, require('./luts/night')))
  , day: lf(Texture(gl, require('./luts/day')))
  , day2: lf(Texture(gl, require('./luts/day2')))
}

function lf(tex) {
  tex.minFilter = gl.LINEAR
  tex.magFilter = gl.LINEAR
  return tex
}

//
// Assets: Shaders
//
var post = Shader({
    frag: './shaders/postprocessing.frag'
  , vert: './shaders/triangle.vert'
  , transform: ['glslify-hex']
})(gl)

var rayShader = Shader({
    frag: './shaders/ray.frag'
  , vert: './shaders/triangle.vert'
  , transform: ['glslify-hex']
})(gl)

//
// General
//
var params = {
    lightThreshold: 0.5
  , lightDirectionX: 0.58
  , lightDirectionY: 0.5
  , lightDirectionZ: 0.76
  , lightDirection: new Float32Array(3)
  , sunX: 0.8
  , sunY: 0.58
  , lut1: 'day'
  , lut2: 'day'
  , lutT: 0
  , time: 0
  , proj: mat4.create()
  , view: mat4.create()
  , camera: camera
}

if (process.env.NODE_ENV !== 'production') {
  stats = (new (require('./stats')))
  stats.begin()
  document.body.appendChild(stats.domElement)
}

//
// Render Loop
//
function render() {
  if (!fbo) return
  if (stats) stats.update()

  //
  // Screen Size
  //
  var scale  = Math.max(1, scaler.scale * 2)
  var height = (canvas.height / scale)|0
  var width  = (canvas.width / scale)|0
  var screenWidth  = width * scale
  var screenHeight = height * scale

  //
  // Dynamic Parameters
  //
  var dayTime = Date.now() / DAY_LENGTH
  var sunpos = [
      params.sunX + Math.sin(dayTime) * 0.8
    , params.sunY + Math.cos(dayTime) * 0.6
  ]

  updateLUT(
      (Math.cos(dayTime) + 1) * 1.5
    , (dayTime + Math.PI) % (Math.PI * 4) > Math.PI * 2
  )

  params.time = Date.now() / 100000 % 1000
  params.screenSize = [width, height]
  params.lightDirection[0] = sunpos[0] * 0.3
  params.lightDirection[1] = sunpos[1] * 1.4 - 0.2
  params.lightDirection[2] = 1
  vec3.normalize(params.lightDirection, params.lightDirection)

  //
  // View/Projection matrices
  //
  camera.center[1] = window.scrollY * SCROLL_AMOUNT
  camera.view(params.view)
  camera.tick()

  mat4.perspective(params.proj
    , Math.PI / 4
    , canvas.width / canvas.height
    , 0.1
    , 10000
  )

  //
  // Draw the main scene
  //
  fbo.shape = [width, height]
  fbo.bind()

  gl.viewport(0, 0, width, height)
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)

  clear(gl)
  terrain(params)
  water(params)

  gl.disable(gl.DEPTH_TEST)
  gl.disable(gl.CULL_FACE)

  //
  // "Ray map" for godrays
  //
  ray.bind()
  ray.shape = [width, height]
  gl.viewport(0, 0, width, height)
  rayShader.bind()
  rayShader.uniforms.uScreenSize  = [width, height]
  rayShader.uniforms.uSunPosition = sunpos
  rayShader.uniforms.tScreen      = fbo.color[0].bind(0)
  triangle(gl)

  //
  // Post-processing
  //
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, screenWidth, screenHeight)

  post.bind()
  post.shape = [screenWidth, screenHeight]
  post.uniforms.tScreen      = fbo.color[0].bind(0)
  post.uniforms.tRays        = ray.color[0].bind(1)
  post.uniforms.tLUT1        = luts[params.lut1].bind(2)
  post.uniforms.tLUT2        = luts[params.lut2].bind(3)
  post.uniforms.uLUTT        = params.lutT
  post.uniforms.uTime        = params.time
  post.uniforms.uScreenSize  = [screenWidth, screenHeight]
  post.uniforms.uSunPosition = sunpos
  triangle(gl)
}

// Responsible for day/night cycle,
// which is entirely faked using color grading.
function updateLUT(t, n) {
  t = ((t+3) % 6)

  if (t < 2) {
    params.lut1 = n ? 'day' : 'day2'
    params.lut2 = 'sunset'
    params.lutT = Math.max(0, t - 1)
  } else
  if (t < 3) {
    params.lut1 = 'sunset'
    params.lut2 = 'night'
    params.lutT = t - 2
  } else
  if (t < 5) {
    params.lut1 = 'night'
    params.lut2 = 'sunset'
    params.lutT = Math.max(0, t - 4)
  } else
  if (t < 6) {
    params.lut1 = 'sunset'
    params.lut2 = n ? 'day' : 'day2'
    params.lutT = t - 5
  }
}

