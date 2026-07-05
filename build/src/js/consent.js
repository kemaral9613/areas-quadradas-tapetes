(function () {
  "use strict";

  var STORAGE_KEY = "aq-cookie-consent";
  var banner = document.getElementById("cookie-banner");
  var acceptBtn = document.getElementById("cookie-accept");
  var rejectBtn = document.getElementById("cookie-reject");

  function updateGtagConsent(granted) {
    if (typeof window.gtag !== "function") return;
    window.gtag("consent", "update", {
      ad_storage: granted ? "granted" : "denied",
      ad_user_data: granted ? "granted" : "denied",
      ad_personalization: granted ? "granted" : "denied",
      analytics_storage: granted ? "granted" : "denied"
    });
  }

  // Convierte los scripts de marketing (Google Ads / Meta Pixel) de
  // type="text/plain" a scripts reales, solo cuando el usuario acepta cookies.
  function activateMarketingScripts() {
    document
      .querySelectorAll('script[type="text/plain"][data-consent="marketing"]')
      .forEach(function (placeholder) {
        var script = document.createElement("script");
        if (placeholder.dataset.src) {
          script.src = placeholder.dataset.src;
          script.async = true;
        } else {
          script.textContent = placeholder.textContent;
        }
        document.head.appendChild(script);
      });
  }

  function hideBanner() {
    if (banner) banner.classList.remove("is-visible");
  }

  function showBanner() {
    if (banner) banner.classList.add("is-visible");
  }

  function acceptConsent() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    updateGtagConsent(true);
    activateMarketingScripts();
    hideBanner();
  }

  function rejectConsent() {
    localStorage.setItem(STORAGE_KEY, "rejected");
    updateGtagConsent(false);
    hideBanner();
  }

  var stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "accepted") {
    updateGtagConsent(true);
    activateMarketingScripts();
  } else if (stored === "rejected") {
    updateGtagConsent(false);
  } else {
    window.setTimeout(showBanner, 600);
  }

  if (acceptBtn) acceptBtn.addEventListener("click", acceptConsent);
  if (rejectBtn) rejectBtn.addEventListener("click", rejectConsent);
})();
