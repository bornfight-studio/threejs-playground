import gsap from "gsap";
import { Application } from "@splinetool/runtime";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default class SplineExportTestV2 {
    constructor() {
        this.data = {
            wrapper: ".js-spline-export-v2",
            model: ".js-spline-model",
            modelSection: ".js-spline-model-section",
            loader: ".js-spline-loader",
        };
    }

    init() {
        this.wrapper = document.querySelector(this.data.wrapper);

        if (!this.wrapper) return;

        this.models = document.querySelectorAll(this.data.model);
        this.modelSections = document.querySelectorAll(this.data.modelSection);
        this.loader = document.querySelector(this.data.loader);
        this.activeModelKey = null;

        if (this.models.length < 1 || this.modelSections.length < 1) return;

        this.models.forEach((model, index) => {
            const key = model.dataset.key || "7DWG9hx9aiCQfJoQ";
            const spline = new Application(model);

            spline.load(`https://prod.spline.design/${key}/scene.splinecode`).then(() => {
                if (index === 0) {
                    setTimeout(() => {
                        gsap.to(this.loader, {
                            autoAlpha: 0,
                        });
                    }, 100);
                }

                if (this.models.length === index + 1) {
                    this.modelSections.forEach((section, index) => {
                        const modelKey = parseInt(section.dataset.model) - 1;
                        const model = this.models[modelKey];
                        const animationEnter = section.dataset.in || null;
                        const animationLeave = section.dataset.out || null;
                        const nextSectionSameModel = this.modelSections[index + 1]?.dataset.model === section.dataset.model;
                        const prevSectionSameModel = this.modelSections[index - 1]?.dataset.model === section.dataset.model;

                        ScrollTrigger.create({
                            trigger: section,
                            start: "top center",
                            end: "bottom center",
                            onEnter: () => {
                                if (this.activeModelKey !== modelKey) {
                                    this.activeModelKey = modelKey;
                                    this.controllerEnter(animationEnter, model);
                                }
                            },
                            onEnterBack: () => {
                                if (!nextSectionSameModel) {
                                    this.activeModelKey = modelKey;
                                    this.controllerEnter(animationEnter, model);
                                }
                            },
                            onLeave: () => {
                                if (!nextSectionSameModel) {
                                    this.controllerLeave(animationLeave, model);
                                }
                            },
                            onLeaveBack: () => {
                                if (this.activeModelKey === modelKey && !prevSectionSameModel) {
                                    this.controllerLeave(animationLeave, model);
                                }
                            },
                        });
                    });
                }
            });
        });
    }

    controllerLeave(type, model) {
        switch (type) {
            case "scale-max":
                this.animateLeave(model, 1.3);
                break;
            case "scale-min":
                this.animateLeave(model, 0);
                break;
            case "scale-normal":
                this.animateLeave(model, 1);
                break;
            case "alpha-normal":
                this.animateLeave(model, 1);
                break;
            case "alpha-min":
                this.animateLeave(model, 1);
                break;
            case "scale-left":
                this.animateLeave(model, 0.2, "30%", "30 deg");
                break;
            default:
                this.animateLeave(model, 1);
        }
    }

    controllerEnter(type, model) {
        switch (type) {
            case "scale-max":
                this.animateEnter(model, 1.3, 1);
                break;
            case "scale-min":
                this.animateEnter(model, 0, 1);
                break;
            case "scale-normal":
                this.animateEnter(model, 1, 1);
                break;
            case "alpha-normal":
                this.animateEnter(model, 1, 1);
                break;
            case "alpha-min":
                this.animateEnter(model, 1, 0);
                break;
            case "scale-left":
                this.animateEnter(model, 1, 1, "0%", "0deg");
                break;
            default:
                this.animateEnter(model, 1, 1);
        }
    }

    animateLeave(model, scale = 1, x, rotate) {
        if (!model) return;
        gsap.to(model, {
            autoAlpha: 0,
            scale: scale,
            // filter: "blur(100px)",
            duration: 0.7,
            x: x,
            rotate: rotate,
        });
    }

    animateEnter(model, scale = 1, autoAlpha = 1, x, rotate) {
        if (!model) return;
        gsap.to(model, {
            autoAlpha: autoAlpha,
            scale: scale,
            // filter: "blur(0px)",
            duration: 0.7,
            x: x,
            rotate: rotate,
        });
    }
}
