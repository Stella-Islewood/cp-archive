/**
 * ========================================
 * CP同人档案馆 - 双生站主题切换逻辑
 * ========================================
 */

(function() {
  'use strict';

  // 主题常量
  const THEMES = {
    LIONMIO: 'lionmio',
    LUCASMIA: 'lucasmia'
  };

  // localStorage 键名
  const STORAGE_KEY = 'cp-archive-theme';

  // 当前主题状态
  let currentTheme = THEMES.LIONMIO;

  /**
   * 初始化主题切换器
   */
  function init() {
    // 等待 CPData 加载
    if (!window.CPData) {
      setTimeout(init, 50);
      return;
    }

    // 恢复保存的主题
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      currentTheme = savedTheme;
    }

    // 应用主题
    applyTheme(currentTheme);

    // 绑定切换事件
    bindToggleEvents();

    // 通知粒子系统主题切换
    notifyPetalsThemeChange(currentTheme);
  }

  /**
   * 应用主题到文档
   * @param {string} theme - 主题名称
   */
  function applyTheme(theme) {
    // 移除旧主题，添加新主题
    document.documentElement.removeAttribute('data-theme');
    
    if (theme !== THEMES.LIONMIO) {
      document.documentElement.setAttribute('data-theme', theme);
    }

    // 更新站名显示
    updateSiteNameDisplay(theme);

    // 更新 Logo 缩写
    updateLogoInitials(theme);

    // 更新 Logo SVG 图案
    updateLogoSVG(theme);

    // 更新 Hero 标题
    updateHeroTitle(theme);

    // 更新 CP 标语
    updateCPSlogan(theme);

    // 更新 Footer 站名
    updateFooterSiteName(theme);

    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme: theme }
    }));
  }

  /**
   * 更新站名显示
   * @param {string} theme - 主题名称
   */
  function updateSiteNameDisplay(theme) {
    if (!window.CPData) return;
    
    const cp = CPData.getCPByTheme(theme);
    const siteNameElements = document.querySelectorAll('.site-name');
    siteNameElements.forEach(el => {
      el.textContent = cp.name + ' Archive';
    });
  }

  /**
   * 更新 Logo 缩写（保留用于兼容性）
   * @param {string} theme - 主题名称
   */
  function updateLogoInitials(theme) {
    const logoInitials = document.querySelectorAll('.logo-initials');
    logoInitials.forEach(el => {
      el.style.display = 'none'; // 隐藏文字，显示SVG
    });
  }

  /**
   * 更新 Logo SVG 图案
   * @param {string} theme - 主题名称
   */
  function updateLogoSVG(theme) {
    const logoBadges = document.querySelectorAll('.logo-badge');
    const accentColor = theme === 'lucasmia' ? '#E890B0' : '#7BA7C4';
    
    logoBadges.forEach(badge => {
      // 移除旧的SVG
      const oldSvg = badge.querySelector('.logo-svg');
      if (oldSvg) {
        oldSvg.remove();
      }
      
      // 创建新的SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'logo-svg');
      svg.setAttribute('viewBox', '0 0 42 42');
      svg.setAttribute('width', '42');
      svg.setAttribute('height', '42');
      svg.style.cssText = 'position: absolute; top: 0; left: 0;';
      
      svg.innerHTML = `
        <circle cx="21" cy="21" r="16" fill="none" stroke="${accentColor}" stroke-width="1.5" opacity="0.8"/>
        <circle cx="21" cy="21" r="12" fill="none" stroke="${accentColor}" stroke-width="1" opacity="0.5"/>
      `;
      
      badge.insertBefore(svg, badge.firstChild);
    });
  }

  /**
   * 更新 Hero 标题（带 fade 效果）
   * @param {string} theme - 主题名称
   */
  function updateHeroTitle(theme) {
    if (!window.CPData) return;
    
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;

    const cp = CPData.getCPByTheme(theme);
    const lionSpan = heroTitle.querySelector('.title-lion');
    const mioSpan = heroTitle.querySelector('.title-mio');

    if (lionSpan && mioSpan) {
      // 添加淡出效果
      heroTitle.classList.add('fade-out');

      // 300ms 后更新内容并淡入
      setTimeout(() => {
        lionSpan.textContent = cp.heroTitle.lion;
        mioSpan.textContent = cp.heroTitle.mio;
        heroTitle.classList.remove('fade-out');
      }, 300);
    }
  }

  /**
   * 更新 CP 标语
   * @param {string} theme - 主题名称
   */
  function updateCPSlogan(theme) {
    if (!window.CPData) return;
    
    const cp = CPData.getCPByTheme(theme);
    const sloganElement = document.querySelector('.cp-slogan');
    if (sloganElement) {
      sloganElement.classList.add('fade-out');
      setTimeout(() => {
        sloganElement.textContent = cp.tagline;
        sloganElement.classList.remove('fade-out');
      }, 300);
    }
  }

  /**
   * 更新 Footer 站名
   * @param {string} theme - 主题名称
   */
  function updateFooterSiteName(theme) {
    if (!window.CPData) return;
    
    const cp = CPData.getCPByTheme(theme);
    const footerSiteNameElements = document.querySelectorAll('.footer-site-name');
    footerSiteNameElements.forEach(el => {
      el.textContent = cp.name;
    });
  }

  /**
   * 绑定切换事件
   */
  function bindToggleEvents() {
    // 绑定到所有站名切换元素
    const toggleElements = document.querySelectorAll('.site-name-toggle');
    toggleElements.forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', handleToggle);
      // 添加过渡效果
      el.style.transition = 'color 800ms ease, text-shadow 800ms ease';
    });

    // 键盘可访问性
    toggleElements.forEach(el => {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', '切换站点主题');
    });
  }

  /**
   * 处理主题切换
   */
  function handleToggle() {
    toggleTheme();
  }

  /**
   * 切换主题
   */
  function toggleTheme() {
    currentTheme = currentTheme === THEMES.LIONMIO 
      ? THEMES.LUCASMIA 
      : THEMES.LIONMIO;

    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEY, currentTheme);

    // 应用主题
    applyTheme(currentTheme);

    // 通知粒子系统
    notifyPetalsThemeChange(currentTheme);
  }

  /**
   * 通知粒子系统主题变化
   * @param {string} theme - 新主题
   */
  function notifyPetalsThemeChange(theme) {
    window.dispatchEvent(new CustomEvent('petalsThemeChange', {
      detail: { theme: theme }
    }));
  }

  /**
   * 获取当前主题
   * @returns {string} 当前主题名称
   */
  function getCurrentTheme() {
    return currentTheme;
  }

  /**
   * 设置指定主题
   * @param {string} theme - 主题名称
   */
  function setTheme(theme) {
    if (Object.values(THEMES).includes(theme)) {
      currentTheme = theme;
      localStorage.setItem(STORAGE_KEY, theme);
      applyTheme(theme);
      notifyPetalsThemeChange(theme);
    }
  }

  // 键盘事件处理
  document.addEventListener('keydown', function(e) {
    const toggleElements = document.querySelectorAll('.site-name-toggle');
    
    toggleElements.forEach(el => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (document.activeElement === el) {
          e.preventDefault();
          handleToggle();
        }
      }
    });
  });

  // 导出 API
  window.ThemeSwitcher = {
    init: init,
    toggle: toggleTheme,
    setTheme: setTheme,
    getCurrentTheme: getCurrentTheme,
    THEMES: THEMES
  };

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
