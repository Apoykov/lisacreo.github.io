# LisaCreo — контекст для Claude (вёрстка и функционал)

Документ для обсуждения сайта в браузере с Claude: структура проекта, что уже сделано, куда смотреть в коде. Путь к репозиторию: **`/Users/olaf/Obsidian/LisaCreo/lisa_creo/`**.

---

## 1. Что это за проект

- **Тип:** статический сайт (HTML + экспорт Webflow + кастомные слои).
- **Страницы:** `index.html` (главная), `artists.html`, `brands.html`.
- **Стили:** `css/main.css` (база Webflow), **`css/production.css`** (основные правки под макеты и брейкпоинты).
- **Скрипты:** `js/webflow-main.js`, `js/webflow-chunk*.js` (интерактивы IX), **`js/production.js`** (формы, плавный якорь к контактам, scroll-reveal для галереи/услуг там, где секция есть в DOM).
- **Карта Figma ↔ сайт:** `FIGMA_TO_SITE_MAP.md`, `CLAUDE_FIGMA_INDEX_MAPPING.md` (актуализированы под текущий порядок секций и вынесенный блок услуг).

---

## 2. Порядок секций на главной (`index.html`)

Сверху вниз (только `<section>` в `page-wrapper`):

1. `#Hero-Section`
2. `client-section` (логотипы клиентов)
3. `#Project-Section` — «Почему мне доверяют»
4. `#Gallery-Section` — «Видеопродакшн»
5. `#Marquee-Section` / `marquee-section` — «Визуалы» (сразу после галереи)
6. **`call-to-action`** — блок с фоном и кнопкой «Обсудить проект»
7. **`footer#Contact-Section`** — футер / контакты

**Блок «Чем я могу помочь» (`#Service-Section`) на главной в DOM не вставлен.** Разметка сохранена в файле:

- **`partials/service-section.html`**

В `index.html` перед CTA оставлен комментарий-напоминание, куда вставлять фрагмент при возврате секции (между Marquee и CTA).

### Как вернуть секцию на главную

1. Открыть `partials/service-section.html`, скопировать весь `<section id="Service-Section" …>…</section>`.
2. Вставить в `index.html` **между** закрывающим `</section>` у `#Marquee-Section` и открывающим `<section … class="call-to-action">`.
3. Проверить ссылки в футере/меню на `#Service-Section` при необходимости.

`production.js` для `initServiceRevealTablet` / `initServiceRevealMobile` уже делает **`if (!document.querySelector("#Service-Section")) return;`** — при отсутствии секции ошибок нет.

---

## 3. Заметные технические решения (кратко)

- **Marquee «Визуалы»:** отдельная секция `#Marquee-Section`; типографика и отступы по брейкпоинтам в `production.css`. Слой свечения `.marquee-bg-three` привязан к ширине контейнера; правый градиент `.marquee-bg-two` в `main.css` с **`left: auto`**, чтобы маска не прилипала к левому краю. На широких экранах сдвиг ряда `.marquee-inner-box` под макет (см. комментарии в `production.css`).
- **Галерея:** IX + кастомный reveal на планшете/мобиле в `production.js` (`initGalleryReveal` и связанные классы `.lc-reveal`). Заголовок «Видеопродакшн» на узких экранах — `clamp` по ширине, чтобы длинное слово не переносилось (см. правила `#Gallery-Section` в `production.css`).
- **Услуги (когда секция в DOM):** в `production.css` много брейкпоинтов под Figma; на планшете 768–991 две колонки, третья карточка «Креативы» скрыта; горизонтальный IX карточек подменялся на fade/slide-up + `IntersectionObserver` в `production.js`; на мобиле — одна колонка и поочерёдное появление. **`overflow: visible`** на `#Service-Section` и карточках, чтобы не резать анимации.
- **Хедер (моб/планшет):** кнопка меню и отступы — в `production.css` / `main.css` (в т.ч. выравнивание под макет, размеры диска/иконки). CTA в шапке — классы `theme-button` и т.д.
- **Плавный скролл «Контакты»:** в `production.js` — `initContactSectionAnchorScroll` (capture на клик по ссылкам на тот же документ с `#Contact-Section`), `scrollIntoView` + `prefers-reduced-motion`; у `#Contact-Section` задан **`scroll-margin-top`** в `production.css` под фиксированный хедер.
- **CTA:** фон в `main.css` у `.bg.cta-bg` — **`../assets/portfolio/start-your-brand.jpg`** (путь относительно `css/`).
- **Футер:** мобильная трёхколоночная обёртка `footer-list-bottom` в разметке; стили в `production.css`. Лого текста LisaCreo в футере — **`#ff61a6`** (`main.css`, селектор под `#Contact-Section`).
- **Виджет справа внизу (`sticky-info-box`):** только на главной; аватар — **`assets/portfolio/ava.png`**, alt «Алиса Зверева».

---

## 4. Ассеты

- **`assets/portfolio/`** — фон CTA, работы портфолио, `ava.png` для виджета и др.
- **`assets/ui/`** — иконки (меню, соцсети в футере и т.д.).

---

## 5. Как пользоваться этим файлом с Claude в браузере

1. Приложите **`docs/CLAUDE_SITE_HANDOFF.md`** (или вставьте ключевые разделы) в чат вместе со скриншотом или вопросом по вёрстке.
2. Укажите **URL/файл** (`file:///…/index.html` или деплой) и **ширину viewport** или DevTools.
3. Для сверки с Figma используйте **`FIGMA_TO_SITE_MAP.md`** / **`CLAUDE_FIGMA_INDEX_MAPPING.md`** и пришлите **node-id** кадра.

---

## 6. Ограничения и честные пробелы

- Секция услуг **не рендерится** на главной — CSS для неё остаётся для будущего подключения из **`partials/service-section.html`**.
- Точная связка каждого блока с node-id Figma не везде прописана в CSS-комментариях — смотрите два markdown-файла карты выше.

*Документ сформирован как снимок контекста для итераций по вёрстке и JS; при крупных изменениях в репозитории имеет смысл обновить разделы 2–3 вручную или попросить Claude перечитать файлы.*
