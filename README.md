# 🧹 YouTube Watch Later Cleaner

A powerful Chrome extension by **AI Consy** that helps you clean up your YouTube "Watch Later" playlist by removing videos individually or in bulk with just one click.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Ready-green.svg)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/aiconsy/YouTube-Watch-Later-Cleaner)

**🌐 Website:** [aiconsy.com](https://aiconsy.com)  
**📦 GitHub:** [github.com/aiconsy](https://github.com/aiconsy)

## ✨ Features

- 🚀 **One-Click Access**: Opens YouTube Watch Later page automatically
- 🧹 **Bulk Removal**: Remove all videos from your Watch Later list with confirmation
- 🎯 **Single Removal**: Remove videos one by one with precision
- ⏹️ **Stop Control**: Halt the cleaning process at any time
- 📊 **Progress Tracking**: Real-time removal count and progress updates
- 🔒 **Safe Operation**: Confirmation dialogs prevent accidental deletions
- 🎨 **Modern UI**: Beautiful, user-friendly interface with AI Consy branding
- ⚡ **Ultra-Fast**: Optimized for speed with intelligent rate limiting

## 🚀 Quick Start

### Method 1: Load as Unpacked Extension (Recommended for Development)

1. **Clone the Repository**
   ```bash
   git clone https://github.com/aiconsy/YouTube-Watch-Later-Cleaner.git
   cd YouTube-Watch-Later-Cleaner
   ```

2. **Generate Icons** (Required)
   - Open `tools/create_icons.html` in your browser
   - Click "Download All Icons" to get the required icon files
   - Place the downloaded icons in the root directory

3. **Load in Chrome**
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the extension folder

4. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome toolbar
   - Find "YouTube Watch Later Cleaner" and click the pin icon

### Method 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store for easy installation.

## 📖 Usage Guide

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

## 🔧 How It Works

The extension uses Chrome's content script API to:

1. **Detect the Watch Later Page**: Automatically recognizes when you're on your YouTube Watch Later playlist
2. **Find Video Elements**: Locates video entries in the playlist using YouTube's DOM structure
3. **Simulate User Actions**: Clicks the menu button (⋮) for each video
4. **Select Remove Option**: Finds and clicks the "Remove from Watch later" option
5. **Progress Tracking**: Provides real-time feedback on the cleaning process
6. **Rate Limiting**: Adds intelligent delays to avoid overwhelming YouTube's servers

## 🛡️ Safety Features

- ✅ **Confirmation Dialogs**: Asks for confirmation before bulk operations
- ✅ **Page Validation**: Only works on the actual Watch Later page
- ✅ **Stop Control**: Ability to halt the process at any time
- ✅ **Error Handling**: Graceful handling of network issues or page changes
- ✅ **Rate Limiting**: Adds delays between removals to avoid server overload
- ✅ **Progress Feedback**: Real-time updates on removal progress

## 🐛 Troubleshooting

### Extension Not Working?
1. **Check the Page**: Make sure you're on `youtube.com/playlist?list=WL`
2. **Refresh the Page**: Sometimes YouTube's dynamic loading needs a refresh
3. **Check Permissions**: Ensure the extension has permission to access YouTube
4. **Reload Extension**: Go to `chrome://extensions/` and click the reload button

### Videos Not Being Removed?
1. **Slow Internet**: The extension adds delays, but slow connections might need more time
2. **YouTube Updates**: YouTube occasionally changes their interface; the extension may need updates
3. **Ad Blockers**: Some ad blockers might interfere with the extension
4. **Page Not Fully Loaded**: Wait for the page to completely load before using the extension

### Error Messages?
- **"Please navigate to your YouTube Watch Later playlist first"**: You're not on the correct page
- **"No videos found to remove"**: Your Watch Later list is already empty
- **"Could not find menu button"**: YouTube's interface may have changed

## 📁 Project Structure

```
YouTube-Watch-Later-Cleaner/
├── manifest.json              # Extension configuration
├── src/
│   ├── popup.html            # Extension popup interface
│   ├── popup.css             # Popup styles
│   ├── popup.js              # Popup logic and user interactions
│   └── content.js            # Content script for YouTube interaction
├── docs/
│   ├── FINAL_PACKAGE.md      # Complete package documentation
│   ├── PRIVACY_POLICY.md     # Privacy policy
│   └── SECURITY_REVIEW.md    # Security analysis
├── tools/
│   └── create_icons.html     # Icon generator tool
├── tools/
│   └── create_icons.html     # Professional icon generator
├── package.json              # Project metadata
├── README.md                 # This file
└── LICENSE                   # MIT License
```

## 🔒 Privacy & Security

This extension:
- ✅ **Only works on YouTube**: No access to other websites
- ✅ **No data collection**: Doesn't store or transmit any personal data
- ✅ **Local operation**: All processing happens locally in your browser
- ✅ **No external servers**: Doesn't communicate with any external services
- ✅ **Content Security Policy**: Prevents code injection attacks
- ✅ **Minimal permissions**: Only YouTube access required

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs**: Open an issue on [GitHub](https://github.com/aiconsy/YouTube-Watch-Later-Cleaner/issues)
2. **Suggest Features**: Share your ideas for improvements
3. **Submit Pull Requests**: Contribute code improvements
4. **Improve Documentation**: Help make the docs better
5. **Star the Repository**: Show your support! ⭐

### Development Setup
```bash
git clone https://github.com/aiconsy/YouTube-Watch-Later-Cleaner.git
cd YouTube-Watch-Later-Cleaner
# Generate icons using tools/create_icons.html
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **YouTube**: For providing the platform
- **Chrome Extensions API**: For the powerful extension framework
- **AI Consy Community**: For feedback and support

## 📞 Support & Contact

- **🌐 Website**: [aiconsy.com](https://aiconsy.com)
- **📧 Email**: [contact@aiconsy.com](mailto:contact@aiconsy.com)
- **🐛 Issues**: [GitHub Issues](https://github.com/aiconsy/YouTube-Watch-Later-Cleaner/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/aiconsy/YouTube-Watch-Later-Cleaner/discussions)

## ⚠️ Disclaimer

This extension is not affiliated with YouTube or Google. Use at your own discretion. The extension simulates user interactions with YouTube's interface, which may change over time requiring updates to the extension.

---

**Happy cleaning! 🧹✨**

Made with ❤️ by [AI Consy](https://aiconsy.com) 
