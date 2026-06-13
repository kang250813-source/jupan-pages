(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var tag = params.get("tag") || "";
  var q = (params.get("q") || "").trim().toLowerCase();
  if (!tag && !q) return;

  var keywordMap = {};

  function titleMatchesTag(title, tagName) {
    var kws = keywordMap[tagName];
    if (!kws || !kws.length) kws = [tagName];
    var lower = (title || "").toLowerCase();
    return kws.some(function (kw) {
      return lower.indexOf(String(kw).toLowerCase()) >= 0;
    });
  }

  function applyFilter() {
    var cards = document.querySelectorAll(".drama-card");
    var visible = 0;
    cards.forEach(function (card) {
      var title = card.getAttribute("data-title") || "";
      var tags = (card.getAttribute("data-tags") || "").split(",").filter(Boolean);
      var ok = true;
      if (tag) {
        ok = tags.indexOf(tag) >= 0 || titleMatchesTag(title, tag);
      }
      if (ok && q) {
        ok = title.toLowerCase().indexOf(q) >= 0;
      }
      card.style.display = ok ? "" : "none";
      if (ok) visible++;
    });
    var hint = document.querySelector(".section-hint");
    if (hint) {
      hint.textContent =
        "共 " +
        visible +
        " 部" +
        (tag ? " · 标签「" + tag + "」" : "") +
        (q ? " · 搜索「" + q + "」" : "");
    }
    document.querySelectorAll(".hot-keyword-chip").forEach(function (el) {
      el.classList.toggle("is-active", el.textContent.trim() === tag);
    });
  }

  function basePath() {
    var css = document.querySelector('link[href*="static/style.css"]');
    if (!css) return "";
    return css.getAttribute("href").replace(/static\/style\.css.*$/, "");
  }

  fetch(basePath() + "static/tag-keywords.json")
    .then(function (r) {
      return r.ok ? r.json() : {};
    })
    .catch(function () {
      return {};
    })
    .then(function (data) {
      keywordMap = data || {};
      applyFilter();
    });
})();
