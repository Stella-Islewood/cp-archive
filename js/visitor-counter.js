/**
 * ========================================
 * CP同人档案馆 - 访客计数脚本
 * ========================================
 */

(function() {
  'use strict';

  const VISITOR_COUNT_KEY = 'visitor-count';
  const VISITOR_VISITED_KEY = 'visitor-visited';
  const INITIAL_COUNT = 108;

  /**
   * 初始化访客计数
   */
  function init() {
    const visited = localStorage.getItem(VISITOR_VISITED_KEY);
    
    if (!visited) {
      // 新访客
      let count = parseInt(localStorage.getItem(VISITOR_COUNT_KEY)) || INITIAL_COUNT;
      count++;
      localStorage.setItem(VISITOR_COUNT_KEY, count);
      localStorage.setItem(VISITOR_VISITED_KEY, 'true');
    }
    
    // 更新显示
    updateVisitorDisplay();
  }

  /**
   * 更新访客数量显示
   */
  function updateVisitorDisplay() {
    const countEl = document.getElementById('visitorCount');
    if (!countEl) return;
    
    let count = parseInt(localStorage.getItem(VISITOR_COUNT_KEY)) || INITIAL_COUNT;
    countEl.textContent = count;
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
