import * as t from "./lib/three.js-r115/build/three.module.js";
import {OrbitControls} from "./lib/three.js-r115/examples/jsm/controls/OrbitControls.js";
import {Kaleidocycle} from "./kaleidocycle.js"

//tools
let canvas, renderer, camera, controls, scene;
//objects
let kal, tet, u, v, w;

/**
 * Initializes the objects and tools
 */
function setup() {

    kal = new Kaleidocycle(1, 8);

    /*
     * RENDERING BOILERPLATE
     * -----------------------
     */
    renderer = new t.WebGLRenderer({canvas: document.querySelector('canvas')});
    canvas = renderer.domElement; //this is the same as selecting from doc
    camera = new t.PerspectiveCamera(45, 2, 0.1, 100);

    //add controls
    controls = new OrbitControls(camera, canvas);
    camera.position.z = 4;
    controls.update();

    /*
     * OBJECTS
     * -------------------
     */

    //bg
    scene = new t.Scene();
    scene.background = new t.Color('white');

    //light
    const light = new t.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(-1, 2, 4);
    scene.add(light);

    //axes
    scene.add(new t.AxesHelper(100));

    //Ea plane
    let points = [new t.Vector3(-10, -10*Math.tan(kal.alpha), 0), new t.Vector3(10, 10*Math.tan(kal.alpha), 0)]
    let linGeo = new t.BufferGeometry().setFromPoints(points);
    scene.add(new t.Line(linGeo, new t.LineBasicMaterial({color: 0x000000})));

    //show norms
    u = new t.ArrowHelper(kal.u, new t.Vector3(0,0,0));
    scene.add(u)
    v = new t.ArrowHelper(kal.v, new t.Vector3(0,0,0));
    scene.add(v);
    w = new t.ArrowHelper(kal.w, new t.Vector3(0,0,0));
    scene.add(w);

    //tet
    const material = new t.MeshBasicMaterial({color: 0x44aa88});
    tet = new t.Mesh(kal.principalGeometry, material);
    tet.matrixAutoUpdate = false;
    scene.add(tet);

    /**
     * EVENT LISTENERS
     * -------------------------
     */
    let slider1 = document.getElementById('slider1');
    slider1.addEventListener(
        'input', function() {
            tet.position.x = slider1.value;
        }
    );

    
    let checkbox1 = document.getElementById('checkbox1');
    checkbox1.addEventListener(
        'change', function() {
            if(checkbox1.checked) {
                scene.add(u);
                scene.add(v);
                scene.add(w);
            }
            else {
                scene.remove(u);
                scene.remove(v);
                scene.remove(w);
            }
        }
    )
}

/**
 * Main Animation Loop
 */
function draw() {
    
    //sets the renderer's resolution to the canvas size when needed
    function resizeRenderer(renderer) {
        let displayWidth = canvas.clientWidth;
        let displayHeight = canvas.clientHeight;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;

        let needResize = drawHeight !== displayHeight || drawWidth !== displayWidth;
        if(needResize) {
            renderer.setSize(displayWidth, displayHeight, false);
        }
        return needResize; //return whether or not we resized
    }

    //part that loops
    function loop(time) {
        /*
            Logic and Animation
        */
        time *= 0.001; //ms to s
        kal.time = time;
        kal.animate();
        updateArrows();

        /*
            Boilerplate
        */
        //handle resize
        if(resizeRenderer(renderer)) {
            camera.aspect = canvas.clientWidth / canvas.clientHeight; 
            camera.updateProjectionMatrix();
        }
        renderer.render(scene, camera);
        requestAnimationFrame(loop) //loop on frame
    }

    requestAnimationFrame(loop); //kick off loop

}

function updateArrows() {
    u.setDirection(kal.u);
    v.setDirection(kal.v);
    w.setDirection(kal.w);
}

setup();
draw();