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

    // ---- РАБОТА С КЛИЕНТАМИ (localStorage) ----
    function addClient() {
        const name = clientNameInput.value.trim();
        if (!name) {
            alert("Введите имя клиента");
            return;
        }
        let clients = JSON.parse(localStorage.getItem("clients") || "[]");
        if (clients.includes(name)) {
            alert("Такой клиент уже есть в списке");
            return;
        }
        clients.push(name);
        localStorage.setItem("clients", JSON.stringify(clients));
        renderClients();
        clientNameInput.value = '';
        // после добавления авто-выбор нового клиента
        clientSelect.value = name;
    }

    function renderClients() {
        const clients = JSON.parse(localStorage.getItem("clients") || "[]");
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

    // Генерируем красивое содержимое для PDF (внутри скрытого блока)
    function updatePdfContent() {
        if (!lastResult) {
            pdfDataDiv.innerHTML = '<p>Нет расчёта. Нажмите "Рассчитать смету".</p>';
            return;
        }
        const clientName = clientSelect.value || "Клиент не выбран";
        const project = projectNameInput.value.trim() || "Без названия";
        const { w, d, modules, sheets, columns, frames, modulesCost, installCost, total, priceModule } = lastResult;

        pdfDataDiv.innerHTML = `
            <div style="font-size: 16px; margin-bottom: 20px;">
                <div><strong>Клиент:</strong> ${escapeHtml(clientName)}</div>
                <div><strong>Проект / Мероприятие:</strong> ${escapeHtml(project)}</div>
                <div><strong>Дата:</strong> ${new Date().toLocaleDateString()}</div>
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

        let orders = JSON.parse(localStorage.getItem("orders") || "[]");
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
        localStorage.setItem("orders", JSON.stringify(orders));
        renderOrders();
        // лёгкое уведомление
        const toastMsg = document.createElement('div');
        toastMsg.textContent = 'Заказ сохранён!';
        toastMsg.style.position = 'fixed';
        toastMsg.style.bottom = '20px';
        toastMsg.style.left = '50%';
        toastMsg.style.transform = 'translateX(-50%)';
        toastMsg.style.backgroundColor = '#10b981';
        toastMsg.style.color = 'white';
        toastMsg.style.padding = '10px 20px';
        toastMsg.style.borderRadius = '60px';
        toastMsg.style.fontWeight = 'bold';
        toastMsg.style.zIndex = '999';
        document.body.appendChild(toastMsg);
        setTimeout(() => toastMsg.remove(), 2000);
    }

    function renderOrders() {
        const orders = JSON.parse(localStorage.getItem("orders") || "[]");
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
                let ordersArr = JSON.parse(localStorage.getItem("orders") || "[]");
                // сравниваем по id (число)
                const filtered = ordersArr.filter(o => (o.id || o._id) != idRaw);
                if (filtered.length === ordersArr.length) {
                    // fallback на позиционный индекс (если старый формат)
                    const idxToDel = parseInt(idRaw);
                    if (!isNaN(idxToDel) && ordersArr[idxToDel]) {
                        ordersArr.splice(idxToDel, 1);
                        localStorage.setItem("orders", JSON.stringify(ordersArr));
                    } else {
                        return;
                    }
                } else {
                    localStorage.setItem("orders", JSON.stringify(filtered));
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
            const canvas = await html2canvas(pdfContainer, {
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

    // ---- Инициализация и загрузка данных, восстановление orders и клиентов ----
    function init() {
        renderClients();
        renderOrders();
        // устанавливаем значения по умолчанию, если поля пустые
        if (!widthInput.value) widthInput.value = 4;
        if (!depthInput.value) depthInput.value = 3;
        if (!priceModuleInput.value) priceModuleInput.value = 850;
        if (!installInput.value) installInput.value = 3500;

        // авто-расчёт стартовый, чтобы последний результат не был null
        setTimeout(() => {
            calc();
        }, 50);
    }

    window.addEventListener('load', init);
	// ===== PWA INSTALL =====
let deferredPrompt;
const installBtn = document.getElementById("installBtn");

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
