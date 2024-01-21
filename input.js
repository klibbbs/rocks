class Input {

    #canvas;
    #keydown = {};

    constructor(canvas) {
        this.#canvas = canvas;

        document.addEventListener('keydown', event => {
            if (event.repeat) {
                return;
            }

            this.#keydown[event.code] = event;
            this.#keydown[event.code].__new = true;
        });

        document.addEventListener('keyup', event => {
            delete this.#keydown[event.code];
        });
    }

    keydown(code) {
        return this.#keydown[code];
    }

    keypress(code) {
        if (this.#keydown[code] && this.#keydown[code].__new) {
            this.#keydown[code].__new = false;

            return this.#keydown[code];
        }
    }
}
