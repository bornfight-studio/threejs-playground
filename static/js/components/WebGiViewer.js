import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import materialData from "../../materialData.json";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

export default class WebGiViewer {
    constructor() {
        this.DOM = {
            viewer: "#js-webgi-viewer",
            container: ".js-webgi-view-model",
            option: ".js-furniture-configurator-option",
            states: {
                isActive: "is-active",
            },
        };

        this.element = document.querySelector(this.DOM.viewer);
        this.modelContainer = document.querySelector(this.DOM.container);
        this.options = document.querySelectorAll(this.DOM.option);

        if (!this.element) return;

        if (history.scrollRestoration) {
            history.scrollRestoration = "manual";
        }

        this.element.addEventListener("initialized", () => {
            this.init();
        });
    }

    init() {
        const viewer = this.element.viewer;
        this.texture = new THREE.TextureLoader();
        this.modelObjects = JSON.parse(this.modelContainer.dataset.modelObjects);

        const cameraViews = viewer.plugins.CameraViews._cameraViews;

        const controller = viewer.scene.activeCamera;
        const camera = controller._camera;
        const importer = viewer.getManager().importer;
        const controls = controller.controls;

        this.window = {
            widthHalf: window.innerWidth / 2,
            heightHalf: window.innerHeight / 2,
        };

        importer.addEventListener("onProgress", (ev) => {
            console.log(`${(ev.loaded / ev.total) * 100}%`);
        });

        importer.addEventListener("onLoad", (ev) => {
            setTimeout(() => {
                // if (cameraViews.length > 0) {
                //     console.log("Loaded!");
                //
                //     cameraViews.forEach((view, key) => {
                //         this.animation(camera, view, key, controls);
                //     });
                //
                //     this.tilt(viewer);
                // }

                this.bla(viewer);
            }, 100);
        });
    }

    bla(viewer) {
        let materials = {};

        const scene = viewer.scene;
        const materialScale = this.modelContainer.dataset.materialScale;

        for (let material in materialData) {
            const materialObject = materialData[material];

            materials[material] = {};
            const materialMapObject = materialData[material];

            for (let materialMap in materialObject) {
                materials[material][materialMap] = this.texture.load(materialMapObject[materialMap]);
            }
        }

        const material = new THREE.MeshPhysicalMaterial({
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

        const objects = this.modelObjects.reduce((acc, modelObject) => {
            return [...acc, viewer.scene.getObjectByName(modelObject)];
        }, []);

        objects.forEach((object) => {
            object.castShadow = true;
            object.receiveShadow = true;
            object.material.color.convertSRGBToLinear();

            // initial material setup
            const geometry = new THREE.BoxGeometry(10, 10, 10);
            const cubematerial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const cube = new THREE.Mesh(geometry, cubematerial);
            viewer.scene.setDirty(cube);

            console.log(cube);
            if (object.isMesh) {
                // object.material = material;
            }
        });

        const sceneChildrens = viewer.scene.children[0].children[0].children;

        sceneChildrens.forEach((item) => {
            if (item.name === "pillow_left") {
                item.castShadow = true;
                item.recieveShadow = true;
            }

            if (item.name === "pillow_center") {
                item.castShadow = true;
                item.recieveShadow = true;
            }

            if (item.name === "pillow_right") {
                item.castShadow = true;
                item.recieveShadow = true;
            }
        });

        const setActiveClass = (ev) => {
            const clickedItem = ev.currentTarget;

            this.options.forEach((item) => {
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
                setActiveClass(ev);
                this.transformMaterial(index + 1, material, materials, materialScale, additionalScale);
            });
        });
    }

    tilt(viewer) {
        window.addEventListener("mousemove", (ev) => {
            // gsap.to(camera.rotation, {
            // y: (ev.clientX - this.window.widthHalf) * 0.00001,
            // });
            // console.log(ev.clientX, ev.clientY);
        });
    }

    animation(camera, view, key, controls) {
        const section = document.querySelector(`.js-webgi-camera-view-${key}`);

        if (!section) return;

        gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "bottom top",
                scrub: true,
                immediateRender: false,
            },
            onUpdate: () => {
                controls.update();
            },
        })
            .add("start")
            .to(
                camera.position,
                {
                    x: view.position.x,
                    y: view.position.y,
                    z: view.position.z,
                },
                "start",
            )
            .to(
                controls.target,
                {
                    x: view.target.x,
                    y: view.target.y,
                    z: view.target.z,
                },
                "start",
            );
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
        if (material.normalMap) material.normalMap.wrapS = material.normalMap.wrapT = THREE.RepeatWrapping;
        material.roughnessMap.wrapS = material.roughnessMap.wrapT = THREE.RepeatWrapping;

        material.map.repeat.set(scale, scale);
        material.aoMap.repeat.set(scale, scale);
        material.displacementMap.repeat.set(scale, scale);
        if (material.normalMap) material.normalMap.repeat.set(scale, scale);
        material.roughnessMap.repeat.set(scale, scale);
    }
}
