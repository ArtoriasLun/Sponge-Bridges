# Steam 商店页文案

这两个文件是 Steam 后台**原样导出**的本地化 JSON，没有任何改动：

```
store/schinese.json
store/english.json
```

网站直接读它们来显示简介，所以**商店页和网站永远是同一份文案**。改文案的流程：

1. 在 Steam 后台改
2. 导出这两个 JSON
3. 覆盖掉这里的同名文件，推上去

网页跟着就变了，不用再手动同步一遍中英字典。

## 页面怎么用

给元素加 `data-store="字段名"`，`js/store-copy.js` 会把内容填进去：

```html
<p data-store="short_description">读不到 JSON 时显示的兜底文案</p>
<div data-store="about">同上</div>
```

字段名就是 JSON 里 `app[content][...]` 中括号内的部分，例如 `about`、
`short_description`。

## 两件已知的事

**只认 Steam BBCode 的一个子集。** `[p] [h2] [b] [i] [url]` 会转成对应的 HTML；
`[img]` 指向 Steam 自己的 CDN（`{STEAM_APP_IMAGE}`），本站取不到，会被丢掉 ——
网页上的配图走 `images/` 那一套。不认识的标签原样显示，不会去猜。

**兜底文案不会自动更新。** JSON 万一读不到（比如本地用 `file://` 打开），页面会
退回 `js/game-wiki-lang-*.js` 里的文案。那两份是从这里的 JSON 生成的，但只生成过
一次。商店页文案大改之后，顺手说一声，把兜底也刷一遍。
