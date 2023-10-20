import RingConfigurator from "./RingConfigurator";

export default class ModelConfiguratorWrapper {
    constructor() {
        this.DOM = {
            canvas: ".js-ring-configurator-viewer",
            options: ".js-ring-configurator-options",
            colors: ".js-ring-configurator-colors",
            colorOption: ".js-ring-configurator-color",
            screenshot: ".js-ring-configurator-screenshot",
            scene: ".js-ring-configurator-scene",
            engravingText: ".js-ring-configurator-engraving-text",
            states: {
                isActive: "is-active",
                isVisible: "is-visible",
            },
        };

        this.modelConfigurator = new RingConfigurator({
            elementClass: this.DOM.canvas,
            modelUrl: "../static/models/ring-v9.glb",
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
        this.engravingText = document.querySelector(this.DOM.engravingText);
        this.colors = document.querySelectorAll(this.DOM.colors);
        this.screenshot = document.querySelector(this.DOM.screenshot);
        this.scenes = document.querySelectorAll(this.DOM.scene);
    }

    init() {
        if (this.colors && this.colors.length > 0) {
            this.colorController();
            this.engravingController();
            this.keyboardShortcut();
            this.takeScreenshot("ring-configurator.png");
            this.sceneToggler();
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

    engravingController() {
        const text = this.engravingText.dataset.engravingText;
        const engravingObject = this.engravingText.dataset.engravingObject;

        this.modelConfigurator.setEngravingText(engravingObject, text);
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
        if (this.options.dataset.show === "false") {
            this.options.remove();
        }

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

    takeScreenshot(fileName) {
        const canvasElement = document.querySelector(this.DOM.canvas);
        const MIME_TYPE = "image/png";

        this.screenshot.addEventListener("click", () => {
            var imgURL = canvasElement.toDataURL(MIME_TYPE);

            var dlLink = document.createElement("a");
            dlLink.classList.add("is-visually-hidden");
            dlLink.download = fileName;
            dlLink.href = imgURL;
            dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(":");

            document.body.appendChild(dlLink);
            dlLink.click();
            document.body.removeChild(dlLink);
        });
    }

    sceneToggler() {
        this.scenes.forEach((scene) => {
            scene.addEventListener("click", (ev) => {
                this.setActiveClass(ev, this.scenes);

                const cameraPosition = JSON.parse(ev.currentTarget.dataset.cameraPosition);
                this.modelConfigurator.setCameraPosition(cameraPosition);
            });
        });
    }
}
