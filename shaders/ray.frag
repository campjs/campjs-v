precision mediump float;

uniform sampler2D tScreen;
uniform vec2 uScreenSize;
uniform vec2 uSunPosition;
varying vec2 vpos;

#pragma glslify: square = require(glsl-square-frame)
#define SUN_COLOR vec3(1.0, 0.6, 0.0)

void main() {
  vec2 sunPos = uSunPosition;
  vec2 pixPos = square(uScreenSize);
  vec2 delPos = abs(sunPos - pixPos);

  float alpha = texture2D(tScreen, vpos).a;

  gl_FragColor.rgb = vec3(1.0) * 1.0 - alpha;
  gl_FragColor.rgb *= length(delPos.xy) < 0.3
    ? SUN_COLOR
    : vec3(0.0);

  gl_FragColor.a = 1.0;
}
