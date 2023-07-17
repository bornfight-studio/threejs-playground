import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

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

            // gui
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
            this.addFloor();
            this.animate();
        }
    }

    initModel() {
        // camera
        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 2, 120);
        this.camera.position.set(-15, 10, 15);

        // scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xbbbbbb);

        // ground grid
        const grid = new THREE.GridHelper(120, 40, 0x000000, 0x000000);
        grid.material.opacity = 0.2;
        grid.material.transparent = true;
        this.scene.add(grid);
        if (!this.guiConf.Grid) {
            grid.visible = false;
        }

        // add gui for grid
        this.gui.add(this.guiConf, "Grid").onChange((value) => {
            grid.visible = !!value;
        });

        // renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "high-performance",
        });

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.gammaFactor = 3;
        this.renderer.outputColorSpace = "srgb-linear";
        this.renderer.useLegacyLights = false;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.9;
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
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minPolarAngle = 0;
        this.controls.update();

        this.gui.add(this.guiConf, "Rotate").onChange((value) => {
            this.controls.autoRotate = value !== false;
        });

        // handle resize
        window.addEventListener("resize", () => this.onWindowResize(), false);
    }

    loadModel() {
        const materialScale = this.modelContainer.dataset.materialScale;

        const materials = {
            mat1: {
                base: this.texture.load("../static/models/mat1/base.jpg"),
                height: this.texture.load("../static/models/mat1/height.jpg"),
                ao: this.texture.load("../static/models/mat1/ao.jpg"),
                norm: this.texture.load("../static/models/mat1/norm.jpg"),
                rough: this.texture.load("../static/models/mat1/rough.jpg"),
            },
            mat2: {
                base: this.texture.load("../static/models/mat2/base.jpg"),
                height: this.texture.load("../static/models/mat2/height.jpg"),
                ao: this.texture.load("../static/models/mat2/ao.jpg"),
                norm: this.texture.load("../static/models/mat2/norm.jpg"),
                rough: this.texture.load("../static/models/mat2/rough.jpg"),
            },
        };

        let material = new THREE.MeshPhysicalMaterial({
            map: materials.mat1.base,
            aoMap: materials.mat1.ao,
            aoMapIntensity: 0,
            normalMap: materials.mat1.norm,
            displacementMap: materials.mat1.height,
            displacementScale: 0,
            roughnessMap: materials.mat1.rough,
            metalness: 0.1,
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
        material.normalMap.wrapT = THREE.RepeatWrapping;
        material.normalMap.wrapS = THREE.RepeatWrapping;
        material.roughnessMap.wrapT = THREE.RepeatWrapping;
        material.roughnessMap.wrapS = THREE.RepeatWrapping;

        material.map.repeat.set(materialScale, materialScale);
        material.aoMap.repeat.set(materialScale, materialScale);
        material.displacementMap.repeat.set(materialScale, materialScale);
        material.normalMap.repeat.set(materialScale, materialScale);
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
            material.color.convertSRGBToLinear();

            const objects = [];

            this.modelObjects.forEach((modelObject) => {
                objects.push(model.scene.getObjectByName(modelObject));
            });

            console.log(objects);

            objects.forEach((object) => {
                object.castShadow = true;
                object.receiveShadow = true;
                object.material.color.convertSRGBToLinear();

                // initial material setup
                object.material = material;
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
                option.addEventListener("click", (ev) => {
                    setActiveClass(this.options, ev);
                    this.transformMaterial(index + 1, material, materials, materialScale);
                });
            });
        });
    }

    addLights() {
        const directionalLight1 = new THREE.DirectionalLight(0xf3f3f3, 2);
        directionalLight1.position.set(2, 8, -6);
        const helper1 = new THREE.DirectionalLightHelper(directionalLight1, 2);

        directionalLight1.castShadow = true;
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xf3f3f3, 2);
        directionalLight2.position.set(-2, 8, 6);
        const helper2 = new THREE.DirectionalLightHelper(directionalLight2, 2);

        directionalLight2.castShadow = true;
        this.scene.add(directionalLight2);

        const pointLight = new THREE.PointLight(0xf3f3f3, 3);
        const helper3 = new THREE.PointLightHelper(pointLight, 2);
        pointLight.position.set(0, 12, 0);

        const directionalLight3 = new THREE.DirectionalLight(0xf3f3f3, 14);
        directionalLight3.position.set(4, 7, 7);
        directionalLight3.castShadow = true;
        const helper4 = new THREE.DirectionalLightHelper(directionalLight3, 2);

        pointLight.castShadow = true;
        this.scene.add(pointLight);

        if (this.lightHelpers) {
            this.scene.add(helper1);
            this.scene.add(helper2);
            this.scene.add(helper3);
            this.scene.add(helper4);
        }
    }

    addEnvironmentLight() {
        const light = new THREE.AmbientLight(0x808080, 3);
        this.scene.add(light);
    }

    addFloor() {
        const geometry = new THREE.PlaneGeometry(120, 120);
        const material = new THREE.MeshStandardMaterial({ color: 0xfefefe });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    transformMaterial(index, material, materials, scale) {
        let mat = null;

        if (index === 2) {
            mat = materials.mat2;
        } else {
            mat = materials.mat1;
        }

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
