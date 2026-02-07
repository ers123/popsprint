"use strict";

(() => {
  const WORLD_WIDTH = 360;
  const WORLD_HEIGHT = 540;
  const ROUND_SECONDS = 45;
  const TARGET_SWAP_SECONDS = 7;
  const MAX_STARS = 14;
  const BEST_SCORE_KEY = "popsprint-pals-best-score";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveDataEnabled = Boolean(navigator.connection && navigator.connection.saveData);
  const TARGET_FPS = saveDataEnabled ? 20 : prefersReducedMotion ? 24 : 30;
  const FRAME_MS = 1000 / TARGET_FPS;

  const palette = [
    { name: "Sky", fill: "#47c5ff" },
    { name: "Sun", fill: "#ffca3a" },
    { name: "Leaf", fill: "#72dc7a" },
    { name: "Berry", fill: "#ef6bff" }
  ];

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  const scoreValue = document.getElementById("score-value");
  const bestValue = document.getElementById("best-value");
  const timeValue = document.getElementById("time-value");
  const statusText = document.getElementById("status-text");
  const startButton = document.getElementById("start-btn");
  const pauseButton = document.getElementById("pause-btn");

  const state = {
    running: false,
    paused: false,
    pausedByVisibility: false,
    score: 0,
    best: Number(localStorage.getItem(BEST_SCORE_KEY) || 0),
    timeLeft: ROUND_SECONDS,
    combo: 0,
    targetIndex: 0,
    targetSwitchIn: TARGET_SWAP_SECONDS,
    spawnInMs: 0,
    stars: [],
    ripples: [],
    loopId: 0,
    lastFrameAt: 0,
    frameCarry: 0,
    shownSecond: ROUND_SECONDS
  };

  bestValue.textContent = String(state.best);
  drawFrame();

  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function updateHud(force = false) {
    if (force || Number(scoreValue.textContent) !== state.score) {
      scoreValue.textContent = String(state.score);
    }

    if (force || Number(bestValue.textContent) !== state.best) {
      bestValue.textContent = String(state.best);
    }

    const seconds = Math.max(0, Math.ceil(state.timeLeft));
    if (force || seconds !== state.shownSecond) {
      state.shownSecond = seconds;
      timeValue.textContent = String(seconds);
    }
  }

  function setStatus(message) {
    statusText.textContent = message;
  }

  function updateControls() {
    startButton.textContent = state.running ? "Restart Round" : "Start Round";
    pauseButton.disabled = !state.running;
    pauseButton.textContent = state.paused ? "Resume" : "Pause";
  }

  function spawnStar() {
    const colorIndex = Math.floor(Math.random() * palette.length);
    const baseSpeed = randomRange(74, 140);
    const speed = baseSpeed + Math.min(40, state.score * 1.3);

    state.stars.push({
      x: randomRange(34, WORLD_WIDTH - 34),
      y: WORLD_HEIGHT + randomRange(18, 76),
      radius: randomRange(15, 26),
      speed,
      drift: randomRange(-16, 16),
      colorIndex
    });
  }

  function spawnDelayMs() {
    const scaled = 850 - state.score * 11;
    return Math.max(320, scaled);
  }

  function startLoop() {
    if (state.loopId !== 0) {
      return;
    }
    state.lastFrameAt = 0;
    state.frameCarry = 0;
    state.loopId = window.requestAnimationFrame(loop);
  }

  function stopLoop() {
    if (state.loopId !== 0) {
      window.cancelAnimationFrame(state.loopId);
      state.loopId = 0;
    }
    state.lastFrameAt = 0;
    state.frameCarry = 0;
  }

  function beginRound() {
    state.running = true;
    state.paused = false;
    state.pausedByVisibility = false;
    state.score = 0;
    state.combo = 0;
    state.timeLeft = ROUND_SECONDS;
    state.targetIndex = Math.floor(Math.random() * palette.length);
    state.targetSwitchIn = TARGET_SWAP_SECONDS;
    state.spawnInMs = 50;
    state.stars = [];
    state.ripples = [];
    state.shownSecond = ROUND_SECONDS;

    updateHud(true);
    updateControls();
    setStatus("Round live. Tap stars in the target color.");
    drawFrame();
    startLoop();
  }

  function endRound() {
    state.running = false;
    state.paused = false;
    stopLoop();

    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(BEST_SCORE_KEY, String(state.best));
    }

    updateHud(true);
    updateControls();
    setStatus("Round over. Press Start Round for another run.");
    drawFrame();
  }

  function togglePause(fromVisibility = false) {
    if (!state.running) {
      return;
    }

    state.paused = !state.paused;
    state.pausedByVisibility = fromVisibility ? state.paused : false;

    if (state.paused) {
      stopLoop();
      setStatus("Paused. Tap Resume when ready.");
      drawFrame();
    } else {
      setStatus("Back in action.");
      startLoop();
    }
    updateControls();
  }

  function addRipple(x, y, color) {
    state.ripples.push({
      x,
      y,
      radius: 8,
      life: 0.36,
      color
    });
  }

  function updateFrame(dt) {
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      endRound();
      return;
    }

    state.targetSwitchIn -= dt;
    if (state.targetSwitchIn <= 0) {
      state.targetSwitchIn += TARGET_SWAP_SECONDS;
      state.targetIndex = (state.targetIndex + 1) % palette.length;
      setStatus("Target changed. Tap only " + palette[state.targetIndex].name + ".");
    }

    state.spawnInMs -= dt * 1000;
    if (state.spawnInMs <= 0 && state.stars.length < MAX_STARS) {
      spawnStar();
      state.spawnInMs += spawnDelayMs();
    }

    for (let i = state.stars.length - 1; i >= 0; i -= 1) {
      const star = state.stars[i];
      star.y -= star.speed * dt;
      star.x += star.drift * dt;

      if (star.x < star.radius) {
        star.x = star.radius;
        star.drift *= -1;
      } else if (star.x > WORLD_WIDTH - star.radius) {
        star.x = WORLD_WIDTH - star.radius;
        star.drift *= -1;
      }

      if (star.y + star.radius < 0) {
        state.stars.splice(i, 1);
      }
    }

    for (let i = state.ripples.length - 1; i >= 0; i -= 1) {
      const ripple = state.ripples[i];
      ripple.life -= dt;
      ripple.radius += 86 * dt;
      if (ripple.life <= 0) {
        state.ripples.splice(i, 1);
      }
    }

    updateHud();
  }

  function drawStar(star) {
    const color = palette[star.colorIndex].fill;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x - star.radius * 0.25, star.y - star.radius * 0.25, star.radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFrame() {
    ctx.fillStyle = "#eaf9ff";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const stripeHeight = 20;
    for (let y = 0; y < WORLD_HEIGHT; y += stripeHeight * 2) {
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(0, y, WORLD_WIDTH, stripeHeight);
    }

    const targetColor = palette[state.targetIndex];
    ctx.fillStyle = "rgba(15, 24, 48, 0.84)";
    ctx.fillRect(10, 10, WORLD_WIDTH - 20, 42);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 16px Trebuchet MS, Verdana, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Target: " + targetColor.name, 22, 36);

    ctx.fillStyle = targetColor.fill;
    ctx.beginPath();
    ctx.arc(WORLD_WIDTH - 36, 31, 11, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < state.stars.length; i += 1) {
      drawStar(state.stars[i]);
    }

    for (let i = 0; i < state.ripples.length; i += 1) {
      const ripple = state.ripples[i];
      ctx.strokeStyle = ripple.color;
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = Math.max(0, ripple.life / 0.36);
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (!state.running) {
      ctx.fillStyle = "rgba(7, 20, 44, 0.62)";
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "700 24px Trebuchet MS, Verdana, sans-serif";
      ctx.fillText("PopSprint Pals", WORLD_WIDTH / 2, WORLD_HEIGHT / 2 - 10);
      ctx.font = "600 15px Trebuchet MS, Verdana, sans-serif";
      ctx.fillText("Tap Start Round to begin", WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 24);
    } else if (state.paused) {
      ctx.fillStyle = "rgba(10, 24, 40, 0.4)";
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "700 21px Trebuchet MS, Verdana, sans-serif";
      ctx.fillText("Paused", WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    }
  }

  function loop(timestamp) {
    if (!state.running || state.paused) {
      state.loopId = 0;
      return;
    }

    if (state.lastFrameAt === 0) {
      state.lastFrameAt = timestamp;
    }

    const elapsed = timestamp - state.lastFrameAt;
    state.lastFrameAt = timestamp;
    state.frameCarry += elapsed;

    while (state.frameCarry >= FRAME_MS) {
      updateFrame(FRAME_MS / 1000);
      state.frameCarry -= FRAME_MS;
    }

    drawFrame();
    state.loopId = window.requestAnimationFrame(loop);
  }

  function toWorldPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * WORLD_WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
    return { x, y };
  }

  function onCanvasTap(event) {
    if (!state.running || state.paused) {
      return;
    }

    const point = toWorldPoint(event);
    let hit = null;
    let hitIndex = -1;

    for (let i = state.stars.length - 1; i >= 0; i -= 1) {
      const star = state.stars[i];
      const dx = point.x - star.x;
      const dy = point.y - star.y;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared <= star.radius * star.radius) {
        hit = star;
        hitIndex = i;
        break;
      }
    }

    if (!hit) {
      return;
    }

    state.stars.splice(hitIndex, 1);

    if (hit.colorIndex === state.targetIndex) {
      const bonus = Math.min(4, Math.floor(state.combo / 4));
      state.score += 1 + bonus;
      state.combo += 1;
      setStatus("Great tap. Keep the streak alive.");
    } else {
      state.combo = 0;
      state.score = Math.max(0, state.score - 1);
      setStatus("Wrong color. Find " + palette[state.targetIndex].name + ".");
    }

    addRipple(hit.x, hit.y, palette[hit.colorIndex].fill);
    updateHud();
  }

  canvas.addEventListener("pointerdown", onCanvasTap, { passive: true });

  startButton.addEventListener("click", () => {
    beginRound();
  });

  pauseButton.addEventListener("click", () => {
    togglePause(false);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.running && !state.paused) {
      togglePause(true);
      return;
    }

    if (!document.hidden && state.pausedByVisibility) {
      state.pausedByVisibility = false;
      setStatus("Resumed to paused state. Tap Resume when ready.");
    }
  });

  window.addEventListener("pagehide", stopLoop);

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      if (!state.running) {
        beginRound();
      } else {
        togglePause(false);
      }
    }
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        setStatus("Service worker registration skipped.");
      });
    });
  }
})();
