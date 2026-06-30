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
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
info() { echo -e "${CYAN}[...]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error(){ echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ============================================================
# 0. Проверка прав
# ============================================================
if [ "$(id -u)" -eq 0 ]; then
  error "Не запускайте скрипт от root. Используйте обычного пользователя с sudo."
fi

# ============================================================
# 1. Установка системных зависимостей
# ============================================================
info "Проверяем системные зависимости..."

# Обновление apt (тихо)
sudo apt-get update -qq

# Git
if ! command -v git >/dev/null 2>&1; then
  info "Устанавливаем git..."
  sudo apt-get install -y -qq git >/dev/null
  log "git установлен"
else
  log "git уже установлен ($(git --version))"
fi

# curl (нужен для установки Node.js)
if ! command -v curl >/dev/null 2>&1; then
  info "Устанавливаем curl..."
  sudo apt-get install -y -qq curl >/dev/null
  log "curl установлен"
fi

# ============================================================
# 2. Установка Node.js ( если не установлен или версия < 18)
# ============================================================
NEED_INSTALL_NODE=false

if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d'.' -f1)
  if [ "$NODE_VER" -ge 18 ] 2>/dev/null; then
    log "Node.js $(node -v) уже установлен"
  else
    warn "Node.js $(node -v) — слишком старая версия (нужна >= 18)"
    NEED_INSTALL_NODE=true
  fi
else
  warn "Node.js не найден"
  NEED_INSTALL_NODE=true
fi

if [ "$NEED_INSTALL_NODE" = true ]; then
  info "Устанавливаем Node.js 20.x через NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - >/dev/null 2>&1
  sudo apt-get install -y -qq nodejs >/dev/null
  log "Node.js $(node -v) установлен"
fi

# Проверка npm
if ! command -v npm >/dev/null 2>&1; then
  error "npm не установлен вместе с Node.js"
fi
log "npm $(npm -v) готов"

# ============================================================
# 3. Клонирование / обновление репозитория
# ============================================================
if [ -d "$DEPLOY_DIR/.git" ]; then
  info "Репозиторий существует, обновляем..."
  cd "$DEPLOY_DIR"
  git fetch origin
  LOCAL=$(git rev-parse HEAD)
  REMOTE=$(git rev-parse "origin/$BRANCH")
  if [ "$LOCAL" = "$REMOTE" ]; then
    log "Код уже актуален ($LOCAL)"
  else
    git reset --hard "origin/$BRANCH"
    log "Код обновлён до $REMOTE"
  fi
else
  info "Клонируем репозиторий..."
  sudo git clone -b "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
  sudo chown -R "$(id -u):$(id -g)" "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
  log "Репозиторий клонирован в $DEPLOY_DIR"
fi

# ============================================================
# 4. Установка npm-зависимостей
# ============================================================
info "Устанавливаем npm-зависимости..."
cd "$DEPLOY_DIR"
npm ci --no-fund --no-audit 2>&1 | tail -1
log "Зависимости установлены"

# ============================================================
# 5. Сборка production билда
# ============================================================
info "Собираем production билд..."
npm run build 2>&1 | tail -3
log "Билд готов (dist/)"

# ============================================================
# 6. Создание systemd-сервиса
# ============================================================
SERVICE_FILE="/etc/systemd/system/$APP_NAME.service"

if [ ! -f "$SERVICE_FILE" ]; then
  info "Создаём systemd-сервис..."

  sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=IPTV Web Player
After=network.target

[Service]
Type=simple
User=$(whoami)
Group=$(id -gn)
WorkingDirectory=$DEPLOY_DIR
ExecStart=$(which node) $DEPLOY_DIR/dist/server.cjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=APP_URL=$APP_URL

NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable "$APP_NAME" --quiet
  log "Systemd-сервис создан и активирован"
else
  log "Systemd-сервис уже существует"
fi

# ============================================================
# 7. Перезапуск сервиса
# ============================================================
info "Перезапускаем сервис..."
sudo systemctl restart "$APP_NAME"
sleep 2

if sudo systemctl is-active --quiet "$APP_NAME"; then
  log "Сервис работает"
else
  warn "Сервис не запустился. Логи:"
  sudo journalctl -u "$APP_NAME" -n 15 --no-pager
  exit 1
fi

# ============================================================
# Готово
# ============================================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Деплой завершён успешно!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  URL:      ${CYAN}http://localhost:$PORT${NC}"
echo -e "  Сервис:   sudo systemctl status $APP_NAME"
echo -e "  Логи:     sudo journalctl -u $APP_NAME -f"
echo -e "  Рестарт:  sudo systemctl restart $APP_NAME"
echo -e "  Обновить: cd $DEPLOY_DIR && git pull && npm run build && sudo systemctl restart $APP_NAME"
echo ""
