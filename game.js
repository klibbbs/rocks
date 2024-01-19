const canvas = document.getElementById('game');

const controller = new Controller(setup, step, render, cleanup, 50);
const renderer = new Renderer(canvas);
const input = new Input(canvas);

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
                [[0, 10], [10, -10], [0, -5], [-10, -10]],
                'rgb(0 0 0)',
                'rgb(255 255 0)',
            )
        ]),
    };

    ctx.shots = [];

    ctx.rocks = [];

    for (let i = 0; i < ROCK_COUNT; i++) {
        ctx.rocks.push({
            enabled: true,
            pos: new Position(Math.pow(-1, i) * (i + 1) * 50, Math.pow(-1, i * 2) * (i + 1) * 20, 0),
            vel: new Position(0, 0, 2),
            mesh: new Mesh([
                new Ellipse(
                    0, 0, 20, 15, 0,
                    'rgb(0 0 0)',
                    'rgb(128 128 128)',
                )
            ]),
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
        ctx.player.pre = {...ctx.player.pos};

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
    }

    for (const rock of ctx.rocks) {
        if (rock.enabled) {

            // Advance state
            rock.pre = {...rock.pos};

            // Apply physics
            rock.pos.x += (rock.vel.x * dt);
            rock.pos.y += (rock.vel.y * dt);
            rock.pos.th += (rock.vel.th * dt);

            // Normalize toroidal coordinates
            ctx.torus.normalize(rock.pos, rock.pre);
        }
    }
}

function render(ctx, blend) {

    // Render player
    if (ctx.player.enabled) {
        ctx.torus.kaleidescope(
            ctx.player.pos.blend(ctx.player.pre, blend),
            ctx.player.mesh.radius()
        ).forEach(pos => renderer.pushMesh(ctx.player.mesh, pos.transform()));
    }

    // Render rocks
    for (const rock of ctx.rocks) {
        if (rock.enabled) {
            ctx.torus.kaleidescope(
                rock.pos.blend(rock.pre, blend),
                rock.mesh.radius()
            ).forEach(pos => renderer.pushMesh(rock.mesh, pos.transform()));
        }
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
