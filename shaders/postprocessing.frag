precision mediump float;

uniform sampler2D tScreen;
uniform sampler2D tRays;
uniform sampler2D tLUT1;
uniform sampler2D tLUT2;
uniform float uLUTT;
uniform float uTime;
uniform vec2 uScreenSize;
uniform vec2 uSunPosition;
uniform vec2 uMousePos;
varying vec2 vpos;

#define BLUE #E0ECEF
#define GOD_SAMPLES 30.0
#define GOD_DENSITY 0.005
#define GOD_WEIGHT 0.05
#define GOD_DECAY 0.98
#define NOISE_AMOUNT 0.05

#pragma glslify: square = require(glsl-square-frame)
#pragma glslify: noise  = require(glsl-random)
#pragma glslify: tex3d  = require(./tex3d)

float vignette(vec3 texel, vec2 uv) {
  return max(0.0, dot(uv, uv));
}

void main() {
  // vec2 vPos    = floor(vpos / 0.002) * 0.002;
  vec4 color   = texture2D(tScreen, vpos);
  vec4 rays    = texture2D(tRays, vpos);
  vec4 rayOrig = rays.xyzw;

  // God Rays!
  vec2 gcoord = gl_FragCoord.xy / uScreenSize;
  vec2 sunPos = uSunPosition;
  vec2 pixPos = square(uScreenSize);
  vec2 gdelta = (
    pixPos - sunPos
  ) * GOD_DENSITY;

  float gdecay = 1.0;

  for (int i = 0; i < int(GOD_SAMPLES); i++) {
    gcoord -= gdelta;

    vec3 gsample = texture2D(tRays, gcoord).xyz;

    gsample *= gdecay * GOD_WEIGHT;
    rays.rgb += gsample;
    gdecay *= GOD_DECAY;
  }

  color.rgb = mix(color.rgb, vec3(1.0), rays.rgb);

  // Color Grading <3
  // No idea why it's being quirky like this. Oh well!
  color.rgb = clamp(color.rgb, vec3(0.0), vec3(1.0));
  color.g = 1.0 - color.g;
  color.rgb = mix(
      tex3d(tLUT1, color.brg, 33.0).rgb
    , tex3d(tLUT2, color.brg, 33.0).rgb
    , uLUTT
  );

  // Noise :D
  color.rgb += (noise(
    gl_FragCoord.xy + fract(uTime * 100.2352)
  ) - 0.5) * NOISE_AMOUNT;

  float vamt = vignette(color.rgb, square(uScreenSize) * 0.34);

  color.rgb = mix(color.rgb, color.rgb - 0.3, vamt);

  gl_FragColor.rgb = color.rgb;
  gl_FragColor.a = 1.0;
}
