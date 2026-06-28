"use strict";

(function () {
  const prompts = Array.isArray(window.NIRAY_PROMPTS) ? window.NIRAY_PROMPTS : [];
  const examples = Array.isArray(window.NIRAY_EXAMPLES) ? window.NIRAY_EXAMPLES : [];
  const initialExampleCount = 3;
  const exampleIncrement = 6;
  let visibleExampleCount = initialExampleCount;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function renderStarterRoute() {
    const target = document.querySelector("[data-starter-route]");
    if (!target) return;

    const starterPrompts = prompts.filter((item) => item.starter);
    target.innerHTML = starterPrompts.map((item) => `
      <article class="route-card">
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary)}</p>
          <code>${escapeHtml(item.file)}</code>
        </div>
      </article>
    `).join("");
  }

  function extractNumber(file) {
    const match = String(file || "").match(/^(\d{2}(?:-\d)?)/);
    return match ? match[1] : "";
  }

  function renderPromptList() {
    const target = document.querySelector("[data-prompt-list]");
    if (!target) return;

    const items = prompts.filter((item) => /^0[1-9]/.test(item.file));

    target.innerHTML = items.map((item) => {
      const number = extractNumber(item.file);
      return `
        <li class="prompt-list__item">
          <span class="prompt-list__number">${escapeHtml(number)}</span>
          <div class="prompt-list__body">
            <h3 class="prompt-list__title">${escapeHtml(item.title)}</h3>
            <p class="prompt-list__summary">${escapeHtml(item.summary)}</p>
          </div>
        </li>
      `;
    }).join("");
  }

  function exampleImage(item) {
    if (!item.screenshot) {
      return `<span class="example-card__placeholder">スクリーンショット未生成</span>`;
    }

    return `
      <img src="${escapeHtml(item.screenshot)}"
           alt="${escapeHtml(item.title)}のファーストビュー"
           loading="lazy"
           onerror="this.replaceWith(Object.assign(document.createElement('span'), { className: 'example-card__placeholder', textContent: 'スクリーンショット未生成' }))">
    `;
  }

  function labelClass(label) {
    const normalized = String(label || "").toLowerCase();
    if (normalized.includes("html")) return "example-card__label--html";
    if (normalized.includes("企画")) return "example-card__label--plan";
    if (normalized.includes("提案")) return "example-card__label--proposal";
    if (normalized.includes("レポート")) return "example-card__label--report";
    if (normalized.includes("ワークフロー")) return "example-card__label--workflow";
    if (normalized.includes("絵コンテ")) return "example-card__label--storyboard";
    return "example-card__label--default";
  }

  function renderExamples() {
    const target = document.querySelector("[data-example-grid]");
    const panel = document.querySelector("[data-example-panel]");
    const moreButton = document.querySelector("[data-more-examples]");
    const closeButton = document.querySelector("[data-close-examples]");
    if (!target) return;

    const safeInitialCount = Math.min(initialExampleCount, examples.length);
    visibleExampleCount = Math.max(safeInitialCount, Math.min(visibleExampleCount, examples.length));
    const visible = examples.slice(0, visibleExampleCount);

    target.innerHTML = visible.map((item) => `
      <article class="example-card">
        <a class="example-card__media" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">
          ${exampleImage(item)}
          <span class="example-card__label ${labelClass(item.label)}">${escapeHtml(item.label)}</span>
        </a>
        <div class="example-card__body">
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <div class="example-card__actions">
            <a class="small-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">成果物を見る</a>
          </div>
        </div>
      </article>
    `).join("");

    if (panel) {
      panel.classList.toggle("is-scrollable", visibleExampleCount > 9);
    }

    if (moreButton) {
      const remaining = examples.length - visibleExampleCount;
      moreButton.classList.toggle("hidden", remaining <= 0);
      moreButton.textContent = remaining > 0
        ? `もっと見る（残り${remaining}件）`
        : "もっと見る";
      moreButton.setAttribute("aria-expanded", visibleExampleCount > safeInitialCount ? "true" : "false");
    }

    if (closeButton) {
      closeButton.classList.toggle("hidden", visibleExampleCount <= safeInitialCount);
    }
  }

  function bindExamplesButton() {
    const moreButton = document.querySelector("[data-more-examples]");
    const closeButton = document.querySelector("[data-close-examples]");
    const section = document.querySelector("#examples");

    if (moreButton) {
      moreButton.addEventListener("click", () => {
        visibleExampleCount = Math.min(visibleExampleCount + exampleIncrement, examples.length);
        renderExamples();
      });
    }

    if (closeButton) {
      closeButton.addEventListener("click", () => {
        visibleExampleCount = initialExampleCount;
        renderExamples();
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  }

  function updateCounts() {
    const promptCount = document.querySelector("[data-prompt-count]");
    const exampleCount = document.querySelector("[data-example-count]");
    if (promptCount) promptCount.textContent = String(prompts.length);
    if (exampleCount) exampleCount.textContent = String(examples.length);
  }

  function bindThemeToggle() {
    const button = document.querySelector("[data-theme-toggle]");
    if (!button) return;

    function currentTheme() {
      return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }

    function applyTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      button.setAttribute("aria-label", theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え");
    }

    applyTheme(currentTheme());

    button.addEventListener("click", () => {
      const next = currentTheme() === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem("theme", next);
      } catch (e) {
        /* localStorage unavailable, theme still applies for this session */
      }
    });

    if (window.matchMedia) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = (event) => {
        let stored = null;
        try {
          stored = localStorage.getItem("theme");
        } catch (e) {
          stored = null;
        }
        if (stored !== "dark" && stored !== "light") {
          applyTheme(event.matches ? "dark" : "light");
        }
      };
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", onChange);
      } else if (typeof media.addListener === "function") {
        media.addListener(onChange);
      }
    }
  }

  renderStarterRoute();
  renderPromptList();
  renderExamples();
  bindExamplesButton();
  updateCounts();
  bindThemeToggle();
})();
