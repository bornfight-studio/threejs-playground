import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export default class FurnitureConfigurator {
    constructor(container, modelPath, modelName) {
        this.container = document.querySelector(container);
        this.modelPath = modelPath;
        this.modelName = modelName;
        this.scene = new THREE.Scene();
        this.camera = this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });

        if (this.container === null) {
            return;
        }

        this.loadModel();
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
        this.camera.position.set(-0.75, 0.7, 1.25);

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.renderer.useLegacyLights = false;

        const environment = new RoomEnvironment(this.renderer);
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);

        this.scene.background = new THREE.Color(0xbbbbbb);
        this.scene.environment = pmremGenerator.fromScene(environment).texture;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10;
        this.controls.target.set(0, 0.35, 0);
        this.controls.update();

        window.addEventListener("resize", this.onWindowResize);
    }

    loadModel() {
        const loader = new GLTFLoader();

        loader.setPath(this.modelPath);
        loader.load(this.modelName, (gltf) => {
            this.scene.add(gltf.scene);

            const object = gltf.scene.getObjectByName("SheenChair_fabric");
            console.log(object.material.sheen);

            const gui = new GUI();

            gui.add(object.material, "sheenRoughness", 0, 1);
            gui.open();
        });

        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
