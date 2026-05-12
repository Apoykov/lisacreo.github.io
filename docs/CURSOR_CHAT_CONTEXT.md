# LisaCreo — полный контекст сессии для Cursor

> Документ-снимок для продолжения работы в новом чате.
> Путь к проекту: **`/Users/olaf/Obsidian/LisaCreo/lisa_creo/`**
> Figma file key: **`3VymViruWWKqV3sGgnJkxO`**

---

## 1. Project Overview

- **Тип:** статический сайт (HTML + экспорт Webflow + кастомные слои).
- **Страницы:** `index.html` (главная), `artists.html`, `brands.html`.
- **CSS:**
  - `css/main.css` — база Webflow; редактируется только когда нужно менять Webflow-корень (`.marquee-bg-two left:auto`, CTA bg image, footer logo color и т.д.).
  - `css/production.css` — **все** кастомные переопределения (>4 600 строк, ~134 KB); подключается после `main.css`.
- **JS:**
  - `js/webflow-main.js`, `js/webflow-chunk1.js`, `js/webflow-chunk2.js`, `js/webflow-chunk3.js` — Webflow Interactions IX (анимации скролла, трансформации).
  - `js/production.js` — кастомный код: формы (`initStaticForms`), плавный скролл к `#Contact-Section`, header glass-on-scroll, gallery/service reveal (IntersectionObserver), video autoplay с звуком.
- **Документы:**
  - `FIGMA_TO_SITE_MAP.md` — маппинг секций Figma ↔ HTML.
  - `CLAUDE_FIGMA_INDEX_MAPPING.md` — маппинг node-id ↔ DOM-элементы.
  - `docs/CLAUDE_SITE_HANDOFF.md` — хэндофф-контекст для Claude в браузере.
  - `docs/CURSOR_CHAT_CONTEXT.md` — этот файл.

---

## 2. Current DOM Order on index.html

Порядок элементов сверху вниз в финальном состоянии:

| # | Элемент | ID / Class | Строки HTML |
|---|---------|-----------|-------------|
| 1 | **Header** | `header.main-header` | 42–103 |
| 2 | `div.page-wrapper` (контейнер) | `.page-wrapper` | 105 |
| 3 | **Hero** | `#Hero-Section` `.hero-section` | 107–214 |
| 4 | **Client logos** | `.client-section` (без ID) | 216–322 |
| 5 | **Project «Почему мне доверяют»** | `#Project-Section` `.project-section.pb-zero` | 326–500 |
| 6 | **Gallery «Видеопродакшн»** | `#Gallery-Section` `.gallery-section.pb-zero` | 502–542 |
| 7 | **Marquee «Визуалы»** | `#Marquee-Section` `.marquee-section` | 545–691 |
| 8 | HTML-комментарий: Service removed | — | 693 |
| 9 | **CTA «Готовы создать…»** | `.call-to-action` (без ID) | 695–756 |
| 10 | **Footer / Контакты** | `footer#Contact-Section` `.main-footer` | 758–812 |
| 11 | **Widget (sticky)** | `.sticky-info-box` | 814–895 |
| 12 | Scripts | vendor jQuery + webflow + production.js | 903–908 |

**Якорь порядка:** HTML-комментарий `<!-- Всегда сразу под «Видеопродакшн» (#Gallery-Section) … -->` перед `#Marquee-Section` (строка 544).

---

## 3. All Changes Made in This Session

### Section ordering
- Marquee section moved **after** Gallery (multiple iterations); final order: Hero → Clients → Project → Gallery → Marquee → CTA → Footer.

### Project section (`#Project-Section`)
- Mobile title typography per Figma 530:4794.
- `padding-bottom: 16px` on mobile.
- Video margins halved on smaller breakpoints.
- Video `aspect-ratio` aligned with Figma.

### Gallery section (`#Gallery-Section`)
- Mobile title clamp for single-line (длинное «Видеопродакшн» не переносится).
- Tablet title sizes: 68px / 56px per Figma.
- Video `aspect-ratio` per Figma.
- Scroll-reveal (IntersectionObserver) for tablet/mobile via `.lc-reveal` classes.

### Marquee section (`#Marquee-Section`)
- `.marquee-bg-three` positioning fixes: `left: 0 !important; width: 100% !important`.
- `.marquee-bg-two` → `left: auto` in `main.css`.
- Font-weight alignment with Service titles.
- Tablet/mobile title alignment.
- `.marquee-bg-three` responsive heights: mobile 59px, tablet 100px, desktop 150px.

### Service section — **removed from index.html**
- Figma alignment across 5 breakpoints (mobile / tablet / 992–1279 / 1280–1440 / ≥1441).
- Hide eyebrow + heading-aside on desktop.
- Left-align heading on tablet.
- 2-column tablet grid (3rd card hidden).
- Stacked mobile with staggered reveal animation (110ms per card).
- Eventually **removed** from `index.html`; preserved in `partials/service-section.html`.
- HTML comment placeholder left before CTA.
- `production.js` guards: `if (!document.querySelector("#Service-Section")) return;` — no errors when absent.

### «Подробнее» buttons
- Restyled to match «Обсудить проект» button (`.theme-button--project-card`): background, padding, text sizing.

### Mobile menu button
- Disc size: 54 → 56px.
- `border-radius: 28px` per Figma 798:345.

### Header
- 16px side padding on mobile (`≤767px`).
- Desktop ≥1440: heading `padding-bottom` +20px.
- Tablet 768–991: heading `padding-bottom` 16px.
- Glass effect on scroll (`lc-header-scrolled` + `.lc-header-glass`).

### CTA
- Background image changed to `start-your-brand.jpg` in `main.css` (`.bg.cta-bg`).

### Footer (`#Contact-Section`)
- Mobile 3-column wrapper (`footer-list-bottom`).
- Logo color `#ff61a6` in `main.css`.
- Line break in `.footer-text` via `<span class="footer-text-from-neuro">`.

### Widget (`.sticky-info-box`)
- Avatar changed to `ava.png`.
- Contacts reordered: Telegram `@lisacreo` first, then Phone, then Email `armadmb200@gmail.com`.

### Video autoplay
- `initProjectVideoScrollPlay()` in `production.js`: IntersectionObserver (threshold 0.5), unmute attempt, muted fallback + overlay «Нажмите для звука».

### Smooth scroll
- `initContactSectionAnchorScroll()`: capture-phase click handler on `a[href*="#Contact-Section"]`, `scrollIntoView({ behavior: smooth })`, `scroll-margin-top` in CSS.

---

## 4. Known Issues / Things to Watch

| Issue | Details |
|-------|---------|
| `production.css` size | >4 600 lines, heavy use of `!important` for breakpoint-specific overrides over Webflow IX inline styles. |
| Webflow IX still active | `webflow-chunk2.js` runs IX `a-21` (horizontal card slides); CSS `!important` prevents horizontal slide on tablet/mobile but IX code still fires. |
| `overflow-x: hidden` global | `html, body { overflow-x: hidden }` — may clip wide IX animations. |
| `.page-wrapper { overflow: visible }` | Set to fix service card IX clipping; may affect other scroll-driven animations. |
| Service CSS retained | `#Service-Section` rules remain in `production.css` (~800+ lines) for future re-insertion; increases parse cost. |
| Video autoplay + sound | Browsers with strict autoplay policies fall back to muted + overlay; some mobile browsers may not autoplay at all. |

---

## 5. Files Created This Session

| File | Purpose |
|------|---------|
| `partials/service-section.html` | Preserved Service section HTML for future re-insertion. |
| `docs/CLAUDE_SITE_HANDOFF.md` | Handoff context for Claude in browser. |
| `docs/CURSOR_CHAT_CONTEXT.md` | This file — full session context for Cursor. |
| `assets/ui/menu-white.svg` | White hamburger icon for mobile menu button. |

---

## 6. Key Selectors Reference

Most-used custom selectors in `production.css`:

| Selector | What it controls |
|----------|-----------------|
| `:root` | CSS vars: `--lc-accent`, `--lc-pink`, font families |
| `.page-wrapper` | `overflow: visible` (IX fix) |
| `#Contact-Section` | `scroll-margin-top` for fixed header |
| `.main-header` | Fixed header container, z-index, pointer-events |
| `.lc-header-glass` | Frosted glass backdrop layer |
| `.main-header.lc-header-scrolled` | Scrolled state (JS-toggled class) |
| `.mobile-menu-open-btn` | Menu button wrapper (sizing per Figma) |
| `.mobile-menu-open-disc` | Menu button disc (56px, border-radius 28px) |
| `.hero-title` / `.hero-title-two` | Hero headings per breakpoint |
| `.hero-modern-prefix` | «Современный» span (hidden on narrow screens) |
| `.banner-list-box` / `.banner-list` | Hero stats row |
| `#Project-Section .project-section-title` | «Почему мне доверяют» heading |
| `#Project-Section .theme-button--project-card` | «Подробнее» buttons |
| `.project-video` | Video element in Project section |
| `#Gallery-Section .gallery-grid` | 3-column gallery grid |
| `#Gallery-Section .gallery-block` | Individual gallery card |
| `.gallery-block.lc-reveal` | Revealed state (JS IntersectionObserver) |
| `#Marquee-Section.marquee-section` | Marquee section wrapper |
| `.marquee-section-title` / `.marquee-section-title-lead` | «Визуалы» heading |
| `.marquee-section-desc` | Marquee subtitle |
| `.bg.marquee-bg-three` | Pink radial glow under marquee |
| `.bg.marquee-bg-two` | Right gradient mask (`left: auto` in main.css) |
| `#Service-Section.service-section` | Service section (currently not in DOM) |
| `.service-grid > .service-block` | Service cards |
| `.service-block.lc-reveal` | Service card revealed state |
| `.call-to-action` / `.cta-bg` | CTA section + background |
| `#Contact-Section.main-footer` | Footer / contacts section |
| `.footer-list-bottom` | Mobile 3-column footer wrapper |
| `.footer-logo-text` | Footer logo text (`#ff61a6`) |
| `.footer-text-from-neuro` | Line-break span in footer text |
| `.sticky-info-box` | Floating widget (bottom-right) |
| `.info-image` | Widget avatar |
| `.lc-video-sound-overlay` | Video unmute overlay button |
| `.client-section .client-image` | Client logo strip |

---

## 7. How to Continue

1. **Read this file** + `docs/CLAUDE_SITE_HANDOFF.md` for full context.
2. **All custom CSS** goes in `css/production.css`; **JS** in `js/production.js`.
3. **`main.css`** edited only when Webflow base must change (e.g. `.marquee-bg-two left:auto`, CTA bg image, footer logo color).
4. **Section order** anchored by HTML comment above `#Marquee-Section` (line 544 of `index.html`).
5. **Service section** can be restored by copying `partials/service-section.html` between `#Marquee-Section` and `.call-to-action`; JS guards already handle its absence.
6. **Figma reference:** file key `3VymViruWWKqV3sGgnJkxO`; see `FIGMA_TO_SITE_MAP.md` and `CLAUDE_FIGMA_INDEX_MAPPING.md` for node-id mapping.
7. **Breakpoint strategy:** mobile ≤767 → tablet 768–991 → medium 992–1279 → large 1280–1440 → xl ≥1441.
