// DOM elements
const greetingElement = document.getElementById('greeting');
const clockElement = document.getElementById('clock');
const linksGrid = document.getElementById('links-grid');
const addLinkButton = document.getElementById('add-link-button');
const addRowButton = document.getElementById('add-row-button');
const manageColumnsButton = document.getElementById('manage-columns-button');
const addLinkModal = document.getElementById('add-link-modal');
const addLinkForm = document.getElementById('add-link-form');
const settingsButton = document.getElementById('settings-button');
const settingsModal = document.getElementById('settings-modal');
const settingsForm = document.getElementById('settings-form');
const manageColumnsModal = document.getElementById('manage-columns-modal');
const manageColumnsForm = document.getElementById('manage-columns-form');
const closeButtons = document.querySelectorAll('.close-button');
const linkRowSelect = document.getElementById('link-row');

// Default settings
let userSettings = {
  name: '',
  unsplashCategory: 'nature',
  columnNames: ['Quick Links', 'Work', 'Personal'],
  rowCount: 1
};

// Localize HTML elements
function localizeHtml() {
  // Process elements with data-i18n attribute (for content)
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = chrome.i18n.getMessage(key);
    if (translation) {
      element.textContent = translation;
    }
  });
  
  // Process elements with data-i18n-placeholder attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    const translation = chrome.i18n.getMessage(key);
    if (translation) {
      element.placeholder = translation;
    }
  });
  
  // Process elements with data-i18n-title attribute
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    const translation = chrome.i18n.getMessage(key);
    if (translation) {
      element.title = translation;
    }
  });
  
  // Process elements with data-i18n-suffix attribute (for labels that need a suffix number)
  document.querySelectorAll('[data-i18n-suffix]').forEach(element => {
    const key = element.getAttribute('data-i18n-suffix');
    const num = element.getAttribute('data-i18n-suffix-num');
    const translation = chrome.i18n.getMessage(key);
    if (translation) {
      element.textContent = translation + ' ' + num;
    }
  });
}

// Initialize the page
async function initPage() {
  // Localize the HTML elements
  localizeHtml();
  
  // Load user settings and links
  await loadSettings();
  await loadLinks();
  
  // Set up greeting, clock, date, and logo
  updateGreeting();
  updateClock();
  updateDate();
  updateLogo();
  // Load random quote
  loadRandomQuote();
  
  // Ensure greeting is visible regardless of setting
  const greetingContainer = document.querySelector('.greeting-container');
  if (greetingContainer) {
    greetingContainer.style.display = 'block';
  }
  
  setInterval(updateClock, 1000);
  
  // Set background image
  setRandomBackground();
  
  // Event listeners
  setupEventListeners();
  
  // Update row selector
  updateRowSelector();
}

// Update the greeting based on time and user settings
function updateGreeting() {
  const hour = new Date().getHours();
  let greetingText = '';
  
  // Get localized greetings or use defaults if not available
  if (hour >= 5 && hour < 12) {
    greetingText = chrome.i18n.getMessage('morningGreeting') || 'Good morning';
  } else if (hour >= 12 && hour < 18) {
    greetingText = chrome.i18n.getMessage('afternoonGreeting') || 'Good afternoon';
  } else {
    greetingText = chrome.i18n.getMessage('eveningGreeting') || 'Good evening';
  }
  
  if (userSettings.name) {
    greetingText += `, ${userSettings.name}`;
  }
  
  greetingElement.textContent = greetingText;
  
  // Show the Firefox-style welcome message for new users
  if (!userSettings.name && !userSettings.hasSeenWelcome) {
    // Set a flag to show this only once
    userSettings.hasSeenWelcome = true;
    storageSet('settings', userSettings);
    
    // Show a more Firefox-like welcome message
    greetingElement.textContent = 'Welcome to your New Tab';
  }
  
  // Make sure greeting is visible
  greetingElement.style.display = 'block';
}

// Update the clock
function updateClock() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  clockElement.textContent = `${hours}:${minutes}`;
}

// Update the setBackgroundImage function
function setRandomBackground() {
  // Set the default Firefox-style background first
  document.body.style.backgroundColor = "#f9f9fb";
  document.body.style.backgroundImage = "none";
  document.body.classList.remove('has-background');
  
  // If user has disabled backgrounds, stop here
  if (userSettings.disableBackground) {
    console.log("Background images disabled by user. Using plain background.");
    return;
  }

  // Get the selected category
  const category = userSettings.backgroundCategory || 'random';
  
  // Get screen dimensions but request a higher resolution for better quality
  const qualityFactor = 1.5;
  const screenWidth = Math.floor(window.innerWidth);
  const screenHeight = Math.floor(window.innerHeight);
  
  // Calculate dimensions for high-res image (but cap at reasonable values)
  const width = Math.min(Math.floor(screenWidth * qualityFactor), 3840); // Cap at 4K width
  const height = Math.min(Math.floor(screenHeight * qualityFactor), 2160); // Cap at 4K height

  // Picsum doesn't have official categories, but we can use predefined collections of image IDs
  // These are manually curated ranges that tend to have images matching the categories
  const categoryRanges = {
    random: { min: 0, max: 1084 }, // All images
    nature: { min: 10, max: 250 },
    architecture: { min: 300, max: 450 },
    animals: { min: 500, max: 650 },
    people: { min: 700, max: 850 },
    technology: { min: 100, max: 200 },
    abstract: { min: 400, max: 500 },
    food: { min: 850, max: 950 }
  };
  
  // Get the appropriate range for the selected category
  const range = categoryRanges[category] || categoryRanges.random;
  
  // Generate a random image ID within the category range
  const imageId = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  
  // Construct the URL with the specific image ID
  const specificUrl = `https://picsum.photos/id/${imageId}/${width}/${height}`;
  
  // For complete randomness, also have a backup random URL
  const randomId = Math.floor(Math.random() * 1000);
  const randomUrl = `https://picsum.photos/${width}/${height}?random=${randomId}`;
  
  console.log(`Loading ${category} background image, ID: ${imageId}`);
  
  // Preload the image
  const img = new Image();
  img.crossOrigin = "anonymous";
  
  img.onload = function() {
    console.log("Background image loaded successfully");
    // Double-check the setting hasn't changed while loading
    if (!userSettings.disableBackground) {
      document.body.style.backgroundImage = `url(${specificUrl})`;
      document.body.classList.add('has-background'); // Add class for overlay
    }
  };
  
  img.onerror = function(e) {
    console.error("Error loading specific image:", e);
    // If specific image fails, try the random URL as fallback
    if (!userSettings.disableBackground) {
      console.log("Trying fallback random image URL");
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = "anonymous";
      
      fallbackImg.onload = function() {
        // Check again before applying background
        if (!userSettings.disableBackground) {
          document.body.style.backgroundImage = `url(${randomUrl})`;
          document.body.classList.add('has-background'); // Add class for overlay
        }
      };
      
      fallbackImg.onerror = function() {
        // Try local images as last resort if backgrounds still enabled
        if (!userSettings.disableBackground) {
          tryFallbackBackground();
        }
      };
      
      fallbackImg.src = randomUrl;
    }
  };
  
  img.src = specificUrl;
}

// Fallback to embedded images or another source
function tryFallbackBackground() {
  // Double-check user hasn't disabled backgrounds
  if (userSettings.disableBackground) {
    return;
  }
  
  // Define category-specific local backgrounds
  const categoryBackgrounds = {
    random: ['bg1.jpg', 'bg2.jpg', 'bg3.jpg', 'bg4.jpg', 'bg5.jpg'],
    nature: ['nature1.jpg', 'nature2.jpg', 'nature3.jpg'],
    architecture: ['architecture1.jpg', 'architecture2.jpg', 'architecture3.jpg'],
    animals: ['animal1.jpg', 'animal2.jpg', 'animal3.jpg'],
    people: ['people1.jpg', 'people2.jpg', 'people3.jpg'],
    technology: ['tech1.jpg', 'tech2.jpg', 'tech3.jpg'],
    abstract: ['abstract1.jpg', 'abstract2.jpg', 'abstract3.jpg'],
    food: ['food1.jpg', 'food2.jpg', 'food3.jpg']
  };
  
  // Get the current category
  const category = userSettings.backgroundCategory || 'random';
  
  // Get the background list for this category, or default to random
  const backgroundList = categoryBackgrounds[category] || categoryBackgrounds.random;
  
  // Choose a random background from the appropriate list
  const randomIndex = Math.floor(Math.random() * backgroundList.length);
  const backgroundFile = backgroundList[randomIndex];
  const backgroundUrl = chrome.runtime.getURL(`backgrounds/${backgroundFile}`);
  
  // Try to load it
  const img = new Image();
  img.onload = function() {
    // Check again before applying the background
    if (!userSettings.disableBackground) {
      document.body.style.backgroundImage = `url(${backgroundUrl})`;
    }
  };
  
  img.onerror = function() {
    // If category-specific images fail, try any random background as last resort
    const fallbackFile = categoryBackgrounds.random[Math.floor(Math.random() * categoryBackgrounds.random.length)];
    const fallbackUrl = chrome.runtime.getURL(`backgrounds/${fallbackFile}`);
    
    const lastImg = new Image();
    lastImg.onload = function() {
      if (!userSettings.disableBackground) {
        document.body.style.backgroundImage = `url(${fallbackUrl})`;
      }
    };
    
    lastImg.onerror = function() {
      // Just use solid color as final fallback
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "#f9f9fb";
    };
    
    lastImg.src = fallbackUrl;
  };
  
  img.src = backgroundUrl;
}

// Alternative method for setting random background from Unsplash
function setRandomBackgroundAlternative() {
  // Set default gray background first
  document.body.style.backgroundColor = "#f9f9fb";
  document.body.style.backgroundImage = "none";
  
  // If user has disabled backgrounds, stop here
  if (userSettings.disableBackground) {
    return;
  }
  
  const category = userSettings.unsplashCategory || 'nature';
  // Use direct image URL format
  const url = `https://source.unsplash.com/featured/?${category}`;
  
  console.log("Loading background image (alternative method) from:", url);
  
  // Preload the image
  const img = new Image();
  img.crossOrigin = "anonymous";
  
  img.onload = function() {
    console.log("Background image loaded successfully");
    document.body.style.backgroundImage = `url(${img.src})`;
  };
  
  img.onerror = function(e) {
    console.error("Error loading background image:", e);
    // Keep the default gray background
    tryUnsplashSource();
  };
  
  img.src = url;
}

// Try another source format for Unsplash
function tryUnsplashSource() {
  const category = userSettings.unsplashCategory || 'nature';
  const collections = '1319040,1320060,1339593'; // Some public collections
  const url = `https://source.unsplash.com/collection/${collections}`;
  
  console.log("Trying collection method:", url);
  
  const img = new Image();
  img.crossOrigin = "anonymous";
  
  img.onload = function() {
    document.body.style.backgroundImage = `url(${img.src})`;
  };
  
  img.onerror = function() {
    // Final fallback - use gray background
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "#f9f9fb";
  };
  
  img.src = url;
}

// Try another source format for Unsplash
function tryUnsplashSource() {
  const category = userSettings.unsplashCategory || 'nature';
  const collections = '1319040,1320060,1339593'; // Some public collections
  const url = `https://source.unsplash.com/collection/${collections}`;
  
  console.log("Trying collection method:", url);
  
  const img = new Image();
  img.crossOrigin = "anonymous";
  
  img.onload = function() {
    document.body.style.backgroundImage = `url(${img.src})`;
  };
  
  img.onerror = function() {
    // Final fallback - use a solid color background
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "#1e3a8a";
  };
  
  img.src = url;
}

// Update the renderLinks function to match Firefox style (8 columns)
// Replace the renderLinks function in newtab.js
async function renderLinks() {
  // Clear existing links - make sure this completely empties the grid
  linksGrid.innerHTML = '';
  
  // Get links from storage
  const links = await storageGet('links') || [];
  
  // Increase columns to 8 to match Firefox style
  const columnsPerRow = 8;
  
  // Create rows based on rowCount setting
  for (let r = 1; r <= userSettings.rowCount; r++) {
    // Create row container
    const rowContainer = document.createElement('div');
    rowContainer.className = 'link-row';
    rowContainer.dataset.row = r;
    
    // Create columns for this row
    for (let c = 1; c <= columnsPerRow; c++) {
      // Create column
      const column = document.createElement('div');
      column.className = 'link-column';
      column.dataset.column = c;
      
      // Add column header with name if column headers are enabled
      const columnHeader = document.createElement('div');
      columnHeader.className = 'column-header';
      
      const columnTitle = document.createElement('span');
      columnTitle.className = 'column-title';
      columnTitle.textContent = userSettings.columnNames[c-1] || `Column ${c}`;
      
      columnHeader.appendChild(columnTitle);
      column.appendChild(columnHeader);
      
      // Add links to this column in this row
      links.forEach((link, index) => {
        // Only add links that belong to this row and column
        if ((parseInt(link.row) || 1) == r && (parseInt(link.column) || 1) == c) {
          const linkElement = createLinkElement(link, index);
          column.appendChild(linkElement);
        }
      });
      
      // Add column to row
      rowContainer.appendChild(column);
    }
    
    // Add row to grid
    linksGrid.appendChild(rowContainer);
  }
  
  // Update row selector in add link modal
  updateRowSelector();
  
  // Log for debugging
  console.log(`Rendered ${userSettings.rowCount} rows with 8 columns each.`);
}

// Replace the createLinkElement function in newtab.js
function createLinkElement(link, index) {
  const linkCard = document.createElement('a');
  linkCard.className = 'link-card';
  linkCard.href = link.url;
  
  // Try to get favicon
  const favicon = document.createElement('img');
  favicon.className = 'link-favicon';
  try {
    const url = new URL(link.url);
    favicon.src = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch (e) {
    favicon.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
  }
  favicon.onerror = () => {
    favicon.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
  };
  
  const title = document.createElement('span');
  title.className = 'link-title';
  title.textContent = link.title;
  
  // Action buttons - making them part of the card
  const actions = document.createElement('div');
  actions.className = 'link-actions';
  
  const editButton = document.createElement('button');
  editButton.className = 'edit-link';
  editButton.innerHTML = '✏️';
  editButton.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openEditLinkModal(index);
  };
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-link';
  deleteButton.innerHTML = '🗑️';
  deleteButton.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    deleteLink(index);
  };
  
  actions.appendChild(editButton);
  actions.appendChild(deleteButton);
  
  // Append elements in proper order
  linkCard.appendChild(favicon);
  linkCard.appendChild(title);
  linkCard.appendChild(actions);
  
  return linkCard;
}

// Setup event listeners
function setupEventListeners() {
  // Logo upload handling
  const logoUpload = document.getElementById('logo-upload');
  const logoPreview = document.getElementById('logo-preview');
  const logoPlaceholder = document.getElementById('logo-placeholder');
  const removeLogoButton = document.getElementById('remove-logo-button');

  if (logoUpload) {
    logoUpload.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        
        reader.onload = function(event) {
          const logoData = event.target.result;
          
          // Update preview
          logoPreview.src = logoData;
          logoPreview.style.display = 'block';
          logoPlaceholder.style.display = 'none';
          
          // Store in settings to be saved later
          userSettings.logoData = logoData;
          
          console.log('Logo loaded and preview updated');
        };
        
        reader.readAsDataURL(file);
      }
    });
  }
  
  if (removeLogoButton) {
    removeLogoButton.addEventListener('click', function() {
      // Clear preview
      logoPreview.src = '';
      logoPreview.style.display = 'none';
      logoPlaceholder.style.display = 'block';
      
      // Remove from settings
      userSettings.logoData = null;
      
      // Clear file input
      const logoUpload = document.getElementById('logo-upload');
      if (logoUpload) {
        logoUpload.value = '';
      }
      
      console.log('Logo removed');
    });
  }

  // Add link button
  addLinkButton.addEventListener('click', () => {
    openAddLinkModal();
  });
  
  // Add row button
  addRowButton.addEventListener('click', () => {
    addNewRow();
  });
  
  const removeRowButton = document.getElementById('remove-row-button');
  if (removeRowButton) {
    removeRowButton.addEventListener('click', () => {
      removeLastRow();
    });
  }
  // Manage columns button
  manageColumnsButton.addEventListener('click', () => {
    openManageColumnsModal();
  });
  
  // Add link form submission
  addLinkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveNewLink();
  });
  
  // Settings button
  settingsButton.addEventListener('click', () => {
    openSettingsModal();
  });
  
  // Settings form submission
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings();
  });

  // Add export/import buttons handlers
  const exportLinksButton = document.getElementById('export-links-button');
  if (exportLinksButton) {
    exportLinksButton.addEventListener('click', exportLinks);
  }

  const importLinksButton = document.getElementById('import-links-button');
  if (importLinksButton) {
    importLinksButton.addEventListener('click', () => {
      // Create a file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.style.display = 'none';
      
      // Add it to the document
      document.body.appendChild(fileInput);
      
      // Set up the file selection event handler
      fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
          importLinksFromFile(file);
        }
        // Clean up
        document.body.removeChild(fileInput);
      });
      
      // Trigger the file selection dialog
      fileInput.click();
    });
  }
  
  // Manage columns form submission
  manageColumnsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveColumnSettings();
  });
  
  // Close buttons for modals
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      addLinkModal.style.display = 'none';
      settingsModal.style.display = 'none';
      manageColumnsModal.style.display = 'none';
    });
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === addLinkModal) {
      addLinkModal.style.display = 'none';
    }
    if (e.target === settingsModal) {
      settingsModal.style.display = 'none';
    }
    if (e.target === manageColumnsModal) {
      manageColumnsModal.style.display = 'none';
    }
  });

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "open_settings") {
      openSettingsModal();
      sendResponse({ status: 'success' });
    }
    return true;
  });
}

// Add this function to newtab.js
// Updated exportLinks function for newtab.js with timestamp in filename
async function exportLinks() {
  try {
    // Get links from storage
    const links = await storageGet('links') || [];
    
    // Convert links to a JSON string
    const linksJson = JSON.stringify(links, null, 2);
    
    // Create a Blob with the JSON data
    const blob = new Blob([linksJson], { type: 'application/json' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Get current date and time for the filename
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    // Format the filename with timestamp: user-links_06_04_2025_22_15.json
    const filename = `user-links_${day}_${month}_${year}_${hours}_${minutes}.json`;
    
    // Create a temporary download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    
    // Add the link to the page, click it, and remove it
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Release the URL object
    URL.revokeObjectURL(url);
    
    console.log('Links exported successfully with filename:', filename);
  } catch (error) {
    console.error('Error exporting links:', error);
    alert('Error exporting links. Please try again.');
  }
}

function importLinksFromFile(file) {
  const reader = new FileReader();
  
  reader.onload = async (event) => {
    try {
      // Parse the JSON content
      const links = JSON.parse(event.target.result);
      
      // Validate the imported data
      if (!Array.isArray(links)) {
        throw new Error('Invalid format: Expected an array of links');
      }
      
      // Confirm with the user
      if (confirm(`Import ${links.length} links? This will replace your current links.`)) {
        // Save the imported links
        await storageSet('links', links);
        
        // Refresh the display
        renderLinks();
        
        console.log('Links imported successfully');
      }
    } catch (error) {
      console.error('Error importing links:', error);
      alert('Error importing links: ' + error.message);
    }
  };
  
  reader.onerror = () => {
    console.error('Error reading file');
    alert('Error reading file');
  };
  
  reader.readAsText(file);
}

// Listen for settings updates from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "settings_updated") {
    console.log("Received settings_updated message");
    // Reload settings and update the UI
    loadSettings().then(() => {
      console.log("Settings loaded after update:", userSettings);
      updateGreeting();
      updateLogo();
      setRandomBackground();
      renderLinks();
      
      console.log("UI updated after settings change");
    });
    sendResponse({ status: 'success' });
    return true;
  }
});

// Open the add link modal
function openAddLinkModal() {
  // Reset form
  document.getElementById('link-title').value = '';
  document.getElementById('link-url').value = '';
  document.getElementById('link-row').value = '1';
  document.getElementById('link-column').value = '1';
  
  // Set localized title
  const modalTitle = addLinkModal.querySelector('h2');
  modalTitle.textContent = chrome.i18n.getMessage('addLinkTitle');
  
  // Show modal
  addLinkModal.style.display = 'flex';
  document.getElementById('link-title').focus();
}

// Open edit link modal
function openEditLinkModal(index) {
  // Get all links
  storageGet('links').then(links => {
    if (!links || !links[index]) return;
    
    const link = links[index];
    
    // Fill form
    document.getElementById('link-title').value = link.title;
    document.getElementById('link-url').value = link.url;
    document.getElementById('link-row').value = link.row || '1';
    document.getElementById('link-column').value = link.column || '1';
    
    // Set localized title
    const modalTitle = addLinkModal.querySelector('h2');
    modalTitle.textContent = chrome.i18n.getMessage('editLinkTitle');
    
    // Update form submission handler
    const oldHandler = addLinkForm.onsubmit;
    addLinkForm.onsubmit = (e) => {
      e.preventDefault();
      updateLink(index);
      addLinkForm.onsubmit = oldHandler; // Restore original handler
    };
    
    // Show modal
    addLinkModal.style.display = 'flex';
    document.getElementById('link-title').focus();
  });
}

// Save a new link
async function saveNewLink() {
  const title = document.getElementById('link-title').value.trim();
  let url = document.getElementById('link-url').value.trim();
  const row = document.getElementById('link-row').value;
  const column = document.getElementById('link-column').value;
  
  // Add https:// if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  
  // Get existing links
  const links = await storageGet('links') || [];
  
  // Add new link
  links.push({ title, url, row, column });
  
  // Save links
  await storageSet('links', links);
  
  // Close modal
  addLinkModal.style.display = 'none';
  
  // Refresh links
  renderLinks();
}

// Update an existing link
async function updateLink(index) {
  const title = document.getElementById('link-title').value.trim();
  let url = document.getElementById('link-url').value.trim();
  const row = document.getElementById('link-row').value;
  const column = document.getElementById('link-column').value;
  
  // Add https:// if missing
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  
  // Get existing links
  const links = await storageGet('links') || [];
  
  // Update link
  if (links[index]) {
    links[index] = { title, url, row, column };
    
    // Save links
    await storageSet('links', links);
    
    // Close modal
    addLinkModal.style.display = 'none';
    
    // Refresh links
    renderLinks();
  }
}

// Delete a link
async function deleteLink(index) {
  if (confirm(chrome.i18n.getMessage('deleteConfirmation'))) {
    // Get existing links
    const links = await storageGet('links') || [];
    
    // Remove link
    links.splice(index, 1);
    
    // Save links
    await storageSet('links', links);
    
    // Refresh links
    renderLinks();
  }
}

// Open settings modal
function openSettingsModal() {
  // Update logo preview
  const logoPreview = document.getElementById('logo-preview');
  const logoPlaceholder = document.getElementById('logo-placeholder');
  
  if (logoPreview && logoPlaceholder) {
    if (userSettings.logoData) {
      logoPreview.src = userSettings.logoData;
      logoPreview.style.display = 'block';
      logoPlaceholder.style.display = 'none';
    } else {
      logoPreview.src = '';
      logoPreview.style.display = 'none';
      logoPlaceholder.style.display = 'block';
    }
  }
  
  // Show modal
  settingsModal.style.display = 'flex';
}

// Save settings
// Update the saveSettings function in newtab.js
async function saveSettings() {
  // Logo is already stored in userSettings.logoData when uploaded
  
  // Save settings
  try {
    await storageSet('settings', userSettings);
    console.log('Settings saved successfully:', userSettings);
    
    // Update UI
    updateGreeting();
    updateLogo();
    setRandomBackground();
    
    // Close modal
    settingsModal.style.display = 'none';
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Error saving settings. Please try again.');
  }
}

async function loadSettings() { 
  const settings = await storageGet('settings');
  if (settings) {
    userSettings = {
      ...userSettings,  // Start with defaults
      ...settings       // Override with stored settings
    };
    
    // Convert old unsplashCategory to backgroundCategory if needed
    if (userSettings.unsplashCategory && !userSettings.backgroundCategory) {
      userSettings.backgroundCategory = userSettings.unsplashCategory;
    }
    
    // Ensure column names array exists and has 8 items
    ensureColumnNames();
    
    // Ensure row count exists
    if (!userSettings.rowCount || typeof userSettings.rowCount !== 'number') {
      userSettings.rowCount = 1;
    }
    
    // Set default for showGreeting if not defined
    if (userSettings.showGreeting === undefined) {
      userSettings.showGreeting = true;
    }
  } else {
    // Initialize default column names for 8 columns
    ensureColumnNames();
  }
}

// Load links
async function loadLinks() {
  await renderLinks();
}

// Add a new row
async function addNewRow() {
  if (userSettings.rowCount < 5) { // Limit to 5 rows maximum
    userSettings.rowCount++;
    await storageSet('settings', userSettings);
    renderLinks();
    updateRowSelector();
  } else {
    alert(chrome.i18n.getMessage('maxRowsReached'));
  }
}

// Add this function to newtab.js
async function removeLastRow() {
  if (userSettings.rowCount > 1) { // Ensure we always keep at least one row
    userSettings.rowCount--;
    await storageSet('settings', userSettings);
    
    // Also need to check if there are links in the removed row
    const links = await storageGet('links') || [];
    const filteredLinks = links.filter(link => parseInt(link.row || 1) <= userSettings.rowCount);
    
    // If links were removed, save the filtered list
    if (filteredLinks.length < links.length) {
      await storageSet('links', filteredLinks);
    }
    
    // Update the UI
    renderLinks();
    updateRowSelector();
  } else {
    // Alert the user if trying to remove the last row
    alert(chrome.i18n.getMessage('cantRemoveLastRow') || "Cannot remove the last row.");
  }
}

// Update the updateRowSelector function for 8 columns
function updateRowSelector() {
  const linkRowSelect = document.getElementById('link-row');
  const linkColumnSelect = document.getElementById('link-column');
  
  // Clear existing options
  linkRowSelect.innerHTML = '';
  linkColumnSelect.innerHTML = '';
  
  // Add options for each row
  for (let i = 1; i <= userSettings.rowCount; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `Row ${i}`;
    linkRowSelect.appendChild(option);
  }
  
  // Add options for each column (8 columns for Firefox style)
  for (let i = 1; i <= 8; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `Column ${i}`;
    linkColumnSelect.appendChild(option);
  }
}

// Add this function to keep the expanded columnNames array for 8 columns
function ensureColumnNames() {
  if (!userSettings.columnNames || !Array.isArray(userSettings.columnNames)) {
    userSettings.columnNames = ['Quick Links', 'Work', 'Personal', 'News', 'Shopping', 'Social', 'Tech', 'Entertainment'];
  }
  
  // Ensure we have 8 column names for the Firefox style
  while (userSettings.columnNames.length < 8) {
    userSettings.columnNames.push(`Column ${userSettings.columnNames.length + 1}`);
  }
}


// Open manage columns modal
function openManageColumnsModal() {
  // Ensure we have 8 column names first
  ensureColumnNames();
  
  // Fill form with current column names
  for (let i = 1; i <= 8; i++) {
    const input = document.getElementById(`column-name-${i}`);
    if (input) {
      input.value = userSettings.columnNames[i-1] || '';
    }
  }
  
  // Show modal
  manageColumnsModal.style.display = 'flex';
  document.getElementById('column-name-1').focus();
}


// Save column settings
async function saveColumnSettings() {
  // Get column names from form
  const columnNames = [];
  for (let i = 1; i <= 8; i++) {
    const input = document.getElementById(`column-name-${i}`);
    if (input) {
      columnNames.push(input.value.trim() || `Column ${i}`);
    }
  }
  
  // Update settings
  userSettings.columnNames = columnNames;
  
  // Save settings
  await storageSet('settings', userSettings);
  
  // Close modal
  manageColumnsModal.style.display = 'none';
  
  // Update UI
  renderLinks();
}

// Update logo display
// Update or add this function to newtab.js
function updateLogo() {
  const logoElement = document.getElementById('user-logo');
  
  if (logoElement) {
    if (userSettings.logoData) {
      // Use custom logo if available
      logoElement.src = userSettings.logoData;
      logoElement.style.display = 'inline-block';
      console.log('Displaying custom logo');
    } else {
      // Use extension icon as default logo
      logoElement.src = chrome.runtime.getURL('icons/icon128.png');
      logoElement.style.display = 'inline-block';
      console.log('Displaying default logo');
    }
  }
}

// Update the date
function updateDate() {
  const dateElement = document.getElementById('date');
  const now = new Date();
  
  // Format the date: weekday, month day, year
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  const formattedDate = now.toLocaleDateString(undefined, options);
  dateElement.textContent = formattedDate;
}

// Update the updateClock function to also update the date
function updateClock() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  
  clockElement.textContent = `${hours}:${minutes}`;
  
  // Check if we need to update the date (midnight)
  const currentDateStr = document.getElementById('date').textContent;
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const todayStr = now.toLocaleDateString(undefined, options);
  
  if (currentDateStr !== todayStr) {
    updateDate();
  }
}

// Add this function to newtab.js
// Replace the loadRandomQuote function in newtab.js
// Replace the loadRandomQuote function in newtab.js
async function loadRandomQuote() {
  try {
    const quoteText = document.getElementById('quote-text');
    const quoteAuthor = document.getElementById('quote-author');
    
    // Set loading state
    quoteText.textContent = 'Loading inspiration...';
    quoteAuthor.textContent = '';
    
    // Fetch quote from the API
    const response = await fetch('https://qapi.vercel.app/api/random');
    
    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Quote API response:', data); // For debugging
    
    // Update the DOM with the quote
    // The API returns different format than expected - let's check all possible formats
    if (data) {
      // Try various properties that might contain the quote and author
      const quote = data.quote || data.content || data.text || data.q || '';
      const author = data.author || data.by || data.a || '';
      
      if (quote) {
        quoteText.textContent = `"${quote}"`;
        quoteAuthor.textContent = author ? `— ${author}` : '';
      } else {
        // If no quote is found in the response, use the fallback
        quoteText.textContent = '"To succeed in life, you need two things: ignorance and confidence."';
        quoteAuthor.textContent = '— Mark Twain';
      }
    } else {
      // Fallback if the response is empty
      quoteText.textContent = '"To succeed in life, you need two things: ignorance and confidence."';
      quoteAuthor.textContent = '— Mark Twain';
    }
  } catch (error) {
    console.error('Error fetching quote:', error);
    
    // Fallback quote if fetch fails
    document.getElementById('quote-text').textContent = 
      '"To succeed in life, you need two things: ignorance and confidence."';
    document.getElementById('quote-author').textContent = '— Mark Twain';
  }
}


// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', initPage);