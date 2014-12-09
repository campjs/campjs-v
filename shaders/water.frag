precision mediump float;

#pragma glslify: fog = require(./fog)
#define BLUE #E0ECEF
#define WATER_2 #94cef5
#define WATER_1 #41c9ff

uniform sampler2D tWaves;
uniform float uLightThreshold;
uniform vec3  uLightDirection;
uniform vec2  uScreenSize;
uniform float uTime;

varying vec3 aPosition;

void main() {
  float f = clamp(
    1.5 * gl_FragCoord.y / uScreenSize.y - 0.4
  , 0.0, 1.0);

  vec3 color = mix(WATER_1, WATER_2, f);
  vec2 coord = vec2(aPosition.xz * 0.3);

  coord.x += sin(aPosition.z * 0.5 + uTime * 12.0) * 0.5;

  color = mix(color, vec3(1.0), texture2D(tWaves, fract(coord)).r * 0.2);
  color = mix(color, BLUE, fog());

  gl_FragColor = vec4(color, 1.0);
}
