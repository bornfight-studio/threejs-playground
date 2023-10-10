import RingConfigurator from "./RingConfigurator";

export default class ModelConfiguratorWrapper {
    constructor() {
        this.DOM = {
            canvas: ".js-ring-configurator-viewer",
            options: ".js-ring-configurator-options",
            colors: ".js-ring-configurator-colors",
            colorOption: ".js-ring-configurator-color",
            states: {
                isActive: "is-active",
                isVisible: "is-visible",
            },
        };

        this.modelConfigurator = new RingConfigurator({
            elementClass: this.DOM.canvas,
            modelUrl: "../static/models/ring-v5.glb",
            ringOptions: window.ringOptions,
            mouseAnimation: false,
            onLoad: () => {
                this.init();
            },
            onProgress: (progress) => {
                console.log(progress);
            },
        });

        this.options = document.querySelector(this.DOM.options);
        this.colors = document.querySelectorAll(this.DOM.colors);
    }

    init() {
        if (this.colors && this.colors.length > 0) {
            this.colorController();
            this.keyboardShortcut();
        }
    }

    colorController() {
        this.colors.forEach((colorSet) => {
            const colorOptions = colorSet.querySelectorAll(this.DOM.colorOption);

            colorOptions.forEach((option, index) => {
                const baseColor = option.dataset.color;
                const modelObject = option.dataset.modelObject;

                if (!baseColor) return;

                option.addEventListener("click", (ev) => {
                    console.log("click");
                    this.setActiveClass(ev, colorOptions);
                    this.modelConfigurator.setModelColor(index + 1, baseColor, modelObject);
                });
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

    keyboardShortcut() {
        document.addEventListener("keyup", (ev) => {
            if (ev.keyCode === 79 && ev.altKey) {
                if (this.options.classList.contains(this.DOM.states.isVisible)) {
                    this.options.classList.remove(this.DOM.states.isVisible);
                } else {
                    this.options.classList.add(this.DOM.states.isVisible);
                }
            }
        });
    }
}
