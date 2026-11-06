/**
 * Weather Now - 실시간 날씨 웹 애플리케이션
 * 사용 API (무료, API Key 불필요):
 * 1. Open-Meteo Weather Forecast API (https://api.open-meteo.com/v1/forecast)
 * 2. Open-Meteo Geocoding API (https://geocoding-api.open-meteo.com/v1/search)
 * 3. OpenStreetMap Nominatim API (한국 상세 행정구역/동/구 검색 보조 및 역지오코딩)
 */

const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const geoBtn = document.getElementById('geo-btn');
const quickCities = document.getElementById('quick-cities');
const searchResultsEl = document.getElementById('search-results');

const statusBox = document.getElementById('status-box');
const loadingSpinner = document.getElementById('loading-spinner');
const statusMessage = document.getElementById('status-message');
const weatherContent = document.getElementById('weather-content');

// DOM Elements for weather display
const locationNameEl = document.getElementById('location-name');
const locationSubEl = document.getElementById('location-sub');
const currentTimeEl = document.getElementById('current-time');
const weatherEmojiEl = document.getElementById('weather-emoji');
const currentTempEl = document.getElementById('current-temp');
const weatherDescEl = document.getElementById('weather-description');
const feelsLikeEl = document.getElementById('feels-like');
const highLowTempEl = document.getElementById('high-low-temp');

const metricHumidityEl = document.getElementById('metric-humidity');
const metricWindEl = document.getElementById('metric-wind');
const metricPrecipEl = document.getElementById('metric-precip');
const metricUvEl = document.getElementById('metric-uv');
const metricAqiEl = document.getElementById('metric-aqi');
const metricSunEl = document.getElementById('metric-sun');

const hourlyListEl = document.getElementById('hourly-list');
const dailyListEl = document.getElementById('daily-list');

// 실사 배경 이미지 및 동적 캔버스 레이어 DOM
const bgPhotoA = document.getElementById('bg-photo-a');
const bgPhotoB = document.getElementById('bg-photo-b');
const weatherCanvas = document.getElementById('weather-canvas');
const ctx = weatherCanvas ? weatherCanvas.getContext('2d') : null;
let activeBgLayer = 'A';
let currentBgUrl = '';
let canvasAnimId = null;
let currentEffect = 'clear-day';

// 날씨 상태별 고화질 실사 풍경 사진 (Unsplash CDN, 무료·No API Key)
const WEATHER_PHOTOS = {
  'clear-day':
    'https://images.unsplash.com/photo-1601297183305-6df142704ea2?auto=format&fit=crop&w=1920&q=85',
  'clear-night':
    'https://images.unsplash.com/photo-1507400492013-162706c8c05e?auto=format&fit=crop&w=1920&q=85',
  'partly-cloudy-day':
    'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1920&q=85',
  'partly-cloudy-night':
    'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?auto=format&fit=crop&w=1920&q=85',
  'cloudy':
    'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?auto=format&fit=crop&w=1920&q=85',
  'fog':
    'https://images.unsplash.com/photo-1487621167305-5d248087c724?auto=format&fit=crop&w=1920&q=85',
  'drizzle':
    'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1920&q=85',
  'rain':
    'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1920&q=85',
  'heavy-rain':
    'https://images.unsplash.com/photo-1428592953211-077101b2021b?auto=format&fit=crop&w=1920&q=85',
  'snow':
    'https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=1920&q=85',
  'heavy-snow':
    'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?auto=format&fit=crop&w=1920&q=85',
  'thunder':
    'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1920&q=85',
};

// 주요 국내외 도시 빠른 좌표 사전 (네트워크 지연 최소화 및 정확한 한글 매칭)
const PRESET_LOCATIONS = {
  '서울': { name: '서울특별시', sub: '대한민국', lat: 37.5665, lon: 126.9780 },
  '서울시': { name: '서울특별시', sub: '대한민국', lat: 37.5665, lon: 126.9780 },
  '서울특별시': { name: '서울특별시', sub: '대한민국', lat: 37.5665, lon: 126.9780 },
  '부산': { name: '부산광역시', sub: '대한민국', lat: 35.1796, lon: 129.0756 },
  '부산시': { name: '부산광역시', sub: '대한민국', lat: 35.1796, lon: 129.0756 },
  '인천': { name: '인천광역시', sub: '대한민국', lat: 37.4563, lon: 126.7052 },
  '대구': { name: '대구광역시', sub: '대한민국', lat: 35.8714, lon: 128.6014 },
  '대전': { name: '대전광역시', sub: '대한민국', lat: 36.3504, lon: 127.3845 },
  '광주': { name: '광주광역시', sub: '대한민국', lat: 35.1595, lon: 126.8526 },
  '울산': { name: '울산광역시', sub: '대한민국', lat: 35.5384, lon: 129.3114 },
  '세종': { name: '세종특별자치시', sub: '대한민국', lat: 36.4800, lon: 127.2890 },
  '제주': { name: '제주시', sub: '대한민국 제주특별자치도', lat: 33.4996, lon: 126.5312 },
  '제주도': { name: '제주특별자치도', sub: '대한민국', lat: 33.4996, lon: 126.5312 },
  '서귀포': { name: '서귀포시', sub: '대한민국 제주특별자치도', lat: 33.2541, lon: 126.5601 },
  '수원': { name: '수원시', sub: '대한민국 경기도', lat: 37.2636, lon: 127.0286 },
  '성남': { name: '성남시', sub: '대한민국 경기도', lat: 37.4200, lon: 127.1267 },
  '판교': { name: '성남시 분당구 판교', sub: '대한민국 경기도', lat: 37.3947, lon: 127.1112 },
  '강남': { name: '서울 강남구', sub: '대한민국 서울특별시', lat: 37.5172, lon: 127.0473 },
  '강남구': { name: '서울 강남구', sub: '대한민국 서울특별시', lat: 37.5172, lon: 127.0473 },
  '고양': { name: '고양시', sub: '대한민국 경기도', lat: 37.6584, lon: 126.8320 },
  '용인': { name: '용인시', sub: '대한민국 경기도', lat: 37.2411, lon: 127.1776 },
  '창원': { name: '창원시', sub: '대한민국 경상남도', lat: 35.2281, lon: 128.6811 },
  '청주': { name: '청주시', sub: '대한민국 충청북도', lat: 36.6424, lon: 127.4890 },
  '전주': { name: '전주시', sub: '대한민국 전라북도', lat: 35.8242, lon: 127.1480 },
  '천안': { name: '천안시', sub: '대한민국 충청남도', lat: 36.8151, lon: 127.1139 },
  '춘천': { name: '춘천시', sub: '대한민국 강원특별자치도', lat: 37.8813, lon: 127.7298 },
  '강릉': { name: '강릉시', sub: '대한민국 강원특별자치도', lat: 37.7519, lon: 128.8761 },
  '속초': { name: '속초시', sub: '대한민국 강원특별자치도', lat: 38.2070, lon: 128.5918 },
  '여수': { name: '여수시', sub: '대한민국 전라남도', lat: 34.7604, lon: 127.6622 },
  '포항': { name: '포항시', sub: '대한민국 경상북도', lat: 36.0190, lon: 129.3435 },
  '경주': { name: '경주시', sub: '대한민국 경상북도', lat: 35.8562, lon: 129.2247 },
  '도쿄': { name: '도쿄 (Tokyo)', sub: '일본', lat: 35.6895, lon: 139.6917 },
  '오사카': { name: '오사카 (Osaka)', sub: '일본', lat: 34.6937, lon: 135.5023 },
  '뉴욕': { name: '뉴욕 (New York)', sub: '미국', lat: 40.7128, lon: -74.0060 },
  '런던': { name: '런던 (London)', sub: '영국', lat: 51.5074, lon: -0.1278 },
  '파리': { name: '파리 (Paris)', sub: '프랑스', lat: 48.8566, lon: 2.3522 },
};

/**
 * WMO Weather interpretation codes (WW) 매핑
 * 첨부된 5x6 아이콘 스프라이트(weather-icons.png)의 (col, row) 좌표 연동
 */
function getWeatherInfo(code, isDay = 1) {
  const dayVal = (day, night) => (isDay ? day : night);

  const map = {
    0: {
      text: '맑음',
      icon: dayVal({ col: 2, row: 3 }, { col: 2, row: 4 }),
      theme: dayVal('theme-clear-day', 'theme-clear-night'),
      effect: dayVal('clear-day', 'clear-night'),
    },
    1: {
      text: '대체로 맑음',
      icon: dayVal({ col: 0, row: 1 }, { col: 0, row: 2 }),
      theme: dayVal('theme-clear-day', 'theme-clear-night'),
      effect: dayVal('clear-day', 'clear-night'),
    },
    2: {
      text: '구름 조금',
      icon: dayVal({ col: 0, row: 1 }, { col: 0, row: 2 }),
      theme: dayVal('theme-partly-cloudy-day', 'theme-partly-cloudy-night'),
      effect: dayVal('partly-cloudy-day', 'partly-cloudy-night'),
    },
    3: {
      text: '흐림',
      icon: { col: 0, row: 0 },
      theme: 'theme-cloudy',
      effect: 'cloudy',
    },
    45: {
      text: '안개',
      icon: dayVal({ col: 1, row: 3 }, { col: 0, row: 3 }),
      theme: 'theme-fog',
      effect: 'fog',
    },
    48: {
      text: '서리 안개',
      icon: { col: 4, row: 0 },
      theme: 'theme-fog',
      effect: 'fog',
    },
    51: {
      text: '약한 이슬비',
      icon: dayVal({ col: 2, row: 0 }, { col: 3, row: 0 }),
      theme: 'theme-rain',
      effect: 'drizzle',
    },
    53: {
      text: '보통 이슬비',
      icon: { col: 1, row: 0 },
      theme: 'theme-rain',
      effect: 'drizzle',
    },
    55: {
      text: '강한 이슬비',
      icon: dayVal({ col: 1, row: 1 }, { col: 1, row: 2 }),
      theme: 'theme-rain',
      effect: 'rain',
    },
    56: {
      text: '어는 이슬비',
      icon: dayVal({ col: 2, row: 0 }, { col: 3, row: 0 }),
      theme: 'theme-rain',
      effect: 'drizzle',
    },
    57: {
      text: '강한 어는 이슬비',
      icon: dayVal({ col: 1, row: 1 }, { col: 1, row: 2 }),
      theme: 'theme-rain',
      effect: 'rain',
    },
    61: {
      text: '약한 비',
      icon: dayVal({ col: 2, row: 0 }, { col: 3, row: 0 }),
      theme: 'theme-rain',
      effect: 'drizzle',
    },
    63: {
      text: '보통 비',
      icon: dayVal({ col: 1, row: 1 }, { col: 1, row: 2 }),
      theme: 'theme-rain',
      effect: 'rain',
    },
    65: {
      text: '강한 비',
      icon: dayVal({ col: 2, row: 1 }, { col: 2, row: 2 }),
      theme: 'theme-rain',
      effect: 'heavy-rain',
    },
    66: {
      text: '어는 비',
      icon: dayVal({ col: 1, row: 1 }, { col: 1, row: 2 }),
      theme: 'theme-rain',
      effect: 'rain',
    },
    67: {
      text: '강한 어는 비',
      icon: dayVal({ col: 2, row: 1 }, { col: 2, row: 2 }),
      theme: 'theme-rain',
      effect: 'heavy-rain',
    },
    71: {
      text: '약한 눈',
      icon: dayVal({ col: 3, row: 1 }, { col: 3, row: 2 }),
      theme: 'theme-snow',
      effect: 'snow',
    },
    73: {
      text: '보통 눈',
      icon: dayVal({ col: 3, row: 1 }, { col: 3, row: 2 }),
      theme: 'theme-snow',
      effect: 'snow',
    },
    75: {
      text: '강한 눈',
      icon: dayVal({ col: 4, row: 1 }, { col: 4, row: 2 }),
      theme: 'theme-snow',
      effect: 'heavy-snow',
    },
    77: {
      text: '싸락눈',
      icon: dayVal({ col: 0, row: 4 }, { col: 0, row: 5 }),
      theme: 'theme-snow',
      effect: 'snow',
    },
    80: {
      text: '약한 소나기',
      icon: dayVal({ col: 1, row: 1 }, { col: 1, row: 2 }),
      theme: 'theme-rain',
      effect: 'rain',
    },
    81: {
      text: '보통 소나기',
      icon: dayVal({ col: 1, row: 1 }, { col: 1, row: 2 }),
      theme: 'theme-rain',
      effect: 'rain',
    },
    82: {
      text: '강한 소나기',
      icon: dayVal({ col: 2, row: 1 }, { col: 2, row: 2 }),
      theme: 'theme-rain',
      effect: 'heavy-rain',
    },
    85: {
      text: '약한 눈보라',
      icon: dayVal({ col: 4, row: 1 }, { col: 4, row: 2 }),
      theme: 'theme-snow',
      effect: 'snow',
    },
    86: {
      text: '강한 눈보라',
      icon: dayVal({ col: 4, row: 1 }, { col: 4, row: 2 }),
      theme: 'theme-snow',
      effect: 'heavy-snow',
    },
    95: {
      text: '뇌우 (천둥·번개)',
      icon: dayVal({ col: 1, row: 4 }, { col: 1, row: 5 }),
      theme: 'theme-thunder',
      effect: 'thunder',
    },
    96: {
      text: '우박을 동반한 뇌우',
      icon: dayVal({ col: 1, row: 4 }, { col: 1, row: 5 }),
      theme: 'theme-thunder',
      effect: 'thunder',
    },
    99: {
      text: '강한 우박과 뇌우',
      icon: dayVal({ col: 1, row: 4 }, { col: 1, row: 5 }),
      theme: 'theme-thunder',
      effect: 'thunder',
    },
  };

  return (
    map[code] || {
      text: '알 수 없음',
      icon: dayVal({ col: 2, row: 3 }, { col: 2, row: 4 }),
      theme: dayVal('theme-clear-day', 'theme-clear-night'),
      effect: dayVal('clear-day', 'clear-night'),
    }
  );
}

/**
 * 캔버스 크기 동기화
 */
function resizeWeatherCanvas() {
  if (!weatherCanvas) return;
  weatherCanvas.width = window.innerWidth;
  weatherCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeWeatherCanvas);
resizeWeatherCanvas();

/**
 * 실사 사진 위에 실시간 동적 기상 효과(햇살/빗줄기/눈보라/안개구름/별똥별/번개)를 60fps로 렌더링
 */
function startDynamicWeatherCanvas(effect) {
  if (!weatherCanvas || !ctx) return;
  if (canvasAnimId) cancelAnimationFrame(canvasAnimId);
  resizeWeatherCanvas();

  const w = () => weatherCanvas.width;
  const h = () => weatherCanvas.height;
  const particles = [];
  const clouds = [];
  let flashOpacity = 0;
  let angle = 0;

  // 구름/안개 레이어 생성 (구름 조금, 흐림, 안개, 비, 눈)
  if (['partly-cloudy-day', 'partly-cloudy-night', 'cloudy', 'fog', 'rain', 'heavy-rain', 'thunder'].includes(effect)) {
    const cloudCount = effect === 'fog' ? 10 : effect === 'cloudy' ? 8 : 5;
    for (let i = 0; i < cloudCount; i++) {
      clouds.push({
        x: Math.random() * w(),
        y: effect === 'fog' ? Math.random() * h() : Math.random() * (h() * 0.55),
        radius: Math.random() * 220 + 180,
        speedX: (Math.random() * 0.45 + 0.2) * (Math.random() < 0.5 ? 1 : -1),
        alpha: effect === 'fog' ? 0.14 : 0.1,
      });
    }
  }

  // 날씨별 파티클 초기화
  if (effect === 'drizzle' || effect === 'rain' || effect === 'heavy-rain' || effect === 'thunder') {
    const count = effect === 'drizzle' ? 70 : effect === 'rain' ? 140 : 220;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        len: Math.random() * 22 + 14,
        speedY: Math.random() * 10 + 14,
        speedX: -3.5,
        alpha: Math.random() * 0.45 + 0.25,
        width: Math.random() * 1.4 + 0.8,
      });
    }
  } else if (effect === 'snow' || effect === 'heavy-snow') {
    const count = effect === 'snow' ? 90 : 170;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        r: Math.random() * 3.8 + 1.2,
        speedY: Math.random() * 1.6 + 0.7,
        swayAmp: Math.random() * 1.2 + 0.4,
        swayPhase: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.65 + 0.3,
      });
    }
  } else if (effect === 'clear-day' || effect === 'partly-cloudy-day') {
    // 햇살 입자 (보케/빛망울)
    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * w(),
        y: Math.random() * h(),
        r: Math.random() * 28 + 8,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.12 + 0.03,
        pulseSpeed: Math.random() * 0.02 + 0.008,
        phase: Math.random() * Math.PI * 2,
      });
    }
  } else if (effect === 'clear-night' || effect === 'partly-cloudy-night') {
    // 반짝이는 별과 유성
    for (let i = 0; i < 65; i++) {
      particles.push({
        x: Math.random() * w(),
        y: Math.random() * (h() * 0.65),
        r: Math.random() * 1.8 + 0.6,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.04 + 0.015,
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, w(), h());
    angle += 0.012;

    // 1. 맑은 낮 햇살 광선(Sunbeam) 연출
    if (effect === 'clear-day' || effect === 'partly-cloudy-day') {
      const sunX = w() * 0.82;
      const sunY = h() * 0.12;
      const grad = ctx.createRadialGradient(
        sunX,
        sunY,
        10,
        sunX,
        sunY,
        Math.max(w(), h()) * 0.65
      );
      const pulse = Math.sin(angle * 1.5) * 0.04 + 0.18;
      grad.addColorStop(0, `rgba(255, 248, 200, ${pulse + 0.12})`);
      grad.addColorStop(0.35, `rgba(253, 224, 71, ${pulse * 0.55})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w(), h());

      for (const p of particles) {
        p.x += p.speedX;
        p.y += p.speedY;
        p.phase += p.pulseSpeed;
        if (p.x < -50) p.x = w() + 50;
        if (p.x > w() + 50) p.x = -50;
        if (p.y < -50) p.y = h() + 50;
        if (p.y > h() + 50) p.y = -50;

        const a = p.alpha * (0.65 + 0.35 * Math.sin(p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 250, 220, ${a})`;
        ctx.fill();
      }
    }

    // 2. 밤하늘 별 반짝임 연출
    if (effect === 'clear-night' || effect === 'partly-cloudy-night') {
      for (const s of particles) {
        s.phase += s.pulseSpeed;
        const a = 0.25 + 0.75 * Math.abs(Math.sin(s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        ctx.fill();
      }
    }

    // 3. 흐르는 구름 / 안개 볼륨 연출
    for (const c of clouds) {
      c.x += c.speedX;
      if (c.x - c.radius > w()) c.x = -c.radius;
      if (c.x + c.radius < 0) c.x = w() + c.radius;

      const grad = ctx.createRadialGradient(c.x, c.y, c.radius * 0.1, c.x, c.y, c.radius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${c.alpha})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. 비 / 소나기 빗줄기 연출
    if (effect === 'drizzle' || effect === 'rain' || effect === 'heavy-rain' || effect === 'thunder') {
      ctx.lineCap = 'round';
      for (const r of particles) {
        r.x += r.speedX;
        r.y += r.speedY;
        if (r.y > h() + 30) {
          r.y = -30;
          r.x = Math.random() * (w() + 200);
        }
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x + r.speedX * 1.6, r.y + r.len);
        ctx.strokeStyle = `rgba(200, 230, 255, ${r.alpha})`;
        ctx.lineWidth = r.width;
        ctx.stroke();
      }
    }

    // 5. 눈송이 흩날림 연출
    if (effect === 'snow' || effect === 'heavy-snow') {
      for (const f of particles) {
        f.swayPhase += 0.025;
        f.x += Math.sin(f.swayPhase) * f.swayAmp;
        f.y += f.speedY;
        if (f.y > h() + 15) {
          f.y = -15;
          f.x = Math.random() * w();
        }
        if (f.x > w() + 15) f.x = -15;
        if (f.x < -15) f.x = w() + 15;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${f.alpha})`;
        ctx.fill();
      }
    }

    // 6. 뇌우 번개 섬광 연출
    if (effect === 'thunder') {
      if (Math.random() < 0.006 && flashOpacity <= 0.02) {
        flashOpacity = 0.45;
      }
      if (flashOpacity > 0) {
        ctx.fillStyle = `rgba(225, 240, 255, ${flashOpacity})`;
        ctx.fillRect(0, 0, w(), h());
        flashOpacity *= 0.88;
      }
    }

    canvasAnimId = requestAnimationFrame(animate);
  }

  animate();
}

/**
 * 실시간 날씨 상태에 맞춰 동적 실사 배경 사진(Ken Burns 모션) 및 실시간 기상 캔버스 효과를 전환
 */
function updateWeatherBackground(weatherInfo) {
  document.body.className = weatherInfo.theme;

  const effect = weatherInfo.effect || 'clear-day';
  currentEffect = effect;
  startDynamicWeatherCanvas(effect);

  if (!bgPhotoA || !bgPhotoB) return;

  const photoUrl = WEATHER_PHOTOS[effect] || WEATHER_PHOTOS['clear-day'];
  if (photoUrl === currentBgUrl) return;
  currentBgUrl = photoUrl;

  const img = new Image();
  img.onload = () => {
    if (activeBgLayer === 'A') {
      bgPhotoB.style.backgroundImage = `url("${photoUrl}")`;
      bgPhotoB.classList.add('active');
      bgPhotoA.classList.remove('active');
      activeBgLayer = 'B';
    } else {
      bgPhotoA.style.backgroundImage = `url("${photoUrl}")`;
      bgPhotoA.classList.add('active');
      bgPhotoB.classList.remove('active');
      activeBgLayer = 'A';
    }
  };
  img.src = photoUrl;
}

/**
 * 풍향 각도(0~360)를 8방위 한글로 변환
 */
function getWindDirectionText(degree) {
  if (degree === undefined || degree === null) return '';
  const directions = ['북풍', '북동풍', '동풍', '남동풍', '남풍', '남서풍', '서풍', '북서풍'];
  const index = Math.round(((degree %= 360) < 0 ? degree + 360 : degree) / 45) % 8;
  return directions[index];
}

/**
 * 자외선 지수 등급 텍스트 반환
 */
function getUvLevelText(uv) {
  if (uv === undefined || uv === null) return '--';
  const val = Math.round(uv * 10) / 10;
  if (val < 3) return `${val} (낮음)`;
  if (val < 6) return `${val} (보통)`;
  if (val < 8) return `${val} (높음)`;
  if (val < 11) return `${val} (매우 높음)`;
  return `${val} (위험)`;
}

/**
 * 대기질(미세먼지 PM10, 초미세먼지 PM2.5) 등급 및 수치 텍스트 반환 (국내 환경부 기준 반영)
 */
function getAirQualityText(airCurrent) {
  if (!airCurrent) return '정보 없음';

  const pm10 = airCurrent.pm10;
  const pm25 = airCurrent.pm2_5;

  if ((pm10 === undefined || pm10 === null) && (pm25 === undefined || pm25 === null)) {
    return '정보 없음';
  }

  // PM10 등급 (0: 좋음, 1: 보통, 2: 나쁨, 3: 매우 나쁨)
  const getPm10Level = (v) => {
    if (v == null) return 0;
    if (v <= 30) return 0;
    if (v <= 80) return 1;
    if (v <= 150) return 2;
    return 3;
  };

  // PM2.5 등급 (0: 좋음, 1: 보통, 2: 나쁨, 3: 매우 나쁨)
  const getPm25Level = (v) => {
    if (v == null) return 0;
    if (v <= 15) return 0;
    if (v <= 35) return 1;
    if (v <= 75) return 2;
    return 3;
  };

  const levelLabels = ['좋음', '보통', '나쁨', '매우 나쁨'];
  const worstLevel = Math.max(getPm10Level(pm10), getPm25Level(pm25));
  const grade = levelLabels[worstLevel];

  const pm10Str = pm10 != null ? Math.round(pm10) : '-';
  const pm25Str = pm25 != null ? Math.round(pm25) : '-';

  return `${grade} (${pm10Str} / ${pm25Str} ㎍/㎥)`;
}

/**
 * 로딩/에러 상태 표시
 */
function showStatus(message, isError = false) {
  statusBox.classList.remove('hidden', 'error');
  if (isError) {
    statusBox.classList.add('error');
    loadingSpinner.classList.add('hidden');
  } else {
    loadingSpinner.classList.remove('hidden');
  }
  statusMessage.textContent = message;
}

function hideStatus() {
  statusBox.classList.add('hidden');
}

/**
 * 지역명으로 좌표 검색 (내장 사전 -> Open-Meteo Geocoding -> OpenStreetMap Nominatim 순서)
 */
async function geocodeLocation(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  // 1. 내장 주요 지역 사전 확인
  if (PRESET_LOCATIONS[cleanQuery]) {
    return [PRESET_LOCATIONS[cleanQuery]];
  }

  // 2. Open-Meteo Geocoding API 호출
  try {
    const omUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=5&language=ko&format=json`;
    const omRes = await fetch(omUrl);
    if (omRes.ok) {
      const omData = await omRes.json();
      if (omData.results && omData.results.length > 0) {
        return omData.results.map((item) => ({
          name: item.name,
          sub: [item.country, item.admin1, item.admin2].filter(Boolean).join(' · '),
          lat: item.latitude,
          lon: item.longitude,
        }));
      }
    }
  } catch (e) {
    console.warn('Open-Meteo Geocoding 오류, Nominatim으로 대체합니다.', e);
  }

  // 3. OpenStreetMap Nominatim API 호출 (한국의 구/동/읍/면 등 세부 지명 지원)
  const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&limit=5&accept-language=ko`;
  const nomRes = await fetch(nomUrl, {
    headers: { 'Accept': 'application/json' },
  });

  if (!nomRes.ok) {
    throw new Error('지역 검색 서버에 연결할 수 없습니다.');
  }

  const nomData = await nomRes.json();
  if (!nomData || nomData.length === 0) {
    return [];
  }

  return nomData.map((item) => {
    const parts = item.display_name.split(',').map((s) => s.trim());
    const name = item.name || parts[0];
    const sub = parts.slice(1, 4).reverse().join(' · ');
    return {
      name,
      sub: sub || item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    };
  });
}

/**
 * Open-Meteo API로 현재 날씨, 대기질 및 시간별/일간 예보 조회
 */
async function fetchWeatherByCoords(locationObj) {
  const { name, sub, lat, lon } = locationObj;
  showStatus(`'${name}'의 실시간 날씨 정보를 가져오는 중입니다...`);
  searchResultsEl.classList.add('hidden');

  try {
    const weatherParams = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'is_day',
        'precipitation',
        'weather_code',
        'wind_speed_10m',
        'wind_direction_10m',
      ].join(','),
      hourly: ['temperature_2m', 'weather_code', 'precipitation_probability', 'is_day'].join(','),
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'sunrise',
        'sunset',
        'uv_index_max',
        'precipitation_probability_max',
      ].join(','),
      wind_speed_unit: 'ms',
      timezone: 'auto',
    });

    const airParams = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      current: ['pm10', 'pm2_5', 'us_aqi'].join(','),
      timezone: 'auto',
    });

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?${weatherParams.toString()}`;
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${airParams.toString()}`;

    const [weatherRes, airRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(airUrl).catch(() => null),
    ]);

    if (!weatherRes.ok) {
      throw new Error(`날씨 API 응답 오류 (${weatherRes.status})`);
    }

    const weatherData = await weatherRes.json();
    const airData = airRes && airRes.ok ? await airRes.json() : null;

    renderWeather(locationObj, weatherData, airData);
    hideStatus();
    weatherContent.classList.remove('hidden');
  } catch (error) {
    console.error(error);
    showStatus(`날씨 데이터를 불러오지 못했습니다: ${error.message}`, true);
  }
}

/**
 * 받아온 날씨 및 대기질 데이터를 화면에 렌더링
 */
function renderWeather(locationObj, data, airData) {
  const { current, hourly, daily } = data;
  const weatherInfo = getWeatherInfo(current.weather_code, current.is_day);

  // 실시간 날씨에 맞춰 배경 테마 및 하늘 애니메이션(태양/달/별/구름/비/눈/안개/번개) 업데이트
  updateWeatherBackground(weatherInfo);

  // 위치 및 기준 시간 표시
  locationNameEl.textContent = locationObj.name;
  locationSubEl.textContent = `${locationObj.sub ? locationObj.sub + ' · ' : ''}위도 ${locationObj.lat.toFixed(2)}, 경도 ${locationObj.lon.toFixed(2)}`;

  const currentDate = new Date(current.time);
  const formattedTime = !isNaN(currentDate)
    ? `${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일 ${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')} 기준`
    : `${current.time.replace('T', ' ')} 기준`;
  currentTimeEl.textContent = formattedTime;

  // 현재 기온 및 상태 아이콘 (첨부 이미지 스프라이트 적용)
  weatherEmojiEl.style.setProperty('--col', weatherInfo.icon.col);
  weatherEmojiEl.style.setProperty('--row', weatherInfo.icon.row);
  currentTempEl.textContent = Math.round(current.temperature_2m * 10) / 10;
  weatherDescEl.textContent = weatherInfo.text;
  feelsLikeEl.textContent = `체감 온도 ${Math.round(current.apparent_temperature * 10) / 10}°C`;

  if (daily && daily.temperature_2m_max && daily.temperature_2m_min) {
    const maxT = Math.round(daily.temperature_2m_max[0]);
    const minT = Math.round(daily.temperature_2m_min[0]);
    highLowTempEl.textContent = `오늘 최고 ${maxT}°C / 최저 ${minT}°C`;
  }

  // 상세 지표
  metricHumidityEl.textContent = `${current.relative_humidity_2m}%`;
  const windDir = getWindDirectionText(current.wind_direction_10m);
  metricWindEl.textContent = `${current.wind_speed_10m} m/s (${windDir})`;
  metricPrecipEl.textContent = `${current.precipitation} mm`;
  metricUvEl.textContent = daily?.uv_index_max ? getUvLevelText(daily.uv_index_max[0]) : '--';
  metricAqiEl.textContent = getAirQualityText(airData?.current);

  if (daily?.sunrise?.[0] && daily?.sunset?.[0]) {
    const sunriseTime = daily.sunrise[0].split('T')[1] || '--:--';
    const sunsetTime = daily.sunset[0].split('T')[1] || '--:--';
    metricSunEl.textContent = `${sunriseTime} / ${sunsetTime}`;
  } else {
    metricSunEl.textContent = '--:-- / --:--';
  }

  // 시간별 예보 (현재 시각 이후 24시간)
  renderHourlyForecast(current.time, hourly);

  // 7일 주간 예보
  renderDailyForecast(daily);
}

/**
 * 향후 24시간 시간별 예보 렌더링
 */
function renderHourlyForecast(currentTimeStr, hourly) {
  hourlyListEl.innerHTML = '';
  if (!hourly || !hourly.time) return;

  // 현재 시각과 가장 가까운 인덱스 찾기
  const currentHourPrefix = currentTimeStr.slice(0, 13);
  let startIndex = hourly.time.findIndex((t) => t.startsWith(currentHourPrefix));
  if (startIndex === -1) startIndex = 0;

  const endIndex = Math.min(startIndex + 24, hourly.time.length);

  for (let i = startIndex; i < endIndex; i++) {
    const timeStr = hourly.time[i];
    const hourNum = parseInt(timeStr.slice(11, 13), 10);
    const label = i === startIndex ? '지금' : `${hourNum}시`;
    const temp = Math.round(hourly.temperature_2m[i]);
    const code = hourly.weather_code[i];
    const isDay = hourly.is_day ? hourly.is_day[i] : 1;
    const pop = hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0;
    const info = getWeatherInfo(code, isDay);

    const item = document.createElement('div');
    item.className = 'hourly-item';
    item.innerHTML = `
      <span class="hourly-time">${label}</span>
      <span class="weather-icon-sprite icon-hourly" style="--col: ${info.icon.col}; --row: ${info.icon.row};" aria-hidden="true"></span>
      <span class="hourly-temp">${temp}°</span>
      <span class="hourly-pop">${pop > 0 ? `${pop}%` : ''}</span>
    `;
    hourlyListEl.appendChild(item);
  }
}

/**
 * 7일 주간 예보 렌더링
 */
function renderDailyForecast(daily) {
  dailyListEl.innerHTML = '';
  if (!daily || !daily.time) return;

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  for (let i = 0; i < daily.time.length; i++) {
    const dateObj = new Date(daily.time[i] + 'T00:00:00');
    const dayName = i === 0 ? '오늘' : i === 1 ? '내일' : `${dateObj.getMonth() + 1}/${dateObj.getDate()} (${weekDays[dateObj.getDay()]})`;
    const info = getWeatherInfo(daily.weather_code[i], 1);
    const minTemp = Math.round(daily.temperature_2m_min[i]);
    const maxTemp = Math.round(daily.temperature_2m_max[i]);
    const pop = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;

    const row = document.createElement('div');
    row.className = 'daily-item';
    row.innerHTML = `
      <span class="daily-day">${dayName}</span>
      <div class="daily-status">
        <span class="weather-icon-sprite icon-daily" style="--col: ${info.icon.col}; --row: ${info.icon.row};" aria-hidden="true"></span>
        <span>${info.text}</span>
        ${pop >= 20 ? `<span class="daily-pop">${pop}%</span>` : ''}
      </div>
      <div class="daily-temps">
        <span class="daily-min">${minTemp}°</span>
        <span>/</span>
        <span class="daily-max">${maxTemp}°</span>
      </div>
    `;
    dailyListEl.appendChild(row);
  }
}

/**
 * 복수 검색 결과가 있을 때 선택 목록 표시
 */
function renderSearchCandidates(results) {
  searchResultsEl.innerHTML = '';
  if (results.length <= 1) {
    searchResultsEl.classList.add('hidden');
    return;
  }

  results.forEach((loc) => {
    const li = document.createElement('li');
    li.className = 'search-result-item';
    li.innerHTML = `
      <span class="result-main">${loc.name}</span>
      <span class="result-sub">${loc.sub || `위도 ${loc.lat.toFixed(2)}, 경도 ${loc.lon.toFixed(2)}`}</span>
    `;
    li.addEventListener('click', () => {
      searchResultsEl.classList.add('hidden');
      cityInput.value = loc.name;
      fetchWeatherByCoords(loc);
    });
    searchResultsEl.appendChild(li);
  });

  searchResultsEl.classList.remove('hidden');
}

/**
 * 검색 실행 핸들러
 */
async function handleSearch(query) {
  const trimmed = query.trim();
  if (!trimmed) return;

  showStatus(`'${trimmed}' 지역을 찾는 중입니다...`);
  searchResultsEl.classList.add('hidden');

  try {
    const locations = await geocodeLocation(trimmed);
    if (!locations || locations.length === 0) {
      showStatus(`'${trimmed}'에 해당하는 지역을 찾을 수 없습니다. 다른 지역명(예: 서울, 부산, 강남구)으로 검색해 보세요.`, true);
      return;
    }

    // 첫 번째(가장 정확도 높은) 결과를 즉시 조회하고, 동명/유사 지역이 있으면 드롭다운으로도 제공
    await fetchWeatherByCoords(locations[0]);
    if (locations.length > 1) {
      renderSearchCandidates(locations);
    }
  } catch (error) {
    console.error(error);
    showStatus(`검색 중 오류가 발생했습니다: ${error.message}`, true);
  }
}

// 이벤트 리스너 등록
searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleSearch(cityInput.value);
});

quickCities.addEventListener('click', (e) => {
  const chip = e.target.closest('.city-chip');
  if (!chip) return;
  const city = chip.dataset.city;
  cityInput.value = city;
  handleSearch(city);
});

// 내 위치(GPS) 기반 날씨 조회
geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showStatus('이 브라우저에서는 위치 정보 기능을 지원하지 않습니다.', true);
    return;
  }

  showStatus('현재 위치 좌표를 확인하는 중입니다...');
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      let name = '현재 내 위치';
      let sub = 'GPS 위치 기반';

      try {
        const revUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=ko`;
        const res = await fetch(revUrl);
        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          name = addr.borough || addr.suburb || addr.city || addr.town || addr.county || '현재 내 위치';
          sub = [addr.country, addr.province || addr.state, addr.city].filter(Boolean).join(' · ');
        }
      } catch (e) {
        console.warn('역지오코딩 실패, 기본 위치명을 사용합니다.', e);
      }

      fetchWeatherByCoords({ name, sub, lat, lon });
    },
    (err) => {
      console.warn(err);
      showStatus('위치 권한이 거부되었거나 위치를 확인할 수 없습니다. 지역명을 직접 입력해 주세요.', true);
    },
    { timeout: 10000 }
  );
});

// 외부 클릭 시 검색 결과 드롭다운 닫기
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search-section')) {
    searchResultsEl.classList.add('hidden');
  }
});

// 초기 진입 시 '서울' 날씨 자동 로드
window.addEventListener('DOMContentLoaded', () => {
  handleSearch('서울');
});

