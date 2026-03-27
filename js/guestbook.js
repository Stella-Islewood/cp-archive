/**
 * ========================================
 * CP同人档案馆 - 留言板页面脚本
 * ========================================
 */

(function() {
  'use strict';

  // localStorage 键名
  const STORAGE_KEY = 'guestbook-messages';

  // 等待 CPData 加载
  function waitForCPData(callback) {
    if (window.CPData) {
      callback();
    } else {
      setTimeout(() => waitForCPData(callback), 50);
    }
  }

  /**
   * 初始化留言板
   */
  function init() {
    waitForCPData(() => {
      renderNotes();
      bindFormEvents();
      bindBackToTop();

      // 监听主题切换
      window.addEventListener('themechange', function(e) {
        renderNotes();
      });
    });
  }

  /**
   * 获取留言数据
   */
  function getMessages() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getDefaultMessages();
  }

  /**
   * 获取默认留言
   */
  function getDefaultMessages() {
    return [
      {
        id: 'msg-1',
        nickname: '霜月',
        content: '这里的每一张图都让人心动，Lion和Mio的故事真的很美好',
        time: '2026-01-15',
        isOfficial: true
      },
      {
        id: 'msg-2',
        nickname: '星河漫步',
        content: '希望这个站能一直存在下去',
        time: '2026-02-03'
      },
      {
        id: 'msg-3',
        nickname: '光与冰',
        content: '第一次看到就被治愈了，谢谢创作者',
        time: '2026-02-14'
      },
      {
        id: 'msg-4',
        nickname: '夜阑人静',
        content: '配乐真的很配这个主题',
        time: '2026-02-20'
      }
    ];
  }

  /**
   * 保存留言数据
   */
  function saveMessages(messages) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }

  /**
   * 渲染便签墙
   */
  function renderNotes() {
    const container = document.getElementById('notesGrid');
    if (!container) return;

    const messages = getMessages();

    container.innerHTML = messages.map(msg => createNoteHTML(msg)).join('');

    // 绑定删除事件
    container.querySelectorAll('.note-delete').forEach(btn => {
      btn.addEventListener('click', function() {
        const msgId = this.dataset.id;
        deleteMessage(msgId);
      });
    });
  }

  /**
   * 创建便签 HTML
   */
  function createNoteHTML(msg) {
    const theme = document.documentElement.getAttribute('data-theme');
    const pinColor = theme === 'lucasmia' ? '#E890B0' : '#7BA7C4';
    const isOfficial = msg.isOfficial || msg.nickname.toLowerCase().includes('official');

    return `
      <div class="note ${isOfficial ? 'official' : ''}" data-id="${msg.id}">
        <svg class="note-pin" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6" fill="${pinColor}" opacity="0.9"/>
          <circle cx="6" cy="6" r="2" fill="white" opacity="0.3"/>
        </svg>
        <div class="note-nickname">${escapeHtml(msg.nickname)}</div>
        <div class="note-content">${escapeHtml(msg.content)}</div>
        <div class="note-time">${msg.time}</div>
        <button class="note-delete" data-id="${msg.id}" title="删除">×</button>
      </div>
    `;
  }

  /**
   * 添加新留言
   */
  function addMessage(nickname, content) {
    const messages = getMessages();
    const newMsg = {
      id: 'msg-' + Date.now(),
      nickname: nickname,
      content: content,
      time: formatDate(new Date()),
      isOfficial: nickname.toLowerCase().includes('official')
    };

    messages.unshift(newMsg);
    saveMessages(messages);
    renderNotes();
  }

  /**
   * 删除留言
   */
  function deleteMessage(msgId) {
    const note = document.querySelector(`.note[data-id="${msgId}"]`);
    if (!note) return;

    note.classList.add('removing');

    setTimeout(() => {
      const messages = getMessages();
      const filtered = messages.filter(m => m.id !== msgId);
      saveMessages(filtered);
      renderNotes();
    }, 400);
  }

  /**
   * 绑定表单事件
   */
  function bindFormEvents() {
    const form = document.getElementById('messageForm');
    const messageInput = document.getElementById('message');
    const charCount = document.getElementById('charCurrent');

    // 字符计数
    messageInput.addEventListener('input', function() {
      charCount.textContent = this.value.length;
    });

    // 表单提交
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const nickname = document.getElementById('nickname').value.trim();
      const content = messageInput.value.trim();

      if (!nickname || !content) return;

      addMessage(nickname, content);
      form.reset();
      charCount.textContent = '0';
    });
  }

  /**
   * HTML 转义
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 格式化日期
   */
  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
