/**
 * Pocket Reign - Territory Edition
 * 
 * Core Logic:
 * - Game Loop (requestAnimationFrame)
 * - Map Generation
 * - Unit Management with Animation
 * - Territory Control
 * - AI Enemy
 * - Encirclement Victory
 */

// --- Constants & Config ---
const MAP_WIDTH = 10;
const MAP_HEIGHT = 10;
const ANIMATION_SPEED = 0.2; // Speed of unit movement (0-1)

const FACTIONS = [
    {
        player: '⚔️',
        enemy: '⚔️',
        label: 'Warrior vs Warrior',
        prayer: '⚔️ O Almighty, grant me the strength to face every real warrior that rises against me.',
        link: 'https://tasks.google.com'
    },
    {
        player: '👨‍⚕️',
        enemy: '🦠',
        label: 'Healer vs Disease',
        prayer: '🧬 O Healer, protect my body and spirit from every real disease that approaches.',
        link: 'https://tasks.google.com'
    },
    {
        player: '🏃',
        enemy: '🍔',
        label: 'Discipline vs Temptation',
        prayer: '💪 O Protector, guard my heart from the pull of real temptation.',
        link: 'https://tasks.google.com'
    },
    {
        player: '🧘',
        enemy: '🌪️',
        label: 'Calm vs Chaos',
        prayer: '🕊️ O Source of Peace, steady my breath as I stand inside real chaos.',
        link: 'https://music.youtube.com/'
    },
    {
        player: '💼',
        enemy: '📉',
        label: 'Business vs Setbacks',
        prayer: '📈 O Sustainer, lift me through real setbacks and strengthen my steps.',
        link: 'https://calendar.google.com/calendar/r/day'
    },
    {
        player: '📊',
        enemy: '💸',
        label: 'Growth vs Expenses',
        prayer: '💹 O Provider, bless my growth and shield me from real expenses that drain my path.',
        link: 'https://mail.google.com/'
    },
    {
        player: '🤝',
        enemy: '🚫',
        label: 'Closer vs Rejection',
        prayer: '📨 O Opener of Hearts, grant me grace and courage before every real rejection.',
        link: 'https://api.whatsapp.com/send/?text=Hi'
    },
    {
        player: '🧺',
        enemy: '👟',
        label: 'Basket vs Shoe',
        prayer: '🏀 O Guide, align my aim and help me rise over every real obstacle.',
        link: 'https://music.youtube.com/'
    },
    {
        player: '🧹',
        enemy: '💧',
        label: 'Mop vs Spill',
        prayer: '🧼 O Purifier, give me patience to restore order from every real spill.',
        link: 'https://music.youtube.com/'
    },
    {
        player: '✨',
        enemy: '🕳️',
        label: 'Light vs Void',
        prayer: '✨ O Light of the heavens and the earth, illuminate every real void I face.',
        link: 'https://notebooklm.google.com/'
    },
    {
        player: '🔥',
        enemy: '🧊',
        label: 'Motivation vs Procrastination',
        prayer: '🔥 O Inspirer, ignite my will and melt away real procrastination from my path.',
        link: 'https://music.youtube.com/'
    }
];

const TERRAIN = {
    GRASS: { color: '#4caf50', moveCost: 1, name: 'Grassland' },
    WATER: { color: '#2196f3', moveCost: Infinity, name: 'Ocean' },
    MOUNTAIN: { color: '#795548', moveCost: Infinity, name: 'Mountain' },
    FOREST: { color: '#2e7d32', moveCost: 2, name: 'Forest' },
    SAND: { color: '#fdd835', moveCost: 1, name: 'Desert' }
};

const UNITS = {
    WARRIOR: { name: 'Warrior', symbol: '⚔️', moves: 2, cost: 50, attack: 5, defense: 3 }
};

// --- Classes ---

class Tile {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.unit = null;
        this.owner = null; // 'player', 'enemy', or null
        this.fog = true;
        this.explored = false;
    }
}

class Unit {
    constructor(type, owner, x, y) {
        this.type = type;
        this.owner = owner;
        this.x = x;
        this.y = y;

        // Animation coords (visual position)
        this.drawX = x;
        this.drawY = y;

        this.movesLeft = UNITS[type].moves;
        this.maxMoves = UNITS[type].moves;
        this.id = Math.random().toString(36).substr(2, 9);
    }

    resetTurn() {
        this.movesLeft = this.maxMoves;
    }

    update() {
        // Smooth interpolation
        const dx = this.x - this.drawX;
        const dy = this.y - this.drawY;

        if (Math.abs(dx) > 0.01) this.drawX += dx * ANIMATION_SPEED;
        else this.drawX = this.x;

        if (Math.abs(dy) > 0.01) this.drawY += dy * ANIMATION_SPEED;
        else this.drawY = this.y;
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0; // 1.0 to 0.0
        this.velocityY = -0.02; // Float up
    }

    update() {
        this.y += this.velocityY;
        this.life -= 0.015;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width = window.innerWidth;
        this.height = this.canvas.height = window.innerHeight;

        this.map = [];
        this.units = [];
        this.floatingTexts = [];
        this.turn = 1;
        this.gameOver = false;

        this.resources = {
            gold: 100,
            territory: 0
        };

        this.enemy = {
            gold: 100,
            territory: 0
        };

        this.faction = this.getRandomFaction();

        this.totalConquerable = 0;
        this.selectedUnit = null;

        // Camera/Offset/Scale
        this.tileSize = 64;
        this.offsetX = 0;
        this.offsetY = 0;

        this.init();
    }

    init() {
        this.generateMap();
        this.calculateLayout();
        this.spawnInitialUnits();
        this.refreshUnitIcons();
        this.setupInput();
        this.renderFactionList();
        this.updateUI();

        // Start Game Loop
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);

        window.addEventListener('resize', () => {
            this.width = this.canvas.width = window.innerWidth;
            this.height = this.canvas.height = window.innerHeight;
            this.calculateLayout();
        });

        // Flag for first interaction (to play war trumpet)
        this.firstInteraction = false;
    }

    getRandomFaction() {
        const idx = Math.floor(Math.random() * FACTIONS.length);
        return FACTIONS[idx];
    }

    renderFactionList() {
        const listEl = document.getElementById('faction-list');
        if (!listEl) return;

        listEl.innerHTML = '';
        FACTIONS.forEach(faction => {
            const item = document.createElement('div');
            item.className = 'legend-item faction-item';
            item.innerHTML = `<span class="icon">${faction.player}</span> vs <span class="icon">${faction.enemy}</span> — ${faction.label}`;
            listEl.appendChild(item);
        });
    }

    updateFactionDisplay() {
        const playerEl = document.getElementById('player-faction-icon');
        const enemyEl = document.getElementById('enemy-faction-icon');
        const labelEl = document.getElementById('faction-label');

        if (!playerEl || !enemyEl || !labelEl) return;

        playerEl.textContent = this.faction.player;
        enemyEl.textContent = this.faction.enemy;
        labelEl.textContent = this.faction.label;
    }

    getFactionIcon(owner) {
        return owner === 'player' ? this.faction.player : this.faction.enemy;
    }

    getUnitSymbol(unit) {
        if (!unit) return '';
        if (unit.icon) return unit.icon;
        return this.getFactionIcon(unit.owner);
    }

    loop() {
        this.update();
        this.render();
        requestAnimationFrame(this.loop);
    }

    update() {
        // Update Units
        this.units.forEach(u => u.update());

        // Update Floating Texts
        this.floatingTexts.forEach(ft => ft.update());
        this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);
    }

    calculateLayout() {
        const paddingX = 40;
        const paddingY = 160;
        const availableWidth = this.width - paddingX;
        const availableHeight = this.height - paddingY;
        const tileW = availableWidth / MAP_WIDTH;
        const tileH = availableHeight / MAP_HEIGHT;
        this.tileSize = Math.floor(Math.min(tileW, tileH));
        if (this.tileSize < 20) this.tileSize = 20;
        this.offsetX = (this.width - MAP_WIDTH * this.tileSize) / 2;
        this.offsetY = (this.height - MAP_HEIGHT * this.tileSize) / 2;
    }

    generateMap() {
        this.totalConquerable = 0;
        for (let y = 0; y < MAP_HEIGHT; y++) {
            const row = [];
            for (let x = 0; x < MAP_WIDTH; x++) {
                const rand = Math.random();
                let type = TERRAIN.GRASS;
                if (rand < 0.2) type = TERRAIN.WATER;
                else if (rand < 0.3) type = TERRAIN.MOUNTAIN;
                else if (rand < 0.5) type = TERRAIN.FOREST;
                else if (rand < 0.6) type = TERRAIN.SAND;

                if (type.moveCost !== Infinity) {
                    this.totalConquerable++;
                }

                row.push(new Tile(x, y, type));
            }
            this.map.push(row);
        }
    }

    spawnInitialUnits() {
        // Player Spawn
        let startX, startY;
        do {
            startX = Math.floor(Math.random() * (MAP_WIDTH / 2));
            startY = Math.floor(Math.random() * MAP_HEIGHT);
        } while (this.map[startY][startX].type.moveCost === Infinity);

        const warrior = new Unit('WARRIOR', 'player', startX, startY);
        warrior.icon = this.getFactionIcon('player');
        this.addUnit(warrior);
        this.claimTile(startX, startY, 'player');
        this.revealMap(startX, startY, 2);

        // Enemy Spawn
        let enemyX, enemyY;
        let validSpawn = false;
        let attempts = 0;

        while (!validSpawn && attempts < 100) {
            enemyX = Math.floor(MAP_WIDTH / 2 + Math.random() * (MAP_WIDTH / 2));
            enemyY = Math.floor(Math.random() * MAP_HEIGHT);

            const tile = this.map[enemyY][enemyX];
            if (tile.type.moveCost !== Infinity) {
                const neighbors = this.getNeighbors(enemyX, enemyY);
                if (neighbors.some(n => n.type.moveCost !== Infinity)) {
                    validSpawn = true;
                }
            }
            attempts++;
        }

        const enemyWarrior = new Unit('WARRIOR', 'enemy', enemyX, enemyY);
        enemyWarrior.icon = this.getFactionIcon('enemy');
        this.addUnit(enemyWarrior);
        this.claimTile(enemyX, enemyY, 'enemy');
    }

    refreshUnitIcons() {
        this.units.forEach(unit => {
            unit.icon = this.getFactionIcon(unit.owner);
        });
    }

    getNeighbors(x, y) {
        const tiles = [];
        // Include both orthogonal and diagonal neighbors (8-directional movement)
        const coords = [
            [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1],  // Orthogonal
            [x + 1, y + 1], [x + 1, y - 1], [x - 1, y + 1], [x - 1, y - 1]  // Diagonal
        ];
        coords.forEach(c => {
            if (c[0] >= 0 && c[0] < MAP_WIDTH && c[1] >= 0 && c[1] < MAP_HEIGHT) {
                tiles.push(this.map[c[1]][c[0]]);
            }
        });
        return tiles;
    }

    endGame(victory, reason) {
        this.gameOver = true;
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('game-over-title');
        const msg = document.getElementById('game-over-message');
        const prayerEl = document.getElementById('faction-prayer');
        const offerBtn = document.getElementById('offer-service-btn');

        modal.classList.remove('hidden');
        if (victory) {
            title.innerText = "VICTORY!";
            title.style.color = "#4CAF50";
            msg.innerText = `${reason}\nTerritory: ${this.resources.territory} / ${this.totalConquerable}`;
            this.playVictorySound();
        } else {
            title.innerText = "DEFEAT!";
            title.style.color = "#F44336";
            msg.innerText = `${reason}\nEnemy Territory: ${this.enemy.territory} / ${this.totalConquerable}`;
        }

        if (prayerEl) {
            prayerEl.classList.remove('hidden');
            prayerEl.innerText = this.faction.prayer || '';
        }

        if (offerBtn) {
            offerBtn.classList.remove('hidden');
            offerBtn.href = this.faction.link || '#';
        }
    }

    playVictorySound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;

            // Victory fanfare: C-E-G-C progression
            const notes = [
                { freq: 523.25, time: 0, duration: 0.15 },    // C5
                { freq: 659.25, time: 0.15, duration: 0.15 }, // E5
                { freq: 783.99, time: 0.3, duration: 0.15 },  // G5
                { freq: 1046.5, time: 0.45, duration: 0.5 }   // C6 (hold)
            ];

            notes.forEach(note => {
                // Oscillator for the note
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                osc.type = 'triangle';
                osc.frequency.value = note.freq;

                // Envelope
                gainNode.gain.setValueAtTime(0, now + note.time);
                gainNode.gain.linearRampToValueAtTime(0.3, now + note.time + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);

                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                osc.start(now + note.time);
                osc.stop(now + note.time + note.duration);
            });

            // Add a bass drum hit for extra impact
            const bass = audioCtx.createOscillator();
            const bassGain = audioCtx.createGain();
            bass.type = 'sine';
            bass.frequency.setValueAtTime(100, now);
            bass.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
            bassGain.gain.setValueAtTime(1, now);
            bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            bass.connect(bassGain);
            bassGain.connect(audioCtx.destination);
            bass.start(now);
            bass.stop(now + 0.5);
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }

    playWarTrumpet() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;

            // War trumpet fanfare: G-D-G-B-D progression (heroic)
            const trumpetNotes = [
                { freq: 392.00, time: 0, duration: 0.25 },    // G4
                { freq: 587.33, time: 0.3, duration: 0.25 },  // D5
                { freq: 392.00, time: 0.6, duration: 0.15 },  // G4
                { freq: 493.88, time: 0.8, duration: 0.15 },  // B4
                { freq: 587.33, time: 1.0, duration: 0.5 }    // D5 (hold)
            ];

            trumpetNotes.forEach(note => {
                // Main trumpet (sawtooth for brassy sound)
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                const filter = audioCtx.createBiquadFilter();

                osc.type = 'sawtooth';
                osc.frequency.value = note.freq;

                // Filter for trumpet-like timbre
                filter.type = 'lowpass';
                filter.frequency.value = 2000;
                filter.Q.value = 1;

                // Envelope with attack and decay
                gainNode.gain.setValueAtTime(0, now + note.time);
                gainNode.gain.linearRampToValueAtTime(0.2, now + note.time + 0.03);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);

                osc.connect(filter);
                filter.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                osc.start(now + note.time);
                osc.stop(now + note.time + note.duration);

                // Add harmonic for richness
                const harmonic = audioCtx.createOscillator();
                const harmonicGain = audioCtx.createGain();

                harmonic.type = 'square';
                harmonic.frequency.value = note.freq * 2;

                harmonicGain.gain.setValueAtTime(0, now + note.time);
                harmonicGain.gain.linearRampToValueAtTime(0.05, now + note.time + 0.03);
                harmonicGain.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);

                harmonic.connect(harmonicGain);
                harmonicGain.connect(audioCtx.destination);

                harmonic.start(now + note.time);
                harmonic.stop(now + note.time + note.duration);
            });
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }

    revealMap(cx, cy, radius) {
        for (let y = cy - radius; y <= cy + radius; y++) {
            for (let x = cx - radius; x <= cx + radius; x++) {
                if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
                    this.map[y][x].fog = false;
                    this.map[y][x].explored = true;
                }
            }
        }
    }

    setupInput() {
        this.canvas.addEventListener('mousedown', (e) => this.handleClick(e));
        document.getElementById('end-turn-btn').addEventListener('click', () => this.endTurn());
        document.getElementById('recruit-btn').addEventListener('click', () => this.recruitUnit('player'));
        document.getElementById('restart-btn').addEventListener('click', (e) => {
            e.preventDefault();
            location.reload();
        });

        const modal = document.getElementById('help-modal');
        document.getElementById('help-btn').addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
        document.getElementById('close-help').addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') this.endTurn();
        });
    }

    getTileAt(screenX, screenY) {
        const x = Math.floor((screenX - this.offsetX) / this.tileSize);
        const y = Math.floor((screenY - this.offsetY) / this.tileSize);

        if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
            return this.map[y][x];
        }
        return null;
    }

    handleClick(e) {
        // Play war trumpet on first interaction
        if (!this.firstInteraction) {
            this.firstInteraction = true;
            this.playWarTrumpet();
        }

        if (this.gameOver) return;

        const tile = this.getTileAt(e.clientX, e.clientY);
        if (!tile) {
            this.deselectAll();
            return;
        }

        if (this.selectedUnit && tile !== this.map[this.selectedUnit.y][this.selectedUnit.x]) {
            if (tile.unit) {
                if (tile.unit.owner === 'player') {
                    this.selectUnit(tile.unit);
                }
                return;
            }

            this.moveUnit(this.selectedUnit, tile.x, tile.y);
            return;
        }

        if (tile.unit && tile.unit.owner === 'player') {
            this.selectUnit(tile.unit);
        } else {
            this.deselectAll();
        }
    }

    selectUnit(unit) {
        this.selectedUnit = unit;
        this.updateSelectionUI();
    }

    deselectAll() {
        this.selectedUnit = null;
        document.getElementById('selection-panel').classList.add('hidden');
    }

    moveUnit(unit, tx, ty) {
        if (unit.movesLeft <= 0) {
            this.notify("No moves left!");
            return;
        }

        const targetTile = this.map[ty][tx];
        const cost = targetTile.type.moveCost;

        if (cost === Infinity) {
            this.notify("Cannot move there!");
            return;
        }

        const dx = Math.abs(tx - unit.x);
        const dy = Math.abs(ty - unit.y);
        if (dx > 1 || dy > 1 || (dx === 0 && dy === 0)) {
            this.notify("Too far! Move one tile at a time.");
            return;
        }

        if (unit.movesLeft < cost) {
            this.notify("Not enough movement points.");
            return;
        }

        // Execute Move
        this.map[unit.y][unit.x].unit = null;
        unit.x = tx;
        unit.y = ty;
        unit.movesLeft -= cost;
        this.map[ty][tx].unit = unit;

        // Claim Territory
        this.claimTile(tx, ty, unit.owner);

        if (unit.owner === 'player') {
            this.playMarchSound();
            this.revealMap(tx, ty, 2);
            this.updateSelectionUI();
        }
    }

    playMarchSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;

            // Create a snare drum sound
            const snare = audioCtx.createOscillator();
            const snareGain = audioCtx.createGain();
            const snareFilter = audioCtx.createBiquadFilter();

            snare.type = 'triangle';
            snare.frequency.setValueAtTime(200, now);
            snare.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);

            snareFilter.type = 'highpass';
            snareFilter.frequency.value = 1000;

            snareGain.gain.setValueAtTime(0.2, now);
            snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

            snare.connect(snareFilter);
            snareFilter.connect(snareGain);
            snareGain.connect(audioCtx.destination);

            snare.start(now);
            snare.stop(now + 0.1);

            // Add white noise for realistic snare
            const bufferSize = audioCtx.sampleRate * 0.1;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = audioCtx.createBufferSource();
            const noiseGain = audioCtx.createGain();
            const noiseFilter = audioCtx.createBiquadFilter();

            noise.buffer = buffer;
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 2000;

            noiseGain.gain.setValueAtTime(0.15, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(audioCtx.destination);

            noise.start(now);
            noise.stop(now + 0.08);
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }

    playBattleClank() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;

            // Metallic clank sound (simulating sword clash)
            for (let i = 0; i < 3; i++) {
                const clank = audioCtx.createOscillator();
                const clankGain = audioCtx.createGain();
                const clankFilter = audioCtx.createBiquadFilter();

                clank.type = 'square';
                clank.frequency.setValueAtTime(800 + i * 200, now + i * 0.04);
                clank.frequency.exponentialRampToValueAtTime(0.01, now + i * 0.04 + 0.1);

                clankFilter.type = 'bandpass';
                clankFilter.frequency.value = 1500;
                clankFilter.Q.value = 10;

                clankGain.gain.setValueAtTime(0.25, now + i * 0.04);
                clankGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.04 + 0.08);

                clank.connect(clankFilter);
                clankFilter.connect(clankGain);
                clankGain.connect(audioCtx.destination);

                clank.start(now + i * 0.04);
                clank.stop(now + i * 0.04 + 0.1);
            }
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }

    playSadLoss() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;

            // Descending sad notes (E-D-C)
            const sadNotes = [
                { freq: 659.25, time: 0, duration: 0.2 },    // E5
                { freq: 587.33, time: 0.15, duration: 0.2 }, // D5
                { freq: 523.25, time: 0.3, duration: 0.3 }   // C5
            ];

            sadNotes.forEach(note => {
                const osc = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();

                osc.type = 'sine';
                osc.frequency.value = note.freq;

                gainNode.gain.setValueAtTime(0, now + note.time);
                gainNode.gain.linearRampToValueAtTime(0.15, now + note.time + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + note.time + note.duration);

                osc.connect(gainNode);
                gainNode.connect(audioCtx.destination);

                osc.start(now + note.time);
                osc.stop(now + note.time + note.duration);
            });
        } catch (e) {
            console.log('Audio not supported:', e);
        }
    }

    recruitUnit(owner) {
        const cost = 50;
        const resources = owner === 'player' ? this.resources : this.enemy;

        if (resources.gold < cost) {
            if (owner === 'player') this.notify("Not enough Gold (50)!");
            return false;
        }

        // Find spawn spot
        let spawnTile = null;
        const myUnits = this.units.filter(u => u.owner === owner);
        const shuffledUnits = [...myUnits].sort(() => Math.random() - 0.5);

        for (const u of shuffledUnits) {
            const neighbors = this.getNeighbors(u.x, u.y);
            for (const n of neighbors) {
                if (!n.unit && n.type.moveCost !== Infinity) {
                    spawnTile = n;
                    break;
                }
            }
            if (spawnTile) break;
        }

        if (!spawnTile) {
            if (owner === 'player') this.notify("No valid spawn location!");
            return false;
        }

        resources.gold -= cost;
        const newUnit = new Unit('WARRIOR', owner, spawnTile.x, spawnTile.y);
        newUnit.icon = this.getFactionIcon(owner);
        this.addUnit(newUnit);
        this.claimTile(spawnTile.x, spawnTile.y, owner);

        if (owner === 'player') {
            this.revealMap(spawnTile.x, spawnTile.y, 2);
            this.notify("Recruited Warrior!");
            this.spawnText(spawnTile.x, spawnTile.y, "Recruited!", "#fff");
            this.updateUI();
        }
        return true;
    }

    endTurn() {
        if (this.gameOver) return;

        this.turn++;

        // Player Reset
        this.units.forEach(u => u.resetTurn());

        // Player Income
        const income = 10 + (this.resources.territory * 2);
        this.resources.gold += income;
        this.spawnText(MAP_WIDTH / 2, MAP_HEIGHT / 2, `+${income} Gold`, "#FFD700");

        // Enemy Turn
        this.enemyTurn();

        this.notify(`Turn ${this.turn} Started (+${income}💰)`);
        this.updateUI();
        this.deselectAll();

        // Check Encirclement after all moves
        this.checkEncirclement();
    }

    enemyTurn() {
        const enemyIncome = 10 + (this.enemy.territory * 2);
        this.enemy.gold += enemyIncome;

        if (this.enemy.gold >= 50) {
            this.recruitUnit('enemy');
        }

        const enemyUnits = this.units.filter(u => u.owner === 'enemy');
        enemyUnits.forEach(u => {
            const neighbors = this.getNeighbors(u.x, u.y);
            const validMoves = neighbors.filter(n => {
                return n.type.moveCost <= u.movesLeft && !n.unit;
            });

            if (validMoves.length > 0) {
                const move = validMoves[Math.floor(Math.random() * validMoves.length)];
                this.moveUnit(u, move.x, move.y);
            }
        });
    }

    notify(msg) {
        const notifContainer = document.getElementById('notifications');
        const el = document.createElement('div');
        el.className = 'notification';
        el.innerText = msg;
        notifContainer.appendChild(el);
        setTimeout(() => el.remove(), 4000);
    }

    updateUI() {
        document.getElementById('gold-display').innerText = this.resources.gold;
        document.getElementById('territory-display').innerText = `${this.resources.territory} / ${this.totalConquerable}`;
        document.getElementById('turn-display').innerText = this.turn;
        this.updateFactionDisplay();
    }

    addUnit(unit) {
        this.units.push(unit);
        this.map[unit.y][unit.x].unit = unit;
    }

    claimTile(x, y, owner) {
        const tile = this.map[y][x];
        if (tile.owner !== owner) {
            const previousOwner = tile.owner;

            if (tile.owner === 'player') this.resources.territory--;
            if (tile.owner === 'enemy') this.enemy.territory--;

            tile.owner = owner;

            if (owner === 'player') {
                this.resources.territory++;
                this.spawnText(x, y, "Claimed!", "#4CAF50");

                // Battle clank when stealing enemy territory
                if (previousOwner === 'enemy') {
                    this.playBattleClank();
                }
            }
            if (owner === 'enemy') {
                this.enemy.territory++;

                // Sad sound when enemy steals our territory
                if (previousOwner === 'player') {
                    this.playSadLoss();
                }
            }

            this.checkWinCondition();
            this.updateUI();
        }
    }

    spawnText(x, y, text, color) {
        this.floatingTexts.push(new FloatingText(x, y, text, color));
    }

    checkWinCondition() {
        if (this.gameOver) return;

        const winThreshold = Math.floor(this.totalConquerable * 0.5);

        if (this.resources.territory >= winThreshold) {
            this.endGame(true, "Domination Victory! You control 50% of the map.");
        } else if (this.enemy.territory >= winThreshold) {
            this.endGame(false, "Defeat! Enemy controls 50% of the map.");
        }
    }

    checkEncirclement() {
        if (this.gameOver) return;

        // Check if Enemy is encircled
        const enemyUnits = this.units.filter(u => u.owner === 'enemy');
        let canMove = false;
        let canSpawn = false;

        // 1. Can any unit move?
        for (const u of enemyUnits) {
            const neighbors = this.getNeighbors(u.x, u.y);
            if (neighbors.some(n => n.type.moveCost <= u.movesLeft && !n.unit)) {
                canMove = true;
                break;
            }
        }

        // 2. Can they spawn? (Check gold + valid spawn spots)
        if (this.enemy.gold >= 50) {
            for (const u of enemyUnits) {
                const neighbors = this.getNeighbors(u.x, u.y);
                if (neighbors.some(n => !n.unit && n.type.moveCost !== Infinity)) {
                    canSpawn = true;
                    break;
                }
            }
        }

        if (!canMove && !canSpawn) {
            this.endGame(true, "Encirclement Victory! Enemy is trapped.");
        }
    }

    updateSelectionUI() {
        const panel = document.getElementById('selection-panel');
        const nameEl = document.getElementById('selection-name');
        const detailsEl = document.getElementById('selection-details');

        if (this.selectedUnit) {
            panel.classList.remove('hidden');
            const u = this.selectedUnit;
            nameEl.innerText = UNITS[u.type].name;
            detailsEl.innerHTML = `Moves: ${u.movesLeft}/${u.maxMoves}`;
        } else {
            panel.classList.add('hidden');
        }
    }

    render() {
        this.ctx.fillStyle = '#1a1a1a'; // Lighter background
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Board Border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3; // Thicker border
        this.ctx.strokeRect(this.offsetX - 3, this.offsetY - 3, MAP_WIDTH * this.tileSize + 6, MAP_HEIGHT * this.tileSize + 6);
        this.ctx.lineWidth = 1;

        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (!this.map[y] || !this.map[y][x]) continue;
                const tile = this.map[y][x];
                const drawX = this.offsetX + x * this.tileSize;
                const drawY = this.offsetY + y * this.tileSize;

                if (tile.fog) {
                    this.ctx.fillStyle = '#2a2a2a'; // Lighter fog
                    this.ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = '#333';
                    this.ctx.strokeRect(drawX, drawY, this.tileSize, this.tileSize);
                    continue;
                }

                this.ctx.fillStyle = tile.type.color;
                this.ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);

                // Territory Overlay
                if (tile.owner === 'player') {
                    this.ctx.fillStyle = 'rgba(76, 175, 80, 0.4)';
                    this.ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);

                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.beginPath();
                    this.ctx.moveTo(drawX, drawY + this.tileSize);
                    this.ctx.lineTo(drawX + this.tileSize, drawY);
                    this.ctx.stroke();

                    this.ctx.strokeStyle = '#4CAF50';
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeRect(drawX + 2, drawY + 2, this.tileSize - 4, this.tileSize - 4);
                    this.ctx.lineWidth = 1;
                } else if (tile.owner === 'enemy') {
                    this.ctx.fillStyle = 'rgba(244, 67, 54, 0.2)';
                    this.ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                    this.ctx.strokeStyle = '#F44336';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(drawX + 2, drawY + 2, this.tileSize - 4, this.tileSize - 4);
                    this.ctx.lineWidth = 1;
                }

                this.ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                this.ctx.strokeRect(drawX, drawY, this.tileSize, this.tileSize);
            }
        }

        // Draw Units (Separate loop for z-index)
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (!this.map[y] || !this.map[y][x]) continue;
                const tile = this.map[y][x];
                if (tile.unit && !tile.fog) {
                    const u = tile.unit;
                    // Use interpolated coordinates
                    const drawX = this.offsetX + u.drawX * this.tileSize;
                    const drawY = this.offsetY + u.drawY * this.tileSize;

                    if (this.selectedUnit === u) {
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                        this.ctx.beginPath();
                        this.ctx.arc(drawX + this.tileSize / 2, drawY + this.tileSize / 2, this.tileSize / 2 - 2, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.strokeStyle = '#fff';
                        this.ctx.lineWidth = 2;
                        this.ctx.stroke();
                        this.ctx.lineWidth = 1;
                    }

                    this.ctx.fillStyle = u.owner === 'player' ? '#000' : '#500';
                    this.ctx.font = `bold ${Math.floor(this.tileSize * 0.55)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    const symbol = this.getUnitSymbol(u);
                    this.ctx.fillText(symbol, drawX + this.tileSize / 2, drawY + this.tileSize / 2);

                    if (u.movesLeft < u.maxMoves) {
                        this.ctx.fillStyle = 'yellow';
                        this.ctx.beginPath();
                        this.ctx.arc(drawX + this.tileSize - 8, drawY + 8, 3, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
            }
        }

        // Draw Floating Text
        this.floatingTexts.forEach(ft => {
            const drawX = this.offsetX + ft.x * this.tileSize + this.tileSize / 2;
            const drawY = this.offsetY + ft.y * this.tileSize;

            this.ctx.globalAlpha = ft.life;
            this.ctx.fillStyle = ft.color;
            this.ctx.font = 'bold 20px Inter';
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(ft.text, drawX, drawY);
            this.ctx.fillText(ft.text, drawX, drawY);
            this.ctx.globalAlpha = 1.0;
            this.ctx.lineWidth = 1;
        });
    }
}

window.onload = () => {
    const game = new Game();
};
