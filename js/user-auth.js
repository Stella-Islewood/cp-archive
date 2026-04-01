/**
 * ========================================
 * CP同人档案馆 - 用户认证模块
 * 统一处理登录状态和 Header 更新
 * ========================================
 */

(function() {
  'use strict';

  // Supabase 配置
  const SUPABASE_URL = 'https://vbvfrmqwlyitarmnhmyw.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_SB0uqo25MSjOPA4fb8n-eg_bCBiXMzH';

  // 创建 Supabase 客户端
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // 当前用户信息
  let currentUser = null;
  let currentProfile = null;

  /**
   * 初始化用户认证状态
   */
  async function initAuth() {
    // 获取当前 session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session && session.user) {
      currentUser = session.user;
      await loadUserProfile();
    } else {
      currentUser = null;
      currentProfile = null;
    }
    
    // 更新 Header 显示
    updateHeaderAuth();
    
    // 监听认证状态变化
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session && session.user) {
        currentUser = session.user;
        loadUserProfile().then(() => {
          updateHeaderAuth();
          // 触发自定义事件通知其他脚本
          window.dispatchEvent(new CustomEvent('userAuthChange', { detail: { isLoggedIn: true, user: currentUser, profile: currentProfile } }));
        });
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        currentProfile = null;
        updateHeaderAuth();
        window.dispatchEvent(new CustomEvent('userAuthChange', { detail: { isLoggedIn: false, user: null, profile: null } }));
      }
    });
  }

  /**
   * 加载用户资料
   */
  async function loadUserProfile() {
    if (!currentUser) {
      currentProfile = null;
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('加载用户资料失败:', error);
      }

      currentProfile = data || null;
    } catch (err) {
      console.error('加载用户资料异常:', err);
      currentProfile = null;
    }
  }

  /**
   * 更新 Header 显示
   */
  function updateHeaderAuth() {
    // 兼容两种 ID：headerAuth 和 header-auth-area
    const headerRight = document.getElementById('headerAuth') || document.querySelector('.header-auth-area') || document.querySelector('.header-auth-placeholder');
    if (!headerRight) return;

    if (currentUser) {
      // 已登录状态
      const username = currentProfile?.username || currentUser.email?.split('@')[0] || '用户';
      const initial = username.charAt(0).toUpperCase();
      const avatarUrl = currentProfile?.avatar_url || '';

      headerRight.innerHTML = `
        <div class="user-auth-dropdown">
          <button class="user-auth-trigger" id="userAuthTrigger" aria-expanded="false" aria-haspopup="true">
            <div class="user-auth-avatar ${avatarUrl ? '' : 'no-avatar'}">
              ${avatarUrl 
                ? `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(username)}">`
                : `<span>${initial}</span>`
              }
            </div>
            <span class="user-auth-name">${escapeHtml(username)}</span>
            <svg class="user-auth-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="user-auth-menu" id="userAuthMenu">
            <a href="profile.html${currentUser ? '?user=' + currentUser.id : ''}" class="user-auth-menu-item">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              个人主页
            </a>
            <a href="publish.html" class="user-auth-menu-item">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"></path>
              </svg>
              发布作品
            </a>
            <div class="user-auth-menu-divider"></div>
            <button class="user-auth-menu-item user-auth-logout" id="logoutBtn">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              退出登录
            </button>
          </div>
        </div>
      `;

      // 绑定下拉菜单事件
      const trigger = document.getElementById('userAuthTrigger');
      const menu = document.getElementById('userAuthMenu');
      const logoutBtn = document.getElementById('logoutBtn');

      if (trigger && menu) {
        trigger.addEventListener('click', function(e) {
          e.stopPropagation();
          const isOpen = menu.classList.contains('open');
          closeAllDropdowns();
          if (!isOpen) {
            menu.classList.add('open');
            trigger.setAttribute('aria-expanded', 'true');
          }
        });

        // 点击外部关闭
        document.addEventListener('click', function(e) {
          if (!menu.contains(e.target) && !trigger.contains(e.target)) {
            menu.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
          }
        });
      }

      // 退出登录
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
          if (confirm('确定要退出登录吗？')) {
            await signOut();
          }
        });
      }

    } else {
      // 未登录状态
      headerRight.innerHTML = `
        <a href="auth.html" class="user-auth-login-btn">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
            <polyline points="10 17 15 12 10 7"></polyline>
            <line x1="15" y1="12" x2="3" y2="12"></line>
          </svg>
          登录
        </a>
      `;
    }
  }

  /**
   * 关闭所有下拉菜单
   */
  function closeAllDropdowns() {
    document.querySelectorAll('.user-auth-menu.open').forEach(menu => {
      menu.classList.remove('open');
    });
    document.querySelectorAll('.user-auth-trigger[aria-expanded="true"]').forEach(trigger => {
      trigger.setAttribute('aria-expanded', 'false');
    });
  }

  /**
   * 注册新用户
   */
  async function signUp(email, password, username) {
    try {
      // 检查用户名是否已被使用
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('username', username)
        .single();

      if (existingUser) {
        return { error: { message: '用户名已被使用' } };
      }

      // 创建用户
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
      });

      if (error) {
        return { error };
      }

      if (data.user) {
        // 创建用户资料
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            username: username,
            created_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('创建用户资料失败:', profileError);
          return { error: profileError };
        }

        return { data };
      }

      return { data };
    } catch (err) {
      console.error('注册异常:', err);
      return { error: { message: '注册失败，请稍后重试' } };
    }
  }

  /**
   * 用户登录
   */
  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      return { data, error };
    } catch (err) {
      console.error('登录异常:', err);
      return { error: { message: '登录失败，请稍后重试' } };
    }
  }

  /**
   * 退出登录
   */
  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('退出登录失败:', error);
        alert('退出失败，请稍后重试');
        return;
      }
      
      // 跳转到首页
      window.location.href = 'index.html';
    } catch (err) {
      console.error('退出登录异常:', err);
      alert('退出失败，请稍后重试');
    }
  }

  /**
   * 检查是否已登录
   */
  function isLoggedIn() {
    return currentUser !== null;
  }

  /**
   * 获取当前用户
   */
  function getCurrentUser() {
    return currentUser;
  }

  /**
   * 获取当前用户资料
   */
  function getCurrentProfile() {
    return currentProfile;
  }

  /**
   * 获取当前用户 ID
   */
  function getCurrentUserId() {
    return currentUser?.id || null;
  }

  /**
   * 刷新用户资料
   */
  async function refreshProfile() {
    await loadUserProfile();
    updateHeaderAuth();
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

  // 导出到全局
  window.UserAuth = {
    init: initAuth,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    isLoggedIn: isLoggedIn,
    getCurrentUser: getCurrentUser,
    getCurrentProfile: getCurrentProfile,
    getCurrentUserId: getCurrentUserId,
    refreshProfile: refreshProfile,
    supabase: supabase
  };

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }

})();
