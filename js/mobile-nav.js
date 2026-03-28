/**
 * ========================================
 * CP同人档案馆 - 移动端汉堡菜单脚本
 * ========================================
 */

document.addEventListener('DOMContentLoaded', function() {
  var hamburger = document.getElementById('hamburger');
  var mobileNav = document.getElementById('mobileNav');
  var mobileNavOverlay = document.getElementById('mobileNavOverlay');
  var mobileNavClose = document.getElementById('mobileNavClose');

  if (!hamburger || !mobileNav) {
    console.warn('Mobile navigation elements not found');
    return;
  }

  // 打开菜单
  hamburger.addEventListener('click', function() {
    mobileNav.classList.add('active');
    if (mobileNavOverlay) {
      mobileNavOverlay.classList.add('active');
    }
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  });

  // 关闭菜单函数
  function closeMenu() {
    mobileNav.classList.remove('active');
    if (mobileNavOverlay) {
      mobileNavOverlay.classList.remove('active');
    }
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  // 关闭按钮
  if (mobileNavClose) {
    mobileNavClose.addEventListener('click', closeMenu);
  }

  // 点击遮罩关闭
  if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener('click', closeMenu);
  }

  // ESC 键关闭
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
      closeMenu();
    }
  });

  // 点击导航链接后关闭菜单
  var mobileNavLinks = mobileNav.querySelectorAll('.nav-link');
  for (var i = 0; i < mobileNavLinks.length; i++) {
    mobileNavLinks[i].addEventListener('click', function() {
      closeMenu();
    });
  }
});
