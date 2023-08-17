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

        importer.addEventListener("onProgress", (ev) => {
            console.log(`${(ev.loaded / ev.total) * 100}%`);
        });

        importer.addEventListener("onLoad", (ev) => {
            setTimeout(() => {
                if (cameraViews.length > 0) {
                    console.log("Loaded!");

                    // cameraViews.forEach((view, key) => {
                    //     this.animation(camera, view, key, controls);
                    // });

                    gsap.timeline({
                        scrollTrigger: {
                            trigger: ".js-webgi-camera-view",
                            start: "top top",
                            end: "bottom bottom",
                            scrub: 0.3,
                        },
                    })
                        .add("step-0")
                        .to(
                            camera.position,
                            {
                                x: cameraViews[0].position.x,
                                y: cameraViews[0].position.y,
                                z: cameraViews[0].position.z,
                            },
                            "step-0",
                        )
                        .to(
                            controls.target,
                            {
                                x: cameraViews[0].target.x,
                                y: cameraViews[0].target.y,
                                z: cameraViews[0].target.z,
                            },
                            "step-0",
                        )
                        .add("step-1")
                        .to(
                            camera.position,
                            {
                                x: cameraViews[1].position.x,
                                y: cameraViews[1].position.y,
                                z: cameraViews[1].position.z,
                            },
                            "step-1",
                        )
                        .to(
                            controls.target,
                            {
                                x: cameraViews[1].target.x,
                                y: cameraViews[1].target.y,
                                z: cameraViews[1].target.z,
                            },
                            "step-1",
                        )
                        .add("step-2")
                        .to(
                            camera.position,
                            {
                                x: cameraViews[2].position.x,
                                y: cameraViews[2].position.y,
                                z: cameraViews[2].position.z,
                            },
                            "step-2",
                        )
                        .to(
                            controls.target,
                            {
                                x: cameraViews[2].target.x,
                                y: cameraViews[2].target.y,
                                z: cameraViews[2].target.z,
                            },
                            "step-2",
                        )
                        .add("step-3")
                        .to(
                            camera.position,
                            {
                                x: cameraViews[3].position.x,
                                y: cameraViews[3].position.y,
                                z: cameraViews[3].position.z,
                            },
                            "step-3",
                        )
                        .to(
                            controls.target,
                            {
                                x: cameraViews[3].target.x,
                                y: cameraViews[3].target.y,
                                z: cameraViews[3].target.z,
                            },
                            "step-3",
                        )
                        .add("step-4")
                        .to(
                            camera.position,
                            {
                                x: cameraViews[4].position.x,
                                y: cameraViews[4].position.y,
                                z: cameraViews[4].position.z,
                            },
                            "step-4",
                        )
                        .to(
                            controls.target,
                            {
                                x: cameraViews[4].target.x,
                                y: cameraViews[4].target.y,
                                z: cameraViews[4].target.z,
                            },
                            "step-4",
                        );
                }
            }, 100);
        });
    }

    // animation(camera, view, key, controls) {
    //     const section = document.querySelector(`.js-webgi-camera-view-${key}`);
    //
    //     if (!section) return;
    //
    //     console.log(controls.target);
    //
    //     gsap.timeline({
    //         scrollTrigger: {
    //             trigger: section,
    //             start: "top top",
    //             end: "bottom top",
    //             scrub: true,
    //         },
    //     })
    //         .add("start")
    //         .to(
    //             camera.position,
    //             {
    //                 x: view.position.x,
    //                 y: view.position.y,
    //                 z: view.position.z,
    //             },
    //             "start",
    //         )
    //         .to(
    //             controls.target,
    //             {
    //                 x: view.target.x,
    //                 y: view.target.y,
    //                 z: view.target.z,
    //             },
    //             "start",
    //         );
    // }
}
