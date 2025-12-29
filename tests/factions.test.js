const assert = require('node:assert');
const test = require('node:test');

const {
    FACTIONS,
    SLEEP_FACTION,
    buildFactionPool,
    buildRandomFactionPool,
    isSleepWindow,
    pickRandomFaction,
    createSequenceRng
} = require('../script.js');

test('sleep faction is always included in the pool', () => {
    const pool = buildFactionPool(FACTIONS, SLEEP_FACTION);
    assert.ok(pool.includes(SLEEP_FACTION), 'Sleep faction should be present');
    assert.strictEqual(pool.length, FACTIONS.length + 1, 'Pool size should include sleep faction');
});

test('sleep faction is always added to the random pool at night', () => {
    const date = new Date(2023, 0, 1, 22, 15);
    const pool = buildRandomFactionPool({ baseFactions: FACTIONS, sleepFaction: SLEEP_FACTION, date });

    assert.ok(pool.includes(SLEEP_FACTION), 'Sleep faction should always be present at night');
    assert.strictEqual(pool.length, FACTIONS.length + 1, 'Nighttime pool should include sleep faction in addition to base factions');
});

test('sleep faction has a 50% selection chance at night with deterministic RNG', () => {
    const date = new Date(2023, 0, 1, 23, 0);
    const rng = createSequenceRng([0.1, 0.4, 0.9, 0.6, 0.6, 0.3, 0.2, 0.8]);
    const pool = buildRandomFactionPool({ baseFactions: FACTIONS, sleepFaction: SLEEP_FACTION, date });

    let sleepPicked = 0;
    for (let i = 0; i < 4; i++) {
        const picked = pickRandomFaction(pool, rng, { date, sleepFaction: SLEEP_FACTION });
        if (picked === SLEEP_FACTION) sleepPicked += 1;
    }

    assert.strictEqual(sleepPicked, 2, 'Sleep faction should be selected 50% of the time during the sleep window');
});

test('sleep faction is not included outside the nighttime window', () => {
    const date = new Date(2023, 0, 1, 12, 0);
    const pool = buildRandomFactionPool({ baseFactions: FACTIONS, sleepFaction: SLEEP_FACTION, date });

    assert.ok(!pool.includes(SLEEP_FACTION), 'Sleep faction should be excluded outside the nighttime window');
    assert.strictEqual(pool.length, FACTIONS.length, 'Daytime should only surface base factions');
});

test('sleep faction stays present at 5:50am', () => {
    const date = new Date(2023, 0, 1, 5, 50);
    const pool = buildRandomFactionPool({ baseFactions: FACTIONS, sleepFaction: SLEEP_FACTION, date });

    assert.ok(pool.includes(SLEEP_FACTION), 'Early morning sleep window should include the sleep faction');
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
    const date = new Date(2023, 0, 1, 12, 0);
    const picked = pickRandomFaction(pool, rng, { date });
    const expectedIndex = Math.floor(0.5 * pool.length);
    assert.strictEqual(picked, pool[expectedIndex]);
});

test('pickRandomFaction returns null for empty input', () => {
    const picked = pickRandomFaction([], () => 0.1);
    assert.strictEqual(picked, null);
});
