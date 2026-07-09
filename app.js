const broths = {
  miso: "味噌",
  shoyu: "醬油",
  tonkotsu: "豚骨"
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
  time: 75,
  running: false,
  timerId: null,
  order: null,
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
const currentOrderEl = document.querySelector("#currentOrder");
const brothView = document.querySelector("#brothView");
const serveBtn = document.querySelector("#serveBtn");
const clearBtn = document.querySelector("#clearBtn");
const startBtn = document.querySelector("#startBtn");

function sample(keys) {
  return keys[Math.floor(Math.random() * keys.length)];
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

function updateBowlView() {
  brothView.className = `broth${state.bowl.broth ? ` ${state.bowl.broth}` : ""}`;
  document.querySelectorAll(".topping").forEach((item) => {
    item.classList.toggle("show", state.bowl.toppings.has(item.dataset.name));
  });
  document.querySelectorAll("[data-broth]").forEach((button) => {
    button.classList.toggle("active", button.dataset.broth === state.bowl.broth);
  });
  document.querySelectorAll("[data-topping]").forEach((button) => {
    button.classList.toggle("active", state.bowl.toppings.has(button.dataset.topping));
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
  if (!state.running) {
    showMessage("先按開始。", "bad");
    return;
  }

  if (isMatch()) {
    state.combo += 1;
    state.score += 100 + Math.min(state.combo * 15, 150);
    showMessage(`正確出餐！${describeOrder(state.order)}`, "good");
    nextOrder();
  } else {
    state.combo = 0;
    state.time = Math.max(0, state.time - 5);
    showMessage(`客人說不是這碗：要 ${describeOrder(state.order)}`, "bad");
    clearBowl();
    updateStats();
    if (state.time === 0) endGame();
  }
}

function startGame() {
  if (state.timerId) {
    clearInterval(state.timerId);
  }

  state.score = 0;
  state.combo = 0;
  state.time = 75;
  state.running = true;
  startBtn.textContent = "重新開始";
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

function endGame() {
  state.running = false;
  clearInterval(state.timerId);
  state.timerId = null;
  state.time = 0;
  state.order = null;
  updateStats();
  showOrder();
  clearBowl();
  showMessage(`收店！最後分數 ${state.score}，最高連擊 ${state.combo}。按重新開始再玩一次。`, "good");
}

document.querySelectorAll("[data-broth]").forEach((button) => {
  button.addEventListener("click", () => {
    state.bowl.broth = button.dataset.broth;
    updateBowlView();
  });
});

document.querySelectorAll("[data-topping]").forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.topping;
    if (state.bowl.toppings.has(key)) {
      state.bowl.toppings.delete(key);
    } else {
      state.bowl.toppings.add(key);
    }
    updateBowlView();
  });
});

serveBtn.addEventListener("click", serve);
clearBtn.addEventListener("click", () => {
  clearBowl();
  showMessage("碗已清空。");
});
startBtn.addEventListener("click", startGame);

window.addEventListener("keydown", (event) => {
  if (event.target.matches("input, textarea, select, [contenteditable='true']")) return;
  if (event.target.matches("button") && (event.code === "Space" || event.key === "Enter")) return;

  const key = event.key.toLowerCase();
  const brothMap = { "1": "miso", "2": "shoyu", "3": "tonkotsu" };
  const toppingMap = { q: "egg", w: "pork", e: "corn", a: "nori" };

  if (brothMap[key]) {
    state.bowl.broth = brothMap[key];
    updateBowlView();
  }

  if (toppingMap[key]) {
    const topping = toppingMap[key];
    if (state.bowl.toppings.has(topping)) {
      state.bowl.toppings.delete(topping);
    } else {
      state.bowl.toppings.add(topping);
    }
    updateBowlView();
  }

  if (event.code === "Space") {
    event.preventDefault();
    serve();
  }

  if (key === "r") {
    startGame();
  }
});

updateStats();
updateBowlView();
showOrder();
