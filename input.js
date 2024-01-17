class Input {

    #canvas;
    #keydown = {};

    constructor(canvas) {
        this.#canvas = canvas;

        document.addEventListener('keydown', event => {
            this.#keydown[event.key] = event;
        });

        document.addEventListener('keyup', event => {
            delete this.#keydown[event.key];
        });
    }

    keydown(key) {
        return this.#keydown[key];
    }
}
