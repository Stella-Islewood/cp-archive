/**
 * ========================================
 * CP同人档案馆 - 访客计数脚本
 * 使用 countapi.xyz API
 * ========================================
 */

(function() {
  'use strict';

  const LOCALSTORAGE_KEY = 'cp-archive-visitor-count';
  const API_URL = 'https://api.countapi.xyz/hit/cp-archive.vercel.app/visits';

  /**
   * 初始化访客计数
   */
  async function init() {
    const countEl = document.getElementById('visitorCount');
    if (!countEl) return;

    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        const count = data.value || 0;
        localStorage.setItem(LOCALSTORAGE_KEY, count);
        countEl.textContent = count;
      } else {
        throw new Error('API response not ok');
      }
    } catch (error) {
      // API 请求失败，使用本地存储的数字作为备用
      const localCount = parseInt(localStorage.getItem(LOCALSTORAGE_KEY)) || 108;
      countEl.textContent = localCount;
    }
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
