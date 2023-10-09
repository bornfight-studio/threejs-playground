import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ViewerApp, AssetManagerPlugin, addBasePlugins, GammaCorrectionPlugin } from "webgi";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

export default class ModelConfigurator {
    /**
     * Constructor for the class.
     *
     * @param {Object} options - An object containing options for the constructor.
     * @param {string} options.elementClass - The class of the element.
     * @param {string} options.modelUrl - The URL of the model.
     * @param {string} options.envUrl - The URL of the environment.
     * @param {Array} options.modelObjects - An array of model objects.
     * @param {Array} options.roomObjects - An array of room objects.
     * @param {number} options.textureScale - The scale of the texture.
     * @param {Object} options.textureAppearanceSets - An object containing texture appearance sets.
     * @param {Object} options.envLights - An object containing environment light maps.
     * @param {boolean} options.mouseAnimation - A boolean indicating whether mouse animation is enabled.
     * @param {Function} options.onLoad - A callback function to be called when the object is loaded.
     * @param {Function} options.onProgress - A callback function to be called during the loading process.
     */
    constructor(options) {
        let _defaults = {
            elementClass: "",
            modelUrl: "",
            envUrl: "",
            modelObjects: [],
            roomObjects: [],
            textureScale: 1,
            textureAppearanceSets: {},
            envLights: {},
            mouseAnimation: false,
            onLoad: () => {},
            onProgress: () => {},
        };

        this.defaults = Object.assign({}, _defaults, options);

        this.onLoad = this.defaults.onLoad;
        this.onProgress = this.defaults.onProgress;

        this.element = document.querySelector(this.defaults.elementClass);

        if (!this.element) return;

        this.elementDimensions = {
            width: this.element.offsetWidth,
            height: this.element.offsetHeight,
            widthHalf: this.element.offsetWidth / 2,
            heightHalf: this.element.offsetHeight / 2,
        };

        this.lights = {
            neutral: null,
            warm: null,
            cold: null,
        };

        this.roomShown = true;

        this.textureAppearanceSets = this.defaults.textureAppearanceSets;
        this.prevTextureAppearanceSet = null;

        if (history.scrollRestoration) {
            history.scrollRestoration = "manual";
        }

        this.init();
    }

    /**
     * Initializes the viewer and sets up the necessary plugins and configurations.
     */
    init() {
        const $this = this;

        async function setupViewer() {
            $this.viewer = new ViewerApp({
                canvas: $this.element,
                useRgbm: true,
            });

            $this.manager = await $this.viewer.addPlugin(AssetManagerPlugin);

            $this.gammaCorrection = await $this.viewer.addPlugin(GammaCorrectionPlugin);

            $this.importer = $this.manager.importer;

            await addBasePlugins($this.viewer);
        }

        setupViewer().then((r) => {
            console.log(this.gammaCorrection);

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

    /**
     * Initializes the settings and objects after the viewer is initialized.
     */
    afterInit() {
        const camera = this.viewer.scene.activeCamera;
        const controls = camera.controls;
        controls.minDistance = 0.5;
        controls.maxDistance = 2;
        controls.minZoom = 0;
        controls.maxZoom = 0;
        controls.minPolarAngle = 0.9;
        controls.maxPolarAngle = 1.6;
        controls.minAzimuthAngle = 3.2;
        controls.maxAzimuthAngle = -1.2;

        camera.cameraObject.userData.autoNearFar = false;

        this.texture = new THREE.TextureLoader();
        this.modelObjects = this.defaults.modelObjects;

        this.roomObjects = this.defaults.roomObjects;

        const directionalLight1 = new THREE.DirectionalLight(0xf3f3f3, 1);
        directionalLight1.position.set(2, 7, 6);

        const spotLight = this.viewer.scene.children[0].children[0].getObjectByName("Spot");

        if (spotLight && this.defaults.mouseAnimation) {
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
                cursor.x = (this.elementDimensions.widthHalf - ev.clientX) * 0.00005;
                cursor.y = (this.elementDimensions.heightHalf - ev.clientY) * 0.00005;

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

    /**
     * Initializes the light controller by retrieving environment light values and assigning them to the corresponding light properties.
     */
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

    /**
     * Sets the environment light of the viewer scene.
     *
     * @param {object} light - The light to set as the environment light.
     */
    setEnvLight(light) {
        this.viewer.scene.environment = this.lights[light];

        this.viewer.scene.setDirty();
        // this.viewer.scene.activeCamera.setDirty();
    }

    /**
     * Initializes the controller and sets up the materials and objects.
     */
    controller() {
        this.material = new THREE.MeshPhysicalMaterial({
            aoMapIntensity: 1,
            reflectivity: 0.36,
            metalness: 0,
            displacementScale: 0,
            clearcoat: 0,
            clearcoatRoughness: 1,
            flatShading: false,
        });

        this.mainMat = this.viewer.createPhysicalMaterial(this.material);

        this.objects = this.modelObjects.reduce((acc, modelObject) => {
            return [...acc, this.viewer.scene.getObjectByName(modelObject)];
        }, []);

        if (this.roomObjects && this.roomObjects.length > 0) {
            this.roomObjects = this.roomObjects.reduce((acc, modelObject) => {
                return [...acc, this.viewer.scene.getObjectByName(modelObject)];
            }, []);
        }

        this.objects.forEach((object) => {
            if (object.isMesh) {
                object.material = this.mainMat;
            }
        });
    }

    /**
     * Sets the model texture.
     *
     * @param {number} index - The index of the texture.
     * @param {number} additionalScale - The additional scale of the texture.
     * @param {string} baseTexture - The base texture.
     * @param {string} textureAppearanceSet - The texture appearance set.
     */
    setModelTexture(index, additionalScale, baseTexture, textureAppearanceSet) {
        const textureReplacementDuration = 500; //ms
        const startTime = new Date();
        this.element.classList.add("is-loading");
        if (!additionalScale || isNaN(additionalScale)) additionalScale = 1;
        const scale = this.defaults.textureScale * additionalScale;

        const isDifferentTextureAppearanceSet = this.prevTextureAppearanceSet !== textureAppearanceSet;

        const materialObject = {};

        let length = Object.keys(this.textureAppearanceSets[textureAppearanceSet]).length;
        let count = 0;

        if (length === 0) return;

        if (isDifferentTextureAppearanceSet) {
            // because base texture is separate from appearance
            length++;
        } else {
            length = 1;
        }

        materialObject["base"] = this.texture.load(baseTexture, (tex) => {
            count++;
            tex.colorSpace = THREE.SRGBColorSpace;

            materialObject.base.minFilter = THREE.NearestFilter;
            materialObject.base.generateMipmaps = false;
            this.material.map = materialObject.base;
            this.material.map.wrapS = this.material.map.wrapT = THREE.RepeatWrapping;
            this.material.map.repeat.set(scale, scale);

            if (count === length) {
                this.afterTextureLoad(startTime, textureReplacementDuration);
            }
        });

        this.material.aoMap = null;
        this.material.roughnessMap = null;
        this.material.normalMap = null;
        this.material.metalnessMap = null;
        this.material.heightMap = null;

        if (isDifferentTextureAppearanceSet) {
            this.prevTextureAppearanceSet = textureAppearanceSet;
            for (const materialMap in this.textureAppearanceSets[textureAppearanceSet]) {
                materialObject[materialMap] = this.texture.load(this.textureAppearanceSets[textureAppearanceSet][materialMap], (tex) => {
                    count++;
                    if (count === length) {
                        this.tweakAppearanceSet(materialObject, scale);
                        this.afterTextureLoad(startTime, textureReplacementDuration);
                    }
                });
            }
        }
    }

    /**
     * Sets the appearance of the material based on the given materialObject and scale.
     *
     * @param {Object} materialObject - The material object containing appearance properties.
     * @param {number} scale - The scale factor for the appearance.
     */
    tweakAppearanceSet(materialObject, scale) {
        this.material.aoMap = materialObject.ao;
        this.material.normalMap = materialObject.norm;
        this.material.heightMap = materialObject.height || null;
        this.material.metalnessMap = materialObject.metal || null;
        this.material.roughnessMap = materialObject.rough;

        this.material.aoMap.wrapS = this.material.aoMap.wrapT = THREE.RepeatWrapping;
        this.material.roughnessMap.wrapS = this.material.roughnessMap.wrapT = THREE.RepeatWrapping;
        if (this.material.displacementMap) this.material.displacementMap.wrapS = this.material.displacementMap.wrapT = THREE.RepeatWrapping;
        if (this.material.normalMap) this.material.normalMap.wrapS = this.material.normalMap.wrapT = THREE.RepeatWrapping;
        if (this.material.metalnessMap) this.material.metalnessMap.wrapS = this.material.metalnessMap.wrapT = THREE.RepeatWrapping;
        if (this.material.heightMap) this.material.heightMap.wrapS = this.material.heightMap.wrapT = THREE.RepeatWrapping;

        this.material.aoMap.repeat.set(scale, scale);
        this.material.roughnessMap.repeat.set(scale, scale);
        if (this.material.displacementMap) this.material.displacementMap.repeat.set(scale, scale);
        if (this.material.normalMap) this.material.normalMap.repeat.set(scale, scale);
        if (this.material.metalnessMap) this.material.metalnessMap.repeat.set(scale, scale);
        if (this.material.heightMap) this.material.heightMap.repeat.set(scale, scale);
    }

    /**
     * Updates the material and objects after a texture has finished loading.
     *
     * @param {Date} startTime - The start time of the texture loading process.
     * @param {number} textureReplacementDuration - The duration it takes to replace the texture in milliseconds.
     */
    afterTextureLoad(startTime, textureReplacementDuration) {
        this.material.color.convertSRGBToLinear();

        this.material.needsUpdate = true;

        this.mainMat = this.viewer.createPhysicalMaterial(this.material);
        this.objects.forEach((object) => {
            if (object.isMesh) {
                object.material = this.mainMat;
                object.setDirty?.();
            }
        });

        const endTime = new Date();
        const timeDiff = endTime - startTime; //in ms
        if (timeDiff < textureReplacementDuration) {
            setTimeout(() => {
                this.element.classList.remove("is-loading");
            }, textureReplacementDuration - timeDiff);
        } else {
            this.element.classList.remove("is-loading");
        }
    }

    toggleRoom() {
        if (this.roomShown) {
            this.roomShown = false;
            this.hideRoom();
            return;
        }

        this.roomShown = true;
        this.showRoom();
    }

    hideRoom() {
        this.roomObjects.forEach((object) => {
            object.visible = false;
            object.setDirty?.();
        });
    }

    showRoom() {
        this.roomObjects.forEach((object) => {
            object.visible = true;
            object.setDirty?.();
        });
    }
}
