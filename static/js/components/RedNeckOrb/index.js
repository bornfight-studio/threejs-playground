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
        this.el = document.querySelector(".gl-container");

        if (!this.el) return;

        /* vars */
        this.scene = null;
        this.renderer = null;

        this.appW = this.el.clientWidth;
        this.appH = this.el.clientHeight;

        this.envMap = null;
        this.sceneContainer = null;
        this.mainModel = null;
        this.ball = null;
        this.sprite = null;
        this.plane = null;
        this.transformContainer = null;
        this.ambient = null;
        this.directional = null;
        this.directional2 = null;
        this.directional3 = null;
        this.frustumSize = 4.8;
        this.areRandomizedSegments = false;
        this.autoTime = true;

        this.setup();
    }

    handleResize() {
        this.appW = this.el.clientWidth;
        this.appH = this.el.clientHeight;
        this.aspect = this.appW / this.appH;

        this.camera.left = (-this.frustumSize * this.aspect) / 2;
        this.camera.right = (this.frustumSize * this.aspect) / 2;
        this.camera.top = this.frustumSize / 2;
        this.camera.bottom = -this.frustumSize / 2;
        this.camera.updateProjectionMatrix();

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.appW, this.appH);
    }

    setup() {
        const aspect = this.appW / this.appH;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#000000");
        this.camera = new THREE.OrthographicCamera(
            (this.frustumSize * aspect) / -2,
            (this.frustumSize * aspect) / 2,
            this.frustumSize / 2,
            this.frustumSize / -2,
            0.1,
            1000,
        );
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
        });

        this.clock = new THREE.Clock();

        this.renderer.setSize(this.appW, this.appH);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.el.appendChild(this.renderer.domElement);

        /* start point */
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.update();

        this.camera.position.set(0, 0, -5);
        this.camera.lookAt(0, 0, 0);

        /* scene container */
        this.sceneContainer = new THREE.Object3D();
        this.sceneContainer.position.x = 0;
        this.sceneContainer.rotation.y = THREE.MathUtils.degToRad(10);
        this.scene.add(this.sceneContainer);

        /* lights */
        this.addLights();

        /* add sprite */
        this.sprite = this.addSprite();
        this.sprite.scale.setScalar(2);
        this.sprite.position.z = 0;
        this.sceneContainer.add(this.sprite);

        /* init dot rings */
        this.mainModel = this.initMainModel();
        this.mainModel.position.set(0, 0, 0);
        this.mainModel.scale.setScalar(1.2);

        /* create transform container */
        this.transformContainer = new THREE.Object3D();
        this.transformContainer.rotation.z = THREE.MathUtils.degToRad(25);
        this.sceneContainer.add(this.transformContainer);
        this.transformContainer.add(this.mainModel);

        /* add plane */
        this.plane = this.addPlane(1, 1);
        this.plane.position.set(0, -1.2, 0);
        this.plane.scale.setScalar(10);
        this.plane.rotation.x = THREE.MathUtils.degToRad(65);
        this.sceneContainer.add(this.plane);

        /* HDR loader */
        const loader = new RGBELoader();
        loader.load(`../static/orb_assets/cayley_interior_1k.hdr`, (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.environment = texture;
            this.envMap = texture;

            /* init ball */
            this.ball = this.initBall();
            this.sceneContainer.add(this.ball);

            /* init gui */
            this.initGui();
        });

        /* start */
        window.addEventListener("resize", () => this.handleResize());
        this.run();
    }

    update() {
        let dt = this.clock.getDelta();
        let elapsed = this.clock.getElapsedTime();

        /* segments rotation */
        this.mainModel.children.forEach((child, index) => {
            let direction = this.areRandomizedSegments ? (index % 2 === 0 ? 1 : -1) : 1;
            child.rotation.z += direction * (0.5 * dt); // Z insted of Y is here because we rotated it at creation
        });

        /* uniform update */
        this.mainModel.children.forEach((child) => {
            child.material.uniforms.uTime.value = elapsed;
        });

        /* update plane uniforms */
        if (this.autoTime) {
            this.plane.material.uniforms.uTime.value = elapsed;
        }

        this.controls.update();
    }

    run() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.run());
    }

    draw() {
        this.renderer.render(this.scene, this.camera);
    }

    addPlane(width, height) {
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
                uFrustum: { value: this.frustumSize },
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

    addSprite() {
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

    addLights() {
        this.ambient = new THREE.AmbientLight(new THREE.Color("#ffffff"), 1);
        this.scene.add(this.ambient);

        this.directional = new THREE.DirectionalLight(new THREE.Color("#ffffff"), 3);
        this.directional.position.set(0, 200, 0);
        this.scene.add(this.directional);

        this.directional2 = new THREE.DirectionalLight(new THREE.Color("#ffffff"), 3);
        this.directional2.position.set(100, 200, 100);
        this.scene.add(this.directional2);

        this.directional3 = new THREE.DirectionalLight(new THREE.Color("#ffffff"), 3);
        this.directional3.position.set(-100, -200, -100);
        this.scene.add(this.directional3);
    }

    initBall() {
        const geom = new THREE.SphereGeometry(1, 64, 64);
        const mat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color("#84f2ff"),
            emissive: new THREE.Color("#7affc4"),
            emissiveIntensity: 1.0,
            roughness: 0.5,
            metalness: 0.9,
            clearcoat: 0,
            clearcoatRoughness: 0.1,
            envMap: this.envMap,
            envMapIntensity: 1,
            transparent: true,
            opacity: 1,
        });

        return new THREE.Mesh(geom, mat);
    }

    initMainModel() {
        const model = new THREE.Object3D();

        const numDots = 180;
        const decreaseByRow = 20;

        const scaleMap = [0.95, 0.89, 0.73, 0.575, 0.3];
        const positionStep = 0.175;

        const upSegments = 5,
            downSegments = 5;
        for (let index = 0; index < upSegments; index++) {
            const ring = this.createRing(numDots - (index + 1) * decreaseByRow);
            ring.scale.setScalar(scaleMap[index]);
            ring.position.y = (index + 1) * positionStep;
            model.add(ring);
        }

        /* add center 0,0,0 ring */
        const ring = this.createRing(numDots);
        ring.scale.setScalar(1);
        ring.position.y = 0.0;
        model.add(ring);

        for (let index = 0; index < downSegments; index++) {
            const ring = this.createRing(numDots - (index + 1) * decreaseByRow);
            ring.scale.setScalar(scaleMap[index]);
            ring.position.y = 0.0 - (index + 1) * positionStep;
            model.add(ring);
        }

        return model;
    }

    createRing(numPoints) {
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
                uFrustum: { value: this.frustumSize },
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

    /// GUI

    initGui() {
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
            toneMapping: this.renderer.toneMapping,
            outputColorSpace: this.renderer.outputColorSpace,

            /* transform container */
            dotSphereRotation: THREE.MathUtils.radToDeg(this.transformContainer.rotation.z),

            /* ball */
            baseColor: this.ball.material.color.getHex(),
            emissiveColor: this.ball.material.emissive.getHex(),
            emissiveIntensity: this.ball.material.emissiveIntensity,
            roughness: this.ball.material.roughness,
            metalness: this.ball.material.metalness,
            clearcoat: this.ball.material.clearcoat,
            clearcoatRoughness: this.ball.material.clearcoatRoughness,
            envMapIntensity: this.ball.material.envMapIntensity,
            opacity: this.ball.material.opacity,
            ballScale: this.ball.scale.x,

            /* scene */
            sceneBackgroundColor: this.scene.background.getHex(),
            scenePositionX: this.sceneContainer.position.x,
            scenePositionY: this.sceneContainer.position.y,
            cameraFrustum: this.frustumSize, // we are going with frustum and not position Z, because positions Z is irelevant on orthographic camera

            /* sprite */
            spriteScale: this.sprite.scale.x,
            positionZ: this.sprite.position.z,
            depthTest: this.sprite.material.depthTest,
            depthWrite: this.sprite.material.depthWrite,
            /* alpha: sprite.material.alphaTest */

            /* lights */
            ambientIntensity: this.ambient.intensity,
            ambientColor: this.ambient.color.getHex(),
            directional1Intensity: this.directional.intensity,
            directional1Color: this.directional.color.getHex(),
            directional2Intensity: this.directional2.intensity,
            directional2Color: this.directional2.color.getHex(),
            directional3Intensity: this.directional3.intensity,
            directional3Color: this.directional3.color.getHex(),

            /* shaders */
            uModifier: this.mainModel.children[0].material.uniforms.uModifier.value,
            uSineModify: this.mainModel.children[0].material.uniforms.uSineModify.value,
            uYStrech: this.mainModel.children[0].material.uniforms.uYStrech.value,
            uNear: this.mainModel.children[0].material.uniforms.uNear.value,
            uFar: this.mainModel.children[0].material.uniforms.uFar.value,
            uCamZ: this.mainModel.children[0].material.uniforms.uCamZ.value,
            areRandomizedSegments: this.areRandomizedSegments,

            /* segments */
            segment1: this.mainModel.children[10].material.uniforms.uYStrech.value,
            segment2: this.mainModel.children[9].material.uniforms.uYStrech.value,
            segment3: this.mainModel.children[8].material.uniforms.uYStrech.value,
            segment4: this.mainModel.children[7].material.uniforms.uYStrech.value,
            segment5: this.mainModel.children[6].material.uniforms.uYStrech.value,
            segment6: this.mainModel.children[5].material.uniforms.uYStrech.value,
            segment7: this.mainModel.children[0].material.uniforms.uYStrech.value,
            segment8: this.mainModel.children[1].material.uniforms.uYStrech.value,
            segment9: this.mainModel.children[2].material.uniforms.uYStrech.value,
            segment10: this.mainModel.children[3].material.uniforms.uYStrech.value,
            segment11: this.mainModel.children[4].material.uniforms.uYStrech.value,

            /* plane */
            uFrequency: this.plane.material.uniforms.uFrequency.value,
            uSpeed: this.plane.material.uniforms.uSpeed.value,
            uHeight: this.plane.material.uniforms.uHeight.value,
            uAnchorX: this.plane.material.uniforms.uAnchor.value.x,
            uAnchorY: this.plane.material.uniforms.uAnchor.value.y,
            uTime: this.plane.material.uniforms.uTime.value,
            AutoTime: this.autoTime,
        };

        /* renderer */
        rendererFolder.add(this.renderer, "toneMapping", {
            No: THREE.NoToneMapping,
            Linear: THREE.LinearToneMapping,
            Reinhard: THREE.ReinhardToneMapping,
            Cineon: THREE.CineonToneMapping,
            ACESFilmic: THREE.ACESFilmicToneMapping,
        });

        rendererFolder.add(this.renderer, "outputColorSpace", {
            LinearSRGB: THREE.LinearSRGBColorSpace,
            sRGB: THREE.SRGBColorSpace,
        });

        generalFolder
            .add(params, "dotSphereRotation", 0.0, 90.0)
            .step(0.01)
            .onChange((value) => {
                this.transformContainer.rotation.z = THREE.MathUtils.degToRad(value);
            });

        matFolder.addColor(params, "baseColor").onChange((value) => {
            this.ball.material.color.setHex(value);
        });
        matFolder.addColor(params, "emissiveColor").onChange((value) => {
            this.ball.material.emissive.setHex(value);
        });
        matFolder
            .add(params, "metalness", 0.0, 1.0)
            .step(0.01)
            .onChange(function (value) {
                this.ball.material.metalness = value;
            });
        matFolder
            .add(params, "roughness", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                this.ball.material.roughness = value;
            });
        matFolder
            .add(params, "clearcoat", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                this.ball.material.clearcoat = value;
            });
        matFolder
            .add(params, "clearcoatRoughness", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                this.ball.material.clearcoatRoughness = value;
            });
        matFolder
            .add(params, "envMapIntensity", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                this.ball.material.envMapIntensity = value;
            });
        matFolder
            .add(params, "opacity", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                this.ball.material.opacity = value;
            });
        matFolder
            .add(params, "ballScale", 0.0, 5.0)
            .step(0.01)
            .onChange((value) => {
                this.ball.scale.setScalar(value);
            });

        /* scene */
        sceneFolder.addColor(params, "sceneBackgroundColor").onChange((value) => {
            this.scene.background.setHex(value);
        });
        sceneFolder
            .add(params, "scenePositionX", -10.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                this.sceneContainer.position.x = value;
            });
        sceneFolder
            .add(params, "scenePositionY", -10.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                this.sceneContainer.position.y = value;
            });
        sceneFolder
            .add(params, "cameraFrustum", -10.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                this.frustumSize = value;
                this.mainModel.children.forEach((child) => {
                    child.material.uniforms.uFrustum.value = value;
                });
                this.plane.material.uniforms.uFrustum.value = value;
                this.handleResize();
            });

        /* sprite */
        spriteFolder
            .add(params, "spriteScale", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                this.sprite.scale.setScalar(value);
            });
        spriteFolder
            .add(params, "positionZ", -2.0, 2.0)
            .step(0.01)
            .onChange((value) => {
                this.sprite.position.z = value;
            });
        spriteFolder.add(params, "depthTest", false, true).onChange((value) => {
            this.sprite.material.depthTest = value;
        });
        spriteFolder.add(params, "depthWrite", false, true).onChange((value) => {
            this.sprite.material.depthWrite = value;
        });

        /* lights */
        lightFolder
            .add(params, "ambientIntensity", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                this.ambient.intensity = value;
            });
        lightFolder.addColor(params, "ambientColor").onChange((value) => {
            this.ambient.color.setHex(value);
        });
        lightFolder
            .add(params, "directional1Intensity", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                this.directional.intensity = value;
            });
        lightFolder.addColor(params, "directional1Color").onChange((value) => {
            this.directional.color.setHex(value);
        });
        lightFolder
            .add(params, "directional2Intensity", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                this.directional2.intensity = value;
            });
        lightFolder.addColor(params, "directional2Color").onChange((value) => {
            this.directional2.color.setHex(value);
        });
        lightFolder
            .add(params, "directional3Intensity", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                this.directional3.intensity = value;
            });
        lightFolder.addColor(params, "directional3Color").onChange((value) => {
            this.directional3.color.setHex(value);
        });

        /* shaders */
        shaderFolder
            .add(params, "uModifier", 0.0, 5.0)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children.forEach((child) => {
                    child.material.uniforms.uModifier.value = value;
                });
            });
        shaderFolder
            .add(params, "uSineModify", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children.forEach((child) => {
                    child.material.uniforms.uSineModify.value = value;
                });
            });
        shaderFolder
            .add(params, "uYStrech", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children.forEach((child) => {
                    child.material.uniforms.uYStrech.value = value;
                });
            });
        shaderFolder
            .add(params, "uNear", -5.0, 5.0)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children.forEach((child) => {
                    child.material.uniforms.uNear.value = value;
                });
            });
        shaderFolder
            .add(params, "uFar", -5.0, 5.0)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children.forEach((child) => {
                    child.material.uniforms.uFar.value = value;
                });
            });
        shaderFolder.add(params, "areRandomizedSegments", false, true).onChange((value) => {
            this.areRandomizedSegments = value;
        });

        /* segments */
        segmentsFolder
            .add(params, "segment1", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children[10].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment2", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children[9].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment3", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children[8].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment4", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children[7].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment5", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children[6].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment6", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children[5].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment7", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children[0].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment8", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children[1].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment9", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children[2].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment10", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children[3].material.uniforms.uYStrech.value = value;
            });
        segmentsFolder
            .add(params, "segment11", 0.0, 1.5)
            .step(0.01)
            .onChange((value) => {
                this.mainModel.children[4].material.uniforms.uYStrech.value = value;
            });

        /* plane */
        planeFolder
            .add(params, "uFrequency", 0.0, 50.0)
            .step(0.01)
            .onChange((value) => {
                this.plane.material.uniforms.uFrequency.value = value;
            });
        planeFolder
            .add(params, "uSpeed", 0.0, 2.0)
            .step(0.01)
            .onChange((value) => {
                this.plane.material.uniforms.uSpeed.value = value;
            });
        planeFolder
            .add(params, "uHeight", 0.0, 0.1)
            .step(0.001)
            .onChange((value) => {
                this.plane.material.uniforms.uHeight.value = value;
            });
        planeFolder
            .add(params, "uAnchorX", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                this.plane.material.uniforms.uAnchor.value.x = value;
            });
        planeFolder
            .add(params, "uAnchorY", 0.0, 1.0)
            .step(0.01)
            .onChange((value) => {
                this.plane.material.uniforms.uAnchor.value.y = value;
            });
        planeFolder
            .add(params, "uTime", 0.0, 10.0)
            .step(0.01)
            .onChange((value) => {
                if (!this.autoTime) {
                    this.plane.material.uniforms.uTime.value = value;
                }
            });
        planeFolder.add(params, "AutoTime", false, true).onChange((value) => {
            this.autoTime = value;
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
}
