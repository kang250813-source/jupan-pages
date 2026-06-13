/**
 * Duanjuku site — Quark-focused UI interactions
 */
(function () {
  "use strict";

  var MOBILE_RE =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  function isMobile() {
    return MOBILE_RE.test(navigator.userAgent) || window.innerWidth < 768;
  }

  function showToast(message, type) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.className = "toast toast--visible" + (type ? " toast--" + type : "");
    toast.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      toast.className = "toast";
      toast.hidden = true;
    }, 2600);
  }

  function extractShareCode(url) {
    var match = String(url).match(/pan\.quark\.cn\/s\/([^/?#]+)/i);
    return match ? match[1] : null;
  }

  function openQuark(url) {
    if (!url) return;

    if (isMobile()) {
      var code = extractShareCode(url);
      if (code) {
        var deepLinks = [
          "quark://cloud/drive/share?s=" + encodeURIComponent(code),
          "quark://pan.quark.cn/s/" + code,
        ];
        var opened = false;
        var iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);

        deepLinks.forEach(function (link, index) {
          setTimeout(function () {
            if (opened) return;
            try {
              iframe.src = link;
            } catch (e) {
              /* ignore */
            }
          }, index * 400);
        });

        setTimeout(function () {
          document.body.removeChild(iframe);
          if (!opened) {
            window.location.href = url;
          }
        }, 1800);

        var onBlur = function () {
          opened = true;
          window.removeEventListener("blur", onBlur);
        };
        window.addEventListener("blur", onBlur);
        return;
      }
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  function initSearchFocus() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("focus") !== "search") return;

    var input = document.getElementById("search-input");
    if (!input) return;

    setTimeout(function () {
      var section = document.getElementById("search-section");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      input.focus();
    }, 120);
  }

  function buildShareText(title, pageUrl, quarkUrl) {
    var lines = [
      "【" + title + "】夸克短剧 · 免费观看",
      "👉 本页链接：" + pageUrl,
    ];
    if (quarkUrl) {
      lines.push("📦 夸克网盘：" + quarkUrl);
    }
    return lines.join("\n");
  }

  function resolveSharePageUrl(btn) {
    var fromBtn = btn.getAttribute("data-share-page");
    if (fromBtn) return fromBtn;

    var meta = document.querySelector('meta[name="public-site-url"]');
    var publicRoot = meta ? meta.getAttribute("content") : "";
    if (publicRoot) {
      var path = window.location.pathname || "";
      if (path.indexOf("localhost") >= 0) path = path.replace(/^https?:\/\/[^/]+/, "");
      return publicRoot.replace(/\/$/, "") + path;
    }

    var href = window.location.href.split("#")[0];
    if (/localhost|127\.0\.0\.1/.test(href)) {
      return "";
    }
    return href;
  }

  function sharePage(btn) {
    var title = btn.getAttribute("data-share-title") || document.title;
    var quarkUrl = btn.getAttribute("data-share-quark") || "";
    var pageUrl = resolveSharePageUrl(btn);
    if (!pageUrl) {
      showToast("未配置线上站点地址，无法分享", "error");
      return Promise.reject(new Error("missing public share url"));
    }
    var text = buildShareText(title, pageUrl, quarkUrl);

    if (navigator.share) {
      return navigator
        .share({
          title: title + " - 夸克短剧",
          text: text,
          url: pageUrl,
        })
        .then(function () {
          showToast("已唤起分享", "success");
        })
        .catch(function (err) {
          if (err && err.name === "AbortError") return;
          return copyText(text).then(function () {
            showToast("分享文案已复制，可粘贴到微信发给好友", "success");
          });
        });
    }

    return copyText(text).then(function () {
      showToast("分享文案已复制，可粘贴到微信发给好友", "success");
      btn.classList.add("is-shared");
      setTimeout(function () {
        btn.classList.remove("is-shared");
      }, 2000);
    });
  }

  function initShareButtons() {
    document.querySelectorAll(".js-share-page").forEach(function (btn) {
      if (btn.dataset.shareBound === "1") return;
      btn.dataset.shareBound = "1";
      btn.addEventListener("click", function () {
        sharePage(btn).catch(function () {
          showToast("分享失败，请手动复制链接", "error");
        });
      });
    });
  }

  function initCopyButtons() {
    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.getAttribute("data-copy");
        copyText(text)
          .then(function () {
            showToast("链接已复制，可粘贴到夸克打开", "success");
            btn.classList.add("is-copied");
            setTimeout(function () {
              btn.classList.remove("is-copied");
            }, 2000);
          })
          .catch(function () {
            showToast("复制失败，请手动复制链接", "error");
          });
      });
    });
  }

  function initQuarkButtons() {
    document.querySelectorAll(".js-open-quark, #btn-open-quark").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var panel = btn.closest("[data-quark-url]");
        var url = panel ? panel.getAttribute("data-quark-url") : null;
        if (url) openQuark(url);
      });
    });
  }

  function initDailyUpdateBar() {
    var bar = document.getElementById("daily-update-bar");
    var track = document.getElementById("daily-update-track");
    if (!bar || !track) return;

    function hashDate(dateStr) {
      var hash = 2166136261;
      for (var i = 0; i < dateStr.length; i++) {
        hash ^= dateStr.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }

    function mulberry32(seed) {
      return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    var dateKey = new Date().toISOString().slice(0, 10);
    var rand = mulberry32(hashDate(dateKey));
    var liveRand = mulberry32(hashDate(dateKey + "-live"));

    var stats = {
      today: 68 + Math.floor(rand() * 133),
      total: 43800 + Math.floor(rand() * 2400),
    };

    function fmtNum(n) {
      return String(n);
    }

    function buildItem(today, total, extra) {
      var html =
        '<span class="daily-update-item">' +
        '今日更新短剧：<strong class="daily-update-num" data-stat="today">' +
        fmtNum(today) +
        "</strong>部" +
        '<span class="daily-update-sep">总收录短剧：</span>' +
        '<strong class="daily-update-num" data-stat="total">' +
        fmtNum(total) +
        "</strong>部";
      if (extra) html += '<span class="daily-update-sep">' + extra + "</span>";
      html += "</span>";
      return html;
    }

    function renderTrack() {
      var t = stats.today;
      var g = stats.total;
      var items = [
        buildItem(t, g),
        buildItem(t + 3 + Math.floor(liveRand() * 8), g + 12 + Math.floor(liveRand() * 40), "永久免费 · 每日更新"),
        buildItem(t - 2 + Math.floor(liveRand() * 5), g + 6 + Math.floor(liveRand() * 20), "夸克网盘高清短剧"),
        buildItem(t + 1 + Math.floor(liveRand() * 6), g + 18 + Math.floor(liveRand() * 30), "热门短剧持续收录中"),
      ];
      track.innerHTML = items.join("") + items.join("");
    }

    function bumpStats() {
      var deltaToday = Math.floor(liveRand() * 3) + 1;
      var deltaTotal = Math.floor(liveRand() * 5) + 1;
      if (liveRand() > 0.72) deltaToday = -deltaToday;
      stats.today = Math.max(68, Math.min(200, stats.today + deltaToday));
      stats.total = Math.max(43800, Math.min(46200, stats.total + deltaTotal));
      renderTrack();
    }

    renderTrack();

    var bumpTimer = setInterval(bumpStats, 4200 + Math.floor(liveRand() * 2800));
    bar.addEventListener("mouseenter", function () {
      track.classList.add("is-paused");
    });
    bar.addEventListener("mouseleave", function () {
      track.classList.remove("is-paused");
    });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      clearInterval(bumpTimer);
      track.classList.add("is-paused");
    }
  }

  function initListPagination() {
    var nav = document.getElementById("list-pagination");
    var grid = document.getElementById("drama-grid");
    if (!nav || !grid) return;

    var pageSize = parseInt(nav.getAttribute("data-page-size"), 10) || 24;
    var state = { page: 1 };

    grid.querySelectorAll(".drama-card").forEach(function (card) {
      if (!card.hasAttribute("data-filter-visible")) {
        card.setAttribute("data-filter-visible", "1");
      }
    });

    function readPageFromUrl() {
      var params = new URLSearchParams(window.location.search);
      var page = parseInt(params.get("page") || "1", 10);
      return page > 0 ? page : 1;
    }

    function matchingCards() {
      return Array.prototype.filter.call(
        grid.querySelectorAll(".drama-card"),
        function (card) {
          return card.getAttribute("data-filter-visible") !== "0";
        }
      );
    }

    function pageWindow(current, pages, radius) {
      radius = radius || 2;
      if (pages <= 1) return [1];
      var nums = { 1: true, pages: true, current: true };
      for (var i = 1; i <= radius; i++) {
        nums[current - i] = true;
        nums[current + i] = true;
      }
      var ordered = Object.keys(nums)
        .map(function (n) {
          return parseInt(n, 10);
        })
        .filter(function (n) {
          return n >= 1 && n <= pages;
        })
        .sort(function (a, b) {
          return a - b;
        });
      var out = [];
      var prev = 0;
      ordered.forEach(function (num) {
        if (prev && num - prev > 1) out.push("…");
        out.push(num);
        prev = num;
      });
      return out;
    }

    function render() {
      var cards = matchingCards();
      var pages = Math.max(1, Math.ceil(cards.length / pageSize));
      if (state.page > pages) state.page = pages;
      if (state.page < 1) state.page = 1;

      grid.querySelectorAll(".drama-card").forEach(function (card) {
        if (card.getAttribute("data-filter-visible") === "0") {
          card.style.display = "none";
          return;
        }
        var idx = cards.indexOf(card);
        if (idx < 0) {
          card.style.display = "none";
          return;
        }
        var pageIndex = Math.floor(idx / pageSize) + 1;
        card.style.display = pageIndex === state.page ? "" : "none";
      });

      if (pages <= 1) {
        nav.hidden = true;
        nav.innerHTML = "";
        return;
      }

      nav.hidden = false;
      var html =
        '<div class="pagination-inner">' +
        '<button type="button" class="page-link' +
        (state.page <= 1 ? " is-disabled" : "") +
        '" data-page="' +
        (state.page - 1) +
        '" ' +
        (state.page <= 1 ? "disabled" : "") +
        ">上一页</button>" +
        '<div class="page-numbers">';

      pageWindow(state.page, pages).forEach(function (item) {
        if (item === "…") {
          html += '<span class="page-ellipsis" aria-hidden="true">…</span>';
          return;
        }
        html +=
          '<button type="button" class="page-link' +
          (item === state.page ? " is-active" : "") +
          '" data-page="' +
          item +
          '" aria-current="' +
          (item === state.page ? "page" : "false") +
          '">' +
          item +
          "</button>";
      });

      html +=
        "</div>" +
        '<button type="button" class="page-link' +
        (state.page >= pages ? " is-disabled" : "") +
        '" data-page="' +
        (state.page + 1) +
        '" ' +
        (state.page >= pages ? "disabled" : "") +
        ">下一页</button></div>" +
        '<p class="pagination-meta">第 ' +
        state.page +
        " / " +
        pages +
        " 页 · 共 " +
        cards.length +
        " 部</p>";

      nav.innerHTML = html;
      nav.querySelectorAll("[data-page]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (btn.disabled) return;
          state.page = parseInt(btn.getAttribute("data-page"), 10) || 1;
          var params = new URLSearchParams(window.location.search);
          if (state.page > 1) params.set("page", String(state.page));
          else params.delete("page");
          var query = params.toString();
          var nextUrl =
            window.location.pathname + (query ? "?" + query : "") + window.location.hash;
          window.history.replaceState({}, "", nextUrl);
          render();
          var section = document.querySelector(".list-section");
          if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }

    function refresh() {
      state.page = readPageFromUrl();
      render();
    }

    window.DuanjukuPagination = { refresh: refresh };
    refresh();
  }

  function initHotKeywords() {
    var section = document.querySelector(".hot-keywords-section");
    var toggle = document.querySelector(".hot-keywords-toggle");
    if (!section || !toggle) return;

    var mq = window.matchMedia("(max-width: 767px)");

    function applyMode() {
      if (mq.matches) {
        section.classList.add("is-collapsed");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "展开";
      } else {
        section.classList.remove("is-collapsed");
        toggle.setAttribute("aria-expanded", "true");
      }
    }

    toggle.addEventListener("click", function () {
      var collapsed = section.classList.toggle("is-collapsed");
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      toggle.textContent = collapsed ? "展开" : "收起";
    });

    applyMode();
    if (mq.addEventListener) {
      mq.addEventListener("change", applyMode);
    } else if (mq.addListener) {
      mq.addListener(applyMode);
    }
  }

  function initDetailPage() {
    initQuarkButtons();
    initCopyButtons();
    initShareButtons();
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSearchFocus();
    initDailyUpdateBar();
    initCopyButtons();
    initShareButtons();
    initQuarkButtons();
    initHotKeywords();
    initListPagination();
  });

  window.Duanjuku = {
    showToast: showToast,
    openQuark: openQuark,
    copyText: copyText,
    initDetailPage: initDetailPage,
  };
})();
