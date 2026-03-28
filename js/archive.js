/**
 * ========================================
 * CP同人档案馆 - 档案页面脚本
 * ========================================
 */

(function() {
  'use strict';

  // 图片查看 Modal
  let galleryModal = null;
  let currentGalleryIndex = 0;
  let currentGalleryImages = [];

  // 等待 CPData 和数据加载完成
  function waitForCPData(callback) {
    function checkAndRun() {
      if (window.CPData && typeof CPData.isLoaded === 'function') {
        // CPData 存在且有 isLoaded 方法
        if (CPData.isLoaded()) {
          callback();
          return true;
        }
      }
      return false;
    }

    // 如果已经加载完成，直接执行
    if (checkAndRun()) return;

    // 否则监听事件
    window.addEventListener('cpDataLoaded', function handler() {
      window.removeEventListener('cpDataLoaded', handler);
      callback();
    });

    // 超时 fallback：2秒后强制执行
    setTimeout(function() {
      window.removeEventListener('cpDataLoaded', handler);
      callback();
    }, 2000);
  }

  /**
   * 初始化档案页面
   */
  function init() {
    waitForCPData(() => {
      createGalleryModal();
      renderProfiles();
      bindBackToTop();
      
      // 监听主题切换
      window.addEventListener('themechange', function(e) {
        renderProfiles();
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
   * 渲染角色档案
   */
  function renderProfiles() {
    const container = document.getElementById('archiveSection');
    if (!container) return;

    const theme = localStorage.getItem('cp-archive-theme') || 'lionmio';
    const cp = CPData.getCPByTheme(theme);

    // 清空现有内容
    container.innerHTML = '';

    // 为每个角色创建档案卡
    cp.characters.forEach((char, index) => {
      const profile = createProfileCard(char, index, theme);
      container.appendChild(profile);
    });
  }

  /**
   * 创建角色档案卡片
   * @param {Object} char - 角色数据
   * @param {number} index - 索引
   * @param {string} theme - 当前主题
   * @returns {HTMLElement}
   */
  function createProfileCard(char, index, theme) {
    const article = document.createElement('article');
    article.className = 'character-profile';
    article.dataset.index = index;

    // 获取另一角色的名字
    const otherChar = CPData.getCurrentCP().characters.find(c => c.id !== char.id);
    const otherName = otherChar ? otherChar.name : 'TA';

    // 头像图片路径 - 使用大写 JPG
    const avatarPath = `images/characters/${char.id}.JPG`;

    // 处理空数据 - 显示"待补充"灰色斜体
    const formatValue = (val) => {
      if (!val || val.trim() === '') {
        return '<span class="pending-text">待补充</span>';
      }
      return val;
    };

    // 头像内容 - 加载失败时显示首字母占位
    const avatarContent = `<img src="${avatarPath}" alt="${char.name}" onerror="this.style.display='none';this.parentElement.innerHTML='<span class=\\'profile-avatar-placeholder\\'>${char.initial || char.name?.charAt(0) || '?'}</span>'" />`;

    // 性格标签
    const traitsHTML = (char.traits || []).slice(0, 3).map(trait => 
      `<span class="profile-trait">${trait}</span>`
    ).join('');

    // 经典台词和关系描述暂时显示"待补充"
    const quoteDisplay = '<span class="pending-text">待补充</span>';
    const relationshipDisplay = '<span class="pending-text">待补充</span>';

    article.innerHTML = `
      <div class="profile-avatar-section">
        <div class="profile-avatar" id="avatar-${char.id}">
          ${avatarContent}
        </div>
        <h3 class="profile-name">${char.name}</h3>
        <p class="profile-tagline">${formatValue(char.tagline || char.element)}</p>
      </div>
      <div class="profile-info">
        <div class="profile-info-row">
          <div class="profile-info-item">
            <span class="profile-info-label">生日</span>
            <span class="profile-info-value">${formatValue(char.birthday)}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">身高</span>
            <span class="profile-info-value">${formatValue(char.height)}</span>
          </div>
          <div class="profile-info-item">
            <span class="profile-info-label">属性</span>
            <span class="profile-info-value">${formatValue(char.element)}</span>
          </div>
        </div>
        
        <div class="profile-divider"></div>
        
        <div class="profile-traits">
          ${traitsHTML || '<span class="pending-text">待补充</span>'}
        </div>
        
        <div class="profile-divider"></div>
        
        <div class="profile-section">
          <span class="profile-section-title">个人简介</span>
          <p class="profile-section-content">${formatValue(char.description)}</p>
        </div>
        
        <div class="profile-section">
          <span class="profile-section-title">经典台词</span>
          <p class="profile-quote">${quoteDisplay}</p>
        </div>
        
        <div class="profile-section">
          <span class="profile-section-title">与 ${otherName} 的关系</span>
          <p class="profile-relationship">${relationshipDisplay}</p>
        </div>

        <!-- 角色图集 -->
        <div class="profile-gallery">
          <h4 class="gallery-title">角色图集</h4>
          <div class="gallery-grid" id="gallery-${char.id}">
            ${generateGalleryItems(char.id)}
          </div>
        </div>
      </div>
    `;

    // 绑定图集点击事件
    const galleryItems = article.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, i) => {
      item.addEventListener('click', function() {
        const images = getGalleryImages(char.id);
        openGalleryModal(images, i);
      });
    });

    return article;
  }

  /**
   * 生成图集项 HTML
   */
  function generateGalleryItems(charId) {
    let html = '';
    for (let i = 1; i <= 4; i++) {
      const imgPath = `images/gallery/${charId}-${i}.jpg`;
      html += `
        <div class="gallery-item">
          <img src="${imgPath}" alt="${charId} 图集 ${i}" onerror="this.style.display='none';this.parentElement.innerHTML='<div class=\\'gallery-placeholder\\'>${i}</div>'" />
        </div>
      `;
    }
    return html;
  }

  /**
   * 获取图集图片路径
   */
  function getGalleryImages(charId) {
    const images = [];
    for (let i = 1; i <= 4; i++) {
      images.push(`images/gallery/${charId}-${i}.jpg`);
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
