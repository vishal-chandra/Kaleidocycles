import * as t from "../lib/three/three.module.js";
import {OrbitControls} from "../lib/three/OrbitControls.js";
import {TransformControls} from "../lib/three/TransformControls.js";
import CSG from "../lib/csg/CSGMesh.js";

let canvas, renderer, camera, orbit, controls, scene; //render tools
let tet, tool, lastTet;

//csg tracking
let csgOps = 0;

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
    renderer = new t.WebGLRenderer({canvas: document.querySelector('canvas')});
    canvas = renderer.domElement; //this is the same as selecting from doc
    camera = new t.PerspectiveCamera(45, 2, 0.1, 100);

    //add controls
    orbit = new OrbitControls(camera, canvas);
    camera.position.add(new t.Vector3(4, 4, 4));
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
    let geometry = new t.Geometry();
    geometry.vertices.push(
        new t.Vector3(1, 1, 1), new t.Vector3(-1, -1, 1), 
        new t.Vector3(-1, 1, -1), new t.Vector3(1, -1, -1)
    );
    geometry.faces.push(
        new t.Face3(2, 1, 0), new t.Face3(0, 3, 2), 
        new t.Face3(1, 3, 0), new t.Face3(2, 3, 1)
    );
    computeUvs(geometry);

    tet = new t.Mesh(
        geometry, 
        new t.MeshNormalMaterial({color: 0x44aa88})
    );
    scene.add(tet);

    tool = new t.Mesh(
        //new t.SphereGeometry(1, 15, 15),
        new t.BoxGeometry(1, 1, 1),
        //new t.DodecahedronGeometry(1),
        //new t.CylinderGeometry(0.5, 0.5, 4, 15),
        new t.MeshStandardMaterial({color: 0x918c8c})
    );
    tool.position.x = 2;
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

        //main action button
        let csgButton = document.getElementById('doCSG');
        csgButton.onclick = function() {
            scene.remove(tet);

            lastTet = tet.clone();
            tet = doCSG(tet, tool, 'subtract');

            scene.add(tet);
        }

        let toolToggle = document.getElementById('toolToggle');
        toolToggle.onclick = function() {
            tool.visible = !tool.visible;
            controls.visible = !controls.visible;
            controls.enabled = !controls.enabled;

            toolToggle.innerHTML = tool.visible ? "Hide Tool" : "Show Tool";
        }

        let undoButton = document.getElementById('undoCSG');
        undoButton.onclick = function() {
            scene.remove(tet);

            tet = lastTet.clone();

            scene.add(tet);
        }

        let resetButton = document.getElementById('resetCSG');
        resetButton.onclick = function() {
            scene.remove(tet);

            tet = new t.Mesh(
                new t.TetrahedronGeometry(2), 
                new t.MeshNormalMaterial({color: 0x44aa88})
            );

            scene.add(tet);
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

function computeUvs(geometry) {
    geometry.computeBoundingBox();
    const max = geometry.boundingBox.max;
    const min = geometry.boundingBox.min;
    const offset = new t.Vector2(0 - min.x, 0 - min.y);
    const range = new t.Vector2(max.x - min.x, max.y - min.y);
    for (let i = 0; i < geometry.faces.length; i++) {
        const v1 = geometry.vertices[geometry.faces[i].a];
        const v2 = geometry.vertices[geometry.faces[i].b];
        const v3 = geometry.vertices[geometry.faces[i].c];
        geometry.faceVertexUvs[0].push([
            new t.Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
            new t.Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
            new t.Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
        ]);
    }
    geometry.computeFlatVertexNormals();
}