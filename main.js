const STORAGE_KEY = "financial-app-state-v1";

const monthKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const parseMonth = (key) => new Date(`${key}-01T00:00:00`);

const addMonths = (key, count) => {
  const d = parseMonth(key);
  d.setMonth(d.getMonth() + count);
  return monthKey(d);
};

const defaultState = () => ({
  mode: "b2b",
  uopNet: 8000,
  b2b: {
    zus: 1300,
    taxRate: 12,
    hourlyRate: 120,
    invoices: [
      { id: crypto.randomUUID(), label: "Faktura startowa", amount: 20000, month: monthKey() },
    ],
    hourlyEntries: [
      { id: crypto.randomUUID(), month: monthKey(), hours: 160 },
    ],
  },
  expenses: {
    recurring: [
      { id: crypto.randomUUID(), name: "Leasing auta", amount: 1500, startMonth: monthKey(), endMonth: addMonths(monthKey(), 18) },
      { id: crypto.randomUUID(), name: "Internet + tel", amount: 180, startMonth: monthKey(), endMonth: addMonths(monthKey(), 24) },
    ],
    oneTime: [
      { id: crypto.randomUUID(), name: "Laptop", amount: 4000, month: monthKey() },
    ],
  },
});

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatCurrency(value) {
  return `${value.toLocaleString("pl-PL", { maximumFractionDigits: 0 })} zł`;
}

function renderMode() {
  document.getElementById("modeUop").checked = state.mode === "uop";
  document.getElementById("modeB2b").checked = state.mode === "b2b";
  document.getElementById("uopNet").value = state.uopNet ?? "";
  document.getElementById("b2bZus").value = state.b2b.zus ?? "";
  document.getElementById("b2bTax").value = state.b2b.taxRate ?? "";
  document.getElementById("b2bHourlyRate").value = state.b2b.hourlyRate ?? "";
}

function renderEntries() {
  const hoursByMonth = state.b2b.hourlyEntries;
  const invoices = state.b2b.invoices;
  const recurring = state.expenses.recurring;
  const oneTime = state.expenses.oneTime;

  const b2bEntries = document.getElementById("b2bEntries");
  b2bEntries.innerHTML = [
    ...hoursByMonth.map((h) => `
      <div class="entry-chip">
        <div>
          <strong>${h.hours} h</strong> • ${h.month}
          <div class="entry-meta">Godziny do stawki ${formatCurrency(state.b2b.hourlyRate)}</div>
        </div>
        <button type="button" data-remove-hour="${h.id}">Usuń</button>
      </div>
    `),
    ...invoices.map((f) => `
      <div class="entry-chip">
        <div>
          <strong>${f.label || "Faktura"}</strong> • ${f.month}
          <div class="entry-meta">${formatCurrency(f.amount)}</div>
        </div>
        <button type="button" data-remove-invoice="${f.id}">Usuń</button>
      </div>
    `),
  ].join("") || "<p class=\"hint\">Brak danych B2B</p>";

  const recurringList = document.getElementById("recurringList");
  recurringList.innerHTML = recurring.map((r) => `
    <div class="entry-chip">
      <div>
        <strong>${r.name}</strong> • ${formatCurrency(r.amount)}
        <div class="entry-meta">${r.startMonth} → ${r.endMonth}</div>
      </div>
      <button type="button" data-remove-recurring="${r.id}">Usuń</button>
    </div>
  `).join("") || "<p class=\"hint\">Nie dodano stałych wydatków</p>";

  const oneTimeList = document.getElementById("oneTimeList");
  oneTimeList.innerHTML = oneTime.map((o) => `
    <div class="entry-chip">
      <div>
        <strong>${o.name}</strong> • ${o.month}
        <div class="entry-meta">${formatCurrency(o.amount)}</div>
      </div>
      <button type="button" data-remove-onetime="${o.id}">Usuń</button>
    </div>
  `).join("") || "<p class=\"hint\">Nie dodano jednorazowych wydatków</p>";
}

function findMonthBounds() {
  const months = [];
  const pushMonth = (m) => m && months.push(m);
  pushMonth(monthKey());
  state.b2b.invoices.forEach((i) => pushMonth(i.month));
  state.b2b.hourlyEntries.forEach((i) => pushMonth(i.month));
  state.expenses.recurring.forEach((r) => {
    pushMonth(r.startMonth);
    pushMonth(r.endMonth);
  });
  state.expenses.oneTime.forEach((o) => pushMonth(o.month));

  let min = months.reduce((acc, m) => (parseMonth(m) < parseMonth(acc) ? m : acc), monthKey());
  let max = months.reduce((acc, m) => (parseMonth(m) > parseMonth(acc) ? m : acc), monthKey());
  max = addMonths(max, 2);
  return { min, max };
}

function monthRange(min, max) {
  const result = [];
  let cursor = min;
  while (parseMonth(cursor) <= parseMonth(max)) {
    result.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return result;
}

function incomeForMonth(month) {
  if (state.mode === "uop") return Number(state.uopNet) || 0;
  const invoices = state.b2b.invoices.filter((i) => i.month === month).reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const hoursEntry = state.b2b.hourlyEntries.find((h) => h.month === month);
  const hours = hoursEntry ? Number(hoursEntry.hours) : 0;
  const hourlyIncome = hours * (Number(state.b2b.hourlyRate) || 0);
  const revenue = invoices + hourlyIncome;
  const tax = revenue * (Number(state.b2b.taxRate) || 0) / 100;
  const net = revenue - tax - (Number(state.b2b.zus) || 0);
  return Math.max(0, Math.round(net));
}

function expensesForMonth(month) {
  const recurring = state.expenses.recurring
    .filter((r) => parseMonth(r.startMonth) <= parseMonth(month) && parseMonth(month) <= parseMonth(r.endMonth))
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const oneTime = state.expenses.oneTime
    .filter((o) => o.month === month)
    .reduce((sum, o) => sum + Number(o.amount || 0), 0);
  return { recurring, oneTime, total: recurring + oneTime };
}

function computeTimeline() {
  const { min, max } = findMonthBounds();
  const months = monthRange(min, max);
  let carry = 0;
  return months.map((m) => {
    const income = incomeForMonth(m);
    const expense = expensesForMonth(m);
    const balance = income + carry - expense.total;
    const row = {
      month: m,
      income,
      expenses: expense.total,
      carryIn: carry,
      carryOut: balance,
      recurring: expense.recurring,
      oneTime: expense.oneTime,
    };
    carry = balance;
    return row;
  });
}

function renderSummary() {
  const timeline = computeTimeline();
  const summaryTable = document.getElementById("summaryTable");
  summaryTable.innerHTML = timeline.map((row) => `
    <tr>
      <td>${row.month}</td>
      <td class="amount positive">${formatCurrency(row.income)}</td>
      <td class="amount negative">${formatCurrency(row.expenses)}</td>
      <td class="amount ${row.carryOut >= 0 ? "positive" : "negative"}">${formatCurrency(row.carryOut)}</td>
    </tr>
  `).join("");

  const current = timeline.find((r) => r.month === monthKey()) || timeline[0];
  const summaryHeader = document.getElementById("summaryHeader");
  summaryHeader.innerHTML = `
    <div class="badge">Aktualny miesiąc: <strong>${current.month}</strong></div>
    <div class="badge">Do wydania: <strong>${formatCurrency(Math.max(0, current.income + current.carryIn))}</strong></div>
    <div class="badge">Przenoszone dalej: <strong>${formatCurrency(current.carryOut)}</strong></div>
  `;
}

function renderAll() {
  renderMode();
  renderEntries();
  renderSummary();
  saveState();
}

function handleModeChange(e) {
  state.mode = e.target.value;
  renderAll();
}

function setupInputs() {
  document.getElementById("modeUop").addEventListener("change", handleModeChange);
  document.getElementById("modeB2b").addEventListener("change", handleModeChange);

  document.getElementById("uopNet").addEventListener("input", (e) => {
    state.uopNet = Number(e.target.value) || 0;
    renderAll();
  });
  document.getElementById("b2bZus").addEventListener("input", (e) => {
    state.b2b.zus = Number(e.target.value) || 0;
    renderAll();
  });
  document.getElementById("b2bTax").addEventListener("input", (e) => {
    state.b2b.taxRate = Number(e.target.value) || 0;
    renderAll();
  });
  document.getElementById("b2bHourlyRate").addEventListener("input", (e) => {
    state.b2b.hourlyRate = Number(e.target.value) || 0;
    renderAll();
  });

  document.getElementById("addHoursForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const hours = Number(form.hours.value);
    const month = form.month.value;
    if (!month) return;
    state.b2b.hourlyEntries.push({ id: crypto.randomUUID(), month, hours });
    form.reset();
    renderAll();
  });

  document.getElementById("addInvoiceForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const amount = Number(form.amount.value);
    const label = form.label.value.trim();
    const month = form.month.value;
    if (!month) return;
    state.b2b.invoices.push({ id: crypto.randomUUID(), amount, label, month });
    form.reset();
    renderAll();
  });

  document.getElementById("addRecurringForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const amount = Number(form.amount.value);
    const startMonth = form.startMonth.value;
    const endMonth = form.endMonth.value;
    if (!startMonth || !endMonth) return;
    state.expenses.recurring.push({ id: crypto.randomUUID(), name, amount, startMonth, endMonth });
    form.reset();
    renderAll();
  });

  document.getElementById("addOneTimeForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const amount = Number(form.amount.value);
    const month = form.month.value;
    if (!month) return;
    state.expenses.oneTime.push({ id: crypto.randomUUID(), name, amount, month });
    form.reset();
    renderAll();
  });

  document.body.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const invoiceId = target.dataset.removeInvoice;
    const hourId = target.dataset.removeHour;
    const recId = target.dataset.removeRecurring;
    const oneId = target.dataset.removeOnetime;
    if (invoiceId) {
      state.b2b.invoices = state.b2b.invoices.filter((i) => i.id !== invoiceId);
      renderAll();
    }
    if (hourId) {
      state.b2b.hourlyEntries = state.b2b.hourlyEntries.filter((i) => i.id !== hourId);
      renderAll();
    }
    if (recId) {
      state.expenses.recurring = state.expenses.recurring.filter((r) => r.id !== recId);
      renderAll();
    }
    if (oneId) {
      state.expenses.oneTime = state.expenses.oneTime.filter((o) => o.id !== oneId);
      renderAll();
    }
  });

  document.getElementById("resetStateBtn").addEventListener("click", () => {
    state = defaultState();
    renderAll();
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
}

function init() {
  setupInputs();
  renderAll();
  registerServiceWorker();
}

document.addEventListener("DOMContentLoaded", init);
