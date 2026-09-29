/* 读取 media.json，把 images/ 目录里的东西接到页面上。
   静态站点没法列目录，所以清单由 GitHub Actions 在每次 push 后生成
   （tools/build_media_manifest.py）。这里只负责消费它。

   页面要做的事：
     · 引一行 <script src="js/media.js"></script>
     · 实机画面轮播沿用原有的 #galStage / #galThumbs 等 id，自动接管
     · 需要公告头图的地方放一个 <figure data-news-hero="公告id"></figure>
     · 切换语言时 dispatch 一个 'sb:lang' 事件，图注就会跟着换 */
(function(){
  var EMPTY = {gallery: [], news: {}};

  var ready = fetch('media.json', {cache: 'no-cache'})
    .then(function(r){ return r.ok ? r.json() : EMPTY; })
    .then(function(d){ return d && typeof d === 'object' ? d : EMPTY; })
    // 本地用 file:// 打开时 fetch 会失败，页面应当照常工作，只是没有图
    .catch(function(){ return EMPTY; });

  function lang(){
    return (document.documentElement.lang || 'en').indexOf('zh') === 0 ? 'zh' : 'en';
  }

  function capOf(item){
    if (!item || !item.cap) return '';
    return item.cap[lang()] || item.cap.en || item.cap.zh || '';
  }

  function isVideo(item){ return item && item.type === 'video'; }

  /* ---------- 实机画面轮播 ---------- */
  function initGallery(shots){
    var stage = document.getElementById('galStage');
    if (!stage) return;

    var img = document.getElementById('galImg');
    var placeholder = document.getElementById('galPlaceholder');
    var cap = document.getElementById('galCap');
    var thumbs = document.getElementById('galThumbs');
    var prevBtn = document.getElementById('galPrev');
    var nextBtn = document.getElementById('galNext');
    var idx = 0;

    // 视频和截图混在同一个轮播里，所以舞台上并排放一个 <video>，按需显示
    var vid = document.createElement('video');
    vid.id = 'galVid';
    vid.muted = true; vid.loop = true; vid.playsInline = true;
    vid.setAttribute('muted', '');
    vid.setAttribute('playsinline', '');
    img.insertAdjacentElement('afterend', vid);

    function showPlaceholder(){
      img.classList.remove('loaded'); img.removeAttribute('src');
      vid.classList.remove('loaded'); vid.removeAttribute('src'); vid.load();
      placeholder.style.display = 'flex';
      cap.textContent = '';
    }

    function render(){
      if (!shots.length) return showPlaceholder();
      var shot = shots[idx];
      placeholder.style.display = 'none';

      if (isVideo(shot)) {
        img.classList.remove('loaded'); img.removeAttribute('src');
        vid.classList.remove('loaded');
        vid.onloadeddata = function(){ vid.classList.add('loaded'); };
        vid.onerror = function(){ vid.classList.remove('loaded'); placeholder.style.display = 'flex'; };
        vid.src = shot.src;
        var playing = vid.play();
        if (playing && playing.catch) playing.catch(function(){});  // 自动播放被拦也不要报错
      } else {
        vid.pause();
        vid.classList.remove('loaded'); vid.removeAttribute('src');
        img.classList.remove('loaded');
        img.onload = function(){ img.classList.add('loaded'); };
        img.onerror = function(){ img.classList.remove('loaded'); placeholder.style.display = 'flex'; };
        img.src = shot.src;
      }

      var text = capOf(shot);
      img.alt = isVideo(shot) ? '' : text;
      cap.textContent = text;
      thumbs.querySelectorAll('.thumb').forEach(function(t, i){ t.classList.toggle('active', i === idx); });
    }

    function buildThumbs(){
      thumbs.innerHTML = '';
      shots.forEach(function(shot, i){
        var t = document.createElement('div');
        t.className = 'thumb';
        var el;
        if (isVideo(shot)) {
          el = document.createElement('video');
          el.muted = true; el.playsInline = true; el.preload = 'metadata';
          t.classList.add('isvid');                 // 角上打一个播放标记
        } else {
          el = document.createElement('img');
          el.alt = '';
        }
        el.src = shot.src;
        el.onerror = function(){ t.style.display = 'none'; };
        t.appendChild(el);
        t.addEventListener('click', function(){ idx = i; render(); });
        thumbs.appendChild(t);
      });
    }

    function step(n){
      if (!shots.length) return;
      idx = (idx + n + shots.length) % shots.length;
      render();
    }
    prevBtn.addEventListener('click', function(){ step(-1); });
    nextBtn.addEventListener('click', function(){ step(1); });
    document.addEventListener('sb:lang', function(){
      if (shots.length) cap.textContent = capOf(shots[idx]);
    });

    buildThumbs();
    render();
  }

  /* ---------- 公告头图 ---------- */
  function initNewsHeroes(news){
    document.querySelectorAll('[data-news-hero]').forEach(function(host){
      var src = news[host.getAttribute('data-news-hero')];
      if (!src) return;                    // 还没放图：这个位置就不存在，不留空框
      var im = document.createElement('img');
      im.src = src;
      im.alt = '';
      im.loading = 'lazy';
      im.onerror = function(){ host.removeAttribute('data-ready'); host.innerHTML = ''; };
      host.appendChild(im);
      host.setAttribute('data-ready', '');
    });
  }

  ready.then(function(m){
    initGallery(Array.isArray(m.gallery) ? m.gallery : []);
    initNewsHeroes(m.news && typeof m.news === 'object' ? m.news : {});
  });
})();
