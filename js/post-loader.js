(function () {
  "use strict";

  function initPostLoader() {
    const urlParams = new URLSearchParams(window.location.search);
    const file = urlParams.get("file");

    if (!file) {
      showError("게시글 파일이 지정되지 않았습니다.");
      return;
    }

    loadPost(file);
  }

  function loadPost(filename) {
    const filePath = `pages/${filename}`;

    fetch(filePath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`파일을 불러올 수 없습니다: ${filename}`);
        }
        return response.text();
      })
      .then((content) => {
        const { metadata, content: postContent } = parseMarkdown(content);
        renderPost(metadata, postContent);
        loadGiscus(filename);
      })
      .catch((error) => {
        console.error("게시글 로드 오류:", error);
        showError(error.message);
      });
  }

  function parseMarkdown(content) {
    // UTF-8 BOM 제거
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }

    // Front Matter 파싱
    const frontMatterMatch = content.match(
      /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/
    );
    let metadata = {};
    let postContent = content;

    if (frontMatterMatch) {
      const frontMatter = frontMatterMatch[1];
      postContent = frontMatterMatch[2];

      const lines = frontMatter.split(/\r?\n/);
      lines.forEach((line) => {
        const colonIndex = line.indexOf(":");
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          let value = line.substring(colonIndex + 1).trim();

          // 따옴표 제거
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }

          // 배열 파싱 (tags)
          if (key === "tags" && value.startsWith("[") && value.endsWith("]")) {
            try {
              value = JSON.parse(value);
            } catch {
              value = value
                .slice(1, -1)
                .split(",")
                .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ""));
            }
          }

          metadata[key] = value;
        }
      });
    }

    return { metadata, content: postContent };
  }

  function renderPost(metadata, content) {
    const container = document.getElementById("post-container");
    if (!container) return;

    // Marked.js 설정
    marked.setOptions({
      breaks: true,
      gfm: true,
      highlight: function (code, lang) {
        if (lang && Prism.languages[lang]) {
          try {
            return Prism.highlight(code, Prism.languages[lang], lang);
          } catch (e) {
            console.warn("코드 하이라이팅 오류:", e);
          }
        }
        return code;
      },
    });

    const htmlContent = marked.parse(content);
    const date = formatDate(metadata.date || "");
    const tags =
      metadata.tags && Array.isArray(metadata.tags) ? metadata.tags : [];
    const tagsHtml =
      tags.length > 0
        ? `<div class="post-tags">${tags
            .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
            .join("")}</div>`
        : "";

    container.innerHTML = `
            <div class="post-header">
                <h1>${escapeHtml(metadata.title || "제목 없음")}</h1>
                <div class="post-meta">
                    ${date ? `<span>${escapeHtml(date)}</span>` : ""}
                    ${
                      metadata.category
                        ? `<span>${escapeHtml(metadata.category)}</span>`
                        : ""
                    }
                </div>
                ${tagsHtml}
            </div>
            <div class="post-content">
                ${htmlContent}
            </div>
        `;

    // Prism.js 하이라이팅 적용
    if (window.Prism) {
      Prism.highlightAll();
    }

    // 제목 업데이트
    document.title = `${metadata.title || "게시글"} - 블로그`;
  }

  function loadGiscus(filename) {
    const container = document.getElementById("giscus-container");
    if (!container) return;

    // Giscus 스크립트가 이미 로드되었는지 확인
    if (document.querySelector('script[src*="giscus"]')) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", "cksgh8900-art/cksgh8900-art.github.io");
    script.setAttribute("data-repo-id", "R_kgDOQec2FQ"); // 사용자가 설정 필요
    script.setAttribute("data-category", "General");
    script.setAttribute("data-category-id", "DIC_kwDOQec2Fc4CzIzQ"); // 사용자가 설정 필요
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "1");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", "ko");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    container.appendChild(script);
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  }

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function showError(message) {
    const container = document.getElementById("post-container");
    if (container) {
      container.innerHTML = `<div class="no-results">${escapeHtml(
        message
      )}</div>`;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPostLoader);
  } else {
    initPostLoader();
  }
})();
