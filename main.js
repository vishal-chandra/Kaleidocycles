import * as t from "./lib/three.js-r115/build/three.module.js";
import {OrbitControls} from "./lib/three.js-r115/examples/jsm/controls/OrbitControls.js";
import {Kaleidocycle} from "./kaleidocycle.js"

let canvas, renderer, camera, controls, scene; //render tools
let kal, u, v, w, nAlpha, eAlpha; //objects
let frames = 0; //frame counter

/**
 * Initializes the objects and tools
 */
function setup() {

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

    //scene and bg
    scene = new t.Scene();
    scene.background = new t.Color('white');

    //main geometry
    kal = new Kaleidocycle(1, 8);
    scene.add(kal.tets[1]);
    //kal.tets.forEach(tet => scene.add(tet)); 

    //light
    const light = new t.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(-1, 2, 4);
    scene.add(light);

    //axes
    scene.add(new t.AxesHelper(100));

    //Ea plane
    let points = [new t.Vector3(-10, -10*Math.tan(kal.alpha), 0), new t.Vector3(10, 10*Math.tan(kal.alpha), 0)]
    let linGeo = new t.BufferGeometry().setFromPoints(points);
    eAlpha = new t.Line(linGeo, new t.LineBasicMaterial({color: 0x000000}));
    scene.add(eAlpha);

    //show norms
    u = new t.ArrowHelper(kal.u, new t.Vector3(0,0,0), 1, 0xff00ff);
    scene.add(u)

    v = new t.ArrowHelper(kal.v, new t.Vector3(0,0,0), 1, 0xff00ff);
    scene.add(v);

    w = new t.ArrowHelper(kal.w, new t.Vector3(0,0,0), 1, 0xff00ff);
    scene.add(w);

    nAlpha = new t.ArrowHelper(kal.nAlpha, new t.Vector3(0,0,0), 1, 0x000000);
    scene.add(nAlpha);

    let checkbox1 = document.getElementById('checkbox1');
    checkbox1.addEventListener(
        'change', function() {
            let show = checkbox1.checked;
            u.visible = show;
            v.visible = show;
            w.visible = show;
            nAlpha.visible = show;
            eAlpha.visible = show;
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
        frames++;
        time *= 0.001; //ms to s
        kal.time = time;
        kal.transform();
        updateArrows();

        //Every 120 frames; every two seconds @60hz
        if(frames % 120 == 0 && document.getElementById('logbox').checked) {
            console.log(
                JSON.parse(JSON.stringify(kal.tets[0].geometry.vertices)), //put obj here to debug
                kal.time
            );
        }

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