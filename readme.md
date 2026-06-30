# 📺 IPTV Web Player

Современный веб-плеер для IPTV-телевидения с поддержкой HLS-потоков, M3U-плейлистов и нативного TV-интерфейса. Разработан на React 19 + Vite + Tailwind CSS v4.

**Демо**: https://lexeyultra.github.io/IPTV-player

---

## Ключевые возможности

### Видеоплеер
- HLS-воспроизведение через [Hls.js](https://github.com/video-dev/hls.js/) с нативным fallback для Safari
- Режимы масштабирования: Вписать / Заполнить / Растянуть
- Полноэкранный режим (двойной клик / клавиша F)
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

### Устройства
- Автоопределение: ТВ / Смартфон / ПК по User-Agent
- Автопереход в TV-режим на Smart TV платформах
- Мост к нативным API: Android WebView, Samsung Tizen
- Volume HUD: вертикальный (ТВ) / компактный (смартфон)

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

## Окружение

| Переменная | Описание | По умолчанию |
|---|---|---|
| `PORT` | Порт сервера | `3000` |
| `APP_URL` | URL приложения (для CORS) | `*` |
| `NODE_ENV` | Режим (`production` / иное) | - |
