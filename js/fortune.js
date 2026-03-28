/**
 * ========================================
 * CP同人档案馆 - 运势抽签页面脚本
 * ========================================
 */

(function() {
  'use strict';

  const STORAGE_KEY     = 'fortune-drawn-date';
  const FORTUNE_DATA_KEY = 'fortune-data';

  // 等待 CPData
  function waitForCPData(callback) {
    if (window.CPData) {
      callback();
    } else {
      setTimeout(() => waitForCPData(callback), 50);
    }
  }

  function init() {
    waitForCPData(() => {
      checkIfDrawn();
      bindDrawEvent();
      bindBackToTop();
      window.addEventListener('themechange', checkIfDrawn);
    });
  }

  /**
   * 检查今日是否已抽取
   */
  function checkIfDrawn() {
    const lastDrawn = localStorage.getItem(STORAGE_KEY);
    const today = getTodayString();
    const savedTheme = localStorage.getItem('cp-archive-theme') || 'lionmio';

    const drawBtn  = document.getElementById('drawBtn');
    const alreadyD = document.getElementById('alreadyDrawn');
    const result   = document.getElementById('fortuneResult');

    if (lastDrawn === today) {
      const stored = localStorage.getItem(FORTUNE_DATA_KEY);
      if (stored) {
        try {
          const fortune = JSON.parse(stored);
          if (fortune.theme === savedTheme) {
            if (drawBtn)  drawBtn.style.display  = 'none';
            if (alreadyD) alreadyD.style.display = '';
            displayFortune(fortune);
            if (result) {
              result.classList.add('show');
            }
            return;
          }
        } catch (e) {}
      }
      // 主题变了，清除旧数据
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(FORTUNE_DATA_KEY);
    }

    if (drawBtn)  drawBtn.style.display  = '';
    if (alreadyD) alreadyD.style.display = 'none';
    if (result) {
      result.classList.remove('show');
      const paper = document.getElementById('fortunePaper');
      if (paper) paper.classList.add('reset');
    }
  }

  function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  /**
   * 绑定抽签按钮
   */
  function bindDrawEvent() {
    const drawBtn = document.getElementById('drawBtn');
    const sticks  = document.getElementById('fortuneSticks');
    if (!drawBtn || !sticks) return;

    drawBtn.addEventListener('click', function() {
      drawBtn.disabled = true;
      sticks.classList.add('shaking');

      setTimeout(() => {
        sticks.classList.remove('shaking');
        drawFortune();
        drawBtn.disabled = false;
      }, 1500);
    });
  }

  /**
   * 执行抽签
   */
  function drawFortune() {
    const theme = localStorage.getItem('cp-archive-theme') || 'lionmio';
    if (!window.CPData) return;

    const cp      = CPData.getCPByTheme(theme);
    const fortunes = cp.fortunes || [];
    if (!fortunes.length) return;

    const selected = fortunes[Math.floor(Math.random() * fortunes.length)];
    const fortune  = {
      rank: selected.rank,
      text: selected.text,
      theme: theme
    };

    localStorage.setItem(STORAGE_KEY, getTodayString());
    localStorage.setItem(FORTUNE_DATA_KEY, JSON.stringify(fortune));

    displayFortune(fortune);
    showResult();
  }

  /**
   * 显示签文
   */
  function displayFortune(fortune) {
    const rankEl = document.getElementById('fortuneRank');
    const textEl = document.getElementById('fortuneText');
    if (rankEl) rankEl.textContent = fortune.rank;
    if (textEl) textEl.textContent = fortune.text;
  }

  /**
   * 展示结果（入场动画）
   */
  function showResult() {
    const drawBtn   = document.getElementById('drawBtn');
    const alreadyD  = document.getElementById('alreadyDrawn');
    const result    = document.getElementById('fortuneResult');
    const paper     = document.getElementById('fortunePaper');

    if (drawBtn)  drawBtn.style.display  = 'none';
    if (alreadyD) alreadyD.style.display = '';

    if (result) {
      result.classList.remove('show');
      if (paper) paper.classList.add('reset');
      requestAnimationFrame(() => {
        if (paper) paper.classList.remove('reset');
        result.classList.add('show');
      });
    }
  }

  /**
   * 绑定回到顶部
   */
  function bindBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 300);
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
