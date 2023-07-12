import * as THREE from "three";
import gsap from "gsap";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export default class TextureViewer {
    constructor() {
        this.DOM = {
            modelContainer: ".js-texture-viewer",
        };

        this.container = document.querySelector(this.DOM.modelContainer);
        this.modelPath = "../static/models/sofa_chair-v1.glb";
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.loader = new GLTFLoader();

        this.textures = ["path/to/texture1.jpg", "path/to/texture2.jpg", "path/to/texture3.jpg", "path/to/texture4.jpg", "path/to/texture5.jpg"];
        this.currentTextureIndex = 0;

        this.initialize();
        this.loadModel();
        this.createRadioButtons();
        this.addEnvironmentLight();
        this.addLights();
        this.addGrid();
        this.addFloor();
    }

    initialize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.camera.position.z = 5;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const spotLight1 = new THREE.SpotLight(0xffffff, 0.8);
        spotLight1.position.set(5, 5, 5);
        this.scene.add(spotLight1);

        const spotLight2 = new THREE.SpotLight(0xffffff, 0.8);
        spotLight2.position.set(-5, -5, -5);
        this.scene.add(spotLight2);

        this.renderer.shadowMap.enabled = true;
        spotLight1.castShadow = true;
        spotLight2.castShadow = true;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 0);
        this.controls.update();

        window.addEventListener("resize", this.onWindowResize.bind(this), false);
    }

    createRadioButtons() {
        const radioContainer = document.createElement("div");
        for (let i = 0; i < this.textures.length; i++) {
            const radioButton = document.createElement("input");
            radioButton.type = "radio";
            radioButton.name = "texture";
            radioButton.value = i;
            radioButton.checked = i === this.currentTextureIndex;
            radioButton.addEventListener("change", (event) => {
                this.currentTextureIndex = parseInt(event.target.value);
                this.updateTexture();
            });

            radioContainer.appendChild(radioButton);
        }

        this.container.appendChild(radioContainer);
    }

    updateTexture() {
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(this.textures[this.currentTextureIndex]);

        this.sofa.traverse((child) => {
            if (child.isMesh) {
                child.material.map = texture;
            }
        });
    }

    loadModel() {
        const textureLoader = new THREE.TextureLoader();

        this.loader.load(this.modelPath, (gltf) => {
            this.sofa = gltf.scene;
            this.scene.add(this.sofa);

            // Apply textures
            const texture = textureLoader.load(this.textures[this.currentTextureIndex]);

            this.sofa.traverse((child) => {
                if (child.isMesh) {
                    child.material.map = texture;
                    child.material.aoMap = textureLoader.load("path/to/occlusionMap.jpg");
                    child.material.normalMap = textureLoader.load("path/to/heightMap.jpg");
                    child.material.envMap = textureLoader.load("path/to/environmentMap.jpg");
                    child.material.envMapIntensity = 1;
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        });
    }

    addEnvironmentLight() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
    }

    addLights() {
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.3);
        pointLight.position.set(-5, 5, 5);
        pointLight.castShadow = true;
        this.scene.add(pointLight);
    }

    addGrid() {
        const size = 10;
        const divisions = 10;

        const gridHelper = new THREE.GridHelper(size, divisions);
        this.scene.add(gridHelper);
    }

    addFloor() {
        const geometry = new THREE.PlaneGeometry(10, 10);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Add any animation or object manipulation logic here

        this.renderer.render(this.scene, this.camera);
    }
}
