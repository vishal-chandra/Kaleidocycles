import * as t from "../lib/three/three.module.js";
import {OrbitControls} from "../lib/three/OrbitControls.js";
import {TransformControls} from "../lib/three/TransformControls.js";
import CSG from "../lib/csg/CSGMesh.js";

let canvas, renderer, camera, orbit, controls, scene; //render tools
let cell, tool, lastCell;

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
    renderer = new t.WebGLRenderer({canvas: document.querySelector('#canvas2')});
    canvas = renderer.domElement; //this is the same as selecting from doc
    camera = new t.PerspectiveCamera(45, 2, 0.1, 100);

    //add controls
    orbit = new OrbitControls(camera, canvas);
    orbit.enablePan = false;
    camera.position.add(new t.Vector3(3, 2, 3));
    orbit.update();

    controls = new TransformControls(camera, renderer.domElement);
    controls.setMode('rotate');
    controls.addEventListener('dragging-changed', function (event) {
        orbit.enabled = ! event.value;
    });

    /*
     * OBJECTS
     * -------------------
     */

    //scene and bg
    scene = new t.Scene();
    scene.background = new t.Color('white');

    //lights
    const frontLight = new t.SpotLight(0xFFFFFF);
    frontLight.position.set(0, 0, 10);
    scene.add(frontLight);

    const backLight = new t.SpotLight(0xFFFFFF);
    backLight.position.set(0, 0, -10);
    scene.add(backLight);

    //axes
    scene.add(new t.AxesHelper(100));

    //csg components
    cell = new t.Mesh(
        kal.staticBaseGeometry, //this won't work because .faceVertexUVs is empty
        new t.MeshNormalMaterial({color: 0x44aa88})
    );
    scene.add(cell);

    tool = new t.Mesh(
        //new t.SphereGeometry(1, 15, 15),
        new t.BoxGeometry(0.5, 0.5, 0.5),
        //new t.DodecahedronGeometry(1),
        //new t.CylinderGeometry(0.5, 0.5, 4, 15),
        new t.MeshStandardMaterial({color: 0x918c8c})
    );
    tool.position.x = 1.5;
    scene.add(tool);

    //attach and add
    controls.attach(tool);
    scene.add(controls);
    

    /*
        EVENT LISTENERS
    */
    {
        let toolXSlider = document.getElementById('toolX');
        toolXSlider.addEventListener(
            'input', function() {
                tool.position.x = parseFloat(toolXSlider.value, 10);
            }
        );

        let toolYSlider = document.getElementById('toolY');
        toolYSlider.addEventListener(
            'input', function() {
                tool.position.y = parseFloat(toolYSlider.value, 10);
            }
        );

        let toolZSlider = document.getElementById('toolZ');
        toolZSlider.addEventListener(
            'input', function() {
                tool.position.z = parseFloat(toolZSlider.value, 10);
            }
        );

        //buttons
        let doButton = document.getElementById('do');
        let toggle = document.getElementById('toggle');
        let undoButton = document.getElementById('undo');
        let resetButton = document.getElementById('reset');

        doButton.onclick = function() {
            scene.remove(cell);

            lastCell = cell.clone();
            cell = doCSG(cell, tool, 'subtract');

            scene.add(cell);
        }

        toggle.onclick = function() {
            //graphics
            tool.visible = !tool.visible;
            controls.visible = !controls.visible;
            controls.enabled = !controls.enabled;

            //change button
            toggle.innerHTML = tool.visible ? "Hide Tool" : "Show Tool";

            //can't carve without seeing tool
            doButton.disabled = !doButton.disabled;
        }

        undoButton.onclick = function() {
            scene.remove(cell);

            cell = lastCell.clone();

            scene.add(cell);
        }

        resetButton.onclick = function() {
            scene.remove(cell);

            cell = new t.Mesh(
                kal.staticBaseGeometry, 
                new t.MeshNormalMaterial({color: 0x44aa88})
            );

            scene.add(cell);
        }
    }
}

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
            Logic goes here
        */
        

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

function doCSG(meshA, meshB, operation){
    meshA.updateMatrix();
    meshB.updateMatrix();

    var bspA = CSG.fromMesh(meshA);
    var bspB = CSG.fromMesh(meshB);
    var bspC = bspA[operation](bspB);

    var result = CSG.toMesh(bspC, meshA.matrix);
    result.material = meshA.material;
    return result;
}