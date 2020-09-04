import * as t from "../lib/three/three.module.js";
import {OrbitControls} from "../lib/three/OrbitControls.js";
import {Kaleidocycle} from "./kaleidocycle.js";

let canvas, renderer, camera, controls, scene; //render tools
let u, v, w, nAlpha, eAlpha; //objects
//animation options
let frames = 0;
let lastTime = 0; //time at last frame. used for speed control
let rotationSpeed = 1; //rotation speed as a multiple of time

setup();
draw();

/**
 * Initializes the objects and tools
 */
function setup() {

    /*
     * RENDERING BOILERPLATE
     * -----------------------
     */
    renderer = new t.WebGLRenderer({canvas: document.querySelector('canvas'), antialias: true});
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
    kal = new Kaleidocycle(1, 8, null, scene);
    kal.addToScene(); 

    //lights
    const frontLight = new t.SpotLight(0xFFFFFF);
    frontLight.position.set(0, 0, 10);
    scene.add(frontLight);

    const backLight = new t.SpotLight(0xFFFFFF);
    backLight.position.set(0, 0, -10);
    scene.add(backLight);

    //axes
    scene.add(new t.AxesHelper(100));

    //Ea plane
    let points = [new t.Vector3(-10, -10*Math.tan(kal.alpha), 0), new t.Vector3(10, 10*Math.tan(kal.alpha), 0)]
    let linGeo = new t.BufferGeometry().setFromPoints(points);
    eAlpha = new t.Line(linGeo, new t.LineBasicMaterial({color: 0x000000}));
    scene.add(eAlpha);
    eAlpha.visible = false;

    //show norms
    u = new t.ArrowHelper(kal.u, new t.Vector3(0,0,0), 1, 0xff00ff);
    scene.add(u)
    u.visible = false;

    v = new t.ArrowHelper(kal.v, new t.Vector3(0,0,0), 1, 0xff00ff);
    scene.add(v);
    v.visible = false;

    w = new t.ArrowHelper(kal.w, new t.Vector3(0,0,0), 1, 0xff00ff);
    scene.add(w);
    w.visible = false;

    nAlpha = new t.ArrowHelper(kal.nAlpha, new t.Vector3(0,0,0), 1, 0x000000);
    scene.add(nAlpha);
    nAlpha.visible = false;


    //EVENT LISTENERS
    {
        let nSlider = document.getElementById('nSlider');
        let checkbox1 = document.getElementById('checkbox1');
        let speedSlider = document.getElementById('speedSlider');

        let lambdaSlider = document.getElementById('lambdaSlider');
        let muSlider = document.getElementById('muSlider');
        let kappaSlider = document.getElementById('kappaSlider');
        let nuSlider = document.getElementById('nuSlider');

        let createButton = document.getElementById('create');

        nSlider.addEventListener(
            'change', function() {
                document.getElementById('nLabel').innerHTML = 'N=' + nSlider.value;
                
                kal.destroy();
                kal = new Kaleidocycle(1, nSlider.value, null, scene);
                kal.addToScene(); 
            }
        );

        checkbox1.addEventListener(
            'change', function() {
                let show = checkbox1.checked;
                u.visible = show;
                v.visible = show;
                w.visible = show;
                nAlpha.visible = show;
                eAlpha.visible = show;
            }
        );

        speedSlider.addEventListener(
            'input', function() {
                rotationSpeed = speedSlider.value;
            }
        );

        lambdaSlider.addEventListener(
            'input', function() {
                
                kal.updateAfromLambda(lambdaSlider.value);
                /*
                since mu is a percentage of lambda, both A and B are
                dependent on lambda
                */
                kal.updateBfromMu(muSlider.value, lambdaSlider.value);
                kal.setVertexFlag();
            }
        );

        muSlider.addEventListener(
            'input', function() {
                kal.updateBfromMu(muSlider.value, lambdaSlider.value);
                kal.setVertexFlag();
            }
        );

        kappaSlider.addEventListener(
            'input', function() {
                kal.updateCfromKappa(kappaSlider.value);
                kal.updateDfromNu(nuSlider.value, kappaSlider.value);
                kal.setVertexFlag();
            }
        );

        nuSlider.addEventListener(
            'input', function() {
                kal.updateDfromNu(nuSlider.value, kappaSlider.value);
                kal.setVertexFlag();
            }
        );

        createButton.onclick = function() {
            kal.destroy();
            kal = new Kaleidocycle(1, nSlider.value, cell.geometry.clone(), scene);
            kal.addToScene();
        }
    }
}

/**
 * Main Animation Loop
 */
function draw() {
    
    //sets the renderer's resolution to the canvas size when needed
    //TODO: resize handling can be cleaner–https://stackoverflow.com/a/20434960
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
        kal.time += rotationSpeed * (lastTime - time);
        kal.transform();
        updateArrows();

        lastTime = time;

        //Every 120 frames; every two seconds @60hz
        // if(frames % 120 == 0 && document.getElementById('logbox').checked) {
        //     console.log(
        //         JSON.parse(JSON.stringify({debug statement})),
        //     );
        // }

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

//Helper methods
function updateArrows() {
    u.setDirection(kal.u);
    v.setDirection(kal.v);
    w.setDirection(kal.w);
}