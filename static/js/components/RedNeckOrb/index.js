import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

/* shaders */
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

import vertexPlaneShader from "./shaders/vertexPlane.glsl";
import fragmentPlaneShader from "./shaders/fragmentPlane.glsl";
import GuiSetup from "./GuiSetup";

export default class RedNeckOrb {
    constructor() {
        this.el = document.querySelector(".gl-container");

        if (!this.el) return;

        this.scene = null;
        this.renderer = null;

        this.guiSetup = new GuiSetup();

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
            this.guiSetup.initGui(
                this.el,
                this.camera,
                this.renderer,
                this.transformContainer,
                this.ball,
                this.sprite,
                this.scene,
                this.plane,
                this.sceneContainer,
                this.frustumSize,
                this.autoTime,
                this.areRandomizedSegments,
                this.ambient,
                this.directional,
                this.directional2,
                this.directional3,
                this.mainModel,
            );
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
            child.rotation.z += direction * (0.5 * dt); // Z instead of Y is here because we rotated it at creation
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
}
