class Collider {

    #hulls = [];
    #transforms = [];
    #handlers = [];

    pushHull(hull, transforms, handler) {
        this.#hulls.push(hull);
        this.#transforms.push(transforms);
        this.#handlers.push(handler);
    }

    collideHulls(h1, t1, h2, t2) {
        if (!h1.targets.includes(h2.tag) || !h2.targets.includes(h1.tag)) {
            return;
        }

        for (const t of t1) {
            for (const u of t2) {

                const o1 = Transform.Origin(t);
                const o2 = Transform.Origin(u);
                const r1 = h1.mesh.radius();
                const r2 = h2.mesh.radius();

                if (Math.abs(o1[0] - o2[0]) > r1 + r2) {
                    continue;
                }

                if (Math.abs(o1[1] - o2[1]) > r1 + r2) {
                    continue;
                }

                for (let p of h1.mesh.prims) {
                    for (let q of h2.mesh.prims) {
                        p = p.transform(t);
                        q = q.transform(u);

                        const ray = p.collide(q);

                        if (ray) {
                            return ray;
                        }
                    }
                }
            }
        }
    }

    collide() {
        const num = this.#hulls.length;

        for (let i = 0; i < num; i++) {
            for (let j = i + 1; j < num; j++) {
                const ray = this.collideHulls(
                    this.#hulls[i],
                    this.#transforms[i],
                    this.#hulls[j],
                    this.#transforms[j]
                );

                if (ray) {
                    if (this.#handlers[i]) {
                        this.#handlers[i]({
                            ray: ray,
                            target: this.#hulls[j].tag,
                        });
                    }

                    if (this.#handlers[j]) {
                        this.#handlers[j]({
                            ray: ray,
                            target: this.#hulls[i].tag,
                        });
                    }
                }
            }
        }

        this.#hulls = [];
        this.#transforms = [];
        this.#handlers = [];
    }
}
