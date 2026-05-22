// ── Constants ────────────────────────────────────────────────────────────────
let WEEKLY_ALLOWANCE = 2500;
const STORAGE_KEY = 'sololife_v3';

const DEFAULT_BUDGET = {
  food: 1200, transport: 100, laundry: 520,
  cleaning: 250, medicine: 50, savings: 400, fun: 150
};

const CAT_META = {
  food:      { label: 'Food & Groceries', icon: '🛒', color: '#059669', barClass: 'green' },
  transport: { label: 'Transportation',   icon: '🚌', color: '#2563eb', barClass: 'blue'  },
  laundry:   { label: 'Laundry',          icon: '👕', color: '#7c3aed', barClass: 'purple'},
  cleaning:  { label: 'Cleaning / HH',    icon: '🧹', color: '#d97706', barClass: 'amber' },
  medicine:  { label: 'Medicine',         icon: '💊', color: '#dc2626', barClass: 'warn'  },
  savings:   { label: 'Savings',          icon: '🏦', color: '#0891b2', barClass: 'teal'  },
  fun:       { label: 'Buffer / Fun',     icon: '🎯', color: '#d97706', barClass: 'amber' },
  other:     { label: 'Other',            icon: '📌', color: '#6b7280', barClass: 'purple'},
};

const MEDICINE_ITEMS = [
  'Paracetamol','Loperamide','Cetirizine','Bioflu','Band-aids','Alcohol'
];

const GROCERY_LIST = [
  { name: 'Eggs (12 pcs)',    cost: 90,  protein: 72,  category: 'Protein'    },
  { name: 'Chicken (1kg)',    cost: 200, protein: 220, category: 'Protein'    },
  { name: 'Canned Tuna (×3)',cost: 90,  protein: 78,  category: 'Protein'    },
  { name: 'Tofu (2 blocks)',  cost: 50,  protein: 40,  category: 'Protein'    },
  { name: 'Rice (2kg)',       cost: 110, protein: 14,  category: 'Carbs'      },
  { name: 'Oats (500g)',      cost: 70,  protein: 30,  category: 'Carbs'      },
  { name: 'Monggo (500g)',    cost: 55,  protein: 60,  category: 'Legumes'    },
  { name: 'Bananas (bunch)',  cost: 60,  protein: 4,   category: 'Fruit'      },
  { name: 'Mixed Veggies',   cost: 80,  protein: 6,   category: 'Vegetables' },
  { name: 'Peanut Butter',   cost: 75,  protein: 28,  category: 'Fats'       },
];

const APARTMENT_TASKS = [
  { id: 'laundry',  label: 'Do Laundry',          icon: '👕', freq: 'Weekly'       },
  { id: 'sweep',    label: 'Sweep & Mop',           icon: '🧹', freq: 'Every 2 days' },
  { id: 'trash',    label: 'Take Out Trash',         icon: '🗑️', freq: 'Every 2 days' },
  { id: 'grocery',  label: 'Grocery Restock',        icon: '🛒', freq: 'Weekly'       },
  { id: 'medcheck', label: 'Check Medicine Stock',   icon: '💊', freq: 'Weekly'       },
  { id: 'dishes',   label: 'Wash Dishes',            icon: '🍽️', freq: 'Daily'        },
  { id: 'bathroom', label: 'Clean Bathroom',         icon: '🚿', freq: 'Weekly'       },
  { id: 'bills',    label: 'Check Due Bills',        icon: '📋', freq: 'Monthly'      },
  { id: 'windows',  label: 'Wipe Windows',           icon: '🪟', freq: 'Monthly'      },
];

const MILESTONES = [500, 1000, 2500, 5000, 10000, 25000];

const OB_STEPS = [
  { emoji: '🎯', title: 'Hey there, solo student', desc: 'This app is built just for you — living alone in Naga, managing your ₱2,500 weekly allowance like a pro.' },
  { emoji: '💸', title: 'Your budget is pre-loaded', desc: 'We\'ve set up realistic defaults based on your actual expenses: laundry, food, transport, savings, and more. You can edit everything.' },
  { emoji: '✨', title: 'Track. Save. Thrive.', desc: 'Log expenses in seconds. Watch your savings grow. Get smart reminders. Stay on top of apartment life.' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt   = n => '₱' + Math.round(n).toLocaleString('en-PH');
const pct   = (a, b) => b === 0 ? 0 : Math.min(100, Math.round((a / b) * 100));
const el    = id => document.getElementById(id);
const qs    = sel => document.querySelector(sel);
const today = () => new Date().toDateString();
const weekKey = () => {
  const d = new Date(), jan1 = new Date(d.getFullYear(), 0, 1);
  const wk = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${wk}`;
};

// ── State ────────────────────────────────────────────────────────────────────
let state;

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
  catch { return null; }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function initState() {
  const saved = loadState();
  if (saved) { state = saved; return; }
  state = {
    budget: { ...DEFAULT_BUDGET },
    expenses: [],
    savings_total: 0,
    savings_streak: 0,
    savings_log: [],
    medicine: MEDICINE_ITEMS.reduce((a, m) => ({ ...a, [m]: { qty: 3, low: 1 } }), {}),
    grocery_checked: [],
    custom_groceries: [],
    custom_tasks: [],
    tasks_done: {},
    onboarded: false,
    week: weekKey(),
    weekly_allowance: 2500,
  };
}

// ── Onboarding ───────────────────────────────────────────────────────────────
let obStep = 0;

function renderOnboarding() {
  const s = OB_STEPS[obStep];
  el('ob-emoji').textContent       = s.emoji;
  el('ob-step-title').textContent  = s.title;
  el('ob-step-desc').textContent   = s.desc;
  el('ob-next').textContent        = obStep < OB_STEPS.length - 1 ? 'Continue →' : 'Start Managing My Finances 🚀';
  el('ob-next').style.background   = obStep < OB_STEPS.length - 1 ? 'var(--purple)' : 'var(--green)';
  const dots = el('ob-dots').querySelectorAll('.dot');
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === obStep);
  });
}

el('ob-next').addEventListener('click', () => {
  if (obStep < OB_STEPS.length - 1) {
    obStep++;
    el('ob-card').style.animation = 'none';
    requestAnimationFrame(() => {
      el('ob-card').style.animation = 'slideUp 0.35s ease both';
      renderOnboarding();
    });
  } else {
    state.onboarded = true;
    saveState();
    el('onboarding').classList.add('hidden');
    el('app').classList.remove('hidden');
    renderAll();
  }
});

// ── Navigation ───────────────────────────────────────────────────────────────
let activeTab = 'dashboard';

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    el('tab-' + tab).classList.add('active');
    activeTab = tab;
    renderTab(tab);
  });
});

function renderTab(tab) {
  if (tab === 'dashboard') renderDashboard();
  else if (tab === 'expenses') renderExpenses();
  else if (tab === 'savings') renderSavings();
  else if (tab === 'grocery') renderGrocery();
  else if (tab === 'apartment') renderApartment();
  else if (tab === 'budget') renderBudget();
}

function renderAll() {
  renderDashboard();
  renderExpenses();
  renderSavings();
  renderGrocery();
  renderApartment();
  renderBudget();
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function renderDashboard() {
  const thisWeekExp = state.expenses.filter(e => e.week === weekKey());
  const spent = {};
  thisWeekExp.forEach(e => { spent[e.cat] = (spent[e.cat] || 0) + e.amount; });
  const totalSpent = thisWeekExp.reduce((a, e) => a + e.amount, 0);
  const remaining = WEEKLY_ALLOWANCE - totalSpent;
  const safeToSpend = remaining - (state.budget.savings || 0);
  const totalBudget = Object.values(state.budget).reduce((a, b) => a + b, 0);
  const score = Math.min(100, Math.round(
    (remaining / WEEKLY_ALLOWANCE) * 40 +
    (state.savings_streak > 0 ? Math.min(30, state.savings_streak * 5) : 0) +
    (totalSpent < totalBudget ? 30 : 0)
  ));
  const scoreLabel = score >= 70 ? 'Excellent' : score >= 40 ? 'Fair' : 'Needs Work';
  const scoreColor = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)';

  el('dash-date').textContent = 'Week of ' + new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  el('d-remaining').textContent = fmt(remaining);
  el('d-remaining').style.color = remaining >= 500 ? 'var(--green)' : 'var(--red)';
  el('d-spent').textContent     = fmt(totalSpent);
  el('d-safe').textContent      = fmt(Math.max(0, safeToSpend));
  el('d-safe').style.color      = safeToSpend > 0 ? 'var(--blue)' : 'var(--red)';
  el('d-score').innerHTML       = `<span style="color:${scoreColor}">${score}</span> <span class="score-label" style="color:${scoreColor}">${scoreLabel}</span>`;
  el('d-pct').textContent       = pct(totalSpent, WEEKLY_ALLOWANCE) + '%';

  const mainBar = el('d-main-bar');
  mainBar.style.width = pct(totalSpent, WEEKLY_ALLOWANCE) + '%';
  mainBar.className = 'progress-bar ' + (pct(totalSpent, WEEKLY_ALLOWANCE) > 80 ? 'warn' : 'purple');

  const overflowEl = el('d-overflow');
  if (totalBudget > WEEKLY_ALLOWANCE) {
    overflowEl.textContent = `⚠️ Budget allocations exceed ₱2,500 by ${fmt(totalBudget - WEEKLY_ALLOWANCE)}`;
    overflowEl.classList.remove('hidden');
  } else overflowEl.classList.add('hidden');

  // Categories
  const catContainer = el('d-categories');
  catContainer.innerHTML = Object.entries(CAT_META).map(([key, meta]) => {
    const spentAmt  = spent[key] || 0;
    const budgetAmt = state.budget[key] || 0;
    const p = pct(spentAmt, budgetAmt);
    const barClass = p > 80 ? 'warn' : meta.barClass;
    return `
      <div class="cat-row">
        <div class="cat-row-header">
          <span class="cat-name">${meta.icon} ${meta.label}</span>
          <span class="cat-amts">${fmt(spentAmt)} / ${fmt(budgetAmt)}</span>
        </div>
        <div class="progress-track thin"><div class="progress-bar ${barClass}" style="width:${p}%"></div></div>
      </div>`;
  }).join('');

  // Savings
  el('d-savings-total').textContent = fmt(state.savings_total);
  el('d-savings-proj').textContent  = `≈ ${fmt(state.savings_total * 4)}/mo · ${fmt(state.savings_total * 52)}/yr`;
  el('d-streak').textContent = state.savings_streak;

  // Insights
  const insights = buildInsights(state, spent, totalSpent);
  el('d-insights').innerHTML = insights.map(i =>
    `<div class="insight-card ${i.type}"><span class="insight-icon">${i.icon}</span><span>${i.msg}</span></div>`
  ).join('');
}

function buildInsights(state, spent, totalSpent) {
  const arr = [];
  const laundryPct = pct(state.budget.laundry, WEEKLY_ALLOWANCE);
  if (laundryPct >= 20) arr.push({ icon: '👕', msg: `Laundry uses ${laundryPct}% of your allowance. Try batching washes to save.`, type: 'warn' });
  if (state.savings_streak >= 3) arr.push({ icon: '🏆', msg: `${state.savings_streak}-week saving streak! You're building real financial discipline.`, type: 'good' });
  if ((spent.fun || 0) > state.budget.fun) arr.push({ icon: '🎯', msg: 'You\'ve gone over your fun/buffer budget. Redirect the rest to savings.', type: 'warn' });
  if (totalSpent < WEEKLY_ALLOWANCE * 0.5 && new Date().getDay() >= 4) arr.push({ icon: '✅', msg: 'You\'re spending well within budget this week. Solid discipline!', type: 'good' });
  if (state.savings_total >= 1000) arr.push({ icon: '💎', msg: `You've saved ${fmt(state.savings_total)} so far. At this pace, you'll have ${fmt(state.savings_total * 52)} in a year.`, type: 'good' });
  const lowMeds = Object.entries(state.medicine).filter(([, d]) => d.qty <= d.low);
  if (lowMeds.length) arr.push({ icon: '💊', msg: `Low medicine stock: ${lowMeds.map(([m]) => m).join(', ')}. Restock soon!`, type: 'warn' });
  if (arr.length === 0) arr.push({ icon: '📊', msg: 'Keep logging your expenses to unlock personalized insights!', type: 'info' });
  return arr;
}

// ── Expenses ─────────────────────────────────────────────────────────────────
function renderExpenses() {
  const todayStr   = today();
  const thisWeekExp = state.expenses.filter(e => e.week === weekKey());
  const todayAmt   = thisWeekExp.filter(e => new Date(e.date).toDateString() === todayStr).reduce((a,e) => a+e.amount, 0);
  const weekAmt    = thisWeekExp.reduce((a,e) => a+e.amount, 0);

  el('e-today').textContent = fmt(todayAmt);
  el('e-week').textContent  = fmt(weekAmt);

  const listEl = el('e-list');
  if (!thisWeekExp.length) {
    listEl.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div><p>No expenses yet. Log your first one above!</p></div>`;
    return;
  }
  listEl.innerHTML = [...thisWeekExp].reverse().map(e => {
    const meta = CAT_META[e.cat] || CAT_META.food;
    const timeStr = new Date(e.date).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <div class="expense-item">
        <div class="expense-icon" style="background:${meta.color}18">${meta.icon}</div>
        <div class="expense-info">
          <div class="expense-cat">${meta.label}</div>
          ${e.note ? `<div class="expense-note">${e.note}</div>` : ''}
          <div class="expense-time">${timeStr}</div>
        </div>
        <div class="expense-right">
          <span class="expense-amt" style="color:${meta.color}">-${fmt(e.amount)}</span>
          <button class="btn-del" onclick="deleteExpense(${e.id})">×</button>
        </div>
      </div>`;
  }).join('');
}

el('e-add-btn').addEventListener('click', addExpense);
el('e-amount').addEventListener('keydown', e => { if (e.key === 'Enter') addExpense(); });

function addExpense() {
  const amt = parseFloat(el('e-amount').value);
  if (!amt || amt <= 0) { el('e-amount').focus(); return; }
  const expense = {
    id: Date.now(), amount: amt,
    cat: el('e-cat').value,
    note: el('e-note').value.trim(),
    date: new Date().toISOString(), week: weekKey()
  };
  state.expenses.push(expense);
  saveState();
  el('e-amount').value = '';
  el('e-note').value   = '';
  const btn = el('e-add-btn');
  btn.textContent = '✓ Added!';
  btn.classList.add('success');
  setTimeout(() => { btn.textContent = 'Add Expense'; btn.classList.remove('success'); }, 1500);
  renderExpenses();
  if (activeTab === 'dashboard') renderDashboard();
}

function deleteExpense(id) {
  state.expenses = state.expenses.filter(e => e.id !== id);
  saveState();
  renderExpenses();
  renderDashboard();
}
window.deleteExpense = deleteExpense;

// ── Savings ───────────────────────────────────────────────────────────────────
function renderSavings() {
  el('s-total').textContent   = fmt(state.savings_total);
  el('s-monthly').textContent = fmt(state.savings_total * 4);
  el('s-yearly').textContent  = fmt(state.savings_total * 52);
  el('s-streak').textContent  = '🔥 ' + state.savings_streak + 'w';

  // Milestone
  const next = MILESTONES.find(m => m > state.savings_total) || MILESTONES[MILESTONES.length - 1];
  const prev = MILESTONES.filter(m => m <= state.savings_total).pop() || 0;
  el('s-milestone-label').textContent = 'Next Milestone: ' + fmt(next);
  el('s-milestone-pct').textContent   = pct(state.savings_total - prev, next - prev) + '%';
  el('s-milestone-bar').style.width   = pct(state.savings_total - prev, next - prev) + '%';

  el('s-milestones').innerHTML = MILESTONES.map(m => {
    const done = state.savings_total >= m;
    return `<div class="milestone-pill ${done ? 'done' : ''}">${done ? '✓ ' : ''}${fmt(m)}</div>`;
  }).join('');

  // Log
  const logEl = el('s-log');
  if (!state.savings_log.length) {
    logEl.innerHTML = `<div class="empty-state"><div class="empty-icon">💰</div><p>Start saving to see your history here!</p></div>`;
    return;
  }
  logEl.innerHTML = [...state.savings_log].reverse().slice(0, 10).map(s => `
    <div class="savings-log-item">
      <div>
        <div class="savings-log-title">💰 Savings Added</div>
        <div class="savings-log-date">${new Date(s.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
      </div>
      <div class="savings-log-right">
        <span class="savings-log-amt">+${fmt(s.amount)}</span>
        <button class="btn-del" onclick="deleteSavingsEntry(${s.id || 0})" title="Cancel this entry">×</button>
      </div>
    </div>`).join('');
}

el('s-add-btn').addEventListener('click', addSavings);
el('s-amount').addEventListener('keydown', e => { if (e.key === 'Enter') addSavings(); });

document.querySelectorAll('.btn-quick').forEach(btn => {
  btn.addEventListener('click', () => {
    el('s-amount').value = btn.dataset.amt;
    el('s-amount').focus();
  });
});

function addSavings() {
  const amt = parseFloat(el('s-amount').value);
  if (!amt || amt <= 0) return;
  state.savings_total  += amt;
  state.savings_streak += 1;
  state.savings_log.push({ id: Date.now(), amount: amt, date: new Date().toISOString() });
  saveState();
  el('s-amount').value = '';
  renderSavings();
  renderDashboard();
}

function deleteSavingsEntry(id) {
  const entry = state.savings_log.find(s => s.id === id);
  if (!entry) return;
  if (!confirm(`Cancel savings entry of ${fmt(entry.amount)}?`)) return;
  state.savings_total  = Math.max(0, state.savings_total - entry.amount);
  state.savings_streak = Math.max(0, state.savings_streak - 1);
  state.savings_log    = state.savings_log.filter(s => s.id !== id);
  saveState();
  renderSavings();
  renderDashboard();
}
window.deleteSavingsEntry = deleteSavingsEntry;

// ── Grocery ───────────────────────────────────────────────────────────────────
function renderGrocery() {
  const customItems = state.custom_groceries || [];
  const allItems    = [...GROCERY_LIST, ...customItems];
  const checked     = state.grocery_checked;
  const checkedItems = allItems.filter(g => checked.includes(g.name));
  const totalCost    = checkedItems.reduce((a, g) => a + g.cost, 0);
  const totalProtein = checkedItems.reduce((a, g) => a + g.protein, 0);

  el('g-cost').textContent     = fmt(totalCost);
  el('g-cost-sub').textContent = `of ${fmt(state.budget.food)} budget`;
  el('g-protein').textContent  = totalProtein + 'g';

  const budgetCard = el('g-budget-card');
  if (totalCost > 0) {
    budgetCard.classList.remove('hidden');
    el('g-budget-pct').textContent = pct(totalCost, state.budget.food) + '%';
    el('g-budget-bar').style.width = pct(totalCost, state.budget.food) + '%';
    const cls = pct(totalCost, state.budget.food) > 80 ? 'warn' : 'green';
    el('g-budget-bar').className = 'progress-bar ' + cls;
  } else budgetCard.classList.add('hidden');

  // Group built-in items
  const groups = {};
  GROCERY_LIST.forEach(g => { if (!groups[g.category]) groups[g.category] = []; groups[g.category].push(g); });

  let html = Object.entries(groups).map(([cat, items]) => `
    <p class="grocery-cat-label">${cat}</p>
    ${items.map(item => renderGroceryItem(item, false)).join('')}
  `).join('');

  // Custom items
  if (customItems.length) {
    html += `<p class="grocery-cat-label">My Custom Items</p>`;
    html += customItems.map(item => renderGroceryItem(item, true)).join('');
  }

  el('g-list').innerHTML = html;
}

function renderGroceryItem(item, isCustom) {
  const isChecked = state.grocery_checked.includes(item.name);
  const safeName  = item.name.replace(/'/g, "\\'");
  const deleteBtn = isCustom ? `<button class="btn-del" onclick="deleteCustomGrocery('${safeName}')" title="Remove">×</button>` : '';
  return `
    <div class="grocery-item ${isChecked ? 'checked' : ''}" onclick="toggleGrocery('${safeName}')">
      <div class="grocery-checkbox">${isChecked ? '✓' : ''}</div>
      <div style="flex:1;margin-left:10px">
        <div class="grocery-name">${item.name}</div>
        <div class="grocery-protein">${item.protein}g protein${item.qty && item.qty > 1 ? ' · qty ' + item.qty : ''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div class="grocery-cost">${fmt(item.cost)}</div>
        ${deleteBtn}
      </div>
    </div>`;
}

el('g-add-btn').addEventListener('click', () => {
  const name    = el('g-custom-name').value.trim();
  const cost    = parseFloat(el('g-custom-cost').value) || 0;
  const protein = parseFloat(el('g-custom-protein').value) || 0;
  const qty     = parseInt(el('g-custom-qty').value) || 1;
  if (!name) { el('g-custom-name').focus(); return; }
  if (!state.custom_groceries) state.custom_groceries = [];
  state.custom_groceries.push({ name, cost, protein, qty, category: 'Custom' });
  saveState();
  el('g-custom-name').value = el('g-custom-cost').value = el('g-custom-protein').value = el('g-custom-qty').value = '';
  renderGrocery();
});

function deleteCustomGrocery(name) {
  state.custom_groceries = (state.custom_groceries || []).filter(g => g.name !== name);
  state.grocery_checked  = state.grocery_checked.filter(n => n !== name);
  saveState();
  renderGrocery();
}
window.deleteCustomGrocery = deleteCustomGrocery;

// ── Apartment ─────────────────────────────────────────────────────────────────
function renderApartment() {
  const todayStr = today();

  // Medicine
  el('med-list').innerHTML = Object.entries(state.medicine).map(([med, data]) => {
    const isLow   = data.qty <= data.low;
    const isCustom = data.custom;
    const safeMed  = med.replace(/'/g, "\\'");
    return `
      <div class="med-item">
        <div>
          <div class="med-name ${isLow ? 'low' : ''}">${isLow ? '⚠️ ' : ''}${med}</div>
          ${isLow ? `<div class="med-warn">Low stock — restock soon!</div>` : ''}
        </div>
        <div class="med-controls">
          <button class="btn-med" onclick="changeMed('${safeMed}', -1)">−</button>
          <span class="med-qty ${isLow ? 'low' : ''}">${data.qty}</span>
          <button class="btn-med plus" onclick="changeMed('${safeMed}', 1)">+</button>
          ${isCustom ? `<button class="btn-del" onclick="deleteMedicine('${safeMed}')" title="Remove">×</button>` : ''}
        </div>
      </div>`;
  }).join('');

  // Tasks — combine default + custom
  const customTasks = state.custom_tasks || [];
  const allTasks    = [
    ...APARTMENT_TASKS,
    ...customTasks.map(t => ({ ...t, isCustom: true }))
  ];

  el('task-list').innerHTML = allTasks.map(task => {
    const doneKey = `${todayStr}_${task.id}`;
    const isDone  = !!state.tasks_done[doneKey];
    const delBtn  = task.isCustom
      ? `<button class="btn-del" onclick="deleteCustomTask('${task.id}')" title="Remove task" style="margin-left:6px">×</button>`
      : '';
    return `
      <div class="task-item ${isDone ? 'done' : ''}" onclick="toggleTask('${doneKey}')">
        <span class="task-icon">${task.icon || '📌'}</span>
        <div class="task-info">
          <div class="task-name">${task.label}</div>
          <div class="task-freq">${task.freq}</div>
        </div>
        <div style="display:flex;align-items:center">
          <div class="task-check">${isDone ? '✓' : ''}</div>
          ${delBtn}
        </div>
      </div>`;
  }).join('');
}

function changeMed(med, delta) {
  const cur = state.medicine[med]?.qty || 0;
  state.medicine[med].qty = Math.max(0, cur + delta);
  saveState();
  renderApartment();
  renderDashboard();
}
window.changeMed = changeMed;

function deleteMedicine(med) {
  if (!confirm(`Remove "${med}" from medicine cabinet?`)) return;
  delete state.medicine[med];
  saveState();
  renderApartment();
}
window.deleteMedicine = deleteMedicine;

el('med-add-btn').addEventListener('click', addMedicine);
el('med-new-name').addEventListener('keydown', e => { if (e.key === 'Enter') addMedicine(); });

function addMedicine() {
  const name = el('med-new-name').value.trim();
  if (!name || state.medicine[name]) { el('med-new-name').focus(); return; }
  state.medicine[name] = { qty: 3, low: 1, custom: true };
  saveState();
  el('med-new-name').value = '';
  renderApartment();
}

function toggleTask(key) {
  state.tasks_done[key] = !state.tasks_done[key];
  saveState();
  renderApartment();
}
window.toggleTask = toggleTask;

el('task-add-btn').addEventListener('click', addCustomTask);
el('task-new-label').addEventListener('keydown', e => { if (e.key === 'Enter') addCustomTask(); });

function addCustomTask() {
  const label = el('task-new-label').value.trim();
  if (!label) { el('task-new-label').focus(); return; }
  const freq  = el('task-new-freq').value;
  if (!state.custom_tasks) state.custom_tasks = [];
  state.custom_tasks.push({ id: 'custom_' + Date.now(), label, icon: '📌', freq, isCustom: true });
  saveState();
  el('task-new-label').value = '';
  renderApartment();
}

function deleteCustomTask(id) {
  state.custom_tasks = (state.custom_tasks || []).filter(t => t.id !== id);
  saveState();
  renderApartment();
}
window.deleteCustomTask = deleteCustomTask;

// ── Budget Settings ───────────────────────────────────────────────────────────
let localBudget = { ...DEFAULT_BUDGET };

function renderBudget() {
  localBudget = { ...state.budget };
  updateBudgetTotals();

  el('b-sliders').innerHTML = Object.entries(CAT_META).map(([key, meta]) => `
    <div class="budget-slider-card">
      <div class="bsc-header">
        <span class="bsc-name">${meta.icon} ${meta.label}</span>
        <div class="bsc-input-wrap">
          <span class="bsc-peso">₱</span>
          <input type="number" class="input-budget" id="bgt-${key}"
            value="${localBudget[key]}"
            oninput="onBudgetInput('${key}', this.value)" />
        </div>
      </div>
      <input type="range" min="0" max="1500" step="10"
        value="${localBudget[key]}" id="bgt-range-${key}"
        oninput="onBudgetRange('${key}', this.value)"
        style="accent-color:${meta.color}" />
    </div>`).join('');
}

function onBudgetInput(key, val) {
  localBudget[key] = Number(val) || 0;
  const rangeEl = el('bgt-range-' + key);
  if (rangeEl) rangeEl.value = localBudget[key];
  updateBudgetTotals();
}
window.onBudgetInput = onBudgetInput;

function onBudgetRange(key, val) {
  localBudget[key] = Number(val);
  const inputEl = el('bgt-' + key);
  if (inputEl) inputEl.value = localBudget[key];
  updateBudgetTotals();
}
window.onBudgetRange = onBudgetRange;

function updateBudgetTotals() {
  const total    = Object.values(localBudget).reduce((a, b) => a + Number(b), 0);
  const overflow = total > WEEKLY_ALLOWANCE;
  el('b-total-disp').textContent  = `${fmt(total)} / ${fmt(WEEKLY_ALLOWANCE)}`;
  el('b-total-disp').style.color  = overflow ? 'var(--red)' : 'var(--green)';
  el('b-overflow').classList.toggle('hidden', !overflow);
  el('b-ok').classList.toggle('hidden', overflow);
  if (!overflow) el('b-remaining-alloc').textContent = fmt(WEEKLY_ALLOWANCE - total);
}

el('b-save-btn').addEventListener('click', () => {
  state.budget = { ...localBudget };
  saveState();
  const btn = el('b-save-btn');
  btn.textContent = '✓ Budget Saved!';
  btn.classList.add('success');
  setTimeout(() => { btn.textContent = 'Save Budget'; btn.classList.remove('success'); }, 1800);
  renderDashboard();
});

el('b-reset-btn').addEventListener('click', () => {
  if (!confirm('Are you sure you want to reset ALL data? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
});

// ── Init ──────────────────────────────────────────────────────────────────────
initState();

// Sync dynamic allowance from saved state
if (state.weekly_allowance) WEEKLY_ALLOWANCE = state.weekly_allowance;
if (!state.custom_groceries) state.custom_groceries = [];
if (!state.custom_tasks)     state.custom_tasks = [];

// ── Allowance Editor ──────────────────────────────────────────────────────────
function updateAllowanceDisplay() {
  el('allowance-display').textContent = fmt(WEEKLY_ALLOWANCE);
}

el('allowance-edit-btn').addEventListener('click', () => {
  el('allowance-display-wrap').classList.add('hidden');
  el('allowance-input-wrap').classList.remove('hidden');
  el('allowance-input').value = WEEKLY_ALLOWANCE;
  el('allowance-input').focus();
});

function saveAllowance() {
  const v = parseFloat(el('allowance-input').value);
  if (v && v > 0) {
    WEEKLY_ALLOWANCE = v;
    state.weekly_allowance = v;
    saveState();
    updateAllowanceDisplay();
    renderDashboard();
    renderBudget();
  }
  el('allowance-display-wrap').classList.remove('hidden');
  el('allowance-input-wrap').classList.add('hidden');
}

el('allowance-save-btn').addEventListener('click', saveAllowance);
el('allowance-cancel-btn').addEventListener('click', () => {
  el('allowance-display-wrap').classList.remove('hidden');
  el('allowance-input-wrap').classList.add('hidden');
});
el('allowance-input').addEventListener('keydown', e => { if (e.key === 'Enter') saveAllowance(); });

if (!state.onboarded) {
  el('onboarding').classList.remove('hidden');
  renderOnboarding();
  updateAllowanceDisplay();
} else {
  el('app').classList.remove('hidden');
  updateAllowanceDisplay();
  renderAll();
}
