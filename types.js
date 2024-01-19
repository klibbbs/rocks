class Torus {

    #l;
    #r;
    #b;
    #t;
    #w;
    #h;

    constructor(l, r, b, t) {
        this.#l = l;
        this.#r = r;
        this.#b = b;
        this.#t = t;
        this.#w = this.#r - this.#l;
        this.#h = this.#t - this.#b;
    }

    normalize(pos, pre) {
        if (pos.x > this.#r) {
            pos.x -= this.#w;
            pre.x -= this.#w;
        } else if (pos.x < this.#l) {
            pos.x += this.#w;
            pre.x += this.#w;
        }

        if (pos.y > this.#t) {
            pos.y -= this.#h;
            pre.y -= this.#h;
        } else if (pos.y < this.#b) {
            pos.y += this.#h;
            pre.y += this.#h;
        }
    }

    kaleidescope(pos, r) {
        let k = [pos];

        let x;
        let y;

        if (pos.x + r > this.#r) {
            x = pos.x - this.#w;
        }

        if (pos.x - r < this.#l) {
            x = pos.x + this.#w;
        }

        if (pos.y + r > this.#t) {
            y = pos.y - this.#h;
        }

        if (pos.y - r < this.#b) {
            y = pos.y + this.#h;
        }

        if (x !== undefined) {
            k.push(new Position(x, pos.y, pos.th));
        }

        if (y !== undefined) {
            k.push(new Position(pos.x, y, pos.th));
        }

        if (x !== undefined && y !== undefined) {
            k.push(new Position(x, y, pos.th));
        }

        return k;
    }
}

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

    #r;

    constructor(prims) {
        this.prims = prims || [];

        this.#r = Math.max(...this.prims.map(prim => prim.radius()));
    }

    radius() {
        return this.#r;
    }
}

class Primitive {

    #r;

    constructor(r) {
        this.#r = r;
    }

    radius() {
        return this.#r;
    }

    draw(gfx, transform) {
    }
}

class Ellipse extends Primitive {

    m;
    stroke;
    fill;

    constructor(x, y, a, b, th, stroke, fill) {
        super(Math.max(a, b));

        this.m = [
            x, x + a * Math.cos(th), x - b * Math.sin(th),
            y, y + a * Math.sin(th), y + b * Math.cos(th),
            1, 1, 1
        ];

        this.stroke = stroke;
        this.fill = fill;
    }

    draw(gfx, transform) {
        const m = Transform.Multiply(transform, this.m);
        const x = m[0] / m[6];
        const y = m[3] / m[6];
        const ax = m[1] / m[7];
        const ay = m[4] / m[7];
        const bx = m[2] / m[8];
        const by = m[5] / m[8];
        const a = Math.sqrt((ax - x) * (ax - x) + (ay - y) * (ay - y));
        const b = Math.sqrt((bx - x) * (bx - x) + (by - y) * (by - y));
        const th = Math.acos((ax - x) / a);

        gfx.beginPath();

        gfx.strokeStyle = this.stroke;
        gfx.fillStyle = this.fill;

        gfx.ellipse(x, y, a, b, th, 0, Math.PI * 2);

        gfx.stroke();
        gfx.fill();
    }
}

class Circle extends Ellipse {

    constructor(x, y, r) {
        super(x, y, r, r, 0);
    }
}

class Polygon extends Primitive {

    vs;
    stroke;
    fill;

    constructor(vs, stroke, fill) {
        super(Math.sqrt(Math.max(...vs.map(v => v[0] * v[0] + v[1] * v[1]))));

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
