import gsap from "gsap";
import { Application } from "@splinetool/runtime";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default class SplineExportTestV3 {
    constructor() {
        this.data = {
            wrapper: ".js-spline-export-v3",
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
                    this.onLoad();
                }
            });
        });
    }

    onLoad() {
        setTimeout(() => {
            let [, ...rest] = this.models;
            gsap.set(this.models[0], {
                // autoAlpha: 1,
            });
            gsap.set(rest, {
                autoAlpha: 0,
            });
        }, 10);

        this.modelSections.forEach((section) => {
            const modelKey = parseInt(section.dataset.model) - 1;
            const model = this.models[modelKey];
            const animationIn = JSON.parse(section.dataset.in) || null;
            const animationOut = JSON.parse(section.dataset.out) || null;

            this.animation(section, model, animationIn, animationOut);
        });
    }

    animation(section, model, animationIn, animationOut) {
        animationIn[1].duration = 0.4;
        animationIn[1].ease = "power0.out";

        animationOut[1].duration = 0.4;
        animationOut[1].delay = 0.2;
        animationOut[1].ease = "power0.in";

        if (!model) return;
        const tl = gsap
            .timeline({
                scrollTrigger: {
                    trigger: section,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: true,
                },
            })
            .fromTo(model, animationIn[0], animationIn[1])
            .fromTo(model, animationOut[0], animationOut[1]);

        ScrollTrigger.refresh();
    }
}
