export default class ModelViewer {
    constructor() {
        this.DOM = {
            modelViewer: "model-viewer#sofa",
            control: ".js-model-viewer-control",
        };

        this.modelViewer = document.querySelector(this.DOM.modelViewer);
        this.controls = document.querySelectorAll(this.DOM.control);
    }

    init() {
        if (this.modelViewer !== null) {
            console.log("modelViewer init()");

            this.modelViewer.addEventListener("load", () => {
                const model = this.modelViewer.model;
                console.log(model);
                console.log(model.materials);

                this.controls.forEach((control) => {
                    control.addEventListener("click", (ev) => {
                        const color = ev.currentTarget.dataset.color;
                        const [material] = model.materials;
                        material.pbrMetallicRoughness.setBaseColorFactor(color);
                    });
                });
            });
        }
    }
}
