import * as THREE from "three";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

export default class GuiSetup {
    constructor() {}

    initGui(
        element,
        camera,
        renderer,
        transformContainer,
        ball,
        sprite,
        scene,
        plane,
        sceneContainer,
        frustumSize,
        autoTime,
        areRandomizedSegments,
        ambient,
        directional,
        directional2,
        directional3,
        mainModel,
    ) {
        const gui = new GUI();
        const generalFolder = gui.addFolder("General");
        const rendererFolder = gui.addFolder("Renderer");
        const matFolder = gui.addFolder("Material");
        const sceneFolder = gui.addFolder("Scene");
        const spriteFolder = gui.addFolder("Sprite");
        const lightFolder = gui.addFolder("Lights");
        const shaderFolder = gui.addFolder("Shaders");
        const segmentsFolder = gui.addFolder("Segments");
        const planeFolder = gui.addFolder("Plane");

        const params = {
            /* renderer */
            toneMapping: renderer.toneMapping,
            outputColorSpace: renderer.outputColorSpace,

            /* transform container */
            dotSphereRotation: THREE.MathUtils.radToDeg(transformContainer.rotation.z),

            /* ball */
            baseColor: ball.material.color.getHex(),
            emissiveColor: ball.material.emissive.getHex(),
            emissiveIntensity: ball.material.emissiveIntensity,
            roughness: ball.material.roughness,
            metalness: ball.material.metalness,
            clearcoat: ball.material.clearcoat,
            clearcoatRoughness: ball.material.clearcoatRoughness,
            envMapIntensity: ball.material.envMapIntensity,
            opacity: ball.material.opacity,
            ballScale: ball.scale.x,

            /* scene */
            sceneBackgroundColor: scene.background.getHex(),
            scenePositionX: sceneContainer.position.x,
            scenePositionY: sceneContainer.position.y,
            cameraFrustum: frustumSize, // we are going with frustum and not position Z, because positions Z is irelevant on orthographic camera

            /* sprite */
            spriteScale: sprite.scale.x,
            positionZ: sprite.position.z,
            depthTest: sprite.material.depthTest,
            depthWrite: sprite.material.depthWrite,
            /* alpha: sprite.material.alphaTest */

            /* lights */
            ambientIntensity: ambient.intensity,
            ambientColor: ambient.color.getHex(),
            directional1Intensity: directional.intensity,
            directional1Color: directional.color.getHex(),
            directional2Intensity: directional2.intensity,
            directional2Color: directional2.color.getHex(),
            directional3Intensity: directional3.intensity,
            directional3Color: directional3.color.getHex(),

            /* shaders */
            uModifier: mainModel.children[0].material.uniforms.uModifier.value,
            uSineModify: mainModel.children[0].material.uniforms.uSineModify.value,
            uYStrech: mainModel.children[0].material.uniforms.uYStrech.value,
            uNear: mainModel.children[0].material.uniforms.uNear.value,
            uFar: mainModel.children[0].material.uniforms.uFar.value,
            uCamZ: mainModel.children[0].material.uniforms.uCamZ.value,
            areRandomizedSegments: areRandomizedSegments,

            /* segments */
            segment1: mainModel.children[10].material.uniforms.uYStrech.value,
            segment2: mainModel.children[9].material.uniforms.uYStrech.value,
            segment3: mainModel.children[8].material.uniforms.uYStrech.value,
            segment4: mainModel.children[7].material.uniforms.uYStrech.value,
            segment5: mainModel.children[6].material.uniforms.uYStrech.value,
            segment6: mainModel.children[5].material.uniforms.uYStrech.value,
            segment7: mainModel.children[0].material.uniforms.uYStrech.value,
            segment8: mainModel.children[1].material.uniforms.uYStrech.value,
            segment9: mainModel.children[2].material.uniforms.uYStrech.value,
            segment10: mainModel.children[3].material.uniforms.uYStrech.value,
            segment11: mainModel.children[4].material.uniforms.uYStrech.value,

            /* plane */
            uFrequency: plane.material.uniforms.uFrequency.value,
            uSpeed: plane.material.uniforms.uSpeed.value,
            uHeight: plane.material.uniforms.uHeight.value,
            uAnchorX: plane.material.uniforms.uAnchor.value.x,
            uAnchorY: plane.material.uniforms.uAnchor.value.y,
            uTime: plane.material.uniforms.uTime.value,
            AutoTime: autoTime,
        };

        /* renderer */
        rendererFolder.add(renderer, "toneMapping", {
            No: THREE.NoToneMapping,
            Linear: THREE.LinearToneMapping,
            Reinhard: THREE.ReinhardToneMapping,
            Cineon: THREE.CineonToneMapping,
            ACESFilmic: THREE.ACESFilmicToneMapping,
        });

        rendererFolder.add(renderer, "outputColorSpace", {
            LinearSRGB: THREE.LinearSRGBColorSpace,
            sRGB: THREE.SRGBColorSpace,
        });

        generalFolder
            .add(params, "dotSphereRotation", 0.0, 90.0)
            .step(0.01)
            .onChange((value) => {
                transformContainer.rotation.z = THREE.MathUtils.degToRad(value);
            });

        matFolder.addColor(params, "baseColor").onChange((value) => {
            ball.material.color.setHex(value);
        });
        matFolder.addColor(params, "emissiveColor").onChange((value) => {
            ball.material.emissive.setHex(value);
        });
        matFolder
            .add(params, "metalness", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                ball.material.metalness = value;
            });
        matFolder
            .add(params, "roughness", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                ball.material.roughness = value;
            });
        matFolder
            .add(params, "clearcoat", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                ball.material.clearcoat = value;
            });
        matFolder
            .add(params, "clearcoatRoughness", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                ball.material.clearcoatRoughness = value;
            });
        matFolder
            .add(params, "envMapIntensity", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                ball.material.envMapIntensity = value;
            });
        matFolder
            .add(params, "opacity", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                ball.material.opacity = value;
            });
        matFolder
            .add(params, "ballScale", 0.0, 5.0)
            .step(0.01)
            .onChange((value) => {
                ball.scale.setScalar(value);
            });

        /* scene */
        sceneFolder.addColor(params, "sceneBackgroundColor").onChange((value) => {
            scene.background.setHex(value);
        });
        sceneFolder
            .add(params, "scenePositionX", -10.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                sceneContainer.position.x = value;
            });
        sceneFolder
            .add(params, "scenePositionY", -10.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                sceneContainer.position.y = value;
            });
        sceneFolder
            .add(params, "cameraFrustum", -10.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                frustumSize = value;
                mainModel.children.forEach((child) => {
                    child.material.uniforms.uFrustum.value = value;
                });
                plane.material.uniforms.uFrustum.value = value;
                this.handleResize(element, camera, frustumSize, renderer);
            });

        /* sprite */
        spriteFolder
            .add(params, "spriteScale", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                sprite.scale.setScalar(value);
            });
        spriteFolder
            .add(params, "positionZ", -2.0, 2.0)
            .step(0.01)
            .onChange((value) => {
                sprite.position.z = value;
            });
        spriteFolder.add(params, "depthTest", false, true).onChange((value) => {
            sprite.material.depthTest = value;
        });
        spriteFolder.add(params, "depthWrite", false, true).onChange((value) => {
            sprite.material.depthWrite = value;
        });

        /* lights */
        lightFolder
            .add(params, "ambientIntensity", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                ambient.intensity = value;
            });
        lightFolder.addColor(params, "ambientColor").onChange((value) => {
            ambient.color.setHex(value);
        });
        lightFolder
            .add(params, "directional1Intensity", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                directional.intensity = value;
            });
        lightFolder.addColor(params, "directional1Color").onChange((value) => {
            directional.color.setHex(value);
        });
        lightFolder
            .add(params, "directional2Intensity", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                directional2.intensity = value;
            });
        lightFolder.addColor(params, "directional2Color").onChange((value) => {
            directional2.color.setHex(value);
        });
        lightFolder
            .add(params, "directional3Intensity", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                directional3.intensity = value;
            });
        lightFolder.addColor(params, "directional3Color").onChange((value) => {
            directional3.color.setHex(value);
        });

        /* shaders */
        shaderFolder
            .add(params, "uModifier", 0.0, 5.0)
            .step(0.01)
            .onChange((value) => {
                mainModel.children.forEach((child) => {
                    child.material.uniforms.uModifier.value = value;
                });
            });
        shaderFolder
            .add(params, "uSineModify", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                mainModel.children.forEach((child) => {
                    child.material.uniforms.uSineModify.value = value;
                });
            });
        shaderFolder
            .add(params, "uYStrech", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                mainModel.children.forEach((child) => {
                    child.material.uniforms.uYStrech.value = value;
                });
            });
        shaderFolder
            .add(params, "uNear", -5.0, 5.0)
            .step(0.01)
            .onChange((value) => {
                mainModel.children.forEach((child) => {
                    child.material.uniforms.uNear.value = value;
                });
            });
        shaderFolder
            .add(params, "uFar", -5.0, 5.0)
            .step(0.01)
            .onChange((value) => {
                mainModel.children.forEach((child) => {
                    child.material.uniforms.uFar.value = value;
                });
            });
        // shaderFolder.add(params, "areRandomizedSegments").onChange((value) => {
        //     areRandomizedSegments = value;
        // });

        /* segments */
        segmentsFolder
            .add(params, "segment1", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                mainModel.children[10].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment2", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                mainModel.children[9].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment3", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                mainModel.children[8].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment4", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                mainModel.children[7].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment5", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                mainModel.children[6].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment6", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                mainModel.children[5].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment7", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                mainModel.children[0].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment8", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                mainModel.children[1].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment9", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                mainModel.children[2].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment10", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                mainModel.children[3].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment11", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                mainModel.children[4].material.uniforms.uYStrech.value = value;
            });

        /* plane */
        planeFolder
            .add(params, "uFrequency", 0.0, 50.0)
            .step(0.01)
            .onChange((value) => {
                plane.material.uniforms.uFrequency.value = value;
            });
        planeFolder
            .add(params, "uSpeed", 0.0, 2.0)
            .step(0.01)
            .onChange((value) => {
                plane.material.uniforms.uSpeed.value = value;
            });
        planeFolder
            .add(params, "uHeight", 0.0, 0.1)
            .step(0.001)
            .onChange((value) => {
                plane.material.uniforms.uHeight.value = value;
            });
        planeFolder
            .add(params, "uAnchorX", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                plane.material.uniforms.uAnchor.value.x = value;
            });
        planeFolder
            .add(params, "uAnchorY", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                plane.material.uniforms.uAnchor.value.y = value;
            });
        planeFolder
            .add(params, "uTime", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                if (!autoTime) {
                    plane.material.uniforms.uTime.value = value;
                }
            });
        // planeFolder.add(params, "AutoTime", false, true).onChange((value) => {
        //     autoTime = value;
        // });

        generalFolder.close();
        rendererFolder.close();
        matFolder.close();
        sceneFolder.close();
        spriteFolder.close();
        lightFolder.close();
        shaderFolder.close();
        segmentsFolder.close();
        gui.close();
    }

    handleResize(el, camera, frustumSize, renderer) {
        const appW = el.clientWidth;
        const appH = el.clientHeight;
        const aspect = appW / appH;

        camera.left = (-frustumSize * aspect) / 2;
        camera.right = (frustumSize * aspect) / 2;
        camera.top = frustumSize / 2;
        camera.bottom = -frustumSize / 2;
        camera.updateProjectionMatrix();

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(appW, appH);
    }
}
