# Контекст апдейта (для Claude Code)

Точка отсчёта таймлайна: **«я поработал с index.html в claude code...»** (после этого — изменения в репозитории).

## Таймлайн изменений (с указанной точки)

- **Обновлён hero-copy на главной (index.html)** по тексту из скриншота + закреплены требования по верстке (не переносить подзаголовок).
- **Сделан responsive-pass в `css/production.css`**: собраны и согласованы брейкпоинты, унифицированы отступы хедера, доведена адаптивная раскладка секции проектов.
- **Починен CTA в шапке (header button)**: исправлены hover-цвета текста, искажения круга/пилюли и конфликт с Webflow IX, добавлены точечные геометрические гарантии на ключевых брейкпоинтах.
- **Обновлён цвет бургера** (`assets/ui/menu.svg`) на розовый stroke.
- **Хедер перенесён на внутренние страницы `artists.html` и `brands.html`** (структура 1-в-1 с `index.html`, те же `data-w-id`/классы), ссылки “Контакты/Услуги” на внутренних страницах ведут на `index.html#...`, т.к. секций может не быть.
- **Гайд `FIGMA_MCP_WORKFLOW.md` ожидается, но в текущем состоянии репозитория не найден** (в папке проекта нет `.md` файлов и поиск по имени/содержимому не дал результатов).

## Ключевые функциональные изменения (важное)

### 1) Hero: текст и требования к отображению (index.html + production.css)

- **H2 в hero обновлён** на: **«AI-продакшен с опытом реальной рекламы»**.
  - Локация: `index.html`, блок Hero, строка **L142**: `h2.hero-title-two` (см. также `span.hero-modern-prefix`).
- **Баннерные счётчики (4 пункта)** приведены к скриншот-версии:
  - `# 8 лет / в рекламе`
  - `# 17k+ / креативов`
  - `# 100+ / музыкальных видео`
  - `# Full-cycle / ai продакшн`
  - Локация: `index.html` строки **L150–L202** (внутри `.banner-list-box` → `.banner-list`).
- **Подзаголовок hero не должен переноситься** (только на самом узком ≤479 допускается перенос):
  - В `css/production.css` базово зафиксировано `white-space: nowrap !important;` для `.hero-title-two` + `opacity: 0.86 !important;`
  - Локация: `css/production.css` строки **L337–L348** (база), а также брейкпоинты:
    - `@media (max-width: 767px)` строки **L1980–L1988** (по-прежнему nowrap)
    - `@media (max-width: 479px)` строки **L2069–L2075** (переключение на `white-space: normal !important;`)
- **Визуальная специфика**:
  - opacity подзаголовка: **86%** (реализовано как `opacity: 0.86 !important;` и/или цвет `rgba(255,255,255,0.86)` на крупных брейкпоинтах).
  - “Современный” в префиксе скрывается: `.hero-modern-prefix { display: none !important; }` (см. `css/production.css` **L350–L353** и повторения в брейкпоинтах).

### 2) Responsive-pass в production.css (брейкпоинты + выравнивание хедера + Project section)

Заданы/согласованы брейкпоинты:

- **≤479px**: `@media (max-width: 479px)` — компактные отступы, разрешение переноса hero-subtitle, подстройка project-типографики и хедера.
  - Локация: `css/production.css` **L1990–L2092**
- **≤767px**: `@media (max-width: 767px)` — выравнивание паддингов хедера с секциями, mobile-геометрия CTA, перестройка Project в одну колонку.
  - Локация: `css/production.css` **L1870–L1988**
- **768–991px**: `@media (min-width: 768px) and (max-width: 991px)` — отступы хедера/Project + отдельный блок для mobile-header-геометрии на планшете.
  - Локации: `css/production.css` **L1521–L1576** (Project + header padding), и **L1807–L1868** (tablet override для mobile header)
- **992–1279px**: `@media (min-width: 992px) and (max-width: 1279px)` — desktop-header с меньшими паддингами + 2-колоночная логика Project.
  - Локация: `css/production.css` **L1277–L1516**
- **1280–1440px**: `@media (min-width: 1280px)` + `@media (min-width: 1280px) and (max-width: 1440px)` — 1440-frame специфика для hero и header.
  - Локации: `css/production.css` **L581–L808** и **L1214–L1271**
- **1441px+**: `@media (min-width: 1441px)` — крупный desktop (в т.ч. хедер/CTA геометрия, hero 1920).
  - Локации: `css/production.css` **L814–L874** (header/CTA) и **L876–L1208** (hero + project)

Отдельно отмечено:

- **Гармонизация padding хедера** под разные ширины: см. `css/production.css` блоки
  - `@media (min-width: 1441px)` **L815–L863**
  - `@media (min-width: 1280px) and (max-width: 1440px)` **L1215–L1226**
  - `@media (min-width: 992px) and (max-width: 1279px)` **L1279–L1289**
  - `@media (min-width: 768px) and (max-width: 991px)` **L1532–L1537**
  - `@media (max-width: 767px)` **L1872–L1877**
  - `@media (max-width: 479px)` **L1996–L2001**
- **Project section адаптив**: переход к 1 колонке и настройка gap/типографики на tablet/mobile.
  - Основные мобильные правила: `css/production.css` **L1884–L1978**
  - Tablet правила: `css/production.css` **L1539–L1560**

### 3) Header CTA button: hover, круг/пилюля, Webflow IX и финальное поведение

**Hover: текст CTA в шапке становится белым** (только на устройствах с hover):

- Локация: `css/production.css` **L105–L126**
  - `@media (hover: hover)` и правила:
    - `.header-btn:hover .theme-btn-text, .header-btn:hover .theme-btn-hover-text { color: #fff !important; }`

**Проблема искажения круга** была подтверждена через DevTools: деформация шла от размеров `.theme-btn-bg.orange` (фон/пилюля) в составе header CTA.

**Критичный принцип**: `.theme-btn-bg` анимируется Webflow IX (inline `style="width: 40px;"` → в процессе может становиться `auto`), поэтому **нельзя “глобально” фиксировать width в CSS** — иначе ломается анимация.

Финальное ожидаемое поведение:

- **По умолчанию (HTML)** у header CTA фон-пилюля стартует как круг:
  - Локация: `index.html` **L61–L70**, конкретно **L62**: `<div class="theme-btn-bg orange" style="width: 40px;"></div>`
- **На ≤767** — только для header CTA — принудительно делаем стартовую ширину 28px:
  - Локация: `css/production.css` `@media (max-width: 767px)` **L1879–L1882**:
    - `.header-btn .theme-btn-bg, .header-btn .theme-btn-bg.orange { width: 28px !important; }`
- **На ≥1441** — геометрия “левого круга” должна быть 40×40 при высоте кнопки 50px и инсетах 5px:
  - Локация: `css/production.css` `@media (min-width: 1441px)` **L827–L863**:
    - Кнопка: высота 50, padding `5px ...`, r=30 (**L828–L833**)
    - `.theme-btn-bg(.orange)`: не трогаем width, но фиксируем inset/top/bottom/left и даём `min-width: 40px` (**L835–L847**)
    - `.theme-btn-icon-box`: жёстко 40×40 + min/max + aspect-ratio, чтобы круг не “приплющивался” (**L849–L863**)

### 4) Burger icon: цвет

- Файл `assets/ui/menu.svg` обновлён: stroke сейчас **`#ff61a6`**.
  - Локация: `assets/ui/menu.svg` **L1**.
  - Примечание: в `css/production.css` для `.header-menu-icon` есть `filter: brightness(0) !important;` (**L436–L439**), поэтому итоговый цвет в UI может дополнительно определяться CSS-фильтром на `<img>`.

### 5) Хедер перенесён на `artists.html` и `brands.html`

- На обе страницы добавлен хедер **вне `.page-wrapper`**, структура копирует `index.html` (включая `data-w-id`, классы, `lc-header-glass`).
  - `artists.html`: строки **L87–L147**
  - `brands.html`: строки **L112–L175**
- На внутренних страницах ссылки на отсутствующие секции переведены на якоря главной:
  - `artists.html`: `href="index.html#Contact-Section"` (**L102–L108** и др.)
  - `brands.html`: `href="index.html#Contact-Section"` (**L127–L134** и др.)

### 6) FIGMA_MCP_WORKFLOW.md

- В текущем состоянии папки проекта файл **`FIGMA_MCP_WORKFLOW.md` не найден** (и вообще не обнаружены `.md` файлы в `/Users/olaf/Obsidian/LisaCreo/lisa_creo/`).
  - Если гайд должен быть частью репозитория — его нужно добавить/восстановить отдельно.

## Список затронутых файлов (по текущему состоянию)

- `index.html`
- `css/production.css`
- `assets/ui/menu.svg`
- `artists.html`
- `brands.html`
- `FIGMA_MCP_WORKFLOW.md` — **ожидался, но отсутствует**

