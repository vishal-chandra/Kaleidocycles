import * as t from "./lib/three.js-r115/build/three.module.js";

let canvas, renderer, camera, scene, cube;

//init
function setup() {

    //drawing tools
    canvas = document.querySelector('canvas');
    renderer = new t.WebGLRenderer({canvas: canvas});
    camera = new t.PerspectiveCamera(45, 2, 0.1, 5);
    camera.position.z = 4;
    scene = new t.Scene();

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
    
}

//animation loop
function draw() {
    
    function render(time) {
        time *= 0.001; //ms to s

        //handle resize
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight; 
        camera.updateProjectionMatrix();

        //full rotation about once every 6.3s
        cube.rotation.x = time;
        cube.rotation.y = time;

        renderer.render(scene, camera);
        requestAnimationFrame(render) //loop on frame
    }

    requestAnimationFrame(render); //kick off loop

}

setup();
draw();