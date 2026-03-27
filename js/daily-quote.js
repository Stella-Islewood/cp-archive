/**
 * ========================================
 * CP同人档案馆 - 今日一言
 * ========================================
 */

(function() {
  'use strict';

  /**
   * 初始化今日一言
   */
  function init() {
    // 等待 CPData 加载
    if (!window.CPData) {
      setTimeout(init, 50);
      return;
    }

    displayDailyQuote();
  }

  /**
   * 显示今日一言
   */
  function displayDailyQuote() {
    const quoteElement = document.getElementById('dailyQuote');
    if (!quoteElement) return;

    const quote = CPData.getRandomQuote();
    quoteElement.textContent = `"${quote}"`;
    
    // 添加淡入动画
    quoteElement.style.opacity = '0';
    setTimeout(() => {
      quoteElement.style.transition = 'opacity 0.8s ease';
      quoteElement.style.opacity = '1';
    }, 100);
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
