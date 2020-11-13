import * as t from "../lib/three/three.module.js";
import {OrbitControls} from "../lib/three/OrbitControls.js";
import {TransformControls} from "../lib/three/TransformControls.js";
import CSG from "../lib/csg/CSGMesh.js";

let canvas, renderer, camera, orbit, controls, scene; //render tools
let tool, lastCell; //cell is a shared var define in index.html

let sphereGeom, cubeGeom, cylinderGeom, coneGeom;

const geomLoader = new t.BufferGeometryLoader();

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
    renderer = new t.WebGLRenderer({canvas: document.querySelector('#canvas2'), antialias: true});
    canvas = renderer.domElement; //this is the same as selecting from doc
    camera = new t.PerspectiveCamera(45, 2, 0.1, 100);

    //add controls
    orbit = new OrbitControls(camera, canvas);
    orbit.enablePan = false;
    camera.position.add(new t.Vector3(2.5, 1, 1.5));
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
        kal.staticBaseGeometry,
        new t.MeshNormalMaterial({color: 0x44aa88})
    );
    scene.add(cell);

    sphereGeom = new t.SphereGeometry(0.3, 15, 15);
    cubeGeom = new t.BoxGeometry(0.5, 0.5, 0.5);
    cylinderGeom = new t.CylinderGeometry(0.25, 0.25, 1, 10);
    coneGeom = new t.ConeGeometry(0.25, 1, 10);

    tool = new t.Mesh(
        sphereGeom,
        new t.MeshStandardMaterial({color: 0x918c8c})
    );
    tool.position.x = 1.2;
    scene.add(tool);

    //attach and add
    controls.attach(tool);
    scene.add(controls);
    

    /*
        EVENT LISTENERS
    */
    {
        /* SLIDERS */
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

        /* ACTION BUTTONS*/
        let doButton = document.getElementById('do');
        let toggle = document.getElementById('toggle');
        let undoButton = document.getElementById('undo');
        let resetButton = document.getElementById('reset');

        let sphereGeomButton = document.getElementById('sphere');
        let cubeGeomButton = document.getElementById('cube');
        let cylinderGeomButton = document.getElementById('cyl');
        let coneGeomButton = document.getElementById('cone');

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

        resetButton.onclick = function(){
            resetCell();
        }

        sphereGeomButton.onclick = function() {
            scene.remove(tool);
            tool.geometry = sphereGeom;
            scene.add(tool);
        }

        cubeGeomButton.onclick = function() {
            scene.remove(tool);
            tool.geometry = cubeGeom;
            scene.add(tool);
        }

        cylinderGeomButton.onclick = function() {
            scene.remove(tool);
            tool.geometry = cylinderGeom;
            scene.add(tool);
        }

        coneGeomButton.onclick = function() {
            scene.remove(tool);
            tool.geometry = coneGeom;
            scene.add(tool);
        }

        $('#save').click( function() {
            var geomJSON = cell.geometry.toJSON();
            var dataStr = "data:text/json;charset=utf-8," 
                        + encodeURIComponent(JSON.stringify(geomJSON));

            var a = document.createElement('a');
            a.setAttribute("href", dataStr);
            a.setAttribute("download", "cell.json");
            document.body.appendChild(a); // required for firefox
            a.click();
            a.remove();
        });

        //link load cell button to hidden input elem
        $('#load').click( function() {
            $("#uploader").click();
        });

        $("#uploader").change(function() {
            var file = this.files[0];
            var fileURL = URL.createObjectURL(file);
            
            geomLoader.load(
                fileURL,

                //onload
                function(geometry) {
                    URL.revokeObjectURL(fileURL); //dispose
                    
                    scene.remove(cell);
                    lastCell = cell.clone();
                    cell.geometry.dispose();
                    cell.geometry = geometry;
                    scene.add(cell);
                },

                //onprogress
                function(xhr) {},

                //onError
                function() {
                    alert("Whoops! We couldn't load your file.");
                }
            )
        });

        /* TOOL MODE RADIO BUTTONS*/
        $('input[type=radio][name=toolControl]').change(function() {
            controls.setMode(this.value);
        });

        /*n=6 special case;
        this cell has different base dims than the others; must reset
        */
        let nSlider = document.getElementById("nSlider");
        nSlider.addEventListener(
            "change", function() {
                resetCell();
                //confirm("beware! you will lose your cell sculpture");
            }
        );

    }
    resetCell()
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

function resetCell() {
    scene.remove(cell);

    cell = new t.Mesh(
        kal.staticBaseGeometry, 
        new t.MeshNormalMaterial({color: 0x44aa88})
    );

    scene.add(cell);
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