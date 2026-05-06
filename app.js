// ---- Глобальные переменные ----
    let lastResult = null;      // последний рассчитанный объект

    // DOM элементы
    const clientNameInput = document.getElementById('clientName');
    const clientSelect = document.getElementById('clientSelect');
    const projectNameInput = document.getElementById('projectName');
    const widthInput = document.getElementById('width');
    const depthInput = document.getElementById('depth');
    const priceModuleInput = document.getElementById('priceModule');
    const installInput = document.getElementById('install');
    const resultDiv = document.getElementById('result');
    const ordersDiv = document.getElementById('orders');
    const pdfDataDiv = document.getElementById('pdfData');
const companyNameInput = document.getElementById('companyName');
const companyContactsInput = document.getElementById('companyContacts');
const openCompanyModalBtn = document.getElementById('openCompanyModalBtn');
const closeCompanyModalBtn = document.getElementById('closeCompanyModalBtn');
const saveCompanySettingsBtn = document.getElementById('saveCompanySettingsBtn');
const companyModal = document.getElementById('companyModal');

    
const storage = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error("storage get error", e);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("storage set error", e);
      alert("Не удалось сохранить данные в браузере");
      return false;
    }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) { console.error(e); }
  }
};

function showToast(msg, color = "#10b981") {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.position = "fixed";
  el.style.bottom = "20px";
  el.style.left = "50%";
  el.style.transform = "translateX(-50%)";
  el.style.background = color;
  el.style.color = "#fff";
  el.style.padding = "10px 18px";
  el.style.borderRadius = "999px";
  el.style.zIndex = "9999";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}



function getSettings() {
  return storage.get("settings", {
    companyName: "ООО «FEG Stage»",
    companyContacts: "+7 (900) 000-00-00 · sales@feg-stage.ru"
  });
}

function saveSettings() {
  const settings = {
    companyName: (companyNameInput?.value || "").trim() || "ООО «FEG Stage»",
    companyContacts: (companyContactsInput?.value || "").trim() || "+7 (900) 000-00-00 · sales@feg-stage.ru"
  };
  storage.set("settings", settings);
  return settings;
}

function loadSettingsToForm() {
  const s = getSettings();
  if (companyNameInput) companyNameInput.value = s.companyName;
  if (companyContactsInput) companyContactsInput.value = s.companyContacts;
}


function openCompanyModal() {
  if (companyModal) companyModal.style.display = "grid";
}

function closeCompanyModal() {
  if (companyModal) companyModal.style.display = "none";
}

    // ---- РАБОТА С КЛИЕНТАМИ (localStorage) ----
    function addClient() {
        const name = clientNameInput.value.trim();
        if (!name) {
            alert("Введите имя клиента");
            return;
        }
        let clients = storage.get("clients", []);
        if (clients.includes(name)) {
            alert("Такой клиент уже есть в списке");
            return;
        }
        clients.push(name);
        if (!storage.set("clients", clients)) return;
        renderClients();
        clientNameInput.value = '';
        // после добавления авто-выбор нового клиента
        clientSelect.value = name;
    }

    function renderClients() {
        const clients = storage.get("clients", []);
        clientSelect.innerHTML = '<option value="">— Выберите клиента —</option>';
        clients.forEach(c => {
            clientSelect.innerHTML += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
        });
        if (clients.length === 0) {
            clientSelect.innerHTML = '<option value="">Нет клиентов, добавьте</option>';
        }
    }

    // простая защита от XSS для отображения
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
            return c;
        });
    }

    // ---- ОСНОВНОЙ РАСЧЁТ ----
    function calc() {
        let w = parseInt(widthInput.value);
        let d = parseInt(depthInput.value);
        const price = parseFloat(priceModuleInput.value);
        let installCost = parseFloat(installInput.value);

        if (isNaN(w) || isNaN(d) || w <= 0 || d <= 0) {
            alert("Укажите корректные ширину и глубину (целые числа больше 0)");
            return;
        }
        if (isNaN(price) || price < 0) {
            alert("Укажите корректную цену за модуль");
            return;
        }
        if (isNaN(installCost) || installCost < 0) installCost = 0;

        const modules = w * d;
        const sheets = modules;           // количество листов
        const columns = (w + 1) * (d + 1);
        const frames = (w * (d + 1)) + (d * (w + 1));
        const modulesCost = modules * price;
        const total = modulesCost + installCost;

        lastResult = {
            w, d, modules, sheets, columns, frames,
            modulesCost, installCost, total,
            priceModule: price,
        };

        // отрисовка результата в стильной карточке
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

        // обновляем содержимое для PDF
        updatePdfContent();
    }


function makeQuoteNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = String(d.getHours() * 60 + d.getMinutes()).padStart(4, '0');
  return `KP-${y}${m}${day}-${seq}`;
}

    // Генерируем красивое содержимое для PDF (внутри скрытого блока)
    function updatePdfContent() {
        if (!lastResult) {
            pdfDataDiv.innerHTML = '<p>Нет расчёта. Нажмите "Рассчитать смету".</p>';
            return;
        }
        const clientName = clientSelect.value || "Клиент не выбран";
        const project = projectNameInput.value.trim() || "Без названия";
        const { w, d, modules, sheets, columns, frames, modulesCost, installCost, total, priceModule } = lastResult;
        const quoteNo = makeQuoteNumber();
        const settings = getSettings();
        const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

        pdfDataDiv.innerHTML = `
            <div style="font-size: 16px; margin-bottom: 20px;">
                <div><strong>Клиент:</strong> ${escapeHtml(clientName)}</div>
                <div><strong>Проект / Мероприятие:</strong> ${escapeHtml(project)}</div>
                <div><strong>Дата:</strong> ${new Date().toLocaleDateString()}</div>
                <div><strong>№ КП:</strong> ${quoteNo}</div>
                <div><strong>Действует до:</strong> ${validUntil}</div>
            </div>
            <div style="background:#f9f9fb; padding: 16px; border-radius: 20px; margin: 12px 0;">
                <h3 style="margin:0 0 10px 0;">Детали конструкции</h3>
                <table style="width:100%; border-collapse: collapse;">
                    <tr><td style="padding:6px 0">Размер сцены:</td><td style="text-align:right"><b>${w} x ${d} модулей</b></td></tr>
                    <tr><td style="padding:6px 0">Общее количество модулей:</td><td style="text-align:right">${modules} шт</td></tr>
                    <tr><td style="padding:6px 0">Листы настила:</td><td style="text-align:right">${sheets} шт</td></tr>
                    <tr><td style="padding:6px 0">Столбы (опоры):</td><td style="text-align:right">${columns} шт</td></tr>
                    <tr><td style="padding:6px 0">Перекладины:</td><td style="text-align:right">${frames} шт</td></tr>
                </table>
            </div>
            <div style="background:#eef2ff; padding: 18px; border-radius: 20px;">
                <div style="display:flex; justify-content:space-between;"><span>Цена за модуль:</span><span>${priceModule} ₽</span></div>
                <div style="display:flex; justify-content:space-between; margin:8px 0;"><span>Стоимость модулей:</span><span>${modulesCost.toLocaleString()} ₽</span></div>
                <div style="display:flex; justify-content:space-between;"><span>Работы по монтажу:</span><span>${installCost.toLocaleString()} ₽</span></div>
                <hr style="margin:12px 0; border-top:2px dashed #3b82f6;">
                <div style="display:flex; justify-content:space-between; font-weight:800; font-size:1.3rem;"><span>ИТОГО К ОПЛАТЕ:</span><span>${total.toLocaleString()} ₽</span></div>
            </div>
            <div style="margin-top:14px; font-size:13px; color:#334155; background:#f8fafc; padding:12px; border-radius:12px;">
                <div><strong>Реквизиты:</strong> ${escapeHtml(settings.companyName)}</div>
                <div>Контакты: ${escapeHtml(settings.companyContacts)}</div>
                <div>ИНН: 7700000000 · КПП: 770001001</div>
                <div>Р/с: 40702810000000000000 в АО «Банк» · БИК: 044525000</div>
                <div>Условия оплаты: 50% предоплата, 50% после монтажа.</div>
            </div>
        `;
    }

    // ---- ЗАКАЗЫ (сохранение) ----
    function saveOrder() {
        if (!lastResult) {
            alert("Сначала выполните расчёт (кнопка «Рассчитать смету»).");
            return;
        }
        const client = clientSelect.value;
        if (!client) {
            alert("Выберите или добавьте клиента перед сохранением.");
            return;
        }
        const project = projectNameInput.value.trim();
        if (!project) {
            if(confirm("Название проекта не заполнено. Сохранить заказ без названия?")) {
                // разрешаем
            } else {
                return;
            }
        }

        let orders = storage.get("orders", []);
        const newOrder = {
            id: Date.now(),
            client: client,
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
        };
        orders.unshift(newOrder);  // свежие сверху
        if (!storage.set("orders", orders)) return;
        renderOrders();
        showToast('Заказ сохранён!');
    }

    function renderOrders() {
        const ordersAll = storage.get("orders", []);
  const q = (ordersSearchInput?.value || "").trim().toLowerCase();
  const orders = ordersAll.filter((o)=>{
    if (!q) return true;
    return String(o.client||"").toLowerCase().includes(q) || String(o.name||"").toLowerCase().includes(q) || new Date(o.date).toLocaleDateString().toLowerCase().includes(q);
  });
        if (!ordersDiv) return;
        if (orders.length === 0) {
            ordersDiv.innerHTML = '<div style="background:#f1f5f9; padding:20px; border-radius:28px; text-align:center; color:#475569;">Нет сохранённых заказов. Рассчитайте и сохраните.</div>';
            return;
        }
        ordersDiv.innerHTML = '';
        orders.forEach((order, idx) => {
            const card = document.createElement('div');
            card.className = 'order-card';
            const orderId = order.id || idx;
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

        // вешаем обработчики удаления
        document.querySelectorAll('.delete-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idRaw = btn.getAttribute('data-id');
                let ordersArr = storage.get("orders", []);
                // сравниваем по id (число)
                const filtered = ordersArr.filter(o => (o.id || o._id) != idRaw);
                if (filtered.length === ordersArr.length) {
                    // fallback на позиционный индекс (если старый формат)
                    const idxToDel = parseInt(idRaw);
                    if (!isNaN(idxToDel) && ordersArr[idxToDel]) {
                        ordersArr.splice(idxToDel, 1);
                        storage.set("orders", ordersArr);
                    } else {
                        return;
                    }
                } else {
                    storage.set("orders", filtered);
                }
                renderOrders();
            });
        });
    }

    // ---- ГЕНЕРАЦИЯ PDF ----
    async function generatePDF() {
        if (!lastResult) {
            alert("Нет активного расчёта. Нажмите «Рассчитать смету» перед созданием PDF.");
            return;
        }
        // обновляем контент PDF перед захватом
        updatePdfContent();

        const pdfContainer = document.getElementById('pdfContent');
        if (!pdfContainer) return;

        // показываем блок временно
        pdfContainer.style.display = 'block';
        pdfContainer.style.position = 'absolute';
        pdfContainer.style.top = '-9999px';
        pdfContainer.style.left = '0';
        pdfContainer.style.width = '750px';
        pdfContainer.style.background = 'white';

        try {
            if (!window.html2canvas || !window.jspdf) {
                const w = window.open("", "_blank");
                if (w) { w.document.write(pdfContainer.innerHTML); w.document.close(); w.print(); }
                alert("PDF-библиотеки не загрузились — открыт режим печати браузера.");
                return;
            }

            const canvas = await window.html2canvas(pdfContainer, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: false
            });
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210; // A4 ширина мм
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let position = 0;
            doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            if (imgHeight > pageHeight) {
                // если длиннее — добавим вторую страницу (простейший)
                let heightLeft = imgHeight - pageHeight;
                position = -pageHeight;
                while (heightLeft > 0) {
                    doc.addPage();
                    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                    position -= pageHeight;
                }
            }
            doc.save(`smeta_${projectNameInput.value.trim() || 'stage'}_${Date.now()}.pdf`);
        } catch (err) {
            console.error(err);
            alert("Ошибка при создании PDF: " + err);
        } finally {
            pdfContainer.style.display = 'none';
            pdfContainer.style.position = '';
        }
    }


function exportData() {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    clients: storage.get("clients", []),
    orders: storage.get("orders", []),
    settings: getSettings()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `feg-stage-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importDataFromFile(file) {
  if (!file) return;
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.clients) || !Array.isArray(data.orders)) {
    alert("Некорректный JSON-файл");
    return;
  }
  storage.set("clients", data.clients);
  storage.set("orders", data.orders);
  if (data.version >= 2 && data.settings) {
    storage.set("settings", data.settings);
  }
  loadSettingsToForm();
  renderClients();
  renderOrders();
  showToast("Импорт завершён", "#2563eb");
}

function clearOrdersOnly() {
  if (!confirm("Удалить только историю заказов?")) return;
  storage.remove("orders");
  renderOrders();
  showToast("История заказов очищена", "#f59e0b");
}

function clearAllData() {
  if (!confirm("Удалить всех клиентов и все заказы?")) return;
  storage.remove("clients");
  storage.remove("orders");
  renderClients();
  renderOrders();
  showToast("Все данные очищены", "#ef4444");
}

    // ---- Инициализация и загрузка данных, восстановление orders и клиентов ----
    function init() {
        loadSettingsToForm();
        renderClients();
        renderOrders();
        // устанавливаем значения по умолчанию, если поля пустые
        if (!widthInput.value) widthInput.value = 4;
        if (!depthInput.value) depthInput.value = 3;
        if (!priceModuleInput.value) priceModuleInput.value = 850;
        if (!installInput.value) installInput.value = 3500;

        if (addClientBtn) addClientBtn.addEventListener('click', addClient);
        if (calcBtn) calcBtn.addEventListener('click', calc);
        if (saveOrderBtn) saveOrderBtn.addEventListener('click', saveOrder);
        if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', generatePDF);
        if (exportDataBtn) exportDataBtn.addEventListener('click', exportData);
        if (importDataBtn) importDataBtn.addEventListener('click', () => importFileInput && importFileInput.click());
        if (clearDataBtn) clearDataBtn.addEventListener('click', clearAllData);
        if (clearOrdersBtn) clearOrdersBtn.addEventListener('click', clearOrdersOnly);
        if (importFileInput) importFileInput.addEventListener('change', (e) => importDataFromFile(e.target.files?.[0]));
        if (ordersSearchInput) ordersSearchInput.addEventListener('input', renderOrders);
        if (openCompanyModalBtn) openCompanyModalBtn.addEventListener('click', openCompanyModal);
        if (closeCompanyModalBtn) closeCompanyModalBtn.addEventListener('click', closeCompanyModal);
        if (saveCompanySettingsBtn) saveCompanySettingsBtn.addEventListener('click', () => {
            saveSettings();
            showToast('Реквизиты сохранены', '#2563eb');
            closeCompanyModal();
            updatePdfContent();
        });

        // совместимость для inline-обработчиков
        window.addClient = addClient;
        window.calc = calc;
        window.saveOrder = saveOrder;
        window.generatePDF = generatePDF;

        // авто-расчёт стартовый, чтобы последний результат не был null
        setTimeout(() => {
            calc();
        }, 50);
    }

    window.addEventListener('load', init);
	// ===== PWA INSTALL =====
let deferredPrompt;
const installBtn = document.getElementById("installBtn");
const addClientBtn = document.getElementById("addClientBtn");
const calcBtn = document.getElementById("calcBtn");
const saveOrderBtn = document.getElementById("saveOrderBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const exportDataBtn = document.getElementById("exportDataBtn");
const importDataBtn = document.getElementById("importDataBtn");
const clearDataBtn = document.getElementById("clearDataBtn");
const clearOrdersBtn = document.getElementById("clearOrdersBtn");
const importFileInput = document.getElementById("importFileInput");
const ordersSearchInput = document.getElementById("ordersSearch");

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = "inline-block";
});

installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt = null;
    installBtn.style.display = "none";
});

// ===== iOS подсказка =====
function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

window.addEventListener("load", () => {
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
});

// ===== SERVICE WORKER =====
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}
