import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export default class FurnitureConfigurator {
    constructor() {
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.controls = null;

        this.init();
        this.animate();

        this.configurator = document.querySelector(".js-furniture-configurator");
    }

    /**
     * Init
     */
    init() {
        if (this.configurator !== null) {
            console.log(this.configurator);

            const container = document.createElement("div");
            document.body.appendChild(container);

            this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20);
            this.camera.position.set(-0.75, 0.7, 1.25);

            this.scene = new THREE.Scene();

            // model

            new GLTFLoader().setPath("../static/models/").load("SheenChair.glb", (gltf) => {
                this.scene.add(gltf.scene);

                const object = gltf.scene.getObjectByName("SheenChair_fabric");

                const gui = new GUI();

                gui.add(object.material, "sheen", 0, 1);
                gui.open();
            });

            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1;
            this.renderer.useLegacyLights = false;
            container.appendChild(this.renderer.domElement);

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
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    animate() {
        requestAnimationFrame(() => this.animate());

        this.controls.update(); // required if damping enabled

        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
