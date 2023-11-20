attribute float index;

uniform float uFrustum;
uniform float uTime;
uniform float uSpeed;
uniform float uFrequency;
uniform float uHeight;
uniform vec2 uAnchor;

varying float vFragIntensity;

void main () {
    vec3 pos = position;
    vec2 center = uAnchor;

    float time = uTime * uSpeed;
    float freq = uFrequency;
    float height = uHeight;

    float pX = pos.x - (0.5 - center.x);
    float pY = pos.y - (0.5 - center.y);

    float r = -((pX * pX) + (pY * pY));

    float ripple = (sin((freq * (r + time))) * height) - height;

    pos.z += ripple;

    float normalizedH = height * 10.0;
    vFragIntensity = sin((freq * (r + time))) * clamp(normalizedH, 0.2, 1.0);

    vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    

    gl_PointSize = 8.0 / (abs(uFrustum) / 1.2);
}