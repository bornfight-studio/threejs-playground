import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
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
        this.addFloor();
        this.addGrid();
        this.addEnvironmentLight();
        this.addLights();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
        this.camera.position.set(-0.75, 0.7, 1.25);
        this.camera.rotation.x = -Math.PI / 2;

        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.renderer.useLegacyLights = false;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        THREE.ColorManagement.enabled = true;

        const environment = new RoomEnvironment(this.renderer);
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);

        this.scene.background = new THREE.Color(0x808080);
        this.scene.environment = pmremGenerator.fromScene(environment).texture;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.minDistance = 0.5;
        this.controls.maxDistance = 5;
        this.controls.target.set(0, 0.35, 0);
        this.controls.update();

        window.addEventListener("resize", () => this.onWindowResize());
    }

    loadModel() {
        // const dracoLoader = new DRACOLoader();
        // dracoLoader.setDecoderPath("../static/js/vendors/draco/");
        const loader = new GLTFLoader();

        // loader.setDRACOLoader(dracoLoader);

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

            const params = {
                sheenColor: "#53745c",
            };

            const gui = new GUI();

            object.material.sheen = 0.447;
            object.material.metalness = 0.275;
            object.material.sheenColor.set(params.color);

            gui.add(object.material, "sheen", 0, 1);
            gui.add(object.material, "metalness", 0, 1);
            gui.addColor(params, "sheenColor").onChange(() => {
                object.material.sheenColor.set(params.sheenColor);
            });

            gui.open();
        });

        this.animate();
    }

    addEnvironmentLight() {
        const light = new THREE.AmbientLight(0x808080, 15);
        this.scene.add(light);
    }

    addFloor() {
        const geometry = new THREE.PlaneGeometry(10, 10);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    addLights() {
        const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
        directionalLight.position.set(1, 1, 1);
        const helper = new THREE.DirectionalLightHelper(directionalLight, 1);
        this.scene.add(helper);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xffffff, 0.3);
        pointLight.position.set(-5, 5, 5);
        pointLight.castShadow = true;
        this.scene.add(pointLight);
    }

    addGrid() {
        const size = 2;
        const divisions = 10;

        const gridHelper = new THREE.GridHelper(size, divisions);
        this.scene.add(gridHelper);
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
