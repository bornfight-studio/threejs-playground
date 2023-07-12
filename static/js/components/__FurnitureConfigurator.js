import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import { GUI } from "three/addons/libs/lil-gui.module.min.js";

export default class FurnitureConfigurator {
    constructor() {
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.controls = null;

        this.init();
        this.animate();

        this.configurator = document.querySelector(".js-furniture-configurator");
    }

    /**
     * Init
     */
    init() {
        if (this.configurator === null) {
            return;
        }

        const container = document.createElement("div");
        document.body.appendChild(container);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20);
        this.camera.position.set(-0.75, 0.7, 1.25);

        this.scene = new THREE.Scene();

        // model
        new GLTFLoader().setPath("../static/models/").load("Chair-v3.glb", (gltf) => {
            this.scene.add(gltf.scene);

            const object = gltf.scene.getObjectByName("SheenChair_fabric");

            const gui = new GUI();

            gui.add(object.material, "sheen", 0, 1);
            gui.open();
        });

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        this.renderer.useLegacyLights = false;
        container.appendChild(this.renderer.domElement);

        const environment = new RoomEnvironment(this.renderer);
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);

        this.scene.background = new THREE.Color(0xbbbbbb);
        this.scene.environment = pmremGenerator.fromScene(environment).texture;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10;
        this.controls.target.set(0, 0.5, 0);
        this.controls.update();

        window.addEventListener("resize", this.onWindowResize);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //

    animate() {
        requestAnimationFrame(() => this.animate());

        this.controls.update(); // required if damping enabled

        this.render();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}

// <script type="module">
//
//     import * as THREE from '../build/three.module.js';
//
//     import * as Nodes from './jsm/nodes/Nodes.js';
//
//     import Stats from './jsm/libs/stats.module.js';
//     import { GUI } from './jsm/libs/dat.gui.module.js';
//
//     import { OrbitControls } from './jsm/controls/OrbitControls.js';
//
//     import { FBXLoader } from './jsm/loaders/FBXLoader.js';
//
//     // Graphics variables
//     var camera, controls, scene, renderer, stats;
//     var directionalLight;
//     var mesh, sphere, material, nodeMaterial;
//
//     var params = {
//         nodeMaterial: true,
//         color: new THREE.Color( 255, 0, 127 ),
//         sheenBRDF: true,
//         sheen: new THREE.Color( 10, 10, 10 ), // corresponds to .04 reflectance
//         roughness: .9,
//         exposure: 2,
//     };
//
//     // model
//     new FBXLoader().load( 'models/fbx/cloth.fbx', function ( loadedModel ) {
//
//     mesh = loadedModel.children[0];
//
//     init();
//
//     } );
//
//     function init( ) {
//
//     camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );
//
//     scene = new THREE.Scene();
//     scene.background = new THREE.Color( 0xbfd1e5 );
//
//     mesh.scale.multiplyScalar( .5 );
//     scene.add( mesh );
//
//     //
//
//     material = new THREE.MeshPhysicalMaterial();
//     material.side = THREE.DoubleSide;
//     material.metalness = 0;
//
//     //
//
//     nodeMaterial = new Nodes.StandardNodeMaterial();
//     nodeMaterial.side = THREE.DoubleSide;
//     nodeMaterial.metalness = new Nodes.FloatNode( 0 );
//     nodeMaterial.roughness = new Nodes.FloatNode();
//     nodeMaterial.color = new Nodes.ColorNode( params.color.clone() );
//
//     //
//
//     sphere = new THREE.Mesh(
//     new THREE.SphereBufferGeometry( 1, 100, 100 ),
//     material
//     );
//     scene.add(sphere);
//
//     camera.position.set( - 12, 7, 4 );
//
//     var container = document.getElementById( 'container' );
//     renderer = new THREE.WebGLRenderer();
//     renderer.setPixelRatio( window.devicePixelRatio );
//     renderer.setSize( window.innerWidth, window.innerHeight );
//     renderer.shadowMap.enabled = true;
//     container.appendChild( renderer.domElement );
//
//     controls = new OrbitControls( camera, renderer.domElement );
//     controls.target.set( 0, 2, 0 );
//     controls.update();
//
//     directionalLight = new THREE.DirectionalLight( 0xffffff, .5 );
//     directionalLight.position.set( 0, 10, 0 );
//     directionalLight.castShadow = true;
//     directionalLight.add(
//     new THREE.Mesh(
//     new THREE.SphereBufferGeometry( .5 ),
//     new THREE.MeshBasicMaterial( { color: 0xffffff } )
//     )
//     );
//
//     scene.add( directionalLight );
//
//     stats = new Stats();
//     stats.domElement.style.position = 'absolute';
//     stats.domElement.style.top = '0px';
//     container.appendChild( stats.dom );
//
//     window.addEventListener( 'resize', onWindowResize, false );
//
//     var gui = new GUI();
//
//     function onUpdate() {
//
//     mesh.material = sphere.material = params.nodeMaterial
//     ? nodeMaterial
//     : material;
//
//     material.sheen = params.sheenBRDF
//     ? new THREE.Color()
//     : null;
//
//     material.needsUpdate = true;
//
//     nodeMaterial.sheen = params.sheenBRDF
//     ? new Nodes.ColorNode( material.sheen )
//     : undefined;
//
//     nodeMaterial.needsCompile = true;
//
// }
//
//     gui.add( params, 'nodeMaterial' ).onChange( onUpdate );
//     gui.addColor( params, 'color' );
//     gui.add( params, 'sheenBRDF' ).onChange( onUpdate );
//     gui.addColor( params, 'sheen' );
//     gui.add( params, 'roughness', 0, 1 );
//     gui.add( params, 'exposure', 0, 3 );
//     gui.open();
//
//     onUpdate();
//
//     animate();
//
// }
//
//     function onWindowResize() {
//
//     camera.aspect = window.innerWidth / window.innerHeight;
//     camera.updateProjectionMatrix();
//
//     renderer.setSize( window.innerWidth, window.innerHeight );
//
// }
//
//     function animate() {
//
//     requestAnimationFrame( animate );
//
//     render();
//     stats.update();
//
// }
//
//     function render() {
//
//     //
//
//     material.color.copy( params.color ).multiplyScalar( 1 / 255 );
//     material.roughness = params.roughness;
//
//     //
//
//     nodeMaterial.color.value.copy( material.color );
//     nodeMaterial.roughness.value = params.roughness;
//
//     //
//
//     if ( params.sheenBRDF ) {
//
//     material.sheen.copy( params.sheen ).multiplyScalar( 1 / 255 );
//
// }
//
//     //
//
//     renderer.toneMappingExposure = params.exposure;
//     renderer.render( scene, camera );
//
// }
//
// </script>
