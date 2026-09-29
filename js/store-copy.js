/* 直接读 Steam 商店页导出的 JSON，把里面的文案渲染到页面上。

   这样商店页和网站永远是同一份文案：你在 Steam 后台改完、重新导出、
   覆盖 store/*.json 推上去，网站跟着变，不用再手动同步一遍中英两份字典。

   用法：给元素加 data-store="<字段>"，例如
     <div data-store="about"></div>              整段「关于这款游戏」
     <p   data-store="short_description"></p>    商店页的一句话简介
   语言跟着 <html lang> 走，切换语言时页面 dispatch 'sb:lang' 即可重渲染。 */
(function(){
  var FILES = {zh: 'store/schinese.json', en: 'store/english.json'};
  var PREFIX = 'app[content]';

  var cache = {};
  function load(l){
    if (!cache[l]) {
      cache[l] = fetch(FILES[l], {cache: 'no-cache'})
        .then(function(r){ return r.ok ? r.json() : {}; })
        .catch(function(){ return {}; });      // file:// 打开时 fetch 会失败，页面照常工作
    }
    return cache[l];
  }

  function lang(){
    return (document.documentElement.lang || 'en').indexOf('zh') === 0 ? 'zh' : 'en';
  }

  function esc(t){
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Steam 用的是 BBCode，不是 HTML。这里只处理商店页实际会出现的那几个标签，
     其余一律当纯文本 —— 与其猜一个不认识的标签该变成什么，不如原样显示。 */
  function bbcode(src){
    var t = esc(String(src));

    // [img src="{STEAM_APP_IMAGE}/..."] 指向的是 Steam CDN 上的资源，本站取不到，直接丢掉
    t = t.replace(/\[img\b[^\]]*\](?:\[\/img\])?/gi, '').replace(/\[\/img\]/gi, '');

    t = t.replace(/\[b\]/gi, '<strong>').replace(/\[\/b\]/gi, '</strong>');
    t = t.replace(/\[i\]/gi, '<em>').replace(/\[\/i\]/gi, '</em>');
    t = t.replace(/\[url=([^\]]+)\]/gi, function(_, href){
      return '<a href="' + href.replace(/"/g, '&quot;') + '" target="_blank" rel="noopener">';
    }).replace(/\[\/url\]/gi, '</a>');

    var out = [];
    // [h2] 是 Steam 的小节标题；本站的 h2 已经是页面级标题，所以降一级成 h3
    var re = /\[(h[1-6])\]([\s\S]*?)\[\/\1\]|\[p\]([\s\S]*?)\[\/p\]/gi;
    var m;
    while ((m = re.exec(t)) !== null) {
      if (m[1]) {
        out.push('<h3>' + m[2].trim() + '</h3>');
      } else {
        // 商店页里大量 [p]\r\n[/p] 是排版用的空行，网页上交给 CSS 间距处理
        var body = m[3].replace(/\r/g, '').trim();
        if (body) out.push('<p>' + body.replace(/\n/g, '<br>') + '</p>');
      }
    }
    // 整段一个 BBCode 标签都没有时，按纯文本段落处理
    if (!out.length) {
      t.split(/\n{2,}/).forEach(function(par){
        par = par.replace(/\r/g, '').trim();
        if (par) out.push('<p>' + par.replace(/\n/g, '<br>') + '</p>');
      });
    }
    return out.join('\n');
  }

  function fill(){
    var nodes = document.querySelectorAll('[data-store]');
    if (!nodes.length) return;
    load(lang()).then(function(data){
      nodes.forEach(function(el){
        var raw = data[PREFIX + '[' + el.getAttribute('data-store') + ']'];
        if (raw == null) return;              // 这个字段没导出：保留页面里原有的兜底文案
        var field = el.getAttribute('data-store');
        el.innerHTML = el.hasAttribute('data-store-plain') ? esc(String(raw)) : bbcode(raw);
        el.setAttribute('data-store-ready', field);
      });
    });
  }

  document.addEventListener('sb:lang', fill);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill);
  else fill();
})();
