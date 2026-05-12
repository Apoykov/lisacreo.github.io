# LisaCreo — полный контекст проекта для ChatGPT

> **Самодостаточный документ** — содержит структуру, код, историю изменений.
> Копируйте целиком в чат ChatGPT; доступ к файловой системе **не требуется**.
>
> Проект: **`/Users/olaf/Obsidian/LisaCreo/lisa_creo/`**
> Figma file key: **`3VymViruWWKqV3sGgnJkxO`**
> Дата: 11 мая 2026

---

## 1. О проекте

| Параметр | Значение |
|----------|----------|
| **Тип** | Статический сайт (HTML + экспорт Webflow + кастомные слои) |
| **Домен** | `https://lisacreo.ru/` |
| **Страницы** | `index.html` (главная), `artists.html` (для артистов), `brands.html` (для брендов) |
| **CSS** | `css/main.css` (база Webflow, ~5 500 строк) → `css/production.css` (кастомные переопределения, ~4 640 строк) |
| **JS** | `js/webflow-main.js` + `js/webflow-chunk1..3.js` (Webflow IX) → `js/production.js` (кастомный код) |
| **Шрифт** | Raleway (Google Fonts: 300–900) — переопределён в production.css вместо Plus Jakarta Sans / Poppins |
| **Figma fileKey** | `3VymViruWWKqV3sGgnJkxO` |
| **Дополнительные доки** | `FIGMA_TO_SITE_MAP.md`, `CLAUDE_FIGMA_INDEX_MAPPING.md`, `docs/CLAUDE_SITE_HANDOFF.md`, `docs/CURSOR_CHAT_CONTEXT.md` |

**Порядок загрузки в `<head>`:**

```html
<link href="css/main.css" rel="stylesheet">
<link href="css/production.css" rel="stylesheet">
<!-- Google Fonts: Raleway 300–900 -->
<script src="js/vendor/jquery-3.5.1.min.js"></script>
<script src="js/webflow-chunk1.js"></script>
<script src="js/webflow-chunk2.js"></script>
<script src="js/webflow-chunk3.js"></script>
<script src="js/webflow-main.js"></script>
<script src="js/production.js"></script>
```

---

## 2. Структура index.html

Порядок элементов сверху вниз (финальное состояние):

| # | Элемент | ID / Класс | Описание |
|---|---------|-----------|----------|
| 1 | **Header** | `header.main-header` | Фиксированный хедер (z-index 99). Glass-эффект при скролле. Пункты: Главная, Для артистов, Для брендов, Контакты. Кнопка «Обсудить проект». Мобильное меню (slideout). |
| 2 | **Page wrapper** | `div.page-wrapper` | Обёртка всех секций. `overflow: visible` (необходимо для IX-анимаций). |
| 3 | **Hero** | `section#Hero-Section.hero-section` | Full-viewport hero с фоном `main-img.jpg`, заголовок «LisaCreo», подзаголовок «Современный AI-продакшн…», 4 тега-счётчика (8 лет, 17k+, 100+, Full-cycle). |
| 4 | **Client logos** | `section.client-section` | Бесконечная бегущая строка логотипов (1xBet, Ингосстрах, Intimatrix, Лента, Работа.ру, Сбер). Parallax-скролл Webflow IX. |
| 5 | **Project** | `section#Project-Section.project-section.pb-zero` | «Почему мне доверяют» — 2 карточки (Для артистов, Для брендов) + видео-блок (`lisacreo-eyes.mp4`). Кнопки «Подробнее». |
| 6 | **Gallery** | `section#Gallery-Section.gallery-section.pb-zero` | «Видеопродакшн» — 3-колоночная сетка с фото (lisacreo4/5/2.jpeg). Scroll-reveal анимация. |
| 7 | **Marquee** | `section#Marquee-Section.marquee-section` | «Визуалы» — горизонтальная карусель работ. Радиальный розовый glow (`.marquee-bg-three`). |
| 8 | *(комментарий)* | `<!-- Service-Section removed -->` | Заглушка для удалённого блока услуг. |
| 9 | **CTA** | `section.call-to-action` | «Готовы создать что-то крутое?» — фоновое изображение, кнопка «Обсудить проект». |
| 10 | **Footer** | `footer#Contact-Section.main-footer` | Контактная секция / футер. 4-колоночная сетка: About (лого + текст + копирайт), Меню, Услуги, Соцсети. |
| 11 | **Widget** | `div.sticky-info-box` | Плавающий виджет (bottom-right, z-index 33). Аватар Алисы + контакты (Telegram, Телефон, Email). |

**Ключевой HTML-комментарий-якорь** (строка 544):

```html
<!-- Всегда сразу под «Видеопродакшн» (#Gallery-Section); ниже не переносить без необходимости. -->
```

---

## 3. artists.html / brands.html

### artists.html — «Для артистов»

- **Состояние:** полноценная страница с уникальным контентом.
- **Структура:** Header (идентичный index) → Hero (`project-info-section` с фото Webflow CDN) → Content (`project-detail` с текстом и изображениями).
- **Inline CSS:** собственные стили для scroll-reveal (`.wf-reveal`, `.wf-reveal-hero`, `.wf-reveal-image`), формат-листа (`.formats-list`), мобильного меню.
- **Особенности:** изображения — с CDN Webflow (`cdn.prod.website-files.com`), не локальные.
- **body class:** `page-artists`.

### brands.html — «Для брендов»

- **Состояние:** полноценная страница, аналогичная artists.html по структуре.
- **Inline CSS:** собственные стили (аналогичный набор `.wf-reveal`, mobile menu).
- **body class:** `page-brands`.

**Общее для обеих страниц:**
- Подключают те же `main.css` + `production.css` + `production.js`.
- Контакт-ссылки ведут на `index.html#Contact-Section`.
- Используют тот же header / mobile menu / widget / footer.
- SEO: собственные `<title>`, `<meta description>`, OG-теги, canonical, JSON-LD.

---

## 4. CSS-архитектура

### Два файла

| Файл | Роль | Объём |
|------|------|-------|
| `css/main.css` | **Webflow export** — базовые стили, Webflow-классы (`.w-*`), типографика, сетка, секции. Редактируется **только** при необходимости менять Webflow-корень. | ~5 500 строк |
| `css/production.css` | **Кастомные переопределения** — всё, что добавлено/изменено поверх Webflow. Подключается вторым. | ~4 640 строк, ~134 KB |

### Правки в main.css (минимальные)

Только три точечных изменения:

```css
/* 1. CTA фоновое изображение (было что-то другое) */
.bg.cta-bg {
  background-image: url("../assets/portfolio/start-your-brand.jpg");
}

/* 2. Маркер маркиз — правый градиент, left: auto */
.marquee-bg-two {
  /* … */
  position: absolute;
  top: 0;
  left: auto;    /* ← изменено (было left: 0) */
  right: 0;
}

/* 3. Цвет лого в футере */
#Contact-Section .footer-logo-text {
  color: #ff61a6;   /* ← добавлен новый селектор */
}
```

### Структура production.css

Файл разбит на нумерованные разделы:

| Раздел | Строки | Содержание |
|--------|--------|------------|
| 1. CSS-переменные | 8–16 | `--lc-accent`, `--lc-pink`, шрифт Raleway |
| 2. База | 18–63 | `scroll-behavior`, `overflow-x`, `font-family`, `text-rendering` |
| 2b. Marquee glow | 65–114 | `.marquee-bg-three` — позиционирование, размер, blur |
| 3. Фоны секций | 116–126 | `!important`-пути к `hero-bg`, `start-your-brand-bg` |
| 4. Фокус и интерактив | 128–219 | `:focus-visible`, tap-highlight, hover-эффекты, `.theme-btn-*` |
| 5. Медиа и иконки | 221–290 | `background: #181818` для изображений, `.project-video` |
| 6. Прочие секции | 291–388 | Мелкие фиксы |
| Service (#Service-Section) | 298–388 | Базовая геометрия карточек (оставлена для re-insertion) |
| 7. Hero | 389–588 | Раскладка hero, клип-маска, font-size, `.hero-modern-prefix` |
| 8. Banner-list | 589–633 | Теги-счётчики в hero |
| 9. Хедер — навигация | 634–689 | `.header-menu-link`, `.header-btn` |
| 9. Хедер — glass-эффект | 690–801 | `.lc-header-glass`, `.lc-header-scrolled` |
| 10. Карусель клиентов | 802–828 | `.client-image` |
| Breakpoints | 828–5000+ | Медиа-блоки для всех брейкпоинтов |
| prefers-reduced-motion | 4547–4611 | Отключение анимаций |
| Video overlay | 4613–4638 | `.lc-video-sound-overlay` |

### Брейкпоинты

| Media query | Figma фрейм | Назначение |
|-------------|-------------|------------|
| `≤479px` | 390px | Мобиль (компактный) |
| `≤767px` | 390px | Мобиль |
| `768px–991px` | 768px | Планшет |
| `992px–1279px` | 992px | Средний десктоп |
| `1280px–1440px` | 1440px | Широкий десктоп |
| `≥1441px` | 1920px | Ультра-широкий |

### Паттерн `!important`

Webflow IX (Interactions) применяет inline-стили через JavaScript (`transform`, `opacity`). Чтобы CSS мог перебить inline, используется `!important`. Типичный пример:

```css
@media (max-width: 767px) {
  #Marquee-Section .bg.marquee-bg-three {
    height: 59px !important;
    top: calc(50% - 29.5px) !important;
    filter: blur(32.514px) !important;
  }
}
```

---

## 5. JavaScript (production.js)

Весь код обёрнут в IIFE. Список функций:

| Функция | Описание |
|---------|----------|
| `normalizePathForIndexCompare(pathname)` | Нормализует URL для сравнения (`/` и `/index.html` → `__root_index__`). Вспомогательная. |
| `isSamePageContactSectionLink(anchor)` | Проверяет, ведёт ли ссылка на `#Contact-Section` текущей страницы. |
| `scrollToContactSection()` | Плавный скролл к `#Contact-Section`. Учитывает `prefers-reduced-motion`. |
| `initContactSectionAnchorScroll()` | **Smooth scroll.** Перехватывает клики на `a[href*="#Contact-Section"]` (capture phase), предотвращает дефолтный переход, вызывает `scrollToContactSection()`. Также обрабатывает hash при загрузке. |
| `initStaticForms()` | Привязывает `submit`-обработчик к `form.contact-form`. Собирает поля (First-Name, Email, message) и открывает `mailto:` ссылку. |
| `hardenExternalLinks()` | Добавляет `rel="noopener noreferrer"` всем `a[target="_blank"]`. |
| `improveImages()` | Добавляет `decoding="async"` + `loading="lazy"` всем `<img>`. Hero-изображению ставит `loading="eager"` + `fetchpriority="high"`. |
| `initReducedMotion()` | Добавляет класс `reduced-motion` на `<html>` при `prefers-reduced-motion: reduce`. |
| `initHeaderGlassOnScroll()` | **Glass-эффект хедера.** Гистерезис: scrollY > 24px → добавляет `.lc-header-scrolled`; scrollY < 2px → убирает. MutationObserver следит за inline-стилями Webflow и принудительно делает фон прозрачным. `scheduleInitialIxBeats()` — серия setTimeout после load для борьбы с IX. |
| `initGalleryReveal()` | **Scroll-reveal галереи.** Планшет (768–991): IntersectionObserver на `.gallery-grid`, threshold 0.15 — все 3 карточки получают `.lc-reveal` одновременно. Мобиль (≤767): каждая карточка наблюдается индивидуально (threshold 0.12), стаггер через CSS `transition-delay`. |
| `initServiceRevealTablet()` | **Scroll-reveal услуг (планшет).** Аналогично Gallery tablet — `.lc-reveal` при 15% видимости `.service-grid`. Пропускает `.three` (скрыта на планшете). Guard: `if (!document.querySelector("#Service-Section")) return;`. |
| `initServiceRevealMobile()` | **Scroll-reveal услуг (мобиль).** Стаггер 110ms между карточками. MediaQueryList listener для пересоздания при смене ориентации. Guard: `if (!document.querySelector("#Service-Section")) return;`. |
| `initProjectVideoScrollPlay()` | **Video autoplay.** IntersectionObserver (threshold 0.5) на `.project-video` в `#Project-Section`. При видимости: пытается воспроизвести с звуком; если браузер блокирует — fallback к muted + оверлей «Нажмите для звука». Click/touchstart на document разблокирует звук. `prefers-reduced-motion` — видео не автоплеится. |

**Инициализация** (`DOMContentLoaded`):

```javascript
document.addEventListener("DOMContentLoaded", () => {
  initContactSectionAnchorScroll();
  initStaticForms();
  hardenExternalLinks();
  improveImages();
  initReducedMotion();
  initHeaderGlassOnScroll();
  initGalleryReveal();
  initServiceRevealTablet();
  initServiceRevealMobile();
  initProjectVideoScrollPlay();
});
```

---

## 6. HTML-разметка (ключевые паттерны)

### Заголовки секций

Повторяющийся паттерн с `span`-хешем и `span`-текстом:

```html
<div class="sectitle-outer-box">
  <div class="section-title-box mb-zero">
    <h2 class="section-title project-section-title">
      <span class="project-section-title-hash" aria-hidden="true"># </span>
      <span class="project-section-title-lead">Почему мне доверяют</span>
    </h2>
    <p class="project-section-desc">Описание секции…</p>
  </div>
</div>
```

### Кнопки (`.theme-button`)

Анимированная кнопка с двумя текстовыми слоями (slide-up эффект Webflow IX):

```html
<a href="#Contact-Section" class="theme-button light w-inline-block">
  <div class="theme-btn-bg orange"></div>
  <div class="theme-btn-icon-box">
    <img src="assets/ui/arrow.svg" class="theme-btn-icon">
    <img src="assets/ui/arrow.svg" class="theme-btn-hover-icon">
  </div>
  <div class="theme-btn-text-box">
    <div class="theme-btn-text">Обсудить проект</div>
    <div class="theme-btn-hover-text">Обсудить проект</div>
  </div>
</a>
```

Модификаторы: `.light` (белый фон), `.gray`, `.dark`, `.orange` (для `.theme-btn-bg`). Класс `.theme-button--project-card` — стиль кнопки «Подробнее» в карточках Project.

### Мобильное меню

Slideout-панель слева, управляется Webflow IX:

```html
<div class="mobile-menu-outer" style="display: none;">
  <div class="bg mobile-menu-bg"></div>
  <div class="mobile-menu">
    <div class="mobile-logo-box">
      <img src="assets/ui/close.svg" class="mobile-menu-close-btn">
      <p class="header-logo-text">LisaCreo</p>
    </div>
    <div class="mobile-menu-box">
      <a href="index.html" class="mobile-dropdown-link mobile-dropdown-link--active w-inline-block">
        <div class="mobile-dropdown-title">Главная</div>
      </a>
      <!-- … остальные пункты … -->
    </div>
  </div>
</div>
```

Кнопка-гамбургер (Figma 798:345 — диск 56×56, r=28px):

```html
<div class="mobile-menu-open-btn" role="button" tabindex="0" aria-label="Открыть меню">
  <div class="mobile-menu-open-disc">
    <img src="assets/ui/menu-white.svg" class="header-menu-icon">
  </div>
</div>
```

### Footer

4-колоночная сетка (`footer-grid`) с виджетами:

```html
<footer id="Contact-Section" class="main-footer">
  <div class="footer-widgets-box">
    <div class="w-layout-blockcontainer container w-container">
      <div class="w-layout-grid footer-grid">
        <div class="footer-widget about-widget">
          <a href="index.html" class="footer-logo-link w-inline-block">
            <p class="footer-logo-text">LisaCreo</p>  <!-- цвет: #ff61a6 -->
          </a>
          <h5 class="footer-title">AI-визуал нового поколения.</h5>
          <p class="footer-text">Создаю … <span class="footer-text-from-neuro">нейросетей — …</span></p>
          <p class="footer-copyright">&copy; 2025 <a href="/">LisaCreo</a> | Алиса Зверева</p>
        </div>
        <div class="footer-list-bottom">
          <!-- 3 колонки: Меню, Услуги, Соцсети -->
        </div>
      </div>
    </div>
  </div>
</footer>
```

### Плавающий виджет

```html
<div class="sticky-info-box">
  <div class="info-image-box">
    <img src="assets/portfolio/ava.png" alt="Алиса Зверева" class="info-image">
  </div>
  <div class="info-content-box">
    <div class="info-name-box">
      <p class="info-name">Алиса Зверева</p>
      <p class="info-designation">Creative Director</p>
    </div>
    <div class="info-outer-box">
      <div class="info-box">
        <p class="info-title">Telegram</p>
        <a href="https://t.me/lisacreo"><p class="info-text">@lisacreo</p></a>
      </div>
      <div class="info-box">
        <p class="info-title">Телефон</p>
        <a href="tel:+79819580368"><p class="info-text">+7 (981) 958-0368</p></a>
      </div>
      <div class="info-box mb-zero">
        <p class="info-title">Email</p>
        <a href="mailto:armadmb200@gmail.com"><p class="info-text">armadmb200@gmail.com</p></a>
      </div>
    </div>
    <div class="info-dot-box">
      <div class="info-dot"></div>
      <div class="info-dot-ripple"></div>
    </div>
  </div>
</div>
```

---

## 7. Блок услуг (Service Section)

### Текущее состояние

**Удалён** из `index.html`. Вместо него — HTML-комментарий (строка 693):

```html
<!-- Service-Section removed; preserved copy at partials/service-section.html -->
```

### Где хранится

Файл: **`partials/service-section.html`** — полная копия секции (133 строки).

Содержит:
- `section#Service-Section.service-section` с `aria-labelledby`
- Заголовок «Чем я могу помочь» с eyebrow «Услуги» и aside-блоком
- 3 карточки (`.service-block`): AI-фото (`.one`), AI-видео (`.two`), Креативы (`.three`)
- Inline Webflow IX-атрибуты (`data-w-id`, transform стили)

### Как вернуть

1. Вставить содержимое `partials/service-section.html` между `#Marquee-Section` и `.call-to-action` (вместо комментария).
2. CSS-правила для `#Service-Section` **уже есть** в `production.css` (~800 строк).
3. JS-гарды уже на месте:

```javascript
// production.js — безопасно возвращается, если #Service-Section отсутствует
function initServiceRevealTablet() {
  if (!document.querySelector("#Service-Section")) return;
  // …
}
function initServiceRevealMobile() {
  if (!document.querySelector("#Service-Section")) return;
  // …
}
```

---

## 8. Хронология изменений

| # | Область | Что сделано |
|---|---------|-------------|
| 1 | **Section ordering** | Marquee перемещён после Gallery (несколько итераций). Финальный порядок: Hero → Clients → Project → Gallery → Marquee → CTA → Footer. |
| 2 | **Project section** | Мобильная типографика заголовка по Figma 530:4794. |
| 3 | **Project section** | `padding-bottom: 16px` на мобиле. |
| 4 | **Project section** | Отступы видео уменьшены вдвое на мелких брейкпоинтах. |
| 5 | **Project section** | `aspect-ratio` видео выровнен по Figma. |
| 6 | **Gallery section** | Мобильный заголовок clamp для однострочного «Видеопродакшн». |
| 7 | **Gallery section** | Планшетные размеры заголовка: 68px / 56px по Figma. |
| 8 | **Gallery section** | `aspect-ratio` видео по Figma. |
| 9 | **Gallery section** | Scroll-reveal (IntersectionObserver) для планшета/мобиля через `.lc-reveal`. |
| 10 | **Marquee section** | `.marquee-bg-three` — фикс позиционирования: `left: 0 !important; width: 100% !important`. |
| 11 | **Marquee section** | `.marquee-bg-two` → `left: auto` в `main.css`. |
| 12 | **Marquee section** | Font-weight выровнен с заголовками Service. |
| 13 | **Marquee section** | Планшетное/мобильное выравнивание заголовка. |
| 14 | **Marquee section** | `.marquee-bg-three` адаптивная высота: mobile 59px, tablet 100px, desktop 150px. |
| 15 | **Service section** | Выравнивание по Figma: 5 брейкпоинтов (mobile / tablet / 992–1279 / 1280–1440 / ≥1441). |
| 16 | **Service section** | Скрытие eyebrow + heading-aside на десктопе. |
| 17 | **Service section** | Left-align заголовка на планшете. |
| 18 | **Service section** | 2-колоночная планшетная сетка (3-я карточка скрыта). |
| 19 | **Service section** | Мобильный stacked layout с staggered reveal (110ms на карточку). |
| 20 | **Service section** | **Удалён** из index.html → сохранён в `partials/service-section.html`. |
| 21 | **Service section** | HTML-комментарий-заглушка перед CTA. JS-гарды: `if (!querySelector("#Service-Section")) return;`. |
| 22 | **Кнопки «Подробнее»** | Рестайлинг под «Обсудить проект» (`.theme-button--project-card`): фон, padding, размер текста. |
| 23 | **Mobile menu button** | Размер диска: 54 → 56px. `border-radius: 28px` по Figma 798:345. |
| 24 | **Header — mobile** | 16px боковые padding на ≤767px. |
| 25 | **Header — desktop** | ≥1440: heading `padding-bottom` +20px. |
| 26 | **Header — tablet** | 768–991: heading `padding-bottom` 16px. |
| 27 | **Header — glass** | Glass-эффект при скролле (`lc-header-scrolled` + `.lc-header-glass`). MutationObserver + гистерезис. |
| 28 | **CTA** | Фоновое изображение → `start-your-brand.jpg` в `main.css`. |
| 29 | **Footer** | Мобильная 3-колоночная обёртка (`footer-list-bottom`). |
| 30 | **Footer** | Цвет лого `#ff61a6` в `main.css` (`#Contact-Section .footer-logo-text`). |
| 31 | **Footer** | Line break в `.footer-text` через `<span class="footer-text-from-neuro">`. |
| 32 | **Widget** | Аватар заменён на `ava.png`. |
| 33 | **Widget** | Контакты переупорядочены: Telegram `@lisacreo` → Телефон → Email `armadmb200@gmail.com`. |
| 34 | **Video autoplay** | `initProjectVideoScrollPlay()`: IO threshold 0.5, unmute-попытка, muted fallback + оверлей «Нажмите для звука». |
| 35 | **Smooth scroll** | `initContactSectionAnchorScroll()`: capture-phase click, `scrollIntoView({ behavior: smooth })`, `scroll-margin-top` в CSS. |
| 36 | **SEO** | JSON-LD Schema.org (ProfessionalService + WebPage) в `<head>` index.html. |
| 37 | **Accessibility** | `aria-label`, `aria-hidden`, `role="button"`, `tabindex="0"` на ключевых элементах. |
| 38 | **prefers-reduced-motion** | Полный блок в production.css: отключение анимаций, snap-состояния IX, снижение blur GPU-нагрузки. |

---

## 9. Известные особенности

| Особенность | Детали |
|-------------|--------|
| **production.css размер** | >4 600 строк, активное использование `!important` для переопределения inline-стилей Webflow IX. |
| **Webflow IX активен** | `webflow-chunk2.js` выполняет IX `a-21` (горизонтальные слайды карточек); CSS `!important` предотвращает горизонтальное движение на планшете/мобиле, но JS-код всё равно выполняется. |
| **overflow-x: hidden глобально** | `html, body { overflow-x: hidden }` — может обрезать широкие IX-анимации. |
| **`.page-wrapper { overflow: visible }`** | Установлен для фикса IX-клиппинга service-карточек; может влиять на другие scroll-анимации. |
| **Service CSS сохранён** | Правила `#Service-Section` остаются в `production.css` (~800+ строк) для будущего восстановления; увеличивают время парсинга. |
| **Video autoplay + звук** | Браузеры со строгой autoplay-политикой фолбэчат к muted + оверлей; некоторые мобильные браузеры могут вообще не автоплеить. |
| **Webflow CDN изображения** | `artists.html` и `brands.html` грузят фото с `cdn.prod.website-files.com`, не из локальных assets. |
| **jQuery** | `jquery-3.5.1.min.js` подключен (требуется Webflow), но `production.js` написан на vanilla JS. |
| **Нет сборщика** | Проект без Webpack/Vite/etc — файлы подключаются напрямую в HTML. |
| **Figma дивергенция** | Некоторые inline-стили Webflow IX (transform, opacity) конфликтуют с CSS на определённых брейкпоинтах; MutationObserver в хедере борется с этим. |

---

## 10. Ассеты

### Директории

```
assets/
├── logos/          — SVG логотипы клиентов (1xbet, ingosstah, intimatrix, lenta, rabota, sber)
├── portfolio/      — JPG/JPEG/PNG работы + аватар
├── seo/            — og-lisacreo.jpg (OpenGraph)
├── ui/             — SVG иконки интерфейса (arrow, check, close, mark, menu, menu-white, social)
└── video/          — MP4 видео
```

### Портфолио (`assets/portfolio/`)

| Файл | Где используется |
|------|-----------------|
| `main-img.jpg` (3 MB) | Hero background (`.bg.hero-bg`) |
| `start-your-brand.jpg` | CTA background (`.bg.cta-bg`), approach-секция |
| `ava.png` | Виджет — аватар |
| `work-01.jpg` – `work-13.jpg` | Карточки Project, Marquee |
| `for-artists.jpg`, `for-brands.jpg` | Marquee |
| `lisacreo1.jpeg` – `lisacreo8.jpeg` | Gallery, дополнительные |

### Видео (`assets/video/`)

| Файл | Размер | Использование |
|------|--------|---------------|
| `lisacreo-eyes.mp4` | 80 MB | `#Project-Section` — автоплей по скроллу |
| `LisaCreo BALENCIAGA.mp4` | 20 MB | Дополнительное |
| `LisaCreo Freak Boutique.mp4` | 18 MB | Дополнительное |
| `LiasCreo Louis Vuitton.mp4` | 4.5 MB | Дополнительное |

### UI-иконки (`assets/ui/`)

| Файл | Назначение |
|------|-----------|
| `arrow.svg` | Стрелка в кнопках `.theme-button` |
| `menu-white.svg` | Гамбургер-иконка мобильного меню (белая) |
| `menu.svg` | Гамбургер (тёмный вариант) |
| `close.svg` | Крестик закрытия мобильного меню |
| `social.svg` | Иконка соцсетей / сервисов |
| `check.svg` | Галочка (ценовые списки) |
| `mark.svg` | Маркер |

### SEO (`assets/seo/`)

| Файл | Назначение |
|------|-----------|
| `og-lisacreo.jpg` | OpenGraph-превью для всех страниц |

---

## 11. Таблица селекторов — топ-20 кастомных из production.css

| # | Селектор | Что контролирует |
|---|----------|-----------------|
| 1 | `:root` | CSS-переменные: `--lc-accent`, `--lc-pink`, font-family Raleway |
| 2 | `.page-wrapper` | `overflow: visible` — фикс для Webflow IX горизонтальных анимаций |
| 3 | `#Contact-Section` | `scroll-margin-top: 96px` (80px на ≤991) — отступ под фиксированный хедер |
| 4 | `.main-header` | Фиксированный хедер, z-index, pointer-events |
| 5 | `.lc-header-glass` | Frosted glass backdrop-фильтр (blur, полупрозрачный фон при скролле) |
| 6 | `.main-header.lc-header-scrolled` | Состояние «прокручено» — активирует glass (класс добавляется JS) |
| 7 | `.mobile-menu-open-btn` / `.mobile-menu-open-disc` | Кнопка мобильного меню: 56×56px, border-radius 28px |
| 8 | `.hero-title` / `.hero-title-two` | Hero-заголовки — размеры по брейкпоинтам (12.3vw → 200px) |
| 9 | `.hero-modern-prefix` | Span «Современный» — скрыт на узких экранах |
| 10 | `#Project-Section .project-section-title` | Заголовок «Почему мне доверяют» |
| 11 | `#Project-Section .theme-button--project-card` | Кнопки «Подробнее» в карточках |
| 12 | `.project-video` | Видео-элемент в Project — `object-fit`, `border-radius` |
| 13 | `#Gallery-Section .gallery-grid` / `.gallery-block` | 3-колоночная сетка галереи + отдельные карточки |
| 14 | `.gallery-block.lc-reveal` | Состояние «показано» — opacity/transform transition (JS IntersectionObserver) |
| 15 | `#Marquee-Section.marquee-section` | Обёртка секции маркиз |
| 16 | `.bg.marquee-bg-three` | Розовый radial glow под маркизом — height/blur/position по брейкпоинтам |
| 17 | `.bg.marquee-bg-two` | Правый градиент-маска маркиза |
| 18 | `.call-to-action` / `.cta-bg` | CTA-секция + фоновое изображение |
| 19 | `#Contact-Section.main-footer` / `.footer-logo-text` | Футер + цвет лого (#ff61a6) |
| 20 | `.sticky-info-box` / `.info-image` / `.info-content-box` | Плавающий виджет: позиция, размеры аватара, backdrop-blur |

---

## Как продолжить работу

1. **Все кастомные CSS** → `css/production.css`. **JS** → `js/production.js`.
2. **`main.css`** редактируется **только** для изменения Webflow-корня.
3. **Порядок секций** зафиксирован HTML-комментарием перед `#Marquee-Section`.
4. **Service section** восстанавливается копированием `partials/service-section.html`.
5. **Figma:** file key `3VymViruWWKqV3sGgnJkxO`.
6. **Брейкпоинты:** ≤479 → ≤767 → 768–991 → 992–1279 → 1280–1440 → ≥1441.
