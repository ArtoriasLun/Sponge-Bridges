/* 全站火星层：浮力 + 湍流 + 生命周期，鼠标搅动热气流。
   自行注入 canvas 与样式，页面只需引一行 <script src="js/sparks.js"></script>。
   层级约定：canvas 固定在 z-index:3，各页把正文容器提到 z-index:4 以上即可。 */
(function(){
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var st = document.createElement('style');
  st.textContent =
    '.sparks{position:fixed; inset:0; width:100%; height:100%; z-index:3;' +
    ' pointer-events:none; opacity:0; transition:opacity 1.6s ease .4s}' +
    '.sparks.on{opacity:1}' +
    '@media (prefers-reduced-motion: reduce){.sparks{display:none}}';
  document.head.appendChild(st);

  var cv = document.createElement('canvas');
  cv.className = 'sparks';
  cv.setAttribute('aria-hidden', 'true');
  if (!cv.getContext) return;

  var ctx = cv.getContext('2d');
  var W = 0, H = 0, ps = [], raf = 0, last = 0;

  var MOUSE_R = 165, MOUSE_R2 = MOUSE_R * MOUSE_R;
  var PUSH = 0.62, SWIRL = 0.40;                    // 鼠标推开 / 卷动强度
  var mx = -9999, my = -9999, mWant = 0, mNow = 0;

  // 余烬色阶：白热 → 橙 → 站点火色 → 暗红。预渲染成精灵，避免每帧建渐变。
  // 实心核 + 短促衰减：小颗粒配柔和渐变会直接看不见，要"小而实"才既细又不糊
  var RAMP = ['255,242,214', '255,186,94', '217,154,78', '178,74,36'];
  var SPR = RAMP.map(function(rgb){
    var s = 48, c = document.createElement('canvas'); c.width = c.height = s;
    var g = c.getContext('2d');
    var gr = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    gr.addColorStop(0,    'rgba(' + rgb + ',1)');
    gr.addColorStop(0.32, 'rgba(' + rgb + ',.92)');
    gr.addColorStop(0.58, 'rgba(' + rgb + ',.22)');
    gr.addColorStop(1,    'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return c;
  });

  function measure(){
    W = window.innerWidth; H = window.innerHeight;
    if (!W || !H) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width  = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  }

  // scatter=true 用于首帧：让画面一开始就有分布，而不是从底部空升
  function reset(p, scatter){
    var bias = (Math.random() + Math.random()) / 2;          // 向中间聚拢
    p.x  = W * (0.08 + bias * 0.84) + (Math.random() - 0.5) * 90;
    // 从画面下半部整段生成，而不只是底边：余烬来不及爬到中段就烧尽，
    // 只从底边升会让画面一直头重脚轻
    p.y  = scatter ? Math.random() * H : H * 0.40 + Math.random() * (H * 0.64);
    p.vx = (Math.random() - 0.5) * 0.30;
    p.vy = -(0.18 + Math.random() * 0.42);
    p.max = 6000 + Math.random() * 7000;                     // 寿命 ms
    p.life = scatter ? Math.random() * p.max : 0;
    p.r   = 0.5 + Math.random() * 1.25;
    p.hot = 0.55 + Math.random() * 0.45;
    p.sd  = Math.random() * 6.283;
    p.fl  = 0;                                               // 被扇动后的助燃值
  }

  function build(){
    var n = W < 700 ? 70 : (W < 1200 ? 125 : 170);
    ps.length = 0;
    for (var i = 0; i < n; i++){ var p = {}; reset(p, true); ps.push(p); }
  }

  function step(dt, ms, t){
    for (var i = 0; i < ps.length; i++){
      var p = ps[i];
      var age = p.life / p.max;

      // 浮力：越热升得越快，冷却后逐渐失去上升力
      p.vy -= (0.012 + 0.020 * p.hot) * (1 - age * 0.65) * dt;

      // 湍流：两个正弦叠出连贯的涡流场，比随机抖动更像热气流
      var a = Math.sin(p.x * 0.0062 + t * 0.00034) + Math.sin(p.y * 0.0089 - t * 0.00026) + p.sd * 0.16;
      p.vx += Math.cos(a * 3.1) * 0.021 * dt;
      p.vy += Math.sin(a * 3.1) * 0.011 * dt;

      // 鼠标搅动热气流：推开 + 切向卷动 + 扇风助燃
      if (mNow > 0.01){
        var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_R2 && d2 > 1){
          var d = Math.sqrt(d2), f = 1 - d / MOUSE_R;
          f = f * f * mNow;
          var ix = dx / d, iy = dy / d;
          p.vx += ( ix * PUSH - iy * SWIRL) * f * dt;
          p.vy += ( iy * PUSH + ix * SWIRL) * f * dt;
          if (f > p.fl) p.fl = f;
        }
      }
      p.fl *= Math.pow(0.95, dt);

      var drag = Math.pow(0.986, dt);
      p.vx *= drag; p.vy *= drag;
      p.x += p.vx * dt; p.y += p.vy * dt;

      p.life += ms;
      if (p.life >= p.max || p.y < -50 || p.x < -80 || p.x > W + 80) reset(p, false);
    }
  }

  function draw(t){
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';        // 叠加发光，火星交叠处更亮
    for (var i = 0; i < ps.length; i++){
      var p = ps[i], age = p.life / p.max;
      var a = age < 0.10 ? age / 0.10 : 1 - (age - 0.10) / 0.90;
      if (a <= 0) continue;
      a *= 0.72 + 0.28 * Math.sin(t * 0.007 + p.sd);  // 闪烁
      a *= 0.75 + 0.25 * p.fl;                        // 被扇到就变亮
      if (a <= 0.01) continue;

      var heat = p.hot * (1 - age * 0.8) + p.fl * 0.5;
      var tier = heat > 0.72 ? 0 : heat > 0.46 ? 1 : heat > 0.22 ? 2 : 3;
      var r = p.r * (1 + p.fl * 0.8) * 2.4;           // 精灵含透明外圈，需放大绘制
      ctx.globalAlpha = Math.min(1, a);
      ctx.drawImage(SPR[tier], p.x - r, p.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function tick(now){
    raf = requestAnimationFrame(tick);
    if (!last) last = now;
    var ms = now - last; last = now;
    if (ms > 50) ms = 50;                            // 切回标签页时不要瞬移
    var dt = ms / 16.67;
    mNow += (mWant - mNow) * Math.min(1, 0.07 * dt);
    step(dt, ms, now); draw(now);
  }

  function start(){ if (!raf && ps.length){ last = 0; raf = requestAnimationFrame(tick); } }
  function stop(){ if (raf){ cancelAnimationFrame(raf); raf = 0; } }

  function onMove(e){
    var q = e.touches ? e.touches[0] : e;
    mx = q.clientX; my = q.clientY;                  // canvas 固定铺满视口，坐标可直接用
    mWant = 1;
  }

  function init(){
    (document.body || document.documentElement).appendChild(cv);
    if (!measure()) return;
    build();
    cv.classList.add('on');

    window.addEventListener('mousemove', onMove, {passive: true});
    window.addEventListener('touchmove', onMove, {passive: true});
    // 用 documentElement 的 mouseleave 判断"离开窗口"：mouseout + relatedTarget==null
    // 在光标移出 nav 等子元素时也会冒泡上来，会误关掉整个效果。
    document.documentElement.addEventListener('mouseleave', function(){ mWant = 0; });
    window.addEventListener('touchend', function(){ mWant = 0; }, {passive: true});

    var rt = 0;
    window.addEventListener('resize', function(){
      clearTimeout(rt);
      rt = setTimeout(function(){
        var oW = W, oH = H;
        if (!measure()) return;
        for (var i = 0; i < ps.length; i++){
          ps[i].x = ps[i].x / (oW || W) * W;
          ps[i].y = ps[i].y / (oH || H) * H;
        }
      }, 160);
    });

    document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });
    start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
