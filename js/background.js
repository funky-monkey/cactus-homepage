/**
 * Background script for the Cactus Homepage extension
 * This script runs in the background and handles events not tied to the new tab page
 */

// Listen for installation
// Replace the installation part in background.js
chrome.runtime.onInstalled.addListener(function(details) {
  if (details.reason === 'install') {
    // Set up default settings on first install
    const defaultSettings = {
      name: '',
      backgroundCategory: 'nature',
      columnNames: ['Quick Links', 'Work', 'Personal', 'Social', 'Shopping', 'Entertainment', 'Tools', 'Google'],
      rowCount: 1,
      disableBackground: false,
      showGreeting: true,
      hasSeenWelcome: false
    };
    
    // Fetch default links from the bundled JSON file
    fetch(chrome.runtime.getURL('default-links.json'))
      .then(response => response.json())
      .then(defaultLinks => {
        // Use storage API to save defaults
        chrome.storage.local.set({
          'settings': defaultSettings,
          'links': defaultLinks
        }, function() {
          console.log('Default settings and links installed');
        });
      })
      .catch(error => {
        console.error('Error loading default links:', error);
        // Fallback to hardcoded links if JSON fetch fails
        const fallbackLinks = [
          {
            title: "Google",
            url: "https://www.google.com",
            row: "1",
            column: "1"
          },
          {
            title: "YouTube",
            url: "https://www.youtube.com",
            row: "1",
            column: "1"
          },
          // Add a few more fallback links here
        ];
        
        chrome.storage.local.set({
          'settings': defaultSettings,
          'links': fallbackLinks
        }, function() {
          console.log('Default settings and fallback links installed');
        });
      });
  }
});
  
  // Listen for messages from the new tab page
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Handle any messages here if needed in the future
    sendResponse({ status: 'success' });
    return true;
  });

  // Process i18n placeholders in the HTML
function processI18nMessages() {
    const elements = document.querySelectorAll('[placeholder*="__MSG_"], [title*="__MSG_"]');
    elements.forEach(element => {
      for (const attr of ['placeholder', 'title']) {
        if (element.hasAttribute(attr)) {
          const attrValue = element.getAttribute(attr);
          if (attrValue.includes('__MSG_')) {
            const messageName = attrValue.match(/__MSG_(\w+)__/)[1];
            element.setAttribute(attr, chrome.i18n.getMessage(messageName));
          }
        }
      }
    });
    
    // Process text content
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.includes('__MSG_')) {
        node.nodeValue = node.nodeValue.replace(
          /__MSG_(\w+)__/g,
          (match, messageName) => chrome.i18n.getMessage(messageName)
        );
      }
    }
  }
  
  // Add this to your initialization function in newtab.js
  document.addEventListener('DOMContentLoaded', () => {
    processI18nMessages();
    // Other initialization code...
  });

  // Listen for clicks on the toolbar button
chrome.action.onClicked.addListener(function(tab) {
  // Send a message to the active tab to open the settings modal
  chrome.tabs.sendMessage(tab.id, { action: "open_settings" });
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "reopen_popup") {
    // This doesn't directly reopen the popup, but it causes some browser activity
    // that often results in the popup reopening if it was just closed
    console.log("Popup file selection completed");
    
    // You can optionally try to notify the user through other means
    // For example, a notification (requires notification permission)
    /*
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Logo Selected',
      message: 'Your logo has been selected. Please click the extension icon again to continue.'
    });
    */
  }
  
  sendResponse({ status: 'success' });
  return true;
});
