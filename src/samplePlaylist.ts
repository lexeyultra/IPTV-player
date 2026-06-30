export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  category: string;
  originalGroup: string;
}

export const SAMPLE_M3U_PLAYLIST = `#EXTM3U

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/rocket-emoji.png" group-title="Science", NASA TV HD
http://nasa-i.akamaihd.net/hls/live/253565/NASA-NTV1-Public/master.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/lion-emoji.png" group-title="Science", WildEarth Safari Live
https://wildearth-lh.akamaihd.net/i/wildearth_1@512217/master.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/baby-chick.png" group-title="Kids", LooLoo Kids Live
https://live.ch7.tv/looloo/index.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/unicorn-emoji.png", Cartoon Classic Stream (Kids Fallback)
https://archive.org/download/classic-cartoons-v2/classic-cartoons-v2.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/guitar.png" group-title="Music", Deluxe Music Live
https://deluxemusic.MDN.ott.at/hls/deluxemusic/live.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/headphone-emoji.png", Clubbing TV (Music Fallback)
https://clubbingtv-ott-live.b-cdn.net/out/v1/7d363765fbfe4757bb3d7fb84221a719/index.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/clapper-board.png" group-title="Movies", Classic Cinema Room
https://cc-indie-cinema.b-cdn.net/out/v1/bc6040439ef949bb9a515f403f569b9f/index.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/film-projector.png", Sci-Fi Zone (Movie Fallback)
https://scifi-cinema.b-cdn.net/out/v1/4508eeea749344268e068a86777cfa90/index.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/skateboard-emoji.png" group-title="Sports", Red Bull TV Live
https://rbmn-live.akamaized.net/hls/live/590964/BoB/master.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/soccer-ball.png", World Soccer Cam (Sports Fallback)
https://playertest.longtailvideo.com/adaptive/bipbop/gear4/prog_index.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/newspaper-emoji.png" group-title="News", Euronews HD Russian
https://euronews-rus.live.cdn.img.com/hls/live/master.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/world-map.png" group-title="News", France 24 Live
https://static.france24.com/live/F24_EN_LO_HLS/live_tv.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/television.png", CGTN Russian News (News Fallback)
https://cgtn-ru.live.cdn.img.com/hls/live/master.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/house-with-garden.png" group-title="Family", Family Living Room Cam
https://playertest.longtailvideo.com/adaptive/bipbop/bipbop.m3u8

#EXTINF:-1 tvg-logo="https://img.icons8.com/emoji/96/sunset-emoji.png", Relaxing Tropical Reef HD
https://content.jwplatform.com/manifests/vM7nH069.m3u8
`;

export interface CategoryMapping {
  id: string;
  ru: string;
  en: string;
  color: string;
}

export const CATEGORIES: CategoryMapping[] = [
  { id: "Kids", ru: "Детские", en: "Kids", color: "from-pink-500 to-rose-600" },
  { id: "Family", ru: "Семейные", en: "Family", color: "from-purple-500 to-indigo-600" },
  { id: "Science", ru: "Наука", en: "Science", color: "from-teal-400 to-emerald-600" },
  { id: "Music", ru: "Музыка", en: "Music", color: "from-amber-400 to-orange-500" },
  { id: "Movies", ru: "Фильмы", en: "Movies", color: "from-red-600 to-red-800" },
  { id: "Sports", ru: "Спорт", en: "Sports", color: "from-blue-500 to-cyan-500" },
  { id: "News", ru: "Новости", en: "News", color: "from-sky-500 to-blue-700" },
  { id: "Other", ru: "Другие", en: "Other", color: "from-slate-500 to-slate-700" },
];

/**
 * Parses raw M3U text and maps channels into the correct categories
 * utilizing the group-title and falling back to keyword logic.
 */
const GROUP_TITLE_REGEX = /group-title="([^"]+)"/i;
const TVG_LOGO_REGEX = /tvg-logo="([^"]+)"/i;
const STREAM_URL_REGEX = /^(https?|rtmp):\/\//i;

export function parseM3UPlaylist(rawText: string): Channel[] {
  const lines = rawText.split(/\r?\n/);
  const channels: Channel[] = [];
  const warnings: string[] = [];
  let currentChannelInfo: {
    name: string;
    logo: string;
    groupTitle: string;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("#EXTINF:")) {
      const logoMatch = line.match(TVG_LOGO_REGEX);
      const logo = logoMatch ? logoMatch[1] : "";

      const groupMatch = line.match(GROUP_TITLE_REGEX);
      const groupTitle = groupMatch ? groupMatch[1] : "";

      const lastCommaIndex = line.lastIndexOf(",");
      let name = "Неизвестный канал";
      if (lastCommaIndex !== -1) {
        name = line.substring(lastCommaIndex + 1).trim();
      }

      currentChannelInfo = { name, logo, groupTitle };
    } else if (line.length > 0 && !line.startsWith("#")) {
      if (STREAM_URL_REGEX.test(line) || (line.length > 5 && !line.startsWith("#"))) {
        if (currentChannelInfo) {
          const { name, logo, groupTitle } = currentChannelInfo;
          const category = determineCategory(name, groupTitle);

          channels.push({
            id: `${channels.length}-${name}`,
            name,
            logo: getSmartLogo(name, logo),
            url: line,
            category,
            originalGroup: groupTitle || "None",
          });
          currentChannelInfo = null;
        } else {
          warnings.push(`⚠️ Строка ${i + 1}: URL без предшествующего #EXTINF — пропущено: "${line.substring(0, 60)}"`);
        }
      } else if (currentChannelInfo) {
        warnings.push(`⚠️ Строка ${i + 1}: Ожидался URL для канала "${currentChannelInfo.name}", но получено: "${line.substring(0, 40)}"`);
        currentChannelInfo = null;
      }
    }
  }

  if (warnings.length > 0) {
    console.warn(`[M3U Parser] ${warnings.length} предупреждений:\n${warnings.join("\n")}`);
  }

  return channels;
}

/**
 * Smart assignment of high-quality icons based on channel names
 */
export function getSmartLogo(name: string, parsedLogo: string): string {
  if (parsedLogo && parsedLogo.trim() !== "" && !parsedLogo.includes("unsplash.com")) {
    return parsedLogo;
  }

  const norm = name.toLowerCase();

  // 1. Specific popular channels
  if (norm.includes("первый") || norm.includes("1 канал") || norm.includes("1ch") || norm.includes("ort")) {
    return "https://img.icons8.com/color/96/1-circle.png";
  }
  if (norm.includes("россия") || norm.includes("russia")) {
    return "https://img.icons8.com/color/96/russian-federation.png";
  }
  if (norm.includes("нтв") || norm.includes("ntv")) {
    return "https://img.icons8.com/color/96/n.png";
  }
  if (norm.includes("стс") || norm.includes("sts")) {
    return "https://img.icons8.com/color/96/s.png";
  }
  if (norm.includes("тнт") || norm.includes("tnt")) {
    return "https://img.icons8.com/color/96/t.png";
  }
  if (norm.includes("рен") || norm.includes("ren")) {
    return "https://img.icons8.com/color/96/r.png";
  }
  if (norm.includes("евроньюс") || norm.includes("euronews")) {
    return "https://img.icons8.com/emoji/96/newspaper-emoji.png";
  }
  if (norm.includes("nasa") || norm.includes("космос") || norm.includes("space")) {
    return "https://img.icons8.com/emoji/96/rocket-emoji.png";
  }

  // 2. Genre / keyword mappings
  if (norm.includes("детск") || norm.includes("мульт") || norm.includes("kids") || norm.includes("baby") || norm.includes("disney") || norm.includes("looloo") || norm.includes("cartoon") || norm.includes("chizhik") || norm.includes("ani")) {
    return "https://img.icons8.com/emoji/96/baby-chick.png";
  }
  if (norm.includes("кино") || norm.includes("фильм") || norm.includes("cinema") || norm.includes("movie") || norm.includes("film") || norm.includes("сериал") || norm.includes("serial")) {
    return "https://img.icons8.com/emoji/96/clapper-board.png";
  }
  if (norm.includes("спорт") || norm.includes("sport") || norm.includes("матч") || norm.includes("football") || norm.includes("soccer") || norm.includes("skateboard") || norm.includes("red bull") || norm.includes("arena")) {
    return "https://img.icons8.com/emoji/96/soccer-ball.png";
  }
  if (norm.includes("музык") || norm.includes("music") || norm.includes("песн") || norm.includes("song") || norm.includes("dance") || norm.includes("mtv") || norm.includes("vh1") || norm.includes("deluxe")) {
    return "https://img.icons8.com/emoji/96/headphone-emoji.png";
  }
  if (norm.includes("новост") || norm.includes("news") || norm.includes("инфо") || norm.includes("info") || norm.includes("вести") || norm.includes("рбк") || norm.includes("tass")) {
    return "https://img.icons8.com/emoji/96/newspaper-emoji.png";
  }
  if (norm.includes("природ") || norm.includes("wild") || norm.includes("animal") || norm.includes("earth") || norm.includes("discovery") || norm.includes("nature") || norm.includes("гео") || norm.includes("geo")) {
    return "https://img.icons8.com/emoji/96/lion-emoji.png";
  }
  if (norm.includes("кухн") || norm.includes("еда") || norm.includes("food") || norm.includes("cook") || norm.includes("рецепт")) {
    return "https://img.icons8.com/emoji/96/cooking.png";
  }
  if (norm.includes("авто") || norm.includes("auto") || norm.includes("car") || norm.includes("гонк") || norm.includes("race")) {
    return "https://img.icons8.com/emoji/96/racing-car.png";
  }
  if (norm.includes("рыбал") || norm.includes("охот") || norm.includes("fish")) {
    return "https://img.icons8.com/emoji/96/fish-emoji.png";
  }
  if (norm.includes("travel") || norm.includes("мир") || norm.includes("путеш") || norm.includes("авиа") || norm.includes("plane")) {
    return "https://img.icons8.com/emoji/96/airplane-emoji.png";
  }
  if (norm.includes("юмор") || norm.includes("смех") || norm.includes("comedy") || norm.includes("clown")) {
    return "https://img.icons8.com/emoji/96/clown-face-emoji.png";
  }
  if (norm.includes("семейн") || norm.includes("family") || norm.includes("жизнь") || norm.includes("life")) {
    return "https://img.icons8.com/emoji/96/house-with-garden.png";
  }
  if (norm.includes("relax") || norm.includes("релакс") || norm.includes("закат") || norm.includes("chill") || norm.includes("reef") || norm.includes("sunset")) {
    return "https://img.icons8.com/emoji/96/sunset-emoji.png";
  }

  return "https://img.icons8.com/emoji/96/television.png";
}

/**
 * Intelligent category classifier based on group-title or fallback keywords
 */
const RE_KIDS = /cartoon|disney|nickelodeon|baby|kids|детск|мульт|looloo|boomerang|cartoonito/i;
const RE_FAMILY = /family|семейн|дом|пятница|стс|тнт|кухня|жизнь/i;
const RE_SCIENCE = /discovery|nature|space|nasa|science|наука|космос|национал|national|geographic|animal|planet|дикая|природа|земля/i;
const RE_MUSIC = /music|mtv|vh1|музык|муз|clubbing|dj|dance|sound|shanson|рок|поп/i;
const RE_MOVIES = /movie|cinema|film|кино|фильм|хоррор|horror|drama|action|триллер|боевик|комедия|сериал/i;
const RE_SPORTS = /sport|red bull|football|soccer|спорт|матч|арена|фитнес|экстрим|ufc|boxing/i;
const RE_NEWS = /news|euronews|новост|рбк|вести|cgtn|france|cnn|bbc|bloomberg|tass/i;

function determineCategory(name: string, groupTitle: string): string {
  const normGroup = groupTitle.toLowerCase();
  const normName = name.toLowerCase();

  // 1. First, check group-title exact/substring matches
  if (normGroup.includes("kids") || normGroup.includes("children") || normGroup.includes("cartoon") || normGroup.includes("детск") || normGroup.includes("мульт")) {
    return "Kids";
  }
  if (normGroup.includes("family") || normGroup.includes("семейн") || normGroup.includes("дом") || normGroup.includes("стс")) {
    return "Family";
  }
  if (normGroup.includes("science") || normGroup.includes("nature") || normGroup.includes("discovery") || normGroup.includes("nasa") || normGroup.includes("space") || normGroup.includes("наука") || normGroup.includes("космос") || normGroup.includes("geo") || normGroup.includes("earth")) {
    return "Science";
  }
  if (normGroup.includes("music") || normGroup.includes("mtv") || normGroup.includes("vh1") || normGroup.includes("музык") || normGroup.includes("муз") || normGroup.includes("club") || normGroup.includes("dance")) {
    return "Music";
  }
  if (normGroup.includes("movie") || normGroup.includes("cinema") || normGroup.includes("film") || normGroup.includes("кино") || normGroup.includes("фильм") || normGroup.includes("serial") || normGroup.includes("сериал")) {
    return "Movies";
  }
  if (normGroup.includes("sport") || normGroup.includes("football") || normGroup.includes("soccer") || normGroup.includes("спорт") || normGroup.includes("матч")) {
    return "Sports";
  }
  if (normGroup.includes("news") || normGroup.includes("новости") || normGroup.includes("рбк") || normGroup.includes("вести") || normGroup.includes("eurorussian")) {
    return "News";
  }

  // 2. Keyword fallback matching on channel name
  if (RE_KIDS.test(normName)) return "Kids";
  if (RE_FAMILY.test(normName)) return "Family";
  if (RE_SCIENCE.test(normName)) return "Science";
  if (RE_MUSIC.test(normName)) return "Music";
  if (RE_MOVIES.test(normName)) return "Movies";
  if (RE_SPORTS.test(normName)) return "Sports";
  if (RE_NEWS.test(normName)) return "News";

  // 3. Fallback to Other
  return "Other";
}
