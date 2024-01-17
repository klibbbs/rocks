class Renderer {

    #gfx;
    #screen;
    #view;
    aspect;

    #default_stroke = 'rgba(0, 0, 0, 1)';
    #default_fill = 'rgba(0, 0, 0, 0)';

    #primitives = [];
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

    pushMesh(mesh, transform) {
        for (const prim of mesh.prims) {
            this.pushPrimitive(prim, transform);
        }
    }

    pushPrimitive(primitive, transform) {
        this.#primitives.push(primitive);
        this.#transforms.push(transform);
    }

    render(camera) {
        const num = this.#primitives.length;

        for (let i = 0; i < num; i++) {
            this.#primitives[i].draw(
                this.#gfx,
                Transform.Multiply(this.#view, camera.transform(), this.#transforms[i])
            );
        }

        this.#primitives = [];
        this.#transforms = [];
    }
}
