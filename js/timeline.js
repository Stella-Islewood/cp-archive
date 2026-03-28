/**
 * ========================================
 * CP同人档案馆 - 时间线页面脚本
 * 从 Supabase 读取数据
 * ========================================
 */

(function() {
  'use strict';

  // Supabase 配置
  const SUPABASE_URL = 'https://vbvfrmqwlyitarmnhmyw.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_SB0uqo25MSjOPA4fb8n-eg_bCBiXMzH';
  const dbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // localStorage 键名
  const STORAGE_KEY = 'timeline-likes';
  const COMMENTS_KEY = 'timeline-comments';

  // 缓存的时间线数据
  let cachedTimeline = [];

  /**
   * 初始化时间线功能
   */
  function init() {
    loadTimelineFromSupabase();
    bindRandomEvent();
    bindBackToTop();
    restoreLikes();
    
    // 监听主题切换
    window.addEventListener('themechange', function(e) {
      renderTimeline();
      loadComments();
    });
  }

  /**
   * 从 Supabase 加载时间线数据
   */
  async function loadTimelineFromSupabase() {
    const container = document.getElementById('timeline');
    if (!container) return;

    try {
      const theme = localStorage.getItem('cp-archive-theme') || 'lionmio';
      
      const { data, error } = await dbClient
        .from('timeline')
        .select('*')
        .eq('archive_id', theme)
        .order('date', { ascending: false });

      if (error) throw error;

      cachedTimeline = data || [];
      renderTimeline();
    } catch (error) {
      console.error('加载时间线失败:', error);
      // 如果加载失败，尝试使用空数组
      cachedTimeline = [];
      renderTimeline();
    }
  }

  /**
   * 渲染时间线
   */
  function renderTimeline() {
    const container = document.getElementById('timeline');
    if (!container) return;
    
    // 保存当前点赞和评论状态
    const currentLikes = getCurrentLikes();
    const currentComments = getCurrentComments();
    
    // 清空并重新渲染
    container.innerHTML = '';
    
    if (cachedTimeline.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:#888;padding:40px;">暂无时间线数据</p>';
      return;
    }
    
    cachedTimeline.forEach((item, index) => {
      const article = createTimelineItem(item, index, currentLikes[index], currentComments[index]);
      container.appendChild(article);
      
      // 重新绑定事件
      bindItemEvents(article, index);
      
      // 添加淡入动画
      article.style.opacity = '0';
      article.style.transform = 'translateY(20px)';
      setTimeout(() => {
        article.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        article.style.opacity = '1';
        article.style.transform = 'translateY(0)';
      }, index * 150);
    });
    
    // 恢复点赞状态
    restoreLikes();
  }

  /**
   * 获取当前点赞状态
   */
  function getCurrentLikes() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  /**
   * 获取当前评论状态
   */
  function getCurrentComments() {
    const saved = localStorage.getItem(COMMENTS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  }

  /**
   * 创建时间线项
   * @param {Object} item - 时间线数据
   * @param {number} index - 索引
   * @param {Object} savedLikes - 保存的点赞数据
   * @param {Array} savedComments - 保存的评论数据
   * @returns {HTMLElement}
   */
  function createTimelineItem(item, index, savedLikes, savedComments) {
    const article = document.createElement('article');
    article.className = 'timeline-item';
    article.dataset.index = index;
    
    const displayLikes = savedLikes ? savedLikes.count : 0;
    const isLiked = savedLikes ? savedLikes.liked : false;
    
    article.innerHTML = `
      <div class="timeline-connector">
        <div class="timeline-dot"></div>
      </div>
      <div class="timeline-content card">
        <div class="timeline-header">
          <time class="timeline-date">${item.date}</time>
          <h3 class="timeline-title">${escapeHtml(item.title)}</h3>
        </div>
        <div class="timeline-body">
          <p>${escapeHtml(item.content || '')}</p>
        </div>
        ${item.mood_tag ? `<div class="timeline-mood"><span>${escapeHtml(item.mood_tag)}</span></div>` : ''}
        <div class="timeline-actions">
          <button class="btn-toggle" aria-expanded="false">
            <span class="toggle-text">展开</span>
            <svg class="toggle-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <button class="btn-like ${isLiked ? 'liked' : ''}" data-likes="${displayLikes}">
            <span class="like-icon">${isLiked ? '♥' : '♡'}</span>
            <span class="like-count">${displayLikes}</span>
          </button>
        </div>
        
        <!-- 评论区 -->
        <div class="timeline-comments" id="comments-${index}">
          <div class="comments-list" id="comments-list-${index}">
            <!-- 评论将由JS动态加载 -->
          </div>
          <form class="comment-form" data-index="${index}">
            <div class="comment-input-row">
              <input type="text" class="comment-nickname input-field" placeholder="昵称" maxlength="20" required>
            </div>
            <textarea class="comment-content input-field" placeholder="说点什么..." maxlength="200" required></textarea>
            <button type="submit" class="btn btn-comment">发布</button>
          </form>
        </div>
      </div>
    `;
    
    // 加载评论
    if (savedComments) {
      setTimeout(() => {
        savedComments.forEach(comment => {
          addCommentToDOM(index, comment);
        });
      }, 100);
    }
    
    return article;
  }

  /**
   * 绑定时间线项事件
   * @param {HTMLElement} item - 时间线项元素
   * @param {number} index - 索引
   */
  function bindItemEvents(item, index) {
    // 展开/收起
    const toggleBtn = item.querySelector('.btn-toggle');
    toggleBtn.addEventListener('click', function() {
      const content = item.querySelector('.timeline-content');
      const body = item.querySelector('.timeline-body');
      const toggleText = this.querySelector('.toggle-text');
      const isExpanded = content.classList.contains('expanded');
      
      content.classList.toggle('expanded');
      body.classList.toggle('expanded');
      
      if (isExpanded) {
        toggleText.textContent = '展开';
        this.setAttribute('aria-expanded', 'false');
      } else {
        toggleText.textContent = '收起';
        this.setAttribute('aria-expanded', 'true');
      }
    });

    // 点赞
    const likeBtn = item.querySelector('.btn-like');
    likeBtn.addEventListener('click', function() {
      const countEl = this.querySelector('.like-count');
      const iconEl = this.querySelector('.like-icon');
      let count = parseInt(countEl.textContent);
      
      if (this.classList.contains('liked')) {
        count--;
        this.classList.remove('liked');
        iconEl.textContent = '♡';
      } else {
        count++;
        this.classList.add('liked');
        iconEl.textContent = '♥';
      }
      
      countEl.textContent = count;
      saveLikes();
    });

    // 评论表单
    const commentForm = item.querySelector('.comment-form');
    commentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const nickname = this.querySelector('.comment-nickname').value.trim();
      const content = this.querySelector('.comment-content').value.trim();
      
      if (!nickname || !content) return;
      
      const comment = {
        id: 'comment-' + Date.now(),
        nickname: nickname,
        content: content,
        time: formatDate(new Date()),
        empathize: 0,
        empathizeLiked: false
      };
      
      addCommentToDOM(index, comment);
      saveComments();
      this.reset();
    });
  }

  /**
   * 添加评论到DOM
   * @param {number} timelineIndex - 时间线索引
   * @param {Object} comment - 评论数据
   */
  function addCommentToDOM(timelineIndex, comment) {
    const list = document.getElementById(`comments-list-${timelineIndex}`);
    if (!list) return;
    
    const commentEl = document.createElement('div');
    commentEl.className = 'comment-item';
    commentEl.dataset.id = comment.id;
    
    const initial = comment.nickname.charAt(0).toUpperCase();
    const isEmpathized = comment.empathizeLiked ? 'liked' : '';
    
    commentEl.innerHTML = `
      <div class="comment-avatar">${initial}</div>
      <div class="comment-body">
        <div class="comment-header">
          <span class="comment-nickname">${escapeHtml(comment.nickname)}</span>
          <span class="comment-time">${comment.time}</span>
          <button class="btn-empathize ${isEmpathized}" data-count="${comment.empathize}">
            <span class="empathize-icon">❤</span>
            <span class="empathize-count">${comment.empathize}</span>
          </button>
        </div>
        <p class="comment-text">${escapeHtml(comment.content)}</p>
      </div>
    `;
    
    // 绑定同感点赞
    const empathizeBtn = commentEl.querySelector('.btn-empathize');
    empathizeBtn.addEventListener('click', function() {
      const countEl = this.querySelector('.empathize-count');
      let count = parseInt(countEl.textContent);
      
      if (this.classList.contains('liked')) {
        count--;
        this.classList.remove('liked');
      } else {
        count++;
        this.classList.add('liked');
      }
      
      countEl.textContent = count;
      saveComments();
    });
    
    list.appendChild(commentEl);
  }

  /**
   * 绑定随机记忆事件
   */
  function bindRandomEvent() {
    const randomBtn = document.getElementById('randomMemoryBtn');
    if (!randomBtn) return;

    randomBtn.addEventListener('click', function() {
      const items = document.querySelectorAll('.timeline-item');
      if (items.length === 0) return;

      const randomIndex = Math.floor(Math.random() * items.length);
      const targetItem = items[randomIndex];
      
      const toggleBtn = targetItem.querySelector('.btn-toggle');
      if (toggleBtn) {
        items.forEach(item => {
          const content = item.querySelector('.timeline-content');
          const body = item.querySelector('.timeline-body');
          const text = item.querySelector('.toggle-text');
          if (item !== targetItem) {
            content.classList.remove('expanded');
            body.classList.remove('expanded');
            text.textContent = '展开';
          }
        });

        const content = targetItem.querySelector('.timeline-content');
        const body = targetItem.querySelector('.timeline-body');
        const text = targetItem.querySelector('.toggle-text');
        
        if (content.classList.contains('expanded')) {
          content.classList.remove('expanded');
          body.classList.remove('expanded');
          text.textContent = '展开';
          setTimeout(() => {
            toggleBtn.click();
          }, 100);
        } else {
          toggleBtn.click();
        }
      }

      setTimeout(() => {
        targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetItem.classList.add('target-reached');
        setTimeout(() => {
          targetItem.classList.remove('target-reached');
        }, 1000);
      }, 200);
    });
  }

  /**
   * 保存点赞状态到 localStorage
   */
  function saveLikes() {
    const likes = {};
    document.querySelectorAll('.timeline-item').forEach((item, index) => {
      const likeBtn = item.querySelector('.btn-like');
      likes[index] = {
        count: parseInt(likeBtn.querySelector('.like-count').textContent),
        liked: likeBtn.classList.contains('liked')
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(likes));
  }

  /**
   * 恢复点赞状态
   */
  function restoreLikes() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    
    try {
      const likes = JSON.parse(saved);
      document.querySelectorAll('.timeline-item').forEach((item, index) => {
        const likeBtn = item.querySelector('.btn-like');
        if (likes[index]) {
          if (likes[index].liked) {
            likeBtn.classList.add('liked');
            likeBtn.querySelector('.like-icon').textContent = '♥';
          }
          likeBtn.querySelector('.like-count').textContent = likes[index].count;
        }
      });
    } catch (e) {
      console.warn('无法恢复点赞状态');
    }
  }

  /**
   * 保存评论到 localStorage
   */
  function saveComments() {
    const comments = {};
    document.querySelectorAll('.timeline-item').forEach((item, index) => {
      const commentEls = item.querySelectorAll('.comment-item');
      if (commentEls.length > 0) {
        comments[index] = [];
        commentEls.forEach(el => {
          const empathizeBtn = el.querySelector('.btn-empathize');
          comments[index].push({
            id: el.dataset.id,
            nickname: el.querySelector('.comment-nickname').textContent,
            content: el.querySelector('.comment-text').textContent,
            time: el.querySelector('.comment-time').textContent,
            empathize: parseInt(empathizeBtn.dataset.count) || 0,
            empathizeLiked: empathizeBtn.classList.contains('liked')
          });
        });
      }
    });
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  }

  /**
   * 加载评论
   */
  function loadComments() {
    // 评论在 renderTimeline 中处理
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /**
   * 格式化日期
   */
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * HTML 转义
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
