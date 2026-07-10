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
  starting: false,
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
const orderTalkEl = document.querySelector("#orderTalk");
const messageEl = document.querySelector("#message");
const successLogEl = document.querySelector("#successLog");
const successLogTrackEl = document.querySelector("#successLogTrack");
const currentOrderEl = document.querySelector("#currentOrder");
const bowlImage = document.querySelector("#bowlImage");
const bowlToppingImages = document.querySelectorAll("[data-bowl-topping]");
const likeEffect = document.querySelector("#likeEffect");
const dontLikeEffect = document.querySelector("#dontLikeEffect");
const dropEffect = document.querySelector("#dropEffect");
const finishEffect = document.querySelector("#finishEffect");
const curtainLayer = document.querySelector("#curtainLayer");
const countdownOverlay = document.querySelector("#countdownOverlay");
const bgMusic = document.querySelector("#bgMusic");
const bgmTracks = [
  "Assets/SE/Ramen%20shop%20music1.mp3",
  "Assets/SE/Ramen%20shop%20music2.mp3"
];
const soundEffects = {
  start: new Audio("Assets/SE/%E5%92%8C%E5%A4%AA%E9%BC%931.mp3"),
  finishStamp: new Audio("Assets/SE/%E5%92%8C%E5%A4%AA%E9%BC%932.mp3"),
  curtainOpen: new Audio("Assets/SE/%E9%96%8B%E5%A7%8B.mp3"),
  curtainClose: new Audio("Assets/SE/%E5%92%8C%E5%A4%AA%E9%BC%931.mp3"),
  didIt: new Audio("Assets/SE/%E5%81%9A%E5%88%B0%E4%BA%86.mp3"),
  yeah: new Audio("Assets/SE/%E8%80%B6.mp3"),
  letsEat: new Audio("Assets/SE/%E9%96%8B%E5%8B%95%E4%BA%86.mp3"),
  ali: new Audio("Assets/SE/%E9%98%BF%E9%87%8C.mp3"),
  thanksMeal: new Audio("Assets/SE/%E8%AC%9D%E8%AC%9D%E6%AC%BE%E5%BE%85.mp3"),
  hardWork: new Audio("Assets/SE/%E8%BE%9B%E8%8B%A6%E4%BA%86.mp3"),
  thankYou: new Audio("Assets/SE/%E8%AC%9D%E8%AC%9D%E4%BD%A0.mp3"),
  veryThanks: new Audio("Assets/SE/%E9%9D%9E%E5%B8%B8%E6%84%9F%E8%AC%9D.mp3"),
  choose: new Audio("Assets/SE/%E9%81%B8%E6%96%99.mp3"),
  serve: new Audio("Assets/SE/%E9%80%81%E5%87%BA.mp3"),
  error: new Audio("Assets/SE/%E9%8C%AF%E8%AA%A4.mp3"),
  clear: new Audio("Assets/SE/%E6%B8%85%E7%A9%BA.mp3"),
  end: new Audio("Assets/SE/kabuki_yell.mp3")
};
const curtainCloseVoices = ["thanksMeal", "hardWork", "thankYou", "veryThanks"];
const correctServeVoices = ["didIt", "yeah", "letsEat", "ali"];
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
let countdownTimerId = null;
let curtainTimerId = null;
let closingCurtainTimerId = null;
let gameFlowId = 0;
const countdownStepMs = 800;
const curtainOpenMs = 220;
const curtainCloseMs = 260;
const finishEffectMs = 2500;
const landscapeLayoutQuery = window.matchMedia("(orientation: landscape) and (max-height: 560px)");
const userAgent = navigator.userAgent || "";
const isIpadLike = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
const isIosDevice = /iP(hone|ad|od)/.test(userAgent) || isIpadLike;
const isSafari = /Safari/i.test(userAgent) && !/(Chrome|Chromium|CriOS|FxiOS|Edg|OPR|Android)/i.test(userAgent);
const fixedBoardMode = isIosDevice || isSafari;

if (fixedBoardMode) {
  document.documentElement.classList.add("fixed-board-mode");
}

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

function playRandomSound(names) {
  if (!names.length) return;
  playSound(sample(names));
}

function clearFlowTimers() {
  if (countdownTimerId) {
    clearTimeout(countdownTimerId);
    countdownTimerId = null;
  }
  if (curtainTimerId) {
    clearTimeout(curtainTimerId);
    curtainTimerId = null;
  }
  if (closingCurtainTimerId) {
    clearTimeout(closingCurtainTimerId);
    closingCurtainTimerId = null;
  }
}

function setCurtainState(stateName) {
  if (!curtainLayer) return;
  curtainLayer.classList.remove("is-closed", "is-open", "is-opening", "is-closing");
  curtainLayer.classList.add(`is-${stateName}`);
}

function showCountdown(value) {
  if (!countdownOverlay) return;
  countdownOverlay.textContent = value;
  countdownOverlay.classList.remove("is-visible");
  void countdownOverlay.offsetWidth;
  countdownOverlay.classList.add("is-visible");
}

function hideCountdown() {
  if (!countdownOverlay) return;
  countdownOverlay.classList.remove("is-visible");
  countdownOverlay.textContent = "";
}

function openCurtains(flowId) {
  if (flowId !== gameFlowId) return;
  playSound("curtainOpen");
  setCurtainState("opening");
  curtainTimerId = setTimeout(() => {
    if (flowId !== gameFlowId) return;
    setCurtainState("open");
    beginActiveGame(flowId);
  }, curtainOpenMs);
}

function closeCurtains(flowId) {
  if (flowId !== gameFlowId) return;
  playSound("curtainClose");
  playRandomSound(curtainCloseVoices);
  setCurtainState("closing");
  curtainTimerId = setTimeout(() => {
    if (flowId !== gameFlowId) return;
    setCurtainState("closed");
  }, curtainCloseMs);
}

function runCountdown(flowId) {
  const steps = ["3", "2", "1"];
  let index = 0;
  showCountdown(steps[index]);
  showMessage("準備中，倒數開始。");

  function nextStep() {
    if (flowId !== gameFlowId) return;
    index += 1;
    if (index < steps.length) {
      showCountdown(steps[index]);
      countdownTimerId = setTimeout(nextStep, countdownStepMs);
      return;
    }

    hideCountdown();
    openCurtains(flowId);
  }

  countdownTimerId = setTimeout(nextStep, countdownStepMs);
}

function beginActiveGame(flowId) {
  if (flowId !== gameFlowId) return;
  state.starting = false;
  state.running = true;
  showMessage("開店！照訂單快速出餐。");
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

function updateLandscapeScale() {
  if (fixedBoardMode) {
    const width = document.documentElement.clientWidth || window.innerWidth || 1120;
    const height = document.documentElement.clientHeight || window.innerHeight || 720;
    const scale = Math.min(Math.max((width - 8) / 1120, 0.28), 1);
    const boardWidth = Math.ceil(1120 * scale);
    const boardHeight = Math.ceil(744 * scale);
    const stageHeight = Math.max(height, boardHeight);

    document.documentElement.style.setProperty("--fixed-board-scale", scale.toFixed(4));
    document.documentElement.style.setProperty("--fixed-board-width", `${boardWidth}px`);
    document.documentElement.style.setProperty("--fixed-board-height", `${boardHeight}px`);
    document.documentElement.style.setProperty("--fixed-stage-height", `${stageHeight}px`);
    return;
  }

  if (!landscapeLayoutQuery.matches) {
    document.documentElement.style.removeProperty("--landscape-scale");
    document.documentElement.style.removeProperty("--landscape-board-width");
    document.documentElement.style.removeProperty("--landscape-board-height");
    document.documentElement.style.removeProperty("--landscape-stage-height");
    return;
  }

  const width = window.innerWidth || document.documentElement.clientWidth || 1120;
  const height = window.innerHeight || document.documentElement.clientHeight || 720;
  const scale = Math.min((width - 8) / 1120, 1);
  const boardWidth = Math.ceil(1120 * scale);
  const boardHeight = Math.ceil(744 * scale);
  const stageHeight = Math.max(height, boardHeight);

  document.documentElement.style.setProperty("--landscape-scale", scale.toFixed(4));
  document.documentElement.style.setProperty("--landscape-board-width", `${boardWidth}px`);
  document.documentElement.style.setProperty("--landscape-board-height", `${boardHeight}px`);
  document.documentElement.style.setProperty("--landscape-stage-height", `${stageHeight}px`);
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

function stopDropEffect() {
  if (!dropEffect) return;
  dropEffect.classList.remove("is-playing");
}

function playDropEffect() {
  if (!dropEffect) return;
  stopDropEffect();
  void dropEffect.offsetWidth;
  dropEffect.classList.add("is-playing");
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
  playSound("finishStamp");
  void finishEffect.offsetWidth;
  finishEffect.classList.add("is-playing");
  finishEffectTimer = setTimeout(stopFinishEffect, finishEffectMs);
}

function showOrder() {
  if (!state.order) {
    orderTitleEl.textContent = "準備中";
    if (orderTalkEl) orderTalkEl.textContent = "閒談訊息...";
    orderTextEl.textContent = "按「開始」接第一張單。";
    return;
  }

  orderTitleEl.textContent = state.order.name;
  if (orderTalkEl) orderTalkEl.textContent = "請照這張單出餐。";
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
  if (state.starting) {
    showMessage("倒數中，等布簾拉開。", "bad");
    return;
  }

  if (!state.running) {
    showMessage("先按開始。", "bad");
    return;
  }

  if (isMatch()) {
    playSound("serve");
    playRandomSound(correctServeVoices);
    const servedBroth = state.order.broth;
    state.combo += 1;
    state.score += 100 + Math.min(state.combo * 15, 150);
    addSuccessBowl(servedBroth);
    playReaction(likeEffect);
    showMessage(`正確出餐！${describeOrder(state.order)}`, "good");
    nextOrder();
  } else {
    playSound("error");
    state.combo = 0;
    state.time = Math.max(0, state.time - 5);
    playReaction(dontLikeEffect);
    playDropEffect();
    showMessage(`客人說不是這碗：要 ${describeOrder(state.order)}`, "bad");
    clearBowl();
    updateStats();
    if (state.time === 0) endGame();
  }
}

function startGame() {
  const flowId = ++gameFlowId;
  clearFlowTimers();
  stopFinishEffect();
  stopDropEffect();
  hideCountdown();
  setCurtainState("closed");
  playSound("start");
  playBackgroundMusic();

  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }

  state.score = 0;
  state.combo = 0;
  state.time = 60;
  state.successBowls = [];
  state.running = false;
  state.starting = true;
  state.order = null;
  previewBroth = randomBroth();
  startBtn.textContent = "重新開始";
  showMessage("準備中，倒數開始。");
  renderSuccessLog();
  clearBowl();
  showOrder();
  updateStats();
  runCountdown(flowId);
}

function endGame() {
  const flowId = ++gameFlowId;
  clearFlowTimers();
  playSound("end");
  stopDropEffect();
  playFinishEffect();
  state.running = false;
  state.starting = false;
  clearInterval(state.timerId);
  state.timerId = null;
  state.time = 0;
  state.order = null;
  previewBroth = randomBroth();
  updateStats();
  showOrder();
  clearBowl();
  showMessage(`收店！最後分數 ${state.score}，最高連擊 ${state.combo}。按重新開始再玩一次。`, "good");
  closingCurtainTimerId = setTimeout(() => {
    if (flowId !== gameFlowId) return;
    closeCurtains(flowId);
  }, finishEffectMs);
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
  stopDropEffect();
  if (!state.running && !state.starting) {
    clearFlowTimers();
    hideCountdown();
    setCurtainState("closed");
  }
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
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateLandscapeScale);
  window.visualViewport.addEventListener("scroll", updateLandscapeScale);
}
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
setCurtainState("closed");
hideCountdown();
updateLandscapeScale();
updateBgmButtonState();
updateStats();
updateBowlView();
showOrder();
