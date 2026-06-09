// ==========================================
// app.js — Robot Sky Jump
// ==========================================

// ==========================================
// DEKLARASI ELEMEN DOM UTAMA
// ==========================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen      = document.getElementById('startScreen');
const gameOverScreen   = document.getElementById('gameOverScreen');
const leaderboardScreen = document.getElementById('leaderboardScreen');
const hud              = document.getElementById('hud');
const controls         = document.getElementById('controls');
const startBtn         = document.getElementById('startBtn');
const restartBtn       = document.getElementById('restartBtn');
const lbBtn            = document.getElementById('lbBtn');
const lbBtnGameOver    = document.getElementById('lbBtnGameOver');
const closeLbBtn       = document.getElementById('closeLbBtn');
const scoreText        = document.getElementById('scoreText');
const heightText       = document.getElementById('heightText');
const finalScore       = document.getElementById('finalScore');
const aiFeedback       = document.getElementById('aiFeedback');
const btnLeft          = document.getElementById('btn-left');
const btnRight         = document.getElementById('btn-right');
const soundToggleBtn   = document.getElementById('soundToggleBtn');
const nameInput        = document.getElementById('playerNameInput');
const aiNameBtn        = document.getElementById('aiNameBtn');

// ==========================================
// 1. INTEGRASI ANTHROPIC CLAUDE API
// ==========================================
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

async function callClaude(userPrompt, systemPrompt = "") {
    const payload = {
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        messages: [{ role: "user", content: userPrompt }]
    };
    if (systemPrompt) {
        payload.system = systemPrompt;
    }

    const delays = [1000, 2000, 4000, 8000, 16000];
    for (let i = 0; i < 5; i++) {
        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.content?.[0]?.text || "";
        } catch (error) {
            if (i === 4) throw error;
            await new Promise(resolve => setTimeout(resolve, delays[i]));
        }
    }
}

async function generateAIName() {
    const originalPlaceholder = nameInput.placeholder;
    nameInput.placeholder = "Mencari ide... 🤖";
    nameInput.value = "";

    const userPrompt = "Berikan satu nama unik untuk robot pelompat langit yang imut, lucu, atau futuristik. Maksimal 12 karakter. Hanya berikan namanya saja tanpa tanda kutip atau penjelasan tambahan.";
    const sysPrompt = "Kamu adalah sistem penamaan robot AI super cerdas. Berikan nama singkat, kreatif, dan tidak lebih dari 12 karakter.";

    try {
        const name = await callClaude(userPrompt, sysPrompt);
        nameInput.value = name.trim().replace(/["']/g, "").substring(0, 12);
    } catch (error) {
        nameInput.value = "MechaJump";
    } finally {
        nameInput.placeholder = originalPlaceholder;
    }
}

async function getAICoachFeedback(playerName, score, height, reason) {
    const userPrompt = `Pemain bernama "${playerName}" baru saja kalah dengan skor "${score}" dan ketinggian lompatan "${height}". Penyebab kalah: "${reason}".`;
    const sysPrompt = "Kamu adalah pelatih game AI yang gaul, sedikit sarkas tapi diam-diam suportif untuk game 'Robot Sky Jump'. Berikan komentar 1 atau maksimal 2 kalimat saja dalam bahasa Indonesia yang lucu, gaul, atau menyemangati.";

    try {
        return await callClaude(userPrompt, sysPrompt);
    } catch (error) {
        return "Hei robot, sirkuitmu agak basah! Bersihkan olinya dan lompat lebih tinggi lagi! 🚀";
    }
}

async function generateDailyChallenge() {
    const challengeText = document.getElementById('dailyChallengeText');
    const userPrompt = "Tuliskan satu tantangan harian imajiner yang lucu dan absurd untuk robot pelompat langit. Maksimal 10 kata saja. Contoh: 'Lompati 5 elang sambil makan oli baterai!'";
    const sysPrompt = "Kamu adalah game master robot yang jenaka. Jawab hanya dengan kalimat tantangan, tanpa penjelasan tambahan.";

    try {
        const challenge = await callClaude(userPrompt, sysPrompt);
        challengeText.innerText = challenge.trim();
    } catch (error) {
        challengeText.innerText = "Lompati elang dan raih rasi bintang tertinggi! 🌟";
    }
}


// ==========================================
// 2. AUDIO SYNTHESIS ENGINE (Web Audio API)
// ==========================================
let audioCtx = null;
let soundEnabled = true;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx || audioCtx.state === 'suspended') {
        audioCtx?.resume();
    }

    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'jump') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);

    } else if (type === 'pickup') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);

    } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.3);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);

    } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.5);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    }
}


// ==========================================
// 3. STORAGE & LEADERBOARD (LocalStorage)
// ==========================================
const STORAGE_KEY = "robot_sky_jump_scores";
const UID_KEY     = "robot_sky_jump_uid_val";

function getUID() {
    let uid = localStorage.getItem(UID_KEY);
    if (!uid) {
        uid = 'User-' + Math.random().toString(36).substring(2, 7).toUpperCase();
        localStorage.setItem(UID_KEY, uid);
    }
    return uid;
}

function getLocalScores() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}

function saveScore(name, scoreVal) {
    const uid = getUID();
    let list = getLocalScores();
    const finalName = name.trim() || uid;

    const existingIdx = list.findIndex(item => item.uid === uid);
    if (existingIdx !== -1) {
        if (scoreVal > list[existingIdx].score) {
            list[existingIdx].score     = scoreVal;
            list[existingIdx].name      = finalName;
            list[existingIdx].timestamp = Date.now();
        }
    } else {
        list.push({ uid, name: finalName, score: scoreVal, timestamp: Date.now() });
    }

    list.sort((a, b) => b.score - a.score);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 15)));
}

function populateLeaderboardUI() {
    const lbList = document.getElementById('lbList');
    lbList.innerHTML = '';
    const list  = getLocalScores();
    const myUid = getUID();

    if (list.length === 0) {
        lbList.innerHTML = `<div class="lb-empty">Belum ada skor tercatat.<br>Jadilah yang pertama! 🚀</div>`;
        return;
    }

    list.forEach((item, index) => {
        let medal = `${index + 1}.`;
        if (index === 0) medal = '🥇';
        if (index === 1) medal = '🥈';
        if (index === 2) medal = '🥉';

        const isMe = item.uid === myUid;
        const div  = document.createElement('div');
        div.className = `lb-item ${isMe ? 'is-me' : ''}`;
        div.innerHTML = `
            <div class="lb-item-left">
                <span class="rank-medal">${medal}</span>
                <span class="lb-name">${item.name}${isMe ? ' (Anda)' : ''}</span>
            </div>
            <div class="lb-score">⭐ ${item.score}</div>
        `;
        lbList.appendChild(div);
    });
}


// ==========================================
// 4. CANVAS RESIZE
// ==========================================
let width, height;

function resizeCanvas() {
    const container = document.getElementById('game-container');
    width  = container.clientWidth;
    height = container.clientHeight;
    canvas.width  = width;
    canvas.height = height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();


// ==========================================
// 5. RESTORE PLAYER NAME FROM LOCAL STORAGE
// ==========================================
(function restorePlayerName() {
    const savedScores = getLocalScores();
    const myUid       = getUID();
    const myMatch     = savedScores.find(item => item.uid === myUid);
    nameInput.value   = myMatch ? myMatch.name : myUid;
})();


// ==========================================
// 6. SOUND TOGGLE
// ==========================================
soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.innerText = soundEnabled ? '🔊' : '🔇';
    soundToggleBtn.classList.toggle('muted', !soundEnabled);
});


// ==========================================
// 7. AI NAME BUTTON
// ==========================================
aiNameBtn.addEventListener('click', generateAIName);


// ==========================================
// 8. GAME STATE & CONSTANTS
// ==========================================
let gameState   = 'START';
let score       = 0;
let heightScore = 0;
let platforms   = [];
let bears       = [];
let leaves      = [];
let birds       = [];

const gravity     = 0.4;
const jumpForce   = -10;
const playerSpeed = 5;

const player = {
    x: 0, y: 0,
    w: 50, h: 65,
    vx: 0, vy: 0,
    isMovingLeft:  false,
    isMovingRight: false,
    isDead:        false,
    deathReason:   ""
};

// Clouds (decorative, always present)
let clouds = [];
function initClouds() {
    clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x:     Math.random() * width,
            y:     Math.random() * height,
            size:  Math.random() * 30 + 30,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}


// ==========================================
// 9. KEYBOARD INPUT
// ==========================================
window.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.code === 'KeyA') player.isMovingLeft  = true;
    if (e.key === 'd' || e.key === 'D' || e.code === 'KeyD') player.isMovingRight = true;
});
window.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.code === 'KeyA') player.isMovingLeft  = false;
    if (e.key === 'd' || e.key === 'D' || e.code === 'KeyD') player.isMovingRight = false;
});


// ==========================================
// 10. TOUCH CONTROLS
// ==========================================
function addTouchControl(btn, dirKey) {
    btn.addEventListener('pointerdown',   (e) => { e.preventDefault(); player[dirKey] = true;  });
    btn.addEventListener('pointerup',     (e) => { e.preventDefault(); player[dirKey] = false; });
    btn.addEventListener('pointercancel', ()  => { player[dirKey] = false; });
    btn.addEventListener('pointerleave',  ()  => { player[dirKey] = false; });
}
addTouchControl(btnLeft,  'isMovingLeft');
addTouchControl(btnRight, 'isMovingRight');


// ==========================================
// 11. DRAWING FUNCTIONS
// ==========================================
function drawRobot(x, y, w, h) {
    ctx.save();
    ctx.translate(x, y);

    // Glow shadow
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00FF00";
    ctx.fillStyle = "rgba(0, 255, 0, 0.6)";
    ctx.beginPath();
    ctx.ellipse(w / 2, h + 5, 15, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Arms
    ctx.fillStyle = "#00E5FF";
    ctx.beginPath(); ctx.roundRect(-10, 20, 15, 35, 5); ctx.fill();
    ctx.beginPath(); ctx.roundRect(w - 5, 20, 15, 35, 5); ctx.fill();
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(-5, 45, 5, 10);
    ctx.fillRect(w, 45, 5, 10);

    // Body
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2 + 5, w / 2, h / 2 - 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye outer
    ctx.fillStyle = "#00E5FF";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 + 5, 20, 0, Math.PI * 2);
    ctx.fill();

    // Eye inner
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 + 5, 14, 0, Math.PI * 2);
    ctx.fill();

    // Eye pupil (red glow)
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FF0000";
    ctx.fillStyle = "#FF0000";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 + 5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Head
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(w / 2, 10, 25, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Headband / antenna base
    ctx.fillStyle = "#00E5FF";
    ctx.beginPath();
    ctx.roundRect(w / 2 - 18, -2, 36, 12, 4);
    ctx.fill();

    // Antenna horns
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(w / 2 - 8, 4, 3, Math.PI, 0); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2 + 8, 4, 3, Math.PI, 0); ctx.stroke();

    ctx.restore();
}


// ==========================================
// 12. GAME INIT
// ==========================================
function initGame() {
    score = 0;
    heightScore = 0;
    platforms = [];
    bears     = [];
    leaves    = [];
    birds     = [];

    scoreText.innerText  = "0";
    heightText.innerText = "0";

    player.x           = width / 2 - player.w / 2;
    player.y           = height - 150;
    player.vx          = 0;
    player.vy          = 0;
    player.isDead      = false;
    player.deathReason = "";

    // Starting platform
    platforms.push({ x: width / 2 - 40, y: height - 50, w: 80, h: 20, type: 'solid' });

    // Generate initial platforms above
    for (let i = 1; i < 12; i++) {
        createPlatform(height - 50 - i * 60);
    }
}

function createPlatform(yPos) {
    const pWidth     = Math.random() * 40 + 50;
    const pX         = Math.random() * (width - pWidth);
    const type       = Math.random() > 0.8 ? 'moving' : 'solid';
    const direction  = Math.random() > 0.5 ? 1 : -1;

    platforms.push({ x: pX, y: yPos, w: pWidth, h: 20, type, dir: direction });

    // Occasionally add a collectible bear on the platform
    if (Math.random() > 0.85) {
        bears.push({ x: pX + pWidth / 2 - 15, y: yPos - 30, w: 30, h: 30, collected: false });
    }
}


// ==========================================
// 13. UPDATE LOOP
// ==========================================
function update() {
    if (gameState !== 'PLAYING') return;

    // --- Horizontal movement ---
    if (player.isMovingLeft)       player.vx = -playerSpeed;
    else if (player.isMovingRight) player.vx =  playerSpeed;
    else                           player.vx =  0;

    player.x += player.vx;

    // Wrap around edges
    if (player.x + player.w < 0) player.x = width;
    if (player.x > width)        player.x = -player.w;

    // --- Gravity & vertical movement ---
    player.vy += gravity;
    player.y  += player.vy;

    // --- Falling leaves (ambient particles) ---
    if (Math.random() < 0.04) {
        leaves.push({
            x:     Math.random() * width,
            y:     -20,
            vx:    Math.random() * 1.5 - 0.2,
            vy:    Math.random() * 1.5 + 1,
            size:  Math.random() * 6 + 4,
            angle: Math.random() * Math.PI * 2,
            spin:  Math.random() * 0.1 - 0.05
        });
    }
    for (let i = leaves.length - 1; i >= 0; i--) {
        leaves[i].x += Math.sin(Date.now() / 1000 + leaves[i].y) * 0.5 + leaves[i].vx;
        leaves[i].y += leaves[i].vy;
        leaves[i].angle += leaves[i].spin;
        if (leaves[i].y > height) leaves.splice(i, 1);
    }

    // --- Eagle birds (appear after score 100) ---
    const totalScore = score + heightScore;
    if (totalScore >= 100 && Math.random() < 0.008) {
        const dir = Math.random() > 0.5 ? 1 : -1;
        birds.push({
            x:   dir === 1 ? -50 : width + 50,
            y:   player.y - (Math.random() * 300 + 100),
            w:   35,
            h:   25,
            vx:  dir * (Math.random() * 2 + 2),
            dir: dir
        });
    }
    for (let i = birds.length - 1; i >= 0; i--) {
        const b      = birds[i];
        b.x         += b.vx;
        const hitPad = 12;

        if (
            !player.isDead &&
            player.x + hitPad < b.x + b.w &&
            player.x + player.w - hitPad > b.x &&
            player.y + hitPad < b.y + b.h &&
            player.y + player.h - hitPad > b.y
        ) {
            player.isDead      = true;
            player.deathReason = "ditabrak elang yang terbang lewat";
            player.vy = 12;
            playSound('hit');
        }
        if (b.x > width + 100 || b.x < -100) birds.splice(i, 1);
    }

    // --- Platform collisions (landing & jumping) ---
    if (player.vy > 0 && !player.isDead) {
        platforms.forEach(p => {
            if (
                player.x + 10 < p.x + p.w &&
                player.x + player.w - 10 > p.x &&
                player.y + player.h > p.y &&
                player.y + player.h < p.y + p.h + player.vy
            ) {
                player.vy = jumpForce;
                player.y  = p.y - player.h;
                playSound('jump');
            }
        });
    }

    // --- Bear collectibles ---
    bears.forEach(b => {
        if (
            !b.collected &&
            player.x < b.x + b.w &&
            player.x + player.w > b.x &&
            player.y < b.y + b.h &&
            player.y + player.h > b.y
        ) {
            b.collected = true;
            score      += 10;
            scoreText.innerText = score;
            if (player.vy > 0) player.vy = -6;
            playSound('pickup');
        }
    });

    // --- Camera scroll (keep player in upper half) ---
    if (player.y < height / 2) {
        const diff  = (height / 2) - player.y;
        player.y   = height / 2;
        platforms.forEach(p => p.y += diff);
        bears.forEach(b    => b.y += diff);
        clouds.forEach(c   => c.y += diff * 0.2);
        leaves.forEach(l   => l.y += diff);
        birds.forEach(b    => b.y += diff);
        heightScore        += Math.floor(diff * 0.1);
        heightText.innerText = heightScore;
    }

    // --- Moving platforms & spawn new ones ---
    for (let i = platforms.length - 1; i >= 0; i--) {
        const p = platforms[i];
        if (p.type === 'moving') {
            p.x += p.dir * 2;
            if (p.x <= 0 || p.x + p.w >= width) p.dir *= -1;
        }
        if (p.y > height) {
            platforms.splice(i, 1);
            const highestY = platforms.length > 0
                ? Math.min(...platforms.map(pl => pl.y))
                : 0;
            createPlatform(highestY - (Math.random() * 25 + 45));
        }
    }

    // --- Clouds drift ---
    clouds.forEach(c => {
        c.x += c.speed;
        if (c.y > height) c.y = -c.size;
        if (c.x > width)  c.x = -c.size;
    });

    // --- Game over: fell below screen ---
    if (player.y > height) {
        gameState = 'GAMEOVER';
        gameOverScreen.classList.remove('hidden');
        hud.classList.add('hidden');
        controls.classList.add('hidden');
        playSound('gameover');

        const finalTotScore = score + heightScore;
        finalScore.innerText = finalTotScore;

        if (!player.deathReason) player.deathReason = "terjatuh dari awan karena salah pijakan";

        const pName = nameInput.value.trim() || "RobotAnon";
        saveScore(pName, finalTotScore);

        aiFeedback.innerText = "Sedang mengamati olinu... 🤖";
        getAICoachFeedback(pName, score, heightScore, player.deathReason).then(reply => {
            aiFeedback.innerText = "✨ " + reply;
        });
    }
}


// ==========================================
// 14. DRAW LOOP
// ==========================================
function draw() {
    ctx.clearRect(0, 0, width, height);

    // Clouds
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    clouds.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x,              c.y,              c.size,           0, Math.PI * 2);
        ctx.arc(c.x + c.size * 0.5, c.y - c.size * 0.3, c.size * 0.8, 0, Math.PI * 2);
        ctx.arc(c.x + c.size,     c.y,              c.size * 0.9,     0, Math.PI * 2);
        ctx.fill();
    });

    // Falling leaves
    ctx.fillStyle = "#8BC34A";
    leaves.forEach(l => {
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, l.size, l.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    // Show big robot on start screen
    if (gameState === 'START') {
        drawRobot(width / 2 - 75, height / 2 + 20, 150, 195);
        return;
    }

    // Platforms
    platforms.forEach(p => {
        if (p.type === 'solid') {
            ctx.fillStyle = "#8D6E63";
            ctx.beginPath();
            ctx.roundRect(p.x, p.y + 5, p.w, p.h - 5, [0, 0, 8, 8]);
            ctx.fill();
            ctx.fillStyle = "#66BB6A";
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.w, 10, [8, 8, 0, 0]);
            ctx.fill();
        } else {
            ctx.fillStyle = "#9CCC65";
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.w, p.h, 10);
            ctx.fill();
            ctx.strokeStyle = "#7CB342";
            ctx.lineWidth   = 2;
            ctx.beginPath();
            ctx.moveTo(p.x + 10, p.y + p.h / 2);
            ctx.lineTo(p.x + p.w - 10, p.y + p.h / 2);
            ctx.stroke();
        }
    });

    // Bears (collectibles)
    ctx.font        = "30px Arial";
    ctx.textAlign   = "center";
    ctx.textBaseline = "middle";
    bears.forEach(b => {
        if (!b.collected) {
            const floatY = Math.sin(Date.now() / 200 + b.x) * 5;
            ctx.fillText("🧸", b.x + b.w / 2, b.y + b.h / 2 + floatY);
        }
    });

    // Eagles
    birds.forEach(b => {
        ctx.save();
        ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
        if (b.dir === -1) ctx.scale(-1, 1);
        const flyY = Math.sin(Date.now() / 100 + b.x) * 3;
        ctx.fillText("🦅", 0, flyY);
        ctx.restore();
    });

    // Player robot
    drawRobot(player.x, player.y, player.w, player.h);
}


// ==========================================
// 15. MAIN GAME LOOP
// ==========================================
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}


// ==========================================
// 16. UI EVENT LISTENERS
// ==========================================
startBtn.addEventListener('click', () => {
    initAudio();
    startScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    controls.classList.remove('hidden');
    initGame();
    gameState = 'PLAYING';
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    controls.classList.remove('hidden');
    initGame();
    gameState = 'PLAYING';
});

lbBtn.addEventListener('click', () => {
    populateLeaderboardUI();
    leaderboardScreen.classList.remove('hidden');
});

lbBtnGameOver.addEventListener('click', () => {
    populateLeaderboardUI();
    leaderboardScreen.classList.remove('hidden');
});

closeLbBtn.addEventListener('click', () => {
    leaderboardScreen.classList.add('hidden');
});


// ==========================================
// 17. INITIALISE
// ==========================================
initClouds();
generateDailyChallenge();
loop();
