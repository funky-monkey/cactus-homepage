// DOM elements
const settingsForm = document.getElementById('settings-form');
const statusMessage = document.getElementById('status-message');

// Default settings
let userSettings = {
    name: '',
    columnNames: ['Quick Links', 'Work', 'Personal', 'News', 'Shopping', 'Social', 'Tech', 'Entertainment'],
    rowCount: 1,
    logoData: null,
    disableBackground: false,
    showGreeting: true,
    hasSeenWelcome: false
  };
  
  // Update initPopup function
  async function initPopup() {
    // Load user settings
    await loadSettings();
    
    // Fill form fields with current settings
    document.getElementById('user-name').value = userSettings.name || '';
    document.getElementById('disable-background').checked = userSettings.disableBackground || false;
    document.getElementById('show-greeting').checked = userSettings.showGreeting !== false; // Default to true if not set
    
    // Setup event listeners
    setupEventListeners();
    
    console.log("Settings popup initialized with:", userSettings);
}

// Setup event listeners
function setupEventListeners() {
  // Settings form submission
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveSettings();
  });
}

// Load settings from storage
// Replace or update loadSettings in popup.js
async function loadSettings() {
  try {
      const settings = await storageGet('settings');
      console.log("Loaded settings:", settings);
      
      if (settings) {
          userSettings = {
              ...userSettings,  // Start with defaults
              ...settings       // Override with stored settings
          };
          
          // Ensure column names array exists
          if (!userSettings.columnNames || !Array.isArray(userSettings.columnNames)) {
              userSettings.columnNames = ['Quick Links', 'Work', 'Personal', 'News', 'Shopping', 'Social', 'Tech', 'Entertainment'];
          }
          
          // Ensure row count exists
          if (!userSettings.rowCount || typeof userSettings.rowCount !== 'number') {
              userSettings.rowCount = 1;
          }
      }
      
      // Update the form with the current settings
      document.getElementById('user-name').value = userSettings.name || '';
      document.getElementById('disable-background').checked = userSettings.disableBackground || false;
      document.getElementById('show-greeting').checked = userSettings.showGreeting !== false; // Default to true if not set
      
      console.log("Form updated with settings:", userSettings);
  } catch (error) {
      console.error("Error loading settings:", error);
  }
}

// Save general settings
// Replace the saveSettings function in popup.js with this updated version
async function saveSettings() {
  // Get form values
  const name = document.getElementById('user-name').value.trim();
  const disableBackground = document.getElementById('disable-background').checked;
  const showGreeting = document.getElementById('show-greeting').checked;
  
  // Log values for debugging
  console.log("Saving settings:", {
      name,
      disableBackground,
      showGreeting
  });
  
  // Important: preserve existing settings not in the form
  const currentSettings = await storageGet('settings') || {};
  
  // Update settings object, maintaining any existing properties
  userSettings = {
      ...currentSettings,
      name: name,
      disableBackground: disableBackground,
      showGreeting: showGreeting
  };
  
  // Save settings
  try {
      await storageSet('settings', userSettings);
      showStatus('Settings saved successfully!', 'success');
      
      // Notify open newtab pages
      chrome.tabs.query({url: chrome.runtime.getURL("newtab.html")}, function(tabs) {
          if (tabs && tabs.length > 0) {
              tabs.forEach(tab => {
                  chrome.tabs.sendMessage(tab.id, { action: "settings_updated" });
              });
          }
      });
  } catch (error) {
      showStatus('Error saving settings: ' + error.message, 'error');
      console.error("Error saving settings:", error);
  }
}

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = type;
  statusMessage.style.display = 'block';
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initPopup);