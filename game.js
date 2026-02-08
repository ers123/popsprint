"use strict";

(() => {
  const WORLD_WIDTH = 360;
  const WORLD_HEIGHT = 540;
  const ROUND_SECONDS = 45;
  const TARGET_SWAP_SECONDS = 7;
  const MAX_STARS = 14;
  const BEST_SCORE_KEY = "popsprint-pals-best-score";
  const TOTAL_XP_KEY = "popsprint-pals-total-xp";
  const UNLOCKED_ACHIEVEMENTS_KEY = "popsprint-pals-achievements";

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

  const cheers = [
    "Super tap!",
    "Great focus!",
    "Awesome streak!",
    "Nice timing!",
    "Brilliant!"
  ];

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  const scoreValue = document.getElementById("score-value");
  const bestValue = document.getElementById("best-value");
  const timeValue = document.getElementById("time-value");
  const levelValue = document.getElementById("level-value");
  const xpValue = document.getElementById("xp-value");
  const streakValue = document.getElementById("streak-value");
  const xpSummary = document.getElementById("xp-summary");
  const xpFill = document.getElementById("xp-fill");
  const missionText = document.getElementById("mission-text");
  const missionProgress = document.getElementById("mission-progress");
  const praiseBanner = document.getElementById("praise-banner");
  const roundSummary = document.getElementById("round-summary");
  const summaryLine = document.getElementById("summary-line");
  const summaryXp = document.getElementById("summary-xp");
  const summaryMission = document.getElementById("summary-mission");
  const summaryAchievement = document.getElementById("summary-achievement");
  const achievementList = document.getElementById("achievement-list");
  const statusText = document.getElementById("status-text");
  const startButton = document.getElementById("start-btn");
  const pauseButton = document.getElementById("pause-btn");
  const fullscreenButton = document.getElementById("fullscreen-btn");
  const gameShell = document.querySelector(".game-shell");

  const isLikelyMobile = window.matchMedia("(max-width: 900px)").matches
    || window.matchMedia("(pointer: coarse)").matches;

  const storedAchievements = safeParseJson(localStorage.getItem(UNLOCKED_ACHIEVEMENTS_KEY), {});
  const initialXp = Number(localStorage.getItem(TOTAL_XP_KEY) || 0);

  const state = {
    running: false,
    paused: false,
    pausedByVisibility: false,
    score: 0,
    best: Number(localStorage.getItem(BEST_SCORE_KEY) || 0),
    timeLeft: ROUND_SECONDS,
    streak: 0,
    bestStreakRound: 0,
    correctTapsRound: 0,
    missTapsRound: 0,
    xpEarnedRound: 0,
    totalXp: Number.isFinite(initialXp) ? initialXp : 0,
    levelMeta: null,
    targetIndex: 0,
    targetSwitchIn: TARGET_SWAP_SECONDS,
    spawnInMs: 0,
    stars: [],
    ripples: [],
    mission: null,
    missionCompleted: false,
    missionRewardGiven: false,
    unlockedAchievements: storedAchievements,
    newAchievementsRound: [],
    praiseTimer: 0,
    loopId: 0,
    lastFrameAt: 0,
    frameCarry: 0,
    shownSecond: ROUND_SECONDS
  };

  state.levelMeta = getLevelMeta(state.totalXp);
  updateAchievementUI();
  updateHud(true);
  drawFrame();
  syncFocusMode();

  function safeParseJson(value, fallback) {
    try {
      if (!value) {
        return fallback;
      }
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function xpRequiredForLevel(level) {
    return 25 + (level - 1) * 15;
  }

  function getLevelMeta(totalXp) {
    let level = 1;
    let xpIntoLevel = Math.max(0, Math.floor(totalXp));
    let required = xpRequiredForLevel(level);

    while (xpIntoLevel >= required) {
      xpIntoLevel -= required;
      level += 1;
      required = xpRequiredForLevel(level);
    }

    return {
      level,
      xpIntoLevel,
      xpForNext: required
    };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function setStatus(message) {
    statusText.textContent = message;
  }

  function showPraise(message) {
    if (!message) {
      return;
    }

    praiseBanner.textContent = message;
    praiseBanner.classList.remove("active");
    void praiseBanner.offsetWidth;
    praiseBanner.classList.add("active");

    if (state.praiseTimer) {
      window.clearTimeout(state.praiseTimer);
    }

    state.praiseTimer = window.setTimeout(() => {
      praiseBanner.classList.remove("active");
    }, 900);
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

    const level = state.levelMeta.level;
    const xpIntoLevel = Math.floor(state.levelMeta.xpIntoLevel);
    const xpForNext = state.levelMeta.xpForNext;
    const progressRatio = clamp(xpIntoLevel / xpForNext, 0, 1);
    const xpLeft = Math.max(0, xpForNext - xpIntoLevel);

    if (force || Number(levelValue.textContent) !== level) {
      levelValue.textContent = String(level);
    }
    xpValue.textContent = xpIntoLevel + "/" + xpForNext;
    streakValue.textContent = String(state.streak);
    xpSummary.textContent = "Level " + level + " progress · " + xpLeft + " XP to next";
    xpFill.style.width = (progressRatio * 100).toFixed(1) + "%";
  }

  function updateControls() {
    startButton.textContent = state.running ? "Restart Round" : "Start Round";
    pauseButton.disabled = !state.running;
    pauseButton.textContent = state.paused ? "Resume" : "Pause";
    fullscreenButton.textContent = document.fullscreenElement ? "Exit Fullscreen" : "Fullscreen";
  }

  function syncFocusMode() {
    document.body.classList.toggle("game-focus", state.running);
    document.body.classList.toggle("is-fullscreen", Boolean(document.fullscreenElement));
    updateControls();
  }

  async function requestFullscreenForGame() {
    if (!gameShell || document.fullscreenElement || !gameShell.requestFullscreen) {
      return false;
    }

    try {
      await gameShell.requestFullscreen({ navigationUI: "hide" });
      return true;
    } catch {
      return false;
    }
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    const entered = await requestFullscreenForGame();
    if (!entered) {
      setStatus("Fullscreen is unavailable here. Focus mode is still active.");
    }
  }

  function buildMission() {
    const levelBoost = Math.min(6, state.levelMeta.level - 1);
    const missionType = Math.floor(Math.random() * 3);

    if (missionType === 0) {
      const target = 14 + levelBoost * 2;
      return {
        type: "score",
        target,
        bonusXp: 10 + levelBoost,
        label: "Score " + target + "+ this round."
      };
    }

    if (missionType === 1) {
      const target = 12 + levelBoost * 2;
      return {
        type: "correct",
        target,
        bonusXp: 9 + levelBoost,
        label: "Land " + target + " correct taps."
      };
    }

    const target = 7 + Math.floor(levelBoost / 2);
    return {
      type: "streak",
      target,
      bonusXp: 12 + levelBoost,
      label: "Reach a streak of " + target + "."
    };
  }

  function getMissionProgressRatio() {
    if (!state.mission) {
      return 0;
    }

    if (state.mission.type === "score") {
      return clamp(state.score / state.mission.target, 0, 1);
    }

    if (state.mission.type === "correct") {
      return clamp(state.correctTapsRound / state.mission.target, 0, 1);
    }

    if (state.mission.type === "streak") {
      return clamp(state.bestStreakRound / state.mission.target, 0, 1);
    }

    return 0;
  }

  function updateMissionUI() {
    if (!state.mission) {
      missionText.textContent = "Start a round to reveal your mission.";
      missionProgress.textContent = "Progress: 0%";
      return;
    }

    missionText.textContent = state.mission.label;
    const progress = getMissionProgressRatio();
    const percent = Math.floor(progress * 100);
    missionProgress.textContent = state.missionCompleted
      ? "Progress: 100% · Completed!"
      : "Progress: " + percent + "%";
  }

  function awardXp(amount, reason) {
    const beforeLevel = state.levelMeta.level;
    const safeAmount = Math.max(0, Math.floor(amount));
    if (safeAmount <= 0) {
      return;
    }

    state.totalXp += safeAmount;
    state.xpEarnedRound += safeAmount;
    localStorage.setItem(TOTAL_XP_KEY, String(state.totalXp));
    state.levelMeta = getLevelMeta(state.totalXp);
    updateHud(true);

    if (state.levelMeta.level > beforeLevel) {
      showPraise("Level up! You are now Level " + state.levelMeta.level + ".");
      setStatus("Fantastic. Level " + state.levelMeta.level + " unlocked.");
    } else if (reason) {
      showPraise(reason);
    }
  }

  function unlockAchievement(id, message) {
    if (state.unlockedAchievements[id]) {
      return;
    }

    state.unlockedAchievements[id] = true;
    localStorage.setItem(UNLOCKED_ACHIEVEMENTS_KEY, JSON.stringify(state.unlockedAchievements));
    state.newAchievementsRound.push(message);
    showPraise("Badge unlocked: " + message);
    updateAchievementUI();
  }

  function updateAchievementUI() {
    const items = achievementList.querySelectorAll("[data-achievement]");
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const id = item.getAttribute("data-achievement");
      if (state.unlockedAchievements[id]) {
        item.classList.add("unlocked");
        if (!item.textContent.includes("Unlocked")) {
          item.textContent = item.textContent + " · Unlocked";
        }
      } else {
        item.classList.remove("unlocked");
      }
    }
  }

  function evaluateLiveBadges() {
    if (state.score >= 10) {
      unlockAchievement("first-steps", "First Steps");
    }

    if (state.bestStreakRound >= 12) {
      unlockAchievement("streak-star", "Streak Star");
    }

    if (state.levelMeta.level >= 5) {
      unlockAchievement("level-climber", "Level Climber");
    }
  }

  function evaluateRoundEndBadges() {
    if (state.correctTapsRound >= 15 && state.missTapsRound === 0) {
      unlockAchievement("steady-hands", "Steady Hands");
    }
  }

  function maybeCompleteMission() {
    if (!state.mission || state.missionCompleted) {
      return;
    }

    if (getMissionProgressRatio() >= 1) {
      state.missionCompleted = true;
      if (!state.missionRewardGiven) {
        state.missionRewardGiven = true;
        awardXp(
          state.mission.bonusXp,
          "Mission complete! +" + state.mission.bonusXp + " XP"
        );
      }
      setStatus("Mission complete. Amazing focus.");
    }

    updateMissionUI();
  }

  function spawnStar() {
    const colorIndex = Math.floor(Math.random() * palette.length);
    const baseSpeed = randomRange(74, 140);
    const speed = baseSpeed + Math.min(48, state.score * 1.4);

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
    const scaled = 860 - state.score * 11 - state.levelMeta.level * 8;
    return Math.max(290, scaled);
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
    state.streak = 0;
    state.bestStreakRound = 0;
    state.correctTapsRound = 0;
    state.missTapsRound = 0;
    state.xpEarnedRound = 0;
    state.newAchievementsRound = [];
    state.timeLeft = ROUND_SECONDS;
    state.targetIndex = Math.floor(Math.random() * palette.length);
    state.targetSwitchIn = TARGET_SWAP_SECONDS;
    state.spawnInMs = 50;
    state.stars = [];
    state.ripples = [];
    state.shownSecond = ROUND_SECONDS;
    state.mission = buildMission();
    state.missionCompleted = false;
    state.missionRewardGiven = false;

    roundSummary.hidden = true;
    praiseBanner.textContent = "";
    syncFocusMode();
    updateHud(true);
    updateMissionUI();
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

    evaluateRoundEndBadges();
    evaluateLiveBadges();

    const scoreXp = Math.max(6, Math.floor(state.score * 1.2));
    const streakXp = Math.min(12, Math.floor(state.bestStreakRound / 2));
    awardXp(scoreXp + streakXp, "Round complete! +" + (scoreXp + streakXp) + " XP");

    summaryLine.textContent = "Score " + state.score + " · Best streak " + state.bestStreakRound;
    summaryXp.textContent = "XP gained this round: " + state.xpEarnedRound;
    summaryMission.textContent = state.missionCompleted
      ? "Mission: Completed +" + state.mission.bonusXp + " XP"
      : "Mission: Keep trying next round";
    summaryAchievement.textContent = state.newAchievementsRound.length > 0
      ? "New badges: " + state.newAchievementsRound.join(", ")
      : "New badges: None this round";
    roundSummary.hidden = false;
    syncFocusMode();

    updateMissionUI();
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

  function handleViewportChange() {
    drawFrame();
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

    maybeCompleteMission();
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
    ctx.arc(
      star.x - star.radius * 0.25,
      star.y - star.radius * 0.25,
      star.radius * 0.24,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  function drawFrame() {
    const levelTint = Math.min(25, state.levelMeta.level * 2);
    ctx.fillStyle = "rgb(" + (234 - levelTint) + ", 249, 255)";
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
      const bonus = Math.min(4, Math.floor(state.streak / 4));
      state.score += 1 + bonus;
      state.streak += 1;
      state.bestStreakRound = Math.max(state.bestStreakRound, state.streak);
      state.correctTapsRound += 1;

      if (state.streak % 5 === 0) {
        showPraise(state.streak + " streak! " + cheers[Math.floor(Math.random() * cheers.length)]);
      } else {
        showPraise(cheers[Math.floor(Math.random() * cheers.length)]);
      }

      setStatus("Great tap. Keep the streak alive.");
    } else {
      state.streak = 0;
      state.score = Math.max(0, state.score - 1);
      state.missTapsRound += 1;
      setStatus("Wrong color. Find " + palette[state.targetIndex].name + ".");
    }

    addRipple(hit.x, hit.y, palette[hit.colorIndex].fill);
    evaluateLiveBadges();
    maybeCompleteMission();
    updateMissionUI();
    updateHud();
  }

  canvas.addEventListener("pointerdown", onCanvasTap, { passive: true });

  startButton.addEventListener("click", () => {
    beginRound();
    if (isLikelyMobile) {
      requestFullscreenForGame().then((entered) => {
        if (!entered) {
          setStatus("Tip: use Fullscreen for the best mobile feel.");
        }
      });
    }
  });

  pauseButton.addEventListener("click", () => {
    togglePause(false);
  });

  fullscreenButton.addEventListener("click", () => {
    toggleFullscreen();
  });

  document.addEventListener("fullscreenchange", () => {
    syncFocusMode();
    handleViewportChange();
  });

  window.addEventListener("resize", handleViewportChange);
  window.addEventListener("orientationchange", handleViewportChange);

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
      return;
    }

    if (event.code === "KeyF") {
      event.preventDefault();
      toggleFullscreen();
    }
  });

  function renderGameToText() {
    const mode = state.running ? (state.paused ? "paused" : "running") : "menu";
    const payload = {
      coordinate_system: "origin:top-left,x:right,y:down,world:360x540",
      mode,
      time_left: Number(state.timeLeft.toFixed(2)),
      score: state.score,
      best: state.best,
      level: state.levelMeta.level,
      streak: state.streak,
      mission: state.mission
        ? {
            type: state.mission.type,
            target: state.mission.target,
            completed: state.missionCompleted
          }
        : null,
      target_color: palette[state.targetIndex].name,
      stars: state.stars.map((star) => ({
        x: Number(star.x.toFixed(1)),
        y: Number(star.y.toFixed(1)),
        radius: Number(star.radius.toFixed(1)),
        color: palette[star.colorIndex].name
      }))
    };
    return JSON.stringify(payload);
  }

  function advanceTime(ms) {
    const safeMs = Math.max(0, Number(ms) || 0);
    if (!state.running || state.paused || safeMs === 0) {
      drawFrame();
      return;
    }

    let remaining = safeMs;
    while (remaining >= FRAME_MS) {
      updateFrame(FRAME_MS / 1000);
      remaining -= FRAME_MS;
      if (!state.running) {
        break;
      }
    }
    drawFrame();
  }

  window.render_game_to_text = renderGameToText;
  window.advanceTime = advanceTime;

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        setStatus("Service worker registration skipped.");
      });
    });
  }
})();
