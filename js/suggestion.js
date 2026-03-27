/**
 * ========================================
 * CP同人档案馆 - 建议箱页面脚本
 * ========================================
 */

(function() {
  'use strict';

  /**
   * 初始化建议箱功能
   */
  function init() {
    bindFormEvents();
    bindBackToTop();
  }

  /**
   * 绑定表单事件
   */
  function bindFormEvents() {
    const form = document.getElementById('suggestionForm');
    const contentField = document.getElementById('content');
    const charCount = document.getElementById('charCurrent');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');

    // 字符计数
    contentField.addEventListener('input', function() {
      charCount.textContent = this.value.length;
    });

    // 表单提交
    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      // 获取表单数据
      const nickname = document.getElementById('nickname').value.trim();
      const category = document.getElementById('category').value;
      const content = contentField.value.trim();

      if (!category || !content) {
        return;
      }

      // 禁用提交按钮
      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = '发送中...';

      // 隐藏之前的消息
      successMessage.classList.remove('show');
      errorMessage.classList.remove('show');

      try {
        // 发送邮件
        await emailjs.send('service_iouin', 'template_iouin', {
          from_name: document.getElementById('nickname').value || '匿名',
          reply_to: '',
          category: document.getElementById('category').value,
          message: document.getElementById('content').value
        }, 'KPlvsCzR0h4RaoGaq');

        // 显示成功消息
        successMessage.classList.add('show');

        // 重置表单
        form.reset();
        charCount.textContent = '0';

        // 3秒后隐藏成功消息
        setTimeout(() => {
          successMessage.classList.remove('show');
        }, 5000);

      } catch (error) {
        console.error('发送失败:', error);
        // 显示错误消息
        errorMessage.classList.add('show');

        // 5秒后隐藏错误消息
        setTimeout(() => {
          errorMessage.classList.remove('show');
        }, 5000);
      } finally {
        // 恢复提交按钮
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = '发送建议';
      }
    });
  }

  /**
   * 绑定回到顶部按钮
   */
  function bindBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    // 显示/隐藏按钮
    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });

    // 点击回到顶部
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
