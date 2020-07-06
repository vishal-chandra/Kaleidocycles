import * as t from "./lib/three.js-r115/build/three.module.js";
import {OrbitControls} from "./lib/three.js-r115/examples/jsm/controls/OrbitControls.js";

let canvas, renderer, camera, controls, scene, cube;

//init
function setup() {

    //drawing tools
    renderer = new t.WebGLRenderer({canvas: document.querySelector('canvas')});
    canvas = renderer.domElement; //pretty sure this is the same as selecting from doc
    camera = new t.PerspectiveCamera(45, 2, 0.1, 100);

    controls = new OrbitControls(camera, canvas);
    camera.position.z = 4;
    controls.update();

    scene = new t.Scene();
    scene.background = new t.Color('white');

    //axes
    scene.add(new t.AxesHelper(100));

    //light
    {
        //in block to declutter global and because we don't need to edit
        const color = 0xFFFFFF;
        const intensity = 1;
        const light = new t.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }

    //cube
    const geometry = new t.TetrahedronGeometry(1);
    const material = new t.MeshPhongMaterial({color: 0x44aa88});
    cube = new t.Mesh(geometry, material);
    scene.add(cube);

    //event listeners
    let slider1 = document.getElementById('slider1');
    slider1.addEventListener(
        'input', function() {onSliderChange(slider1.value)}
    );

    let checkbox1 = document.getElementById('checkbox1');
    checkbox1.addEventListener(
        'change', function() {
            if(checkbox1.checked) scene.add(cube);
            else scene.remove(cube);
        }
    )
    
}

//animation loop
function draw() {
    
    //sets the renderer's resolution to the canvas size
    function resizeRenderer(renderer) {
        let displayWidth = canvas.clientWidth;
        let displayHeight = canvas.clientHeight;
        let drawWidth = canvas.width;
        let drawHeight = canvas.height;

        //console.log(displayWidth, drawWidth, displayHeight, drawHeight);

        let needResize = drawHeight !== displayHeight || drawWidth !== displayWidth;
        if(needResize) {
            renderer.setSize(displayWidth, displayHeight, false);
        }
        return needResize; //return whether or not we resized
    }

    function render(time) {
        time *= 0.001; //ms to s

        //handle resize
        if(resizeRenderer(renderer)) {
            camera.aspect = canvas.clientWidth / canvas.clientHeight; 
            camera.updateProjectionMatrix();
        }

        //full rotation about once every 6.3s
        cube.rotation.x = time;
        cube.rotation.y = time;

        renderer.render(scene, camera);
        requestAnimationFrame(render) //loop on frame
    }

    requestAnimationFrame(render); //kick off loop

}

function onSliderChange(value) {
    cube.position.x = value;
}

setup();
draw();