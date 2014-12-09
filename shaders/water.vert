precision mediump float;

uniform mat4 uProjection;
uniform mat4 uModel;
uniform mat4 uView;
uniform float uTime;

attribute vec3 position;
attribute vec3 normal;

varying vec3 aPosition;

void main() {
  float el = sin(uTime * 250.0 + position.z * 600.0) * 0.02;
  vec3 pos = position + vec3(0.0, el, 0.0);
  aPosition = pos;
  gl_Position = (
      uProjection
    * uView
    * uModel
    * vec4(pos, 1.0)
  );
}
