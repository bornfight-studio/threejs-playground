import * as THREE from "three";

export default class Orb {
    constructor(scene, radius, widthSegments, heightSegments, color) {
        this.DOM = {
            container: ".js-orb",
        };

        this.container = document.querySelector(this.DOM.container);

        this.scene = scene;
        this.radius = radius;
        this.widthSegments = widthSegments;
        this.heightSegments = heightSegments;
        this.color = color;

        this.geometry = new THREE.BufferGeometry();
        this.material = new THREE.MeshBasicMaterial({ color: this.color });

        this.particles = [];

        this.mesh = new THREE.Mesh(this.geometry, this.material);

        this.createParticles();

        // Create a Three.js scene
        this.scene = new THREE.Scene();

        // Create a camera and renderer
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // Create a particle sphere
        this.orb = new Orb(scene, 5, 10, 10, 0xff0000);

        // Add the particle sphere mesh to the scene
        this.scene.add(orb.mesh);

        this.animate();
    }

    createParticles() {
        const numParticles = (this.widthSegments + 1) * (this.heightSegments + 1);
        const positions = new Float32Array(numParticles * 3);

        let index = 0;
        for (let i = 0; i <= this.widthSegments; i++) {
            const phi = (i / this.widthSegments) * Math.PI;

            for (let j = 0; j <= this.heightSegments; j++) {
                const theta = (j / this.heightSegments) * 2 * Math.PI;

                const x = this.radius * Math.sin(phi) * Math.cos(theta);
                const y = this.radius * Math.cos(phi);
                const z = this.radius * Math.sin(phi) * Math.sin(theta);

                positions[index++] = x;
                positions[index++] = y;
                positions[index++] = z;
            }
        }

        this.geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    }

    update() {
        // No need to update vertices in BufferGeometry
    }

    animate() {
        requestAnimationFrame(this.animate);

        // Rotate the particle sphere
        this.orb.mesh.rotation.x += 0.01;
        this.orb.mesh.rotation.y += 0.01;

        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
}
