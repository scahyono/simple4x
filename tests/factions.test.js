const assert = require('node:assert');
const test = require('node:test');

const {
    FACTIONS,
    SLEEP_FACTION,
    buildFactionPool,
    buildRandomFactionPool,
    isSleepWindow,
    pickRandomFaction
} = require('../script.js');

test('sleep faction is always included in the pool', () => {
    const pool = buildFactionPool(FACTIONS, SLEEP_FACTION);
    assert.ok(pool.includes(SLEEP_FACTION), 'Sleep faction should be present');
    assert.strictEqual(pool.length, FACTIONS.length + 1, 'Pool size should include sleep faction');
});

test('sleep faction is only added to random pool at night with a successful roll', () => {
    const date = new Date(2023, 0, 1, 22, 15);
    const rng = () => 0.2;
    const pool = buildRandomFactionPool({ baseFactions: FACTIONS, sleepFaction: SLEEP_FACTION, date, rng });

    assert.ok(pool.includes(SLEEP_FACTION), 'Sleep faction should be present when in window and roll succeeds');
});

test('sleep faction stays out of the random pool when chance fails', () => {
    const date = new Date(2023, 0, 1, 23, 0);
    const rng = () => 0.9;
    const pool = buildRandomFactionPool({ baseFactions: FACTIONS, sleepFaction: SLEEP_FACTION, date, rng });

    assert.ok(!pool.includes(SLEEP_FACTION), 'Sleep faction should be excluded when roll fails');
});

test('sleep faction is not included outside the nighttime window', () => {
    const date = new Date(2023, 0, 1, 12, 0);
    const rng = () => 0.1;
    const pool = buildRandomFactionPool({ baseFactions: FACTIONS, sleepFaction: SLEEP_FACTION, date, rng });

    assert.ok(!pool.includes(SLEEP_FACTION), 'Sleep faction should be excluded outside the nighttime window');
});

test('isSleepWindow flags 10pm-6am as night', () => {
    const inWindow = [
        new Date(2023, 0, 1, 22, 0, 0),
        new Date(2023, 0, 1, 23, 59, 59),
        new Date(2023, 0, 1, 5, 59, 59)
    ];

    const outWindow = [
        new Date(2023, 0, 1, 6, 0, 0),
        new Date(2023, 0, 1, 21, 59, 59)
    ];

    inWindow.forEach(date => assert.ok(isSleepWindow(date), `${date.toISOString()} should be within the sleep window`));
    outWindow.forEach(date => assert.ok(!isSleepWindow(date), `${date.toISOString()} should be outside the sleep window`));
});

test('random faction selection respects injected RNG', () => {
    const pool = buildFactionPool(FACTIONS, SLEEP_FACTION);
    const rng = () => 0.5; // deterministic
    const picked = pickRandomFaction(pool, rng);
    const expectedIndex = Math.floor(0.5 * pool.length);
    assert.strictEqual(picked, pool[expectedIndex]);
});

test('pickRandomFaction returns null for empty input', () => {
    const picked = pickRandomFaction([], () => 0.1);
    assert.strictEqual(picked, null);
});
