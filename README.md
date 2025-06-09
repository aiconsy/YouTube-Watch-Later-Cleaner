# YouTube Watch Later Cleaner

A Chrome extension by **AI Consy** that helps you clean up your YouTube "Watch Later" playlist by removing videos individually or in bulk.

**Website:** [aiconsy.com](https://aiconsy.com)  
**GitHub:** [github.com/aiconsy](https://github.com/aiconsy)

## Features

- 🧹 **Bulk Removal**: Remove all videos from your Watch Later list with one click
- 🎯 **Single Removal**: Remove videos one by one with confirmation
- ⏹️ **Stop Control**: Stop the cleaning process at any time
- 📊 **Progress Tracking**: See real-time progress during bulk removal
- 🔒 **Safe Operation**: Confirmation prompts to prevent accidental deletions
- 🎨 **Modern UI**: Beautiful, user-friendly interface

## Installation

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. **Download the Extension**
   - Clone or download this repository to your computer
   - Extract the files to a folder (e.g., `youtube-watch-later-cleaner`)

2. **Open Chrome Extensions Page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing the extension files
   - The extension should now appear in your extensions list

5. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in the Chrome toolbar
   - Find "YouTube Watch Later Cleaner" and click the pin icon

## Usage

### Step 1: Navigate to Your Watch Later Playlist
1. Go to [YouTube](https://www.youtube.com)
2. Click on your profile picture → "Your channel" → "Playlists"
3. Or directly visit: `https://www.youtube.com/playlist?list=WL`

### Step 2: Open the Extension
1. Click the extension icon in your Chrome toolbar
2. The extension will automatically detect if you're on the correct page

### Step 3: Choose Your Cleaning Method

#### Option A: Remove All Videos (Bulk)
1. Click "Remove All Videos"
2. Confirm the action in the popup dialog
3. Watch as the extension removes videos automatically
4. Use "Stop Cleaning" if you want to halt the process

#### Option B: Remove One Video at a Time
1. Click "Remove Next Video"
2. The extension will remove the first video in your list
3. Repeat as needed

## How It Works

The extension uses Chrome's content script API to:

1. **Detect the Watch Later Page**: Automatically recognizes when you're on your YouTube Watch Later playlist
2. **Find Video Elements**: Locates video entries in the playlist
3. **Simulate User Actions**: Clicks the menu button (⋮) for each video
4. **Select Remove Option**: Finds and clicks the "Remove from Watch later" option
5. **Progress Tracking**: Provides real-time feedback on the cleaning process

## Safety Features

- ✅ **Confirmation Dialogs**: Asks for confirmation before bulk operations
- ✅ **Page Validation**: Only works on the actual Watch Later page
- ✅ **Stop Control**: Ability to halt the process at any time
- ✅ **Error Handling**: Graceful handling of network issues or page changes
- ✅ **Rate Limiting**: Adds delays between removals to avoid overwhelming YouTube's servers

## Troubleshooting

### Extension Not Working?
1. **Check the Page**: Make sure you're on `youtube.com/playlist?list=WL`
2. **Refresh the Page**: Sometimes YouTube's dynamic loading needs a refresh
3. **Check Permissions**: Ensure the extension has permission to access YouTube
4. **Reload Extension**: Go to `chrome://extensions/` and click the reload button

### Videos Not Being Removed?
1. **Slow Internet**: The extension adds delays, but slow connections might need more time
2. **YouTube Updates**: YouTube occasionally changes their interface; the extension may need updates
3. **Ad Blockers**: Some ad blockers might interfere with the extension

### Error Messages?
- **"Please navigate to your YouTube Watch Later playlist first"**: You're not on the correct page
- **"No videos found to remove"**: Your Watch Later list is already empty
- **"Could not find menu button"**: YouTube's interface may have changed

## Technical Details

### Files Structure
```
youtube-watch-later-cleaner/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.js              # Popup logic and user interactions
├── content.js            # Content script for YouTube interaction
├── README.md             # This file
└── icons/                # Extension icons (optional)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Permissions Used
- `activeTab`: Access to the current active tab
- `scripting`: Ability to inject scripts into web pages
- `*://www.youtube.com/*`: Access to YouTube pages

## Privacy

This extension:
- ✅ **Only works on YouTube**: No access to other websites
- ✅ **No data collection**: Doesn't store or transmit any personal data
- ✅ **Local operation**: All processing happens locally in your browser
- ✅ **No external servers**: Doesn't communicate with any external services

## Contributing

Feel free to contribute to this project by:
1. Reporting bugs or issues on [GitHub](https://github.com/aiconsy)
2. Suggesting new features
3. Submitting pull requests
4. Improving documentation

Visit [aiconsy.com](https://aiconsy.com) for more AI-powered tools!

## License

This project is open source and available under the MIT License.

## Disclaimer

This extension is not affiliated with YouTube or Google. Use at your own discretion. The extension simulates user interactions with YouTube's interface, which may change over time requiring updates to the extension.

---

**Happy cleaning! 🧹✨** 
