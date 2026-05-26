# Quiz Calculator — отдельный проект квиз-калькулятора

Это отдельный проект внутри репозитория `Phenolemox/Test_1`.

Важно: он не заменяет и не ломает другие проекты в репозитории.

## Разделение проектов

```text
/                         — старый проект «Оракул трёх слов»
/coin-exchange-game/      — отдельный проект Coin Exchange Game
/quiz-calculator/         — отдельный проект Quiz Calculator
```

## Где открывать квиз

После включения GitHub Pages от ветки `main` и папки `/root` квиз должен открываться здесь:

```text
https://phenolemox.github.io/Test_1/quiz-calculator/
```

Корневой адрес ниже остаётся старым проектом, это нормально:

```text
https://phenolemox.github.io/Test_1/
```

## Что уже есть

```text
quiz-calculator/index.html         — лендинг + квиз, весь фронтенд внутри одного файла
quiz-calculator/Code.gs            — Google Apps Script backend
quiz-calculator/README.md          — эта инструкция
quiz-calculator/docs/SALES_SCRIPTS.md
quiz-calculator/seed-data/apartment-repair.tsv
quiz-calculator/seed-data/website-creation.tsv
quiz-calculator/seed-data/cleaning.tsv
```

`index.html` сейчас сделан автономным: стили и клиентская логика находятся внутри файла. Это снижает риск поломки из-за отсутствующих `styles.css` или `app.js`.

## Google Sheets CRM

```text
https://docs.google.com/spreadsheets/d/1Rif5Mn_Xxe2W29p6vUCKNo4NGGPNQDBM7GhkduoUXm0/edit
```

## Как подключить отправку заявок

1. Открой Google Sheets CRM.
2. Нажми `Extensions → Apps Script`.
3. Вставь код из файла `quiz-calculator/Code.gs`.
4. Сохрани.
5. Запусти функцию `setupInitialSheets`.
6. Нажми `Deploy → New deployment → Web app`.
7. Настройки:
   - Execute as: `Me`
   - Who has access: `Anyone`
8. Скопируй URL, который заканчивается на `/exec`.
9. Передай этот URL ассистенту, чтобы он вставил его в `SCRIPT_URL` внутри `quiz-calculator/index.html`.

## Как работает MVP

Пока `SCRIPT_URL` пустой, квиз работает в демо-режиме:

- открывается;
- переключает вопросы;
- считает примерную стоимость;
- показывает форму заявки;
- не отправляет данные в Google Sheets.

После вставки Apps Script URL:

- заявка будет отправляться в Apps Script;
- Apps Script будет записывать заявку в лист `Заявки`;
- владелец будет получать уведомление на email.

## Модель оплаты

Платёжные системы не подключены. Клиент оставляет заявку, владелец связывается с ним и принимает оплату вручную переводом на карту.

## Тарифы продажи

```text
Старт      — 5 000 ₽
Стандарт   — 12 000 ₽
Премиум    — 25 000 ₽
```
