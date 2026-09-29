# Sponge Bridges

Official homepage for **Sponge Bridges**.

Live at: [https://artoriaslun.github.io/Sponge-Bridges/](https://artoriaslun.github.io/Sponge-Bridges/)

## Player feedback

Hit a problem in the game, or have something to suggest? File it here:

| | |
|---|---|
| [🐛 Report a bug](https://github.com/ArtoriasLun/Sponge-Bridges/issues/new?template=bug_report.yml) | Something broke, froze, or crashed |
| [💡 Suggest something](https://github.com/ArtoriasLun/Sponge-Bridges/issues/new?template=suggestion.yml) | A feature, a feel change, or content you'd like |
| [🌐 Text and translation](https://github.com/ArtoriasLun/Sponge-Bridges/issues/new?template=translation.yml) | Typos, awkward wording, text that overflows |
| [📋 Everything filed](https://github.com/ArtoriasLun/Sponge-Bridges/issues) | Search before you write — add to an existing thread if there is one |

Before you post: this tracker is public and anyone can read what you write.
**Keep your email, real name, and anything personal out of it.** If it's private,
use the [support form](https://artoriaslun.github.io/Sponge-Bridges/support.html) instead.

## How the site is put together

Plain static HTML — no build step. Open a file, edit it, push it; GitHub Pages
deploys on its own.

| | |
|---|---|
| `index.html` · `news.html` · `game-wiki.html` · `support.html` | The four pages |
| `js/*-lang-*.js` | Per-page translation dictionaries, keyed by `data-i18n` |
| `js/sparks.js` | The ember particle layer, shared by every page |
| `js/media.js` + `media.json` | Images and video, from [`images/`](images/) |
| `js/store-copy.js` + [`store/`](store/) | Blurbs read straight from the Steam export |

The two folders above have their own README. Read those before adding a
screenshot or changing the store blurb — both are more automatic than they look.
