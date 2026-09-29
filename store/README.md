# Steam store copy

These two files are the localization JSON exported from Steamworks, **kept
exactly as exported**:

```
store/schinese.json
store/english.json
```

The site reads them directly, so **the store page and the website can never say
different things.** To change the copy:

1. Edit it in Steamworks
2. Export both JSON files
3. Overwrite the files here and push

The website follows. There is no second copy to keep in sync by hand.

## Using a field on a page

Add `data-store="<field>"` to an element and `js/store-copy.js` fills it in:

```html
<p data-store="short_description">Fallback text, shown if the JSON can't be read</p>
<div data-store="about">Same</div>
```

The field name is whatever sits inside the brackets of `app[content][...]` in the
JSON — for example `about` or `short_description`.

## Two known things

**Only part of Steam's BBCode is supported.** `[p] [h2] [b] [i] [url]` become
their HTML equivalents. `[img]` is dropped, because it points at Steam's own CDN
(`{STEAM_APP_IMAGE}`), which this site cannot reach — artwork on the site comes
from [`images/`](../images/) instead. Any tag that isn't recognised renders as
plain text rather than being guessed at.

**The fallback copy does not update itself.** If the JSON can't be fetched (for
instance when opening a page over `file://`), the page falls back to the text in
`js/home-lang-*.js` and `js/game-wiki-lang-*.js`. Those were generated from these
JSON files once. After a significant store rewrite, say so and they can be
regenerated.
