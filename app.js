(function () {
  "use strict";

  /* ---------------- language ---------------- */
  var LANGS = ["en", "ne"];
  var KEY = "jfg-lang";

  function preferred() {
    try {
      var saved = localStorage.getItem(KEY);
      if (LANGS.indexOf(saved) > -1) return saved;
    } catch (e) {}
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz === "Asia/Kathmandu" || tz === "Asia/Katmandu") return "ne";
    } catch (e) {}
    var list = navigator.languages || [navigator.language || "en"];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i]).toLowerCase().indexOf("ne") === 0) return "ne";
    }
    return "en";
  }

  function setLang(lang) {
    if (LANGS.indexOf(lang) < 0) lang = "en";
    var root = document.documentElement;
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang === "ne" ? "ne" : "en");

    document.querySelectorAll(".lang-pane").forEach(function (p) {
      p.hidden = p.getAttribute("lang") !== lang;
    });
    document.querySelectorAll("[data-en]").forEach(function (el) {
      var v = el.getAttribute("data-" + lang);
      if (v) el.textContent = v;
    });
    document.querySelectorAll("[data-ph-en]").forEach(function (el) {
      var v = el.getAttribute("data-ph-" + lang);
      if (v) el.setAttribute("placeholder", v);
    });
    document.getElementById("lang-en").setAttribute("aria-pressed", String(lang === "en"));
    document.getElementById("lang-ne").setAttribute("aria-pressed", String(lang === "ne"));
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    document.title = lang === "ne"
      ? "गरिमालाई न्याय — मुद्दा, कानुन र पाँच माग"
      : "Justice for Garima — the case, the law, and five demands";
    renderSigs();
  }

  document.getElementById("lang-en").addEventListener("click", function () { setLang("en"); });
  document.getElementById("lang-ne").addEventListener("click", function () { setLang("ne"); });

  /* ---------------- i18n strings used by scripts ---------------- */
  var T = {
    en: {
      saving: "Saving your signature…",
      signed: "Signed. Thank you.",
      needName: "Add a name first.",
      offline: "Signatures are not being collected on this deployment yet. Use the letter below — a message that reaches a ministry inbox is worth more than a name on a list.",
      failed: "That did not save. Check your connection and try once more.",
      slow: "Too many signatures at once. Wait a minute and try again.",
      dupe: "That name is already on the list.",
      copied: "Copied",
      copy: "Copy",
      copyDemands: "Copy the demands",
      anon: "Anonymous",
      demandsHead: "Five demands in the Garima Chaudhary case (Jitpur Simara-1, Bara):",
      demandsTail: "Not capital punishment: Article 16(2) of the Constitution of Nepal forbids it."
    },
    ne: {
      saving: "हस्ताक्षर सुरक्षित गर्दै…",
      signed: "हस्ताक्षर भयो। धन्यवाद।",
      needName: "पहिले नाम लेख्नुहोस्।",
      offline: "यो साइटमा अहिले हस्ताक्षर संकलन भइरहेको छैन। तलको पत्र प्रयोग गर्नुहोस् — मन्त्रालयसम्म पुग्ने सन्देशको सूचीमा नाम राख्नुभन्दा बढी महत्त्व हुन्छ।",
      failed: "सुरक्षित भएन। इन्टरनेट जाँचेर फेरि प्रयास गर्नुहोस्।",
      slow: "एकैचोटि धेरै हस्ताक्षर आए। एक मिनेटपछि फेरि प्रयास गर्नुहोस्।",
      dupe: "यो नाम पहिल्यै सूचीमा छ।",
      copied: "कपी भयो",
      copy: "कपी",
      copyDemands: "मागहरू कपी गर्नुहोस्",
      anon: "अज्ञात",
      demandsHead: "गरिमा चौधरी प्रकरण (जितपुर सिमरा–१, बारा) का पाँच माग:",
      demandsTail: "मृत्युदण्ड होइन: नेपालको संविधानको धारा १६(२) ले यसलाई निषेध गर्छ।"
    }
  };
  function t(k) { return T[document.documentElement.getAttribute("data-lang") || "en"][k]; }

  /* ---------------- signatures ---------------- */
  var sigs = [];
  var backendUp = null; // null = unknown, false = not configured

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function showOffline() {
    var box = document.getElementById("countblock");
    if (box) box.hidden = true;
    var form = document.getElementById("sigform");
    if (form) form.hidden = true;
    say("err", t("offline"));
  }

  function renderSigs() {
    var countEl = document.getElementById("sigcount");
    var ul = document.getElementById("siglist");
    if (!countEl || !ul) return;
    if (backendUp === false) { ul.innerHTML = ""; showOffline(); return; }
    countEl.textContent = sigs.length;
    ul.innerHTML = sigs.slice().reverse().slice(0, 200).map(function (s) {
      return '<li><span class="who">' + esc(s.n || t("anon")) + "</span>" +
        (s.d ? '<span class="where">' + esc(s.d) + "</span>" : "") +
        (s.m ? '<div class="say">“' + esc(s.m) + "”</div>" : "") + "</li>";
    }).join("");
  }

  var msgEl = document.getElementById("sigmsg");
  function say(kind, text) {
    msgEl.className = "msg show " + kind;
    msgEl.textContent = text;
  }

  function load() {
    fetch("/api/signatures", { headers: { accept: "application/json" } })
      .then(function (r) {
        if (r.status === 501 || r.status === 503) { backendUp = false; return null; }
        if (!r.ok) throw new Error("bad");
        return r.json();
      })
      .then(function (data) {
        if (!data) { renderSigs(); return; }
        backendUp = true;
        sigs = Array.isArray(data.signatures) ? data.signatures : [];
        renderSigs();
      })
      .catch(function () { backendUp = false; renderSigs(); });
  }
  load();

  document.getElementById("sigform").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (document.getElementById("f-website").value) return; // honeypot
    var n = document.getElementById("f-name").value.trim().slice(0, 60);
    var d = document.getElementById("f-place").value.trim().slice(0, 40);
    var m = document.getElementById("f-msg").value.trim().slice(0, 180);
    if (!n) { say("err", t("needName")); return; }
    if (backendUp === false) { say("err", t("offline")); return; }

    var btn = document.getElementById("signbtn");
    btn.disabled = true;
    say("ok", t("saving"));

    fetch("/api/sign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: n, district: d, message: m })
    })
      .then(function (r) {
        if (r.status === 501 || r.status === 503) { backendUp = false; throw { k: "offline" }; }
        if (r.status === 429) throw { k: "slow" };
        if (r.status === 409) throw { k: "dupe" };
        if (!r.ok) throw { k: "failed" };
        return r.json();
      })
      .then(function (data) {
        btn.disabled = false;
        sigs = Array.isArray(data.signatures) ? data.signatures : sigs.concat([{ n: n, d: d, m: m }]);
        renderSigs();
        say("ok", t("signed"));
        document.getElementById("sigform").reset();
      })
      .catch(function (e) {
        btn.disabled = false;
        say("err", t((e && e.k) || "failed"));
        renderSigs();
      });
  });

  /* ---------------- copy buttons ---------------- */
  function copyTo(btn, text) {
    navigator.clipboard.writeText(text).then(function () {
      var lang = document.documentElement.getAttribute("data-lang") || "en";
      var back = btn.getAttribute("data-" + lang) || btn.textContent;
      btn.textContent = t("copied");
      setTimeout(function () { btn.textContent = back; }, 1600);
    }).catch(function () {});
  }

  document.getElementById("copyletter").addEventListener("click", function () {
    var lang = document.documentElement.getAttribute("data-lang") || "en";
    var el = document.getElementById("letter-" + (lang === "ne" ? "ne" : "en"));
    copyTo(this, el.innerText);
  });

  document.getElementById("copydemands").addEventListener("click", function () {
    var lang = document.documentElement.getAttribute("data-lang") || "en";
    var pane = document.getElementById("pane-" + (lang === "ne" ? "ne" : "en"));
    var items = [].slice.call(pane.querySelectorAll("ol.demands .t")).map(function (el, i) {
      return (i + 1) + ". " + el.innerText;
    });
    copyTo(this, t("demandsHead") + "\n\n" + items.join("\n") + "\n\n" + t("demandsTail"));
  });

  /* ---------------- in-page navigation across language panes ---------------- */
  document.querySelectorAll("nav.top a[data-sec]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var key = a.getAttribute("data-sec");
      var targets = document.querySelectorAll('[data-sec="' + key + '"]');
      for (var i = 0; i < targets.length; i++) {
        var el = targets[i];
        if (el.closest("nav.top")) continue;          // the nav link itself
        if (el.closest(".lang-pane[hidden]")) continue; // the inactive language
        ev.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    });
  });

  /* ---------------- go ---------------- */
  setLang(preferred());
})();
