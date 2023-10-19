import ModelConfigurator from "./ModelConfigurator";

export default class ModelConfiguratorWrapper {
    constructor() {
        this.DOM = {
            canvas: ".js-configurator-viewer",
            roomToggle: ".js-configurator-viewer-toggle-room",
            textureOptions: ".js-furniture-configurator-option",
            envLightOptions: ".js-furniture-configurator-light-option",
            states: {
                isActive: "is-active",
            },
        };

        this.modelConfigurator = new ModelConfigurator({
            elementClass: this.DOM.canvas,
            hideRoom: true,
            textureScale: 1,
            modelUrl: "../static/models/one-seater-pxt-v9.glb",
            modelObjects: ["body"],
            roomObjects: [],
            textureAppearanceSets: window.textureAppearance,
            mouseAnimation: false,
            onLoad: () => {
                this.init();
            },
            onProgress: (progress) => {
                console.log(progress);
            },
        });

        this.envLightOptions = document.querySelectorAll(this.DOM.envLightOptions);
        this.textureOptions = document.querySelectorAll(this.DOM.textureOptions);
        this.roomToggle = document.querySelector(this.DOM.roomToggle);
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
                this.modelConfigurator.setModelTexture(index + 1, additionalScale, baseTexture, textureAppearanceSet);
            });
        });

        const initialBaseTexture = this.textureOptions[0].dataset.textureBase || null;
        const initialTextureAppearanceSet = this.textureOptions[0].dataset.textureAppearanceSet;
        if (!initialBaseTexture || !initialTextureAppearanceSet) return;
        const initialScale = parseFloat(this.textureOptions[0].dataset.additionalScale);
        this.modelConfigurator.setModelTexture(1, initialScale, initialBaseTexture, initialTextureAppearanceSet);
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
}
