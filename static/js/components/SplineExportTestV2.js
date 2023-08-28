import gsap from "gsap";
import { Application } from "@splinetool/runtime";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default class SplineExportTestV2 {
    constructor() {
        this.data = {
            model: ".js-spline-model",
            modelSection: ".js-spline-model-section",
            loader: ".js-spline-loader",
        };
    }

    init() {
        this.models = document.querySelectorAll(this.data.model);
        this.modelSections = document.querySelectorAll(this.data.modelSection);
        this.loader = document.querySelector(this.data.loader);

        if (this.models.length < 1 || this.modelSections.length < 1) return;

        this.modelSections.forEach((section, index) => {
            const model = this.models[index];

            const spline = new Application(model);
            const key = model.dataset.key || "7DWG9hx9aiCQfJoQ";
            const animationEnter = model.dataset.in || null;
            const animationLeave = model.dataset.out || null;

            if (animationLeave) {
                //     this.controller(animationLeave, animationEnter, model);
            }

            ScrollTrigger.create({
                trigger: section,
                start: "top center",
                end: "bottom center",
                onEnter: () => {
                    this.controllerEnter(animationEnter, model);
                    if (index === 0) console.log(1);
                },
                onEnterBack: () => {
                    this.controllerEnter(animationEnter, model);
                    if (index === 0) console.log(2);
                },
                onLeave: () => {
                    this.controllerLeave(animationLeave, model);
                    if (index === 0) console.log(3);
                },
                onLeaveBack: () => {
                    this.controllerLeave(animationLeave, model);
                    if (index === 0) console.log(4);
                },
            });

            spline.load(`https://prod.spline.design/${key}/scene.splinecode`).then(() => {
                if (index === 0) {
                    setTimeout(() => {
                        gsap.to(this.loader, {
                            autoAlpha: 0,
                        });
                    }, 100);
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
            default:
                this.animateEnter(model, 1, 1);
        }
    }

    animateLeave(model, scale = 1) {
        if (!model) return;
        gsap.to(model, {
            autoAlpha: 0,
            scale: scale,
            filter: "blur(100px)",
            duration: 0.7,
            // scrollTrigger: {
            //     trigger: model,
            //     start: "top top",
            //     end: "bottom top",
            //     scrub: true,
            //     pin: true,
            // },
        });
    }

    animateEnter(model, scale = 1, autoAlpha = 1) {
        if (!model) return;
        gsap.to(model, {
            autoAlpha: autoAlpha,
            scale: scale,
            filter: "blur(0px)",
            duration: 0.7,
            // scrollTrigger: {
            //     trigger: model,
            //     start: "top bottom",
            //     end: "top top",
            //     scrub: true,
            // },
        });
    }
}
