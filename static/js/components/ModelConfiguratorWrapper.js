import ModelConfigurator from "./ModelConfigurator";
import gsap from "gsap";

export default class ModelConfiguratorWrapper {
    constructor() {
        this.DOM = {
            body: "body",
            canvas: ".js-configurator-viewer",
            roomToggle: ".js-configurator-viewer-toggle-room",
            viewToggle: ".js-configurator-viewer-toggle-view",
            textureOptions: ".js-furniture-configurator-option",
            texturePreview: ".js-furniture-configurator-preview",
            envLightOptions: ".js-furniture-configurator-light-option",
            loaderLine: ".js-configurator-viewer-loader-line",
            states: {
                isActive: "is-active",
            },
        };

        this.modelConfigurator = new ModelConfigurator({
            elementClass: this.DOM.canvas,
            hideRoom: true,
            textureScale: 1,
            modelUrl: "../static/models/one-seater-pxt-v13.glb",
            modelObjects: ["body"],
            roomObjects: [],
            textureAppearanceSets: window.textureAppearance,
            mouseAnimation: false,
            onLoad: () => {
                this.init();
            },
            onProgress: (progress) => {
                gsap.set(this.DOM.loaderLine, {
                    scaleX: progress / 100,
                });
            },
        });

        this.body = document.body;
        this.envLightOptions = document.querySelectorAll(this.DOM.envLightOptions);
        this.textureOptions = document.querySelectorAll(this.DOM.textureOptions);
        this.texturePreviews = document.querySelectorAll(this.DOM.texturePreview);
        this.roomToggle = document.querySelector(this.DOM.roomToggle);
        this.viewToggle = document.querySelector(this.DOM.viewToggle);
    }

    init() {
        if (this.envLightOptions && this.envLightOptions.length > 0) {
            this.envLightController();
        }

        if (this.textureOptions && this.textureOptions.length > 0) {
            this.textureController();
        }

        if (this.roomToggle) {
            this.roomToggleController();
        }

        if (this.viewToggle) {
            this.viewToggleController();
        }

        this.body.classList.add("is-loaded");
    }

    envLightController() {
        this.envLightOptions.forEach((option) => {
            const light = option.dataset.light || "neutral";

            option.addEventListener("click", (ev) => {
                this.setActiveClass(ev, this.envLightOptions);
                this.modelConfigurator.setEnvLight(light);
            });
        });
    }

    textureController() {
        this.textureOptions.forEach((option, index) => {
            const additionalScale = parseFloat(option.dataset.additionalScale);
            const baseTexture = option.dataset.textureBase;
            const textureAppearanceSet = option.dataset.textureAppearanceSet;

            if (!baseTexture || !textureAppearanceSet) return;

            option.addEventListener("click", (ev) => {
                this.setActiveClass(ev, this.textureOptions);
                this.setActivePreview(index, this.texturePreviews);
                this.modelConfigurator.setModelTexture(index + 1, additionalScale, baseTexture, textureAppearanceSet);
            });
        });

        const initialBaseTexture = this.textureOptions[0].dataset.textureBase || null;
        const initialTextureAppearanceSet = this.textureOptions[0].dataset.textureAppearanceSet;
        if (!initialBaseTexture || !initialTextureAppearanceSet) return;
        const initialScale = parseFloat(this.textureOptions[0].dataset.additionalScale);
        this.modelConfigurator.setModelTexture(1, initialScale, initialBaseTexture, initialTextureAppearanceSet);
    }

    setActivePreview(currentIndex, previews) {
        previews.forEach((preview) => {
            preview.classList.remove(this.DOM.states.isActive);
        });

        previews[currentIndex].classList.add(this.DOM.states.isActive);
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

    roomToggleController() {
        this.roomToggle.addEventListener("click", (ev) => {
            this.modelConfigurator.toggleRoom();
        });
    }

    viewToggleController() {
        this.viewToggle.addEventListener("click", (ev) => {
            this.modelConfigurator.toggleView();
        });
    }
}
