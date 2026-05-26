# YouTube Watch Later Cleaner

Clean up your YouTube **Watch Later** playlist — remove watched, old, or all videos with one click. Export before clearing. Multi-language support.

## Features

- **Remove watched videos** — triggers YouTube's built-in "Remove watched" action
- **Remove all videos** — bulk removal with progress, ETA, and rate limiting
- **Remove older than N days** — filter by approximate age (removes from bottom of list)
- **Export playlist data** — saves all video titles and URLs to local storage before clearing
- **Confirm before destructive actions** — "Remove All" requires explicit confirmation
- **Stop button** — cancel an in-progress operation at any time
- **Progress tracking** — real-time count, percentage bar, ETA, and speed
- **Multi-language menu detection** — works with YouTube in EN, DE, FR, ES, IT, NL, JA, KO, RU, PT, and more
- **Resilient selectors** — CSS selector fallbacks for when YouTube changes their DOM
- **Retry with backoff** — exponentially backs off on failures instead of immediately giving up
- **Badge indicator** — extension badge shows ✓ when you're on the Watch Later page
- **Keyboard shortcuts** — Escape to close dialogs/filters
- **Accessible** — ARIA labels, focus-visible outlines, role attributes

## Install (Chrome / Edge / Brave)

1. Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`)
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/` folder

## Usage

1. Navigate to your Watch Later playlist: `https://www.youtube.com/playlist?list=WL`
2. Click the extension icon in the toolbar
3. The popup shows your playlist stats
4. Choose an action:
   - **Remove Watched** — uses YouTube's native "Remove watched videos" menu item
   - **Remove Older Than** — enter days (e.g. 90) to remove older additions
   - **Remove All** — requires confirmation; optionally export first
   - **Export Playlist** — saves all video data to local storage
5. Use the **Stop** button anytime to cancel

## How it works

The extension automates YouTube's web UI — it clicks the same menu buttons you would click manually. This means:

- It works with YouTube's existing permission model (no API key needed)
- It's subject to YouTube's DOM structure, which can change
- Bulk removal is sequential and rate-limited to avoid triggering YouTube's anti-bot measures
- Menu text detection uses regex patterns matching multiple languages

## Configuration

All timing constants and retry settings are in `extension/contentScript.js` at the top of the file in the `CONFIG` object:

```js
const CONFIG = {
  delays: { afterClick: 300, batchPause: 2000, batchSize: 10 },
  retries: { maxAttempts: 3, maxConsecutive: 5, backoffBase: 1000 },
};
```

## Project structure

```
extension/
├── background.js          # Service worker — badge, lifecycle
├── contentScript.js        # Main logic — DOM interaction, removal, export
├── manifest.json          # Manifest V3 config
├── popup.css               # Popup styles (CSS custom properties)
├── popup.html              # Popup UI
├── popup.js                # Popup logic
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Limitations

- **DOM-dependent** — YouTube UI changes may break selectors (fallbacks help)
- **"Remove older than" is approximate** — YouTube doesn't expose add-date in the DOM; removal works from list bottom (oldest)
- **Sequential removal** — videos are removed one at a time to stay within YouTube's rate limits
- **No undo** — removal is permanent. Use **Export** before clearing

## Version history

- **v1.0.0** — Complete rewrite: multi-language, export, age filter, confirmation dialogs, progress with ETA, retry with backoff, MutationObserver, resilient selectors, icons, accessibility
- **v0.1.0** — Initial release: basic remove watched, remove all, stop button

## Development

No build step, no dependencies. Edit files in `extension/` and reload the extension from the extensions page.

## License

MIT — see `LICENSE`.

---

Built with: DeepSeek V4 Pro via Reasonix on May 2026