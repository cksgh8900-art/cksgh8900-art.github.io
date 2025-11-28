(function() {
    'use strict';

    let searchPosts = [];
    let allTags = new Set();
    let activeTag = null;

    function initSearch() {
        const searchInput = document.getElementById('search-input');
        const tagFilter = document.getElementById('tag-filter');

        if (!searchInput || !tagFilter) {
            return;
        }

        searchInput.addEventListener('input', handleSearch);
        loadPosts();
    }

    function loadPosts() {
        fetch('posts.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('posts.json을 불러올 수 없습니다.');
                }
                return response.json();
            })
            .then(posts => {
                searchPosts = posts;
                extractTags(posts);
                renderTagFilter();
                window.dispatchEvent(new CustomEvent('postsLoaded', { detail: posts }));
            })
            .catch(error => {
                console.error('게시글 로드 오류:', error);
                const container = document.getElementById('posts-container');
                if (container) {
                    container.innerHTML = '<div class="no-results">게시글을 불러올 수 없습니다.</div>';
                }
            });
    }

    function extractTags(posts) {
        allTags.clear();
        posts.forEach(post => {
            if (post.tags && Array.isArray(post.tags)) {
                post.tags.forEach(tag => allTags.add(tag));
            }
        });
    }

    function renderTagFilter() {
        const tagFilter = document.getElementById('tag-filter');
        if (!tagFilter) return;

        if (allTags.size === 0) {
            tagFilter.innerHTML = '';
            return;
        }

        const tagsArray = Array.from(allTags).sort();
        tagFilter.innerHTML = '<button class="tag" data-tag="">전체</button>' +
            tagsArray.map(tag => 
                `<button class="tag" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`
            ).join('');

        tagFilter.querySelectorAll('.tag').forEach(button => {
            button.addEventListener('click', () => {
                const tag = button.getAttribute('data-tag');
                setActiveTag(tag);
                handleSearch();
            });
        });

        updateActiveTag();
    }

    function setActiveTag(tag) {
        activeTag = tag === '' ? null : tag;
        updateActiveTag();
    }

    function updateActiveTag() {
        const tagButtons = document.querySelectorAll('#tag-filter .tag');
        tagButtons.forEach(button => {
            const tag = button.getAttribute('data-tag');
            if ((activeTag === null && tag === '') || (activeTag === tag)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    function handleSearch() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        const filtered = searchPosts.filter(post => {
            const matchesSearch = !query || 
                post.title.toLowerCase().includes(query) ||
                (post.excerpt && post.excerpt.toLowerCase().includes(query)) ||
                (post.description && post.description.toLowerCase().includes(query));
            
            const matchesTag = !activeTag || 
                (post.tags && Array.isArray(post.tags) && post.tags.includes(activeTag));
            
            return matchesSearch && matchesTag;
        });

        window.dispatchEvent(new CustomEvent('searchResults', { detail: filtered }));
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch();
    }
})();

