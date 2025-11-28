(function() {
    'use strict';

    let allPosts = [];

    function initApp() {
        window.addEventListener('postsLoaded', (e) => {
            allPosts = e.detail;
            renderPosts(allPosts);
        });

        window.addEventListener('searchResults', (e) => {
            renderPosts(e.detail);
        });
    }

    function renderPosts(posts) {
        const container = document.getElementById('posts-container');
        if (!container) return;

        if (posts.length === 0) {
            container.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
            return;
        }

        container.innerHTML = posts.map(post => createPostCard(post)).join('');
    }

    function createPostCard(post) {
        const date = formatDate(post.date);
        const tags = post.tags && Array.isArray(post.tags) ? post.tags : [];
        const tagsHtml = tags.length > 0
            ? `<div class="post-tags">${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>`
            : '';

        return `
            <article class="post-card">
                <h2><a href="post.html?file=${encodeURIComponent(post.file)}">${escapeHtml(post.title)}</a></h2>
                <div class="post-meta">
                    <span>${escapeHtml(date)}</span>
                    ${post.category ? `<span>${escapeHtml(post.category)}</span>` : ''}
                </div>
                ${post.excerpt ? `<p class="post-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
                ${tagsHtml}
            </article>
        `;
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();

