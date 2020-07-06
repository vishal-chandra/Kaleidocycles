import {Vector3, Matrix3} from "./lib/three.js-r115/build/three.module.js";
import {sin, cos, tan, sqrt, SQRT2, PI} from "Math.js"

let Kaleidocycle = class {
    constructor(size, number) {
        this.s = size; //side length
        this.h = size / SQRT2; //legth of PQ

        this.n = number; //how many tetrahedra
        this.a = 2 * PI / n; //alpha

        this.time = 0; //"time"–really the rotation angle

        //normed vectors
        this.u = calculate_u(time);
        this.v = calculate_v(time);
        this.w = calculate_w(time);

        //P and Q
        this.P = calculate_P(time);
        this.Q = calculate_Q(time);

    }

    calculate_u(t) {
        return new Vector3(cos(t), 0, sin(t));
    }

    calculate_v(t) {
        return new Vector3(-sin(t), -sin(t)*tan(a), cos(t))
                    .multiplyScalar(1/(sqrt(1 + (sin(t)**2) * (tan(a)**2))));
    }

    calculate_w(t) {
        return new Vector3(-(sin(t)**2)*tan(a), 1, cos(t)*sin(t)*tan(a))
                    .multiplyScalar(1/(sqrt(1 + (sin(t)**2) * (tan(a)**2))));
    }

    //no params because it is dependent on a time-dependent vector
    calculate_P() {
        return new Vector3(this.w.y / tan(a) - this.w.x, 0, -this.w.z/2)
                    .multiplyScalar(this.h);
    }

    calculate_Q() {
        return new Vector3(this.w.y / tan(a), this.w.y, this.w.z/2)
                    .multiplyScalar(this.h);
    }

}