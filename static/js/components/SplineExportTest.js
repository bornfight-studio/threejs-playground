import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Application } from "@splinetool/runtime";

gsap.registerPlugin(ScrollTrigger);

export default class SplineExportTest {
    constructor() {
        this.data = {
            canvas: ".js-spline-view-model",
            splineCode: "https://prod.spline.design/tGi1sJBIV7qbmMAH/scene.splinecode",
        };
    }

    init() {
        this.canvas = document.querySelector(this.data.canvas);

        if (!this.canvas) return;

        const spline = new Application(this.canvas);
        spline.load(this.data.splineCode).then(() => {
            const obj = spline.findObjectByName("iPhone 14 Pro");

            console.log(obj.scroll);
            spline.canvas.addEventListener("onwheel", () => {
                console.log(123);
            });

            // move the object in 3D space
            // obj.position.z += 3000;
            // obj.position.x += 4000;
            // obj.position.y += 1000;
        });
    }
}
