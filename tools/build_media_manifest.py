#!/usr/bin/env python3
"""扫描 images/ 下的媒体目录，生成 media.json。

页面是纯静态的，浏览器没办法列出一个目录里有什么文件 —— 所以需要一份清单。
这个脚本由 .github/workflows/media-manifest.yml 在每次 push 后自动跑，
把目录内容写成清单提交回仓库。作者只要把文件放进目录再推上去，页面就会显示。

约定：
  images/news/<公告id>.<ext>   一条公告一张头图，文件名就是公告 id
  images/gallery/<文件>         实机截图与短视频，按文件名排序
  images/gallery/captions.json  可选，{"文件名": {"zh": "...", "en": "..."}}
"""
import json
import os
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE_EXT = {'.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'}
VIDEO_EXT = {'.mp4', '.webm'}


def entries(rel_dir):
    """目录里的媒体文件，按文件名排序；目录不存在时返回空列表。"""
    path = os.path.join(ROOT, rel_dir)
    if not os.path.isdir(path):
        return []
    out = []
    for name in sorted(os.listdir(path)):
        if name.startswith('.'):
            continue
        stem, ext = os.path.splitext(name)
        ext = ext.lower()
        if ext in IMAGE_EXT:
            kind = 'image'
        elif ext in VIDEO_EXT:
            kind = 'video'
        else:
            continue          # captions.json、README 之类一律跳过
        out.append({'src': rel_dir + '/' + name, 'name': stem, 'type': kind})

    # 同一个 stem 出现两次（demo-v01.jpg 和 demo-v01.webp）时，后者会悄悄顶掉前者。
    # 公告头图按 stem 索引，所以这种重复必须说出来，否则作者换图后看到的还是旧的。
    seen = {}
    for item in out:
        seen.setdefault(item['name'], []).append(os.path.basename(item['src']))
    for stem, names in seen.items():
        if len(names) > 1:
            print('WARN: %s/ 下有同名文件 %s —— 只有排在最后的那个会生效' % (rel_dir, ', '.join(names)))
    return out


def captions(rel_dir):
    path = os.path.join(ROOT, rel_dir, 'captions.json')
    if not os.path.isfile(path):
        return {}
    try:
        with open(path, encoding='utf-8') as fh:
            data = json.load(fh)
    except (OSError, ValueError):
        # 说明比静默生成一份缺字幕的清单有用，但不该让整个构建失败
        print('WARN: %s 不是合法的 JSON，本次忽略字幕' % path)
        return {}
    return data if isinstance(data, dict) else {}


def main():
    gallery = entries('images/gallery')
    caps = captions('images/gallery')
    for item in gallery:
        cap = caps.get(os.path.basename(item['src']))
        if isinstance(cap, dict):
            item['cap'] = {'zh': cap.get('zh', ''), 'en': cap.get('en', '')}
        elif isinstance(cap, str):
            item['cap'] = {'zh': cap, 'en': cap}

    # 公告头图按 id 索引：images/news/demo-v01.jpg → news["demo-v01"]
    news = {item['name']: item['src'] for item in entries('images/news')}

    manifest = {
        'generated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'gallery': gallery,
        'news': news,
    }
    out = os.path.join(ROOT, 'media.json')
    with open(out, 'w', encoding='utf-8') as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)
        fh.write('\n')
    print('media.json: %d gallery, %d news header(s)' % (len(gallery), len(news)))


if __name__ == '__main__':
    main()
