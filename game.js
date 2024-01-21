const canvas = document.getElementById('game');

const controller = new Controller(setup, step, render, cleanup, 50);
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const collider = new Collider();

const CAMERA_H = 200;
const CAMERA_W = renderer.aspect * CAMERA_H;

const PLAYER_A = 200;
const PLAYER_W = Math.PI * 1.5;
const PLAYER_RECOIL = 200;

const SHOT_V = 200;
const SHOT_TTL = 1000 * .75 * CAMERA_H / SHOT_V;

const ROCK_COUNT = 3;

controller.play(30);

function setup(ctx) {
    console.log('Setup...');

    ctx.camera = new Camera(0, 0, 0, CAMERA_W, CAMERA_H);

    ctx.torus = new Torus(-CAMERA_W / 2, CAMERA_W / 2, -CAMERA_H / 2, CAMERA_H / 2);

    ctx.player = {
        enabled: true,
        pos: new Position(0, 0, Math.PI / 2),
        pre: new Position(),
        vel: new Position(),
        mesh: new Mesh([
            new Polygon(
                [[10, 0], [-6, 8], [-3, 0], [-6, -8]],
                'black',
                'yellow',
            )
        ]),
        hull: new Hull(
            new Mesh([
                new Circle(0, 0, 10),
            ]),
            'ship',
            ['shot', 'rock']
        ),
    };

    ctx.id = 0;
    ctx.shots = new Map();
    ctx.rocks = new Map();

    for (let i = 0; i < ROCK_COUNT; i++) {
        ctx.rocks.set(++ctx.id, {
            id: ctx.id,
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
                    'black',
                    'gray',
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

        // Handle controls
        const forward = input.keydown('ArrowUp');
        const back = input.keydown('ArrowDown');

        const left = input.keydown('ArrowLeft');
        const right = input.keydown('ArrowRight');

        const shoot = input.keypress('Space');

        let w = 0;
        let a = 0;

        if (left && !right || right && !left) {
            w = left ? PLAYER_W : -PLAYER_W;
        }

        if (forward && !back || back && !forward) {
            a = forward ? PLAYER_A : -PLAYER_A / 2;
        }

        // Determine orientation
        const cos = Math.cos(ctx.player.pos.th);
        const sin = Math.sin(ctx.player.pos.th);

        // Shoot
        if (shoot) {
            a -= PLAYER_RECOIL;

            ctx.shots.set(++ctx.id, {
                id: ctx.id,
                expires: performance.now() + SHOT_TTL,
                pos: new Position(
                    10 * cos + ctx.player.pos.x,
                    10 * sin + ctx.player.pos.y
                ),
                vel: new Position(
                    SHOT_V * cos + ctx.player.vel.x,
                    SHOT_V * sin + ctx.player.vel.y
                ),
                mesh: new Mesh([
                    new Circle(
                        0, 0, 1,
                        'black',
                        'white',
                    )
                ]),
                hull: new Hull(
                    new Mesh([
                        new Circle(0, 0, 1)
                    ]),
                    'shot',
                    ['ship', 'rock']
                ),
            });
        }

        // Advance state
        ctx.player.pre = { ...ctx.player.pos };

        // Apply physics
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
        ctx.player.hull.mesh.prims[0].stroke = 'black';

        collider.pushHull(
            ctx.player.hull,
            ctx.torus.kaleidescope(
                ctx.player.pos,
                ctx.player.hull.mesh.radius()
            ).map(pos => pos.transform()),
            collision => {
                ctx.player.hull.mesh.prims[0].stroke = 'red';
            }
        );
    }

    ctx.shots.forEach(shot => {

        // Handle expiration
        if (performance.now() > shot.expires) {
            ctx.shots.delete(shot.id);
            return;
        }

        // Advance state
        shot.pre = { ...shot.pos };

        // Apply physics
        shot.pos.x += (shot.vel.x * dt);
        shot.pos.y += (shot.vel.y * dt);

        // Normalize toroidal coordinates
        ctx.torus.normalize(shot.pos, shot.pre);

        // Handle collisions
        shot.hull.mesh.prims[0].stroke = 'black';

        collider.pushHull(
            shot.hull,
            ctx.torus.kaleidescope(
                shot.pos,
                shot.hull.mesh.radius()
            ).map(pos => pos.transform()),
            collision => {
                ctx.shots.delete(shot.id);
            }
        );
    });

    ctx.rocks.forEach(rock => {

        // Advance state
        rock.pre = { ...rock.pos };

        // Apply physics
        rock.pos.x += (rock.vel.x * dt);
        rock.pos.y += (rock.vel.y * dt);
        rock.pos.th += (rock.vel.th * dt);

        // Normalize toroidal coordinates
        ctx.torus.normalize(rock.pos, rock.pre);

        // Handle collisions
        rock.hull.mesh.prims[0].stroke = 'black';

        collider.pushHull(
            rock.hull,
            ctx.torus.kaleidescope(
                rock.pos,
                rock.hull.mesh.radius()
            ).map(pos => pos.transform()),
            collision => {
                rock.hull.mesh.prims[0].stroke = 'red';
            }
        );
    });

    // Detect collision
    collider.collide();
}

function render(ctx, blend) {

    // Render rocks
    ctx.rocks.forEach(rock => {
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
    });

    // Render shots
    ctx.shots.forEach(shot => {
        renderer.pushMesh(
            shot.mesh,
            ctx.torus.kaleidescope(
                shot.pos.blend(shot.pre, blend),
                shot.mesh.radius()
            ).map(pos => pos.transform())
        );

        renderer.pushMesh(
            shot.hull.mesh,
            ctx.torus.kaleidescope(
                shot.pos.blend(shot.pre, blend),
                shot.hull.mesh.radius()
            ).map(pos => pos.transform())
        );
    });

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

    // Render scene
    renderer.clear('rgb(0 64 128)');
    renderer.render(ctx.camera);
}

function cleanup(ctx) {
    console.log('Cleanup...');

    ctx = {};

    console.log('Done');
}
