#!/bin/bash
set -e

APP_NAME="iptv-player"
REPO_URL="https://github.com/lexeyultra/IPTV-player.git"
DEPLOY_DIR="/opt/$APP_NAME"
BRANCH="main"
PORT="${PORT:-3000}"
APP_URL="${APP_URL:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- Проверки ---
command -v node >/dev/null 2>&1 || error "Node.js не установлен. Установите: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
command -v npm >/dev/null 2>&1 || error "npm не установлен"
command -v git >/dev/null 2>&1 || error "git не установлен"

NODE_VERSION=$(node -v | cut -d'v' -2 | cut -d'.' -f1)
[ "$NODE_VERSION" -ge 18 ] || error "Требуется Node.js >= 18. Текущая версия: $(node -v)"

# --- Шаг 1: Клонирование / обновление ---
if [ -d "$DEPLOY_DIR/.git" ]; then
  log "Репозиторий уже существует, обновляем..."
  cd "$DEPLOY_DIR"
  git fetch origin
  git reset --hard "origin/$BRANCH"
else
  log "Клонируем репозиторий в $DEPLOY_DIR..."
  sudo git clone -b "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
  sudo chown -R $(whoami):$(whoami) "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
fi

# --- Шаг 2: Установка зависимостей и сборка ---
log "Устанавливаем зависимости..."
npm ci

log "Собираем production билд..."
npm run build

# --- Шаг 3: Создание systemd-сервиса ---
if [ ! -f /etc/systemd/system/$APP_NAME.service ]; then
  log "Создаём systemd сервис..."

  sudo tee /etc/systemd/system/$APP_NAME.service > /dev/null <<EOF
[Unit]
Description=IPTV Web Player
After=network.target

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/bin/node $DEPLOY_DIR/dist/server.cjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=APP_URL=$APP_URL

NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadOnlyPaths=$DEPLOY_DIR
ReadWritePaths=$DEPLOY_DIR

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable $APP_NAME
  log "Systemd сервис создан и активирован"
fi

# --- Шаг 4: Перезапуск ---
log "Перезапускаем сервис..."
sudo systemctl restart $APP_NAME

# --- Шаг 5: Проверка ---
sleep 2
if sudo systemctl is-active --quiet $APP_NAME; then
  log "Сервис запущен и работает на порту $PORT"
else
  error "Сервис не запустился. Проверьте: sudo journalctl -u $APP_NAME -n 20"
fi

echo ""
log "=== Деплой завершён ==="
log "URL: http://localhost:$PORT"
log "Логи: sudo journalctl -u $APP_NAME -f"
log "Статус: sudo systemctl status $APP_NAME"
log "Перезапуск: sudo systemctl restart $APP_NAME"
