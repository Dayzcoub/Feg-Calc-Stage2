let lastResult = null;

// DOM
const clientNameInput = document.getElementById("clientName");
const clientSelect = document.getElementById("clientSelect");
const projectNameInput = document.getElementById("projectName");
const widthInput = document.getElementById("width");
const depthInput = document.getElementById("depth");
const priceModuleInput = document.getElementById("priceModule");
const installInput = document.getElementById("install");
const resultDiv = document.getElementById("result");
const ordersDiv = document.getElementById("orders");
const pdfDataDiv = document.getElementById("pdfData");

const installBtn = document.getElementById("installBtn");
const addClientBtn = document.getElementById("addClientBtn");
const calcBtn = document.getElementById("calcBtn");
const saveOrderBtn = document.getElementById("saveOrderBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/[&<>]/g, (m) => (m === "&" ? "&amp;" : m === "<" ? "&lt;" : "&gt;"))
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, (c) => c);
}

// Clients
function addClient() {
  const name = clientNameInput.value.trim();
  if (!name) return alert("Введите имя клиента");

  const clients = JSON.parse(localStorage.getItem("clients") || "[]");
  if (clients.includes(name)) return alert("Такой клиент уже есть в списке");

  clients.push(name);
  localStorage.setItem("clients", JSON.stringify(clients));
  renderClients();
  clientNameInput.value = "";
  clientSelect.value = name;
}

function renderClients() {
  const clients = JSON.parse(localStorage.getItem("clients") || "[]");
  clientSelect.innerHTML = '<option value="">— Выберите клиента —</option>';
  clients.forEach((c) => {
    clientSelect.innerHTML += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
  });
  if (!clients.length) {
    clientSelect.innerHTML = '<option value="">Нет клиентов, добавьте</option>';
  }
}

// Calc
function calc() {
  const w = parseInt(widthInput.value, 10);
  const d = parseInt(depthInput.value, 10);
  const price = parseFloat(priceModuleInput.value);
  let installCost = parseFloat(installInput.value);

  if (isNaN(w) || isNaN(d) || w <= 0 || d <= 0) {
    return alert("Укажите корректные ширину и глубину (целые числа > 0)");
  }
  if (isNaN(price) || price < 0) {
    return alert("Укажите корректную цену за модуль");
  }
  if (isNaN(installCost) || installCost < 0) installCost = 0;

  const modules = w * d;
  const sheets = modules;
  const columns = (w + 1) * (d + 1);
  const frames = w * (d + 1) + d * (w + 1);
  const modulesCost = modules * price;
  const total = modulesCost + installCost;

  lastResult = { w, d, modules, sheets, columns, frames, modulesCost, installCost, total, priceModule: price };

  resultDiv.innerHTML = `
    <div class="result-grid">
      <div>Габариты (модули)</div><div>${w} × ${d} (${modules} модулей)</div>
      <div>Листы настила</div><div>${sheets} шт</div>
      <div>Столбы-опоры</div><div>${columns} шт</div>
      <div>Перекладины (рамы)</div><div>${frames} шт</div>
      <div>Стоимость модулей</div><div>${modulesCost.toLocaleString()} ₽</div>
      <div>Монтаж</div><div>${installCost.toLocaleString()} ₽</div>
      <div><b>ИТОГО</b></div><div><b>${total.toLocaleString()} ₽</b></div>
    </div>
  `;

  updatePdfContent();
}

function updatePdfContent() {
  if (!lastResult) {
    pdfDataDiv.innerHTML = '<p>Нет расчёта. Нажмите "Рассчитать смету".</p>';
    return;
  }

  const clientName = clientSelect.value || "Клиент не выбран";
  const project = projectNameInput.value.trim() || "Без названия";
  const { w, d, modules, sheets, columns, frames, modulesCost, installCost, total, priceModule } = lastResult;

  pdfDataDiv.innerHTML = `
    <div style="font-size:16px;margin-bottom:20px;">
      <div><strong>Клиент:</strong> ${escapeHtml(clientName)}</div>
      <div><strong>Проект / Мероприятие:</strong> ${escapeHtml(project)}</div>
      <div><strong>Дата:</strong> ${new Date().toLocaleDateString()}</div>
    </div>
    <div style="background:#f9f9fb;padding:16px;border-radius:20px;margin:12px 0;">
      <h3 style="margin:0 0 10px 0;">Детали конструкции</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:6px 0">Размер сцены:</td><td style="text-align:right"><b>${w} x ${d} модулей</b></td></tr>
        <tr><td style="padding:6px 0">Общее количество модулей:</td><td style="text-align:right">${modules} шт</td></tr>
        <tr><td style="padding:6px 0">Листы настила:</td><td style="text-align:right">${sheets} шт</td></tr>
        <tr><td style="padding:6px 0">Столбы (опоры):</td><td style="text-align:right">${columns} шт</td></tr>
        <tr><td style="padding:6px 0">Перекладины:</td><td style="text-align:right">${frames} шт</td></tr>
      </table>
    </div>
    <div style="background:#eef2ff;padding:18px;border-radius:20px;">
      <div style="display:flex;justify-content:space-between;"><span>Цена за модуль:</span><span>${priceModule} ₽</span></div>
      <div style="display:flex;justify-content:space-between;margin:8px 0;"><span>Стоимость модулей:</span><span>${modulesCost.toLocaleString()} ₽</span></div>
      <div style="display:flex;justify-content:space-between;"><span>Работы по монтажу:</span><span>${installCost.toLocaleString()} ₽</span></div>
      <hr style="margin:12px 0;border-top:2px dashed #3b82f6;">
      <div style="display:flex;justify-content:space-between;font-weight:800;font-size:1.3rem;"><span>ИТОГО К ОПЛАТЕ:</span><span>${total.toLocaleString()} ₽</span></div>
    </div>
  `;
}

// Orders
function saveOrder() {
  if (!lastResult) return alert("Сначала выполните расчёт.");
  const client = clientSelect.value;
  if (!client) return alert("Выберите или добавьте клиента перед сохранением.");

  const project = projectNameInput.value.trim();
  if (!project && !confirm("Название проекта не заполнено. Сохранить без названия?")) return;

  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  orders.unshift({
    id: Date.now(),
    client,
    name: project || "Без названия",
    w: lastResult.w,
    d: lastResult.d,
    modules: lastResult.modules,
    sheets: lastResult.sheets,
    columns: lastResult.columns,
    frames: lastResult.frames,
    modulesCost: lastResult.modulesCost,
    installCost: lastResult.installCost,
    total: lastResult.total,
    date: new Date().toISOString()
  });

  localStorage.setItem("orders", JSON.stringify(orders));
  renderOrders();
}

function renderOrders() {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");
  if (!orders.length) {
    ordersDiv.innerHTML = '<div style="background:#f1f5f9;padding:20px;border-radius:16px;text-align:center;color:#475569;">Нет сохранённых заказов.</div>';
    return;
  }

  ordersDiv.innerHTML = "";
  orders.forEach((order, idx) => {
    const orderId = order.id || idx;
    const card = document.createElement("div");
    card.className = "order-card";
    card.innerHTML = `
      <div class="order-info">
        <strong>${escapeHtml(order.client)}</strong>
        <span class="project-name">${escapeHtml(order.name)}</span>
        <div class="order-details">
          <span>${order.w}×${order.d}</span>
          <span>${order.modules} модулей</span>
          <span>${order.total.toLocaleString()} ₽</span>
          <span>${new Date(order.date).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="order-price">${order.total.toLocaleString()} ₽</div>
      <button class="delete-order" data-id="${orderId}" title="Удалить заказ">🗑</button>
    `;
    ordersDiv.appendChild(card);
  });

  document.querySelectorAll(".delete-order").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idRaw = btn.getAttribute("data-id");
      const arr = JSON.parse(localStorage.getItem("orders") || "[]");
      const filtered = arr.filter((o) => String(o.id) !== String(idRaw));
      localStorage.setItem("orders", JSON.stringify(filtered));
      renderOrders();
    });
  });
}

// PDF
async function generatePDF() {
  if (!lastResult) return alert("Нет активного расчёта.");

  updatePdfContent();

  const pdfContainer = document.getElementById("pdfContent");
  if (!pdfContainer) return;

  pdfContainer.style.display = "block";
  pdfContainer.style.position = "absolute";
  pdfContainer.style.top = "-9999px";
  pdfContainer.style.left = "0";
  pdfContainer.style.width = "750px";
  pdfContainer.style.background = "white";

  try {
    if (!window.html2canvas || !window.jspdf) {
      alert("PDF-библиотеки не загрузились. Проверь интернет и перезагрузи страницу.");
      return;
    }

    const canvas = await window.html2canvas(pdfContainer, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: false
    });

    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;
    doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

    if (imgHeight > pageHeight) {
      let heightLeft = imgHeight - pageHeight;
      position = -pageHeight;
      while (heightLeft > 0) {
        doc.addPage();
        doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        position -= pageHeight;
      }
    }

    doc.save(`smeta_${projectNameInput.value.trim() || "stage"}_${Date.now()}.pdf`);
  } catch (err) {
    console.error(err);
    alert("Ошибка при создании PDF: " + err);
  } finally {
    pdfContainer.style.display = "none";
    pdfContainer.style.position = "";
  }
}

// PWA install
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = "inline-block";
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt = null;
    installBtn.style.display = "none";
  });
}

// iOS hint
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function init() {
  renderClients();
  renderOrders();

  if (!widthInput.value) widthInput.value = 4;
  if (!depthInput.value) depthInput.value = 3;
  if (!priceModuleInput.value) priceModuleInput.value = 850;
  if (!installInput.value) installInput.value = 3500;

  if (addClientBtn) addClientBtn.addEventListener("click", addClient);
  if (calcBtn) calcBtn.addEventListener("click", calc);
  if (saveOrderBtn) saveOrderBtn.addEventListener("click", saveOrder);
  if (downloadPdfBtn) downloadPdfBtn.addEventListener("click", generatePDF);

  // fallback
  window.addClient = addClient;
  window.calc = calc;
  window.saveOrder = saveOrder;
  window.generatePDF = generatePDF;

  setTimeout(calc, 50);

  if (isIOS() && !window.navigator.standalone) {
    const hint = document.createElement("div");
    hint.innerHTML = "👉 Поделиться → На экран Домой";
    hint.style.position = "fixed";
    hint.style.bottom = "20px";
    hint.style.left = "50%";
    hint.style.transform = "translateX(-50%)";
    hint.style.background = "#000";
    hint.style.color = "#fff";
    hint.style.padding = "10px 16px";
    hint.style.borderRadius = "20px";
    hint.style.zIndex = "999";
    document.body.appendChild(hint);
    setTimeout(() => hint.remove(), 5000);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
  }
}

window.addEventListener("load", init);
