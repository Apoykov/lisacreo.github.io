# LisaCreo — CONTEXT FOR NEW CURSOR CHAT

## Текущее состояние проекта

Сайт:
[https://lisacreo.pro](https://lisacreo.pro)

GitHub Pages:
[https://github.com/Apoykov/lisacreo.github.io](https://github.com/Apoykov/lisacreo.github.io)

Локальная разработка:
~/Obsidian/LisaCreo/lisa_creo

Deploy repo:
~/Obsidian/LisaCreo/lisacreo.github.io

---

# Что уже сделано

## Оптимизация ассетов

Все изображения и видео оптимизированы.

Созданы:

* AVIF
* WEBP
* облегчённые MP4
* JPG/WEBP постеры для видео

Пути:
assets/optimized/portfolio/
assets/optimized/video/
assets/optimized/logos/

---

# Git / deploy

Сейчас:

* оригинальные тяжёлые mp4 НЕ пушатся
* optimized assets пушатся
* deploy идёт через отдельный repo:
  lisacreo.github.io

Важно:
старый deploy.sh был сломан:

* копировал .git
* вызывал Permission denied
* писал "✅ Сайт обновлён!" даже при failed push

Нужно потом переписать deploy pipeline.

---

# Главная проблема сейчас

## Видео НЕ открываются по клику

Постеры отображаются корректно.

Optimized mp4 доступны:

* assets/optimized/video/LisaCreo BALENCIAGA.mp4
* assets/optimized/video/LiasCreo Louis Vuitton.mp4
* assets/optimized/video/LisaCreo Freak Boutique.mp4

Пути на сервере работают:
curl показывает 200 OK.

---

# ВАЖНОЕ НАБЛЮДЕНИЕ

В DOM реальные карточки видео имеют класс:

.gallery-block

и атрибут:

data-video-src

Пример:

<div class="gallery-block one"
     data-video-src="assets/optimized/video/LisaCreo BALENCIAGA.mp4">

Но video-opening JS, вероятно, написан под другой селектор:
.video-card
или старую структуру.

Из-за этого:

* постеры есть
* overlay/video modal НЕ открывается
* click listener НЕ срабатывает

---

# Что нужно сделать

## Проверить:

* js/production.js
* index.html
* css/production.css

## Найти:

fullscreen video gallery / overlay logic.

## Исправить:

listener должен работать с:

.gallery-block[data-video-src]

---

# Требуемое поведение

При клике на:
.gallery-block
или вложенные picture/img:

1. открыть fullscreen overlay
2. взять mp4 из data-video-src
3. назначить video.src
4. video.load()
5. video.play()

---

# Overlay requirements

Если overlay отсутствует:

* создать через JS

Добавить:

* close button
* next/prev navigation
* Escape close

При закрытии:

* pause()
* currentTime = 0
* removeAttribute("src")
* load()

---

# Ограничения

НЕ:

* ломать Webflow animations
* менять дизайн
* трогать main.css
* менять layout

МОЖНО:

* менять js/production.js
* минимально менять production.css
* добавить overlay markup если нужно

---

# Debug

Добавить:
console.warn если:

* data-video-src отсутствует
* mp4 не загрузился

Проверить:

* listener вешается после DOMContentLoaded

---

# Проверка после фикса

Нужно:

1. локально открыть сайт
2. кликнуть все 3 видео
3. проверить:

   * autoplay
   * close
   * next/prev
   * mobile
   * Escape

После фикса:
git add .
git commit -m "Fix fullscreen video gallery"
git push

---

# Дополнительно

На сайте browser DOM иногда показывает короткие fallback пути:
work-09.avif
ava.avif

Но это НЕ проблема:
реальный HTML уже использует:
assets/optimized/...

curl подтверждает это.
