# Kaleidocycles
This is a project to simulate and design Kaleidocycles through various boolean solid operations (subtraction, union, intersection). Basic Kaleidocycles can "sculpted" using various tools such as cones, cylinders, and prisms. <br>
Made possible by Three.js (see below), the simulation follows the equations explained in [this paper](res/kaleidocycles_theory.pdf) to model Kaleidocyclic behavior both before and after the sculpting process.

## Demos
Interact with the live-hosted project at our website [here](https://kaleidocycles.live).

## Project Resources
### Dependencies
1. Three.js <br>
    [Three.js Docs](https://threejs.org) <br>
    [Three.js Fundamentals](https://threejsfundamentals.org) <br>
    [Three.js r115 Source](https://github.com/mrdoob/three.js/releases/tag/r115) <br>

2. CSG.js <br>
    [CSG.js Homepage](https://evanw.github.io/csg.js/) <br>
    [CSG.js port for Three](https://github.com/manthrax/THREE-CSGMesh) <br>

3. FileSaver.js <br>
    [FileSaver Home](https://github.com/eligrey/FileSaver.js) <br>
    [FileSaver pure JS implementation](https://github.com/eligrey/FileSaver.js/wiki/FileSaver.js-Example)<br>
    
### Math Tools & Theory
[3D Reflection Matrix](https://en.wikipedia.org/wiki/Transformation_matrix#Reflection_2). The kaleidocycle itself is an illusion – a single base unit is simply rotated around the z axis and reflected across the approriate planes successively to mimic the appearance of a physical kaleidocycle.<br>
[Transformation Debugging](https://www.desmos.com/calculator/a0a1wpo2ib). A simple tool to step through the governing equations.


