class Renderer {

    #gfx;
    #screen;
    #view;
    aspect;

    #default_stroke = 'rgba(0, 0, 0, 1)';
    #default_fill = 'rgba(0, 0, 0, 0)';

    #prims = [];
    #transforms = [];

    constructor(canvas, rect) {
        this.#gfx = canvas.getContext('2d');

        this.#screen = rect || new Rectangle(
            0,
            0,
            canvas.getAttribute('width'),
            canvas.getAttribute('height')
        );

        this.#view = Transform.Multiply(
            Transform.Scale(this.#screen.w / 2, -this.#screen.h / 2),
            Transform.Translate(1, -1),
        );

        this.aspect = this.#screen.w / this.#screen.h;
    }

    clear(fill) {
        this.#gfx.fillStyle = fill || this.#default_fill;
        this.#gfx.fillRect(this.#screen.x, this.#screen.y, this.#screen.w, this.#screen.h);
    }

    pushMesh(mesh, transforms) {
        for (const prim of mesh.prims) {
            this.pushPrimitive(prim, transforms);
        }
    }

    pushPrimitive(prim, transforms) {
        this.#prims.push(prim);
        this.#transforms.push(transforms);
    }

    render(camera) {
        const num = this.#prims.length;

        for (let i = 0; i < num; i++) {
            for (const t of this.#transforms[i]) {
                const transform = Transform.Multiply(this.#view, camera.transform(), t);

                this.#prims[i].transform(transform).draw(this.#gfx);
            }
        }

        this.#prims = [];
        this.#transforms = [];
    }
}
