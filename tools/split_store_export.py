#!/usr/bin/env python3
"""把 Steam 导出的合并版商店页 JSON 拆成站点实际使用的那几种语言。

Steam 现在导出的是一个文件、三十种语言、约 140KB。网站只用中英两种，
让每个访客下载三十种语言的文案是浪费，所以这里拆出需要的，
页面只 fetch 拆出来的小文件。

输入  store/storepage.json       原样导出，不要手改
输出  store/schinese.json        {"language": ..., 以及扁平的 app[content][...] 键}
      store/english.json

由 .github/workflows/media-manifest.yml 在 store/ 变动后自动运行。
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, 'store', 'storepage.json')
WANTED = ['schinese', 'english']          # 站点支持的语言，加语言时改这里


def main():
    if not os.path.isfile(SOURCE):
        print('no store/storepage.json — nothing to split')
        return
    with open(SOURCE, encoding='utf-8') as fh:
        data = json.load(fh)

    langs = data.get('languages')
    if not isinstance(langs, dict):
        # 旧版导出是「一个语言一个文件」，那种格式不需要拆
        print('store/storepage.json has no "languages" map — leaving it alone')
        return

    for code in WANTED:
        block = langs.get(code)
        if not isinstance(block, dict):
            # 缺语言就跳过，保留上一次拆出来的文件，总好过写一个空壳上线
            print('WARN: %s missing from the export, keeping the existing file' % code)
            continue
        out = {'itemid': data.get('itemid', ''), 'language': code}
        out.update(block)
        path = os.path.join(ROOT, 'store', code + '.json')
        with open(path, 'w', encoding='utf-8') as fh:
            json.dump(out, fh, ensure_ascii=False, indent=1)
            fh.write('\n')
        print('%s.json: %d fields' % (code, len(block)))


if __name__ == '__main__':
    main()
