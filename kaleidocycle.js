/**
 * A class to encapsulate the data of the kaleidocycle itself
 */

import {Vector3, Geometry, Face3, Matrix4, MeshPhongMaterial, Mesh} from "./lib/three.js-r115/build/three.module.js";

export class Kaleidocycle {

    constructor(size, number) {
        /*
            BASIC PROPERTIES
        */
        this.s = size; //side length
        this.h = size / Math.SQRT2; //legth of PQ

        this.n = number; //how many tetrahedra
        this.alpha = 2 * Math.PI / this.n; //alpha

        this.nAlpha = new Vector3(-Math.sin(this.alpha), Math.cos(this.alpha), 0);

        //intial vertex position
        this.A = new Vector3(-this.s/2, -this.h/2, 0);
        this.B = new Vector3(this.s/2, -this.h/2, 0);
        this.C = new Vector3(0, this.h/2, -this.s/2);
        this.D = new Vector3(0, this.h/2, this.s/2);

        //geometry
        this.principalGeometry = new Geometry();
        this.principalGeometry.vertices.push(
            this.A, this.B, this.C, this.D
        );
        this.principalGeometry.faces.push(
            new Face3(0,3,1), new Face3(0,1,2), 
            new Face3(1,3,2), new Face3(2,3,0)
        );
        this.principalGeometry.computeFaceNormals();

        //main tetrahedron
        const material = new MeshPhongMaterial({color: 0x44aa88});
        this.tet = new Mesh(this.principalGeometry, material);
        this.tet.matrixAutoUpdate = false;

        /*
            MANIPULATIONS
        */

        this.time = 0; //"time" – really the rotation angle

        //normed vectors
        this.u = new Vector3();
        this.v = new Vector3();
        this.w = new Vector3();

        //object center (affine offset)
        this.M = new Vector3();

        //kick off animation
        this.transform(this.time);
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

        this.tet.matrix.set(
            this.u.x, this.w.x, this.v.x, this.M.x,
            this.u.y, this.w.y, this.v.y, this.M.y,
            this.u.z, this.w.z, this.v.z, this.M.z,
            0,        0,        0,        1
        );
    }
}