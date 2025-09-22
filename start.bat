@echo off
echo ========================================
echo   Запуск сервера School Task Solver
echo ========================================
echo.

echo Проверка Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ОШИБКА: Node.js не установлен!
    echo Скачайте и установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

echo Установка зависимостей...
npm install
if %errorlevel% neq 0 (
    echo ОШИБКА: Не удалось установить зависимости (npm install)
    echo Пожалуйста, проверьте подключение к интернету и права доступа, затем повторите попытку.
    pause
    exit /b 1
)

echo.
echo Запуск сервера...
echo Откройте http://localhost:3000 в браузере
echo.

npm start
echo.
echo Сервер завершил работу. Код выхода: %errorlevel%
echo Нажмите любую клавишу, чтобы закрыть окно...
pause

