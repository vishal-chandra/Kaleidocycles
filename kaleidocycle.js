/**
 * A class to encapsulate the data of the kaleidocycle itself
 */

import {Vector3, Geometry, Face3, Matrix4} from "./lib/three.js-r115/build/three.module.js";

export class Kaleidocycle {

    constructor(size, number) {
        /*
            BASIC PROPERTIES
        */
        this.s = size; //side length
        this.h = size / Math.SQRT2; //legth of PQ

        this.n = number; //how many tetrahedra
        this.a = 2 * Math.PI / this.n; //alpha

        this.nAlpha = new Vector3(-Math.sin(this.a), Math.cos(this.a), 0);

        //intial vertex position
        this.A = new Vector3(-this.s/2, 0, 0);
        this.B = new Vector3(this.s/2, 0, 0);
        this.C = new Vector3(0, this.h, -this.s/2);
        this.D = new Vector3(0, this.h, this.s/2);

        //geometry  TODO: Maybe make this and related methods a separate class
        this.principalGeometry = new Geometry();
        this.principalGeometry.vertices.push(
            this.A, this.B, this.C, this.D
        );
        this.principalGeometry.faces.push(
            new Face3(0,3,1), new Face3(0,1,2), 
            new Face3(1,3,2), new Face3(2,3,0)
        );
        this.principalGeometry.computeFaceNormals();

        /*
            MANIPULATIONS
        */

        this.time = 0; //"time" – really the rotation angle

        //ROTATION STUFF

        //normed vectors
        this.u = new Vector3();
        this.v = new Vector3();
        this.w = new Vector3();

        this.rotMat = new Matrix4();

        //TRANSLATION STUFF

        //object center (affine offset)
        this.M = new Vector3();
        this.transMat = new Matrix4();

        //COMBINED TRANSFORMATION
        this.currentTransform = new Matrix4();
        this.inverseCurrentTransform = new Matrix4();

        //kick off animation
        this.getTransform(this.time);
        this.applyCurrentTransform();

    }

    calculate_u(t) {
        this.u.set(Math.cos(t), 0, Math.sin(t));

        return this.u
    }

    calculate_v() {
        this.v.crossVectors(this.u, this.nAlpha);
        this.v.normalize();

        return this.v;
    }

    calculate_w() {
        this.w.crossVectors(this.u, this.v);
        this.w.multiplyScalar(-1);

        return this.w;
    }

    updateVectors(t) {
        //normed vectors
        this.calculate_u(t);
        this.calculate_v();
        this.calculate_w();
    }

    getRotationMatrix() {
        this.rotMat.makeBasis(this.u, this.w, this.v);

        return this.rotMat;
    }

    //no params because it is dependent on time-dependent vectors
    update_M() {
        this.M.set(
            (this.w.y / Math.tan(this.a)) - (this.w.x / 2), 
            this.w.y / 2, 
            0
        );
        this.M.multiplyScalar(this.h);

        return this.M;
    }

    getTranslationMatrix() {
        this.transMat.makeTranslation(this.M.x, this.M.y, this.M.z);

        return this.transMat;
    }

    getTransform(time) {
        this.updateVectors(time);
        this.getRotationMatrix();

        this.update_M();
        this.getTranslationMatrix();

        this.currentTransform.multiplyMatrices(this.transMat, this.rotMat);

        return this.currentTransform;
    }

    undoCurrentTransform() {
        //calculate and apply the inverse of the current transform
        //gets us back to original position without having to keep and constantly copy original geometry
        this.inverseCurrentTransform.getInverse(this.currentTransform);
        this.principalGeometry.applyMatrix4(this.inverseCurrentTransform);
    }

    applyCurrentTransform() {
        this.principalGeometry.applyMatrix4(this.currentTransform);
    }

    animate() {
        //start by undoing because constructor ends by applying
        this.undoCurrentTransform();
        this.getTransform(this.time);
        this.applyCurrentTransform();
    }
}