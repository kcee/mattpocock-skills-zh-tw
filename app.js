(() => {
  const article = document.querySelector("#article");
  const sidebar = document.querySelector("#sidebar");
  const nav = document.querySelector("#sidebarNav");
  const search = document.querySelector("#searchInput");
  const backdrop = document.querySelector("#backdrop");
  const menuButton = document.querySelector("#menuButton");
  const progress = document.querySelector("#readingProgress");

  const escapeHtml = (value = "") =>
    value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));

  const renderMarkdown = (source = "") => {
    let text = escapeHtml(source.trim());
    const blocks = [];
    text = text.replace(/```([\s\S]*?)```/g, (_, code) => {
      const token = `%%BLOCK${blocks.length}%%`;
      blocks.push(`<pre><code>${code.trim()}</code></pre>`);
      return token;
    });
    text = text
      .replace(/^### (.+)$/gm, "<h3>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2>$1</h2>")
      .replace(/^&gt; (.+)$/gm, "<blockquote><p>$1</p></blockquote>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2">$1 ↗</a>');

    const lines = text.split(/\n/);
    let html = "";
    let list = null;
    const closeList = () => {
      if (list) html += `</${list}>`;
      list = null;
    };
    for (const line of lines) {
      if (/^%%BLOCK\d+%%$/.test(line.trim())) {
        closeList();
        html += blocks[Number(line.match(/\d+/)[0])];
      } else if (/^\d+\. /.test(line)) {
        if (list !== "ol") { closeList(); html += "<ol>"; list = "ol"; }
        html += `<li>${line.replace(/^\d+\. /, "")}</li>`;
      } else if (/^- /.test(line)) {
        if (list !== "ul") { closeList(); html += "<ul>"; list = "ul"; }
        html += `<li>${line.slice(2)}</li>`;
      } else if (/^<h[23]>/.test(line) || /^<blockquote>/.test(line)) {
        closeList(); html += line;
      } else if (line.trim()) {
        closeList(); html += `<p>${line}</p>`;
      } else {
        closeList();
      }
    }
    closeList();
    return html;
  };

  const groups = [...new Set(window.SKILLS.map(item => item.group))];
  const renderNav = (query = "") => {
    const needle = query.trim().toLowerCase();
    nav.innerHTML = groups.map(group => {
      const items = window.SKILLS.filter(item =>
        item.group === group &&
        (!needle || `${item.title} ${item.slug} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(needle))
      );
      if (!items.length) return "";
      return `<section>
        <h2 class="nav-group-title">${group}</h2>
        ${items.map(item => `<a class="nav-link" href="#${item.slug}" data-slug="${item.slug}">
          <span class="num">${String(window.SKILLS.indexOf(item) + 1).padStart(2, "0")}</span>
          <span>${item.title}</span>
        </a>`).join("")}
      </section>`;
    }).join("") || '<p class="empty">找不到相符文章</p>';
  };

  const home = () => {
    article.className = "article home";
    article.innerHTML = `
      <header class="hero">
        <span class="eyebrow">A FIELD GUIDE TO AGENT SKILLS</span>
        <h1>把工程經驗，寫成 AI 能遵循的工作方法。</h1>
        <p class="dek">這不是指令大全，而是一套學習如何設計 Agent Skill 的台灣中文讀本。從提問、規格、實作、測試到除錯，逐篇拆解 Matt Pocock 如何把軟體工程紀律寫進 <code>SKILL.md</code>。</p>
        <div class="meta-row"><span class="tag">22 篇主題文章</span><span class="tag">台灣繁體中文</span><span class="tag">MIT License</span><span class="tag">可離線閱讀</span></div>
      </header>
      <section>
        <span class="eyebrow">HOW TO READ</span>
        <h2>建議學習路線</h2>
        <ol class="flow">
          <li><span><strong>先讀路由。</strong>從「Ask Matt」理解整套 skills 如何形成工作流，而不是把每個 skill 當成孤島。</span></li>
          <li><span><strong>再讀對齊。</strong>閱讀「拷問式訪談」與「領域建模」，理解為什麼寫程式前先建立共同語言。</span></li>
          <li><span><strong>走完交付鏈。</strong>依序看規格、任務拆分、實作、TDD 與雙軸 code review。</span></li>
          <li><span><strong>最後研究寫法。</strong>用「寫出優秀 Skills」回頭分析各篇的觸發條件、自由度與漸進式揭露。</span></li>
        </ol>
      </section>
      <div class="callout"><strong>翻譯原則：</strong>技術識別字、檔名、CLI 命令、label 與程式碼保持英文；解說、流程與設計意圖翻成台灣慣用繁體中文。這樣既好讀，也不會因翻譯破壞可執行內容。</div>
      <section>
        <span class="eyebrow">ALL ARTICLES</span>
        <h2>完整文章</h2>
        <div class="article-grid">${window.SKILLS.map((item, index) => `
          <a class="article-card" href="#${item.slug}">
            <span class="card-num">${String(index + 1).padStart(2, "0")} / ${item.group}</span>
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
          </a>`).join("")}
        </div>
      </section>`;
  };

  const renderArticle = item => {
    const index = window.SKILLS.indexOf(item);
    const prev = window.SKILLS[index - 1];
    const next = window.SKILLS[index + 1];
    article.className = "article";
    article.innerHTML = `
      <header class="hero">
        <span class="eyebrow">${String(index + 1).padStart(2, "0")} / ${item.group} · ${item.slug}</span>
        <h1>${item.title}</h1>
        <p class="dek">${item.summary}</p>
        <div class="meta-row">${item.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div>
      </header>
      ${renderMarkdown(item.body)}
      ${item.files?.length ? `<section><h2>原始檔案地圖</h2><ul class="file-list">${item.files.map(file => `<li><code>${file[0]}</code><span>${file[1]}</span></li>`).join("")}</ul></section>` : ""}
      <nav class="pager" aria-label="上一篇與下一篇">
        ${prev ? `<a href="#${prev.slug}"><small>← 上一篇</small>${prev.title}</a>` : `<a href="#home"><small>← 回首頁</small>閱讀指南</a>`}
        ${next ? `<a href="#${next.slug}"><small>下一篇 →</small>${next.title}</a>` : `<a href="#home"><small>完成閱讀 →</small>回到文章總覽</a>`}
      </nav>`;
  };

  const route = () => {
    const slug = location.hash.slice(1) || "home";
    const item = window.SKILLS.find(entry => entry.slug === slug);
    item ? renderArticle(item) : home();
    document.querySelectorAll(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.slug === slug));
    document.title = item ? `${item.title}｜Matt Pocock Skills 台灣中文手冊` : "Matt Pocock Skills｜台灣中文學習手冊";
    window.scrollTo(0, 0);
    closeMenu();
  };

  const closeMenu = () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("show");
    menuButton?.setAttribute("aria-expanded", "false");
  };
  const toggleTheme = () => {
    const dark = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "";
    localStorage.setItem("matt-skills-theme", dark ? "dark" : "light");
  };

  if (localStorage.getItem("matt-skills-theme") === "dark") document.documentElement.dataset.theme = "dark";
  document.querySelector("#articleCount").textContent = `${window.SKILLS.length} 篇文章`;
  renderNav();
  route();

  addEventListener("hashchange", route);
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  }, { passive: true });
  search.addEventListener("input", event => renderNav(event.target.value));
  document.addEventListener("keydown", event => {
    if (event.key === "/" && document.activeElement !== search) { event.preventDefault(); search.focus(); }
    if (event.key === "Escape") { search.blur(); closeMenu(); }
  });
  menuButton?.addEventListener("click", () => {
    const open = sidebar.classList.toggle("open");
    backdrop.classList.toggle("show", open);
    menuButton.setAttribute("aria-expanded", String(open));
  });
  backdrop.addEventListener("click", closeMenu);
  document.querySelector("#themeButton").addEventListener("click", toggleTheme);
  document.querySelector("#themeButtonMobile").addEventListener("click", toggleTheme);
})();
