const express = require('express');
const cors = require('cors');
const path = require('path');
// Загружаем переменные окружения из .env (локальная разработка)
try { require('dotenv').config(); } catch (_) {}
// Поддержка fetch для Node.js < 18
const fetchFn = typeof fetch === 'function' ? fetch : ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

const app = express();
const PORT = process.env.PORT || 3000;

// Скрытый API ключ (берем из переменной окружения)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname)));

// Маршрут для проксирования запросов к OpenRouter API
app.post('/api/solve-task', async (req, res) => {
    try {
        const { messages, model = 'openai/gpt-4o', max_tokens = 2000, temperature = 0.3 } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages format' });
        }

        const response = await fetchFn(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.get('origin') || 'http://localhost:3000',
                'X-Title': 'School Task Solver'
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens,
                temperature
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Маршрут для проверки статуса сервера
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'School Task Solver API is running',
        timestamp: new Date().toISOString()
    });
});

// Обслуживание статических файлов
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📚 Откройте http://localhost:${PORT} в браузере`);
    console.log(`🔑 API ключ скрыт на сервере`);
});

// Обработка ошибок
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

