// ============================================================
//  Technamooz AI — technamooz-ai-version1.0.0
//  Author: Amir Parsa (امیر پارسا)
//  public/js/admin-theme.js — 5-theme switcher for the admin console
//  (self-contained: keeps admin.js free of UI-theme logic)
// ============================================================

(() => {
  'use strict';

  const THEMES = [
    { id: 'night',  label: 'شب — مشکی برنزی',   swatch: '#d9b778' },
    { id: 'day',    label: 'روز — کاغذ سفید',    swatch: '#0e7a6d' },
    { id: 'sea',    label: 'دریا — آبی ذغالی',   swatch: '#7cc7ef' },
    { id: 'sand',   label: 'شن — کاغذ گرم',      swatch: '#a35c25' },
    { id: 'forest', label: 'جنگل — کاغذ سبز',    swatch: '#7fc79b' }
  ];
  const THEME_KEY = 'tm-theme';
  const COLORS = { night: '#0c0e12', day: '#fafaf7', sea: '#0a1420', sand: '#f2ecdf', forest: '#0d1712' };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* pre-paint: apply the saved theme before first paint */
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (THEMES.some((t) => t.id === saved)) {
      document.documentElement.dataset.theme = saved;
    }
  } catch { /* private mode */ }

  function syncMeta(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', COLORS[theme] || COLORS.night);
  }

  function currentTheme() {
    return document.documentElement.dataset.theme || 'night';
  }

  function renderOptions(menu) {
    const box = menu.querySelector('#themeOptionsAdmin');
    if (!box) return;
    const cur = currentTheme();
    box.innerHTML = THEMES.map((t) =>
      '<button type="button" class="theme-opt' + (t.id === cur ? ' active' : '') + '"' +
      ' role="menuitemradio" aria-checked="' + (t.id === cur) + '" data-theme-id="' + t.id + '">' +
      '<span class="swatch" style="background:' + esc(t.swatch) + '"></span>' +
      '<span>' + esc(t.label) + '</span></button>'
    ).join('');
  }

  function pick(theme) {
    if (!THEMES.some((t) => t.id === theme)) return;
    document.documentElement.dataset.theme = theme;
    syncMeta(theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('#btnThemeAdmin');
    const menu = document.querySelector('#themeMenuAdmin');
    if (!btn || !menu) return;

    syncMeta(currentTheme());
    renderOptions(menu);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const opening = menu.hidden;
      menu.hidden = opening;
      btn.setAttribute('aria-expanded', String(!opening));
      if (opening) renderOptions(menu);
    });

    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('[data-theme-id]');
      if (!opt) return;
      pick(opt.dataset.themeId);
      renderOptions(menu);
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('click', (e) => {
      if (menu.hidden) return;
      if (e.target.closest && (e.target.closest('#themeMenuAdmin') || e.target.closest('#btnThemeAdmin'))) return;
      menu.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  });
})();
