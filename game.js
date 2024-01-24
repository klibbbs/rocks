const canvas = document.getElementById('game');

const controller = new Controller(setup, step, render, cleanup, 20);
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const collider = new Collider();

const CAMERA_H = 200;
const CAMERA_W = renderer.aspect * CAMERA_H;

const PLAYER_A = 200;
const PLAYER_W = Math.PI * 1.5;
const PLAYER_RECOIL = 200;
const PLAYER_REGEN_TTL = 1;
const PLAYER_SAFE_TTL = 3;

const SHOT_V = 200;
const SHOT_TTL = .75 * CAMERA_H / SHOT_V;

const ROCK_COUNT = 3;
const ROCK_SIZE = 4;
const ROCK_SIZE_MULT = 5;
const ROCK_SCORE_MULT = 10;

const LEVEL_RESTART_TTL = 3;
const NEW_LIFE = 10000;

const BONUS_ROCK_MULT = 2000;
const BONUS_TICK = 100;

controller.play();

function setup(ctx) {
    console.log('Setup...');

    ctx.camera = new Camera(0, 0, 0, CAMERA_W, CAMERA_H);

    ctx.torus = new Torus(-CAMERA_W / 2, CAMERA_W / 2, -CAMERA_H / 2, CAMERA_H / 2);

    ctx.player = {
        alive: true,
        invincible: false,
        restart: false,
        level: 1,
        lives: 2,
        next: NEW_LIFE,
        score: 0,
        bonus: 0,
        timer: undefined,
        start: 0,
        pos: new Position(0, 0, Math.PI / 2),
        pre: new Position(),
        vel: new Position(),
        mesh: new Mesh([
            new Polygon(
                [[10, 0], [-6, 8], [-2, 0], [-6, -8]],
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
            size: ROCK_SIZE,
            pos: new Position(
                Math.pow(-1, i) * (i + 1) * 50,
                Math.pow(-1, i * 2) * (i + 1) * 20,
                i * Math.PI / 2
            ),
            vel: new Position(
                Math.pow(-1, i) * (i + 1) * 3,
                Math.pow(-1, i) * (ROCK_COUNT - i) * 6,
                Math.pow(-1, i) * Math.PI / 2
            ),
            mesh: new Mesh([
                new Ellipse(
                    0, 0, ROCK_SIZE * ROCK_SIZE_MULT, ROCK_SIZE * ROCK_SIZE_MULT - 2, 0,
                    'black',
                    'gray',
                )
            ]),
            hull: new Hull(
                new Mesh([
                    new Circle(0, 0, ROCK_SIZE * ROCK_SIZE_MULT)
                ]),
                'rock',
                ['ship', 'shot']
            ),
        });
    }

    console.log('Running...');
}

function step(ctx, dt, t) {

    if (t > ctx.player.timer) {
        if (ctx.player.restart) {
            ctx.player.restart = false;
            ctx.player.start = t;
            ctx.player.timer = t + PLAYER_SAFE_TTL;
            ctx.player.invincible = true;

            ctx.player.pos = new Position(0, 0, Math.PI / 2);
            ctx.player.pre = { ...ctx.player.pos };
            ctx.player.vel = new Position();

            for (let i = 0; i < ROCK_COUNT + ctx.player.level - 1; i++) {
                ctx.rocks.set(++ctx.id, {
                    id: ctx.id,
                    size: ROCK_SIZE,
                    pos: new Position(
                        Math.pow(-1, i) * (i + 1) * 50,
                        Math.pow(-1, i * 2) * (i + 1) * 20,
                        i * Math.PI / 2
                    ),
                    vel: new Position(
                        Math.pow(-1, i) * (i + 1) * 3,
                        Math.pow(-1, i) * (ROCK_COUNT - i) * 6,
                        Math.pow(-1, i) * Math.PI / 2
                    ),
                    mesh: new Mesh([
                        new Ellipse(
                            0, 0, ROCK_SIZE * ROCK_SIZE_MULT, ROCK_SIZE * ROCK_SIZE_MULT - 2, 0,
                            'black',
                            'gray',
                        )
                    ]),
                    hull: new Hull(
                        new Mesh([
                            new Circle(0, 0, ROCK_SIZE * ROCK_SIZE_MULT)
                        ]),
                        'rock',
                        ['ship', 'shot']
                    ),
                });
            }
        } else if (ctx.player.invincible) {
            ctx.player.invincible = false;
            ctx.player.timer = undefined;
        } else if (!ctx.player.alive) {
            ctx.player.alive = true;
            ctx.player.invincible = true;
            ctx.player.timer = ctx.player.timer = t + PLAYER_SAFE_TTL;

            ctx.player.pos = new Position(0, 0, Math.PI / 2);
            ctx.player.pre = { ...ctx.player.pos };
            ctx.player.vel = new Position();
        }
    }

    if (ctx.rocks.size <= 0 && ctx.player.restart === false) {
        const rocks = ctx.player.level + ROCK_COUNT - 1;

        ctx.player.restart = true;
        ctx.player.bonus = Math.max(BONUS_ROCK_MULT * rocks - (t - ctx.player.start) * BONUS_TICK, 0);
        ctx.player.score += ctx.player.bonus;
        ctx.player.level++;
        ctx.player.timer = t + LEVEL_RESTART_TTL;
    }

    if (ctx.player.score >= ctx.player.next) {
        ctx.player.lives++;
        ctx.player.next += NEW_LIFE;
    }

    if (ctx.player.alive) {

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
                expires: t + SHOT_TTL,
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
        ctx.player.mesh.prims[0].fill = ctx.player.invincible ? 'orange' : 'yellow';

        collider.pushHull(
            ctx.player.hull,
            ctx.torus.kaleidescope(
                ctx.player.pos,
                ctx.player.hull.mesh.radius()
            ).map(pos => pos.transform()),
            collision => {
                ctx.player.hull.mesh.prims[0].stroke = 'red';

                if (ctx.player.invincible) {
                    ctx.player.mesh.prims[0].fill = 'red';
                } else {
                    // Destroy player
                    ctx.player.alive = false;

                    if (ctx.player.lives-- > 0) {
                        ctx.player.timer = t + PLAYER_REGEN_TTL;
                    } else {
                        ctx.player.timer = undefined;

                        // GAME OVER
                    }
                }
            }
        );
    }

    ctx.shots.forEach(shot => {

        // Handle expiration
        if (t > shot.expires) {
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

                if (collision.target === 'ship' && ctx.player.invincible) {
                    return;
                }

                // Increase score
                if (collision.target === 'shot') {
                    let score = ROCK_SCORE_MULT;

                    for (let i = ROCK_SIZE; i > rock.size; i--) {
                        score += score;
                    }

                    ctx.player.score += score;
                }

                // Split rocks
                if (rock.size > 1) {
                    const size = rock.size - 1;
                    const r = size * ROCK_SIZE_MULT;
                    const v = Math.sqrt(rock.vel.x * rock.vel.x + rock.vel.y * rock.vel.y) * 1.25;
                    const cos = Math.cos(rock.pos.th);
                    const sin = Math.sin(rock.pos.th);

                    for (let i = 0; i < 2; i++) {
                        const sign = Math.pow(-1, i);
                        const pos = new Position(
                            r * cos * sign + rock.pos.x,
                            r * sin * sign + rock.pos.y,
                            i * Math.PI / 3 + rock.pos.th
                        );

                        ctx.rocks.set(++ctx.id, {
                            id: ctx.id,
                            size: size,
                            pos: pos,
                            pre: pos,
                            vel: new Position(
                                v * cos * sign + rock.vel.x,
                                v * sin * sign + rock.vel.y,
                                sign * rock.vel.th * 1.25,
                            ),
                            mesh: new Mesh([
                                new Ellipse(
                                    0, 0, r, r - 2, 0,
                                    'black',
                                    'gray',
                                )
                            ]),
                            hull: new Hull(
                                new Mesh([
                                    new Circle(0, 0, r)
                                ]),
                                'rock',
                                ['ship', 'shot']
                            ),
                        });
                    }
                }

                // Destroy original rock
                ctx.rocks.delete(rock.id);
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
    });

    // Render player
    if (ctx.player.alive) {
        renderer.pushMesh(
            ctx.player.mesh,
            ctx.torus.kaleidescope(
                ctx.player.pos.blend(ctx.player.pre, blend),
                ctx.player.mesh.radius()
            ).map(pos => pos.transform())
        );
    }

    // Render scene
    renderer.clear('rgb(0 64 128)');
    renderer.render(ctx.camera);

    // Render HUD
    for (let i = 0; i < ctx.player.lives; i++) {
        renderer.pushMesh(
            new Mesh([
                new Polygon(
                    [[0, 5], [-4, -3], [0, -1], [4, -3]],
                    'black',
                    'yellow',
                )
            ]),
            [Transform.Translate(
                CAMERA_W / 2 - 15 - (i * 15),
                10 - CAMERA_H / 2
            )]
        );
    }

    renderer.pushPrimitive(
        new Text(0, 0, ctx.player.score, 'white', '20px monospace'),
        [Transform.Translate(
            10 - CAMERA_W / 2,
            8 - CAMERA_H / 2
        )]
    );

    if (ctx.player.lives < 0) {
        renderer.pushPrimitive(
            new Text(0, 0, 'GAME OVER', 'white', '60px monospace', 'center'),
            [Transform.Identity()]
        );
    }

    if (ctx.player.restart) {
        renderer.pushPrimitive(
            new Text(0, 0, `TIME BONUS ${ctx.player.bonus}`, 'white', '40px monospace', 'center'),
            [Transform.Identity()]
        );
    }

    renderer.render(ctx.camera);
}

function cleanup(ctx) {
    console.log('Cleanup...');

    ctx = {};

    console.log('Done');
}
