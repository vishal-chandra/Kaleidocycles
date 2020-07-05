import * as t from "./lib/three.js-r115/build/three.module.js";

function main() {

    //drawing tools
    const canvas = document.querySelector('canvas');
    const renderer = new t.WebGLRenderer({canvas: canvas});
    const camera = new t.PerspectiveCamera(45, 2, 0.1, 5);
    camera.position.z = 4;
    const scene = new t.Scene();

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
    const cube = new t.Mesh(geometry, material);

    scene.add(cube);
    

    //animation loop
    function render(time) {
        time *= 0.001; //ms to s

        //full rotation about once every 6.3s
        cube.rotation.x = time;
        cube.rotation.y = time;

        renderer.render(scene, camera);
        requestAnimationFrame(render) //loop on frame
    }
    requestAnimationFrame(render); //kick off loop

}

main();