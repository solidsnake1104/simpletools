# SimpleTools — Landing (minimal scaffold)

This folder contains a small responsive landing page for the SimpleTools suite.

Files created:
- index.html — landing markup
- styles.css — responsive styles and seasonal themes
- script.js — automatic seasonal detection + manual override
- package.json — minimal start script

Preview locally

- Using VS Code Live Server extension: right-click `index.html` → "Open with Live Server".

- Using a quick HTTP server (requires Node):

```bash
npx http-server . -o
```

Notes

- Themes are applied via the `data-theme` attribute on the `html` element.
- Theme selection persists in `localStorage` and defaults to the current season.
