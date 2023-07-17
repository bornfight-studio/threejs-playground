import * as THREE from "three";
import gsap from "gsap";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
// import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
// import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export default class FurnitureConfigurator {
    constructor() {
        this.DOM = {
            modelContainer: ".js-fabric-viewer",
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
                name: "Fabric viewer",
            });

            // gui config
            this.guiConf = {
                autoRotation: {
                    autoRotate: true,
                },
                grid: {
                    showGrid: true,
                },
                sphere: {
                    rotate: true,
                },
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
        this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 1, 40);
        this.camera.position.set(0, 5, 15);

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
        this.renderer.gammaFactor = 2;
        this.renderer.outputColorSpace = "srgb-linear";
        this.renderer.useLegacyLights = false;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.modelContainer.appendChild(this.renderer.domElement);

        // const environment = new RoomEnvironment();
        // this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        // this.scene.environment = this.pmremGenerator.fromScene(environment).texture;

        // loader
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

    addLights() {
        const lightHelpers = false;

        const directionalLight1 = new THREE.DirectionalLight(0xf0f0f0, 1);
        directionalLight1.position.set(0, 6, 3);
        const helper1 = new THREE.DirectionalLightHelper(directionalLight1, 1);

        directionalLight1.castShadow = true;
        this.scene.add(directionalLight1);

        const directionalLight2 = new THREE.DirectionalLight(0xf0f0f0, 2);
        directionalLight2.position.set(0, 3, 8);
        const helper2 = new THREE.DirectionalLightHelper(directionalLight2, 2);

        directionalLight2.castShadow = true;
        this.scene.add(directionalLight2);

        const pointLight = new THREE.PointLight(0xffffff, 3);
        const helper3 = new THREE.PointLightHelper(pointLight, 2);
        pointLight.position.set(0, 12, 0);

        pointLight.castShadow = true;
        this.scene.add(pointLight);

        if (lightHelpers) {
            this.scene.add(helper1);
            this.scene.add(helper2);
            this.scene.add(helper3);
        }
    }

    addEnvironmentLight() {
        const light = new THREE.AmbientLight(0x808080, 4);
        this.scene.add(light);
    }

    addFloor() {
        const geometry = new THREE.PlaneGeometry(40, 40);
        const material = new THREE.MeshStandardMaterial({ color: 0xfefefe });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    loadSphere() {
        const materialScale = 1.15;

        const materials = {
            mat: {
                base: this.texture.load("../static/models/mat1/base.jpg"),
                height: this.texture.load("../static/models/mat1/height.jpg"),
                ao: this.texture.load("../static/models/mat1/ao.jpg"),
                norm: this.texture.load("../static/models/mat1/norm.jpg"),
                rough: this.texture.load("../static/models/mat1/rough.jpg"),
            },
        };

        let material = new THREE.MeshPhysicalMaterial({
            map: materials.mat.base,
            aoMap: materials.mat.ao,
            aoMapIntensity: 0.5,
            normalMap: materials.mat.norm,
            displacementMap: materials.mat.height,
            displacementScale: 0,
            roughnessMap: materials.mat.rough,
            metalness: 0.15,
            flatShading: false,
            roughness: 0.85,
            sheen: new THREE.Color(0x00ff00),
        });

        material.map.generateMipmaps = false;
        material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
        material.aoMap.wrapS = material.aoMap.wrapT = THREE.RepeatWrapping;
        material.displacementMap.wrapS = material.displacementMap.wrapT = THREE.RepeatWrapping;
        material.normalMap.wrapS = material.normalMap.wrapT = THREE.RepeatWrapping;
        material.roughnessMap.wrapS = material.roughnessMap.wrapT = THREE.RepeatWrapping;

        material.map.repeat.set(materialScale, materialScale);
        material.aoMap.repeat.set(materialScale, materialScale);
        material.displacementMap.repeat.set(materialScale, materialScale);
        material.normalMap.repeat.set(materialScale, materialScale);
        material.roughnessMap.repeat.set(materialScale, materialScale);

        this.gui.add(material, "roughness", 0, 1);

        setTimeout(() => {
            this.sphere(material);
        }, 500);
    }

    sphere(material) {
        const geometry = new THREE.SphereGeometry(2.5, 400, 400);
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(0, 2.5, 0);
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        sphere.rotation.y = Math.PI * 1.25;
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
