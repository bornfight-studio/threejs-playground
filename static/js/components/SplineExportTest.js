import gsap from "gsap";
import { Application } from "@splinetool/runtime";

export default class SplineExportTest {
    constructor() {
        this.data = {
            sections: ".js-spline-sections",
            canvas: ".js-spline-view-model",
            loader: ".js-spline-loader",
            splineCode: "https://prod.spline.design/EJkzcs8ToBJ36Mf5/scene.splinecode",
        };
    }

    init() {
        this.canvas = document.querySelector(this.data.canvas);
        this.sections = document.querySelector(this.data.sections);
        this.loader = document.querySelector(this.data.loader);

        if (!this.canvas) return;

        let counter = 0;
        let prevCounter = 0;
        let step = 0;
        let prevStep = 0;
        let direction = 1;
        let progress = 0;
        // 50 steps per section (100vh)
        const animationsSteps = 1000;

        window.addEventListener(
            "wheel",
            (ev) => {
                counter += 1;
                if (ev.deltaY > 0) {
                    direction = 1;
                } else if (ev.deltaY < 0) {
                    direction = -1;
                }
            },
            false,
        );

        const animate = () => {
            if (counter !== prevCounter) {
                step += direction;

                if (step < 0) step = 0;
                if (step > animationsSteps) step = animationsSteps;

                if (prevStep !== step) {
                    progress = (step / animationsSteps) * 100;

                    gsap.to(this.sections, {
                        yPercent: -progress,
                        duration: 0.3,
                        ease: "power0.out",
                    });

                    prevStep = step;
                }
            }

            prevCounter = counter;
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);

        const spline = new Application(this.canvas);
        spline.load(this.data.splineCode).then(() => {
            setTimeout(() => {
                gsap.to(this.loader, {
                    autoAlpha: 0,
                });
            }, 100);
        });
    }
}
