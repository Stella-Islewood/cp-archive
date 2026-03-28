/**
 * ========================================
 * CP同人档案馆 - 移动端汉堡菜单脚本
 * ========================================
 */

document.addEventListener('DOMContentLoaded', function() {
  var btn = document.getElementById('hamburgerBtn');
  var menu = document.getElementById('mobileMenu');

  if (!btn || !menu) return;

  // 点击汉堡按钮展开/收起菜单
  btn.addEventListener('click', function() {
    menu.classList.toggle('open');
    btn.classList.toggle('active');
  });

  // 点击菜单中的链接后关闭菜单
  var links = menu.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function() {
      menu.classList.remove('open');
      btn.classList.remove('active');
    });
  }

  // ESC 键关闭菜单
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      menu.classList.remove('open');
      btn.classList.remove('active');
    }
  });
});
