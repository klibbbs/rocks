class Camera {

    x;
    y;
    th;
    w;
    h;

    constructor(x, y, th, w, h) {
        this.x = x || 0;
        this.y = y || 0;
        this.th = th || 0;
        this.w = w || 0;
        this.h = h || 0;
    }

    transform() {
        return Transform.Multiply(
            Transform.Translate(this.x, this.y),
            Transform.Rotate(this.th),
            Transform.Project(this.w, this.h),
        );
    }
}

class Position {

    x;
    y;
    th;

    constructor(x, y, th) {
        this.x = x || 0;
        this.y = y || 0;
        this.th = th || 0;
    }

    blend(pre, blend) {
        return new Position(
            pre.x + blend * (this.x - pre.x),
            pre.y + blend * (this.y - pre.y),
            pre.th + blend * (this.th - pre.th)
        );
    }

    transform() {
        return Transform.Multiply(
            Transform.Translate(this.x, this.y),
            Transform.Rotate(this.th),
        );
    }
}

class Transform {

    static Apply(m, v) {
        const w = m[6] * v[0] + m[7] * v[1] + m[8];

        return [
            (m[0] * v[0] + m[1] * v[1] + m[2]) / w,
            (m[3] * v[0] + m[4] * v[1] + m[5]) / w,
        ];
    }

    static Multiply(m, ...ms) {
        let p = m;

        for (const mm of ms) {
            p = [
                p[0] * mm[0] + p[1] * mm[3] + p[2] * mm[6],
                p[0] * mm[1] + p[1] * mm[4] + p[2] * mm[7],
                p[0] * mm[2] + p[1] * mm[5] + p[2] * mm[8],
                p[3] * mm[0] + p[4] * mm[3] + p[5] * mm[6],
                p[3] * mm[1] + p[4] * mm[4] + p[5] * mm[7],
                p[3] * mm[2] + p[4] * mm[5] + p[5] * mm[8],
                p[6] * mm[0] + p[7] * mm[3] + p[8] * mm[6],
                p[6] * mm[1] + p[7] * mm[4] + p[8] * mm[7],
                p[6] * mm[2] + p[7] * mm[5] + p[8] * mm[8],
            ];
        }

        return p;
    }

    static Identity() {
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }

    static Translate(x, y) {
        return [1, 0, x, 0, 1, y, 0, 0, 1];
    }

    static Rotate(th) {
        return [Math.cos(th), -Math.sin(th), 0, Math.sin(th), Math.cos(th), 0, 0, 0, 1];
    }

    static Scale(x, y) {
        return [x, 0, 0, 0, y, 0, 0, 0, 1];
    }

    static Project(w, h) {
        return [2 / w, 0, 0, 0, 2 / h, 0, 0, 0, 1];
    }
}

class Rectangle {

    x;
    y;
    w;
    h;

    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

class Mesh {

    prims;

    constructor(prims) {
        this.prims = prims || [];
    }

    transform(transform) {
    }

    draw(gfx, transform) {

    }
}

class Ellipse {

    x;
    y;
    a;
    b;
    th;

    constructor(x, y, a, b, th) {
        this.x = x;
        this.y = y;
        this.a = a;
        this.b = b;
        this.th = th;
    }

    draw(gfx, transform) {

    }
}

class Circle extends Ellipse {

    r;

    constructor(x, y, r) {
        super(x, y, r, r, 0);

        this.r = r;
    }
}

class Polygon {

    vs;

    constructor(vs, stroke, fill) {
        this.vs = vs;
        this.stroke = stroke;
        this.fill = fill;
    }

    draw(gfx, transform) {
        const [start, ...coords] = this.vs.map(v => Transform.Apply(transform, v));

        gfx.beginPath();

        gfx.strokeStyle = this.stroke;
        gfx.fillStyle = this.fill;

        gfx.moveTo(start[0], start[1]);

        for (const coord of coords) {
            gfx.lineTo(coord[0], coord[1]);
        }

        gfx.closePath();
        gfx.stroke();
        gfx.fill();
    }
}
