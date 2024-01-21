const canvas = document.getElementById('game');

const controller = new Controller(setup, step, render, cleanup, 50);
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const collider = new Collider();

const CAMERA_H = 200;
const CAMERA_W = renderer.aspect * CAMERA_H;

const PLAYER_A = 100;
const PLAYER_W = Math.PI;

const ROCK_COUNT = 3;

controller.play(30);

function setup(ctx) {
    console.log('Setup...');

    ctx.camera = new Camera(0, 0, 0, CAMERA_W, CAMERA_H);

    ctx.torus = new Torus(-CAMERA_W / 2, CAMERA_W / 2, -CAMERA_H / 2, CAMERA_H / 2);

    ctx.player = {
        enabled: true,
        pos: new Position(0, 0, 0),
        pre: new Position(),
        vel: new Position(),
        mesh: new Mesh([
            new Polygon(
                [[0, 10], [8, -6], [0, -3], [-8, -6]],
                'rgb(0 0 0)',
                'rgb(255 255 0)',
            )
        ]),
        hull: new Hull(
            new Mesh([
                new Circle(0, 0, 10),
            ]),
            'ship',
            ['rock']
        ),
    };

    ctx.shots = [];

    ctx.rocks = [];

    for (let i = 0; i < ROCK_COUNT; i++) {
        ctx.rocks.push({
            enabled: true,
            pos: new Position(
                Math.pow(-1, i) * (i + 1) * 50,
                Math.pow(-1, i * 2) * (i + 1) * 20,
                i * Math.PI / 2
            ),
            vel: new Position(
                Math.pow(-1, i) * (i + 1) * 3,
                Math.pow(-1, i) * (ROCK_COUNT - i) * 6,
                Math.pow(-1, i) * 3
            ),
            mesh: new Mesh([
                new Ellipse(
                    0, 0, 20, 18, 0,
                    'rgb(0 0 0)',
                    'rgb(128 128 128)',
                )
            ]),
            hull: new Hull(
                new Mesh([
                    new Circle(0, 0, 20)
                ]),
                'rock',
                ['ship', 'shot']
            ),
        });
    }

    console.log('Running...');
}

function step(ctx, dt, t) {

    if (ctx.player.enabled) {

        // Handle inputs
        const up = input.keydown('ArrowUp');
        const down = input.keydown('ArrowDown');
        const left = input.keydown('ArrowLeft');
        const right = input.keydown('ArrowRight');
        const space = input.keydown('Space');

        let w = 0;
        let a = 0;
        let shoot = false;

        if (left && !right || right && !left) {
            w = left ? PLAYER_W : -PLAYER_W;
        }

        if (up && !down || down && !up) {
            a = up ? PLAYER_A : -PLAYER_A / 2;
        }

        if (space) {
            shoot = true;
        }

        // Advance state
        ctx.player.pre = { ...ctx.player.pos };

        // Apply physics
        const cos = Math.cos(ctx.player.pos.th + Math.PI / 2);
        const sin = Math.sin(ctx.player.pos.th + Math.PI / 2);

        const ax = a * cos;
        const ay = a * sin;

        const vx = ctx.player.vel.x;
        const vy = ctx.player.vel.y;

        ctx.player.pos.x += (vx * dt) + (.5 * ax * dt * dt);
        ctx.player.pos.y += (vy * dt) + (.5 * ay * dt * dt);
        ctx.player.pos.th += (w * dt);

        ctx.player.vel.x += (ax * dt);
        ctx.player.vel.y += (ay * dt);

        // Normalize toroidal coordinates
        ctx.torus.normalize(ctx.player.pos, ctx.player.pre);

        // Handle collisions
        ctx.player.hull.mesh.prims[0].stroke = 'rgb(0 0 0)';

        collider.pushHull(
            ctx.player.hull,
            ctx.torus.kaleidescope(
                ctx.player.pos,
                ctx.player.hull.mesh.radius()
            ).map(pos => pos.transform()),
            ray => {
                ctx.player.hull.mesh.prims[0].stroke = 'rgb(255 0 0)';
            }
        );
    }

    for (const rock of ctx.rocks) {
        if (rock.enabled) {

            // Advance state
            rock.pre = { ...rock.pos };

            // Apply physics
            rock.pos.x += (rock.vel.x * dt);
            rock.pos.y += (rock.vel.y * dt);
            rock.pos.th += (rock.vel.th * dt);

            // Normalize toroidal coordinates
            ctx.torus.normalize(rock.pos, rock.pre);

            // Handle collisions
            rock.hull.mesh.prims[0].stroke = 'rgb(0 0 0)';

            collider.pushHull(
                rock.hull,
                ctx.torus.kaleidescope(
                    rock.pos,
                    rock.hull.mesh.radius()
                ).map(pos => pos.transform()),
                ray => {
                    rock.hull.mesh.prims[0].stroke = 'rgb(255 0 0)';
                }
            );
        }
    }

    // Detect collision
    collider.collide();
}

function render(ctx, blend) {

    // Render rocks
    for (const rock of ctx.rocks) {
        if (rock.enabled) {
            renderer.pushMesh(
                rock.mesh,
                ctx.torus.kaleidescope(
                    rock.pos.blend(rock.pre, blend),
                    rock.mesh.radius()
                ).map(pos => pos.transform())
            );

            renderer.pushMesh(
                rock.hull.mesh,
                ctx.torus.kaleidescope(
                    rock.pos.blend(rock.pre, blend),
                    rock.hull.mesh.radius()
                ).map(pos => pos.transform())
            );
        }
    }

    // Render player
    if (ctx.player.enabled) {
        renderer.pushMesh(
            ctx.player.mesh,
            ctx.torus.kaleidescope(
                ctx.player.pos.blend(ctx.player.pre, blend),
                ctx.player.mesh.radius()
            ).map(pos => pos.transform())
        );

        renderer.pushMesh(
            ctx.player.hull.mesh,
            ctx.torus.kaleidescope(
                ctx.player.pos.blend(ctx.player.pre, blend),
                ctx.player.hull.mesh.radius()
            ).map(pos => pos.transform())
        );
    }

    // Render shots
    for (const shot of ctx.shots) {
    }

    // Render scene
    renderer.clear('rgb(0 64 128)');
    renderer.render(ctx.camera);
}

function cleanup(ctx) {
    console.log('Cleanup...');

    ctx = {};

    console.log('Done');
}
