import * as THREE from "three";

import Stats from "three/addons/libs/stats.module.js";

import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";

export default class MarchingOrb {
    constructor() {
        this.DOM = {
            container: ".js-marching-orb",
        };

        this.container = document.querySelector(this.DOM.container);

        this.stats = null;

        this.camera = null;
        this.scene = null;
        this.renderer = null;

        this.numOfBalls = 10;

        this.light = null;
        this.pointLight = null;
        this.ambientLight = null;

        this.effect = null;
        this.resolution = null;

        this.effectController = null;

        this.time = 0;

        this.clock = new THREE.Clock();

        if (this.container !== null) {
            console.log("MarchingOrb init()");
            this.init();
            this.animate();
        }
    }

    init() {
        // CAMERA
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 50);
        this.camera.position.set(0, 0, 25);

        // SCENE
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);

        // LIGHTS
        this.light = new THREE.DirectionalLight(0xffffff, 3);
        this.light.position.set(0.5, 0.5, 1);
        this.scene.add(this.light);

        this.pointLight = new THREE.PointLight(0xff7c00, 3, 0, 0);
        this.pointLight.position.set(0, 0, 100);
        this.scene.add(this.pointLight);

        this.ambientLight = new THREE.AmbientLight(0x323232, 3);
        this.scene.add(this.ambientLight);

        // MATERIAL
        const material = new THREE.MeshPhysicalMaterial({
            roughness: 0.1,
            transmission: 1,
            color: 0xffffff,
            thickness: 0.5,
            reflectivity: 0.5,
        });

        const new2material = new THREE.MeshPhongMaterial({
            color: 0x2a9cb5,
        });
        const newgeometry = new THREE.BoxGeometry(5, 5, 5);
        this.newcube = new THREE.Mesh(newgeometry, new2material);
        this.scene.add(this.newcube);
        this.newcube.position.z = -10;
        this.newcube.position.x = 0;

        // MARCHING CUBES

        this.resolution = 28;

        this.effect = new MarchingCubes(this.resolution, material, true, true, 100000);
        this.effect.position.set(0, 0, 0);
        this.effect.scale.set(7, 7, 7);

        this.effect.enableUvs = false;
        this.effect.enableColors = false;

        this.scene.add(this.effect);

        console.log(this.effect);

        // RENDERER

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // CONTROLS

        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.minDistance = 1;
        controls.maxDistance = 25;

        // STATS

        this.stats = new Stats();
        this.container.appendChild(this.stats.dom);

        // GUI

        this.setupGui();

        // EVENTS

        window.addEventListener("resize", this.onWindowResize);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    setupGui() {
        this.effectController = {
            speed: 1.0,
            resolution: 50,
            isolation: 10,
            difference: 1.7,
        };

        let h;

        const gui = new GUI();

        // simulation

        h = gui.addFolder("Simulation");

        h.add(this.effectController, "speed", 0.1, 8.0, 0.05);
        h.add(this.effectController, "resolution", 14, 100, 1);
        h.add(this.effectController, "isolation", 10, 300, 1);
        h.add(this.effectController, "difference", 0, 10, 0.1);
    }

    // this controls content of marching cubes voxel field

    updateCubes(object, time) {
        object.reset();

        const subtract = 12;
        const strength = 1.2 / ((Math.sqrt(3) - 1) / 4 + 1);

        for (let i = 0; i < this.numOfBalls; i++) {
            const ballx = Math.sin(i + 1.26 * time * (1.03 + 0.5 * Math.cos(0.21 * i))) * (0.1 * this.effectController.difference) + 0.5;
            const bally = Math.abs(Math.cos(i + 1.12 * time * Math.cos(1.22 + 0.1424 * i))) * (0.1 * (this.effectController.difference / 2)) + 0.5;
            const ballz = Math.cos(i + 1.32 * time * 0.1 * Math.sin(0.92 + 0.53 * i)) * (0.1 * this.effectController.difference) + 0.5;

            object.addBall(ballx, bally, ballz, strength, subtract);
        }

        object.update();
    }

    //

    animate() {
        requestAnimationFrame(() => this.animate());

        this.render();
        this.stats.update();
    }

    render() {
        const delta = this.clock.getDelta();

        this.time += delta * this.effectController.speed * 0.5;

        // marching cubes

        if (this.effectController.resolution !== this.resolution) {
            this.resolution = this.effectController.resolution;
            this.effect.init(Math.floor(this.resolution));
        }

        if (this.effectController.isolation !== this.effect.isolation) {
            this.effect.isolation = this.effectController.isolation;
        }

        this.updateCubes(this.effect, this.time);

        // render
        if (this.newcube) {
            this.newcube.rotation.x += 0.01;
            this.newcube.rotation.z += 0.005;
            this.newcube.rotation.y += 0.005;
        }

        this.renderer.render(this.scene, this.camera);
    }
}
