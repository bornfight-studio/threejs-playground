import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import materialData from "../../materialData.json";
import { ViewerApp, GroundPlugin, AssetManagerPlugin, addBasePlugins } from "webgi";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

export default class WebGiViewer {
    /**
     * @param options
     * @param {string} options.elementClass
     * @param {string} options.modelUrl
     * @param {string} options.envUrl
     * @param {array} options.modelObjects
     * @param {number} options.textureScale
     * @param {object} options.envLights
     */
    constructor(options) {
        let _defaults = {
            elementClass: "",
            modelUrl: "",
            envUrl: "",
            modelObjects: [],
            textureScale: 1,
        };

        this.defaults = Object.assign({}, _defaults, options);

        this.DOM = {
            option: ".js-furniture-configurator-option",
            lightOption: ".js-furniture-configurator-light-option",
            states: {
                isActive: "is-active",
            },
        };

        this.element = document.querySelector(this.defaults.elementClass);
        this.options = document.querySelectorAll(this.DOM.option);
        this.lightOptions = document.querySelectorAll(this.DOM.lightOption);

        if (!this.element) return;

        this.windowDimensions = {
            width: window.innerWidth,
            height: window.innerHeight,
            widthHalf: window.innerWidth / 2,
            heightHalf: window.innerHeight / 2,
        };

        if (history.scrollRestoration) {
            history.scrollRestoration = "manual";
        }

        this.init();
    }

    init() {
        const $this = this;
        async function setupViewer() {
            $this.viewer = new ViewerApp({
                canvas: $this.element,
                useRgbm: true,
            });

            $this.manager = await $this.viewer.addPlugin(AssetManagerPlugin);

            await addBasePlugins($this.viewer);

            await $this.manager.addFromPath($this.defaults.modelUrl);

            await $this.viewer.setEnvironmentMap($this.defaults.envUrl);
        }

        setupViewer().then((r) => {
            this.afterInit();
        });
    }

    afterInit() {
        this.texture = new THREE.TextureLoader();
        this.modelObjects = this.defaults.modelObjects;

        const directionalLight1 = new THREE.DirectionalLight(0xf3f3f3, 1);
        directionalLight1.position.set(2, 7, 6);

        let envLights = null;
        if (this.defaults.envLights) {
            envLights = {
                neutral: this.manager.addFromPath(this.defaults.envLights.neutral),
                warm: this.manager.addFromPath(this.defaults.envLights.warm),
                cold: this.manager.addFromPath(this.defaults.envLights.cold),
            };
        }

        const spot = this.viewer.scene.children[0].children[0].getObjectByName("Spot");

        if (spot) {
            const initialPosition = {
                positionX: spot.position.x,
                positionY: spot.position.y,
                positionZ: spot.position.z,
            };

            const cursor = {
                x: 0,
                y: 0,
            };

            this.element.addEventListener("mousemove", (ev) => {
                cursor.x = (this.windowDimensions.widthHalf - ev.clientX) * 0.00005;
                cursor.y = (this.windowDimensions.heightHalf - ev.clientY) * 0.00005;

                gsap.to(spot.position, {
                    x: initialPosition.positionX - cursor.x,
                    y: initialPosition.positionY + cursor.y,
                    duration: 1,
                    onUpdate: () => {
                        spot.setDirty?.("position");
                        this.viewer.scene.activeCamera.setDirty?.();
                    },
                });
            });
        }

        const importer = this.manager.importer;
        importer.addEventListener("onProgress", (ev) => {
            console.log(`${(ev.loaded / ev.total) * 100}%`);
        });

        importer.addEventListener("onLoad", (ev) => {
            this.controller();

            if (this.defaults.envLights) {
                this.lightController(envLights);
            }
        });
    }

    lightController(lightPromises) {
        const lights = {
            neutral: null,
            warm: null,
            cold: null,
        };

        lightPromises["neutral"].then((result) => {
            lights.neutral = result[0];
        });

        lightPromises["warm"].then((result) => {
            lights.warm = result[0];
        });

        lightPromises["cold"].then((result) => {
            lights.cold = result[0];
        });

        this.lightOptions.forEach((option, index) => {
            const light = option.dataset.light || "neutral";

            option.addEventListener("click", (ev) => {
                this.setActiveClass(ev, this.lightOptions);
                this.viewer.scene.environment = lights[light];
                if (this.viewer.scene.envMapIntensity !== 2) this.viewer.scene.envMapIntensity = 2;
            });
        });
    }

    setActiveClass(ev, options) {
        const clickedItem = ev.currentTarget;

        options.forEach((item) => {
            if (item === clickedItem) {
                item.classList.add(this.DOM.states.isActive);
            } else {
                item.classList.remove(this.DOM.states.isActive);
            }
        });
    }

    controller() {
        let materials = {};

        const initialScale = this.options[0].dataset.additionalScale || this.defaults.textureScale;

        for (let material in materialData) {
            const materialObject = materialData[material];

            materials[material] = {};
            const materialMapObject = materialData[material];

            for (let materialMap in materialObject) {
                materials[material][materialMap] = this.texture.load(materialMapObject[materialMap], (tex) => {
                    if (materialMap === "base") {
                        tex.colorSpace = THREE.SRGBColorSpace;
                    }
                });
            }
        }

        const material = new THREE.MeshPhysicalMaterial({
            map: materials.mat1.base,
            aoMap: materials.mat1.ao,
            aoMapIntensity: 0,
            displacementMap: materials.mat1.height || null,
            metalnessMap: materials.mat1.metal || null,
            normalMap: materials.mat1.norm || null,
            metalness: 0,
            displacementScale: 0,
            roughnessMap: materials.mat1.rough,
            clearcoat: 0,
            flatShading: false,
        });

        material.map.minFilter = THREE.NearestFilter;
        material.map.generateMipmaps = true;
        material.map.wrapT = material.map.wrapS = THREE.RepeatWrapping;
        material.aoMap.wrapT = material.aoMap.wrapS = THREE.RepeatWrapping;
        material.displacementMap.wrapT = material.displacementMap.wrapS = THREE.RepeatWrapping;
        material.roughnessMap.wrapT = material.roughnessMap.wrapS = THREE.RepeatWrapping;
        if (material.normalMap) material.normalMap.wrapS = material.normalMap.wrapT = THREE.RepeatWrapping;
        if (material.metalnessMap) material.metalnessMap.wrapS = material.metalnessMap.wrapT = THREE.RepeatWrapping;
        if (material.heightMap) material.heightMap.wrapS = material.heightMap.wrapT = THREE.RepeatWrapping;

        material.map.repeat.set(initialScale, initialScale);
        material.aoMap.repeat.set(initialScale, initialScale);
        material.displacementMap.repeat.set(initialScale, initialScale);
        material.roughnessMap.repeat.set(initialScale, initialScale);
        if (material.normalMap) material.normalMap.repeat.set(initialScale, initialScale);
        if (material.metalnessMap) material.metalnessMap.repeat.set(initialScale, initialScale);
        if (material.heightMap) material.heightMap.repeat.set(initialScale, initialScale);

        material.color.convertSRGBToLinear();

        material.needsUpdate = true;

        let mainMat = this.viewer.createPhysicalMaterial(material);

        const objects = this.modelObjects.reduce((acc, modelObject) => {
            return [...acc, this.viewer.scene.getObjectByName(modelObject)];
        }, []);

        objects.forEach((object) => {
            if (object.isMesh) {
                object.material = mainMat;
            }
        });

        this.options.forEach((option, index) => {
            const additionalScale = parseFloat(option.dataset.additionalScale) || 1;

            option.addEventListener("click", (ev) => {
                this.setActiveClass(ev, this.options);
                this.transformMaterial(index + 1, material, materials, additionalScale, objects, mainMat);
            });
        });
    }

    transformMaterial(index, material, materials, additionalScale = 1, objects, mainMat) {
        const scale = this.defaults.textureScale * additionalScale;

        let mat = materials[`mat${index}`];

        mat.base.minFilter = THREE.NearestFilter;
        mat.base.generateMipmaps = false;
        material.map = mat.base;
        material.aoMap = mat.ao;
        material.normalMap = mat.norm;
        material.heightMap = mat.height || null;
        material.metalnessMap = mat.metal || null;
        material.roughnessMap = mat.rough;

        material.map.wrapS = material.map.wrapT = THREE.RepeatWrapping;
        material.aoMap.wrapS = material.aoMap.wrapT = THREE.RepeatWrapping;
        material.displacementMap.wrapS = material.displacementMap.wrapT = THREE.RepeatWrapping;
        material.roughnessMap.wrapS = material.roughnessMap.wrapT = THREE.RepeatWrapping;
        if (material.normalMap) material.normalMap.wrapS = material.normalMap.wrapT = THREE.RepeatWrapping;
        if (material.metalnessMap) material.metalnessMap.wrapS = material.metalnessMap.wrapT = THREE.RepeatWrapping;
        if (material.heightMap) material.heightMap.wrapS = material.heightMap.wrapT = THREE.RepeatWrapping;

        material.map.repeat.set(scale, scale);
        material.aoMap.repeat.set(scale, scale);
        material.displacementMap.repeat.set(scale, scale);
        material.roughnessMap.repeat.set(scale, scale);
        if (material.normalMap) material.normalMap.repeat.set(scale, scale);
        if (material.metalnessMap) material.metalnessMap.repeat.set(scale, scale);
        if (material.heightMap) material.heightMap.repeat.set(scale, scale);

        material.needsUpdate = true;

        mainMat = this.viewer.createPhysicalMaterial(material);
        objects.forEach((object) => {
            if (object.isMesh) {
                object.material = mainMat;
                object.setDirty?.();
            }
        });
    }
}
