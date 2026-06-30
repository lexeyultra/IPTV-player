# Инструкция по сборке приложения в исполняемые файлы (.apk, .exe, .deb)

В этом руководстве описаны полностью бесплатные, современные и проверенные способы упаковки вашего веб-приложения на React + Vite в нативные исполняемые файлы для различных платформ: **PWA (установка прямо из браузера)**, **Android (.apk)**, **Windows (.exe)** и **Ubuntu Desktop (.deb)**.

---

## ⚡️ Самый простой и удобный способ: PWA (Прогрессивное веб-приложение)

Мы уже добавили полную поддержку **PWA** в код вашего приложения! Это означает, что после развертывания веб-версии на хостинге (например, GitHub Pages, Vercel или Cloud Run), пользователи могут установить его на свои устройства **без необходимости скачивать файлы .apk или .exe**.

### Как это работает:
1. При посещении сайта в строке браузера (в Chrome, Edge, Safari и др.) появится кнопка **"Установить приложение"** (или иконка монитора со стрелочкой).
2. На смартфонах Android и iOS достаточно нажать на три точки (или кнопку "Поделиться" в Safari) и выбрать **"Добавить на главный экран"** (Add to Home Screen).
3. Приложение установится на смартфон, планшет или ПК, на рабочем столе **появится нативная иконка**, а само приложение будет открываться в полноэкранном режиме (без рамок браузера), работая как нативное!

---

---

## 🌐 Пошаговая инструкция по деплою на GitHub Pages

Чтобы ваше PWA-приложение было доступно всему миру по ссылке `https://lexeyultra.github.io/IPTV-player/`, и пользователи могли устанавливать его как приложение на телефон или компьютер, следуйте этой простой инструкции.

Мы уже внесли необходимые изменения: в файле `vite.config.ts` настроен относительный базовый путь (`base: './'`), благодаря чему ваше приложение будет идеально работать на любом адресе репозитория без ошибок путей!

### 🛠 Способ 1. Самый простой (автоматический деплой через GitHub Actions)

Вам не нужно ничего собирать вручную! GitHub сам будет собирать и публиковать приложение при каждом новом коммите.

**Мы уже автоматически создали правильный файл `deploy.yml` по пути `.github/workflows/deploy.yml` в вашем проекте!**
Вам больше не нужно создавать его вручную. Ошибка в вашем GitHub возникла из-за того, что при ручном копировании в файл случайно попали символы разметки ```yaml в начале и ``` в конце. Мы исправили это, создав для вас чистый YAML-файл. Просто закомитьте и отправьте его (push) на GitHub!

Если вы захотите пересоздать его вручную, вот его точное содержимое (убедитесь, что в файле нет посторонних символов, таких как тройные обратные кавычки в начале и конце):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main # или master, в зависимости от вашей ветки по умолчанию

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```
2. **Отправьте (push) изменения в ваш репозиторий GitHub**:
   После отправки файла `deploy.yml` GitHub автоматически запустит сборку на вкладке **Actions**.
3. **Включите GitHub Pages в настройках репозитория**:
   * На странице репозитория на GitHub перейдите в **Settings** (Настройки) > **Pages** (в левой колонке).
   * В разделе **Build and deployment** > **Source** выберите **GitHub Actions** вместо *Deploy from a branch*.
   * Через пару минут ваше приложение опубликуется, и сверху появится ссылка!

> ⚠️ **Важная деталь (Устранение ошибки `Get Pages site failed` / `HttpError: Not Found` на шаге "Setup Pages"):**
>
> Если ваш экшен упал с ошибкой на шаге **Setup Pages**, это означает, что вы еще не переключили источник деплоя в настройках GitHub. 
> 
> **Как это исправить за 10 секунд:**
> 1. Зайдите в ваш репозиторий: `https://github.com/lexeyultra/IPTV-player`
> 2. Сверху нажмите на вкладку **Settings** ⚙️ (Настройки).
> 3. В левом меню выберите раздел **Pages** 📄.
> 4. Найдите блок **Build and deployment** -> подзаголовок **Source**.
> 5. В выпадающем списке смените **Deploy from a branch** на **GitHub Actions**.
> 6. После этого вернитесь на вкладку **Actions**, выберите упавшую сборку и нажмите кнопку **Re-run all jobs** (или просто отправьте любой коммит в репозиторий). Теперь деплой пройдет успешно!

---

### 📦 Способ 2. Ручной деплой с помощью пакета `gh-pages`

Если вы предпочитаете публиковать приложение вручную одной командой из терминала:

1. Установите пакет `gh-pages` как dev-зависимость:
   ```bash
   npm install --save-dev gh-pages
   ```
2. Откройте `package.json` и добавьте в секцию `"scripts"` новые скрипты:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Также добавьте поле `"homepage"` на верхнем уровне в `package.json`:
   ```json
   "homepage": "https://lexeyultra.github.io/IPTV-player"
   ```
4. Выполните команду в терминале:
   ```bash
   npm run deploy
   ```
   *Пакет автоматически создаст ветку `gh-pages` в вашем репозитории и загрузит туда собранную папку `dist`.*
5. В настройках репозитория **Settings** > **Pages** выберите ветку `gh-pages` и папку `/ (root)`, затем нажмите **Save**.

---

## ❌ Решение ошибки сборки APK на GitHub: "Исходный Котлин-файл не найден"

Если при автоматической сборке в GitHub Actions вы столкнулись с ошибкой:
> **`Force Create Android Project Structure - ОШИБКА: Исходный Котлин-файл от AI Studio не найден в репозитории!`**

### Почему это произошло:
Этот репозиторий изначально был создан на шаблоне Android-приложения от AI Studio (которое использует Kotlin/Jetpack Compose). Однако теперь проект полностью переведен на сверхсовременную архитектуру **React + Vite (Web)**. GitHub-экшен пытается найти Котлин-файл для сборки нативного Android-приложения, но видит только веб-проект React, из-за чего прерывает сборку.

### Как это исправить:
1. **Перейдите на вкладку "Actions"** в вашем репозитории на GitHub.
2. Отключите или удалите экшен, нацеленный на сборку нативного Котлина (обычно это `.github/workflows/android.yml`).
3. Вместо этого настройте стандартную сборку и деплой веб-приложения на **GitHub Pages** (чтобы развернуть PWA с поддержкой установки иконки!).
4. Если вы хотите собрать именно нативный `.apk`, следуйте инструкции ниже через **Capacitor**, который упакует этот React-код в контейнер Android.

---

## 📱 Сборка для Android (.apk) через Capacitor

Для сборки под Android мы будем использовать **Capacitor** (современный преемник Cordova от команды Ionic). Он позволяет запускать веб-код внутри нативного контейнера WebView с доступом к системным API.

### Предварительные требования:
1. Установленный **Node.js** (у вас уже есть).
2. Установленная **Java Development Kit (JDK 17)**.
3. Установленный **Android Studio** (с Android SDK).

---

### Пошаговое руководство (Capacitor):

#### Шаг 1. Сборка веб-версии приложения
Убедитесь, что ваше приложение собирается без ошибок:
```bash
npm run build
```
После этого в корне проекта появится папка `dist` со статическими файлами.

#### Шаг 2. Установка и инициализация Capacitor
Установите ядро Capacitor и CLI в ваш проект:
```bash
npm install @capacitor/core @capacitor/cli
```
Инициализируйте проект Capacitor (введите имя приложения и уникальный Package ID, например `com.myiptvplayer.app`):
```bash
npx cap init
```
*При запросе "Web asset directory" укажите папку сборки Vite: `dist`.*

#### Шаг 3. Добавление платформы Android
Установите Android-пакет и добавьте платформу в проект:
```bash
npm install @capacitor/android
npx cap add android
```

#### Шаг 4. Синхронизация файлов
Копируйте собранный веб-код из папки `dist` в проект Android:
```bash
npx cap sync
```
*(Эту команду нужно запускать каждый раз, когда вы меняете код приложения и заново делаете `npm run build`)*

#### Шаг 5. Сборка релизного APK в Android Studio
Откройте проект в Android Studio одной командой:
```bash
npx cap open android
```
В Android Studio:
1. Подождите, пока завершится синхронизация Gradle (это может занять несколько минут при первом запуске).
2. В верхнем меню выберите **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. После завершения сборки в правом нижнем углу появится уведомление. Нажмите кнопку **Locate**, чтобы открыть папку с готовым файлом `app-debug.apk` (или настройте подпись ключом в *Generate Signed Bundle / APK* для создания релизного `.apk`).

---

## 💻 Сборка для Windows (.exe) & Ubuntu (.deb)

Для настольных платформ лучшим выбором на сегодняшний день является **Tauri** (написан на Rust). Он гораздо производительнее и легче, чем Electron: готовый файл весит **10-15 МБ** вместо 80-100 МБ, так как использует системный движок рендеринга (WebView2 в Windows, WebKitGTK в Linux) вместо упаковки всего Chromium.

### Предварительные требования:
* **Для Windows**: Установите [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) и [Rust](https://www.rust-lang.org/tools/install).
* **Для Ubuntu**: Установите системные зависимости и Rust через терминал:
  ```bash
  sudo apt update
  sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

---

### Пошаговое руководство (Tauri):

#### Шаг 1. Инициализация Tauri в проекте
В корне вашего React-проекта выполните команду инициализации:
```bash
npx tauri init
```
Мастер настройки задаст несколько вопросов:
* **What is your app name?** -> Например, `IPTV Player`
* **What is your window title?** -> Например, `My IPTV Player`
* **Where are your web assets located?** -> `../dist` (путь к собранным файлам Vite относительно папки `src-tauri`)
* **What is the url of your dev server?** -> `http://localhost:3000` (или `http://localhost:5173`)
* **What is your frontend build command?** -> `npm run build`
* **What is your frontend dev command?** -> `npm run dev`

#### Шаг 2. Настройка идентификатора приложения
Откройте созданный файл `src-tauri/tauri.conf.json` и найдите поле `"identifier"`. Замените значение по умолчанию (`com.tauri.dev`) на ваше уникальное значение, например:
```json
"identifier": "com.myiptvplayer.desktop"
```

#### Шаг 3. Запуск в режиме разработки (Опционально)
Вы можете запустить приложение в виде десктопного окна прямо в режиме разработки:
```bash
npx tauri dev
```

#### Шаг 4. Сборка исполняемых файлов

##### Сборка под Windows (.exe):
Выполните команду на компьютере с Windows:
```bash
npx tauri build
```
Готовый `.exe` установщик (а также `.msi`) будет находиться по адресу:
`src-tauri/target/release/bundle/msi/...` и автономный `.exe` в `src-tauri/target/release/...`.

##### Сборка под Ubuntu Linux (.deb):
Выполните команду на компьютере с Ubuntu:
```bash
npx tauri build
```
Готовый установочный пакет `.deb` (а также универсальный `AppImage`) будет находиться по адресу:
`src-tauri/target/release/bundle/deb/...`

---

## 🛠 Альтернативный способ для Windows и Ubuntu: Electron

Если вы не хотите устанавливать Rust, можно воспользоваться классическим **Electron**, хотя сборка будет весить больше.

### Пошаговый Electron (с electron-builder):

1. Установите необходимые пакеты:
   ```bash
   npm install --save-dev electron electron-builder concurrentally wait-on
   ```
2. Создайте файл `main.js` в корне вашего проекта:
   ```javascript
   const { app, BrowserWindow } = require('electron');
   const path = require('path');

   function createWindow() {
     const win = new BrowserWindow({
       width: 1280,
       height: 720,
       webPreferences: {
         nodeIntegration: false,
         contextIsolation: true
       },
       autoHideMenuBar: true
     });

     // В продакшене загружаем собранный dist/index.html
     if (app.isPackaged) {
       win.loadFile(path.join(__dirname, 'dist', 'index.html'));
     } else {
       win.loadURL('http://localhost:3000');
     }
   }

   app.whenReady().then(createWindow);

   app.on('window-all-closed', () => {
     if (process.platform !== 'darwin') app.quit();
   });
   ```
3. Добавьте конфигурацию сборки в `package.json`:
   ```json
   {
     "main": "main.js",
     "scripts": {
       "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:3000 && electron .\"",
       "electron:build": "npm run build && electron-builder"
     },
     "build": {
       "appId": "com.myiptvplayer.app",
       "files": [
         "dist/**/*",
         "main.js"
       ],
       "win": {
         "target": "nsis"
       },
       "linux": {
         "target": "deb"
       }
     }
   }
   ```
4. Запустите сборку:
   * Для Windows (.exe): `npm run electron:build -- --win`
   * Для Ubuntu (.deb): `npm run electron:build -- --linux deb`
