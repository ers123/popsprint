"use strict";

(() => {
  const ADS_ENABLED = false;
  const ADS_CLIENT = "ca-pub-REPLACE_WITH_REAL_ID";

  if (!ADS_ENABLED) {
    return;
  }

  if (!ADS_CLIENT || ADS_CLIENT.includes("REPLACE_WITH_REAL_ID")) {
    console.warn("Ads disabled: set a real Google ad client ID.");
    return;
  }

  // Child-focused default: request non-personalized ads.
  window.adsbygoogle = window.adsbygoogle || [];
  window.adsbygoogle.requestNonPersonalizedAds = 1;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(ADS_CLIENT);
  script.crossOrigin = "anonymous";
  document.head.appendChild(script);
})();
