varying float vTime;
varying float vIndex;
varying vec3 vPos;

uniform float uCamZ;
uniform float uNear;
uniform float uFar;

vec3 colorA = vec3(0.231,0.509,0.878);
vec3 colorB = vec3(0.168,0.823,0.905);


void main () {
    float cameraZ = uCamZ;
    float zDistance = abs(vPos.z - cameraZ);

    float nearPlane = uNear;
    float farPlane = uFar;

    float alpha = 1.0 - clamp((zDistance - nearPlane) / (farPlane - nearPlane), 0.0, 1.0);

    float pct = abs(sin(vTime));
    vec3 final = mix(colorA, colorB, pct);

    /* setup white dots */
    if (vIndex == 110.0 || vIndex == 220.0 || vIndex == 300.0) {
        final = vec3(1.0, 1.0, 1.0);
    }
    else if (vIndex == 0.0) {
        alpha = 0.0;
    }

    /* make round points */
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    gl_FragColor = vec4(final, alpha);
}