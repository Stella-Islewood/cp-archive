/**
 * ========================================
 * CP同人档案馆 - 彩蛋系统
 * 3秒内连续点击Footer Logo 3次触发
 * ========================================
 */

(function() {
  'use strict';

  // sessionStorage 键名
  const TRIGGERED_KEY = 'easter-egg-triggered';

  // 点击计数器
  let clickCount = 0;
  let lastClickTime = 0;

  // 彩蛋对话内容
  const DIALOGUES = {
    lionmio: [
      '谢谢你发现了这个秘密...',
      '能遇到你，是我们的幸运。',
      '愿这份羁绊，永远延续下去。'
    ],
    lucasmia: [
      '你找到我们的秘密啦...',
      '和你在一起的时光，真的很开心。',
      '我们的故事，未完待续...'
    ]
  };

  // 飘花粒子容器
  let petalsInterval = null;

  /**
   * 初始化彩蛋系统
   */
  function init() {
    // 检查是否已触发
    if (sessionStorage.getItem(TRIGGERED_KEY)) {
      return;
    }

    bindFooterClick();
    bindModalEvents();
    bindThemeChange();
  }

  /**
   * 绑定 Footer Logo 点击事件
   */
  function bindFooterClick() {
    const footerLogo = document.getElementById('footerLogo');
    if (!footerLogo) return;

    footerLogo.style.cursor = 'pointer';

    footerLogo.addEventListener('click', function() {
      const now = Date.now();

      // 如果距离上次点击超过3秒，重置计数
      if (now - lastClickTime > 3000) {
        clickCount = 0;
      }

      clickCount++;
      lastClickTime = now;

      // 添加点击动画反馈
      this.style.transform = 'scale(1.1)';
      setTimeout(() => {
        this.style.transform = '';
      }, 100);

      // 3秒内点击3次触发彩蛋
      if (clickCount >= 3) {
        triggerEasterEgg();
        clickCount = 0;
      }
    });
  }

  /**
   * 触发彩蛋
   */
  function triggerEasterEgg() {
    const modal = document.getElementById('easterEggModal');
    const backdrop = document.getElementById('easterEggBackdrop');
    const dialogueLine = document.getElementById('dialogueLine');

    // 标记已触发
    sessionStorage.setItem(TRIGGERED_KEY, 'true');

    // 获取当前主题
    const theme = document.documentElement.getAttribute('data-theme');
    const dialogues = theme === 'lucasmia' ? DIALOGUES.lucasmia : DIALOGUES.lionmio;

    // 应用主题样式
    if (theme === 'lucasmia') {
      modal.classList.add('theme-rose');
    } else {
      modal.classList.remove('theme-rose');
    }

    // 显示 Modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 开始飘花动画
    startPetalAnimation();

    // 开始打字机效果
    startTypewriter(dialogues);
  }

  /**
   * 开始打字机效果
   * @param {string[]} dialogues - 对话数组
   */
  function startTypewriter(dialogues) {
    const dialogueLine = document.getElementById('dialogueLine');
    let dialogueIndex = 0;
    let charIndex = 0;
    let currentText = '';
    let isTyping = true;

    function typeNext() {
      if (dialogueIndex >= dialogues.length) {
        return;
      }

      const currentDialogue = dialogues[dialogueIndex];

      if (isTyping) {
        // 打字中
        if (charIndex < currentDialogue.length) {
          currentText += currentDialogue[charIndex];
          dialogueLine.textContent = currentText;
          charIndex++;
          setTimeout(typeNext, 50);
        } else {
          // 一句话打完，停顿后继续下一句
          isTyping = false;
          setTimeout(() => {
            dialogueIndex++;
            charIndex = 0;
            currentText = '';
            isTyping = true;
            setTimeout(typeNext, 800);
          }, 1500);
        }
      }
    }

    typeNext();
  }

  /**
   * 开始飘花动画
   */
  function startPetalAnimation() {
    const container = document.getElementById('easterEggPetals');
    container.innerHTML = '';

    // 获取当前主题
    const theme = document.documentElement.getAttribute('data-theme');
    const petalColor = theme === 'lucasmia' ? '#D4789A' : '#7BA7C4';

    // 创建飘花粒子
    function createPetal() {
      const petal = document.createElement('div');
      petal.className = 'egg-petal';

      const size = Math.random() * 15 + 8;
      const startX = Math.random() * window.innerWidth;
      const duration = Math.random() * 5 + 8;
      const delay = Math.random() * 2;

      petal.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${petalColor};
        left: ${startX}px;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        opacity: ${Math.random() * 0.4 + 0.3};
      `;

      container.appendChild(petal);

      // 动画结束后移除
      setTimeout(() => {
        petal.remove();
      }, (duration + delay) * 1000);
    }

    // 每200ms创建一个新花瓣
    petalsInterval = setInterval(createPetal, 200);

    // 初始创建多个花瓣
    for (let i = 0; i < 20; i++) {
      setTimeout(createPetal, i * 50);
    }
  }

  /**
   * 停止飘花动画
   */
  function stopPetalAnimation() {
    if (petalsInterval) {
      clearInterval(petalsInterval);
      petalsInterval = null;
    }
    const container = document.getElementById('easterEggPetals');
    if (container) {
      container.innerHTML = '';
    }
  }

  /**
   * 绑定 Modal 事件
   */
  function bindModalEvents() {
    const modal = document.getElementById('easterEggModal');
    const closeBtn = document.getElementById('easterEggClose');
    const backdrop = document.getElementById('easterEggBackdrop');

    // 关闭按钮
    closeBtn.addEventListener('click', closeEasterEgg);

    // 点击背景关闭
    backdrop.addEventListener('click', closeEasterEgg);

    // ESC 键关闭
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeEasterEgg();
      }
    });
  }

  /**
   * 关闭彩蛋
   */
  function closeEasterEgg() {
    const modal = document.getElementById('easterEggModal');
    const dialogueLine = document.getElementById('dialogueLine');

    modal.classList.remove('active');
    document.body.style.overflow = '';
    dialogueLine.textContent = '';
    stopPetalAnimation();
  }

  /**
   * 监听主题变化
   */
  function bindThemeChange() {
    window.addEventListener('themechange', function(e) {
      const modal = document.getElementById('easterEggModal');
      if (e.detail.theme === 'lucasmia') {
        modal.classList.add('theme-rose');
      } else {
        modal.classList.remove('theme-rose');
      }
    });
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 添加彩蛋样式
  const style = document.createElement('style');
  style.textContent = `
    /* ========================================
       彩蛋 Modal 样式
       ======================================== */
    .easter-egg-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 3000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.5s ease, visibility 0.5s ease;
    }

    .easter-egg-modal.active {
      opacity: 1;
      visibility: visible;
    }

    .easter-egg-backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
    }

    .easter-egg-content {
      position: relative;
      width: 90%;
      max-width: 600px;
      padding: 3rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 1;
    }

    .easter-egg-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .easter-egg-close:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: rotate(90deg);
    }

    /* 角色头像 */
    .easter-egg-characters {
      display: flex;
      gap: 3rem;
      margin-bottom: 2rem;
    }

    .character-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
      box-shadow: 0 4px 20px rgba(123, 167, 196, 0.4);
      animation: avatarPulse 2s ease-in-out infinite;
    }

    .theme-rose .character-avatar {
      box-shadow: 0 4px 20px rgba(212, 120, 154, 0.4);
    }

    .lion-avatar {
      background: linear-gradient(135deg, #7BA7C4 0%, #5A8FB0 100%);
    }

    .mio-avatar {
      background: linear-gradient(135deg, #B8D8F8 0%, #8ABCE8 100%);
    }

    .theme-rose .lion-avatar {
      background: linear-gradient(135deg, #D4789A 0%, #C06080 100%);
    }

    .theme-rose .mio-avatar {
      background: linear-gradient(135deg, #F0C8D8 0%, #E0A0B8 100%);
    }

    @keyframes avatarPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    /* 对话框 */
    .easter-egg-dialogue {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      padding: 1.5rem 2rem;
      min-height: 80px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dialogue-line {
      font-size: 1.2rem;
      color: white;
      text-align: center;
      line-height: 1.8;
      letter-spacing: 0.1em;
      min-height: 2em;
    }

    /* 飘花容器 */
    .easter-egg-petals {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    }

    .egg-petal {
      position: absolute;
      top: -20px;
      border-radius: 50% 0 50% 0;
      animation: petalFall linear forwards;
    }

    @keyframes petalFall {
      0% {
        transform: translateY(0) rotate(0deg);
        opacity: 0;
      }
      10% {
        opacity: 1;
      }
      90% {
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(720deg);
        opacity: 0;
      }
    }

    /* Footer Logo 样式 */
    .footer-logo {
      display: inline-block;
      transition: transform 0.2s ease;
    }
  `;
  document.head.appendChild(style);

})();
