precision mediump float;

#pragma glslify: fog   = require(./fog)
#pragma glslify: range = require(glsl-range)

#define GREEN_LIGHT     #8aaa58
#define GREEN_DARK      #74884d
#define BLUE            #E0ECEF

uniform float uLightThreshold;
uniform vec3  uLightDirection;
uniform mat4  uModel;

varying vec3 aNormal;

void main() {
  float luminosity = clamp(dot(
      normalize(aNormal)
    , uLightDirection
  ), 0.0, 1.0);

  // vec3 color = luminosity > uLightThreshold
  //   ? GREEN_LIGHT
  //   : GREEN_DARK;

  vec3 colorSoft = mix(GREEN_LIGHT, GREEN_DARK, pow(luminosity, 0.5));
  vec3 color = mix(
      GREEN_DARK
    , GREEN_LIGHT
    , clamp(range(0.45, 0.55, luminosity), 0.0, 1.0)
  );

  color = mix(color, colorSoft, 0.1);
  color = mix(color, BLUE, clamp(fog(), 0.0, 1.0));

  gl_FragColor = vec4(color, 1.0);
}
