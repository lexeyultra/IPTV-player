import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Settings, 
  X, 
  Database, 
  Code, 
  FileText, 
  ListVideo, 
  Trash2, 
  Plus, 
  Upload, 
  Save, 
  Check, 
  Copy, 
  Download,
  RefreshCw
} from "lucide-react";
import { SavedItem } from "../types";
import { KOTLIN_FILES } from "../kotlinCode";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedItems: SavedItem[];
  activePlaylistId: string;
  onLoadSavedItem: (item: SavedItem) => void;
  onDeleteSavedItem: (id: string, e: React.MouseEvent) => void;
  onAddSavedItem: (name: string, type: "m3u_url" | "m3u_raw" | "single_stream", content: string) => void;
  isAutoPlayEnabled: boolean;
  setIsAutoPlayEnabled: (enabled: boolean) => void;
  onScanActivePlaylist: () => void;
  isScanning: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  savedItems,
  activePlaylistId,
  onLoadSavedItem,
  onDeleteSavedItem,
  onAddSavedItem,
  isAutoPlayEnabled,
  setIsAutoPlayEnabled,
  onScanActivePlaylist,
  isScanning,
}) => {
  const [settingsActiveTab, setSettingsActiveTab] = useState<"playlists" | "code" | "instructions">("playlists");

  // Form states for adding a new item
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistType, setNewPlaylistType] = useState<"m3u_url" | "m3u_raw" | "single_stream">("m3u_url");
  const [newPlaylistContent, setNewPlaylistContent] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Kotlin source viewer states
  const [activeKotlinFileIdx, setActiveKotlinFileIdx] = useState<number>(0);
  const [copiedFileIdx, setCopiedFileIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  const fallbackCopyText = (text: string, index: number) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setCopiedFileIdx(index);
        setTimeout(() => setCopiedFileIdx(null), 2000);
      } else {
        console.error("Fallback copy failed.");
      }
    } catch (err) {
      console.error("Could not copy text: ", err);
    }
  };

  // Copy code to clipboard with robust cross-browser and iframe fallback
  const handleCopyCode = (code: string, index: number) => {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(code)
        .then(() => {
          setCopiedFileIdx(index);
          setTimeout(() => setCopiedFileIdx(null), 2000);
        })
        .catch((err) => {
          console.warn("navigator.clipboard failed, trying fallback:", err);
          fallbackCopyText(code, index);
        });
    } else {
      fallbackCopyText(code, index);
    }
  };

  // Download code as .kt file
  const handleDownloadCode = (file: typeof KOTLIN_FILES[0]) => {
    const element = document.createElement("a");
    const fileBlob = new Blob([file.code], { type: "text/plain;charset=utf-8" });
    const objectUrl = URL.createObjectURL(fileBlob);
    element.href = objectUrl;
    element.download = file.name.split(" ")[0];
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(objectUrl);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !newPlaylistContent.trim()) {
      setFormError("Пожалуйста, заполните название и ссылку/содержимое!");
      return;
    }
    onAddSavedItem(newPlaylistName.trim(), newPlaylistType, newPlaylistContent.trim());
    setNewPlaylistName("");
    setNewPlaylistContent("");
    setFormError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      {/* Modal Body */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative max-w-4xl w-full max-h-[85vh] overflow-hidden bg-[#070B14] border border-deep-azure/60 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-left z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-deep-azure/20 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-bright-cyan animate-spin-slow" />
            <div>
              <h3 className="font-display font-semibold text-sm text-white uppercase tracking-wider">
                Настройки плеера и код
              </h3>
              <p className="text-[10px] text-slate-400">
                Управление источниками IPTV плейлистов и просмотр Android Kotlin / Compose кода
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 border border-deep-azure/20 rounded-2xl">
          <button
            onClick={() => setSettingsActiveTab("playlists")}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer
              ${settingsActiveTab === "playlists"
                ? "bg-deep-azure border border-bright-cyan/25 text-white"
                : "text-slate-400 hover:text-slate-200"
              }
            `}
          >
            <Database className="w-4 h-4" />
            <span>Источники ({savedItems.length})</span>
          </button>
          <button
            onClick={() => setSettingsActiveTab("code")}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer
              ${settingsActiveTab === "code"
                ? "bg-deep-azure border border-bright-cyan/25 text-white"
                : "text-slate-400 hover:text-slate-200"
              }
            `}
          >
            <Code className="w-4 h-4" />
            <span>Kotlin Код</span>
          </button>
          <button
            onClick={() => setSettingsActiveTab("instructions")}
            className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer
              ${settingsActiveTab === "instructions"
                ? "bg-deep-azure border border-bright-cyan/25 text-white"
                : "text-slate-400 hover:text-slate-200"
              }
            `}
          >
            <FileText className="w-4 h-4" />
            <span>Инструкция</span>
          </button>
        </div>

        {/* Tab Content Areas */}
        <div className="flex-1 overflow-y-auto pr-1">
          {settingsActiveTab === "playlists" && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Left Side: Saved Sources list */}
                <div className="bg-black/30 border border-deep-azure/20 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <ListVideo className="w-4 h-4 text-bright-cyan" />
                    <span>СПИСОК СОХРАНЕННЫХ ИСТОЧНИКОВ</span>
                  </div>
                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-bright-cyan/10">
                    {savedItems.map((item) => {
                      const isActive = activePlaylistId === item.id;
                      return (
                        <div 
                          key={item.id}
                          onClick={() => {
                            onLoadSavedItem(item);
                            onClose();
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5
                            ${isActive 
                              ? "bg-deep-azure/60 border-bright-cyan/70 text-white shadow-sm" 
                              : "bg-[#090E17]/60 border-deep-azure/30 hover:border-deep-azure/60 text-slate-300"
                            }
                          `}
                        >
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="truncate text-xs font-semibold font-sans">{item.name}</span>
                              {isActive && (
                                <span className="px-1.5 py-0.5 bg-bright-cyan/20 border border-bright-cyan/50 text-bright-cyan rounded text-[8px] font-bold tracking-wider font-mono uppercase">
                                  АКТИВЕН
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                              <span className="px-1.5 py-0.2 bg-black/40 rounded border border-deep-azure/20">
                                {item.type === "m3u_url" && "🔗 M3U URL"}
                                {item.type === "m3u_raw" && "📝 Текст M3U"}
                                {item.type === "single_stream" && "🎥 Поток HLS"}
                              </span>
                              <span>{item.createdAt}</span>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (deleteConfirmId === item.id) {
                                onDeleteSavedItem(item.id, e);
                                setDeleteConfirmId(null);
                              } else {
                                setDeleteConfirmId(item.id);
                              }
                            }}
                            className={`p-1.5 border rounded-lg transition-all flex-shrink-0 cursor-pointer flex items-center gap-1 text-[10px] font-mono
                              ${deleteConfirmId === item.id 
                                ? "bg-red-900/60 border-red-500 text-white animate-pulse" 
                                : "hover:bg-red-950/40 border-transparent hover:border-red-500/20 text-slate-400 hover:text-red-400"
                              }
                            `}
                            title={deleteConfirmId === item.id ? "Кликните еще раз для удаления" : "Удалить источник"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deleteConfirmId === item.id && <span>Удалить?</span>}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Playback Settings / Autoplay Option */}
                  <div className="mt-2 pt-3 border-t border-deep-azure/20 flex flex-col gap-2">
                    <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                      <Settings className="w-3.5 h-3.5 text-bright-cyan" />
                      <span>Параметры воспроизведения</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-deep-azure/20">
                      <div className="flex flex-col gap-0.5 max-w-[70%] animate-fadeIn">
                        <span className="text-[11px] font-semibold text-slate-200">Автопоиск при ошибке</span>
                        <span className="text-[9px] text-slate-500 leading-tight">Переключение на следующий рабочий канал при сбое потока</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAutoPlayEnabled(!isAutoPlayEnabled)}
                        className={`relative w-8 h-4 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                          isAutoPlayEnabled ? "bg-bright-cyan" : "bg-slate-700"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-200 ${
                            isAutoPlayEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-black/40 border border-deep-azure/20 mt-1">
                      <div className="flex flex-col gap-0.5 animate-fadeIn">
                        <span className="text-[11px] font-semibold text-slate-200">Сканирование каналов</span>
                        <span className="text-[9px] text-slate-500 leading-tight">Проверить каналы текущего плейлиста и отфильтровать недоступные</span>
                      </div>
                      <button
                        type="button"
                        disabled={isScanning}
                        onClick={() => {
                          onScanActivePlaylist();
                          onClose();
                        }}
                        className={`w-full mt-1 py-2 bg-[#121B2E] border hover:bg-[#1b2742] transition-all rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer
                          ${isScanning 
                            ? "border-slate-800 text-slate-500 cursor-not-allowed" 
                            : "border-indigo-500/30 text-indigo-300 hover:border-indigo-500/50"
                          }
                        `}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                        <span>{isScanning ? "ИДЕТ СКАНИРОВАНИЕ..." : "СКАНИРОВАТЬ НА ДОСТУПНОСТЬ"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Side: Add new item form */}
                <form onSubmit={handleFormSubmit} className="bg-black/30 border border-deep-azure/20 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-bright-cyan" />
                    <span>ДОБАВИТЬ НОВЫЙ ИСТОЧНИК IPTV</span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {/* Name Input */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Название</label>
                      <input 
                        type="text" 
                        placeholder="Например: Любимые каналы, Фильмы HD"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        className="bg-black/50 border border-deep-azure/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-bright-cyan placeholder:text-slate-500"
                        required
                      />
                    </div>

                    {/* Type Select Tabs */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Тип источника</label>
                      <div className="grid grid-cols-3 gap-1 bg-black/50 p-1 border border-deep-azure/30 rounded-xl">
                        {(["m3u_url", "single_stream", "m3u_raw"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setNewPlaylistType(type);
                              setNewPlaylistContent("");
                            }}
                            className={`py-1.5 rounded-lg text-[9px] font-medium tracking-wide transition-all uppercase font-mono cursor-pointer
                              ${newPlaylistType === type 
                                ? "bg-deep-azure text-white border border-bright-cyan/20" 
                                : "text-slate-400 hover:text-slate-200"
                              }
                            `}
                          >
                            {type === "m3u_url" && "Ссылка M3U"}
                            {type === "single_stream" && "Поток HLS"}
                            {type === "m3u_raw" && "Текст M3U"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Content Input depending on Type */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Данные источника</label>
                      
                      {newPlaylistType === "m3u_url" && (
                        <input 
                          type="url" 
                          placeholder="Вставьте URL плейлиста (https://...)"
                          value={newPlaylistContent}
                          onChange={(e) => setNewPlaylistContent(e.target.value)}
                          className="bg-black/50 border border-deep-azure/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-bright-cyan placeholder:text-slate-500"
                          required
                        />
                      )}

                      {newPlaylistType === "single_stream" && (
                        <input 
                          type="url" 
                          placeholder="Вставьте ссылку на HLS поток (.m3u8, .mp4, и т.д.)"
                          value={newPlaylistContent}
                          onChange={(e) => setNewPlaylistContent(e.target.value)}
                          className="bg-black/50 border border-deep-azure/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-bright-cyan placeholder:text-slate-500"
                          required
                        />
                      )}

                      {newPlaylistType === "m3u_raw" && (
                        <div className="flex flex-col gap-2">
                          <textarea 
                            placeholder="#EXTM3U&#10;#EXTINF:-1 group-title=&quot;News&quot;, Channel Name&#10;http://..."
                            value={newPlaylistContent}
                            onChange={(e) => setNewPlaylistContent(e.target.value)}
                            className="bg-black/50 border border-deep-azure/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-bright-cyan placeholder:text-slate-500 h-20 resize-none font-mono text-[10px]"
                            required
                          />
                          
                          {/* File upload field */}
                          <label className="border border-dashed border-deep-azure/40 hover:border-bright-cyan/40 rounded-xl py-2 px-3 text-center cursor-pointer transition-colors block">
                            <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                              <Upload className="w-3.5 h-3.5 text-bright-cyan" />
                              <span>Или загрузите файл .m3u</span>
                            </span>
                            <input 
                              type="file" 
                              accept=".m3u,.m3u8,.txt"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const MAX_FILE_SIZE = 5 * 1024 * 1024;
                                if (file.size > MAX_FILE_SIZE) {
                                  setFormError(`Файл слишком большой (${(file.size / 1024 / 1024).toFixed(1)}MB). Максимум: 5MB.`);
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                  const text = evt.target?.result as string;
                                  if (text) {
                                    setNewPlaylistContent(text);
                                    if (!newPlaylistName) {
                                      setNewPlaylistName(`Файл: ${file.name.replace(/\.[^/.]+$/, "")}`);
                                    }
                                  }
                                };
                                reader.readAsText(file);
                              }} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {formError && (
                    <div className="bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl px-3 py-2 text-[11px] leading-relaxed">
                      ⚠️ {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full mt-2 py-2 bg-bright-cyan text-pure-black hover:bg-white transition-all rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-bright-cyan/5 active:scale-95 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Сохранить и загрузить</span>
                  </button>
                </form>

              </div>
            </div>
          )}

          {settingsActiveTab === "code" && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="bg-black/20 border border-deep-azure/20 rounded-2xl p-4 flex flex-col gap-4">
                
                {/* File Tabs Selection */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {KOTLIN_FILES.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveKotlinFileIdx(idx)}
                      className={`px-2 py-1.5 rounded-lg text-left transition-all border text-[10px] font-medium flex flex-col gap-0.5 cursor-pointer
                        ${activeKotlinFileIdx === idx 
                          ? "bg-deep-azure border-bright-cyan text-white shadow-sm" 
                          : "bg-black/30 border-deep-azure/30 text-slate-400 hover:border-deep-azure/50 hover:text-slate-200"
                        }
                      `}
                    >
                      <span className="font-mono text-[8px] text-bright-cyan/80 block truncate">
                        {file.path.split("/").pop()}
                      </span>
                      <span className="truncate block font-sans text-[10px]">
                        {file.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Display Code Box */}
                <div className="relative border border-deep-azure/30 bg-black/90 rounded-2xl overflow-hidden flex flex-col">
                  
                  {/* Title bar */}
                  <div className="bg-midnight-blue/60 px-4 py-2 border-b border-deep-azure/20 flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {KOTLIN_FILES[activeKotlinFileIdx].path}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCode(KOTLIN_FILES[activeKotlinFileIdx].code, activeKotlinFileIdx)}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                        title="Копировать код"
                      >
                        {copiedFileIdx === activeKotlinFileIdx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 animate-scale" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDownloadCode(KOTLIN_FILES[activeKotlinFileIdx])}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Скачать .kt файл"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Brief descriptive text */}
                  <div className="bg-slate-900/30 px-4 py-2 text-[10px] text-slate-400 italic leading-relaxed border-b border-deep-azure/10">
                    {KOTLIN_FILES[activeKotlinFileIdx].description}
                  </div>

                  {/* Scrollable code block */}
                  <div className="p-4 overflow-x-auto font-mono text-[10px] text-slate-300 max-h-72 leading-relaxed select-text whitespace-pre bg-[#050B14]">
                    <code>
                      {KOTLIN_FILES[activeKotlinFileIdx].code}
                    </code>
                  </div>
                </div>

              </div>
            </div>
          )}

          {settingsActiveTab === "instructions" && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="bg-black/30 border border-deep-azure/20 rounded-2xl p-5 flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
                
                <h4 className="font-display font-semibold text-xs text-bright-cyan tracking-wide flex items-center gap-2">
                  <Settings className="w-4 h-4 text-bright-cyan" />
                  <span>ИНСТРУКЦИЯ ПО ИНТЕГРАЦИИ (ANDROID STUDIO)</span>
                </h4>

                <p>
                  Чтобы перенести этот высокопроизводительный IPTV плеер в ваше нативное Android-приложение, добавьте следующие зависимости в файл <strong>build.gradle.kts (Module: app)</strong>:
                </p>

                <div className="bg-black/80 rounded-2xl p-4 font-mono text-[10px] text-slate-300 border border-deep-azure/30 overflow-x-auto leading-normal">
                  {`dependencies {
    // 1. Android Jetpack Compose
    implementation("androidx.compose.ui:ui:1.6.0")
    implementation("androidx.compose.material3:material3:1.2.0")

    // 2. Media3 ExoPlayer для HLS и воспроизведения потоков M3U8
    implementation("androidx.media3:media3-exoplayer:1.2.1")
    implementation("androidx.media3:media3-ui:1.2.1")

    // 3. Coil для кэширования и производительной загрузки логотипов
    implementation("io.coil-kt:coil-compose:2.5.0")

    // 4. Paging 3 для инкрементальной загрузки списков 1000+ каналов
    implementation("androidx.paging:paging-runtime-ktx:3.2.1")
    implementation("androidx.paging:paging-compose:3.2.1")
}`}
                </div>

                <div className="flex flex-col gap-2.5 pt-2 text-[11px] text-slate-400">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-deep-azure/60 border border-bright-cyan/30 rounded-full flex items-center justify-center text-[10px] text-bright-cyan font-bold font-mono flex-shrink-0 mt-0.5">1</span>
                    <span>
                      Создайте в вашем проекте пакеты по Clean Architecture: <code>model</code>, <code>parser</code>, <code>paging</code>, <code>viewmodel</code> и <code>ui</code>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-deep-azure/60 border border-bright-cyan/30 rounded-full flex items-center justify-center text-[10px] text-bright-cyan font-bold font-mono flex-shrink-0 mt-0.5">2</span>
                    <span>
                      Скопируйте файлы <code>Channel.kt</code>, <code>PlaylistParser.kt</code>, <code>ChannelPagingSource.kt</code>, <code>IptvViewModel.kt</code> и <code>TvComponents.kt</code> в соответствующие директории.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-deep-azure/60 border border-bright-cyan/30 rounded-full flex items-center justify-center text-[10px] text-bright-cyan font-bold font-mono flex-shrink-0 mt-0.5">3</span>
                    <span>
                      Инициализируйте плейлист в <code>MainActivity.kt</code>, передав поток плейлиста в метод парсера: <code>val channels = PlaylistParser().parse(assets.open("playlist.m3u"))</code>.
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
