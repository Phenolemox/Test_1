<?php

declare(strict_types=1);

function normalizeWord(string $word): string
{
    $word = trim($word);
    $word = preg_replace('/\s+/u', ' ', $word) ?? $word;

    return mb_substr($word, 0, 40);
}

function startsWithVowel(string $word): bool
{
    $first = mb_strtolower(mb_substr($word, 0, 1));
    return in_array($first, ['а', 'е', 'ё', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я', 'a', 'e', 'i', 'o', 'u', 'y'], true);
}

function mysticalPrediction(array $words): string
{
    [$first, $second, $third] = $words;

    $images = [
        'древняя арка',
        'серебряная река',
        'тихий маяк',
        'кристальный сад',
        'огненная спираль',
        'лунный мост',
        'янтарная тропа',
        'зеркальная башня',
    ];

    $energies = [
        'шёпот перемен',
        'дыхание нового цикла',
        'память прошлого света',
        'знак скрытой удачи',
        'импульс храброго шага',
        'спокойствие внутренней силы',
    ];

    $firstImage = $images[crc32(mb_strtolower($first)) % count($images)];
    $secondImage = $images[crc32(mb_strtolower($second)) % count($images)];
    $thirdImage = $images[crc32(mb_strtolower($third)) % count($images)];

    $firstEnergy = $energies[crc32(mb_strtolower($first . $second)) % count($energies)];
    $secondEnergy = $energies[crc32(mb_strtolower($second . $third)) % count($energies)];

    $tone = startsWithVowel($first)
        ? 'Ответ явится мягко, но очень точно.'
        : 'Ответ придёт резко, как вспышка на горизонте.';

    return "В сумерках перед тобой появляются {$firstImage}, {$secondImage} и {$thirdImage}. "
        . "Они сплетаются в {$firstEnergy} и пробуждают {$secondEnergy}. "
        . "{$tone} В течение ближайших 7 дней следуй за знаком, который повторится трижды.";
}

$words = ['', '', ''];
$prediction = null;
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $words = [
        normalizeWord($_POST['word1'] ?? ''),
        normalizeWord($_POST['word2'] ?? ''),
        normalizeWord($_POST['word3'] ?? ''),
    ];

    if (in_array('', $words, true)) {
        $error = 'Пожалуйста, введи все 3 слова.';
    } else {
        $prediction = mysticalPrediction($words);
    }
}
?>
<!doctype html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Мистическое предсказание</title>
    <style>
        body {
            margin: 0;
            min-height: 100vh;
            font-family: "Segoe UI", Tahoma, sans-serif;
            background: radial-gradient(circle at top, #23123a, #0c0716 70%);
            color: #f3eaff;
            display: grid;
            place-items: center;
            padding: 24px;
        }

        .card {
            width: min(680px, 100%);
            background: rgba(17, 10, 32, 0.88);
            border: 1px solid rgba(179, 142, 255, 0.35);
            border-radius: 16px;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
            padding: 24px;
        }

        h1 {
            margin-top: 0;
            font-size: 1.7rem;
        }

        p {
            line-height: 1.55;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            margin: 18px 0;
        }

        input {
            width: 100%;
            border-radius: 10px;
            border: 1px solid rgba(179, 142, 255, 0.45);
            background: rgba(255, 255, 255, 0.08);
            color: #fff;
            padding: 10px 12px;
            box-sizing: border-box;
            font-size: 1rem;
        }

        button {
            border: 0;
            border-radius: 10px;
            background: linear-gradient(90deg, #9f6dff, #6a9bff);
            color: #fff;
            font-size: 1rem;
            padding: 10px 14px;
            cursor: pointer;
        }

        .error {
            color: #ffb4b4;
            margin-top: 8px;
        }

        .result {
            margin-top: 20px;
            padding: 14px;
            border-radius: 12px;
            background: rgba(74, 45, 121, 0.35);
            border: 1px solid rgba(195, 167, 255, 0.45);
        }
    </style>
</head>
<body>
<div class="card">
    <h1>Оракул трёх слов</h1>
    <p>Введи три слова. Я не повторю их напрямую, но соберу из них образное мистическое предсказание.</p>

    <form method="post">
        <div class="grid">
            <input type="text" name="word1" maxlength="40" value="<?= htmlspecialchars($words[0], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" placeholder="Первое слово" required>
            <input type="text" name="word2" maxlength="40" value="<?= htmlspecialchars($words[1], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" placeholder="Второе слово" required>
            <input type="text" name="word3" maxlength="40" value="<?= htmlspecialchars($words[2], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" placeholder="Третье слово" required>
        </div>

        <button type="submit">Узнать предсказание</button>

        <?php if ($error !== null): ?>
            <div class="error"><?= htmlspecialchars($error, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></div>
        <?php endif; ?>
    </form>

    <?php if ($prediction !== null): ?>
        <div class="result">
            <?= htmlspecialchars($prediction, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>
        </div>
    <?php endif; ?>
</div>
</body>
</html>
