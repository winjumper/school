// Конфигурация приложения
const CONFIG = {
    // API ключ будет загружен из localStorage или введен пользователем
    OPENROUTER_API_KEY: null,
    OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    
    // Загружаем API ключ из localStorage при инициализации
    loadApiKey: function() {
        const savedKey = localStorage.getItem('openrouter_api_key');
        if (savedKey && savedKey !== 'null' && savedKey !== '') {
            this.OPENROUTER_API_KEY = savedKey;
            return true;
        }
        return false;
    },
    
    // Сохраняем API ключ в localStorage
    saveApiKey: function(key) {
        if (key && key.trim() !== '') {
            this.OPENROUTER_API_KEY = key.trim();
            localStorage.setItem('openrouter_api_key', this.OPENROUTER_API_KEY);
            return true;
        }
        return false;
    },
    
    // Очищаем API ключ
    clearApiKey: function() {
        this.OPENROUTER_API_KEY = null;
        localStorage.removeItem('openrouter_api_key');
    },
    
    // Проверяем валидность API ключа
    isValidApiKey: function(key) {
        return key && key.trim() !== '' && key.startsWith('sk-or-v1-');
    }
};

