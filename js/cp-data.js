/**
 * ========================================
 * CP同人档案馆 - CP数据管理系统
 * 统一管理所有CP相关数据
 * ========================================
 */

window.CPData = {
  // 主题常量
  THEMES: {
    LIONMIO: 'lionmio',
    LUCASMIA: 'lucasmia'
  },

  // CP 配置
  cps: {
    lionmio: {
      id: 'lionmio',
      name: 'LionMio',
      tagline: '冰与光的永恒羁绊',
      heroTitle: { lion: 'Lion', mio: 'Mio' },
      logoInitials: 'LM',
      // 角色数据
      characters: [
        {
          id: 'lion',
          name: 'Lion',
          initial: 'L',
          avatarClass: 'lionmio-avatar',
          traits: ['冷静', '守护', '深邃']
        },
        {
          id: 'mio',
          name: 'Mio',
          initial: 'M',
          avatarClass: 'lucasmia-avatar',
          traits: ['温柔', '细腻', '明亮']
        }
      ],
      // 时间线数据
      timeline: [
        {
          date: '2024.06.15',
          title: '第一次相遇',
          content: '那是一个普通的夏日午后，冰与火在命运的安排下相遇了。',
          likes: 42
        },
        {
          date: '2024.09.21',
          title: '双生契约',
          content: '在那个满月之夜，他们交换了彼此的信物。',
          likes: 128
        },
        {
          date: '2026.03.27',
          title: '档案馆开馆',
          content: '经过漫长的筹备，CP同人档案馆终于正式开馆。',
          likes: 256
        }
      ],
      // 运势签文
      fortunes: [
        { rank: '大吉', text: '今日与TA心灵相通，所思皆同频' },
        { rank: '大吉', text: '共振值爆表，宜重温最爱的名场面' },
        { rank: '大吉', text: '命运之线紧紧相连，今日诸事皆顺' },
        { rank: '吉', text: '今日适合创作关于他们的故事' },
        { rank: '吉', text: '翻开旧存档，会发现被遗忘的感动' },
        { rank: '吉', text: '今日与同好相遇，缘分不浅' },
        { rank: '吉', text: 'TA在某处也想着你所想的事' },
        { rank: '中吉', text: '平静之日，适合细细品味细节' },
        { rank: '中吉', text: '不必心急，他们的故事还很长' },
        { rank: '中吉', text: '今日宜安静陪伴，无需言语' },
        { rank: '中吉', text: '缘分在积累，共鸣在生长' },
        { rank: '小吉', text: '今日缘分稍淡，但羁绊永在' },
        { rank: '小吉', text: '风平浪静，是为了更大的共鸣' },
        { rank: '小吉', text: '今日适合整理收藏，回顾来时路' },
        { rank: '末吉', text: '即使平淡，也是他们故事的一部分' },
        { rank: '末吉', text: '静待时机，最美的相遇从不缺席' },
        { rank: '末吉', text: '今日能量稍弱，听一首他们的歌吧' },
        { rank: '末吉', text: '低潮是序章，高光在后面等着' },
        { rank: '吉', text: '今日适合给喜欢的同人作品点一个赞' },
        { rank: '大吉', text: '羁绊穿越时间，今日尤为闪耀' }
      ]
    },
    lucasmia: {
      id: 'lucasmia',
      name: 'LucasMia',
      tagline: '火与暗的浪漫邂逅',
      heroTitle: { lion: 'Lucas', mio: 'Mia' },
      logoInitials: 'LM',
      // 角色数据
      characters: [
        {
          id: 'lucas',
          name: 'Lucas',
          initial: 'L',
          avatarClass: 'lucasmia-avatar',
          traits: ['热情', '开拓', '温暖']
        },
        {
          id: 'mia',
          name: 'Mia',
          initial: 'M',
          avatarClass: 'lionmio-avatar',
          traits: ['神秘', '守望', '浪漫']
        }
      ],
      // 时间线数据
      timeline: [
        {
          date: '2024.08.22',
          title: '命运的相遇',
          content: '在那个玫瑰盛开的夜晚，两道身影在人群中相遇。',
          likes: 88
        },
        {
          date: '2024.11.11',
          title: '心动时刻',
          content: '不经意的对视，让整个世界都安静了下来。',
          likes: 156
        },
        {
          date: '2026.03.27',
          title: '档案馆开馆',
          content: '我们的小天地终于建成，这里收藏着关于我们的所有回忆。',
          likes: 299
        }
      ],
      // 运势签文
      fortunes: [
        { rank: '大吉', text: '今日与TA心灵相通，所思皆同频' },
        { rank: '大吉', text: '共振值爆表，宜重温最爱的名场面' },
        { rank: '大吉', text: '命运之线紧紧相连，今日诸事皆顺' },
        { rank: '吉', text: '今日适合创作关于他们的故事' },
        { rank: '吉', text: '翻开旧存档，会发现被遗忘的感动' },
        { rank: '吉', text: '今日与同好相遇，缘分不浅' },
        { rank: '吉', text: 'TA在某处也想着你所想的事' },
        { rank: '中吉', text: '平静之日，适合细细品味细节' },
        { rank: '中吉', text: '不必心急，他们的故事还很长' },
        { rank: '中吉', text: '今日宜安静陪伴，无需言语' },
        { rank: '中吉', text: '缘分在积累，共鸣在生长' },
        { rank: '小吉', text: '今日缘分稍淡，但羁绊永在' },
        { rank: '小吉', text: '风平浪静，是为了更大的共鸣' },
        { rank: '小吉', text: '今日适合整理收藏，回顾来时路' },
        { rank: '末吉', text: '即使平淡，也是他们故事的一部分' },
        { rank: '末吉', text: '静待时机，最美的相遇从不缺席' },
        { rank: '末吉', text: '今日能量稍弱，听一首他们的歌吧' },
        { rank: '末吉', text: '低潮是序章，高光在后面等着' },
        { rank: '吉', text: '今日适合给喜欢的同人作品点一个赞' },
        { rank: '大吉', text: '羁绊穿越时间，今日尤为闪耀' }
      ]
    }
  },

  // 今日一言
  dailyQuotes: [
    '他们之间的默契，是世界上最安静的奇迹',
    '每一次回头，都有人在原地等着',
    '羁绊不需要解释，懂的人自然懂',
    '他们的故事还没写完，我们都是见证者',
    '有些相遇，注定要用一生来回味',
    '光与影从不分离，就像他们',
    '再平凡的日子，因为有TA而发光',
    '所有的巧合，都是命运的安排',
    '他们不说的话，藏在每一个眼神里',
    '这里收藏着关于他们的，所有美好'
  ],

  // 获取随机一言
  getRandomQuote: function() {
    const index = Math.floor(Math.random() * this.dailyQuotes.length);
    return this.dailyQuotes[index];
  },

  // 获取当前CP数据
  getCurrentCP: function() {
    const theme = localStorage.getItem('cp-archive-theme') || this.THEMES.LIONMIO;
    return this.cps[theme] || this.cps[this.THEMES.LIONMIO];
  },

  // 获取指定主题的CP数据
  getCPByTheme: function(theme) {
    return this.cps[theme] || this.cps[this.THEMES.LIONMIO];
  }
};
