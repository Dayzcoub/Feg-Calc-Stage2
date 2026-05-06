diff --git a/app.js b/app.js
index a2f48fc8a3742d4caba52e7402d3132c3d17b5cf..dd76ceee2db2c2db48a87df37ee52532319a20df 100644
--- a/app.js
+++ b/app.js
@@ -1,82 +1,108 @@
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
+const companyNameInput = document.getElementById('companyName');
+const companyContactsInput = document.getElementById('companyContacts');
 
     
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
 
+
+
+function getSettings() {
+  return storage.get("settings", {
+    companyName: "ООО «FEG Stage»",
+    companyContacts: "+7 (900) 000-00-00 · sales@feg-stage.ru"
+  });
+}
+
+function saveSettings() {
+  const settings = {
+    companyName: (companyNameInput?.value || "").trim() || "ООО «FEG Stage»",
+    companyContacts: (companyContactsInput?.value || "").trim() || "+7 (900) 000-00-00 · sales@feg-stage.ru"
+  };
+  storage.set("settings", settings);
+  return settings;
+}
+
+function loadSettingsToForm() {
+  const s = getSettings();
+  if (companyNameInput) companyNameInput.value = s.companyName;
+  if (companyContactsInput) companyContactsInput.value = s.companyContacts;
+}
+
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
@@ -144,79 +170,81 @@ function showToast(msg, color = "#10b981") {
 
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
+        const settings = getSettings();
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
-                <div><strong>Реквизиты:</strong> ООО «FEG Stage»</div>
+                <div><strong>Реквизиты:</strong> ${escapeHtml(settings.companyName)}</div>
+                <div>Контакты: ${escapeHtml(settings.companyContacts)}</div>
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
@@ -303,157 +331,167 @@ function makeQuoteNumber() {
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
-                alert("PDF-библиотеки не загрузились. Проверьте интернет и перезагрузите страницу.");
+                const w = window.open("", "_blank");
+                if (w) { w.document.write(pdfContainer.innerHTML); w.document.close(); w.print(); }
+                alert("PDF-библиотеки не загрузились — открыт режим печати браузера.");
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
-    version: 1,
+    version: 2,
     exportedAt: new Date().toISOString(),
     clients: storage.get("clients", []),
-    orders: storage.get("orders", [])
+    orders: storage.get("orders", []),
+    settings: getSettings()
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
+  if (data.version >= 2 && data.settings) {
+    storage.set("settings", data.settings);
+  }
+  loadSettingsToForm();
   renderClients();
   renderOrders();
-  alert("Импорт завершён");
+  showToast("Импорт завершён", "#2563eb");
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
+        loadSettingsToForm();
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
+        if (companyNameInput) companyNameInput.addEventListener('change', saveSettings);
+        if (companyContactsInput) companyContactsInput.addEventListener('change', saveSettings);
 
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
