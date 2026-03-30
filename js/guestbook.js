/**
 * ========================================
 * CP同人档案馆 - 留言板页面脚本
 * 数据存储到 Supabase 数据库
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
      setTimeout(function() { waitForCPData(callback); }, 50);
    }
  }

  /**
   * 获取当前 archive_id
   */
  function getCurrentArchiveId() {
    return localStorage.getItem('cp-archive-theme') || 'lionmio';
  }

  /**
   * 初始化留言板
   */
  function init() {
    waitForCPData(function() {
      loadNotes();
      bindFormEvents();
      bindBackToTop();

      // 监听主题切换
      window.addEventListener('themechange', function(e) {
        loadNotes();
      });
    });
  }

  /**
   * 从 Supabase 加载留言
   */
  async function loadNotes() {
    var container = document.getElementById('notesGrid');
    if (!container) return;

    // 显示加载状态
    container.innerHTML = '<div class="notes-loading">加载中...</div>';

    try {
      var archiveId = getCurrentArchiveId();

      var result = await guestbookClient
        .from('sticky_notes')
        .select('*')
        .eq('archive_id', archiveId)
        .order('created_at', { ascending: false });

      if (result.error) {
        throw result.error;
      }

      var data = result.data || [];

      // 如果数据库为空，使用默认留言并迁移
      if (data.length === 0) {
        await migrateDefaultMessages(archiveId);
        result = await guestbookClient
          .from('sticky_notes')
          .select('*')
          .eq('archive_id', archiveId)
          .order('created_at', { ascending: false });
        data = result.data || [];
      }

      renderNotes(data);
    } catch (error) {
      console.error('加载留言失败:', error);
      // 降级到 localStorage
      renderNotesFromLocal();
    }
  }

  /**
   * 迁移默认留言到数据库
   */
  async function migrateDefaultMessages(archiveId) {
    var defaultMessages = getDefaultMessages();

    for (var i = 0; i < defaultMessages.length; i++) {
      var msg = defaultMessages[i];
      try {
        await guestbookClient
          .from('sticky_notes')
          .insert([{
            archive_id: archiveId,
            nickname: msg.nickname,
            content: msg.content,
            color: msg.color || '#FFF9C4',
            created_at: msg.time ? new Date(msg.time).toISOString() : new Date().toISOString()
          }]);
      } catch (e) {
        // 忽略插入错误，继续
      }
    }
  }

  /**
   * 从 localStorage 渲染（降级方案）
   */
  function renderNotesFromLocal() {
    var container = document.getElementById('notesGrid');
    if (!container) return;

    var messages = getMessagesFromLocal();
    renderNotes(messages);
  }

  /**
   * 获取 localStorage 中的留言
   */
  function getMessagesFromLocal() {
    var stored = localStorage.getItem(STORAGE_KEY);
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
        color: '#FFF9C4',
        isOfficial: true
      },
      {
        id: 'msg-2',
        nickname: '星河漫步',
        content: '希望这个站能一直存在下去',
        time: '2026-02-03',
        color: '#E3F2FD'
      },
      {
        id: 'msg-3',
        nickname: '光与冰',
        content: '第一次看到就被治愈了，谢谢创作者',
        time: '2026-02-14',
        color: '#FCE4EC'
      },
      {
        id: 'msg-4',
        nickname: '夜阑人静',
        content: '配乐真的很配这个主题',
        time: '2026-02-20',
        color: '#E8F5E9'
      }
    ];
  }

  /**
   * 保存留言到 localStorage（仅作为备份）
   */
  function saveMessagesToLocal(messages) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }

  /**
   * 渲染便签墙
   */
  function renderNotes(messages) {
    var container = document.getElementById('notesGrid');
    if (!container) return;

    // 保存到 localStorage 作为备份
    saveMessagesToLocal(messages);

    if (!messages || messages.length === 0) {
      container.innerHTML = '<div class="notes-empty">还没有留言，快来留下第一句话吧~</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < messages.length; i++) {
      html += createNoteHTML(messages[i]);
    }
    container.innerHTML = html;

    // 添加飞入动画
    setTimeout(function() {
      var notes = container.querySelectorAll('.note');
      for (var j = 0; j < notes.length; j++) {
        notes[j].classList.add('visible');
      }
    }, 50);

    // 绑定删除事件
    var deleteBtns = container.querySelectorAll('.note-delete');
    for (var k = 0; k < deleteBtns.length; k++) {
      deleteBtns[k].addEventListener('click', function() {
        var msgId = this.getAttribute('data-id');
        deleteNote(msgId);
      });
    }
  }

  /**
   * 创建便签 HTML
   */
  function createNoteHTML(msg) {
    var theme = document.documentElement.getAttribute('data-theme');
    var pinColor = theme === 'lucasmia' ? '#E890B0' : '#7BA7C4';
    var isOfficial = msg.isOfficial || (msg.nickname && msg.nickname.toLowerCase().includes('official'));
    var bgColor = msg.color || '#FFF9C4';

    // 随机旋转角度（只在首次渲染时生成）
    var rotation = msg.rotation !== undefined ? msg.rotation : (Math.random() * 6 - 3);

    var officialClass = isOfficial ? ' official' : '';
    var officialBadge = isOfficial ? '<span class="note-official-badge">官方</span>' : '';

    return '<div class="note' + officialClass + '" data-id="' + msg.id + '" style="background:' + bgColor + ';transform:rotate(' + rotation + 'deg);">' +
      '<svg class="note-pin" viewBox="0 0 16 16">' +
      '<circle cx="8" cy="8" r="6" fill="' + pinColor + '" opacity="0.9"/>' +
      '<circle cx="6" cy="6" r="2" fill="white" opacity="0.3"/>' +
      '</svg>' +
      officialBadge +
      '<div class="note-nickname">' + escapeHtml(msg.nickname || '匿名') + '</div>' +
      '<div class="note-content">' + escapeHtml(msg.content || '') + '</div>' +
      '<div class="note-time">' + formatDate(msg.created_at || msg.time) + '</div>' +
      '<button class="note-delete" data-id="' + msg.id + '" title="删除">×</button>' +
      '</div>';
  }

  /**
   * 发布新留言
   */
  async function submitNote(nickname, content) {
    var archiveId = getCurrentArchiveId();
    var color = getRandomColor();

    try {
      var result = await guestbookClient
        .from('sticky_notes')
        .insert([{
          archive_id: archiveId,
          nickname: nickname,
          content: content,
          color: color
        }]);

      if (result.error) {
        throw result.error;
      }

      // 重新加载留言
      await loadNotes();

      return true;
    } catch (error) {
      console.error('发布留言失败:', error);
      throw error;
    }
  }

  /**
   * 删除留言
   */
  async function deleteNote(msgId) {
    var note = document.querySelector('.note[data-id="' + msgId + '"]');
    if (!note) return;

    // 添加删除动画
    note.classList.add('removing');

    setTimeout(async function() {
      try {
        var result = await guestbookClient
          .from('sticky_notes')
          .delete()
          .eq('id', msgId);

        if (result.error) {
          throw result.error;
        }

        // 重新加载留言
        await loadNotes();
      } catch (error) {
        console.error('删除留言失败:', error);
        // 移除动画
        note.classList.remove('removing');
      }
    }, 400);
  }

  /**
   * 获取随机便签颜色
   */
  function getRandomColor() {
    var colors = [
      '#FFF9C4', // 淡黄
      '#E3F2FD', // 淡蓝
      '#FCE4EC', // 淡粉
      '#E8F5E9', // 淡绿
      '#FFF3E0', // 淡橙
      '#F3E5F5', // 淡紫
      '#E0F7FA', // 淡青
      '#FFEBEE'  // 淡红
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * 绑定表单事件
   */
  function bindFormEvents() {
    var form = document.getElementById('messageForm');
    var messageInput = document.getElementById('message');
    var charCount = document.getElementById('charCurrent');
    var submitBtn = form ? form.querySelector('.btn-submit') : null;

    // 字符计数
    if (messageInput) {
      messageInput.addEventListener('input', function() {
        if (charCount) {
          charCount.textContent = this.value.length;
        }
      });
    }

    // 表单提交
    if (form) {
      form.addEventListener('submit', async function(e) {
        e.preventDefault();

        var nickname = document.getElementById('nickname') ? document.getElementById('nickname').value.trim() : '';
        var content = messageInput ? messageInput.value.trim() : '';

        if (!nickname || !content) return;

        // 禁用按钮，显示加载状态
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>发布中...</span>';
        }

        try {
          await submitNote(nickname, content);
          form.reset();
          if (charCount) charCount.textContent = '0';
        } catch (error) {
          alert('发布失败，请重试');
        } finally {
          // 恢复按钮
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>留下印记</span>';
          }
        }
      });
    }
  }

  /**
   * HTML 转义
   */
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 格式化日期
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    var date;
    if (typeof dateStr === 'string') {
      date = new Date(dateStr);
    } else {
      date = dateStr;
    }
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  /**
   * 绑定回到顶部按钮
   */
  function bindBackToTop() {
    var btn = document.getElementById('backToTop');
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
