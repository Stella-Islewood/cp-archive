/**
 * ========================================
 * CP同人档案馆 - 角色卡片主题切换
 * HTML 中已有静态卡片，此脚本仅处理显示/隐藏
 * ========================================
 */

(function() {
  'use strict';

  /**
   * 初始化角色卡片
   */
  function init() {
    updateCharacterCards();
    
    // 监听主题切换
    window.addEventListener('themechange', function(e) {
      updateCharacterCards();
    });
  }

  /**
   * 根据主题显示/隐藏卡片
   */
  function updateCharacterCards() {
    var container = document.getElementById('character-cards');
    if (!container) return;

    var theme = localStorage.getItem('cp-archive-theme') || 'lionmio';
    var cards = container.querySelectorAll('.character-card');
    
    cards.forEach(function(card) {
      var cardTheme = card.getAttribute('data-theme');
      if (cardTheme === theme) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
