const broths = {
  miso: "味噌",
  shoyu: "醬油",
  tonkotsu: "豚骨"
};

const brothImages = {
  miso: "Assets/Miso-bowl.png",
  shoyu: "Assets/soy-sauce-bowl.png",
  tonkotsu: "Assets/pork-bone-bowl.png"
};

const toppings = {
  egg: "溏心蛋",
  pork: "叉燒",
  corn: "玉米",
  nori: "海苔"
};

const orderNames = [
  "暖呼呼拉麵",
  "店長推薦",
  "半夜餓餓碗",
  "元氣加滿",
  "快快上桌",
  "豪華小碗"
];

const state = {
  score: 0,
  combo: 0,
  time: 60,
  running: false,
  timerId: null,
  order: null,
  successBowls: [],
  bowl: {
    broth: null,
    toppings: new Set()
  }
};

const scoreEl = document.querySelector("#score");
const comboEl = document.querySelector("#combo");
const timeEl = document.querySelector("#time");
const orderTitleEl = document.querySelector("#orderTitle");
const orderTextEl = document.querySelector("#orderText");
const messageEl = document.querySelector("#message");
const successLogEl = document.querySelector("#successLog");
const successLogTrackEl = document.querySelector("#successLogTrack");
const currentOrderEl = document.querySelector("#currentOrder");
const bowlImage = document.querySelector("#bowlImage");
const bowlToppingImages = document.querySelectorAll("[data-bowl-topping]");
const likeEffect = document.querySelector("#likeEffect");
const dontLikeEffect = document.querySelector("#dontLikeEffect");
const finishEffect = document.querySelector("#finishEffect");
const bgMusic = document.querySelector("#bgMusic");
const bgmTracks = [
  "Assets/SE/Ramen%20shop%20music1.mp3",
  "Assets/SE/Ramen%20shop%20music2.mp3"
];
const soundEffects = {
  start: new Audio("Assets/SE/%E9%96%8B%E5%A7%8B.mp3"),
  choose: new Audio("Assets/SE/%E9%81%B8%E6%96%99.mp3"),
  serve: new Audio("Assets/SE/%E9%80%81%E5%87%BA.mp3"),
  clear: new Audio("Assets/SE/%E6%B8%85%E7%A9%BA.mp3"),
  end: new Audio("Assets/SE/kabuki_yell.mp3")
};
const serveBtn = document.querySelector("#serveBtn");
const clearBtn = document.querySelector("#clearBtn");
const startBtn = document.querySelector("#startBtn");
const bgmToggleBtn = document.querySelector("#bgmToggleBtn");
const bgmSwitchBtn = document.querySelector("#bgmSwitchBtn");
let previewBroth = null;
let musicStarted = false;
let musicPausedByFocus = false;
let bgmEnabled = true;
let bgmTrackIndex = 0;
let finishEffectTimer = null;
const landscapeLayoutQuery = window.matchMedia("(orientation: landscape) and (max-height: 560px)");

Object.values(soundEffects).forEach((audio) => {
  audio.preload = "auto";
  audio.volume = 0.8;
});

function sample(keys) {
  return keys[Math.floor(Math.random() * keys.length)];
}

function randomBroth() {
  return sample(Object.keys(brothImages));
}

function updateBgmButtonState() {
  if (!bgmToggleBtn) return;
  bgmToggleBtn.textContent = bgmEnabled ? "BGM OFF" : "BGM ON";
}

function playBackgroundMusic(restart = false) {
  if (!bgMusic || !bgmEnabled) return;
  bgMusic.volume = 0.45;
  if (restart) {
    bgMusic.currentTime = 0;
  }

  const playPromise = bgMusic.play();
  if (!playPromise) {
    musicStarted = true;
    return;
  }

  playPromise
    .then(() => {
      musicStarted = true;
    })
    .catch(() => {
      musicStarted = false;
    });
}

function stopBackgroundMusic() {
  if (!bgMusic) return;
  bgMusic.pause();
  musicStarted = false;
}

function pauseMusicForFocusLoss() {
  if (!bgMusic || !bgmEnabled || bgMusic.paused) return;
  musicPausedByFocus = true;
  bgMusic.pause();
}

function resumeMusicAfterFocus() {
  if (!musicPausedByFocus || !bgmEnabled) return;
  musicPausedByFocus = false;
  playBackgroundMusic();
}

function setBackgroundTrack(trackIndex) {
  if (!bgMusic) return;
  bgmTrackIndex = (trackIndex + bgmTracks.length) % bgmTracks.length;
  bgMusic.pause();
  bgMusic.setAttribute("src", bgmTracks[bgmTrackIndex]);
  bgMusic.load();
  musicStarted = false;
}

function toggleBackgroundMusic() {
  bgmEnabled = !bgmEnabled;
  musicPausedByFocus = false;

  if (bgmEnabled) {
    playBackgroundMusic();
  } else {
    stopBackgroundMusic();
  }

  updateBgmButtonState();
}

function switchBackgroundMusic() {
  bgmEnabled = true;
  musicPausedByFocus = false;
  setBackgroundTrack(bgmTrackIndex + 1);
  updateBgmButtonState();
  playBackgroundMusic(true);
}

function playSound(name) {
  const audio = soundEffects[name];
  if (!audio) return;

  const player = audio.cloneNode(true);
  player.volume = audio.volume;
  player.currentTime = 0;

  const playPromise = player.play();
  if (playPromise) {
    playPromise.catch(() => {});
  }
}

function updateLandscapeScale() {
  if (!landscapeLayoutQuery.matches) {
    document.documentElement.style.removeProperty("--landscape-scale");
    return;
  }

  const scale = Math.min(
    (window.innerWidth - 8) / 1120,
    (window.innerHeight - 8) / 720,
    1
  );
  document.documentElement.style.setProperty("--landscape-scale", scale.toFixed(4));
}

function makeOrder() {
  const toppingKeys = Object.keys(toppings);
  const count = Math.random() > 0.72 ? 3 : 2;
  const selected = new Set();
  while (selected.size < count) {
    selected.add(sample(toppingKeys));
  }

  return {
    name: sample(orderNames),
    broth: sample(Object.keys(broths)),
    toppings: [...selected]
  };
}

function describeOrder(order) {
  if (!order) return "空碗";
  return `${broths[order.broth]} + ${order.toppings.map((key) => toppings[key]).join("、")}`;
}

function updateStats() {
  scoreEl.textContent = state.score;
  comboEl.textContent = state.combo;
  timeEl.textContent = state.time;
}

function fitSuccessLog() {
  if (!successLogEl || !successLogTrackEl) return;
  const availableWidth = successLogEl.clientWidth;
  const trackWidth = successLogTrackEl.scrollWidth;
  const scale = trackWidth > availableWidth ? availableWidth / trackWidth : 1;
  successLogTrackEl.style.transform = `scale(${scale})`;
}

function renderSuccessLog() {
  if (!successLogTrackEl) return;
  successLogTrackEl.innerHTML = "";
  state.successBowls.forEach((brothKey) => {
    const image = document.createElement("img");
    image.className = "success-log-bowl";
    image.src = brothImages[brothKey];
    image.alt = `${broths[brothKey]}拉麵`;
    successLogTrackEl.appendChild(image);
  });
  requestAnimationFrame(fitSuccessLog);
}

function addSuccessBowl(brothKey) {
  state.successBowls.push(brothKey);
  renderSuccessLog();
}

function updateBowlView() {
  const displayBroth = state.bowl.broth || previewBroth || "miso";
  bowlImage.src = brothImages[displayBroth];
  bowlImage.alt = `${broths[displayBroth]}拉麵湯頭`;
  bowlImage.dataset.broth = displayBroth;

  document.querySelectorAll("[data-broth]").forEach((button) => {
    button.classList.toggle("active", button.dataset.broth === state.bowl.broth);
  });
  document.querySelectorAll("[data-topping]").forEach((button) => {
    button.classList.toggle("active", state.bowl.toppings.has(button.dataset.topping));
  });
  bowlToppingImages.forEach((image) => {
    image.classList.toggle("is-visible", state.bowl.toppings.has(image.dataset.bowlTopping));
  });

  const brothText = state.bowl.broth ? broths[state.bowl.broth] : "未選湯底";
  const toppingText = state.bowl.toppings.size
    ? [...state.bowl.toppings].map((key) => toppings[key]).join("、")
    : "未加配料";
  currentOrderEl.textContent = `${brothText} / ${toppingText}`;
}

function showMessage(text, tone = "") {
  messageEl.textContent = text;
  messageEl.className = `message ${tone}`.trim();
}

function playReaction(effectEl) {
  if (!effectEl) return;
  effectEl.classList.remove("is-playing");
  void effectEl.offsetWidth;
  effectEl.classList.add("is-playing");
}

function stopFinishEffect() {
  if (finishEffectTimer) {
    clearTimeout(finishEffectTimer);
    finishEffectTimer = null;
  }
  if (!finishEffect) return;
  finishEffect.classList.remove("is-playing");
}

function playFinishEffect() {
  if (!finishEffect) return;
  stopFinishEffect();
  void finishEffect.offsetWidth;
  finishEffect.classList.add("is-playing");
  finishEffectTimer = setTimeout(stopFinishEffect, 2500);
}

function showOrder() {
  if (!state.order) {
    orderTitleEl.textContent = "準備中";
    orderTextEl.textContent = "按「開始」接第一張單。";
    return;
  }

  orderTitleEl.textContent = state.order.name;
  orderTextEl.textContent = describeOrder(state.order);
}

function clearBowl() {
  state.bowl.broth = null;
  state.bowl.toppings.clear();
  updateBowlView();
}

function chooseBroth(brothKey) {
  playSound("choose");
  state.bowl.broth = brothKey;
  updateBowlView();
}

function toggleTopping(toppingKey) {
  playSound("choose");
  if (state.bowl.toppings.has(toppingKey)) {
    state.bowl.toppings.delete(toppingKey);
  } else {
    state.bowl.toppings.add(toppingKey);
  }
  updateBowlView();
}

function nextOrder() {
  state.order = makeOrder();
  clearBowl();
  showOrder();
}

function isMatch() {
  if (!state.order || state.bowl.broth !== state.order.broth) return false;
  if (state.bowl.toppings.size !== state.order.toppings.length) return false;
  return state.order.toppings.every((key) => state.bowl.toppings.has(key));
}

function serve() {
  playSound("serve");

  if (!state.running) {
    showMessage("先按開始。", "bad");
    return;
  }

  if (isMatch()) {
    const servedBroth = state.order.broth;
    state.combo += 1;
    state.score += 100 + Math.min(state.combo * 15, 150);
    addSuccessBowl(servedBroth);
    playReaction(likeEffect);
    showMessage(`正確出餐！${describeOrder(state.order)}`, "good");
    nextOrder();
  } else {
    state.combo = 0;
    state.time = Math.max(0, state.time - 5);
    playReaction(dontLikeEffect);
    showMessage(`客人說不是這碗：要 ${describeOrder(state.order)}`, "bad");
    clearBowl();
    updateStats();
    if (state.time === 0) endGame();
  }
}

function startGame() {
  stopFinishEffect();
  playSound("start");
  playBackgroundMusic();

  if (state.timerId) {
    clearInterval(state.timerId);
  }

  state.score = 0;
  state.combo = 0;
  state.time = 60;
  state.successBowls = [];
  state.running = true;
  startBtn.textContent = "重新開始";
  showMessage("開店！照訂單快速出餐。");
  renderSuccessLog();
  nextOrder();
  updateStats();

  state.timerId = setInterval(() => {
    state.time -= 1;
    updateStats();
    if (state.time <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  playSound("end");
  playFinishEffect();
  state.running = false;
  clearInterval(state.timerId);
  state.timerId = null;
  state.time = 0;
  state.order = null;
  previewBroth = randomBroth();
  updateStats();
  showOrder();
  clearBowl();
  showMessage(`收店！最後分數 ${state.score}，最高連擊 ${state.combo}。按重新開始再玩一次。`, "good");
}

document.querySelectorAll("[data-broth]").forEach((button) => {
  button.addEventListener("click", () => {
    chooseBroth(button.dataset.broth);
  });
});

document.querySelectorAll("[data-topping]").forEach((button) => {
  button.addEventListener("click", () => {
    toggleTopping(button.dataset.topping);
  });
});

serveBtn.addEventListener("click", serve);
clearBtn.addEventListener("click", () => {
  stopFinishEffect();
  playSound("clear");
  clearBowl();
  showMessage("碗已清空。");
});
startBtn.addEventListener("click", startGame);
bgmToggleBtn.addEventListener("click", toggleBackgroundMusic);
bgmSwitchBtn.addEventListener("click", switchBackgroundMusic);

document.addEventListener("pointerdown", () => {
  if (!musicStarted) playBackgroundMusic();
}, { once: true });

window.addEventListener("pagehide", stopBackgroundMusic);
window.addEventListener("blur", pauseMusicForFocusLoss);
window.addEventListener("focus", resumeMusicAfterFocus);
window.addEventListener("resize", () => {
  updateLandscapeScale();
  fitSuccessLog();
});
window.addEventListener("orientationchange", updateLandscapeScale);
if (landscapeLayoutQuery.addEventListener) {
  landscapeLayoutQuery.addEventListener("change", updateLandscapeScale);
} else if (landscapeLayoutQuery.addListener) {
  landscapeLayoutQuery.addListener(updateLandscapeScale);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    pauseMusicForFocusLoss();
  } else {
    resumeMusicAfterFocus();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea, select, [contenteditable='true']")) return;
  if (!musicStarted) playBackgroundMusic();

  if (event.code === "Space") {
    event.preventDefault();
    serve();
    return;
  }

  if (event.target.matches("button") && event.key === "Enter") return;

  const key = event.key.toLowerCase();
  const brothMap = { "1": "miso", "2": "shoyu", "3": "tonkotsu" };
  const toppingMap = { q: "egg", w: "pork", e: "corn", a: "nori" };

  if (brothMap[key]) {
    chooseBroth(brothMap[key]);
  }

  if (toppingMap[key]) {
    toggleTopping(toppingMap[key]);
  }

  if (key === "r") {
    startGame();
  }
});

previewBroth = randomBroth();
updateLandscapeScale();
updateBgmButtonState();
updateStats();
updateBowlView();
showOrder();
