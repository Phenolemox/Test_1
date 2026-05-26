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
  const data = getQuizConfig_();
  const json = JSON.stringify(data);
  const callback = e && e.parameter && e.parameter.callback;

  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const id = payload.id || Utilities.getUuid();
    const price = Number(payload.price || 0);
    const answers = JSON.stringify(payload.answers || []);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateSheet_(ss, SHEETS.ORDERS);
    ensureOrdersHeader_(sheet);

    sheet.appendRow([
      id,
      new Date(),
      payload.name || '',
      payload.phone || '',
      payload.email || '',
      answers,
      price,
      'Новая',
      ''
    ]);

    MailApp.sendEmail(
      OWNER_EMAIL,
      'Новая заявка с квиз-калькулятора: ' + id,
      'Имя: ' + (payload.name || '') + '\n' +
      'Телефон: ' + (payload.phone || '') + '\n' +
      'Email: ' + (payload.email || '') + '\n' +
      'Цена: ' + price + ' ₽\n' +
      'Таблица: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID + '/edit'
    );

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, id: id, price: price }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error.message || error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Квиз')
    .addItem('Переустановить структуру таблицы', 'setupInitialSheets')
    .addItem('Проверить настройки', 'checkSettings')
    .addToUi();
}

function setupInitialSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const orders = getOrCreateSheet_(ss, SHEETS.ORDERS);
  orders.clear();
  orders.getRange(1, 1, 1, 9).setValues([[
    'ID', 'Дата', 'Имя', 'Телефон', 'Email', 'Ответы', 'Расчётная цена', 'Статус', 'Комментарий'
  ]]);

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
    [204, 2, 'Больше 30 страниц', 25000, 4, true],
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
  settings.getRange(1, 1, 8, 3).setValues([
    ['key', 'value', 'comment'],
    ['OWNER_EMAIL', OWNER_EMAIL, 'Куда отправлять уведомления'],
    ['SPREADSHEET_ID', SPREADSHEET_ID, 'ID таблицы'],
    ['SCRIPT_URL', 'PASTE_WEB_APP_URL_HERE', 'Ссылка Web App /exec'],
    ['PROJECT', 'quiz-calculator', 'Отдельный проект'],
    ['GITHUB_REPOSITORY', 'Phenolemox/Test_1', 'Репозиторий'],
    ['GITHUB_PROJECT_PATH', 'quiz-calculator', 'Папка проекта'],
    ['PAYMENT_MODE', 'manual_card_transfer', 'Оплата вручную']
  ]);

  const tariffs = getOrCreateSheet_(ss, SHEETS.TARIFFS);
  tariffs.clear();
  tariffs.getRange(1, 1, 4, 3).setValues([
    ['name', 'base_price', 'description'],
    ['Старт', 5000, 'Базовая настройка'],
    ['Стандарт', 12000, 'Квиз + таблица + тексты'],
    ['Премиум', 25000, 'Брендирование и запуск']
  ]);

  [orders, questions, options, settings, tariffs].forEach(function(sheet) {
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold').setBackground('#eeeeee');
    sheet.autoResizeColumns(1, sheet.getLastColumn());
  });
}

function getQuizConfig_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const questionRows = readObjects_(getOrCreateSheet_(ss, SHEETS.QUESTIONS));
  const optionRows = readObjects_(getOrCreateSheet_(ss, SHEETS.OPTIONS));

  const questions = questionRows
    .filter(function(row) { return isTrue_(row.is_active); })
    .map(function(row) {
      return {
        id: row.question_id,
        text: row.question_text,
        type: row.question_type || 'single',
        sort_order: Number(row.sort_order || 0),
        options: []
      };
    })
    .sort(function(a, b) { return a.sort_order - b.sort_order; });

  const byQuestion = {};
  optionRows
    .filter(function(row) { return isTrue_(row.is_active); })
    .forEach(function(row) {
      const qid = String(row.question_id);
      if (!byQuestion[qid]) byQuestion[qid] = [];
      byQuestion[qid].push({
        id: row.option_id,
        text: row.option_text,
        price: Number(row.price_modifier || 0),
        sort_order: Number(row.sort_order || 0)
      });
    });

  questions.forEach(function(q) {
    q.options = (byQuestion[String(q.id)] || []).sort(function(a, b) { return a.sort_order - b.sort_order; });
  });

  return { questions: questions, generated_at: new Date().toISOString() };
}

function readObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values.shift().map(function(h) { return String(h).trim(); });
  return values.filter(function(row) {
    return row.some(function(cell) { return String(cell).trim() !== ''; });
  }).map(function(row) {
    const obj = {};
    headers.forEach(function(header, i) { obj[header] = row[i]; });
    return obj;
  });
}

function parsePayload_(e) {
  if (e && e.parameter && e.parameter.payload) return JSON.parse(e.parameter.payload);
  if (e && e.postData && e.postData.contents) return JSON.parse(e.postData.contents);
  throw new Error('Payload не найден');
}

function isTrue_(value) {
  return value === true || String(value).toLowerCase() === 'true' || String(value) === '1';
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ensureOrdersHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Дата', 'Имя', 'Телефон', 'Email', 'Ответы', 'Расчётная цена', 'Статус', 'Комментарий']);
  }
}

function checkSettings() {
  const config = getQuizConfig_();
  SpreadsheetApp.getUi().alert('Активных вопросов: ' + config.questions.length);
}
