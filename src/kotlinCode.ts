export interface KotlinFile {
  name: string;
  path: string;
  description: string;
  code: string;
}

export const KOTLIN_FILES: KotlinFile[] = [
  {
    name: "Channel.kt (Модель Данных)",
    path: "model/Channel.kt",
    description: "Класс данных для отдельного IPTV-канала, поддерживающий группировку, логотип и URL потока.",
    code: `package com.iptv.player.domain.model

/**
 * Модель IPTV канала для Jetpack Compose и ExoPlayer
 */
data class Channel(
    val id: String,
    val name: String,
    val logoUrl: String,
    val streamUrl: String,
    val category: String,
    val originalGroup: String
)`
  },
  {
    name: "PlaylistParser.kt (Парсер M3U)",
    path: "parser/PlaylistParser.kt",
    description: "Интеллектуальный анализатор M3U плейлистов с регулярными выражениями и алгоритмом резервного ключевого сопоставления.",
    code: `package com.iptv.player.data.parser

import com.iptv.player.domain.model.Channel
import java.io.BufferedReader
import java.io.InputStream
import java.io.InputStreamReader
import java.util.UUID

class PlaylistParser {

    companion object {
        private val LOGO_REGEX = """tvg-logo="([^"]+)"""".toRegex(RegexOption.IGNORE_CASE)
        private val GROUP_REGEX = """group-title="([^"]+)"""".toRegex(RegexOption.IGNORE_CASE)
    }

    /**
     * Парсит M3U плейлист из InputStream и распределяет каналы по категориям
     */
    fun parse(inputStream: InputStream): List<Channel> {
        val channels = mutableListOf<Channel>()
        val reader = BufferedReader(InputStreamReader(inputStream))
        var line: String?
        
        var currentName = ""
        var currentLogo = ""
        var currentGroup = ""

        try {
            while (reader.readLine().also { line = it } != null) {
                val trimmedLine = line!!.trim()
                if (trimmedLine.isEmpty()) continue

                if (trimmedLine.startsWith("#EXTINF:")) {
                    // Извлекаем логотип
                    val logoMatch = LOGO_REGEX.find(trimmedLine)
                    currentLogo = logoMatch?.groupValues?.get(1) ?: ""

                    // Извлекаем группу
                    val groupMatch = GROUP_REGEX.find(trimmedLine)
                    currentGroup = groupMatch?.groupValues?.get(1) ?: ""

                    // Извлекаем имя канала (после последней запятой)
                    val lastCommaIndex = trimmedLine.lastIndexOf(',')
                    currentName = if (lastCommaIndex != -1) {
                        trimmedLine.substring(lastCommaIndex + 1).trim()
                    } else {
                        "Неизвестный канал"
                    }
                } else if (trimmedLine.startsWith("http://") || 
                           trimmedLine.startsWith("https://") || 
                           trimmedLine.startsWith("rtmp://")) {
                    
                    if (currentName.isNotEmpty()) {
                        val category = determineCategory(currentName, currentGroup)
                        channels.add(
                            Channel(
                                id = UUID.randomUUID().toString(),
                                name = currentName,
                                logoUrl = currentLogo.ifEmpty { "https://placeholder-logo-url.png" },
                                streamUrl = trimmedLine,
                                category = category,
                                originalGroup = currentGroup.ifEmpty { "None" }
                            )
                        )
                    }
                    // Сбрасываем временные переменные
                    currentName = ""
                    currentLogo = ""
                    currentGroup = ""
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            reader.close()
        }
        return channels
    }

    /**
     * Алгоритм автоматической каталогизации каналов с ключевыми словами на русском и английском
     */
    private fun determineCategory(name: String, groupTitle: String): String {
        val normGroup = groupTitle.lowercase()
        val normName = name.lowercase()

        // 1. Проверка group-title
        when {
            normGroup.contains("kids") || normGroup.contains("children") || normGroup.contains("cartoon") || normGroup.contains("детск") || normGroup.contains("мульт") -> return "Kids"
            normGroup.contains("family") || normGroup.contains("семейн") || normGroup.contains("дом") || normGroup.contains("стс") -> return "Family"
            normGroup.contains("science") || normGroup.contains("nature") || normGroup.contains("discovery") || normGroup.contains("nasa") || normGroup.contains("space") || normGroup.contains("наука") || normGroup.contains("космос") || normGroup.contains("geo") -> return "Science"
            normGroup.contains("music") || normGroup.contains("mtv") || normGroup.contains("vh1") || normGroup.contains("музык") || normGroup.contains("муз") || normGroup.contains("club") -> return "Music"
            normGroup.contains("movie") || normGroup.contains("cinema") || normGroup.contains("film") || normGroup.contains("кино") || normGroup.contains("фильм") || normGroup.contains("serial") -> return "Movies"
            normGroup.contains("sport") || normGroup.contains("football") || normGroup.contains("soccer") || normGroup.contains("спорт") || normGroup.contains("матч") -> return "Sports"
            normGroup.contains("news") || normGroup.contains("новости") || normGroup.contains("рбк") || normGroup.contains("вести") -> return "News"
        }

        // 2. Резервное сопоставление по имени канала
        return when {
            // Kids (Детские)
            normName.matches(Regex(".*(cartoon|disney|nickelodeon|baby|kids|детск|мульт|looloo|boomerang|cartoonito).*")) -> "Kids"
            
            // Family (Семейные)
            normName.matches(Regex(".*(family|семейн|дом|пятница|стс|тнт|кухня|жизнь).*")) -> "Family"
            
            // Science (Наука)
            normName.matches(Regex(".*(discovery|nature|space|nasa|science|наука|космос|национал|national|geographic|animal|planet|дикая|земля).*")) -> "Science"
            
            // Music (Музыка)
            normName.matches(Regex(".*(music|mtv|vh1|музык|муз|clubbing|dj|dance|sound|shanson).*")) -> "Music"
            
            // Movies (Фильмы)
            normName.matches(Regex(".*(movie|cinema|film|кино|фильм|хоррор|horror|drama|action|триллер|боевик|комедия|сериал).*")) -> "Movies"
            
            // Sports (Спорт)
            normName.matches(Regex(".*(sport|red bull|football|soccer|спорт|матч|арена|фитнес|экстрим|ufc|boxing).*")) -> "Sports"
            
            // News (Новости)
            normName.matches(Regex(".*(news|euronews|новости|рбк|вести|cgtn|france).*")) -> "News"
            
            // По умолчанию
            else -> "Other"
        }
    }
}`
  },
  {
    name: "ChannelPagingSource.kt (Paging 3)",
    path: "paging/ChannelPagingSource.kt",
    description: "Реализация Paging 3 для инкрементальной загрузки больших плейлистов (1000+ каналов) с регенерацией ресурсов.",
    code: `package com.iptv.player.data.paging

import androidx.paging.PagingSource
import androidx.paging.PagingState
import com.iptv.player.domain.model.Channel

class ChannelPagingSource(
    private val allChannels: List<Channel>,
    private val category: String
) : PagingSource<Int, Channel>() {

    override fun getRefreshKey(state: PagingState<Int, Channel>): Int? {
        return state.anchorPosition?.let { anchorPosition ->
            state.closestPageToPosition(anchorPosition)?.prevKey?.plus(1)
                ?: state.closestPageToPosition(anchorPosition)?.nextKey?.minus(1)
        }
    }

    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Channel> {
        val position = params.key ?: 0
        
        // Фильтруем каналы по выбранной категории
        val filteredChannels = if (category == "All") {
            allChannels
        } else {
            allChannels.filter { it.category == category }
        }

        val limit = params.loadSize
        val fromIndex = position * limit
        val toIndex = minOf(fromIndex + limit, filteredChannels.size)

        return try {
            if (fromIndex >= filteredChannels.size) {
                LoadResult.Page(
                    data = emptyList(),
                    prevKey = if (position == 0) null else position - 1,
                    nextKey = null
                )
            } else {
                val pageData = filteredChannels.subList(fromIndex, toIndex)
                LoadResult.Page(
                    data = pageData,
                    prevKey = if (position == 0) null else position - 1,
                    nextKey = if (toIndex < filteredChannels.size) position + 1 else null
                )
            }
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }
}`
  },
  {
    name: "IptvViewModel.kt (ViewModel)",
    path: "viewmodel/IptvViewModel.kt",
    description: "Clean Architecture ViewModel, использующая StateFlow для удержания состояния и реактивной фильтрации.",
    code: `package com.iptv.player.presentation.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.paging.Pager
import androidx.paging.PagingConfig
import androidx.paging.PagingData
import androidx.paging.cachedIn
import com.iptv.player.data.paging.ChannelPagingSource
import com.iptv.player.domain.model.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.launch

sealed interface UiState {
    object Idle : UiState
    object Loading : UiState
    data class Success(val channelsCount: Int) : UiState
    data class Error(val message: String) : UiState
}

class IptvViewModel : ViewModel() {

    private val _rawChannels = MutableStateFlow<List<Channel>>(emptyList())
    
    private val _selectedCategory = MutableStateFlow("News")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    private val _uiState = MutableStateFlow<UiState>(UiState.Idle)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    // Динамический поток PagingData, реагирующий на изменение выбранной категории
    val channelFlow = _selectedCategory.flatMapLatest { category ->
        Pager(
            config = PagingConfig(
                pageSize = 20,
                prefetchDistance = 5,
                enablePlaceholders = false
            ),
            pagingSourceFactory = { ChannelPagingSource(_rawChannels.value, category) }
        ).flow
    }.cachedIn(viewModelScope)

    fun loadPlaylist(channels: List<Channel>) {
        _uiState.value = UiState.Loading
        viewModelScope.launch {
            try {
                _rawChannels.value = channels
                _uiState.value = UiState.Success(channels.size)
                // Если каналы загружены, выбираем первую доступную категорию
                if (channels.isNotEmpty()) {
                    _selectedCategory.value = channels.first().category
                }
            } catch (e: Exception) {
                _uiState.value = UiState.Error(e.message ?: "Неизвестная ошибка")
            }
        }
    }

    fun selectCategory(category: String) {
        _selectedCategory.value = category
    }
}`
  },
  {
    name: "TvComponents.kt (Компоненты TV)",
    path: "ui/components/TvComponents.kt",
    description: "Специализированные компоненты для Android TV с поддержкой управления с пульта (D-Pad). Добавляют масштабирование 1.1x и голубое свечение при фокусе.",
    code: `package com.iptv.player.presentation.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage

/**
 * Кнопка выбора категории, адаптированная для пульта D-Pad (Android TV)
 */
@Composable
fun TvCategoryChip(
    categoryRu: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    var isFocused by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(if (isFocused) 1.1f else 1.0f)
    
    val backgroundColor = when {
        isSelected -> Color(0xFF1E3E62) // Deep Azure
        isFocused -> Color(0xFF0B192C)  // Midnight Blue
        else -> Color(0xFF151D2A)
    }

    val borderColor = when {
        isFocused -> Color(0xFF00D1FF) // Bright Cyan при фокусе
        isSelected -> Color(0xFF00D1FF).copy(alpha = 0.5f)
        else -> Color.Transparent
    }

    Card(
        shape = RoundedCornerShape(50),
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        border = BorderStroke(1.5.dp, borderColor),
        modifier = Modifier
            .scale(scale)
            .onFocusChanged { isFocused = it.isFocused }
            .clickable { onClick() }
            .focusable()
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            Text(
                text = categoryRu,
                color = if (isSelected || isFocused) Color.White else Color.Gray,
                fontSize = 14.sp
            )
        }
    }
}

/**
 * Плитка канала в соотношении 1:1, адаптированная под Android TV D-Pad фокус
 */
@Composable
fun TvChannelCard(
    name: String,
    logoUrl: String,
    onClick: () -> Unit
) {
    var isFocused by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(if (isFocused) 1.1f else 1.0f)

    Card(
        shape = RoundedCornerShape(24.dp), // Скругление 24dp по ТЗ
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF0B192C) // Midnight Blue
        ),
        border = BorderStroke(
            width = 2.dp,
            color = if (isFocused) Color(0xFF00D1FF) else Color.Transparent // Кайма ярко-голубого цвета при фокусе
        ),
        modifier = Modifier
            .aspectRatio(1f) // Соотношение 1:1 по ТЗ
            .scale(scale)
            .onFocusChanged { isFocused = it.isFocused }
            .clickable { onClick() }
            .focusable()
            .padding(8.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            // Логотип канала с Coil AsyncImage
            AsyncImage(
                model = logoUrl,
                contentDescription = name,
                contentScale = ContentScale.Fit,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp)
            )

            // Полупрозрачный градиент с именем канала внизу
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .height(40.dp)
            ) {
                Text(
                    text = name,
                    color = Color.White,
                    fontSize = 12.sp,
                    maxLines = 1,
                    modifier = Modifier
                        .align(Alignment.Center)
                        .padding(horizontal = 8.dp)
                )
            }
        }
    }
}`
  },
  {
    name: "MainActivity.kt (Основной Экран)",
    path: "ui/MainActivity.kt",
    description: "Экран активности, объединяющий плеер на Media3 ExoPlayer, переключатель режимов Mobile/TV и анимированную сетку каналов.",
    code: `package com.iptv.player.presentation.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import androidx.paging.compose.collectAsLazyPagingItems
import com.iptv.player.domain.model.Channel
import com.iptv.player.presentation.ui.components.TvCategoryChip
import com.iptv.player.presentation.ui.components.TvChannelCard
import com.iptv.player.presentation.ui.components.TvCategoryChip as MobileCategoryChip
import com.iptv.player.presentation.viewmodel.IptvViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: IptvViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState: Bundle?)
        setContent {
            MaterialTheme {
                MainScreen(viewModel)
            }
        }
    }
}

@Composable
fun MainScreen(viewModel: IptvViewModel) {
    val context = LocalContext.current
    var isTvMode by remember { mutableStateOf(false) } // Переключатель режимов Mobile/TV по ТЗ
    var activeStreamUrl by remember { mutableStateOf<String?>(null) }
    
    // Инициализация ExoPlayer из Media3
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            playWhenReady = true
        }
    }

    // Освобождаем плеер при уничтожении
    DisposableEffect(Unit) {
        onDispose {
            exoPlayer.release()
        }
    }

    // Запускаем воспроизведение при изменении URL
    LaunchedEffect(activeStreamUrl) {
        activeStreamUrl?.let { url ->
            val mediaItem = MediaItem.fromUri(url)
            exoPlayer.setMediaItem(mediaItem)
            exoPlayer.prepare()
        }
    }

    val selectedCategory by viewModel.selectedCategory.collectAsState()
    val lazyPagingItems = viewModel.channelFlow.collectAsLazyPagingItems()

    // Список категорий из ТЗ
    val categories = listOf(
        Pair("Kids", "Детские"),
        Pair("Family", "Семейные"),
        Pair("Science", "Наука"),
        Pair("Music", "Музыка"),
        Pair("Movies", "Фильмы"),
        Pair("Sports", "Спорт"),
        Pair("News", "Новости"),
        Pair("Other", "Другие")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF000000)) // Pure Black из ТЗ
    ) {
        // Заголовок с переключателем UI-режимов
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "IPTV КЛАСС-ПЛЕЕР",
                color = Color.White,
                style = MaterialTheme.typography.titleMedium
            )

            // Переключатель адаптивного интерфейса по ТЗ
            Button(
                onClick = { isTvMode = !isTvMode },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF1E3E62), // Deep Azure
                    contentColor = Color(0xFF00D1FF) // Bright Cyan
                )
            ) {
                Text(text = if (isTvMode) "🖥️ Режим: Android TV" else "📱 Режим: Мобильный")
            }
        }

        // Плеер сверху при наличии активной ссылки
        AnimatedVisibility(
            visible = activeStreamUrl != null,
            enter = fadeIn() + slideInVertically(),
            exit = fadeOut()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(240.dp)
                    .background(Color.Black)
            ) {
                AndroidView(
                    factory = { ctx ->
                        PlayerView(ctx).apply {
                            player = exoPlayer
                            useController = true
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }
        }

        // Селектор Категорий (Горизонтальный список чипсов)
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp, horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(categories) { category ->
                val isSelected = selectedCategory == category.first
                TvCategoryChip(
                    categoryRu = category.second,
                    isSelected = isSelected,
                    onClick = { viewModel.selectCategory(category.first) }
                )
            }
        }

        // Сетка каналов 1:1 с анимацией появления
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 8.dp)
        ) {
            LazyVerticalGrid(
                columns = GridCells.Fixed(if (isTvMode) 4 else 2), // Больше колонок для TV
                modifier = Modifier.fillMaxSize()
            ) {
                items(lazyPagingItems.itemCount) { index ->
                    val channel = lazyPagingItems[index]
                    if (channel != null) {
                        TvChannelCard(
                            name = channel.name,
                            logoUrl = channel.logoUrl,
                            onClick = { activeStreamUrl = channel.streamUrl }
                        )
                    }
                }
            }
        }
    }
}
`
  }
];
