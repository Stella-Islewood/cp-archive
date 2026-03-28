/**
 * ========================================
 * CP同人档案馆 - 角色卡片动态渲染
 * 使用 CPData 统一管理数据
 * ========================================
 */

(function() {
  'use strict';

  // 等待 CPData 加载
  function waitForCPData(callback) {
    if (window.CPData) {
      callback();
    } else {
      setTimeout(() => waitForCPData(callback), 50);
    }
  }

  /**
   * 初始化角色卡片
   */
  function init() {
    waitForCPData(() => {
      renderCharacterCards();
      
      // 监听主题切换
      window.addEventListener('themechange', function(e) {
        renderCharacterCards(e.detail.theme);
      });
      
      // 立即渲染
      const savedTheme = localStorage.getItem('cp-archive-theme') || CPData.THEMES.LIONMIO;
      renderCharacterCards(savedTheme);
    });
  }

  /**
   * 渲染角色卡片
   * @param {string} theme - 当前主题
   */
  function renderCharacterCards(theme) {
    const container = document.getElementById('character-cards');
    if (!container) return;

    const cp = CPData.getCPByTheme(theme);
    
    // 清空现有卡片
    container.innerHTML = '';

    // 创建简洁的角色卡片
    cp.characters.forEach((char, index) => {
      const card = createSimpleCharacterCard(char, theme, index);
      container.appendChild(card);
    });
  }

  /**
   * 创建简洁的角色卡片
   * @param {Object} char - 角色数据
   * @param {string} theme - 当前主题
   * @param {number} index - 卡片索引
   * @returns {HTMLElement} 卡片元素
   */
  function createSimpleCharacterCard(char, theme, index) {
    const article = document.createElement('article');
    article.className = 'character-card simple-card';

    // 显示 tagline，如果为空则显示 element
    const taglineText = char.tagline || char.element || '';

    // 生成性格标签HTML
    const traitsHTML = (char.traits || []).slice(0, 3).map(trait => 
      `<span class="trait-tag">${trait}</span>`
    ).join('');

    article.innerHTML = `
      <div class="character-avatar ${char.avatarClass}">
        <span>${char.initial || char.name?.charAt(0) || '?'}</span>
      </div>
      <h3 class="character-name" data-name="${char.name}">${char.name}</h3>
      <p class="character-tagline">${taglineText}</p>
      <div class="character-traits">
        ${traitsHTML}
      </div>
    `;

    // 绑定爱心粒子效果
    const nameEl = article.querySelector('.character-name');
    nameEl.addEventListener('mouseenter', function(e) {
      createHeartParticles(e, theme);
    });

    return article;
  }

  /**
   * 创建爱心粒子效果
   * @param {Event} e - 鼠标事件
   * @param {string} theme - 当前主题
   */
  function createHeartParticles(e, theme) {
    const rect = e.target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top;

    const particleCount = Math.floor(Math.random() * 4) + 5; // 5-8个

    for (let i = 0; i < particleCount; i++) {
      setTimeout(() => {
        createHeartParticle(centerX, centerY, theme);
      }, i * 50);
    }
  }

  /**
   * 创建单个爱心粒子
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {string} theme - 当前主题
   */
  function createHeartParticle(x, y, theme) {
    const particle = document.createElement('div');
    particle.className = 'heart-particle';
    
    // 随机偏移
    const offsetX = (Math.random() - 0.5) * 40;
    const size = Math.random() * 8 + 6;
    const duration = Math.random() * 400 + 600;

    // 主题色
    const color = theme === 'lucasmia' ? '#E890B0' : '#7BA7C4';

    particle.style.cssText = `
      position: fixed;
      left: ${x + offsetX}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      color: ${color};
      font-size: ${size}px;
      pointer-events: none;
      z-index: 9999;
      animation: heartFloat ${duration}ms ease-out forwards;
    `;
    
    particle.textContent = '❤';
    document.body.appendChild(particle);

    setTimeout(() => {
      particle.remove();
    }, duration);
  }

  // 添加爱心飘散动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes heartFloat {
      0% {
        opacity: 1;
        transform: translateY(0) scale(0.5);
      }
      50% {
        opacity: 1;
        transform: translateY(-30px) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateY(-60px) scale(0.5);
      }
    }
    
    .heart-particle {
      position: fixed;
      pointer-events: none;
      z-index: 9999;
    }
  `;
  document.head.appendChild(style);

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
