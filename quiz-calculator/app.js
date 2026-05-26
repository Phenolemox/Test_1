const SCRIPT_URL = ""; // вставьте URL Web App из Google Apps Script, заканчивается на /exec
const CURRENCY = "₽";

const FALLBACK_CONFIG = {
  questions: [
    { id: 1, text: "Что нужно рассчитать?", type: "single", sort_order: 1, options: [
      { id: 101, text: "Лендинг / простая услуга", price: 5000 },
      { id: 102, text: "Корпоративный сайт / средний проект", price: 15000 },
      { id: 103, text: "Интернет-магазин / сложный проект", price: 30000 }
    ]},
    { id: 2, text: "Количество страниц или объём работ?", type: "single", sort_order: 2, options: [
      { id: 201, text: "1–3 страницы / небольшой объём", price: 0 },
      { id: 202, text: "4–10 страниц / средний объём", price: 5000 },
      { id: 203, text: "11–30 страниц / большой объём", price: 12000 },
      { id: 204, text: "Больше 30 страниц / нестандартный объём", price: 25000 }
    ]},
    { id: 3, text: "Нужен ли индивидуальный дизайн?", type: "single", sort_order: 3, options: [
      { id: 301, text: "Шаблонный дизайн", price: 0 },
      { id: 302, text: "Индивидуальный дизайн", price: 10000 }
    ]},
    { id: 4, text: "Нужны ли интеграции?", type: "single", sort_order: 4, options: [
      { id: 401, text: "Без интеграций", price: 0 },
      { id: 402, text: "Форма + таблица заявок", price: 5000 },
      { id: 403, text: "CRM / оплата / внешние сервисы", price: 15000 }
    ]},
    { id: 5, text: "Нужен ли контент или тексты?", type: "single", sort_order: 5, options: [
      { id: 501, text: "Контент уже готов", price: 0 },
      { id: 502, text: "Нужна редактура", price: 5000 },
      { id: 503, text: "Нужно написать тексты с нуля", price: 12000 }
    ]},
    { id: 6, text: "Как срочно нужен запуск?", type: "single", sort_order: 6, options: [
      { id: 601, text: "Стандартно", price: 0 },
      { id: 602, text: "Срочно", price: 7000 }
    ]}
  ],
  tariffs: []
};

const state = {
  config: FALLBACK_CONFIG,
  step: 0,
  answers: new Map()
};

const el = {
  step: document.getElementById("quizStep"),
  progress: document.getElementById("progressBar"),
  counter: document.getElementById("stepCounter"),
  prev: document.getElementById("prevBtn"),
  next: document.getElementById("nextBtn"),
  final: document.getElementById("finalScreen"),
  price: document.getElementById("priceResult"),
  form: document.getElementById("leadForm"),
  success: document.getElementById("successBox")
};

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("ru-RU")} ${CURRENCY}`;
}

function scriptIsReady() {
  return SCRIPT_URL && SCRIPT_URL.startsWith("https://") && !SCRIPT_URL.includes("PASTE_");
}

function loadConfigByJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `quizConfig_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement("script");
    const separator = url.includes("?") ? "&" : "?";
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Timeout loading config"));
    }, 8000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP load failed"));
    };

    script.src = `${url}${separator}callback=${encodeURIComponent(callbackName)}&t=${Date.now()}`;
    document.body.appendChild(script);
  });
}

async function init() {
  if (scriptIsReady()) {
    try {
      const remote = await loadConfigByJsonp(SCRIPT_URL);
      if (remote && Array.isArray(remote.questions) && remote.questions.length > 0) {
        state.config = remote;
      }
    } catch (error) {
      console.warn("Не удалось загрузить конфигурацию из Google Sheets, используется fallback", error);
    }
  }

  el.prev.addEventListener("click", prevStep);
  el.next.addEventListener("click", nextStep);
  el.form.addEventListener("submit", submitLead);
  renderStep();
}

function renderStep() {
  const total = state.config.questions.length;
  const question = state.config.questions[state.step];
  el.final.classList.add("hidden");
  el.step.classList.remove("hidden");
  el.counter.textContent = `${state.step + 1} / ${total}`;
  el.progress.style.width = `${((state.step + 1) / total) * 100}%`;
  el.prev.disabled = state.step === 0;
  el.next.textContent = state.step === total - 1 ? "Рассчитать" : "Далее";

  const selectedOption = state.answers.get(String(question.id));
  const optionsHtml = (question.options || []).map(option => {
    const checked = selectedOption && String(selectedOption.option_id) === String(option.id) ? "checked" : "";
    const price = Number(option.price || option.price_modifier || 0);
    return `
      <label class="option">
        <input type="radio" name="q_${question.id}" value="${option.id}" data-text="${escapeHtml(option.text)}" data-price="${price}" ${checked} />
        <span>${escapeHtml(option.text)}</span>
        <span class="option-price">${price ? "+ " + formatMoney(price) : "0 ₽"}</span>
      </label>
    `;
  }).join("");

  el.step.innerHTML = `
    <div class="question-title">${escapeHtml(question.text)}</div>
    <div class="options">${optionsHtml}</div>
  `;

  el.step.querySelectorAll("input[type='radio']").forEach(input => {
    input.addEventListener("change", () => {
      state.answers.set(String(question.id), {
        question_id: question.id,
        question_text: question.text,
        option_id: input.value,
        option_text: input.dataset.text,
        price: Number(input.dataset.price || 0)
      });
    });
  });
}

function nextStep() {
  const question = state.config.questions[state.step];
  if (!state.answers.has(String(question.id))) {
    alert("Выберите вариант, чтобы продолжить.");
    return;
  }
  if (state.step < state.config.questions.length - 1) {
    state.step += 1;
    renderStep();
  } else {
    showFinal();
  }
}

function prevStep() {
  if (state.step > 0) {
    state.step -= 1;
    renderStep();
  }
}

function calculatePrice() {
  let sum = 0;
  state.answers.forEach(answer => { sum += Number(answer.price || 0); });
  return sum;
}

function showFinal() {
  el.step.classList.add("hidden");
  el.final.classList.remove("hidden");
  el.prev.disabled = true;
  el.next.disabled = true;
  el.counter.textContent = "Готово";
  el.progress.style.width = "100%";
  el.price.textContent = formatMoney(calculatePrice());
}

function submitLead(event) {
  event.preventDefault();

  const payload = {
    id: `LOCAL-${Date.now()}`,
    name: document.getElementById("clientName").value.trim(),
    phone: document.getElementById("clientPhone").value.trim(),
    email: document.getElementById("clientEmail").value.trim(),
    price: calculatePrice(),
    answers: Array.from(state.answers.values())
  };

  if (!scriptIsReady()) {
    el.success.classList.remove("hidden");
    el.success.innerHTML = `<strong>Демо-режим.</strong><br>Заявка не отправлена, потому что SCRIPT_URL ещё не вставлен. Расчёт: ${formatMoney(payload.price)}.`;
    return;
  }

  postToAppsScript(payload);
  el.form.classList.add("hidden");
  el.success.classList.remove("hidden");
  el.success.innerHTML = `<strong>Заявка отправлена.</strong><br>ID заявки: ${payload.id}<br>Расчётная цена: ${formatMoney(payload.price)}. Мы свяжемся с вами для уточнения деталей.`;
}

function postToAppsScript(payload) {
  const iframeName = `hidden_iframe_${Date.now()}`;
  const iframe = document.createElement("iframe");
  iframe.name = iframeName;
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const form = document.createElement("form");
  form.method = "POST";
  form.action = SCRIPT_URL;
  form.target = iframeName;
  form.style.display = "none";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "payload";
  input.value = JSON.stringify(payload);
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();

  setTimeout(() => {
    form.remove();
    iframe.remove();
  }, 5000);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
