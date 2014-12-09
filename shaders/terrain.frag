precision mediump float;

#pragma glslify: fog   = require(./fog)
#pragma glslify: range = require(glsl-range)

#define GREEN_LIGHT     #c3dc8b
#define GREEN_DARK      #a5c16e
#define BLUE            #E0ECEF
#define FOG_ENABLED

uniform float uLightThreshold;
uniform vec3  uLightDirection;
uniform sampler2D tOverlay;

varying vec3 aNormal;
varying vec3 aPosition;

void main() {
  float overlay = texture2D(tOverlay, fract(aPosition.xz * 0.08)).r;
  float luminosity = clamp(dot(
      normalize(aNormal)
    , uLightDirection
  ), 0.0, 1.0);

  // vec3 colorHard = luminosity > uLightThreshold
  //   ? GREEN_LIGHT
  //   : GREEN_DARK;

  vec3 colorHard = mix(
      GREEN_DARK
    , GREEN_LIGHT
    , clamp(range(0.45, 0.55, luminosity), 0.0, 1.0)
  );

  vec3 colorSoft = mix(GREEN_LIGHT, GREEN_DARK, pow(luminosity, 2.0));
  vec3 color = mix(colorHard, colorSoft, 0.5);

  // color = mix(color, color * 1.2, overlay.r);
  color = overlay > 0.5
    ? mix(color, color * 1.045, 2.0 * (overlay - 0.5))
    : mix(color, color * 0.975, 2.0 * (overlay));

  color = mix(color, BLUE, clamp(fog(), 0.0, 1.0));

  gl_FragColor = vec4(color, 1.0);
}
