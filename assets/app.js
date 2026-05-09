// Cognyzer / Terminus-2.0 Docs — sidebar + search + scrollspy
(function () {
  'use strict';

  // -------- Mobile sidebar toggle --------
  const menuBtn   = document.getElementById('menuBtn');
  const sidebar   = document.querySelector('.sidebar');
  const overlay   = document.querySelector('.sidebar-overlay');
  function toggleSidebar(open) {
    if (!sidebar || !overlay) return;
    const willOpen = (open === undefined) ? !sidebar.classList.contains('open') : !!open;
    sidebar.classList.toggle('open', willOpen);
    overlay.classList.toggle('open', willOpen);
  }
  menuBtn && menuBtn.addEventListener('click', () => toggleSidebar());
  overlay && overlay.addEventListener('click', () => toggleSidebar(false));

  // -------- Sidebar section collapse (only collapse non-active sections by default) --------
  document.querySelectorAll('.nav-section').forEach((sec) => {
    const head = sec.querySelector('.nav-section-head');
    if (!head) return;
    head.addEventListener('click', () => sec.classList.toggle('collapsed'));
  });

  // -------- Search --------
  const searchInput = document.getElementById('search');
  const resultsEl   = document.getElementById('searchResults');
  let index = null;
  let pendingFetch = null;
  function ensureIndex() {
    if (index) return Promise.resolve(index);
    if (pendingFetch) return pendingFetch;
    const url = (window.SITE_ROOT || '') + 'assets/search-index.json';
    pendingFetch = fetch(url).then(r => r.json()).then(data => { index = data; return data; });
    return pendingFetch;
  }

  function renderResults(items, q) {
    if (!resultsEl) return;
    if (!q) { resultsEl.classList.remove('open'); resultsEl.innerHTML = ''; return; }
    if (items.length === 0) {
      resultsEl.innerHTML = '<div class="empty">No results for &ldquo;' +
        escapeHtml(q) + '&rdquo;</div>';
      resultsEl.classList.add('open');
      return;
    }
    resultsEl.innerHTML = items.slice(0, 12).map(it => {
      const href = (window.SITE_ROOT || '') + it.url;
      return '<a class="item" href="' + href + '">' +
        '<div class="s">' + escapeHtml(it.section) + '</div>' +
        '<div class="t">' + highlight(it.title, q) + '</div>' +
        '<div class="e">' + highlight(it.excerpt, q) + '</div>' +
      '</a>';
    }).join('');
    resultsEl.classList.add('open');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => (
      { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
    ));
  }
  function highlight(text, q) {
    const safe = escapeHtml(text);
    if (!q) return safe;
    const tokens = q.split(/\s+/).filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (tokens.length === 0) return safe;
    const re = new RegExp('(' + tokens.join('|') + ')', 'ig');
    return safe.replace(re, '<mark>$1</mark>');
  }

  function search(q) {
    q = (q || '').trim();
    if (!q) { renderResults([], ''); return; }
    ensureIndex().then(idx => {
      const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
      const scored = idx.map(item => {
        const hay = (item.title + ' ' + item.section + ' ' + item.text).toLowerCase();
        let score = 0;
        for (const t of tokens) {
          if (item.title.toLowerCase().includes(t)) score += 12;
          if (item.section.toLowerCase().includes(t)) score += 4;
          // count matches in text (cap to avoid runaway)
          let count = 0, idxAt = 0;
          while ((idxAt = hay.indexOf(t, idxAt)) !== -1 && count < 8) { count++; idxAt += t.length; }
          score += count;
        }
        return { item, score };
      }).filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.item);
      renderResults(scored, q);
    });
  }

  if (searchInput) {
    let t = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(t);
      const v = e.target.value;
      t = setTimeout(() => search(v), 80);
    });
    searchInput.addEventListener('focus', (e) => {
      if (e.target.value.trim()) search(e.target.value);
    });
    document.addEventListener('click', (e) => {
      if (!resultsEl) return;
      if (e.target === searchInput) return;
      if (resultsEl.contains(e.target)) return;
      resultsEl.classList.remove('open');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
      if (e.key === 'Escape') {
        resultsEl && resultsEl.classList.remove('open');
        searchInput.blur();
      }
    });
  }

  // -------- Page TOC scrollspy --------
  const tocLinks = Array.from(document.querySelectorAll('.page-toc a[href^="#"]'));
  if (tocLinks.length) {
    const headings = tocLinks
      .map(a => document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))))
      .filter(Boolean);
    function onScroll() {
      let active = headings[0];
      const top = window.scrollY + 96;
      for (const h of headings) {
        if (h.offsetTop <= top) active = h; else break;
      }
      tocLinks.forEach(a => a.classList.toggle('active',
        a.getAttribute('href') === '#' + active.id));
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
