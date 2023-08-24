import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

import materialData from "../../materialData.json";

export default class FurnitureConfigurator {
    constructor() {
        this.DOM = {
            modelContainer: ".js-furniture-configurator",
            option: ".js-furniture-configurator-option",
            states: {
                isActive: "is-active",
            },
        };

        this.modelContainer = document.querySelector(this.DOM.modelContainer);
        this.options = document.querySelectorAll(this.DOM.option);
    }

    init() {
        if (this.modelContainer !== null) {
            console.log("GLTFModelController init()");

            this.width = window.innerWidth;
            this.height = window.innerHeight;

            THREE.Cache.enabled = true;

            this.texture = new THREE.TextureLoader();

            //environment
            this.environment = false;

            //lights
            this.lightHelpers = false;

            //objects
            this.modelObjects = JSON.parse(this.modelContainer.dataset.modelObjects);

            //env
            this.whiteEnv = this.modelContainer.dataset.envWhite === "true";
            this.modelEnvUrl = this.modelContainer.dataset.env;

            //gui
            this.gui = new GUI();

            this.gui.name = "Scene option";
            this.gui.close();
            this.gui.$title.innerText = "Options";

            // gui config
            this.guiConf = {
                Rotate: false,
                Grid: true,
            };

            this.initModel();
            this.addLights();
            this.addEnvironmentLight();
            // this.addFloor();
            this.animate();
        }
    }

    initModel() {
        // camera
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 2, 120);
        this.camera.position.set(-15, 10, -15);

        // scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xbbbbbb);

        // ground grid
        // const grid = new THREE.GridHelper(120, 40, 0x000000, 0x000000);
        // grid.material.opacity = 0.2;
        // grid.material.transparent = true;
        // this.scene.add(grid);
        // if (!this.guiConf.Grid) {
        //     grid.visible = false;
        // }

        // add gui for grid
        // this.gui.add(this.guiConf, "Grid").onChange((value) => {
        // grid.visible = !!value;
        // });

        // renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
            stencil: false,
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.gammaFactor = 5;
        this.renderer.outputColorSpace = "srgb-linear";
        this.renderer.useLegacyLights = false;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.modelContainer.appendChild(this.renderer.domElement);

        if (this.environment) {
            const environment = new RoomEnvironment();
            this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
            this.scene.environment = this.pmremGenerator.fromScene(environment).texture;
        }

        // loader
        this.loadModel();

        // orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1, 0);
        this.controls.Rotate = this.guiConf.Rotate;
        this.controls.autoRotateSpeed = 1;
        this.controls.enableDamping = true;
        this.controls.minDistance = 8;
        this.controls.maxDistance = 16;
        this.controls.maxPolarAngle = Math.PI / 2.2;
        this.controls.minPolarAngle = 0.7;
        this.controls.maxAzimuthAngle = -1.2;
        this.controls.minAzimuthAngle = 3.2;
        this.controls.update();

        this.gui.add(this.guiConf, "Rotate").onChange((value) => {
            this.controls.autoRotate = value !== false;
        });

        // handle resize
        window.addEventListener("resize", () => this.onWindowResize(), false);
    }

    loadModel() {
        let materials = {};

        const materialScale = this.modelContainer.dataset.materialScale;

        for (let material in materialData) {
            const materialObject = materialData[material];

            materials[material] = {};
            const materialMapObject = materialData[material];

            for (let materialMap in materialObject) {
                materials[material][materialMap] = this.texture.load(materialMapObject[materialMap]);
            }
        }

        let material = new THREE.MeshPhysicalMaterial({
            map: materials.mat1.base,
            aoMap: materials.mat1.ao,
            aoMapIntensity: 0,
            displacementMap: materials.mat1.height,
            displacementScale: 0,
            roughnessMap: materials.mat1.rough,
            metalness: 0.15,
            clearcoat: 0,
            flatShading: false,
        });

        material.map.minFilter = THREE.NearestFilter;
        material.map.generateMipmaps = true;
        material.map.wrapT = THREE.RepeatWrapping;
        material.map.wrapS = THREE.RepeatWrapping;
        material.aoMap.wrapT = THREE.RepeatWrapping;
        material.aoMap.wrapS = THREE.RepeatWrapping;
        material.displacementMap.wrapT = THREE.RepeatWrapping;
        material.displacementMap.wrapS = THREE.RepeatWrapping;
        material.roughnessMap.wrapT = THREE.RepeatWrapping;
        material.roughnessMap.wrapS = THREE.RepeatWrapping;

        material.map.repeat.set(materialScale, materialScale);
        material.aoMap.repeat.set(materialScale, materialScale);
        material.displacementMap.repeat.set(materialScale, materialScale);
        material.roughnessMap.repeat.set(materialScale, materialScale);

        // get model
        let model = this.modelContainer.getAttribute("data-model-source");

        // loader
        const loader = new GLTFLoader();

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("../static/js/vendors/draco/");
        loader.setDRACOLoader(dracoLoader);

        loader.load(model, (model) => {
            model.scene.position.x = 0;
            model.scene.position.y = 0.5;
            material.color.convertSRGBToLinear();

            const objects = [];

            this.modelObjects.forEach((modelObject) => {
                objects.push(model.scene.getObjectByName(modelObject));
            });

            // reversi specific

            if (model.scene.getObjectByName("pillow_left")) {
                model.scene.getObjectByName("pillow_left").castShadow = true;
                model.scene.getObjectByName("pillow_left").recieveShadow = true;
            }

            if (model.scene.getObjectByName("pillow_center")) {
                model.scene.getObjectByName("pillow_center").castShadow = true;
                model.scene.getObjectByName("pillow_center").recieveShadow = true;
            }

            if (model.scene.getObjectByName("pillow_right")) {
                model.scene.getObjectByName("pillow_right").castShadow = true;
                model.scene.getObjectByName("pillow_right").recieveShadow = true;
            }

            objects.forEach((object) => {
                object.castShadow = true;
                object.receiveShadow = true;
                object.material.color.convertSRGBToLinear();

                // initial material setup
                object.material = material;

                if (!this.whiteEnv) {
                    object.material.metalness = 0.65;
                }
            });

            this.scene.add(model.scene);

            const setActiveClass = (items, ev) => {
                const clickedItem = ev.target;
                const listItems = items;

                listItems.forEach((item) => {
                    if (item === clickedItem) {
                        item.classList.add(this.DOM.states.isActive);
                    } else {
                        item.classList.remove(this.DOM.states.isActive);
                    }
                });
            };

            this.options.forEach((option, index) => {
                const additionalScale = parseFloat(option.dataset.additionalScale) || 1;

                option.addEventListener("click", (ev) => {
                    setActiveClass(this.options, ev);
                    this.transformMaterial(index + 1, material, materials, materialScale, additionalScale);
                });
            });
        });

        this.loadEnv(loader);
    }

    loadEnv(loader) {
        loader.load(this.modelEnvUrl, (model) => {
            model.scene.scale.set(10, 10, 10);
            model.scene.position.set(-11.5, 5, -5);
            console.log(model.scene);
            model.scene.children[0].children.forEach((object) => {
                if (object.isMesh) {
                    if (object.name === "room" || object.name === "ground" || object.name === "carpet") {
                        object.receiveShadow = true;
                    } else {
                        object.castShadow = true;
                    }

                    if (object.name === "table-top") {
                        object.receiveShadow = true;
                        object.material = new THREE.MeshStandardMaterial({
                            color: this.whiteEnv ? 0xeaeaea : 0x604141,
                            flatShading: false,
                            roughness: 0,
                        });
                    }
                }
            });
            this.scene.add(model.scene);
        });
    }

    addLights() {
        const directionalLight1 = new THREE.DirectionalLight(0xf3f3f3, 1);
        directionalLight1.position.set(2, 7, 6);
        directionalLight1.shadow.camera.left = -15;
        directionalLight1.shadow.camera.right = 15;
        directionalLight1.shadow.camera.top = 15;
        directionalLight1.shadow.camera.bottom = -15;
        // directionalLight1.shadow.bias = 0.0003;
        const helper1 = new THREE.DirectionalLightHelper(directionalLight1, 2);

        directionalLight1.castShadow = true;
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xf3f3f3, 2);
        directionalLight2.position.set(-2, 8, -6);
        const helper2 = new THREE.DirectionalLightHelper(directionalLight2, 2);

        // directionalLight2.castShadow = true;
        this.scene.add(directionalLight2);

        const pointLight = new THREE.PointLight(0xf3f3f3, 3);
        const helper3 = new THREE.PointLightHelper(pointLight, 3);
        pointLight.position.set(0, 5, 6.5);

        pointLight.castShadow = true;
        if (!this.whiteEnv) {
            this.scene.add(pointLight);
        }

        const ambientLight = new THREE.AmbientLight(0xf3f3f3, 2);

        if (!this.whiteEnv) {
            this.scene.add(ambientLight);
        }

        if (this.lightHelpers) {
            this.scene.add(helper1);
            this.scene.add(helper2);
            this.scene.add(helper3);
        }
    }

    addEnvironmentLight() {
        const light = new THREE.AmbientLight(0x808080, 6);
        this.scene.add(light);
    }

    addFloor() {
        const geometry = new THREE.PlaneGeometry(120, 120);
        const material = new THREE.MeshStandardMaterial({ color: 0x9a9c9c });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0.46;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    transformMaterial(index, material, materials, materialScale, additionalScale = 1) {
        const scale = materialScale * additionalScale;

        let mat = materials[`mat${index}`];

        mat.base.minFilter = THREE.NearestFilter;
        mat.base.generateMipmaps = false;
        material.map = mat.base;
        material.aoMap = mat.ao;
        material.normalMap = mat.norm;
        material.roughnessMap = mat.rough;

        material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
        material.aoMap.wrapS = material.aoMap.wrapT = THREE.RepeatWrapping;
        material.displacementMap.wrapS = material.displacementMap.wrapT = THREE.RepeatWrapping;
        material.normalMap.wrapS = material.normalMap.wrapT = THREE.RepeatWrapping;
        material.roughnessMap.wrapS = material.roughnessMap.wrapT = THREE.RepeatWrapping;

        material.map.repeat.set(scale, scale);
        material.aoMap.repeat.set(scale, scale);
        material.displacementMap.repeat.set(scale, scale);
        material.normalMap.repeat.set(scale, scale);
        material.roughnessMap.repeat.set(scale, scale);
    }

    onWindowResize() {
        this.camera.aspect = this.width / this.height;
        this.renderer.setSize(this.width, this.height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
        this.controls.update();
    }
}
