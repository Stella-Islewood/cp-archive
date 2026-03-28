/**
 * ========================================
 * CP同人档案馆 - 档案页面脚本
 * HTML 中已有静态卡片，此脚本处理图集 Lightbox
 * ========================================
 */

(function() {
  'use strict';

  // Lightbox 状态
  let lightbox = null;
  let lightboxImages = [];
  let currentImageIndex = 0;

  /**
   * 初始化档案页面
   */
  function init() {
    bindLightbox();
    bindBackToTop();
  }

  /**
   * 绑定 Lightbox 事件
   */
  function bindLightbox() {
    lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    const img = document.getElementById('lightboxImage');

    // 绑定图片点击事件
    const galleryImages = document.querySelectorAll('.gallery-image');
    galleryImages.forEach(function(image, index) {
      image.addEventListener('click', function(e) {
        e.stopPropagation();
        // 收集当前角色所有可见的图片
        const charProfile = image.closest('.character-profile');
        const visibleImages = Array.from(charProfile.querySelectorAll('.gallery-image'))
          .filter(img => img.style.display !== 'none');
        lightboxImages = visibleImages.map(img => img.src);
        currentImageIndex = visibleImages.indexOf(image);
        if (currentImageIndex === -1) currentImageIndex = 0;
        openLightbox();
      });
    });

    // 关闭
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) closeLightbox();
    });

    // 导航
    prevBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      navigateLightbox(-1);
    });
    nextBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      navigateLightbox(1);
    });

    // 键盘导航
    document.addEventListener('keydown', function(e) {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });
  }

  function openLightbox() {
    const img = document.getElementById('lightboxImage');
    img.src = lightboxImages[currentImageIndex];
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigateLightbox(direction) {
    currentImageIndex = (currentImageIndex + direction + lightboxImages.length) % lightboxImages.length;
    document.getElementById('lightboxImage').src = lightboxImages[currentImageIndex];
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

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
