import * as THREE from "three";
import gsap from "gsap";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export default class FurnitureConfigurator {
    constructor() {
        this.DOM = {
            modelContainer: ".js-furniture-configurator",
        };
    }

    init() {
        this.modelContainer = document.querySelector(this.DOM.modelContainer);
        if (this.modelContainer !== null) {
            console.log("GLTFModelController init()");

            this.width = window.innerWidth;
            this.height = window.innerHeight;

            THREE.Cache.enabled = true;

            this.texture = new THREE.TextureLoader();

            // gui
            this.gui = new GUI({
                name: "Sofa config",
            });

            // gui config
            this.guiConf = {
                autoRotation: {
                    autoRotate: false,
                },
                grid: {
                    showGrid: true,
                },
                sofaMaterial: "Material3",
                sphereMaterial: "Material1",
            };

            this.initModel();
            this.animate();
        }
    }

    initModel() {
        // camera
        this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, 0.5, 400);
        this.camera.position.set(17, 10, 17);

        // scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xbbbbbb);

        // ground grid
        const grid = new THREE.GridHelper(2000, 40, 0x000000, 0x000000);
        grid.material.opacity = 0.1;
        grid.material.transparent = true;
        this.scene.add(grid);
        if (!this.guiConf.grid.showGrid) {
            grid.visible = false;
        }

        // add gui for grid
        this.gui.add(this.guiConf.grid, "showGrid").onChange((value) => {
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
        this.renderer.gammaFactor = 2.2;
        this.renderer.outputColorSpace = "srgb-linear";
        this.renderer.useLegacyLights = false;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.modelContainer.appendChild(this.renderer.domElement);

        const environment = new RoomEnvironment();
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.scene.environment = this.pmremGenerator.fromScene(environment).texture;

        // loader
        this.loadModel();
        this.loadSphere();

        // orbit controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1, 0);
        this.controls.autoRotate = this.guiConf.autoRotation.autoRotate;
        this.controls.autoRotateSpeed = 1;
        this.controls.enableDamping = true;
        this.controls.minDistance = 4;
        this.controls.maxDistance = 30;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minPolarAngle = 0;
        this.controls.update();

        this.gui.add(this.guiConf.autoRotation, "autoRotate").onChange((value) => {
            this.controls.autoRotate = value !== false;
        });

        // handle resize
        window.addEventListener("resize", () => this.onWindowResize(), false);
    }

    loadModel() {
        const materials = {
            mat1: {
                base: this.texture.load("../static/models/mat1/base.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                height: this.texture.load("../static/models/mat1/height.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                ao: this.texture.load("../static/models/mat1/ao.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                norm: this.texture.load("../static/models/mat1/norm.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                rough: this.texture.load("../static/models/mat1/rough.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
            },
            mat2: {
                base: this.texture.load("../static/models/mat2/base.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                height: this.texture.load("../static/models/mat2/height.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                ao: this.texture.load("../static/models/mat2/ao.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                norm: this.texture.load("../static/models/mat2/norm.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                rough: this.texture.load("../static/models/mat2/rough.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
            },
            mat3: {
                base: this.texture.load("../static/models/matLion/base.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                height: this.texture.load("../static/models/matLion/height.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                ao: this.texture.load("../static/models/matLion/ao.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                norm: this.texture.load("../static/models/matLion/norm.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                rough: this.texture.load("../static/models/matLion/rough.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
            },
        };

        let material = new THREE.MeshPhysicalMaterial({
            map: materials.mat3.base,
            aoMap: materials.mat3.ao,
            aoMapIntensity: 1,
            normalMap: materials.mat3.norm,
            displacementMap: materials.mat3.height,
            displacementScale: 0,
            roughnessMap: materials.mat3.rough,
            metalness: 0,
            clearcoat: 0,
            flatShading: false,
        });

        material.map.minFilter = THREE.NearestFilter;
        material.map.generateMipmaps = false;
        material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
        material.aoMap.wrapS = material.aoMap.wrapT = THREE.RepeatWrapping;
        material.displacementMap.wrapS = material.displacementMap.wrapT = THREE.RepeatWrapping;
        material.normalMap.wrapS = material.normalMap.wrapT = THREE.RepeatWrapping;
        material.roughnessMap.wrapS = material.roughnessMap.wrapT = THREE.RepeatWrapping;

        material.map.repeat.set(0.1, 0.1);
        material.aoMap.repeat.set(0.1, 0.1);
        material.displacementMap.repeat.set(0.1, 0.1);
        material.normalMap.repeat.set(0.1, 0.1);
        material.roughnessMap.repeat.set(0.1, 0.1);

        // get model
        let model = this.modelContainer.getAttribute("data-model-source");

        // loader
        const loader = new GLTFLoader();

        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath("../static/js/vendors/draco/");
        loader.setDRACOLoader(dracoLoader);

        loader.load(model, (model) => {
            model.scene.position.x = -4;
            material.color.convertSRGBToLinear();

            model.scene.traverse((object) => {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                    object.material.color.convertSRGBToLinear();

                    // initial material setup
                    object.material = material;
                }
            });

            this.gui
                .add(this.guiConf, "sofaMaterial", {
                    Material1: 1,
                    Material2: 2,
                    Material3: 3,
                })
                .onChange((value) => {
                    this.transformMaterial(value, material, materials, 0.1);
                });

            this.scene.add(model.scene);
        });
    }

    loadSphere() {
        const materials = {
            mat1: {
                base: this.texture.load("../static/models/mat1/base.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                height: this.texture.load("../static/models/mat1/height.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                ao: this.texture.load("../static/models/mat1/ao.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                norm: this.texture.load("../static/models/mat1/norm.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                rough: this.texture.load("../static/models/mat1/rough.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
            },
            mat2: {
                base: this.texture.load("../static/models/mat2/base.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                height: this.texture.load("../static/models/mat2/height.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                ao: this.texture.load("../static/models/mat2/ao.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                norm: this.texture.load("../static/models/mat2/norm.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                rough: this.texture.load("../static/models/mat2/rough.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
            },
            mat3: {
                base: this.texture.load("../static/models/matLion/base.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                height: this.texture.load("../static/models/matLion/height.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                ao: this.texture.load("../static/models/matLion/ao.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                norm: this.texture.load("../static/models/matLion/norm.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
                rough: this.texture.load("../static/models/matLion/rough.jpg", (tex) => {
                    tex.colorSpace = "srgb-linear";
                }),
            },
        };

        let material = new THREE.MeshPhysicalMaterial({
            map: materials.mat1.base,
            aoMap: materials.mat1.ao,
            aoMapIntensity: 1,
            normalMap: materials.mat1.norm,
            displacementMap: materials.mat1.height,
            displacementScale: 0.03,
            roughnessMap: materials.mat1.rough,
            metalness: 0,
            clearcoat: 0,
            flatShading: false,
        });

        material.map.minFilter = THREE.NearestFilter;
        material.map.generateMipmaps = false;
        material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
        material.aoMap.wrapS = material.aoMap.wrapT = THREE.RepeatWrapping;
        material.displacementMap.wrapS = material.displacementMap.wrapT = THREE.RepeatWrapping;
        material.normalMap.wrapS = material.normalMap.wrapT = THREE.RepeatWrapping;
        material.roughnessMap.wrapS = material.roughnessMap.wrapT = THREE.RepeatWrapping;

        material.map.repeat.set(3, 3);
        material.aoMap.repeat.set(3, 3);
        material.displacementMap.repeat.set(3, 3);
        material.normalMap.repeat.set(3, 3);
        material.roughnessMap.repeat.set(3, 3);

        this.gui
            .add(this.guiConf, "sphereMaterial", {
                Material1: 1,
                Material2: 2,
                Material3: 3,
            })
            .onChange((value) => {
                this.transformMaterial(value, material, materials, 1);
            });

        setTimeout(() => {
            this.sphere(material);
        }, 2000);
    }

    sphere(material) {
        const geometry = new THREE.SphereGeometry(1.5, 400, 400);
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(4, 2, 0);
        this.scene.add(sphere);

        gsap.to(sphere.rotation, {
            duration: 40,
            ease: "none",
            y: Math.PI * 2,
            repeat: -1,
        });
    }

    transformMaterial(index, material, materials, scale) {
        let mat = null;

        if (index === 2) {
            mat = materials.mat2;
        } else if (index === 3) {
            mat = materials.mat3;
        } else {
            mat = materials.mat1;
        }

        console.log(index);

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
