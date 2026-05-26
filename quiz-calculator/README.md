# Квиз-калькулятор стоимости для малого бизнеса

Готовый MVP инструмента для сбора заявок через квиз с расчётом примерной стоимости. Проект сделан под GitHub Pages + Google Sheets + Google Apps Script.

## Что уже создано

- Фронтенд сайта: `index.html`, `styles.css`, `app.js`.
- Backend-код для Google Apps Script: `Code.gs`.
- Google Sheets CRM: `Quiz Calculator CRM`.
- Google Docs handoff-документ: `Quiz Calculator — Agent Handoff`.
- Стартовая конфигурация квиза на 6 вопросов.
- Логика ручной оплаты: клиент получает расчёт, оставляет заявку, владелец принимает оплату переводом на карту вручную.

## Ссылки проекта

- GitHub repo: `https://github.com/Phenolemox/Test_1`
- Папка проекта в repo: `quiz-calculator/`
- Ожидаемый GitHub Pages URL: `https://phenolemox.github.io/Test_1/quiz-calculator/`
- Google Sheets CRM: `https://docs.google.com/spreadsheets/d/1Rif5Mn_Xxe2W29p6vUCKNo4NGGPNQDBM7GhkduoUXm0/edit`
- Google Docs handoff: `https://docs.google.com/document/d/1Wr5YokGDyuT-tKHhufVSHv3QIf1tUnY0TFimWWG52wc/edit`

## Архитектура

```text
GitHub Pages сайт
        ↓
app.js загружает конфигурацию квиза из Apps Script
        ↓
пользователь проходит 6 шагов и оставляет контакты
        ↓
Apps Script записывает заявку в Google Sheets
        ↓
владелец получает email-уведомление
        ↓
оплата принимается вручную переводом на карту
```

## Файлы

```text
quiz-calculator/
├── index.html              # страница лендинга и квиза
├── styles.css              # визуальный стиль
├── app.js                  # логика квиза, расчёт цены, отправка заявки
├── Code.gs                 # Google Apps Script backend
├── README.md               # эта инструкция
├── docs/
│   └── SALES_SCRIPTS.md    # скрипты продаж по нишам
└── seed-data/
    ├── apartment-repair.tsv
    ├── website-creation.tsv
    └── cleaning.tsv
```

## Как запустить

### 1. Проверить Google Sheets

Откройте таблицу:

`https://docs.google.com/spreadsheets/d/1Rif5Mn_Xxe2W29p6vUCKNo4NGGPNQDBM7GhkduoUXm0/edit`

В ней должны быть листы:

- `Заявки`
- `Вопросы`
- `Варианты`
- `Настройки`
- `Тарифы`

Если структура сломана, откройте Apps Script и запустите функцию `setupInitialSheets()`.

### 2. Подключить Apps Script

1. Откройте Google Sheets CRM.
2. Нажмите `Extensions → Apps Script`.
3. Вставьте код из файла `quiz-calculator/Code.gs`.
4. Сохраните проект.
5. Запустите функцию `setupInitialSheets()` один раз.
6. Нажмите `Deploy → New deployment`.
7. Выберите тип `Web app`.
8. Настройки:
   - Execute as: `Me`
   - Who has access: `Anyone`
9. Скопируйте URL, который заканчивается на `/exec`.

### 3. Вставить Web App URL в сайт

Откройте файл:

`quiz-calculator/app.js`

Найдите строку:

```js
const SCRIPT_URL = "";
```

Вставьте URL Apps Script:

```js
const SCRIPT_URL = "https://script.google.com/macros/s/.../exec";
```

Сделайте commit.

### 4. Включить GitHub Pages

1. Откройте repo `Phenolemox/Test_1`.
2. Перейдите в `Settings → Pages`.
3. Source: `Deploy from a branch`.
4. Branch: `main`.
5. Folder: `/root`.
6. После включения сайт будет доступен здесь:

`https://phenolemox.github.io/Test_1/quiz-calculator/`

## Как менять вопросы

В Google Sheets откройте лист `Вопросы`.

Колонки:

- `question_id` — ID вопроса.
- `question_text` — текст вопроса.
- `question_type` — пока используйте `single`.
- `sort_order` — порядок показа.
- `is_active` — `TRUE`, если вопрос активен.

## Как менять варианты и цены

В Google Sheets откройте лист `Варианты`.

Колонки:

- `option_id` — ID варианта.
- `question_id` — ID вопроса, к которому относится вариант.
- `option_text` — текст варианта.
- `price_modifier` — сколько рублей добавляет вариант.
- `sort_order` — порядок варианта.
- `is_active` — `TRUE`, если вариант активен.

## Как работает заявка

Пользователь проходит квиз, вводит имя, телефон и email. Данные сохраняются в лист `Заявки`:

- ID
- дата
- имя
- телефон
- email
- ответы
- расчётная цена
- статус
- комментарий

Владелец получает уведомление на email `xafizzov.work@gmail.com`.

## Как принимать оплату вручную

В текущем MVP нет платёжной системы. Схема такая:

1. Клиент оставляет заявку.
2. Вы видите расчётную стоимость.
3. Вы связываетесь с клиентом.
4. Вы уточняете детали.
5. Клиент переводит деньги на карту.
6. Вы вручную меняете статус заявки в Google Sheets.

## Что делать агенту в следующем чате

Скопируйте в режим агента:

```text
Продолжи работу с проектом Quiz Calculator.

Данные проекта:
- GitHub repo: Phenolemox/Test_1
- Папка проекта: quiz-calculator
- Google Sheets CRM: https://docs.google.com/spreadsheets/d/1Rif5Mn_Xxe2W29p6vUCKNo4NGGPNQDBM7GhkduoUXm0/edit
- Google Docs handoff: https://docs.google.com/document/d/1Wr5YokGDyuT-tKHhufVSHv3QIf1tUnY0TFimWWG52wc/edit

Задачи:
1. Проверь файлы в GitHub.
2. Проверь структуру Google Sheets CRM.
3. Если Apps Script ещё не развернут, помоги развернуть Web App.
4. Вставь Web App URL в app.js.
5. Проверь GitHub Pages URL.
6. Протестируй отправку заявки.
7. Подготовь короткую инструкцию для продажи клиентам.
```

## Ограничения

- Это MVP без автоматических платежей.
- Расчётная цена не является финальной офертой.
- Для публичного запуска нужно вручную развернуть Google Apps Script Web App и вставить его URL в `app.js`.
