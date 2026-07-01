# 📺 IPTV Web Player

Современный веб-плеер для IPTV-телевидения с поддержкой HLS-потоков, M3U-плейлистов и TV-интерфейса. Разработан на React 19 + Vite + Tailwind CSS v4.

**Демо**: https://lexeyultra.github.io/IPTV-player

---

## Ключевые возможности

### Видеоплеер
- HLS-воспроизведение через [Hls.js](https://github.com/video-dev/hls.js/) с нативным fallback для Safari
- Режимы масштабирования: Вписать / Заполнить / Растянуть
- Полноэкранный режим (двойной клик / двойной тап / клавиша F)
- Двойной тап работает одинаково в портретном и горизонтальном режиме
- Автоскрытие контролов: 3 сек на мобильных, 15 сек на десктопе
- OSD-уведомления при изменении громкости, канала, таймера

### Навигация
- TV-режим с D-Pad навигацией (клавиши стрелок + Enter/Esc)
- Боковая панель каналов с backdrop-blur
- Горизонтальная полоса категорий с подсчётом каналов
- Текстовый поиск по названию и группе

### Управление
- Таймер сна с быстрыми кнопками ±5мин
- Автопереключение на следующий канал при ошибке потока (10 сек обратный отсчёт)
- Система избранного с persistенцией в localStorage
- Мульти-плейлист менеджер (M3U URL, HLS поток, M3U текст, загрузка файла)

### Мобильные устройства
- Оптимизированный интерфейс для смартфонов и планшетов
- Адаптивная сетка каналов (4-5 колонок)
- Компактный Volume HUD для мобильных
- Быстрое скрытие контролов (3 сек)

### ТВ и Smart TV
- Автоопределение ТВ-устройств (webOS, Tizen, Android TV, и др.)
- D-Pad навигация с визуальным пультом
- Мост к нативным API: Android WebView, Samsung Tizen
- Вертикальный Volume HUD в стиле Android TV

---

## Стек технологий

| Слой | Технология |
|---|---|
| UI | React 19 + TypeScript 5.8 |
| Сборка | Vite 6 |
| Стили | Tailwind CSS 4 |
| Анимации | Motion (Framer Motion) |
| Иконки | Lucide React |
| Видео | Hls.js |
| Бэкенд | Express 4 + Helmet + Rate Limiting |
| Тесты | Vitest (72 теста) |
| Контейнеризация | Docker + docker-compose |

---

## Архитектура

```
src/
├── App.tsx                    # Главный компонент (~1560 строк)
├── main.tsx                   # Точка входа с ErrorBoundary
├── ErrorBoundary.tsx          # Обработка ошибок рендера
├── hooks/                     # 11 кастомных хуков
│   ├── usePlayer.ts           # HLS, play/pause, volume, auto-play
│   ├── usePlaylist.ts         # Загрузка, парсинг, savedItems, localStorage
│   ├── useChannelScanner.ts   # Сканирование доступности каналов
│   ├── useFavorites.ts        # Избранное
│   ├── useSleepTimer.ts       # Таймер сна
│   ├── useDeviceDetection.ts  # Определение устройства
│   ├── useFullscreen.ts       # Fullscreen API
│   ├── useControlsTimer.ts    # Auto-hide controls (3s mobile / 15s desktop)
│   ├── useVolumeHud.ts        # Volume HUD
│   ├── useOsd.ts              # OSD уведомления
│   └── useParserLogs.ts       # Логи парсера (лимит 200)
├── components/
│   ├── SettingsModal.tsx       # Настройки плейлистов
│   └── ChannelLogo.tsx        # Логотип канала с fallback
├── samplePlaylist.ts           # M3U парсер, категории, логотипы
├── kotlinCode.ts               # Kotlin/Compose код (архив)
├── types.ts                    # TypeScript интерфейсы
└── __tests__/                  # Тесты
    ├── samplePlaylist.test.ts  # 35 тестов парсера
    ├── hooks.test.ts           # 20 тестов хуков
    └── server.test.ts          # 17 тестов серверной логики

server.ts                       # Express сервер (proxy, check-stream)
Dockerfile                      # Multi-stage Docker сборка
docker-compose.yml              # Docker Compose конфигурация
deploy.sh                       # Автоматический деплой на Ubuntu
```

---

## Команды

```bash
npm install          # Установка зависимостей
npm run dev          # Dev-сервер на http://localhost:3000
npm run build        # Production сборка в dist/
npm run start        # Запуск production сервера
npm test             # Запуск тестов (72 теста)
npm run test:watch   # Watch-режим тестов
npm run lint         # ESLint проверка
npm run typecheck    # TypeScript проверка
npm run format       # Prettier форматирование

# Docker
docker compose up -d           # Запуск в Docker
docker compose down            # Остановка
docker compose logs -f         # Логи

# Деплой на сервер
./deploy.sh                    # Автоматический деплой
```

---

## Безопасность

- **Rate Limiting**: 30 req/min на прокси, 60 req/min на проверку потоков
- **SSRF Protection**: DNS-резолв с проверкой IP, блокировка приватных/loopback адресов
- **Security Headers**: Helmet (X-Content-Type-Options, X-Frame-Options и др.)
- **CORS**: Access-Control-Allow-Origin настраивается через `APP_URL` env
- **Ошибка потока**: Клиенту возвращаются generic сообщения без внутренних деталей

---

## Горячие клавиши

| Клавиша | Действие |
|---|---|
| `Space` | Пауза / Воспроизведение |
| `M` | Вкл/Выкл звук |
| `F` | Во весь экран |
| `+` / `-` | Громкость ±5% |
| `↑ ↓ ← →` | Навигация в TV-режиме |
| `Enter` | Выбор канала |
| `Esc` | Назад к категориям |

---

## Сборка под платформы

- **PWA**: Установка как веб-приложение (работает из коробки)
- **Android APK**: Через [Capacitor](https://capacitorjs.com/)
- **Desktop**: Через [Tauri](https://tauri.app/) или [Electron](https://www.electronjs.org/)
- **GitHub Pages**: Автодеплой через GitHub Actions

---

## Деплой одним скриптом

Скрипт `deploy.sh` автоматизирует полный цикл: клонирование → установка Node.js → сборка → systemd → запуск.

```bash
git clone https://github.com/lexeyultra/IPTV-player.git
cd IPTV-player
chmod +x deploy.sh

# Запуск (порт по умолчанию 3000)
./deploy.sh

# Или с настройками
PORT=9393 ./deploy.sh
```

Скрипт автоматически: устанавливает Node.js 20 если нет, клонирует/обновляет репозиторий, собирает билд, создаёт systemd-сервис, запускает и проверяет статус.

---

## Docker

```bash
# Сборка и запуск
docker compose up -d

# Или с настройками
PORT=8080 APP_URL=https://iptv.example.com docker compose up -d

# Управление
docker compose ps              # Статус
docker compose logs -f         # Логи
docker compose restart         # Перезапуск
docker compose down            # Остановка
docker compose up -d --build   # Пересборка и запуск
```

---

## Развёртывание на Ubuntu Server

### Быстрый старт

```bash
# 1. Установить Node.js, git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git

# 2. Клонировать и собрать
cd /opt
sudo git clone https://github.com/lexeyultra/IPTV-player.git iptv-player
sudo chown -R $USER:$USER /opt/iptv-player
cd /opt/iptv-player && npm ci && npm run build

# 3. Запустить
./deploy.sh PORT=9393
```

### Настройка Nginx + SSL

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Конфиг /etc/nginx/sites-available/iptv-player:
server {
    listen 80;
    server_name your-domain.com;
    location / { return 301 https://$server_name$request_uri; }
}
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    location / {
        proxy_pass http://127.0.0.1:9393;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Активация
sudo ln -s /etc/nginx/sites-available/iptv-player /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

### Мониторинг

```bash
sudo journalctl -u iptv-player -f     # Логи
sudo systemctl status iptv-player      # Статус
sudo systemctl restart iptv-player     # Перезапуск
```

---

## Окружение

| Переменная | Описание | По умолчанию |
|---|---|---|
| `PORT` | Порт сервера | `3000` |
| `APP_URL` | URL приложения (для CORS) | `*` |
| `HOST` | Привязка сервера | `0.0.0.0` |
| `NODE_ENV` | Режим (`production` / иное) | - |
