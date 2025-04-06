# Personal New Tab Extension - Deployment Guide

This guide will help you build and install your custom new tab extension for both Chrome and Firefox browsers.

## Prerequisites

- Basic knowledge of HTML, CSS, and JavaScript
- A text editor (VS Code, Sublime Text, etc.)
- Chrome or Firefox browser

## Project Setup

1. Create a new folder named `personal-new-tab` for your extension
2. Create the following folder structure:
   ```
   personal-new-tab/
   ├── manifest.json
   ├── newtab.html
   ├── css/
   │   └── styles.css
   ├── js/
   │   ├── newtab.js
   │   ├── background.js
   │   └── storage.js
   └── icons/
   ```
3. Copy all the code files provided into their respective locations

## Creating Icons

You need to create icons for your extension in three sizes: 16x16, 48x48, and 128x128 pixels.

1. You can create simple icons using any image editor
2. Save them as PNG files in the `icons` folder:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

If you don't have an image editor, you can use a free service like [Favicon.io](https://favicon.io/) to generate icons.

## Testing Locally

### Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select your `personal-new-tab` folder
4. Open a new tab to see your extension in action

### Firefox
1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Navigate to your extension folder and select the `manifest.json` file
4. Open a new tab to see your extension in action

## Customizing Your Extension

### Change the Default Background Categories
Edit the `background.js` file to modify the default Unsplash category:

```javascript
const defaultSettings = {
  name: '',
  unsplashCategory: 'nature' // Change this to your preferred category
};
```

Some popular Unsplash categories:
- nature
- architecture
- technology
- animals
- food
- travel
- business
- minimal

You can also use multiple categories separated by commas (e.g., `nature,water,mountains`).

### Modify Default Links
Edit the `sampleLinks` array in `background.js` to change the default links that appear when users first install the extension.

### Change Styling
Customize the appearance by modifying `styles.css`. You can change:
- Colors
- Fonts
- Sizes
- Layouts
- Animations

## Publishing Your Extension

### Chrome Web Store
1. Create a ZIP file of your extension folder
2. Create a developer account at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
3. Pay the one-time developer registration fee ($5 USD)
4. Click "New Item" and upload your ZIP file
5. Fill out all required information (description, screenshots, etc.)
6. Submit for review

### Firefox Add-ons
1. Create a ZIP file of your extension folder
2. Create an account at [Firefox Add-on Developer Hub](https://addons.mozilla.org/en-US/developers/)
3. Submit your add-on by uploading the ZIP file
4. Fill out all required information
5. Submit for review

## Troubleshooting

### Extension Not Loading
- Make sure your `manifest.json` is properly formatted with no syntax errors
- Check browser console for error messages
- Verify that all file paths in your code are correct

### Background Not Loading
- Check that the Unsplash URL is formed correctly
- Try using a different category if the current one isn't working
- Ensure you have an internet connection

### Storage Issues
- Clear browser storage and reinstall the extension
- Check for errors in the console related to storage operations

## Security Best Practices

1. Don't request unnecessary permissions in your manifest
2. Be cautious about storing sensitive information in browser storage
3. Consider using Content Security Policy (CSP) to mitigate XSS risks
4. Keep dependencies up to date
5. Avoid using eval() or innerHTML where possible

## Further Customizations

Here are some ideas for extending your new tab page:
- Add weather information
- Include a to-do list
- Show upcoming calendar events
- Add custom search engines
- Implement themes or dark mode
- Create shortcut keys for common actions
