varying float vFragIntensity;

vec3 colorA = vec3(0.231,0.509,0.878);
/* vec3 colorB = vec3(0.0313,0.0823,0.1607); */
vec3 colorB = vec3(1.0,0.0,0.0);


void main () {
    float alpha = 1.0;

    vec3 final = mix(colorA, colorB, vFragIntensity);

    /* make round points */
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    gl_FragColor = vec4(final, alpha);
}