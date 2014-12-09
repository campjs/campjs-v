precision mediump float;

uniform mat4 uProjection;
uniform mat4 uModel;
uniform mat4 uView;

attribute vec3 position;
attribute vec3 normal;

varying vec3 aNormal;
varying vec3 aPosition;

void main() {
  aPosition = position;
  aNormal = normal;
  gl_Position = (
      uProjection
    * uView
    * uModel
    * vec4(position, 1.0)
  );
}
