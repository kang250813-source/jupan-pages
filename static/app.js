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
  }

  document.addEventListener("DOMContentLoaded", function () {
    initSearchFocus();
    initCopyButtons();
    initQuarkButtons();
    initHotKeywords();
  });

  window.Duanjuku = {
    showToast: showToast,
    openQuark: openQuark,
    copyText: copyText,
    initDetailPage: initDetailPage,
  };
})();
