import {Vector3, Matrix3} from "./lib/three.js-r115/build/three.module.js";

export class Kaleidocycle {

    constructor(size, number) {
        this.s = size; //side length
        this.h = size / Math.SQRT2; //legth of PQ

        this.n = number; //how many tetrahedra
        this.a = 2 * Math.PI / this.n; //alpha

        this.time = 0; //"time"–really the rotation angle

        //normed vectors
        this.u = this.calculate_u(this.time);
        this.v = this.calculate_v(this.time);
        this.w = this.calculate_w(this.time);

        //P and Q
        this.P = this.calculate_P(this.time);
        this.Q = this.calculate_Q(this.time);

    }

    calculate_u(t) {
        return new Vector3(Math.cos(t), 0, Math.sin(t));
    }

    calculate_v(t) {
        return new Vector3(-Math.sin(t), -Math.sin(t)*Math.tan(this.a), Math.cos(t))
                    .multiplyScalar(1/(Math.sqrt(1 + (Math.sin(t)**2) * (Math.tan(this.a)**2))));
    }

    calculate_w(t) {
        return new Vector3(-(Math.sin(t)**2)*Math.tan(this.a), 1, Math.cos(t)*Math.sin(t)*Math.tan(this.a))
                    .multiplyScalar(1/(Math.sqrt(1 + (Math.sin(t)**2) * (Math.tan(this.a)**2))));
    }

    //no params because it is dependent on a time-dependent vector
    calculate_P() {
        return new Vector3(this.w.y / Math.tan(this.a) - this.w.x, 0, -this.w.z/2)
                    .multiplyScalar(this.h);
    }

    calculate_Q() {
        return new Vector3(this.w.y / Math.tan(this.a), this.w.y, this.w.z/2)
                    .multiplyScalar(this.h);
    }

    updateVectors() {
        //normed vectors
        this.u = this.calculate_u(this.time);
        this.v = this.calculate_v(this.time);
        this.w = this.calculate_w(this.time);

        //P and Q
        this.P = this.calculate_P(this.time);
        this.Q = this.calculate_Q(this.time);
    }

}