const assert = require('node:assert');
const test = require('node:test');

const { findSpawnPositionsForMap, TERRAIN } = require('../script.js');

const buildMap = (width, height) => {
    const map = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            row.push({
                x,
                y,
                type: TERRAIN.GRASS
            });
        }
        map.push(row);
    }
    return map;
};

const getNeighbors = (map, x, y) => {
    const coords = [
        [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1],
        [x + 1, y + 1], [x + 1, y - 1], [x - 1, y + 1], [x - 1, y - 1]
    ];
    return coords
        .filter(([nx, ny]) => nx >= 0 && ny >= 0 && ny < map.length && nx < map[0].length)
        .map(([nx, ny]) => map[ny][nx]);
};

test('player and enemy do not start on the same tile', () => {
    const map = buildMap(5, 5);

    // Sequence forces an initial overlap attempt followed by a different tile.
    const rngValues = [0.9, 0.1, 0, 0, 0.6, 0.2];
    let idx = 0;
    const rng = () => rngValues[idx++] ?? 0;

    const spawns = findSpawnPositionsForMap(
        map,
        (x, y) => getNeighbors(map, x, y),
        rng
    );

    assert.ok(spawns, 'Expected valid spawn positions');
    assert.notDeepStrictEqual(
        spawns.player,
        spawns.enemy,
        'Spawns should not share the same tile'
    );
});
