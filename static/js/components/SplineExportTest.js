import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Application } from "@splinetool/runtime";
import { log } from "three/nodes";

gsap.registerPlugin(ScrollTrigger);

export default class SplineExportTest {
    constructor() {
        this.data = {
            sections: ".js-spline-sections",
            canvas: ".js-spline-view-model",
            splineCode: "https://prod.spline.design/tGi1sJBIV7qbmMAH/scene.splinecode",
        };
    }

    init() {
        this.canvas = document.querySelector(this.data.canvas);
        this.sections = document.querySelector(this.data.sections);

        if (!this.canvas) return;

        let counter = 0;
        let oldCounter = 0;
        let step = 0;
        let direction = 1;
        let progress = 0;

        window.addEventListener("wheel", (ev) => {
            counter += 1;
            if (ev.deltaY > 0) {
                direction = 1;
            } else if (ev.deltaY < 0) {
                direction = -1;
            }
        });

        const animate = () => {
            if (counter !== oldCounter && step >= 0) {
                step += direction;

                if (step < 0) step = 0;
                if (step > 600) step = 600;

                progress = (step / 600) * 100;
                console.log(progress);

                this.sections.style.transform = `translateY(-${progress}%)`;
            }

            oldCounter = counter;
            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);

        const spline = new Application(this.canvas);
        spline.load(this.data.splineCode).then(() => {});
    }
}
