import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import materialData from "../../materialData.json";
import { ViewerApp, AssetManagerPlugin, addBasePlugins } from "webgi";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

export default class ModelConfigurator {
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

        this.element = document.querySelector(this.defaults.elementClass);

        if (!this.element) return;

        this.windowDimensions = {
            width: window.innerWidth,
            height: window.innerHeight,
            widthHalf: window.innerWidth / 2,
            heightHalf: window.innerHeight / 2,
        };

        this.lights = {
            neutral: null,
            warm: null,
            cold: null,
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
        lightPromises["neutral"].then((result) => {
            this.lights.neutral = result[0];
        });

        lightPromises["warm"].then((result) => {
            this.lights.warm = result[0];
        });

        lightPromises["cold"].then((result) => {
            this.lights.cold = result[0];
        });
    }

    setEnvLight(light) {
        this.viewer.scene.environment = this.lights[light];
        if (this.viewer.scene.envMapIntensity !== 2) this.viewer.scene.envMapIntensity = 2;
    }

    controller() {
        this.materials = {};

        const initialScale = this.defaults.textureScale;

        for (let material in materialData) {
            const materialObject = materialData[material];

            this.materials[material] = {};
            const materialMapObject = materialData[material];

            for (let materialMap in materialObject) {
                this.materials[material][materialMap] = this.texture.load(materialMapObject[materialMap], (tex) => {
                    if (materialMap === "base") {
                        tex.colorSpace = THREE.SRGBColorSpace;
                    }
                });
            }
        }

        this.material = new THREE.MeshPhysicalMaterial({
            map: this.materials.mat1.base,
            aoMap: this.materials.mat1.ao,
            aoMapIntensity: 0,
            displacementMap: this.materials.mat1.height || null,
            metalnessMap: this.materials.mat1.metal || null,
            normalMap: this.materials.mat1.norm || null,
            metalness: 0,
            displacementScale: 0,
            roughnessMap: this.materials.mat1.rough,
            clearcoat: 0,
            flatShading: false,
        });

        this.material.map.minFilter = THREE.NearestFilter;
        this.material.map.generateMipmaps = true;
        this.material.map.wrapT = this.material.map.wrapS = THREE.RepeatWrapping;
        this.material.aoMap.wrapT = this.material.aoMap.wrapS = THREE.RepeatWrapping;
        this.material.displacementMap.wrapT = this.material.displacementMap.wrapS = THREE.RepeatWrapping;
        this.material.roughnessMap.wrapT = this.material.roughnessMap.wrapS = THREE.RepeatWrapping;
        if (this.material.normalMap) this.material.normalMap.wrapS = this.material.normalMap.wrapT = THREE.RepeatWrapping;
        if (this.material.metalnessMap) this.material.metalnessMap.wrapS = this.material.metalnessMap.wrapT = THREE.RepeatWrapping;
        if (this.material.heightMap) this.material.heightMap.wrapS = this.material.heightMap.wrapT = THREE.RepeatWrapping;

        this.material.map.repeat.set(initialScale, initialScale);
        this.material.aoMap.repeat.set(initialScale, initialScale);
        this.material.displacementMap.repeat.set(initialScale, initialScale);
        this.material.roughnessMap.repeat.set(initialScale, initialScale);
        if (this.material.normalMap) this.material.normalMap.repeat.set(initialScale, initialScale);
        if (this.material.metalnessMap) this.material.metalnessMap.repeat.set(initialScale, initialScale);
        if (this.material.heightMap) this.material.heightMap.repeat.set(initialScale, initialScale);

        this.material.color.convertSRGBToLinear();

        this.material.needsUpdate = true;

        this.mainMat = this.viewer.createPhysicalMaterial(this.material);

        this.objects = this.modelObjects.reduce((acc, modelObject) => {
            return [...acc, this.viewer.scene.getObjectByName(modelObject)];
        }, []);

        this.objects.forEach((object) => {
            if (object.isMesh) {
                object.material = this.mainMat;
            }
        });
    }

    setModelTexture(index, additionalScale = 1) {
        const scale = this.defaults.textureScale * additionalScale;

        let mat = this.materials[`mat${index}`];

        mat.base.minFilter = THREE.NearestFilter;
        mat.base.generateMipmaps = false;
        this.material.map = mat.base;
        this.material.aoMap = mat.ao;
        this.material.normalMap = mat.norm;
        this.material.heightMap = mat.height || null;
        this.material.metalnessMap = mat.metal || null;
        this.material.roughnessMap = mat.rough;

        this.material.map.wrapS = this.material.map.wrapT = THREE.RepeatWrapping;
        this.material.aoMap.wrapS = this.material.aoMap.wrapT = THREE.RepeatWrapping;
        this.material.displacementMap.wrapS = this.material.displacementMap.wrapT = THREE.RepeatWrapping;
        this.material.roughnessMap.wrapS = this.material.roughnessMap.wrapT = THREE.RepeatWrapping;
        if (this.material.normalMap) this.material.normalMap.wrapS = this.material.normalMap.wrapT = THREE.RepeatWrapping;
        if (this.material.metalnessMap) this.material.metalnessMap.wrapS = this.material.metalnessMap.wrapT = THREE.RepeatWrapping;
        if (this.material.heightMap) this.material.heightMap.wrapS = this.material.heightMap.wrapT = THREE.RepeatWrapping;

        this.material.map.repeat.set(scale, scale);
        this.material.aoMap.repeat.set(scale, scale);
        this.material.displacementMap.repeat.set(scale, scale);
        this.material.roughnessMap.repeat.set(scale, scale);
        if (this.material.normalMap) this.material.normalMap.repeat.set(scale, scale);
        if (this.material.metalnessMap) this.material.metalnessMap.repeat.set(scale, scale);
        if (this.material.heightMap) this.material.heightMap.repeat.set(scale, scale);

        this.material.needsUpdate = true;

        this.mainMat = this.viewer.createPhysicalMaterial(this.material);
        this.objects.forEach((object) => {
            if (object.isMesh) {
                object.material = this.mainMat;
                object.setDirty?.();
            }
        });
    }
}
