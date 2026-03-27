/**
 * ========================================
 * CP同人档案馆 - 约稿展示页面脚本
 * ========================================
 */

(function() {
  'use strict';

  /**
   * 初始化约稿页面功能
   */
  function init() {
    initMasonry();
    bindCardEvents();
    bindLightboxEvents();
    bindBackToTop();
  }

  /**
   * 初始化瀑布流布局
   */
  function initMasonry() {
    const grid = document.getElementById('commissionGrid');
    if (!grid) return;

    calculateMasonry();
  }

  /**
   * 计算瀑布流每项的高度
   */
  function calculateMasonry() {
    const grid = document.getElementById('commissionGrid');
    const items = grid.querySelectorAll('.commission-card');
    const rowHeight = 10;
    const rowGap = parseInt(getComputedStyle(grid).gap) || 15;

    items.forEach(item => {
      const image = item.querySelector('.card-image');
      const info = item.querySelector('.card-info');
      const imageHeight = image.offsetHeight;
      const infoHeight = info.offsetHeight;
      const totalHeight = imageHeight + infoHeight;
      const rowSpan = Math.ceil((totalHeight + rowGap) / (rowHeight + rowGap));
      item.style.gridRowEnd = `span ${rowSpan}`;
    });
  }

  /**
   * 绑定卡片点击事件
   */
  function bindCardEvents() {
    const cards = document.querySelectorAll('.commission-card');

    cards.forEach(card => {
      card.addEventListener('click', function() {
        openLightbox(this);
      });
    });
  }

  /**
   * 打开 Lightbox
   */
  function openLightbox(card) {
    const lightbox = document.getElementById('lightbox');
    const title = card.querySelector('.card-title').textContent;
    const artist = card.querySelector('.card-artist').textContent;
    const date = card.querySelector('.card-date').textContent;

    // 更新 Lightbox 内容
    const imageContainer = lightbox.querySelector('.lightbox-image');
    imageContainer.innerHTML = `
      <svg viewBox="0 0 24 24" width="120" height="120" fill="none" stroke="currentColor" stroke-width="0.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    `;

    // 重置笔记折叠状态
    const notesToggle = document.getElementById('notesToggle');
    const notesContent = document.getElementById('notesContent');
    notesToggle.classList.remove('expanded');
    notesContent.classList.remove('expanded');

    // 显示 Lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * 绑定 Lightbox 事件
   */
  function bindLightboxEvents() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const notesToggle = document.getElementById('notesToggle');
    const notesContent = document.getElementById('notesContent');

    // 点击关闭按钮
    closeBtn.addEventListener('click', closeLightbox);

    // 点击背景关闭
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    // ESC 键关闭
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });

    // 笔记折叠
    notesToggle.addEventListener('click', function() {
      this.classList.toggle('expanded');
      notesContent.classList.toggle('expanded');
    });
  }

  /**
   * 关闭 Lightbox
   */
  function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * 绑定回到顶部按钮
   */
  function bindBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });

    btn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // 窗口大小变化时重新计算瀑布流
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      calculateMasonry();
    }, 100);
  });

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
