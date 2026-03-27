/**
 * ========================================
 * CP同人档案馆 - 飘花 Canvas 动画
   跟随主题切换粒子样式
 * ========================================
 */

(function() {
  'use strict';

  // 主题常量
  const THEMES = {
    LIONMIO: 'lionmio',
    LUCASMIA: 'lucasmia'
  };

  // 粒子配置 - 跟随 CSS 变量主题
  const PARTICLE_CONFIG = {
    [THEMES.LIONMIO]: {
      type: 'sakura',
      count: { min: 15, max: 22 },
      color: 'rgba(200, 222, 255, 0.5)',
      size: { min: 10, max: 18 },
      speed: { min: 0.4, max: 0.9 },
      drift: { min: 0.4, max: 1.2 },
      rotation: { min: 0.3, max: 1.5 },
      direction: 'down',
      opacity: { min: 0.35, max: 0.55 }
    },
    [THEMES.LUCASMIA]: {
      type: 'rose',
      count: { min: 12, max: 18 },
      color: 'rgba(212, 120, 154, 0.35)',
      size: { min: 6, max: 12 },
      speed: { min: 0.25, max: 0.6 },
      drift: { min: 0.3, max: 0.8 },
      rotation: { min: 0.2, max: 0.8 },
      direction: 'down',
      opacity: { min: 0.25, max: 0.4 }
    }
  };

  // 粒子类
  class Particle {
    constructor(canvas, config) {
      this.canvas = canvas;
      this.config = config;
      this.reset(true);
    }

    reset(initial = false) {
      const { size, opacity } = this.config;
      
      this.x = Math.random() * this.canvas.width;
      this.y = initial 
        ? Math.random() * this.canvas.height 
        : -Math.random() * 50 - this.size;
      
      this.size = this.randomRange(size.min, size.max);
      this.speedY = this.config.speed.min + Math.random() * (this.config.speed.max - this.config.speed.min);
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.drift = this.randomRange(this.config.drift.min, this.config.drift.max);
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * this.config.rotation.max * 0.02;
      this.opacity = this.randomRange(opacity.min, opacity.max);
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.015 + Math.random() * 0.015;
    }

    randomRange(min, max) {
      return min + Math.random() * (max - min);
    }

    update() {
      // 缓慢下落
      this.y += this.speedY;
      
      // 左右轻微漂移
      this.wobble += this.wobbleSpeed;
      this.x += Math.sin(this.wobble) * this.drift * 0.3 + this.speedX;
      
      // 缓慢旋转
      this.rotation += this.rotationSpeed;

      // 到达底部时重置到顶部
      if (this.y > this.canvas.height + this.size * 2) {
        this.reset();
        this.y = -this.size;
      }

      // 边界左右循环
      if (this.x < -this.size * 2) this.x = this.canvas.width + this.size;
      if (this.x > this.canvas.width + this.size * 2) this.x = -this.size;
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.opacity;

      if (this.config.type === 'sakura') {
        this.drawSakura(ctx);
      } else {
        this.drawRosePetal(ctx);
      }

      ctx.restore();
    }

    // 绘制樱花
    drawSakura(ctx) {
      const s = this.size;
      ctx.fillStyle = this.config.color;
      ctx.beginPath();

      // 五瓣花
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
        const nextAngle = ((i + 0.5) * Math.PI * 2) / 5 - Math.PI / 2;
        
        const outerX = Math.cos(angle) * s;
        const outerY = Math.sin(angle) * s;
        const innerX = Math.cos(nextAngle) * s * 0.35;
        const innerY = Math.sin(nextAngle) * s * 0.35;

        if (i === 0) {
          ctx.moveTo(outerX, outerY);
        } else {
          ctx.lineTo(outerX, outerY);
        }
        ctx.lineTo(innerX, innerY);
      }

      ctx.closePath();
      ctx.fill();
    }

    // 绘制玫瑰花瓣
    drawRosePetal(ctx) {
      const s = this.size;
      ctx.fillStyle = this.config.color;
      ctx.beginPath();

      // 椭圆花瓣形状
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.8, -s * 0.6, s * 0.8, s * 0.4, 0, s);
      ctx.bezierCurveTo(-s * 0.8, s * 0.4, -s * 0.8, -s * 0.6, 0, -s);
      
      ctx.closePath();
      ctx.fill();
    }
  }

  // 主控制器
  class PetalsController {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.particles = [];
      this.animationId = null;
      this.currentTheme = THEMES.LIONMIO;
      this.isReducedMotion = false;

      this.init();
    }

    init() {
      // 检查是否支持 reduced motion
      this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (this.isReducedMotion) {
        console.log('Petals: Reduced motion preferred, animation disabled');
        return;
      }

      // 创建 Canvas
      this.createCanvas();

      // 获取保存的主题
      const savedTheme = localStorage.getItem('cp-archive-theme') || THEMES.LIONMIO;
      this.setTheme(savedTheme);

      // 绑定事件
      this.bindEvents();

      // 开始动画
      this.animate();
    }

    createCanvas() {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'petals-canvas';
      this.canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
      `;
      document.body.appendChild(this.canvas);

      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      if (!this.canvas) return;
      
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      this.canvas.style.width = window.innerWidth + 'px';
      this.canvas.style.height = window.innerHeight + 'px';
      this.ctx.scale(dpr, dpr);
    }

    bindEvents() {
      // 监听主题切换
      window.addEventListener('petalsThemeChange', (e) => {
        this.setTheme(e.detail.theme);
      });

      // 监听 reduced motion 变化
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.isReducedMotion = e.matches;
        if (this.isReducedMotion) {
          this.stop();
        } else {
          this.createParticles();
          this.animate();
        }
      });
    }

    setTheme(theme) {
      this.currentTheme = theme;
      this.createParticles();
    }

    createParticles() {
      this.particles = [];

      if (this.isReducedMotion) return;

      const config = PARTICLE_CONFIG[this.currentTheme];
      const count = Math.floor(config.count.min + Math.random() * (config.count.max - config.count.min));

      for (let i = 0; i < count; i++) {
        this.particles.push(new Particle(this.canvas, config));
      }
    }

    animate() {
      if (this.isReducedMotion) return;
      if (!this.ctx || !this.canvas) return;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 更新和绘制所有粒子
      for (const p of this.particles) {
        p.update();
        p.draw(this.ctx);
      }

      this.animationId = requestAnimationFrame(() => this.animate());
    }

    stop() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  // 初始化
  let controller = null;

  function initPetals() {
    if (controller) return;
    controller = new PetalsController();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPetals);
  } else {
    initPetals();
  }

  // 导出 API
  window.PetalsController = {
    getInstance: () => controller
  };

})();
