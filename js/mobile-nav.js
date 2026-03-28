/**
 * ========================================
 * CP同人档案馆 - 移动端汉堡菜单脚本
 * ========================================
 */

(function() {
  'use strict';

  /**
   * 初始化汉堡菜单
   */
  function init() {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavClose = document.getElementById('mobileNavClose');

    if (!hamburger || !mobileNav) return;

    // 打开菜单
    hamburger.addEventListener('click', function() {
      mobileNav.classList.add('active');
      mobileNavOverlay.classList.add('active');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    });

    // 关闭菜单
    function closeMenu() {
      mobileNav.classList.remove('active');
      mobileNavOverlay.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    if (mobileNavClose) {
      mobileNavClose.addEventListener('click', closeMenu);
    }

    if (mobileNavOverlay) {
      mobileNavOverlay.addEventListener('click', closeMenu);
    }

    // ESC 键关闭菜单
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
        closeMenu();
      }
    });

    // 点击导航链接后关闭菜单
    const mobileNavLinks = mobileNav.querySelectorAll('.nav-link');
    mobileNavLinks.forEach(function(link) {
      link.addEventListener('click', function() {
        closeMenu();
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
