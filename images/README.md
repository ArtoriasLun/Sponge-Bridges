# 放图和视频的地方

页面是纯静态的，浏览器没办法自己列出一个目录里有哪些文件。所以这里有一份
`media.json` 清单 —— 它由 GitHub Actions 自动生成，**你不用手写、也不用管它**。

流程就一句话：**把文件放进下面对应的目录，推到 GitHub，页面上就会出现。**

## `images/news/` —— 公告头图

一条公告一张图，**文件名必须是公告的 id**：

```
images/news/demo-v01.jpg      → 显示在「Demo v0.1 — 预计 10 月 1 日发布」这条公告上
```

这张图会同时出现在公告页的文章顶部，和首页「最新公告」板块的卡片里。
没放图也不会出错，页面就是没有头图而已。

**比例随你**：页面不裁图，按原始宽高等比铺满卡片宽度。所以 Steam 那种
1920×622 的长条、或者普通的 16:9，放进去都完整显示，标题不会被切掉。

**一个 id 只放一个文件。** `demo-v01.jpg` 和 `demo-v01.webp` 同时存在的话，
只有排在后面的那个会生效 —— 换图请先删掉旧的。真发生了的话，Actions 的
日志里会有一条 WARN 提醒你。

现有公告的 id：

| id | 公告 |
|---|---|
| `demo-v01` | Sponge Bridges Demo v0.1 — 预计 10 月 1 日发布！ |

## `images/gallery/` —— 实机截图与视频

放进去就会出现在首页的「实机画面」轮播里，**按文件名排序**，所以建议用
`01-`、`02-` 开头来控制顺序：

```
images/gallery/01-cargo-tower.jpg
images/gallery/02-red-mist.png
images/gallery/03-night-delivery.mp4
```

图片支持 `.jpg .jpeg .png .webp .avif .gif`，视频支持 `.mp4 .webm`。
视频会自动循环、静音、内联播放，和截图混在同一个轮播里。

### 图注（可选）

想给某张图配一句说明，就在 `images/gallery/captions.json` 里加一条。
没写的文件不显示图注，整个文件不存在也完全没问题：

```json
{
  "01-cargo-tower.jpg": { "zh": "货塔越叠越高。", "en": "The stack grows." },
  "03-night-delivery.mp4": { "zh": "夜间送货。", "en": "A delivery after dark." }
}
```

## 两件要注意的事

**视频别放太大。** git 仓库不适合装大文件，单文件超过 100MB 会被 GitHub 直接拒绝。
控制在 10MB 以内的短循环片段比较合适；完整的预告片请放 YouTube 或 Steam，
再在页面上贴链接。

**必须推到 GitHub 才会生效。** 只在本机存文件没有用 —— 清单是在 push 之后由
Actions 重新生成的。推上去之后大约一两分钟，页面就会更新。
