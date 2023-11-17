import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

/* shaders */
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

import vertexPlaneShader from "./shaders/vertexPlane.glsl";
import fragmentPlaneShader from "./shaders/fragmentPlane.glsl";

export default class RedNeckOrb {
    constructor() {
        const el = document.querySelector(".gl-container");

        if (!el) return;

        /* vars */
        let camera, renderer, scene, clock, controls, gui, aspect;

        let appW = el.clientWidth;
        let appH = el.clientHeight;

        let envMap;
        let mainModel, ball, sprite, plane, sceneContainer, transformContainer;
        let ambient, directional, directional2, directional3;
        let frustumSize = 4.8;
        let areRandomizedSegments = false;
        let autoTime = true;

        /* helper methods */

        /* createRing */
        function getRing(numPoints) {
            const geom = new THREE.CircleGeometry(1, numPoints);
            const mat = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                transparent: true,
                uniforms: {
                    uTime: { value: 0.0 },
                    uModifier: { value: 1.0 },
                    uSineModify: { value: 3.0 },
                    uYStrech: { value: 0.0 },
                    uNear: { value: 2.05 },
                    uFar: { value: 4.02 },
                    uCamZ: { value: -3.11 },
                    uFrustum: { value: frustumSize },
                },
            });

            /* buffer for storing indices */
            let indices = new Float32Array(geom.attributes.position.count);

            for (let i = 0; i < geom.attributes.position.count; i++) {
                indices[i] = i;
            }

            geom.setAttribute("index", new THREE.BufferAttribute(indices, 1));

            /* mat.depthTest = false; */
            const ring = new THREE.Points(geom, mat);
            ring.rotateX(THREE.MathUtils.degToRad(90));

            return ring;
        }

        function initMainModel() {
            const model = new THREE.Object3D();

            const numDots = 180;
            const decreaseByRow = 20;

            const scaleMap = [0.95, 0.89, 0.73, 0.575, 0.3];
            const positionStep = 0.175;

            const upSegments = 5,
                downSegments = 5;
            for (let index = 0; index < upSegments; index++) {
                const ring = getRing(numDots - (index + 1) * decreaseByRow);
                ring.scale.setScalar(scaleMap[index]);
                ring.position.y = (index + 1) * positionStep;
                model.add(ring);
            }

            /* add center 0,0,0 ring */
            const ring = getRing(numDots);
            ring.scale.setScalar(1);
            ring.position.y = 0.0;
            model.add(ring);

            for (let index = 0; index < downSegments; index++) {
                const ring = getRing(numDots - (index + 1) * decreaseByRow);
                ring.scale.setScalar(scaleMap[index]);
                ring.position.y = 0.0 - (index + 1) * positionStep;
                model.add(ring);
            }

            return model;
        }

        function initBall() {
            const geom = new THREE.SphereGeometry(1, 64, 64);
            const mat = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color("#84f2ff"),
                emissive: new THREE.Color("#7affc4"),
                emissiveIntensity: 1.0,
                roughness: 0.5,
                metalness: 0.9,
                clearcoat: 0,
                clearcoatRoughness: 0.1,
                envMap: envMap,
                envMapIntensity: 1,
                transparent: true,
                opacity: 1,
            });

            return new THREE.Mesh(geom, mat);
        }

        function addLights() {
            ambient = new THREE.AmbientLight(new THREE.Color("#ffffff"), 1);
            scene.add(ambient);

            directional = new THREE.DirectionalLight(new THREE.Color("#ffffff"), 3);
            directional.position.set(0, 200, 0);
            scene.add(directional);

            directional2 = new THREE.DirectionalLight(new THREE.Color("#ffffff"), 3);
            directional2.position.set(100, 200, 100);
            scene.add(directional2);

            directional3 = new THREE.DirectionalLight(new THREE.Color("#ffffff"), 3);
            directional3.position.set(-100, -200, -100);
            scene.add(directional3);
        }

        function initGui() {
            gui = new GUI();
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
                .onChange(function (value) {
                    transformContainer.rotation.z = THREE.MathUtils.degToRad(value);
                });

            matFolder.addColor(params, "baseColor").onChange(function (value) {
                ball.material.color.setHex(value);
            });
            matFolder.addColor(params, "emissiveColor").onChange(function (value) {
                ball.material.emissive.setHex(value);
            });
            matFolder
                .add(params, "metalness", 0.0, 1.0)
                .step(0.01)
                .onChange(function (value) {
                    ball.material.metalness = value;
                });
            matFolder
                .add(params, "roughness", 0.0, 1.0)
                .step(0.01)
                .onChange(function (value) {
                    ball.material.roughness = value;
                });
            matFolder
                .add(params, "clearcoat", 0.0, 1.0)
                .step(0.01)
                .onChange(function (value) {
                    ball.material.clearcoat = value;
                });
            matFolder
                .add(params, "clearcoatRoughness", 0.0, 1.0)
                .step(0.01)
                .onChange(function (value) {
                    ball.material.clearcoatRoughness = value;
                });
            matFolder
                .add(params, "envMapIntensity", 0.0, 1.0)
                .step(0.01)
                .onChange(function (value) {
                    ball.material.envMapIntensity = value;
                });
            matFolder
                .add(params, "opacity", 0.0, 1.0)
                .step(0.01)
                .onChange(function (value) {
                    ball.material.opacity = value;
                });
            matFolder
                .add(params, "ballScale", 0.0, 5.0)
                .step(0.01)
                .onChange(function (value) {
                    ball.scale.setScalar(value);
                });

            /* scene */
            sceneFolder.addColor(params, "sceneBackgroundColor").onChange(function (value) {
                scene.background.setHex(value);
            });
            sceneFolder
                .add(params, "scenePositionX", -10.0, 10.0)
                .step(0.01)
                .onChange(function (value) {
                    sceneContainer.position.x = value;
                });
            sceneFolder
                .add(params, "scenePositionY", -10.0, 10.0)
                .step(0.01)
                .onChange(function (value) {
                    sceneContainer.position.y = value;
                });
            sceneFolder
                .add(params, "cameraFrustum", -10.0, 10.0)
                .step(0.01)
                .onChange(function (value) {
                    frustumSize = value;
                    mainModel.children.forEach((child) => {
                        child.material.uniforms.uFrustum.value = value;
                    });
                    plane.material.uniforms.uFrustum.value = value;
                    handleResize();
                });

            /* sprite */
            spriteFolder
                .add(params, "spriteScale", 0.0, 10.0)
                .step(0.01)
                .onChange(function (value) {
                    sprite.scale.setScalar(value);
                });
            spriteFolder
                .add(params, "positionZ", -2.0, 2.0)
                .step(0.01)
                .onChange(function (value) {
                    sprite.position.z = value;
                });
            spriteFolder.add(params, "depthTest", false, true).onChange(function (value) {
                sprite.material.depthTest = value;
            });
            spriteFolder.add(params, "depthWrite", false, true).onChange(function (value) {
                sprite.material.depthWrite = value;
            });

            /* lights */
            lightFolder
                .add(params, "ambientIntensity", 0.0, 10.0)
                .step(0.01)
                .onChange(function (value) {
                    ambient.intensity = value;
                });
            lightFolder.addColor(params, "ambientColor").onChange(function (value) {
                ambient.color.setHex(value);
            });
            lightFolder
                .add(params, "directional1Intensity", 0.0, 10.0)
                .step(0.01)
                .onChange(function (value) {
                    directional.intensity = value;
                });
            lightFolder.addColor(params, "directional1Color").onChange(function (value) {
                directional.color.setHex(value);
            });
            lightFolder
                .add(params, "directional2Intensity", 0.0, 10.0)
                .step(0.01)
                .onChange(function (value) {
                    directional2.intensity = value;
                });
            lightFolder.addColor(params, "directional2Color").onChange(function (value) {
                directional2.color.setHex(value);
            });
            lightFolder
                .add(params, "directional3Intensity", 0.0, 10.0)
                .step(0.01)
                .onChange(function (value) {
                    directional3.intensity = value;
                });
            lightFolder.addColor(params, "directional3Color").onChange(function (value) {
                directional3.color.setHex(value);
            });

            /* shaders */
            shaderFolder
                .add(params, "uModifier", 0.0, 5.0)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children.forEach((child) => {
                        child.material.uniforms.uModifier.value = value;
                    });
                });
            shaderFolder
                .add(params, "uSineModify", 0.0, 10.0)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children.forEach((child) => {
                        child.material.uniforms.uSineModify.value = value;
                    });
                });
            shaderFolder
                .add(params, "uYStrech", 0.0, 1.0)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children.forEach((child) => {
                        child.material.uniforms.uYStrech.value = value;
                    });
                });
            shaderFolder
                .add(params, "uNear", -5.0, 5.0)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children.forEach((child) => {
                        child.material.uniforms.uNear.value = value;
                    });
                });
            shaderFolder
                .add(params, "uFar", -5.0, 5.0)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children.forEach((child) => {
                        child.material.uniforms.uFar.value = value;
                    });
                });
            shaderFolder.add(params, "areRandomizedSegments", false, true).onChange(function (value) {
                areRandomizedSegments = value;
            });

            /* segments */
            segmentsFolder
                .add(params, "segment1", 0.0, 1.5)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children[10].material.uniforms.uYStrech.value = value;
                });
            segmentsFolder
                .add(params, "segment2", 0.0, 1.5)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children[9].material.uniforms.uYStrech.value = value;
                });
            segmentsFolder
                .add(params, "segment3", 0.0, 1.5)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children[8].material.uniforms.uYStrech.value = value;
                });
            segmentsFolder
                .add(params, "segment4", 0.0, 1.5)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children[7].material.uniforms.uYStrech.value = value;
                });
            segmentsFolder
                .add(params, "segment5", 0.0, 1.5)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children[6].material.uniforms.uYStrech.value = value;
                });
            segmentsFolder
                .add(params, "segment6", 0.0, 1.5)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children[5].material.uniforms.uYStrech.value = value;
                });
            segmentsFolder
                .add(params, "segment7", 0.0, 1.5)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children[0].material.uniforms.uYStrech.value = value;
                });
            segmentsFolder
                .add(params, "segment8", 0.0, 1.5)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children[1].material.uniforms.uYStrech.value = value;
                });
            segmentsFolder
                .add(params, "segment9", 0.0, 1.5)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children[2].material.uniforms.uYStrech.value = value;
                });
            segmentsFolder
                .add(params, "segment10", 0.0, 1.5)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children[3].material.uniforms.uYStrech.value = value;
                });
            segmentsFolder
                .add(params, "segment11", 0.0, 1.5)
                .step(0.01)
                .onChange(function (value) {
                    mainModel.children[4].material.uniforms.uYStrech.value = value;
                });

            /* plane */
            planeFolder
                .add(params, "uFrequency", 0.0, 50.0)
                .step(0.01)
                .onChange(function (value) {
                    plane.material.uniforms.uFrequency.value = value;
                });
            planeFolder
                .add(params, "uSpeed", 0.0, 2.0)
                .step(0.01)
                .onChange(function (value) {
                    plane.material.uniforms.uSpeed.value = value;
                });
            planeFolder
                .add(params, "uHeight", 0.0, 0.1)
                .step(0.001)
                .onChange(function (value) {
                    plane.material.uniforms.uHeight.value = value;
                });
            planeFolder
                .add(params, "uAnchorX", 0.0, 1.0)
                .step(0.01)
                .onChange(function (value) {
                    plane.material.uniforms.uAnchor.value.x = value;
                });
            planeFolder
                .add(params, "uAnchorY", 0.0, 1.0)
                .step(0.01)
                .onChange(function (value) {
                    plane.material.uniforms.uAnchor.value.y = value;
                });
            planeFolder
                .add(params, "uTime", 0.0, 10.0)
                .step(0.01)
                .onChange(function (value) {
                    if (!autoTime) {
                        plane.material.uniforms.uTime.value = value;
                    }
                });
            planeFolder.add(params, "AutoTime", false, true).onChange(function (value) {
                autoTime = value;
            });

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

        function addSprite() {
            const map = new THREE.TextureLoader().load(`../static/orb_assets/sprite.svg`);
            map.colorSpace = THREE.SRGBColorSpace;
            map.minFilter = THREE.NearestMipmapLinearFilter;
            map.magFilter = THREE.NearestFilter;

            const material = new THREE.SpriteMaterial({
                map: map,
                transparent: true,
                opacity: 1,
                blending: THREE.NormalBlending,
                depthTest: true,
                depthWrite: false,
            });

            return new THREE.Sprite(material);
        }

        function addPlane(width, height) {
            const geometry = new THREE.PlaneGeometry(width, height, 128, 128);
            const material = new THREE.ShaderMaterial({
                vertexShader: vertexPlaneShader,
                fragmentShader: fragmentPlaneShader,
                uniforms: {
                    uTime: { value: 0.0 },
                    uSpeed: { value: 0.1 },
                    uFrequency: { value: 36.0 },
                    uHeight: { value: 0.02 },
                    uAnchor: { value: new THREE.Vector2(0.5, 0.5) },
                    uFrustum: { value: frustumSize },
                },
            });

            /* buffer for storing indices */
            let indices = new Float32Array(geometry.attributes.position.count);
            for (let i = 0; i < geometry.attributes.position.count; i++) {
                indices[i] = i;
            }
            geometry.setAttribute("index", new THREE.BufferAttribute(indices, 1));

            return new THREE.Points(geometry, material);
        }

        /* setup everything */
        function setup() {
            aspect = appW / appH;

            scene = new THREE.Scene();
            scene.background = new THREE.Color("#000000");
            camera = new THREE.OrthographicCamera(
                (frustumSize * aspect) / -2,
                (frustumSize * aspect) / 2,
                frustumSize / 2,
                frustumSize / -2,
                0.1,
                1000,
            );
            renderer = new THREE.WebGLRenderer({
                antialias: true,
            });
            clock = new THREE.Clock();

            renderer.setSize(appW, appH);
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.outputColorSpace = THREE.SRGBColorSpace;
            renderer.toneMapping = THREE.LinearToneMapping;
            el.appendChild(renderer.domElement);

            /* start point */
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.update();

            camera.position.set(0, 0, -5);
            camera.lookAt(0, 0, 0);

            /* scene container */
            sceneContainer = new THREE.Object3D();
            sceneContainer.position.x = 0;
            sceneContainer.rotation.y = THREE.MathUtils.degToRad(10);
            scene.add(sceneContainer);

            /* lights */
            addLights();

            /* add sprite */
            sprite = addSprite();
            sprite.scale.setScalar(2);
            sprite.position.z = 0;
            sceneContainer.add(sprite);

            /* init dot rings */
            mainModel = initMainModel();
            mainModel.position.set(0, 0, 0);
            mainModel.scale.setScalar(1.2);

            /* create transform container */
            transformContainer = new THREE.Object3D();
            transformContainer.rotation.z = THREE.MathUtils.degToRad(25);
            sceneContainer.add(transformContainer);
            transformContainer.add(mainModel);

            /* add plane */
            plane = addPlane(1, 1);
            plane.position.set(0, -1.2, 0);
            plane.scale.setScalar(10);
            plane.rotation.x = THREE.MathUtils.degToRad(65);
            sceneContainer.add(plane);

            /* HDR loader */
            const loader = new RGBELoader();
            loader.load(`../static/orb_assets/cayley_interior_1k.hdr`, (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                scene.environment = texture;
                envMap = texture;

                /* init ball */
                ball = initBall();
                sceneContainer.add(ball);

                /* init gui */
                initGui();
            });

            /* start */
            window.addEventListener("resize", handleResize);
            run();
        }

        /* handle resize */
        function handleResize() {
            appW = el.clientWidth;
            appH = el.clientHeight;
            aspect = appW / appH;

            camera.left = (-frustumSize * aspect) / 2;
            camera.right = (frustumSize * aspect) / 2;
            camera.top = frustumSize / 2;
            camera.bottom = -frustumSize / 2;
            camera.updateProjectionMatrix();

            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(appW, appH);
        }

        /* main update function */
        function update() {
            let dt = clock.getDelta();
            let elapsed = clock.getElapsedTime();

            /* segments rotation */
            mainModel.children.forEach((child, index) => {
                let direction = areRandomizedSegments ? (index % 2 === 0 ? 1 : -1) : 1;
                child.rotation.z += direction * (0.5 * dt); // Z insted of Y is here because we rotated it at creation
            });

            /* uniform update */
            mainModel.children.forEach((child) => {
                child.material.uniforms.uTime.value = elapsed;
            });

            /* update plane uniforms */
            if (autoTime) {
                plane.material.uniforms.uTime.value = elapsed;
            }

            controls.update();
        }

        /* main draw function */
        function draw() {
            renderer.render(scene, camera);
        }

        /* run all */
        function run() {
            update();
            draw();
            requestAnimationFrame(run);
        }

        setup();
    }
}
