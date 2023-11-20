attribute float index;

uniform float uModifier;
uniform float uSineModify;
uniform float uYStrech;
uniform float uTime;
uniform float uFrustum;

varying float vIndex;
varying float vTime;
varying vec3 vPos;

void main () {
    vIndex = index;
    vTime = uTime;
    float time = uTime * 2.0;

    vec3 pos = position;

    float xzModifier = uSineModify;

    pos.z += sin(time + (sin(pos.y * uModifier) * xzModifier) + (sin(pos.x * uModifier) * xzModifier)) * 0.05;
    pos.z *= 1.0 + tan(uYStrech);


    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vPos = worldPosition.xyz;

    /* big white dots size */
    if (index == 110.0 || index == 220.0 || index == 300.0) {
        gl_PointSize = (15.0 + abs(sin(uTime)) * 5.0) / (abs(uFrustum) / 2.0);
    }
    /* default dots size */
    else {
        gl_PointSize = 8.0 / (abs(uFrustum) / 1.0);
    }
}