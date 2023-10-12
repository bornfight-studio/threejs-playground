import { ViewerApp, AssetManagerPlugin, addBasePlugins } from "webgi";
import * as THREE from "three";
import gsap from "gsap";

export default class RingConfigurator {
    constructor(options) {
        let _defaults = {
            elementClass: "",
            modelUrl: "",
            envUrl: "",
            mouseAnimation: false,
            onLoad: () => {},
            onProgress: () => {},
        };

        this.defaults = Object.assign({}, _defaults, options);

        this.onLoad = this.defaults.onLoad;
        this.onProgress = this.defaults.onProgress;

        this.element = document.querySelector(this.defaults.elementClass);

        if (!this.element) return;

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

            $this.importer = $this.manager.importer;

            await addBasePlugins($this.viewer);

            console.log($this.viewer.scene.activeCamera);
        }

        setupViewer().then((r) => {
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
        controls.minDistance = 2.5;
        controls.maxDistance = 20;
        controls.minZoom = 0;
        controls.maxZoom = 0;
        controls.minPolarAngle = 0.3;
        controls.maxPolarAngle = 1.6;
    }

    /**
     * Initializes the controller and sets up the materials and objects.
     */

    setModelColor(index, baseColor, modelObjects) {
        const objects = JSON.parse(modelObjects);

        objects.forEach((objectName) => {
            this.viewer.scene.traverse((child) => {
                if (child.isMesh && child.name === objectName) {
                    child.material.color.set(baseColor);
                    child.setDirty?.();
                }
            });
        });
    }

    setCameraPosition(cameraPosition) {
        const camera = this.viewer.scene.activeCamera;
        const position = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
        };
        gsap.to(position, {
            x: cameraPosition.x,
            y: cameraPosition.y,
            z: cameraPosition.z,
            ease: "expo.inOut",
            duration: 1.2,
            onStart: () => {
                camera.setCameraOptions({ controlsEnabled: false });
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
}
