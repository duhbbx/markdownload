// Manifest V3 API Adapter
// This file provides compatibility for Manifest V2 -> V3 API changes

// Wrap browser.tabs.executeScript for Manifest V3 compatibility
if (typeof browser !== 'undefined' && browser.tabs && !browser.tabs.executeScript) {
  browser.tabs.executeScript = async function(tabId, details) {
    try {
      let results;
      if (details.code) {
        // For code injection, we need to wrap it in a function
        const func = new Function('return ' + details.code);
        results = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: func
        });
      } else if (details.file) {
        results = await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: [details.file]
        });
      }
      // Convert MV3 result format to MV2 format
      return results ? results.map(result => result.result) : [];
    } catch (error) {
      console.error('Script execution failed:', error);
      throw error;
    }
  };
}

// Add Chrome API compatibility if needed
if (typeof chrome !== 'undefined' && typeof browser === 'undefined') {
  window.browser = chrome;
} 