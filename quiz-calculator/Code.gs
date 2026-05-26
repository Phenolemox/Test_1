/*
 * Google Apps Script для проекта «Квиз-калькулятор стоимости».
 *
 * Что делает:
 * 1. doGet(e) отдаёт конфигурацию квиза из Google Sheets.
 * 2. doPost(e) принимает заявку с сайта и сохраняет её в лист «Заявки».
 * 3. onOpen() добавляет меню «Квиз» в таблицу.
 *
 * Важно:
 * - После вставки кода в Apps Script разверните проект как Web App.
 * - URL Web App вставьте в файл app.js в переменную SCRIPT_URL.
 */

const SPREADSHEET_ID = '1Rif5Mn_Xxe2W29p6vUCKNo4NGGPNQDBM7GhkduoUXm0';
const OWNER_EMAIL = 'xafizzov.work@gmail.com';

const SHEETS = {
  ORDERS: 'Заявки',
  QUESTIONS: 'Вопросы',
  OPTIONS: 'Варианты',
  SETTINGS: 'Настройки',
  TARIFFS: 'Тарифы'
};

function doGet(e) {
  const config = getQuizConfig_();
  const json = JSON.stringify(config);
  const callback = e && e.parameter && e.parameter.callback;

  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const orderId = payload.id || Utilities.getUuid();
    const price = Number(payload.price || 0);
    const answers = JSON.stringify(payload.answers || [], null, 0);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheet_(ss, SHEETS.ORDERS);
    ensureOrdersHeader_(sheet);

    sheet.appendRow([
      orderId,
      new Date(),
      payload.name || '',
      payload.phone || '',
      payload.email || '',
      answers,
      price,
      'Новая',
      ''
    ]);

    sendOwnerNotification_(payload, orderId, price);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, id: orderId, price }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error && error.message ? error.message : error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Квиз')
    .addItem('Проверить настройки', 'checkSettings')
    .addItem('Экспорт заявок', 'exportOrders')
    .addItem('Очистить тестовые заявки', 'clearTestOrders')
    .addItem('Переустановить структуру таблицы', 'setupInitialSheets')
    .addToUi();
}

function getQuizConfig_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const questionsSheet = ss.getSheetByName(SHEETS.QUESTIONS);
  const optionsSheet = ss.getSheetByName(SHEETS.OPTIONS);
  const tariffsSheet = ss.getSheetByName(SHEETS.TARIFFS);

  if (!questionsSheet || !optionsSheet) {
    throw new Error('Нет листов «Вопросы» или «Варианты». Запустите setupInitialSheets().');
  }

  const questionRows = readObjects_(questionsSheet);
  const optionRows = readObjects_(optionsSheet);
  const tariffRows = tariffsSheet ? readObjects_(tariffsSheet) : [];

  const questions = questionRows
    .filter(row => isTrue_(row.is_active))
    .map(row => ({
      id: row.question_id,
      text: row.question_text,
      type: row.question_type || 'single',
      sort_order: Number(row.sort_order || 0),
      options: []
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  const optionsByQuestion = {};
  optionRows
    .filter(row => isTrue_(row.is_active))
    .forEach(row => {
      const questionId = String(row.question_id);
      if (!optionsByQuestion[questionId]) optionsByQuestion[questionId] = [];
      optionsByQuestion[questionId].push({
        id: row.option_id,
        text: row.option_text,
        price: Number(row.price_modifier || 0),
        sort_order: Number(row.sort_order || 0)
      });
    });

  questions.forEach(question => {
    question.options = (optionsByQuestion[String(question.id)] || [])
      .sort((a, b) => a.sort_order - b.sort_order);
  });

  const tariffs = tariffRows.map(row => ({
    name: row.name,
    base_price: Number(row.base_price || 0),
    description: row.description || ''
  }));

  return { questions, tariffs, generated_at: new Date().toISOString() };
}

function parsePayload_(e) {
  if (e && e.parameter && e.parameter.payload) {
    return JSON.parse(e.parameter.payload);
  }

  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (err) {
      const raw = String(e.postData.contents || '');
      const match = raw.match(/payload=([^&]+)/);
      if (match) return JSON.parse(decodeURIComponent(match[1].replace(/\+/g, ' ')));
    }
  }

  throw new Error('Payload не найден.');
}

function readObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values.shift().map(header => String(header).trim());
  return values
    .filter(row => row.some(cell => String(cell).trim() !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((header, index) => { obj[header] = row[index]; });
      return obj;
    });
}

function isTrue_(value) {
  return value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'да' || String(value) === '1';
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ensureOrdersHeader_(sheet) {
  const header = ['ID', 'Дата', 'Имя', 'Телефон', 'Email', 'Ответы', 'Расчётная цена', 'Статус', 'Комментарий'];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(header);
    return;
  }
  const current = sheet.getRange(1, 1, 1, header.length).getValues()[0];
  if (current.join('') === '') sheet.getRange(1, 1, 1, header.length).setValues([header]);
}

function sendOwnerNotification_(payload, orderId, price) {
  const subject = `Новая заявка с квиз-калькулятора: ${orderId}`;
  const answers = (payload.answers || [])
    .map(item => `• ${item.question_text}: ${item.option_text} (+${item.price || 0} ₽)`)
    .join('\n');

  const body = [
    'Получена новая заявка.',
    '',
    `ID: ${orderId}`,
    `Имя: ${payload.name || ''}`,
    `Телефон: ${payload.phone || ''}`,
    `Email: ${payload.email || ''}`,
    `Расчётная цена: ${price} ₽`,
    '',
    'Ответы:',
    answers,
    '',
    `Таблица: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`
  ].join('\n');

  MailApp.sendEmail(OWNER_EMAIL, subject, body);
}

function checkSettings() {
  const config = getQuizConfig_();
  SpreadsheetApp.getUi().alert(`Активных вопросов: ${config.questions.length}\nТарифов: ${config.tariffs.length}`);
}

function exportOrders() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet_(ss, SHEETS.ORDERS);
  const data = sheet.getDataRange().getValues();
  const csv = data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
  const file = DriveApp.createFile(`quiz_orders_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss')}.csv`, csv, MimeType.CSV);
  MailApp.sendEmail(OWNER_EMAIL, 'Экспорт заявок квиза', 'Файл экспорта во вложении.', { attachments: [file] });
  SpreadsheetApp.getUi().alert('Экспорт создан и отправлен на email владельца.');
}

function clearTestOrders() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateSheet_(ss, SHEETS.ORDERS);
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    SpreadsheetApp.getUi().alert('Нет заявок для очистки.');
    return;
  }
  sheet.deleteRows(2, lastRow - 1);
  SpreadsheetApp.getUi().alert('Все заявки, кроме заголовка, удалены.');
}

function setupInitialSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const orders = getOrCreateSheet_(ss, SHEETS.ORDERS);
  orders.clear();
  orders.getRange(1, 1, 1, 9).setValues([['ID', 'Дата', 'Имя', 'Телефон', 'Email', 'Ответы', 'Расчётная цена', 'Статус', 'Комментарий']]);

  const questions = getOrCreateSheet_(ss, SHEETS.QUESTIONS);
  questions.clear();
  questions.getRange(1, 1, 7, 5).setValues([
    ['question_id', 'question_text', 'question_type', 'sort_order', 'is_active'],
    [1, 'Что нужно рассчитать?', 'single', 1, true],
    [2, 'Количество страниц или объём работ?', 'single', 2, true],
    [3, 'Нужен ли индивидуальный дизайн?', 'single', 3, true],
    [4, 'Нужны ли интеграции?', 'single', 4, true],
    [5, 'Нужен ли контент или тексты?', 'single', 5, true],
    [6, 'Как срочно нужен запуск?', 'single', 6, true]
  ]);

  const options = getOrCreateSheet_(ss, SHEETS.OPTIONS);
  options.clear();
  options.getRange(1, 1, 19, 6).setValues([
    ['option_id', 'question_id', 'option_text', 'price_modifier', 'sort_order', 'is_active'],
    [101, 1, 'Лендинг / простая услуга', 5000, 1, true],
    [102, 1, 'Корпоративный сайт / средний проект', 15000, 2, true],
    [103, 1, 'Интернет-магазин / сложный проект', 30000, 3, true],
    [201, 2, '1–3 страницы / небольшой объём', 0, 1, true],
    [202, 2, '4–10 страниц / средний объём', 5000, 2, true],
    [203, 2, '11–30 страниц / большой объём', 12000, 3, true],
    [204, 2, 'Больше 30 страниц / нестандартный объём', 25000, 4, true],
    [301, 3, 'Шаблонный дизайн', 0, 1, true],
    [302, 3, 'Индивидуальный дизайн', 10000, 2, true],
    [401, 4, 'Без интеграций', 0, 1, true],
    [402, 4, 'Форма + таблица заявок', 5000, 2, true],
    [403, 4, 'CRM / оплата / внешние сервисы', 15000, 3, true],
    [501, 5, 'Контент уже готов', 0, 1, true],
    [502, 5, 'Нужна редактура', 5000, 2, true],
    [503, 5, 'Нужно написать тексты с нуля', 12000, 3, true],
    [601, 6, 'Стандартно', 0, 1, true],
    [602, 6, 'Срочно', 7000, 2, true]
  ]);

  const settings = getOrCreateSheet_(ss, SHEETS.SETTINGS);
  settings.clear();
  settings.getRange(1, 1, 9, 3).setValues([
    ['key', 'value', 'comment'],
    ['OWNER_EMAIL', OWNER_EMAIL, 'Куда отправлять уведомления о новых заявках'],
    ['SPREADSHEET_ID', SPREADSHEET_ID, 'ID этой Google Таблицы'],
    ['SCRIPT_URL', 'PASTE_DEPLOYED_APPS_SCRIPT_WEB_APP_URL_HERE', 'После деплоя Apps Script вставить URL /exec'],
    ['GITHUB_REPOSITORY', 'Phenolemox/Test_1', 'Репозиторий, куда загружен проект'],
    ['GITHUB_PROJECT_PATH', 'quiz-calculator', 'Папка проекта в репозитории'],
    ['GITHUB_PAGES_URL', 'https://phenolemox.github.io/Test_1/quiz-calculator/', 'Ожидаемый URL, если GitHub Pages включён'],
    ['CURRENCY', '₽', 'Валюта расчёта'],
    ['PAYMENT_MODE', 'manual_card_transfer', 'Оплата вручную переводом на карту']
  ]);

  const tariffs = getOrCreateSheet_(ss, SHEETS.TARIFFS);
  tariffs.clear();
  tariffs.getRange(1, 1, 4, 3).setValues([
    ['name', 'base_price', 'description'],
    ['Старт', 5000, 'Базовый квиз без сложной кастомизации'],
    ['Стандарт', 12000, 'Квиз + настройка вопросов + Google Sheets'],
    ['Премиум', 25000, 'Квиз + тексты + брендирование + расширенная настройка']
  ]);

  [orders, questions, options, settings, tariffs].forEach(sheet => {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold').setBackground('#eeeeee');
    sheet.autoResizeColumns(1, sheet.getLastColumn());
  });
}
