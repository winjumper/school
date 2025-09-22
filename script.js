// Конфигурация API (теперь через локальный сервер)
const API_BASE_URL = window.location.origin;
const SOLVE_TASK_URL = `${API_BASE_URL}/api/solve-task`;

// Элементы DOM
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const removeBtn = document.getElementById('removeBtn');
const solveBtn = document.getElementById('solveBtn');
const spinner = document.getElementById('spinner');
const btnText = document.querySelector('.btn-text');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const newTaskBtn = document.getElementById('newTaskBtn');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// Элементы для API ключа
const apiKeySection = document.getElementById('apiKeySection');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const clearApiKeyBtn = document.getElementById('clearApiKeyBtn');
const apiKeyStatus = document.getElementById('apiKeyStatus');

// Состояние приложения
let selectedFile = null;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Проверяем доступность сервера
    checkServerStatus();
    
    // Скрываем секцию API ключа, так как ключ теперь на сервере
    hideApiKeySection();
    
    initializeEventListeners();
}

function initializeEventListeners() {
    // Обработка drag & drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Обработка выбора файла
    fileInput.addEventListener('change', handleFileSelect);

    // Обработка кнопок
    removeBtn.addEventListener('click', removeImage);
    solveBtn.addEventListener('click', solveProblem);
    newTaskBtn.addEventListener('click', resetApp);
    retryBtn.addEventListener('click', resetApp);
    
    // Обработка клика по области загрузки (только по пустому месту)
    uploadArea.addEventListener('click', (e) => {
        // Проверяем, что клик не по кнопке и не по input
        if (e.target === uploadArea || e.target.classList.contains('upload-content') || 
            e.target.classList.contains('upload-icon') || e.target.tagName === 'H3' || 
            e.target.tagName === 'P') {
            console.log('Клик по области загрузки');
            fileInput.click();
        }
    });
    
    // Обработка кнопки "Выбрать файл"
    const uploadBtn = document.querySelector('.upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function(e) {
            console.log('Кнопка "Выбрать файл" нажата');
            e.preventDefault();
            e.stopPropagation();
            fileInput.click();
        });
    }
    
    // API ключ больше не нужен, так как он на сервере
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    console.log('handleFileSelect вызван');
    const file = e.target.files[0];
    if (file) {
        console.log('Файл выбран:', file.name);
        handleFile(file);
    } else {
        console.log('Файл не выбран');
    }
}

function handleFile(file) {
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
        showError('Пожалуйста, выберите изображение');
        return;
    }

    // Проверка размера файла (максимум 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showError('Размер файла не должен превышать 10MB');
        return;
    }

    selectedFile = file;
    displayImagePreview(file);
    hideError();
    
    // Очищаем input для возможности повторного выбора того же файла
    fileInput.value = '';
}

function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        uploadArea.style.display = 'none';
        previewSection.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    selectedFile = null;
    fileInput.value = '';
    previewSection.style.display = 'none';
    uploadArea.style.display = 'block';
    hideResult();
    hideError();
}

async function solveProblem() {
    if (!selectedFile) {
        showError('Пожалуйста, выберите изображение');
        return;
    }

    setLoading(true);
    hideError();
    hideResult();

    try {
        // Конвертируем изображение в base64
        const base64Image = await fileToBase64(selectedFile);
        
        // Отправляем запрос к нашему серверу
        const response = await fetch(SOLVE_TASK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Пожалуйста, решите эту школьную задачу. Предоставьте подробное пошаговое решение с объяснениями. 

ВАЖНО: Используйте простые математические символы вместо LaTeX:
- Вместо \frac{a}{b} пишите a/b или "a делить на b"
- Вместо \times пишите × или "умножить на"
- Вместо \div пишите ÷ или "делить на"
- Вместо \sqrt пишите √
- Вместо ^ пишите степень обычным текстом (например, x в квадрате)
- Вместо сложных формул используйте простые выражения

Если это математическая задача, покажите все вычисления пошагово. Если это задача по физике, химии или другому предмету, объясните принципы и формулы простыми словами. Ответ должен быть на русском языке и понятен школьнику.`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: base64Image
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 2000,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const solution = data.choices[0].message.content;
        
        displayResult(solution);
        
    } catch (error) {
        console.error('Ошибка при решении задачи:', error);
        showError(`Ошибка при решении задачи: ${error.message}`);
    } finally {
        setLoading(false);
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

function displayResult(solution) {
    console.log('Исходное решение:', solution);
    console.log('Содержит \\n:', solution.includes('\n'));
    
    // Конвертируем LaTeX математические выражения в обычный текст
    const mathFormatted = formatMathExpressions(solution);
    console.log('После форматирования математики:', mathFormatted);
    console.log('Содержит \\n после форматирования:', mathFormatted.includes('\n'));
    
    // Улучшенное форматирование с разбиением на абзацы
    let formatted = mathFormatted
        // Сначала обрабатываем заголовки **текст**
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Разбиваем на абзацы по двойным переносам строк
        .split(/\n\s*\n/)
        .map(paragraph => {
            paragraph = paragraph.trim();
            if (!paragraph) return '';
            
            // Если абзац начинается с цифры и точки (нумерованный список)
            if (/^\d+\.\s/.test(paragraph)) {
                return `<div class="numbered-step">${paragraph}</div>`;
            }
            // Если абзац содержит математические выражения
            else if (/[+\-×÷=<>≤≥≠≈√π]/.test(paragraph)) {
                return `<div class="math-step">${paragraph}</div>`;
            }
            // Обычный абзац
            else {
                return `<p class="solution-text">${paragraph}</p>`;
            }
        })
        .filter(p => p) // Убираем пустые абзацы
        .join('');
    
    console.log('Финальное форматирование:', formatted);
    
    resultContent.innerHTML = formatted;
    resultSection.style.display = 'block';
    previewSection.style.display = 'none';
}

function formatMathExpressions(text) {
    // Заменяем LaTeX выражения на обычный текст
    let formatted = text;
    
    // Дроби: \frac{a}{b} -> a/b
    formatted = formatted.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
    
    // Степени: a^{b} -> a^b
    formatted = formatted.replace(/\{([^}]+)\}\^\{([^}]+)\}/g, '$1^$2');
    formatted = formatted.replace(/\^\{([^}]+)\}/g, '^$1');
    
    // Индексы: a_{b} -> a_b
    formatted = formatted.replace(/_\{([^}]+)\}/g, '_$1');
    
    // Убираем лишние скобки и символы
    formatted = formatted.replace(/\\[a-zA-Z]+/g, '');
    formatted = formatted.replace(/\{|\}/g, '');
    
    // Заменяем математические символы
    formatted = formatted.replace(/\\times/g, '×');
    formatted = formatted.replace(/\\div/g, '÷');
    formatted = formatted.replace(/\\cdot/g, '·');
    formatted = formatted.replace(/\\pm/g, '±');
    formatted = formatted.replace(/\\sqrt/g, '√');
    formatted = formatted.replace(/\\pi/g, 'π');
    formatted = formatted.replace(/\\alpha/g, 'α');
    formatted = formatted.replace(/\\beta/g, 'β');
    formatted = formatted.replace(/\\gamma/g, 'γ');
    formatted = formatted.replace(/\\delta/g, 'δ');
    formatted = formatted.replace(/\\theta/g, 'θ');
    formatted = formatted.replace(/\\lambda/g, 'λ');
    formatted = formatted.replace(/\\mu/g, 'μ');
    formatted = formatted.replace(/\\sigma/g, 'σ');
    formatted = formatted.replace(/\\phi/g, 'φ');
    formatted = formatted.replace(/\\omega/g, 'ω');
    
    // Заменяем стрелки
    formatted = formatted.replace(/\\rightarrow/g, '→');
    formatted = formatted.replace(/\\leftarrow/g, '←');
    formatted = formatted.replace(/\\Rightarrow/g, '⇒');
    formatted = formatted.replace(/\\Leftarrow/g, '⇐');
    
    // Заменяем знаки сравнения
    formatted = formatted.replace(/\\leq/g, '≤');
    formatted = formatted.replace(/\\geq/g, '≥');
    formatted = formatted.replace(/\\neq/g, '≠');
    formatted = formatted.replace(/\\approx/g, '≈');
    
    // Заменяем множества
    formatted = formatted.replace(/\\in/g, '∈');
    formatted = formatted.replace(/\\notin/g, '∉');
    formatted = formatted.replace(/\\subset/g, '⊂');
    formatted = formatted.replace(/\\supset/g, '⊃');
    formatted = formatted.replace(/\\cup/g, '∪');
    formatted = formatted.replace(/\\cap/g, '∩');
    
    // Заменяем интегралы и суммы
    formatted = formatted.replace(/\\int/g, '∫');
    formatted = formatted.replace(/\\sum/g, '∑');
    formatted = formatted.replace(/\\prod/g, '∏');
    
    // Заменяем бесконечность
    formatted = formatted.replace(/\\infty/g, '∞');
    
    // Заменяем углы
    formatted = formatted.replace(/\\angle/g, '∠');
    
    // Заменяем треугольники
    formatted = formatted.replace(/\\triangle/g, '△');
    
    // Заменяем параллельность
    formatted = formatted.replace(/\\parallel/g, '∥');
    formatted = formatted.replace(/\\perp/g, '⊥');
    
    // Убираем оставшиеся LaTeX команды
    formatted = formatted.replace(/\\[a-zA-Z]+/g, '');
    
    // НЕ убираем переносы строк! Только лишние пробелы в строках
    formatted = formatted.replace(/[ \t]+/g, ' '); // Убираем лишние пробелы и табы, но сохраняем \n
    formatted = formatted.replace(/\s*([+\-×÷=<>≤≥≠≈])\s*/g, ' $1 '); // Добавляем пробелы вокруг операторов
    formatted = formatted.replace(/\s*([()])\s*/g, '$1'); // Убираем пробелы вокруг скобок
    
    return formatted;
}

function formatTextForDisplay(text) {
    console.log('Входной текст для форматирования:', text);
    
    let formatted = text;
    
    // Убираем лишние пробелы в начале и конце
    formatted = formatted.trim();
    
    // Разбиваем по переносам строк
    let lines = formatted.split('\n');
    console.log('Разбитые строки:', lines);
    
    let processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        console.log(`Обрабатываем строку ${i}:`, line);
        
        // Пропускаем пустые строки
        if (!line) {
            processedLines.push('<br>');
            continue;
        }
        
        // Если строка начинается с цифры и точки (нумерованный список)
        if (/^\d+\.\s/.test(line)) {
            console.log('Найден нумерованный шаг:', line);
            processedLines.push(`<div class="numbered-step">${line}</div>`);
        }
        // Если строка начинается с ** (жирный заголовок)
        else if (/^\*\*.*\*\*$/.test(line)) {
            console.log('Найден заголовок:', line);
            const content = line.replace(/\*\*/g, '');
            processedLines.push(`<h4 class="solution-header">${content}</h4>`);
        }
        // Если строка содержит математические выражения
        else if (/[+\-×÷=<>≤≥≠≈√π]/.test(line)) {
            console.log('Найдено математическое выражение:', line);
            processedLines.push(`<div class="math-step">${line}</div>`);
        }
        // Если строка начинается с дефиса или звездочки (маркированный список)
        else if (/^[-*]\s/.test(line)) {
            console.log('Найден элемент списка:', line);
            processedLines.push(`<div class="list-item">${line}</div>`);
        }
        // Обычная строка
        else {
            console.log('Обычная строка:', line);
            processedLines.push(`<p class="solution-text">${line}</p>`);
        }
    }
    
    // Объединяем строки
    let result = processedLines.join('');
    console.log('Финальный результат:', result);
    
    return result;
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
}

function hideError() {
    errorSection.style.display = 'none';
}

function hideResult() {
    resultSection.style.display = 'none';
}

function setLoading(isLoading) {
    solveBtn.disabled = isLoading;
    if (isLoading) {
        btnText.style.display = 'none';
        spinner.style.display = 'block';
    } else {
        btnText.style.display = 'block';
        spinner.style.display = 'none';
    }
}

function resetApp() {
    selectedFile = null;
    fileInput.value = '';
    previewSection.style.display = 'none';
    uploadArea.style.display = 'block';
    hideResult();
    hideError();
    setLoading(false);
}

// Функции для работы с сервером
async function checkServerStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/status`);
        if (response.ok) {
            console.log('✅ Сервер доступен');
            return true;
        } else {
            throw new Error('Сервер недоступен');
        }
    } catch (error) {
        console.error('❌ Ошибка подключения к серверу:', error);
        showError('Сервер недоступен. Убедитесь, что сервер запущен на порту 3000');
        return false;
    }
}

function showApiKeySection() {
    // Больше не показываем секцию API ключа
    console.log('API ключ теперь скрыт на сервере');
}

function hideApiKeySection() {
    if (apiKeySection && apiKeySection.classList) {
        apiKeySection.classList.add('hidden');
    }
}
