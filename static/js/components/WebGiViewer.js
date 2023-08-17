import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default class WebGiViewer {
    constructor() {
        this.DOM = {
            viewer: "#js-webgi-viewer",
        };

        this.element = document.querySelector(this.DOM.viewer);

        if (!this.element) return;

        if (history.scrollRestoration) {
            history.scrollRestoration = "manual";
        }

        this.element.addEventListener("initialized", () => {
            this.init();
        });
    }

    init() {
        const viewer = this.element.viewer;

        const cameraViews = viewer.plugins.CameraViews._cameraViews;

        const controller = viewer.scene.activeCamera;
        const camera = controller._camera;
        const importer = viewer.getManager().importer;
        const controls = controller.controls;

        this.window = {
            widthHalf: window.innerWidth / 2,
            heightHalf: window.innerHeight / 2,
        };

        importer.addEventListener("onProgress", (ev) => {
            console.log(`${(ev.loaded / ev.total) * 100}%`);
        });

        importer.addEventListener("onLoad", (ev) => {
            setTimeout(() => {
                if (cameraViews.length > 0) {
                    console.log("Loaded!");

                    cameraViews.forEach((view, key) => {
                        this.animation(camera, view, key, controls);
                    });

                    this.tilt(viewer);
                }
            }, 100);
        });
    }

    tilt(viewer) {
        window.addEventListener("mousemove", (ev) => {
            // gsap.to(camera.rotation, {
            // y: (ev.clientX - this.window.widthHalf) * 0.00001,
            // });
            // console.log(ev.clientX, ev.clientY);
        });
    }

    animation(camera, view, key, controls) {
        const section = document.querySelector(`.js-webgi-camera-view-${key}`);

        if (!section) return;

        gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "bottom top",
                scrub: true,
                immediateRender: false,
            },
            onUpdate: () => {
                controls.update();
            },
        })
            .add("start")
            .to(
                camera.position,
                {
                    x: view.position.x,
                    y: view.position.y,
                    z: view.position.z,
                },
                "start",
            )
            .to(
                controls.target,
                {
                    x: view.target.x,
                    y: view.target.y,
                    z: view.target.z,
                },
                "start",
            );
    }
}
