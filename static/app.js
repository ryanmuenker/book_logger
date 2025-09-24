
(function () {
  const q = document.getElementById('q');
  const tag = document.getElementById('tag');
  const cards = [...document.querySelectorAll('.book-card')];
  function apply() {
    const term = (q?.value || '').toLowerCase().trim();
    const t = (tag?.value || '').toLowerCase().trim();
    cards.forEach(c => {
      const matchesText =
        !term ||
        c.dataset.title.includes(term) ||
        c.dataset.author.includes(term);
      const matchesTag = !t || (c.dataset.tags || '').split(',').map(s => s.trim()).includes(t);
      c.style.display = (matchesText && matchesTag) ? '' : 'none';
    });
  }
  q?.addEventListener('input', apply);
  tag?.addEventListener('change', apply);
})();

(function () {
  const input = document.getElementById('searchQuery');
  const btn = document.getElementById('searchBtn');
  const list = document.getElementById('searchResults');
  const empty = document.getElementById('searchEmpty');
  const loading = document.getElementById('searchLoading');
  const error = document.getElementById('searchError');
  if (!input || !btn || !list) return;

  async function runSearch() {
    const term = (input.value || '').trim();
    list.innerHTML = '';
    empty.style.display = 'none';
    error.style.display = 'none';
    loading.style.display = '';
    try {
      const res = await fetch('/api/search?q=' + encodeURIComponent(term));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const items = data.results || [];
      if (!items.length) {
        empty.style.display = '';
        return;
      }
      for (const it of items) {
        const el = document.createElement('div');
        el.className = 'list-group-item';
        el.innerHTML = `<div class="d-flex w-100 justify-content-between align-items-center">
            <div>
              <div class="fw-semibold">${(it.title || '').replaceAll('<','&lt;')}</div>
              <small class="text-muted">${(it.author || '')}</small>
            </div>
            <div class="text-end">
              <small class="text-muted d-block">${(it.isbn || '')}</small>
              <button class="btn btn-sm btn-outline-primary mt-1" data-action="add" data-title="${(it.title || '').replaceAll('"','&quot;')}" data-author="${(it.author || '').replaceAll('"','&quot;')}" data-isbn="${(it.isbn || '')}">Add to My Library</button>
            </div>
          </div>`;
        list.appendChild(el);
      }
    } catch (e) {
      error.style.display = '';
    } finally {
      loading.style.display = 'none';
    }
  }

  btn.addEventListener('click', runSearch);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runSearch();
  });

  list?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action="add"]');
    if (!btn) return;
    try {
      const payload = {
        title: btn.getAttribute('data-title') || '',
        author: btn.getAttribute('data-author') || '',
        isbn: btn.getAttribute('data-isbn') || ''
      };
      const res = await fetch('/api/add_to_library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        alert('Failed to add.');
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Added';
    } catch (_) {
      alert('Failed to add.');
    }
  });
})();
