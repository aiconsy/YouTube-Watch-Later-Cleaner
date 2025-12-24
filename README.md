# YouTube Watch Later Cleaner

Clean up your YouTube **Watch Later** playlist by removing videos individually or in bulk.

## What’s in this repo

This repository is intentionally lightweight and currently ships a **minimal browser extension** (Chrome/Edge Manifest V3) under `extension/`.

## Features

- **Remove watched videos**: triggers YouTube’s “Remove watched videos” action (when available).
- **Remove all videos**: iterates through playlist items and removes them (best-effort; UI-driven and can be slow).
- **Stop button**: cancels an in-progress bulk operation.

## Install (Chrome / Edge)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension/` folder in this repository.

## Usage

1. Open your Watch Later playlist: `https://www.youtube.com/playlist?list=WL`
2. Click the extension icon.
3. Choose one of:
   - **Remove watched videos**
   - **Remove all videos**

## Limitations / notes

- This tool automates YouTube’s web UI. **YouTube changes can break selectors** at any time.
- Menu item detection currently relies on English text for some actions.
- Bulk removal may require scrolling and can take several minutes for large playlists.

## Development

No build step, no dependencies. Edit files in `extension/` and reload the extension from the extensions page.

## License

MIT — see `LICENSE`.
