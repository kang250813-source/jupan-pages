(function () {
  var params = new URLSearchParams(window.location.search);
  var tag = params.get("tag") || "";
  var q = (params.get("q") || "").trim().toLowerCase();
  if (!tag && !q) return;
  var cards = document.querySelectorAll(".drama-card");
  var visible = 0;
  cards.forEach(function (card) {
    var title = (card.getAttribute("data-title") || "").toLowerCase();
    var tags = (card.getAttribute("data-tags") || "").split(",");
    var ok = true;
    if (tag) ok = tags.indexOf(tag) >= 0 || title.indexOf(tag.toLowerCase()) >= 0;
    if (ok && q) ok = title.indexOf(q) >= 0;
    card.style.display = ok ? "" : "none";
    if (ok) visible++;
  });
  var hint = document.querySelector(".section-hint");
  if (hint) hint.textContent = "共 " + visible + " 部" + (tag ? " · 标签「" + tag + "」" : "") + (q ? " · 搜索「" + q + "」" : "");
  document.querySelectorAll(".hot-keyword-chip").forEach(function (el) {
    if (el.textContent.trim() === tag) el.classList.add("is-active");
  });
})();