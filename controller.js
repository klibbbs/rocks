class Controller {

    #setup;
    #step;
    #render;
    #cleanup;

    #step_ms;
    #elapsed_ms = 0;

    #initialized = false;
    #running = false;

    #ctx = {};

    constructor(setup, step, render, cleanup, step_ms) {
        this.#setup = setup || (() => {});
        this.#step = step || (() => {});
        this.#render = render || (() => {});
        this.#cleanup = cleanup || (() => {});

        this.#step_ms = step_ms;
    }

    init() {
        if (this.#initialized) {
            return;
        }

        this.#setup(this.#ctx);

        this.#initialized = true;
    }

    stop() {
        if (!this.#running) {
            return;
        }

        this.#cleanup(this.#ctx);

        this.#running = false;
        this.#initialized = false;
    }

    play(t) {
        const self = this;

        if (this.#running) {
            return;
        } else {
            this.#running = true;
        }

        this.init();

        // Display frame
        let step_lag_ms = 0;

        function frame(frame_ms) {
            if (self.#step_ms) {
                // Limit accumulated lag to twice the step time
                if (frame_ms > self.#step_ms * 2) {
                    step_lag_ms += self.#step_ms * 2;
                } else {
                    step_lag_ms += frame_ms;
                }

                // Advance logic steps until logical time has surpassed rendered time
                while (step_lag_ms > 0) {
                    self.#elapsed_ms += self.#step_ms;
                    self.#step(self.#ctx, self.#step_ms * .001, self.#elapsed_ms * .001);
                    step_lag_ms -= self.#step_ms;
                }

                // Determine how far into the last logical step the last render was
                var blend = 1 + step_lag_ms / self.#step_ms;

                // Render an interpolated frame
                self.#render(self.#ctx, blend);
            } else {
                // Execute a single step and frame render
                self.#elapsed_ms += frame_ms;
                self.#step(self.#ctx, rame_ms * .001, self.#elapsed_ms + .001);
                self.#render(self.#ctx, 1);
            }
        }

        // Main display loop
        let last_render_ms = 0;

        window.requestAnimationFrame(function next(render_ms) {
            const frame_ms = render_ms - last_render_ms;
            last_render_ms = render_ms;

            // Execute frame
            frame(frame_ms);

            // Enforce time limit
            if (self.#elapsed_ms * .001 > t) {
                self.stop();
            }

            // Request next frame
            if (self.#running) {
                window.requestAnimationFrame(next);
            }
        });
    }
}
