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
     * @param {function} options.onLoad
     * @param {function} options.onProgress
     */
    constructor(options) {
        let _defaults = {
            elementClass: "",
            modelUrl: "",
            envUrl: "",
            modelObjects: [],
            textureScale: 1,
            onLoad: () => {},
            onProgress: () => {},
        };

        this.defaults = Object.assign({}, _defaults, options);

        this.onLoad = this.defaults.onLoad;
        this.onProgress = this.defaults.onProgress;

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

            $this.importer = $this.manager.importer;

            await addBasePlugins($this.viewer);
        }

        setupViewer().then((r) => {
            this.manager.addFromPath(this.defaults.modelUrl).then((r) => {});

            this.viewer.setEnvironmentMap(this.defaults.envUrl).then((r) => {});

            this.envLights = null;
            if (this.defaults.envLights) {
                $this.envLights = {
                    neutral: this.manager.addFromPath(this.defaults.envLights.neutral),
                    warm: this.manager.addFromPath(this.defaults.envLights.warm),
                    cold: this.manager.addFromPath(this.defaults.envLights.cold),
                };
            }

            this.importer.addEventListener("onProgress", (ev) => {
                this.onProgress((ev.loaded / ev.total) * 100);
            });

            this.importer.addEventListener("onLoad", (ev) => {
                setTimeout(() => {
                    this.afterInit();
                }, 100);

                setTimeout(() => {
                    this.onLoad();
                }, 200);
            });
        });
    }

    afterInit() {
        const camera = this.viewer.scene.activeCamera;
        const controls = camera.controls;
        controls.minDistance = 0.5;
        controls.maxDistance = 1.2;
        controls.minZoom = 0;
        controls.maxZoom = 0;
        controls.minPolarAngle = 0.9;
        controls.maxPolarAngle = 1.427;
        controls.minAzimuthAngle = 3.2;
        controls.maxAzimuthAngle = -1.2;

        camera.cameraObject.userData.autoNearFar = false;

        console.log(camera);

        this.texture = new THREE.TextureLoader();
        this.modelObjects = this.defaults.modelObjects;

        const directionalLight1 = new THREE.DirectionalLight(0xf3f3f3, 1);
        directionalLight1.position.set(2, 7, 6);

        const spotLight = this.viewer.scene.children[0].children[0].getObjectByName("Spot");

        if (spotLight) {
            const initialPosition = {
                positionX: spotLight.position.x,
                positionY: spotLight.position.y,
                positionZ: spotLight.position.z,
            };

            const cursor = {
                x: 0,
                y: 0,
            };

            this.element.addEventListener("mousemove", (ev) => {
                cursor.x = (this.windowDimensions.widthHalf - ev.clientX) * 0.00005;
                cursor.y = (this.windowDimensions.heightHalf - ev.clientY) * 0.00005;

                gsap.to(spotLight.position, {
                    x: initialPosition.positionX - cursor.x,
                    y: initialPosition.positionY + cursor.y,
                    duration: 1,
                    onUpdate: () => {
                        spotLight.setDirty?.("position");
                        camera.setDirty?.();
                    },
                });
            });
        }

        this.controller();

        if (this.defaults.envLights) {
            this.lightController();
        }
    }

    lightController() {
        this.envLights["neutral"].then((result) => {
            this.lights.neutral = result[0];
        });

        this.envLights["warm"].then((result) => {
            this.lights.warm = result[0];
        });

        this.envLights["cold"].then((result) => {
            this.lights.cold = result[0];
        });
    }

    setEnvLight(light) {
        this.viewer.scene.environment = this.lights[light];
        if (this.viewer.scene.envMapIntensity !== 2) this.viewer.scene.envMapIntensity = 2;
    }

    controller() {
        this.materials = {};

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
            aoMapIntensity: 0,
            metalness: 0,
            displacementScale: 0,
            clearcoat: 0,
            flatShading: false,
        });

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

    setModelTexture(index, additionalScale) {
        if (!additionalScale || isNaN(additionalScale)) additionalScale = 1;
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
        this.material.roughnessMap.wrapS = this.material.roughnessMap.wrapT = THREE.RepeatWrapping;
        if (this.material.displacementMap) this.material.displacementMap.wrapS = this.material.displacementMap.wrapT = THREE.RepeatWrapping;
        if (this.material.normalMap) this.material.normalMap.wrapS = this.material.normalMap.wrapT = THREE.RepeatWrapping;
        if (this.material.metalnessMap) this.material.metalnessMap.wrapS = this.material.metalnessMap.wrapT = THREE.RepeatWrapping;
        if (this.material.heightMap) this.material.heightMap.wrapS = this.material.heightMap.wrapT = THREE.RepeatWrapping;

        this.material.map.repeat.set(scale, scale);
        this.material.aoMap.repeat.set(scale, scale);
        this.material.roughnessMap.repeat.set(scale, scale);
        if (this.material.displacementMap) this.material.displacementMap.repeat.set(scale, scale);
        if (this.material.normalMap) this.material.normalMap.repeat.set(scale, scale);
        if (this.material.metalnessMap) this.material.metalnessMap.repeat.set(scale, scale);
        if (this.material.heightMap) this.material.heightMap.repeat.set(scale, scale);

        this.material.color.convertSRGBToLinear();

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
