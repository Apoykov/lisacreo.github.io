(function () {
  const CONTACT_SECTION_ID = "Contact-Section";

  /** Same logical page as root index — avoids missing clicks when URL is `/` vs `/index.html`. */
  function normalizePathForIndexCompare(pathname) {
    const p = (pathname || "/").replace(/\/$/, "") || "/";
    if (p === "/" || /\/index\.html$/i.test(p)) return "__root_index__";
    return p.toLowerCase();
  }

  function isSamePageContactSectionLink(anchor) {
    if (!anchor || anchor.target === "_blank") return false;
    // Chatbot triggers intercept this click themselves — no anchor scroll needed.
    if (anchor.hasAttribute('data-chatbot-open')) return false;
    const hrefAttr = anchor.getAttribute("href");
    if (!hrefAttr || !hrefAttr.trim()) return false;
    let dest;
    try {
      dest = new URL(anchor.href, window.location.href);
    } catch {
      return false;
    }
    if (dest.hash.replace(/^#/, "") !== CONTACT_SECTION_ID) return false;
    const here = new URL(window.location.href);
    return normalizePathForIndexCompare(dest.pathname) === normalizePathForIndexCompare(here.pathname);
  }

  function scrollToContactSection() {
    const el = document.getElementById(CONTACT_SECTION_ID);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }

  /**
   * Плавный скролл к футеру #Contact-Section (фиксированный хедер — через scroll-margin-top в CSS).
   * Capture: раньше Webflow / дефолтного перехода по якорю, без Lenis (vendor — заглушка).
   */
  function initContactSectionAnchorScroll() {
    document.addEventListener(
      "click",
      (event) => {
        const link = event.target.closest("a");
        if (!link || !isSamePageContactSectionLink(link)) return;
        event.preventDefault();
        scrollToContactSection();
        try {
          history.pushState(null, "", "#" + CONTACT_SECTION_ID);
        } catch {
          /* ignore */
        }
      },
      true,
    );

    const runIfHash = () => {
      if (window.location.hash.replace(/^#/, "") !== CONTACT_SECTION_ID) return;
      if (!document.getElementById(CONTACT_SECTION_ID)) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToContactSection);
      });
    };

    window.addEventListener("load", runIfHash);
  }

  const contactEmail = "hello@lisacreo.com";

  function initStaticForms() {
    document.querySelectorAll("form.contact-form").forEach((form) => {
      form.setAttribute("method", "post");
      form.setAttribute("novalidate", "");

      form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        const data = new FormData(form);
        const firstName = data.get("First-Name") || data.get("firstName") || data.get("name") || "";
        const lastName = data.get("Last-Name") || data.get("lastName") || "";
        const email = data.get("Email") || data.get("email") || data.get("contact") || "";
        const message = data.get("field") || data.get("message") || data.get("brief") || "";

        const subject = encodeURIComponent("Запрос с сайта LisaCreo");
        const body = encodeURIComponent(
          [
            `Имя: ${String(firstName).trim()} ${String(lastName).trim()}`.trim(),
            `Email: ${email}`,
            "",
            "Сообщение:",
            String(message).trim(),
          ].join("\n"),
        );

        window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
      });
    });
  }

  function initMobileMenuEscClose() {
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const outer = document.querySelector(".mobile-menu-outer");
      if (!outer || outer.style.display === "none" || !outer.offsetParent) return;
      const closeBtn = outer.querySelector(".mobile-menu-close-btn");
      if (closeBtn) closeBtn.click();
    });
  }

  function hardenExternalLinks() {
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
      link.setAttribute("rel", "noopener noreferrer");
    });
  }

  function improveImages() {
    document.querySelectorAll("img").forEach((img) => {
      if (!img.hasAttribute("decoding")) img.setAttribute("decoding", "async");
      if (!img.hasAttribute("loading")) img.setAttribute("loading", "lazy");
    });

    const priorityImage = document.querySelector(".project-info-image, .hero-section img");
    if (priorityImage) {
      priorityImage.setAttribute("loading", "eager");
      priorityImage.setAttribute("fetchpriority", "high");
    }
  }

  function initReducedMotion() {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.documentElement.classList.add("reduced-motion");
  }

  /**
   * Стекло — класс + .lc-header-glass. Tram/IX может писать inline background.
   * Гистерезис по scrollY убирает мигание класса у порога; без перезапуска
   * таймеров на каждый кадр скролла (это давало визуальные сбои).
   */
  function initHeaderGlassOnScroll() {
    const headers = document.querySelectorAll(".main-header");
    if (!headers.length) return;

    const bgStripSelector =
      ".w-layout-blockcontainer, .w-container, .header-main-box, .header-menu-box, .header-button-box";

    const getBgStripTargets = (header) => [
      header,
      ...header.querySelectorAll(bgStripSelector),
    ];

    const forceTransparentHeader = (header) => {
      getBgStripTargets(header).forEach((el) => {
        el.style.setProperty("background", "none", "important");
        el.style.setProperty("background-color", "transparent", "important");
        el.style.setProperty("background-image", "none", "important");
      });
    };

    /** Одноразовые задержки после load — только начальная борьба с IX, не на scroll. */
    const scheduleInitialIxBeats = () => {
      const delays = [0, 50, 150, 400, 800, 1600, 3200];
      delays.forEach((ms) => {
        window.setTimeout(() => {
          headers.forEach(forceTransparentHeader);
        }, ms);
      });
    };

    let scrolledLatch = false;
    const SCROLL_ON = 24;
    const SCROLL_OFF = 2;

    let ticking = false;
    const apply = () => {
      ticking = false;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      if (!scrolledLatch && y > SCROLL_ON) scrolledLatch = true;
      else if (scrolledLatch && y < SCROLL_OFF) scrolledLatch = false;

      headers.forEach((header) => {
        header.classList.toggle("lc-header-scrolled", scrolledLatch);
        forceTransparentHeader(header);
      });
    };

    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    let moRaf = 0;
    const onHeaderStyleMutations = () => {
      if (moRaf) return;
      moRaf = requestAnimationFrame(() => {
        moRaf = 0;
        headers.forEach(forceTransparentHeader);
      });
    };

    const mo = new MutationObserver(onHeaderStyleMutations);
    headers.forEach((header) => {
      getBgStripTargets(header).forEach((el) => {
        mo.observe(el, { attributes: true, attributeFilter: ["style"] });
      });
    });

    apply();
    scheduleInitialIxBeats();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    window.addEventListener("load", () => {
      requestAnimationFrame(apply);
      scheduleInitialIxBeats();
    });
  }

  /**
   * Scroll-reveal для карточек галереи на планшете (768–991px) и мобиле (≤767px).
   *
   * Планшет: IX застрял в translate3d(±120%) — CSS уже задаёт начальное
   *   состояние (opacity:0, translateY(40px)). Наблюдаем за всей сеткой и
   *   добавляем .lc-reveal ВСЕМ трём карточкам одновременно.
   *
   * Мобиль: CSS задаёт opacity:0, translateY(56px) + transition-delay на
   *   nth-child(2,3). Наблюдаем каждую карточку индивидуально — стаггер
   *   создаётся CSS delay, а не JS.
   *
   * Десктоп (≥992px): функция не запускается — Webflow IX управляет сам.
   */
  function initGalleryReveal() {
    const isTablet = window.matchMedia(
      "(min-width: 768px) and (max-width: 991px)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;

    if (!isTablet && !isMobile) return;

    const blocks = document.querySelectorAll(
      "#Gallery-Section .gallery-grid > .gallery-block"
    );
    if (!blocks.length) return;

    if (isTablet) {
      // Все три появляются одновременно, когда сетка входит во вьюпорт
      const grid = document.querySelector("#Gallery-Section .gallery-grid");
      if (!grid) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            blocks.forEach((block) => block.classList.add("lc-reveal"));
            observer.disconnect();
          }
        },
        { threshold: 0.15 }
      );

      observer.observe(grid);
    } else {
      // Мобиль: каждая карточка индивидуально, стаггер через CSS delay
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("lc-reveal");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );

      blocks.forEach((block) => observer.observe(block));
    }
  }

  /**
   * Scroll-reveal для карточек услуг на планшете 768–991px (только index / #Service-Section).
   *
   * IX a-21 задаёт TRANSFORM_MOVE ±120% по X на .service-block — перебиваем CSS !important
   * и используем ту же хореографию, что Gallery на планшете: opacity + translateY(40px).
   * На планшете видимы только .one/.two (.three «Креативы» скрыта CSS): .lc-reveal — у них же.
   *
   * ≥992 и ≤767 не трогаем — десктоп остаётся на Webflow IX, мобила — прежняя вёрстка.
   */
  function initServiceRevealTablet() {
    if (!document.querySelector("#Service-Section")) return;

    const isTablet = window.matchMedia(
      "(min-width: 768px) and (max-width: 991px)"
    ).matches;
    if (!isTablet) return;

    const blocks = document.querySelectorAll(
      "#Service-Section .service-grid > .service-block:not(.three)"
    );
    if (!blocks.length) return;

    const grid = document.querySelector("#Service-Section .service-grid");
    if (!grid) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          blocks.forEach((block) => block.classList.add("lc-reveal"));
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(grid);
  }

  /**
   * Scroll-reveal для карточек услуг на мобиле ≤767px.
   *
   * Как Gallery mobile: threshold 0.12, стаггер 110ms между карточками.
   * В отличие от Gallery (per-card observer), наблюдаем .service-grid и по
   * входу во вьюпорт вешаем .lc-reveal на каждый .service-block с задержкой
   * по индексу — последовательное появление без горизонтального IX.
   *
   * При смене ширины (например поворот) — пересоздаём observer.
   */
  function initServiceRevealMobile() {
    if (!document.querySelector("#Service-Section")) return;

    const mq = window.matchMedia("(max-width: 767px)");
    let observer = null;
    const timeouts = [];

    const cleanup = () => {
      timeouts.forEach((id) => window.clearTimeout(id));
      timeouts.length = 0;
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };

    const setup = () => {
      cleanup();
      if (!mq.matches) return;

      const grid = document.querySelector("#Service-Section .service-grid");
      const blocks = document.querySelectorAll(
        "#Service-Section .service-grid > .service-block"
      );
      if (!grid || !blocks.length) return;

      let triggered = false;
      const staggerMs = 110;

      observer = new IntersectionObserver(
        (entries) => {
          if (!entries[0]?.isIntersecting || triggered) return;
          triggered = true;
          if (observer) {
            observer.disconnect();
            observer = null;
          }
          blocks.forEach((block, i) => {
            const id = window.setTimeout(() => {
              block.classList.add("lc-reveal");
            }, i * staggerMs);
            timeouts.push(id);
          });
        },
        { threshold: 0.12 }
      );

      observer.observe(grid);
    };

    setup();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", setup);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(setup);
    }
  }

  /**
   * Scroll-play для project-video в #Project-Section.
   *
   * IO (threshold 0.5) запускает видео при ≥50 % видимости и ставит на паузу
   * при уходе. При первом intersect пытаемся воспроизвести с unmute; если
   * браузер блокирует (нет user-gesture), фолбэк — muted + оверлей
   * «Нажмите для звука». Одноразовый click/touchstart на document разблокирует
   * звук. prefers-reduced-motion — не автоплеим.
   */
  function initProjectVideoScrollPlay() {
    var video = document.querySelector(
      "#Project-Section .project-video"
    );
    if (!video) return;
    video.volume = 0.6;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      return;
    }

    var wrapper = video.closest(".project-image-box") || video.parentElement;
    var audioUnlocked = false;
    var overlayShown = false;

    function createOverlay() {
      if (overlayShown) return;
      overlayShown = true;

      var overlay = document.createElement("button");
      overlay.className = "lc-video-sound-overlay";
      overlay.setAttribute("aria-label", "Включить звук");
      overlay.textContent = "\uD83D\uDD0A Нажмите для звука";

      overlay.addEventListener("click", function (e) {
        e.stopPropagation();
        video.muted = false;
        audioUnlocked = true;
        overlay.remove();
        overlayShown = false;
      });

      wrapper.style.position = wrapper.style.position || "relative";
      wrapper.appendChild(overlay);
    }

    function removeOverlay() {
      var el = wrapper.querySelector(".lc-video-sound-overlay");
      if (el) {
        el.remove();
        overlayShown = false;
      }
    }

    function tryPlayWithSound() {
      video.muted = false;
      var promise = video.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(function () {
          video.muted = true;
          video.play();
          if (!audioUnlocked) createOverlay();
        });
      }
    }

    function onDocumentInteraction() {
      if (audioUnlocked) return;
      audioUnlocked = true;
      if (!video.paused) {
        video.muted = false;
      }
      removeOverlay();
      document.removeEventListener("click", onDocumentInteraction, true);
      document.removeEventListener("touchstart", onDocumentInteraction, true);
    }

    document.addEventListener("click", onDocumentInteraction, true);
    document.addEventListener("touchstart", onDocumentInteraction, true);

    var observer = new IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        if (entry.isIntersecting) {
          if (audioUnlocked) {
            video.muted = false;
            video.play();
          } else {
            tryPlayWithSound();
          }
        } else {
          video.pause();
          removeOverlay();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(wrapper);
  }

  /**
   * Fullscreen video overlay for gallery cards with data-video-src.
   *
   * Clicking a .gallery-block[data-video-src] (or any nested picture/img)
   * opens a dark overlay with the video. Supports prev/next navigation
   * between video cards and Escape to close.
   */
  function initGalleryVideoOverlay() {
    var cards = Array.from(
      document.querySelectorAll(".gallery-block[data-video-src]")
    );
    if (!cards.length) {
      console.warn("[LisaCreo] No .gallery-block[data-video-src] found — video overlay disabled.");
      return;
    }

    var overlay = document.createElement("div");
    overlay.className = "lc-gallery-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Видеоплеер");
    overlay.hidden = true;

    var video = document.createElement("video");
    video.className = "lc-gallery-overlay__video";
    video.setAttribute("playsinline", "");
    video.setAttribute("controls", "");
    video.setAttribute("preload", "metadata");
    video.volume = 0.6;

    var closeBtn = document.createElement("button");
    closeBtn.className = "lc-gallery-overlay__close";
    closeBtn.setAttribute("aria-label", "Закрыть");
    closeBtn.textContent = "\u00D7";

    var prevBtn = document.createElement("button");
    prevBtn.className = "lc-gallery-overlay__nav lc-gallery-overlay__nav--prev";
    prevBtn.setAttribute("aria-label", "Предыдущее видео");
    prevBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';

    var nextBtn = document.createElement("button");
    nextBtn.className = "lc-gallery-overlay__nav lc-gallery-overlay__nav--next";
    nextBtn.setAttribute("aria-label", "Следующее видео");
    nextBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>';

    overlay.appendChild(video);
    overlay.appendChild(closeBtn);
    overlay.appendChild(prevBtn);
    overlay.appendChild(nextBtn);
    document.body.appendChild(overlay);

    var currentIndex = -1;

    function openVideo(index) {
      if (index < 0 || index >= cards.length) return;
      currentIndex = index;
      var src = cards[index].getAttribute("data-video-src");
      if (!src) {
        console.warn("[LisaCreo] data-video-src missing on gallery-block index " + index);
        return;
      }
      console.log("[LisaCreo] opening video", src);
      video.src = src;
      video.load();

      video.play().catch(function (err) {
        console.warn("[LisaCreo] Video play blocked:", err.message);
      });

      overlay.hidden = false;
      document.body.style.overflow = "hidden";

      prevBtn.style.display = cards.length > 1 ? "" : "none";
      nextBtn.style.display = cards.length > 1 ? "" : "none";
    }

    function closeOverlay() {
      overlay.hidden = true;
      video.pause();
      video.currentTime = 0;
      video.removeAttribute("src");
      video.load();
      document.body.style.overflow = "";
      currentIndex = -1;
    }

    function navigatePrev() {
      if (currentIndex <= 0) {
        openVideo(cards.length - 1);
      } else {
        openVideo(currentIndex - 1);
      }
    }

    function navigateNext() {
      if (currentIndex >= cards.length - 1) {
        openVideo(0);
      } else {
        openVideo(currentIndex + 1);
      }
    }

    video.addEventListener("error", function () {
      console.warn("[LisaCreo] Failed to load video: " + (video.src || "(empty)"));
    });

    cards.forEach(function (card, i) {
      card.style.cursor = "pointer";
      card.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openVideo(i);
      });
    });

    document.addEventListener("click", function (event) {
      var card = event.target.closest(".gallery-block[data-video-src]");
      if (!card) return;

      event.preventDefault();
      event.stopPropagation();

      var liveCards = Array.from(
        document.querySelectorAll(".gallery-block[data-video-src]")
      );
      var index = liveCards.indexOf(card);

      openVideo(index >= 0 ? index : 0);
    }, true);

    closeBtn.addEventListener("click", closeOverlay);
    prevBtn.addEventListener("click", function (e) { e.stopPropagation(); navigatePrev(); });
    nextBtn.addEventListener("click", function (e) { e.stopPropagation(); navigateNext(); });

    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeOverlay();
    });

    document.addEventListener("keydown", function (e) {
      if (overlay.hidden) return;
      if (e.key === "Escape") { closeOverlay(); return; }
      if (e.key === "ArrowLeft") { navigatePrev(); return; }
      if (e.key === "ArrowRight") { navigateNext(); return; }
    });
  }

  function safeCall(name, fn) {
    try { fn(); }
    catch (err) { console.error("[LisaCreo] " + name + " failed:", err); }
  }

  function boot() {
    safeCall("initContactSectionAnchorScroll", initContactSectionAnchorScroll);
    safeCall("initStaticForms", initStaticForms);
    safeCall("initMobileMenuEscClose", initMobileMenuEscClose);
    safeCall("hardenExternalLinks", hardenExternalLinks);
    safeCall("improveImages", improveImages);
    safeCall("initReducedMotion", initReducedMotion);
    safeCall("initHeaderGlassOnScroll", initHeaderGlassOnScroll);
    safeCall("initGalleryReveal", initGalleryReveal);
    safeCall("initServiceRevealTablet", initServiceRevealTablet);
    safeCall("initServiceRevealMobile", initServiceRevealMobile);
    safeCall("initProjectVideoScrollPlay", initProjectVideoScrollPlay);
    safeCall("initGalleryVideoOverlay", initGalleryVideoOverlay);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

})();
