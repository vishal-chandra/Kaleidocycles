/**
 * A class to encapsulate the data of the kaleidocycle itself
 */

import {
    Vector3,
    Vector2,
    Geometry,
    Face3,
    Mesh,
    Matrix4,
    MeshPhongMaterial,
    MeshBasicMaterial,
    Color,
    FaceColors
} from "../lib/three/three.module.js";

export class Kaleidocycle {

    constructor(size, number, customCellGeom, scene) {
        
        this.scene = scene; //used to add and remove kal from scene, and destroy it.
        
        /*
            BASIC PROPERTIES
        */
        this.s = size; //side length
        this.h = size / Math.SQRT2; //legth of PQ
        this.n = number;
        this.alpha = 2 * Math.PI / this.n;
        this.nAlpha = new Vector3(-Math.sin(this.alpha), Math.cos(this.alpha), 0);

        //matrix to reflect across y=xtan(alpha)
        this.refMat = new Matrix4().set(
            1 - 2*(Math.sin(this.alpha)**2), 2*Math.sin(this.alpha)*Math.cos(this.alpha), 0, 0,
            2*Math.sin(this.alpha)*Math.cos(this.alpha), 1 - 2*(Math.cos(this.alpha)**2), 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        );


        //intial vertex positions
        this.A = new Vector3(-this.s/2, -this.h/2, 0);
        this.B = new Vector3(this.s/2, -this.h/2, 0);
        this.C = new Vector3(0, this.h/2, -this.s/2);
        this.D = new Vector3(0, this.h/2, this.s/2);

        //geometry
        this.baseGeometry = new Geometry();
        this.baseGeometry.vertices.push(
            this.A, this.B, this.C, this.D
        );
        this.baseGeometry.faces.push(
            new Face3(0, 1, 3), //ABD
            new Face3(0, 2, 1), //ACB
            new Face3(1, 2, 3), //BCD
            new Face3(2, 0, 3)  //CAD
        );
        this.computeUvs(this.baseGeometry);

        this.baseGeometry.faces[0].color = new Color('red');
        this.baseGeometry.faces[1].color = new Color('blue');
        this.baseGeometry.faces[2].color = new Color('green');
        this.baseGeometry.faces[3].color = new Color('yellow');

        //a non-rotating copy for the cell editor to reference
        this.staticBaseGeometry = this.baseGeometry.clone();

        this.cellGeometry = customCellGeom ? customCellGeom : this.baseGeometry;

        //mesh array
        this.colors = [0xFF0000, 0x6FFF00, 0x00E1FF, 0xFFA600, 0xD400FF, 0xEDCA18]
        this.tets = []
        for(let i = 0; i < this.n; i++) {
            this.tets.push(new Mesh(
                this.cellGeometry,
                new MeshPhongMaterial({vertexColors: FaceColors})
                //new MeshPhongMaterial({color: this.colors[i % this.colors.length]})
            ));
        }

        this.tets.forEach(
            mesh => mesh.matrixAutoUpdate = false
        ); //since we manually update every frame

        //n-specific transforms: the relationship between each Tn and T0
        /* 
        modifying object mat instead of geometry mat because it doesn't affect vertices.
        this means that the translation is also taken into account when
        reflection and z-rotations take place.
        */
        for(let i = 1; i < this.tets.length; i++) {
            let mat = this.tets[i].matrix;

            if(i == 1) mat.multiply(this.refMat);
            else if (i % 2 == 0) {
                 mat.multiply(new Matrix4().makeRotationZ(
                     //i=2 --> 2a
                     //i=4 --> 4a
                     //i=6 --> 6a
                     i * this.alpha
                 ));
            }
            else if (i % 2 == 1) {
                //first rotate so this becomes identitcal to tets[1]
                mat.multiply(this.refMat);
                mat.multiply(new Matrix4().makeRotationZ(
                    //i=3 --> -2a
                    //i=5 --> -4a
                    //i=7 --> -6a
                    //i --> -(i-1)a
                    -(i-1) * this.alpha
                ));
            }
        }

        /*
            MANIPULATIONS
        */

        this.time = 0; //really the rotation angle

        //basis vectors
        this.u = new Vector3();
        this.v = new Vector3();
        this.w = new Vector3();

        //object center (affine offset)
        this.M = new Vector3();

        //transfrom matrix so we don't have to keep creating new ones
        this.transMat = new Matrix4();

        /*
            UI COMPONENTS

            reset sliders when new kaleidocycle is created
        */
        let lambdaSlider = document.getElementById('lambdaSlider');
        lambdaSlider.max = this.h / Math.tan(this.alpha);
        //since no regular kaleidocycle exists for n = 6
        lambdaSlider.value = this.n == 6 ? lambdaSlider.max : this.s / 2;
        this.updateAfromLambda(lambdaSlider.value);

        let muSlider = document.getElementById('muSlider');
        muSlider.max = lambdaSlider.max;
        muSlider.value = lambdaSlider.value;
        this.updateBfromMu(muSlider.value, lambdaSlider.value);

        let kappaSlider = document.getElementById('kappaSlider');
        kappaSlider.max = lambdaSlider.max;
        kappaSlider.value = lambdaSlider.value;
        this.updateCfromKappa(kappaSlider.value);

        let nuSlider = document.getElementById('nuSlider');
        nuSlider.max = lambdaSlider.max;
        nuSlider.value = lambdaSlider.value;
        this.updateDfromNu(nuSlider.value, kappaSlider.value);
    }

    calculate_u(t) {
        this.u.set(Math.cos(t), 0, Math.sin(t));
        this.u.normalize();

        return this.u;
    }

    calculate_v() {
        this.v.crossVectors(this.u, this.nAlpha);
        this.v.normalize();

        return this.v;
    }

    calculate_w() {
        this.w.crossVectors(this.u, this.v);
        this.w.negate();
        this.w.normalize();

        return this.w;
    }

    updateVectors(t) {
        //normed vectors
        this.calculate_u(t);
        this.calculate_v();
        this.calculate_w();
    }
    
    update_M() {
        this.M.set(
            (this.w.y / Math.tan(this.alpha)) - (this.w.x / 2), 
            this.w.y / 2, 
            0
        );
        this.M.multiplyScalar(this.h);

        return this.M;
    }

    transform() {
        this.updateVectors(this.time);
        this.update_M();

        //undo last transform
        this.cellGeometry.applyMatrix4(new Matrix4().getInverse(this.transMat));

        //calc new
        this.transMat.set(
            this.u.x, this.w.x, this.v.x, this.M.x,
            this.u.y, this.w.y, this.v.y, this.M.y,
            this.u.z, this.w.z, this.v.z, this.M.z,
            0,        0,        0,        1
        );
        this.cellGeometry.applyMatrix4(this.transMat);
    }

    //vertex updaters
    updateAfromLambda(lambda) {
        //adjust x, reset y and z to default
        this.baseGeometry.vertices[0].set(-lambda, -this.h/2, 0);
        this.staticBaseGeometry.vertices[0].set(-lambda, -this.h/2, 0);

        /*
        bring this vertex back to where it should be relative to the
        rest of the tetrahedron
        */
        this.baseGeometry.vertices[0].applyMatrix4(this.transMat);
    }

    updateBfromMu(mu) {
        this.baseGeometry.vertices[1].set(mu, -this.h/2, 0);
        this.staticBaseGeometry.vertices[1].set(mu, -this.h/2, 0);

        this.baseGeometry.vertices[1].applyMatrix4(this.transMat);
    }

    updateCfromKappa(kappa) {
        this.baseGeometry.vertices[2].set(0, this.h/2, -kappa);
        this.staticBaseGeometry.vertices[2].set(0, this.h/2, -kappa);

        this.baseGeometry.vertices[2].applyMatrix4(this.transMat);
    }

    updateDfromNu(nu) {
        this.baseGeometry.vertices[3].set(0, this.h/2, nu);
        this.staticBaseGeometry.vertices[3].set(0, this.h/2, nu);

        this.baseGeometry.vertices[3].applyMatrix4(this.transMat);
    }

    setVertexFlag() {
        this.baseGeometry.verticesNeedUpdate = true;
        this.staticBaseGeometry.verticesNeedUpdate = true;
    }

    addToScene() {
        this.tets.forEach(tet => this.scene.add(tet));
    }

    removeFromScene() {
        this.tets.forEach(tet => this.scene.remove(tet));
    }

    destroy() {
        this.baseGeometry.dispose();
        this.staticBaseGeometry.dispose();
        this.cellGeometry.dispose();

        this.tets.forEach(
            tet => {
                this.scene.remove(tet);
                tet.material.dispose(); 
            }
        );
    }

    computeUvs(geometry) {
        geometry.computeBoundingBox();
        const max = geometry.boundingBox.max;
        const min = geometry.boundingBox.min;
        const offset = new Vector2(0 - min.x, 0 - min.y);
        const range = new Vector2(max.x - min.x, max.y - min.y);
        for (let i = 0; i < geometry.faces.length; i++) {
            const v1 = geometry.vertices[geometry.faces[i].a];
            const v2 = geometry.vertices[geometry.faces[i].b];
            const v3 = geometry.vertices[geometry.faces[i].c];
            geometry.faceVertexUvs[0].push([
                new Vector2((v1.x + offset.x) / range.x, (v1.y + offset.y) / range.y),
                new Vector2((v2.x + offset.x) / range.x, (v2.y + offset.y) / range.y),
                new Vector2((v3.x + offset.x) / range.x, (v3.y + offset.y) / range.y)
            ]);
        }
        geometry.computeFlatVertexNormals();
    }
}