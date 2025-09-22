#!/bin/bash

echo "========================================"
echo "   Запуск сервера School Task Solver"
echo "========================================"
echo

echo "Проверка Node.js..."
if ! command -v node &> /dev/null; then
    echo "ОШИБКА: Node.js не установлен!"
    echo "Скачайте и установите Node.js с https://nodejs.org/"
    exit 1
fi

echo "Установка зависимостей..."
npm install

echo
echo "Запуск сервера..."
echo "Откройте http://localhost:3000 в браузере"
echo

npm start

