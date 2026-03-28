/**
 * ========================================
 * CP同人档案馆 - 档案页面脚本
 * HTML 中已有静态卡片，此脚本处理图集 Modal 和回到顶部
 * ========================================
 */

(function() {
  'use strict';

  // 图片查看 Modal
  let galleryModal = null;
  let currentGalleryIndex = 0;
  let currentGalleryImages = [];

  /**
   * 初始化档案页面
   */
  function init() {
    createGalleryModal();
    bindBackToTop();
    bindGalleryClicks();
  }

  /**
   * 绑定图集点击事件
   */
  function bindGalleryClicks() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, i) => {
      item.addEventListener('click', function() {
        const charId = item.closest('.character-profile').getAttribute('data-character');
        const images = getGalleryImages(charId);
        openGalleryModal(images, i);
      });
    });
  }

  /**
   * 创建图片查看 Modal
   */
  function createGalleryModal() {
    if (galleryModal) return;

    const modal = document.createElement('div');
    modal.className = 'gallery-modal';
    modal.id = 'galleryModal';
    modal.innerHTML = `
      <button class="gallery-modal-close" aria-label="关闭">×</button>
      <button class="gallery-modal-nav prev" aria-label="上一张">‹</button>
      <div class="gallery-modal-content">
        <img src="" alt="" />
      </div>
      <button class="gallery-modal-nav next" aria-label="下一张">›</button>
    `;

    document.body.appendChild(modal);
    galleryModal = modal;

    // 绑定事件
    modal.querySelector('.gallery-modal-close').addEventListener('click', closeGalleryModal);
    modal.querySelector('.prev').addEventListener('click', prevGalleryImage);
    modal.querySelector('.next').addEventListener('click', nextGalleryImage);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeGalleryModal();
      }
    });

    // 键盘导航
    document.addEventListener('keydown', function(e) {
      if (!modal.classList.contains('active')) return;
      if (e.key === 'Escape') closeGalleryModal();
      if (e.key === 'ArrowLeft') prevGalleryImage();
      if (e.key === 'ArrowRight') nextGalleryImage();
    });
  }

  /**
   * 打开图片查看 Modal
   */
  function openGalleryModal(images, index) {
    if (!galleryModal) return;
    currentGalleryImages = images;
    currentGalleryIndex = index;

    const modal = galleryModal;
    const img = modal.querySelector('.gallery-modal-content img');
    img.src = images[index];
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * 关闭图片查看 Modal
   */
  function closeGalleryModal() {
    if (!galleryModal) return;
    galleryModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * 上一张图片
   */
  function prevGalleryImage() {
    if (currentGalleryImages.length === 0) return;
    currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    updateGalleryImage();
  }

  /**
   * 下一张图片
   */
  function nextGalleryImage() {
    if (currentGalleryImages.length === 0) return;
    currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;
    updateGalleryImage();
  }

  /**
   * 更新 Modal 图片
   */
  function updateGalleryImage() {
    if (!galleryModal) return;
    const img = galleryModal.querySelector('.gallery-modal-content img');
    img.src = currentGalleryImages[currentGalleryIndex];
  }

  /**
   * 获取图集图片路径
   */
  function getGalleryImages(charId) {
    const images = [];
    for (let i = 1; i <= 4; i++) {
      images.push('images/gallery/' + charId + '-' + i + '.jpg');
    }
    return images;
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
