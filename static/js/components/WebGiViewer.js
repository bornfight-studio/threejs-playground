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

        const importer = viewer.getManager().importer;

        this.window = {
            widthHalf: window.innerWidth / 2,
            heightHalf: window.innerHeight / 2,
        };

        importer.addEventListener("onProgress", (ev) => {
            console.log(`${(ev.loaded / ev.total) * 100}%`);
        });

        importer.addEventListener("onLoad", (ev) => {
            setTimeout(() => {
                this.controller(viewer);
            }, 100);
        });
    }

    controller(viewer) {
        let materials = {};

        const materialScale = this.modelContainer.dataset.materialScale;

        const initialScale = this.options[0].dataset.additionalScale || materialScale;

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

        let mainMat = viewer.createPhysicalMaterial(material);

        const objects = this.modelObjects.reduce((acc, modelObject) => {
            return [...acc, viewer.scene.getObjectByName(modelObject)];
        }, []);

        objects.forEach((object) => {
            if (object.isMesh) {
                object.material = mainMat;
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
                this.transformMaterial(index + 1, material, materials, materialScale, additionalScale, viewer, objects, mainMat);
            });
        });
    }

    transformMaterial(index, material, materials, materialScale, additionalScale = 1, viewer, objects, mainMat) {
        const scale = materialScale * additionalScale;

        let mat = materials[`mat${index}`];

        console.log(mat);

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

        mainMat = viewer.createPhysicalMaterial(material);
        objects.forEach((object) => {
            if (object.isMesh) {
                object.material = mainMat;
                object.setDirty?.();
            }
        });
    }
}
