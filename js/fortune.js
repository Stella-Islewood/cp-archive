/**
 * ========================================
 * CP同人档案馆 - 运势抽签页面脚本
 * 使用 CPData 统一管理签文数据
 * ========================================
 */

(function() {
  'use strict';

  // localStorage 键名
  const STORAGE_KEY = 'fortune-drawn-date';
  const FORTUNE_DATA_KEY = 'fortune-data';

  // 等待 CPData 加载
  function waitForCPData(callback) {
    if (window.CPData) {
      callback();
    } else {
      setTimeout(() => waitForCPData(callback), 50);
    }
  }

  /**
   * 初始化抽签功能
   */
  function init() {
    waitForCPData(() => {
      console.log('抽签功能正常');
      checkIfDrawn();
      bindDrawEvent();
      bindBackToTop();
      
      // 监听主题切换
      window.addEventListener('themechange', function(e) {
        checkIfDrawn();
      });
    });
  }

  /**
   * 检查今日是否已抽取
   */
  function checkIfDrawn() {
    const lastDrawn = localStorage.getItem(STORAGE_KEY);
    const today = getTodayString();
    const savedTheme = localStorage.getItem('cp-archive-theme') || 'lionmio';

    if (lastDrawn === today) {
      // 检查存储的签文是否是当前主题的
      const storedData = localStorage.getItem(FORTUNE_DATA_KEY);
      if (storedData) {
        try {
          const fortune = JSON.parse(storedData);
          // 如果是当前主题的签文则显示
          if (fortune.theme === savedTheme) {
            const drawBtn = document.getElementById('drawBtn');
            const bambooContainer = document.getElementById('bambooContainer');
            const alreadyDrawn = document.getElementById('alreadyDrawn');
            const fortuneResult = document.getElementById('fortuneResult');
            
            if (drawBtn) drawBtn.style.display = 'none';
            if (bambooContainer) bambooContainer.style.opacity = '0.5';
            if (alreadyDrawn) alreadyDrawn.style.display = 'block';
            displayFortune(fortune);
            if (fortuneResult) fortuneResult.style.display = 'block';
            return;
          }
        } catch (e) {
          console.warn('无法读取存储的签文');
        }
      }
      
      // 如果是不同主题，清除旧数据
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(FORTUNE_DATA_KEY);
    }

    // 重置UI
    const drawBtn = document.getElementById('drawBtn');
    const bambooContainer = document.getElementById('bambooContainer');
    const alreadyDrawn = document.getElementById('alreadyDrawn');
    const fortuneResult = document.getElementById('fortuneResult');
    
    if (drawBtn) drawBtn.style.display = '';
    if (bambooContainer) bambooContainer.style.opacity = '';
    if (alreadyDrawn) alreadyDrawn.style.display = 'none';
    if (fortuneResult) fortuneResult.style.display = 'none';
  }

  /**
   * 获取今日日期字符串
   * @returns {string}
   */
  function getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  /**
   * 绑定抽签事件
   */
  function bindDrawEvent() {
    const drawBtn = document.getElementById('drawBtn');
    const bambooShaker = document.getElementById('bambooShaker');

    if (!drawBtn || !bambooShaker) {
      console.error('抽签按钮或签筒未找到');
      return;
    }

    drawBtn.addEventListener('click', function() {
      console.log('抽签按钮点击');
      
      // 添加摇晃动画
      bambooShaker.classList.add('shaking');
      drawBtn.disabled = true;

      // 摇晃动画结束后显示结果
      setTimeout(() => {
        bambooShaker.classList.remove('shaking');
        drawFortune();
        drawBtn.disabled = false;
      }, 1500);
    });
  }

  /**
   * 执行抽签
   */
  function drawFortune() {
    console.log('开始抽签');
    
    // 获取当前主题
    const theme = localStorage.getItem('cp-archive-theme') || 'lionmio';
    
    // 从 CPData 获取签文
    if (!window.CPData) {
      console.error('CPData 未加载');
      return;
    }
    
    const cp = CPData.getCPByTheme(theme);
    const fortunes = cp.fortunes;
    
    console.log('可用签文数量:', fortunes.length);
    
    // 随机选择一条签文
    const randomIndex = Math.floor(Math.random() * fortunes.length);
    const selectedFortune = fortunes[randomIndex];
    
    const fortune = {
      rank: selectedFortune.rank,
      text: selectedFortune.text,
      theme: theme
    };

    console.log('抽中签文:', fortune);

    // 保存到 localStorage
    localStorage.setItem(STORAGE_KEY, getTodayString());
    localStorage.setItem(FORTUNE_DATA_KEY, JSON.stringify(fortune));

    // 显示签文
    displayFortune(fortune);

    // 更新UI
    const drawBtn = document.getElementById('drawBtn');
    const bambooContainer = document.getElementById('bambooContainer');
    const alreadyDrawn = document.getElementById('alreadyDrawn');
    const fortuneResult = document.getElementById('fortuneResult');
    
    if (drawBtn) drawBtn.style.display = 'none';
    if (bambooContainer) bambooContainer.style.opacity = '0.5';
    if (alreadyDrawn) alreadyDrawn.style.display = 'block';
    if (fortuneResult) {
      fortuneResult.style.display = 'block';
      // 重置动画
      fortuneResult.style.animation = 'none';
      fortuneResult.offsetHeight; // 触发重排
      fortuneResult.style.animation = 'fortuneAppear 0.8s ease forwards';
    }
  }

  /**
   * 显示签文
   * @param {Object} fortune - 签文数据
   */
  function displayFortune(fortune) {
    const rankEl = document.getElementById('fortuneRank');
    const textEl = document.getElementById('fortuneText');

    if (rankEl) rankEl.textContent = fortune.rank;
    if (textEl) textEl.textContent = fortune.text;
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
