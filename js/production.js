(function () {
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

  document.addEventListener("DOMContentLoaded", () => {
    initStaticForms();
    hardenExternalLinks();
    improveImages();
    initReducedMotion();
    initHeaderGlassOnScroll();
  });
})();
