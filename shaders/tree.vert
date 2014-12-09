precision mediump float;

uniform mat4 uProjection;
uniform mat4 uModel;
uniform mat4 uView;

attribute vec3 position;
attribute vec3 normal;

varying vec3 aNormal;

void main() {
  aNormal = (
      uModel
    * vec4(normal, 1.0)
  ).xyz;

  gl_Position = (
      uProjection
    * uView
    * uModel
    * vec4(position, 1.0)
  );
}
