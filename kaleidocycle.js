/**
 * A class to encapsulate the data of the kaleidocycle itself
 */

import {Vector3, Geometry, Face3, Mesh, Matrix4, MeshLambertMaterial, MeshNormalMaterial} from "./lib/three.js-r115/build/three.module.js";

export class Kaleidocycle {

    constructor(size, number) {
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
            new Face3(0,3,1), new Face3(0,1,2), 
            new Face3(1,3,2), new Face3(2,3,0)
        );
        //enables lighting
        this.baseGeometry.computeFaceNormals();

        this.colors = [0xFF0000, 0x6FFF00, 0x00E1FF, 0xFFA600, 0xD400FF]

        //mesh array
        this.tets = []
        for(let i = 0; i < this.n; i++) {
            this.tets.push(new Mesh(
                this.baseGeometry, 
                new MeshLambertMaterial({color: this.colors[i % this.colors.length]})
            ));
        }

        this.tets.forEach(
            mesh => mesh.matrixAutoUpdate = false
        ); //since we manually update every frame

        //n-specific transforms: the relationship between each Tn and T0
        /* 
        object mat instead of geometry mat because it doesn't affect vertices
        this means that the translation is also taken into account when
        reflection and z-rotations take place
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

    //no params because it is dependent on time-dependent vectors
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

        for(let i = 0; i < 2; i++) {
            let tet = this.tets[i];

            //undo last transform
            tet.geometry.applyMatrix4(new Matrix4().getInverse(this.transMat));

            //calc new
            this.transMat.set(
                this.u.x, this.w.x, this.v.x, this.M.x,
                this.u.y, this.w.y, this.v.y, this.M.y,
                this.u.z, this.w.z, this.v.z, this.M.z,
                0,        0,        0,        1
            );
            tet.geometry.applyMatrix4(this.transMat);
        }
    }

    destroy(scene) {
        this.baseGeometry.dispose();
        this.tets.forEach(
            tet => {
                scene.remove(tet);
                tet.material.dispose(); 
            }
        );
    }
}