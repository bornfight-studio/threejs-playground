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

        this.init();
        this.loadModel();
        this.addEnvironmentLight();
        this.addFloor();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
        this.camera.position.set(-0.75, 0.7, 1.25);

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.renderer.useLegacyLights = false;

        const environment = new RoomEnvironment(this.renderer);
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);

        this.scene.background = new THREE.Color(0xffffff);
        this.scene.environment = pmremGenerator.fromScene(environment).texture;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10;
        this.controls.target.set(0, 0.35, 0);
        this.controls.update();

        window.addEventListener("resize", () => this.onWindowResize());
    }

    loadModel() {
        const loader = new GLTFLoader();

        loader.setPath(this.modelPath);
        loader.load(this.modelName, (gltf) => {
            const model = gltf.scene;

            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            this.scene.add(model);

            const object = gltf.scene.getObjectByName("SheenChair_fabric");

            console.log(object.material);

            const gui = new GUI();

            gui.add(object.material, "sheen", 0, 1);
            gui.open();
        });

        this.animate();
    }

    addEnvironmentLight() {
        const light = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(light);
    }

    addFloor() {
        const geometry = new THREE.PlaneGeometry(10, 10);
        const material = new THREE.MeshBasicMaterial({ color: 0x808080 });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.render();
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
