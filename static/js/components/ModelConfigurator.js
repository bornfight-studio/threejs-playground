import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ViewerApp, AssetManagerPlugin, addBasePlugins } from "webgi";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

export default class ModelConfigurator {
    /**
     * Constructor for the class.
     *
     * @param {Object} options - An object containing options for the constructor.
     * @param {boolean} options.hideRoom
     * @param {string} options.elementClass - The class of the element.
     * @param {string} options.modelUrl - The URL of the model.
     * @param {Array} options.modelObjects - An array of model objects.
     * @param {Array} options.roomObjects - An array of room objects.
     * @param {number} options.textureScale - The scale of the texture.
     * @param {Object} options.textureAppearanceSets - An object containing texture appearance sets.
     * @param {boolean} options.mouseAnimation - A boolean indicating whether mouse animation is enabled.
     * @param {Function} options.onLoad - A callback function to be called when the object is loaded.
     * @param {Function} options.onProgress - A callback function to be called during the loading process.
     */
    constructor(options) {
        let _defaults = {
            elementClass: "",
            modelUrl: "",
            hideRoom: false,
            lockView: false,
            modelObjects: [],
            roomObjects: [],
            textureScale: 1,
            textureAppearanceSets: {},
            mouseAnimation: false,
            onLoad: () => {},
            onProgress: () => {},
        };

        this.defaults = Object.assign({}, _defaults, options);

        console.log(this.defaults.modelUrl);
        this.body = document.body;

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

        this.roomShown = !this.defaults.hideRoom;
        this.viewLocked = !this.defaults.lockView;

        this.lights = [];

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
                isAntialiased: true,
                // caching: true,
            });

            // $this.viewer.renderManager.displayCanvasScaling = Math.min(2, window.devicePixelRatio) * 1.25;
            $this.viewer.renderManager.displayCanvasScaling = 2.5;

            $this.manager = await $this.viewer.addPlugin(AssetManagerPlugin);

            $this.importer = $this.manager.importer;

            await addBasePlugins($this.viewer);

            $this.viewer.renderer.refreshPipeline();
        }

        setupViewer().then((r) => {
            this.importer.importSinglePath("../static/models/lights/neutral.hdr").then((v) => {
                this.lights.neutral = v;
            });

            this.importer.importSinglePath("../static/models/lights/warm_3.hdr").then((v) => {
                this.lights.warm = v;
            });

            this.manager.addFromPath(this.defaults.modelUrl).then((r) => {});

            this.importer.addEventListener("onProgress", (ev) => {
                this.onProgress((ev.loaded / ev.total) * 100);
            });

            this.importer.addEventListener("onLoad", (ev) => {
                setTimeout(() => {
                    this.afterInit();
                }, 100);

                setTimeout(() => {
                    this.onLoad();

                    if (!this.roomShown) {
                        this.hideRoom();
                    }
                }, 200);
            });
        });
    }

    /**
     * Initializes the settings and objects after the viewer is initialized.
     */
    afterInit() {
        //page bg #F3F0ED
        //config bg (from #FFFFFF) #E2E2E2
        this.viewer.scene.setBackgroundColor("#FFFFFF");

        const camera = this.viewer.scene.activeCamera;
        const controls = camera.controls;
        controls.minDistance = 2;
        controls.maxDistance = 12;
        controls.minZoom = 0;
        controls.maxZoom = 0;
        // controls.enablePan = true;
        // controls.minPolarAngle = 0.9;
        // controls.maxPolarAngle = 1.6;
        // controls.minAzimuthAngle = 3.2;
        // controls.maxAzimuthAngle = -1.2;

        camera.setCameraOptions({ controlsEnabled: false });

        camera.cameraObject.userData.autoNearFar = false;

        this.texture = new THREE.TextureLoader();
        this.modelObjects = this.defaults.modelObjects;

        this.roomObjects = this.defaults.roomObjects;

        const spotLight = this.viewer.scene.children[0].children[0].getObjectByName("Spot");
        // if (spotLight) spotLight.intensity = 1;

        this.addLights();

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
    }

    addLights() {
        const directionalLight1 = new THREE.DirectionalLight(0xf0f0f0, 1);
        directionalLight1.position.set(0, 6, 3);
        // directionalLight1.position.set(0, 4, 6);
        // directionalLight1.castShadow = true;
        // directionalLight1.shadow.camera.top = 20;
        // directionalLight1.shadow.camera.bottom = -20;
        // directionalLight1.shadow.camera.left = -20;
        // directionalLight1.shadow.camera.right = 20;
        // directionalLight1.shadow.camera.near = 0.5;
        // directionalLight1.shadow.camera.far = 20;
        // directionalLight1.shadow.mapSize.width = 4096;
        // directionalLight1.shadow.mapSize.height = 4096;
        // directionalLight1.shadow.bias = 0.0001;
        // directionalLight1.shadow.radius = 1;
        // directionalLight1.shadow.autoUpdate = false;
        // directionalLight1.shadow.needsUpdate = true;

        const directionalLight2 = new THREE.DirectionalLight(0xf0f0f0, 0.5);
        directionalLight2.position.set(-1, 3, -3);

        const pointLight = new THREE.PointLight(0xf0f0f0, 0.2);
        pointLight.position.set(-5, 3, 0);

        // pointLight.castShadow = true;

        const light = new THREE.AmbientLight(0x808080, 0.5);

        this.lights.push(directionalLight1);
        this.lights.push(directionalLight2);
        this.lights.push(pointLight);
        this.lights.push(light);

        this.viewer.scene.add(directionalLight1);
        this.viewer.scene.add(directionalLight2);
        this.viewer.scene.add(pointLight);
        this.viewer.scene.add(light);
    }

    /**
     * Sets the environment light of the viewer scene.
     *
     * @param {object} color - The light to set as the environment light.
     */
    setEnvLight(color) {
        this.viewer.scene.environment = this.lights[color];

        this.viewer.scene.setDirty("environment");
    }

    /**
     * Initializes the controller and sets up the materials and objects.
     */
    controller() {
        this.material = {};

        this.objects = this.modelObjects.reduce((acc, modelObject) => {
            return [...acc, this.viewer.scene.getObjectByName(modelObject)];
        }, []);

        if (this.roomObjects && this.roomObjects.length > 0) {
            this.roomObjects = this.roomObjects.reduce((acc, modelObject) => {
                return [...acc, this.viewer.scene.getObjectByName(modelObject)];
            }, []);
        }
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
        const textureReplacementDuration = 200; //ms
        const startTime = new Date();
        this.body.classList.add("is-loading");
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
            this.objects.forEach((object) => {
                if (object.isMesh) {
                    object.material.map = materialObject.base;
                    object.material.map.wrapS = object.material.map.wrapT = THREE.RepeatWrapping;
                    object.material.map.repeat.set(scale, scale);
                    object.setDirty?.();
                }
            });

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
                        this.objects.forEach((object) => {
                            if (object.isMesh) {
                                this.tweakAppearanceSet(materialObject, scale, object);
                                object.setDirty?.();
                            }
                        });
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
    tweakAppearanceSet(materialObject, scale, object) {
        object.material.aoMap = materialObject.ao;
        object.material.normalMap = materialObject.norm;
        object.material.heightMap = materialObject.height || null;
        object.material.metalnessMap = materialObject.metal || null;
        object.material.roughnessMap = materialObject.rough;

        object.material.aoMap.wrapS = object.material.aoMap.wrapT = THREE.RepeatWrapping;
        object.material.roughnessMap.wrapS = object.material.roughnessMap.wrapT = THREE.RepeatWrapping;
        if (object.material.displacementMap) object.material.displacementMap.wrapS = object.material.displacementMap.wrapT = THREE.RepeatWrapping;
        if (object.material.normalMap) object.material.normalMap.wrapS = object.material.normalMap.wrapT = THREE.RepeatWrapping;
        if (object.material.metalnessMap) object.material.metalnessMap.wrapS = object.material.metalnessMap.wrapT = THREE.RepeatWrapping;
        if (object.material.heightMap) object.material.heightMap.wrapS = object.material.heightMap.wrapT = THREE.RepeatWrapping;

        object.material.aoMap.repeat.set(scale, scale);
        object.material.roughnessMap.repeat.set(scale, scale);
        if (object.material.displacementMap) object.material.displacementMap.repeat.set(scale, scale);
        if (object.material.normalMap) object.material.normalMap.repeat.set(scale, scale);
        if (object.material.metalnessMap) object.material.metalnessMap.repeat.set(scale, scale);
        if (object.material.heightMap) object.material.heightMap.repeat.set(scale, scale);
    }

    /**
     * Updates the material and objects after a texture has finished loading.
     *
     * @param {Date} startTime - The start time of the texture loading process.
     * @param {number} textureReplacementDuration - The duration it takes to replace the texture in milliseconds.
     */
    afterTextureLoad(startTime, textureReplacementDuration) {
        const endTime = new Date();
        const timeDiff = endTime - startTime; //in ms
        if (timeDiff < textureReplacementDuration) {
            setTimeout(() => {
                this.body.classList.remove("is-loading");
            }, textureReplacementDuration - timeDiff);
        } else {
            this.body.classList.remove("is-loading");
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

    toggleView() {
        if (this.viewLocked) {
            this.viewLocked = false;
            this.unlockView();
            return;
        }

        this.viewLocked = true;
        this.lockView();
    }

    lockView() {
        const camera = this.viewer.scene.activeCamera;

        const position = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
        };

        gsap.to(position, {
            x: 4.25,
            y: 0.15,
            z: 0,
            ease: "expo.inOut",
            duration: 2,
            onStart: () => {
                this.body.classList.remove("is-preview-hidden");
            },
            onComplete: () => {
                camera.setCameraOptions({ controlsEnabled: false });
            },
            onUpdate: () => {
                camera.position.set(position.x, position.y, position.z);
                camera.positionTargetUpdated();
            },
        });
    }

    unlockView() {
        const camera = this.viewer.scene.activeCamera;

        const position = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
        };

        gsap.to(position, {
            x: -6,
            y: 2,
            z: 5,
            ease: "expo.inOut",
            duration: 1.2,
            onStart: () => {
                this.body.classList.add("is-preview-hidden");
            },
            onComplete: () => {
                camera.setCameraOptions({ controlsEnabled: true });
            },
            onUpdate: () => {
                camera.position.set(position.x, position.y, position.z);
                camera.positionTargetUpdated();
            },
        });
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
