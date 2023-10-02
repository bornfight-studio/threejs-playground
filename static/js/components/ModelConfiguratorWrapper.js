import ModelConfigurator from "./ModelConfigurator";

export default class ModelConfiguratorWrapper {
    constructor() {
        this.DOM = {
            textureOptions: ".js-furniture-configurator-option",
            envLightOptions: ".js-furniture-configurator-light-option",
            states: {
                isActive: "is-active",
            },
        };

        this.modelConfigurator = new ModelConfigurator({
            elementClass: ".js-configurator-viewer",
            textureScale: 1,
            modelUrl: "../static/models/webgi-test-6.glb",
            envUrl: "https://dist.pixotronics.com/webgi/assets/hdr/gem_2.hdr",
            modelObjects: ["headrest_left", "headrest_right", "seat", "seat_left", "seat_right"],
            envLights: {
                neutral: "../static/models/lights/neutral.jpg",
                warm: "../static/models/lights/warm.jpg",
                cold: "../static/models/lights/cold.jpg",
            },
        });

        this.envLightOptions = document.querySelectorAll(this.DOM.envLightOptions);
        this.textureOptions = document.querySelectorAll(this.DOM.textureOptions);

        this.init();
    }

    init() {
        if (this.envLightOptions && this.envLightOptions.length > 0) {
            this.envLightController();
        }

        if (this.textureOptions && this.textureOptions.length > 0) {
            this.textureController();
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
            const additionalScale = parseFloat(option.dataset.additionalScale) || 1;

            option.addEventListener("click", (ev) => {
                this.setActiveClass(ev, this.textureOptions);
                this.modelConfigurator.setTexture(index + 1, additionalScale);
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
}
