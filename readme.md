# 📺 IPTV Web Player

Современный веб-плеер для IPTV-телевидения с поддержкой HLS-потоков, M3U-плейлистов и нативного TV-интерфейса. Разработан на React 19 + Vite + Tailwind CSS v4.

**Демо**: https://lexeyultra.github.io/IPTV-player

---

## Ключевые возможности

### Видеоплеер
- HLS-воспроизведение через [Hls.js](https://github.com/video-dev/hls.js/) с нативным fallback для Safari
- Режимы масштабирования: Вписать / Заполнить / Растянуть
- Полноэкранный режим (двойной клик / клавиша F)
- Двойной тап работает одинаково в портретном и горизонтальном режиме (вход/выход фуллскрина)
- Автоскрытие контролов через 15 секунд неактивности
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
- Сворачиваемые контролы для максимальной площади просмотра

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
| Тесты | Vitest |

---

## Архитектура

```
src/
├── App.tsx                    # Главный компонент (~1550 строк)
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
│   ├── useControlsTimer.ts    # Auto-hide controls
│   ├── useVolumeHud.ts        # Volume HUD
│   ├── useOsd.ts              # OSD уведомления
│   └── useParserLogs.ts       # Логи парсера (лимит 200)
├── components/
│   ├── SettingsModal.tsx       # Настройки, Kotlin код, инструкции
│   └── ChannelLogo.tsx        # Логотип канала с fallback
├── samplePlaylist.ts           # M3U парсер, категории, логотипы
├── kotlinCode.ts               # Kotlin/Compose код для Android
├── types.ts                    # TypeScript интерфейсы
└── __tests__/                  # Тесты
    ├── samplePlaylist.test.ts  # 35 тестов парсера
    ├── hooks.test.ts           # 20 тестов хуков
    └── server.test.ts          # 17 тестов серверной логики

server.ts                       # Express сервер (proxy, check-stream)
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

Полное руководство в **[deploy.md](./deploy.md)**:

- **PWA**: Установка как веб-приложение (работает из коробки)
- **Android APK**: Через [Capacitor](https://capacitorjs.com/)
- **Desktop**: Через [Tauri](https://tauri.app/) или [Electron](https://www.electronjs.org/)
- **GitHub Pages**: Автодеплой через GitHub Actions

---

## Деплой одним скриптом

Скрипт `deploy.sh` автоматизирует полный цикл: клонирование → сборка → systemd → запуск.

```bash
# Клонируйте и запустите
git clone https://github.com/lexeyultra/IPTV-player.git
cd IPTV-player
chmod +x deploy.sh

# Запуск (порт по умолчанию 3000)
./deploy.sh

# Или с настройками
PORT=8080 APP_URL=https://iptv.example.com ./deploy.sh
```

Скрипт проверяет: Node.js >= 18, git, создаёт systemd-сервис, собирает билд, запускает и проверяет статус.

---

## Docker

### Сборка и запуск

```bash
# Сборка образа и запуск
docker compose up -d

# Или через docker
docker build -t iptv-player .
docker run -d -p 3000:3000 --name iptv-player iptv-player
```

### Docker Compose с настройками

```bash
# С переменными окружения
PORT=8080 APP_URL=https://iptv.example.com docker compose up -d
```

### Управление

```bash
docker compose ps          # Статус
docker compose logs -f     # Логи
docker compose restart     # Перезапуск
docker compose down        # Остановка
docker compose up -d --build  # Пересборка и запуск
```

### Healthcheck

Контейнер автоматически проверяет доступность каждые 30 секунд:
```bash
docker inspect --format='{{.State.Health.Status}}' iptv-player
```

---

## Развёртывание на Ubuntu Server

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 18+ и npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка версий
node -v   # >= 18.x
npm -v    # >= 9.x

# Установка git (если не установлен)
sudo apt install -y git
```

### 2. Клонирование и сборка

```bash
# Клонирование репозитория
cd /opt
sudo git clone https://github.com/lexeyultra/IPTV-player.git iptv-player
sudo chown -R $USER:$USER /opt/iptv-player

cd /opt/iptv-player

# Установка зависимостей и сборка
npm ci --production=false
npm run build
```

### 3. Настройка systemd-сервиса

Создайте файл `/etc/systemd/system/iptv-player.service`:

```ini
[Unit]
Description=IPTV Web Player
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/iptv-player
ExecStart=/usr/bin/node dist/server.cjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=APP_URL=https://your-domain.com

# Безопасность
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadOnlyPaths=/opt/iptv-player
ReadWritePaths=/opt/iptv-player

[Install]
WantedBy=multi-user.target
```

Активация и запуск:

```bash
# Перемещение файлов в директорию www-data
sudo chown -R www-data:www-data /opt/iptv-player

# Включение и запуск сервиса
sudo systemctl daemon-reload
sudo systemctl enable iptv-player
sudo systemctl start iptv-player

# Проверка статуса
sudo systemctl status iptv-player
```

### 4. Настройка Nginx (рекомендуется)

Установка и настройка Nginx как reverse proxy с SSL:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Создайте конфиг `/etc/nginx/sites-available/iptv-player`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Редирект на HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL (получится автоматически через certbot)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 30s;
        proxy_connect_timeout 7s;
    }

    # Кэширование статических файлов
    location /assets/ {
        proxy_pass http://127.0.0.1:3000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket HMR (для dev, в production не нужен)
    # location /ws {
    #     proxy_pass http://127.0.0.1:3000;
    #     proxy_http_version 1.1;
    #     proxy_set_header Upgrade $http_upgrade;
    #     proxy_set_header Connection "upgrade";
    # }
}
```

Активация:

```bash
sudo ln -s /etc/nginx/sites-available/iptv-player /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Получение SSL-сертификата
sudo certbot --nginx -d your-domain.com
sudo systemctl enable certbot.timer
```

### 5. Автоматическое обновление

Создайте скрипт `/opt/iptv-player/update.sh`:

```bash
#!/bin/bash
cd /opt/iptv-player
git pull origin main
npm ci --production=false
npm run build
sudo systemctl restart iptv-player
echo "[$(date)] IPTV Player updated and restarted" >> /var/log/iptv-update.log
```

```bash
chmod +x /opt/iptv-player/update.sh
```

Crontab для автоматического обновления каждый день в 4:00:

```bash
sudo crontab -e
# Добавить строку:
0 4 * * * /opt/iptv-player/update.sh
```

### 6. Мониторинг

```bash
# Просмотр логов
sudo journalctl -u iptv-player -f

# Проверка статуса
sudo systemctl status iptv-player

# Перезапуск
sudo systemctl restart iptv-player

# Проверка порта
sudo ss -tlnp | grep 3000
```

### Порядок команд (быстрый старт)

```bash
# 1. Установить Node.js, git
sudo apt update && sudo apt install -y nodejs npm git

# 2. Клонировать и собрать
cd /opt && sudo git clone https://github.com/lexeyultra/IPTV-player.git iptv-player
sudo chown -R $USER:$USER /opt/iptv-player
cd /opt/iptv-player && npm ci && npm run build

# 3. Настроить systemd
sudo cp /opt/iptv-player/deploy/iptv-player.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now iptv-player

# 4. Настроить Nginx + SSL
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp /opt/iptv-player/deploy/nginx.conf /etc/nginx/sites-available/iptv-player
sudo ln -s /etc/nginx/sites-available/iptv-player /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

---

## Окружение

| Переменная | Описание | По умолчанию |
|---|---|---|
| `PORT` | Порт сервера | `3000` |
| `APP_URL` | URL приложения (для CORS) | `*` |
| `NODE_ENV` | Режим (`production` / иное) | - |
