(function () {
  "use strict";

  // Header con sombra al hacer scroll
  var header = document.getElementById("site-header");
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Menú móvil
  var hamburgerBtn = document.getElementById("hamburger-btn");
  var closeBtn = document.getElementById("mobile-close-btn");
  var mobileMenu = document.getElementById("mobile-menu");
  var backdrop = document.getElementById("mobile-backdrop");

  function openMenu() {
    hamburgerBtn.classList.add("is-open");
    hamburgerBtn.setAttribute("aria-expanded", "true");
    mobileMenu.classList.add("is-open");
    backdrop.classList.add("is-open");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    hamburgerBtn.classList.remove("is-open");
    hamburgerBtn.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener("click", function () {
      mobileMenu.classList.contains("is-open") ? closeMenu() : openMenu();
    });
  }
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);
  if (backdrop) backdrop.addEventListener("click", closeMenu);
  document.querySelectorAll(".mobile-link").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  // Acordeón de preguntas frecuentes
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var question = item.querySelector(".faq-question");
    var answer = item.querySelector(".faq-answer");
    question.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      document.querySelectorAll(".faq-item.is-open").forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove("is-open");
          openItem.querySelector(".faq-question").setAttribute("aria-expanded", "false");
          openItem.querySelector(".faq-answer").style.maxHeight = null;
        }
      });
      if (isOpen) {
        item.classList.remove("is-open");
        question.setAttribute("aria-expanded", "false");
        answer.style.maxHeight = null;
      } else {
        item.classList.add("is-open");
        question.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + 24 + "px";
      }
    });
  });

  // Selector de tapete (tráfico + color) -> WhatsApp con la selección
  var trafficButtons = document.querySelectorAll(".traffic-option");
  var colorButtons = document.querySelectorAll(".color-option");
  var summaryText = document.getElementById("selector-summary-text");
  var waBtn = document.getElementById("selector-whatsapp-btn");
  var trafficOptionsWrap = document.getElementById("traffic-options");
  var guideArrow = document.getElementById("step-guide-arrow");
  var pulseLegend = document.getElementById("pulse-legend");
  var modalBackdrop = document.getElementById("selector-modal-backdrop");
  var modalClose = document.getElementById("selector-modal-close");
  var modalTraffic = document.getElementById("selector-modal-traffic");
  var modalImage = document.getElementById("selector-modal-image");
  var modalColorName = document.getElementById("selector-modal-color-name");
  var modalWaBtn = document.getElementById("selector-modal-whatsapp-btn");

  if (waBtn && trafficButtons.length && colorButtons.length) {
    var selection = { traffic: null, trafficLabel: null, color: null, colorLabel: null };
    var wasReady = false;

    var openSelectorModal = function () {
      modalTraffic.textContent = "Tráfico: " + selection.trafficLabel;
      modalImage.src = "assets/img/colores/" + selection.color + ".webp";
      modalImage.alt = "Tapete atrapamugres color " + selection.colorLabel;
      modalColorName.textContent = selection.colorLabel;
      modalWaBtn.setAttribute("href", waBtn.getAttribute("href"));
      modalBackdrop.classList.add("is-open");
      document.body.style.overflow = "hidden";
    };
    var closeSelectorModal = function () {
      modalBackdrop.classList.remove("is-open");
      document.body.style.overflow = "";
    };
    modalClose.addEventListener("click", closeSelectorModal);
    modalBackdrop.addEventListener("click", function (e) {
      if (e.target === modalBackdrop) closeSelectorModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modalBackdrop.classList.contains("is-open")) closeSelectorModal();
    });

    var updateSelector = function () {
      var isReady = !!(selection.traffic && selection.color);
      guideArrow.classList.toggle("is-visible", !!selection.traffic && !selection.color);

      if (isReady) {
        summaryText.textContent = "Tu selección: " + selection.trafficLabel + " · " + selection.colorLabel;
        var msg =
          "Hola, quiero cotizar un tapete atrapamugres personalizado.\n" +
          "Tipo de tráfico: " + selection.trafficLabel + "\n" +
          "Color: " + selection.colorLabel;
        waBtn.setAttribute("href", "https://wa.me/573006715101?text=" + encodeURIComponent(msg));
        waBtn.classList.remove("is-disabled");
        waBtn.removeAttribute("aria-disabled");
        if (!wasReady) {
          waBtn.classList.remove("cta-attention");
          void waBtn.offsetWidth;
          waBtn.classList.add("cta-attention");
        }
      } else {
        summaryText.textContent = "Selecciona el tráfico y el color para continuar.";
        waBtn.setAttribute("href", "#");
        waBtn.classList.add("is-disabled");
        waBtn.setAttribute("aria-disabled", "true");
      }
      wasReady = isReady;
    };

    trafficButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        trafficButtons.forEach(function (b) {
          b.classList.remove("is-selected");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-selected");
        btn.setAttribute("aria-pressed", "true");
        trafficOptionsWrap.classList.remove("pulse-attention");
        pulseLegend.classList.add("is-hidden");
        selection.traffic = btn.dataset.traffic;
        selection.trafficLabel = btn.dataset.label;
        updateSelector();
      });
    });

    colorButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        colorButtons.forEach(function (b) {
          b.classList.remove("is-selected");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("is-selected");
        btn.setAttribute("aria-pressed", "true");
        selection.color = btn.dataset.color;
        selection.colorLabel = btn.dataset.label;
        updateSelector();
        if (selection.traffic) openSelectorModal();
      });
    });

    waBtn.addEventListener("click", function (e) {
      if (waBtn.classList.contains("is-disabled")) e.preventDefault();
    });
  }

  // Animaciones de entrada al hacer scroll
  var animatedEls = document.querySelectorAll(".animate-on-scroll");
  if ("IntersectionObserver" in window && animatedEls.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    animatedEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    animatedEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  // Expansión de imagen en tarjetas de producto al navegar en móvil (sin cursor)
  var productCards = document.querySelectorAll(".product-card");
  if ("IntersectionObserver" in window && productCards.length && window.matchMedia("(hover: none)").matches) {
    var productCardObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          entry.target.classList.toggle("is-focused", entry.isIntersecting);
        });
      },
      { threshold: 0.6 }
    );
    productCards.forEach(function (card) {
      productCardObserver.observe(card);
    });
  }

  // Año dinámico en el footer
  var yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
