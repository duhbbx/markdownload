
// Debug helper function for JSON logging
function logJSON(label, obj) {
  try {
    console.log(label, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.log(label, obj); // fallback to regular logging
  }
}

// Pure Chrome API - NO browser-polyfill!
console.log('🔧 [MarkDownload] 🔥 NO-POLYFILL: Using pure Chrome APIs');
console.log('🔧 [MarkDownload] 🔥 NO-POLYFILL: chrome available:', typeof chrome !== 'undefined');
console.log('🔧 [MarkDownload] 🔥 NO-POLYFILL: chrome.runtime available:', !!(chrome && chrome.runtime));
console.log('🔧 [MarkDownload] 🔥 NO-POLYFILL: chrome.tabs available:', !!(chrome && chrome.tabs));
console.log('🔧 [MarkDownload] 🔥 NO-POLYFILL: chrome.scripting available:', !!(chrome && chrome.scripting));

// Create a compatibility layer for the scripts that expect 'browser' object
const browser = {
  runtime: chrome.runtime,
  tabs: {
    query: chrome.tabs.query.bind(chrome.tabs),
    executeScript: function(tabId, details) {
      console.log('🔧 [MarkDownload] 🔥 NO-POLYFILL: executeScript called');
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'executeScript',
          tabId: tabId,
          details: details
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          if (response && response.error) {
            reject(new Error(response.error));
            return;
          }
          const results = response ? response.results : [];
          resolve(results);
        });
      });
    }
  },
  storage: chrome.storage
};

console.log('🔧 [MarkDownload] 🔥 NO-POLYFILL: Browser compatibility layer created');

// Old MV3 adapter code removed - using pure Chrome API now!

// Final verification
console.log('🔧 [MarkDownload] 🔥 FINAL CHECK - browser.tabs.executeScript status:');
console.log('🔧 [MarkDownload] 🔥 exists:', !!browser.tabs.executeScript);
console.log('🔧 [MarkDownload] 🔥 type:', typeof browser.tabs.executeScript);
console.log('🔧 [MarkDownload] 🔥 browser.tabs:', browser.tabs);
console.log('🔧 [MarkDownload] 🔥 Object.keys(browser.tabs):', Object.keys(browser.tabs || {}));

// Add a timer to check if the function disappears
setTimeout(() => {
  console.log('🔧 [MarkDownload] 🔥 ⏰ TIMER CHECK (500ms later):');
  console.log('🔧 [MarkDownload] 🔥 ⏰ browser.tabs.executeScript exists:', !!browser.tabs.executeScript);
  console.log('🔧 [MarkDownload] 🔥 ⏰ browser.tabs.executeScript type:', typeof browser.tabs.executeScript);
}, 500);

setTimeout(() => {
  console.log('🔧 [MarkDownload] 🔥 ⏰ TIMER CHECK (1000ms later):');
  console.log('🔧 [MarkDownload] 🔥 ⏰ browser.tabs.executeScript exists:', !!browser.tabs.executeScript);
  console.log('🔧 [MarkDownload] 🔥 ⏰ browser.tabs.executeScript type:', typeof browser.tabs.executeScript);
}, 1000);

setTimeout(() => {
  console.log('🔧 [MarkDownload] 🔥 ⏰ TIMER CHECK (2000ms later):');
  console.log('🔧 [MarkDownload] 🔥 ⏰ browser.tabs.executeScript exists:', !!browser.tabs.executeScript);
  console.log('🔧 [MarkDownload] 🔥 ⏰ browser.tabs.executeScript type:', typeof browser.tabs.executeScript);
}, 2000);



// Add Chrome API compatibility if needed
if (typeof chrome !== 'undefined' && typeof browser === 'undefined') {
  window.browser = chrome;
}

console.log('🔧 [MarkDownload] Popup script loaded');

// Monitor changes to browser.tabs.executeScript
if (typeof browser !== 'undefined' && browser.tabs) {
  const originalExecuteScript = browser.tabs.executeScript;
  
  // Set up property to monitor changes
  browser.tabs._executeScript = originalExecuteScript;
  
  Object.defineProperty(browser.tabs, 'executeScript', {
    get() { 
      return this._executeScript; 
    },
    set(value) { 
      console.log('🔧 [MarkDownload] 🔥 WARNING: browser.tabs.executeScript is being OVERWRITTEN!');
      console.log('🔧 [MarkDownload] 🔥 New value type:', typeof value);
      if (value && typeof value === 'function') {
        console.log('🔧 [MarkDownload] 🔥 New value preview:', value.toString().substring(0, 100) + '...');
      }
      this._executeScript = value;
    }
  });
}

// default variables
var selectedText = null;
var imageList = null;
var mdClipsFolder = '';

const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
// set up event handlers
const cm = CodeMirror.fromTextArea(document.getElementById("md"), {
    theme: darkMode ? "xq-dark" : "xq-light",
    mode: "markdown",
    lineWrapping: true
});
cm.on("cursorActivity", (cm) => {
    const somethingSelected = cm.somethingSelected();
    var a = document.getElementById("downloadSelection");

    if (somethingSelected) {
        if(a.style.display != "block") a.style.display = "block";
    }
    else {
        if(a.style.display != "none") a.style.display = "none";
    }
});
document.getElementById("download").addEventListener("click", download);
document.getElementById("downloadSelection").addEventListener("click", downloadSelection);

const defaultOptions = {
    includeTemplate: false,
    clipSelection: true,
    downloadImages: false
}

const checkInitialSettings = options => {
    if (options.includeTemplate)
        document.querySelector("#includeTemplate").classList.add("checked");

    if (options.downloadImages)
        document.querySelector("#downloadImages").classList.add("checked");

    if (options.clipSelection)
        document.querySelector("#selected").classList.add("checked");
    else
        document.querySelector("#document").classList.add("checked");
}

const toggleClipSelection = options => {
    options.clipSelection = !options.clipSelection;
    document.querySelector("#selected").classList.toggle("checked");
    document.querySelector("#document").classList.toggle("checked");
    browser.storage.sync.set(options).then(() => clipSite()).catch((error) => {
        console.error(error);
    });
}

const toggleIncludeTemplate = options => {
    options.includeTemplate = !options.includeTemplate;
    document.querySelector("#includeTemplate").classList.toggle("checked");
    browser.storage.sync.set(options).then(() => {
        browser.contextMenus.update("toggle-includeTemplate", {
            checked: options.includeTemplate
        });
        try {
            browser.contextMenus.update("tabtoggle-includeTemplate", {
                checked: options.includeTemplate
            });
        } catch { }
        return clipSite()
    }).catch((error) => {
        console.error(error);
    });
}

const toggleDownloadImages = options => {
    options.downloadImages = !options.downloadImages;
    document.querySelector("#downloadImages").classList.toggle("checked");
    browser.storage.sync.set(options).then(() => {
        browser.contextMenus.update("toggle-downloadImages", {
            checked: options.downloadImages
        });
        try {
            browser.contextMenus.update("tabtoggle-downloadImages", {
                checked: options.downloadImages
            });
        } catch { }
    }).catch((error) => {
        console.error(error);
    });
}
const showOrHideClipOption = selection => {
    if (selection) {
        document.getElementById("clipOption").style.display = "flex";
    }
    else {
        document.getElementById("clipOption").style.display = "none";
    }
}

const clipSite = id => {
    console.log('🔧 [MarkDownload] clipSite called with tab ID:', id);
    console.log('🔧 [MarkDownload] Executing simple test...');
    return browser.tabs.executeScript(id, { code: 'console.log("🔧 [MarkDownload] 🔥 EXECUTING: Simple test - this should work"); return { test: "success" };' })
        .then((result) => {
            console.log('🔧 [MarkDownload] getSelectionAndDom() raw result:', result);
            console.log('🔧 [MarkDownload] result type:', typeof result, 'is array:', Array.isArray(result));
            console.log('🔧 [MarkDownload] result.length:', result ? result.length : 'N/A');
            console.log('🔧 [MarkDownload] result[0]:', result && result[0]);
            console.log('🔧 [MarkDownload] result[0] type:', result && result[0] ? typeof result[0] : 'N/A');
            console.log('🔧 [MarkDownload] result[0] === null:', result && result[0] === null);
            console.log('🔧 [MarkDownload] result[0] === undefined:', result && result[0] === undefined);
            
            if (result && result[0]) {
                console.log('🔧 [MarkDownload] result[0] exists:', !!result[0]);
                console.log('🔧 [MarkDownload] result[0] type:', typeof result[0]);
                console.log('🔧 [MarkDownload] result[0] keys:', result[0] ? Object.keys(result[0]) : 'N/A');
                console.log('🔧 [MarkDownload] result[0].dom length:', result[0].dom ? result[0].dom.length : 'N/A');
                console.log('🔧 [MarkDownload] result[0].selection:', !!result[0].selection);
                
                console.log('🔧 [MarkDownload] Processing page content...');
                showOrHideClipOption(result[0].selection);
                let message = {
                    type: "clip",
                    dom: result[0].dom,
                    selection: result[0].selection
                }
                console.log('🔧 [MarkDownload] Created clip message:', {
                    type: message.type,
                    domLength: message.dom ? message.dom.length : 'N/A',
                    hasSelection: !!message.selection
                });
                
                return browser.storage.sync.get(defaultOptions).then(options => {
                    console.log('🔧 [MarkDownload] Got storage options, keys:', Object.keys(options));
                    console.log('🔧 [MarkDownload] Sending runtime message to background...');
                    
                    const fullMessage = { ...message, ...options };
                    console.log('🔧 [MarkDownload] Full message keys:', Object.keys(fullMessage));
                    
                    return browser.runtime.sendMessage(fullMessage).then(response => {
                        console.log('🔧 [MarkDownload] Runtime message sent successfully, response:', response);
                        return response;
                    }).catch(sendErr => {
                        console.error('❌ [MarkDownload] Error sending runtime message:', sendErr);
                        throw sendErr;
                    });
                }).catch(err => {
                    console.error('❌ [MarkDownload] Error getting options:', err);
                    showError(err)
                    console.log('🔧 [MarkDownload] Sending fallback message with defaultOptions...');
                    return browser.runtime.sendMessage({
                        ...message,
                        ...defaultOptions
                    });
                }).catch(err => {
                    console.error('❌ [MarkDownload] Error sending fallback message:', err);
                    showError(err)
                });
            } else {
                console.warn('⚠️ [MarkDownload] No result from getSelectionAndDom()');
                console.log('🔧 [MarkDownload] result details:', {
                    result: result,
                    resultLength: result ? result.length : 'N/A',
                    firstElement: result && result[0] ? 'exists' : 'missing'
                });
                showError('No content could be extracted from the page');
            }
        }).catch(err => {
            console.error('❌ [MarkDownload] Error in clipSite:', err);
            showError(err)
        });
}

// inject the necessary scripts
console.log('🔧 [MarkDownload] Getting default options...');
browser.storage.sync.get(defaultOptions).then(options => {
    console.log('🔧 [MarkDownload] Got options:', options);
    checkInitialSettings(options);
    
    document.getElementById("selected").addEventListener("click", (e) => {
        e.preventDefault();
        toggleClipSelection(options);
    });
    document.getElementById("document").addEventListener("click", (e) => {
        e.preventDefault();
        toggleClipSelection(options);
    });
    document.getElementById("includeTemplate").addEventListener("click", (e) => {
        e.preventDefault();
        toggleIncludeTemplate(options);
    });
    document.getElementById("downloadImages").addEventListener("click", (e) => {
        e.preventDefault();
        toggleDownloadImages(options);
    });
    
    console.log('🔧 [MarkDownload] Querying active tab...');
    return browser.tabs.query({
        currentWindow: true,
        active: true
    });
}).then((tabs) => {
    console.log('🔧 [MarkDownload] Found tabs:', tabs);
    var id = tabs[0].id;
    var url = tabs[0].url;
    console.log('🔧 [MarkDownload] Active tab ID:', id, 'URL:', url);
    
    // Check if the URL is a restricted page
    if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || 
        url.startsWith('edge://') || url.startsWith('about:') || 
        url.startsWith('moz-extension://') || url === 'about:blank') {
        console.warn('⚠️ [MarkDownload] Cannot work on restricted page:', url);
        showError(`MarkDownload cannot work on this page (${url.split('://')[0]}:// pages).\n\nPlease try on a regular website like:\n• Wikipedia\n• GitHub\n• News sites\n• Blogs`);
        return;
    }
    console.log('🔧 [MarkDownload] ===== STARTING SCRIPT INJECTION =====');
    console.log('🔧 [MarkDownload] Tab ID:', id);
            console.log('🔧 [MarkDownload] About to call browser.tabs.executeScript...');
        console.log('🔧 [MarkDownload] 🔥 Checking browser.tabs.executeScript function:');
        console.log('🔧 [MarkDownload] 🔥 typeof browser.tabs.executeScript:', typeof browser.tabs.executeScript);
        
        if (browser.tabs.executeScript && typeof browser.tabs.executeScript === 'function') {
          console.log('🔧 [MarkDownload] 🔥 browser.tabs.executeScript.toString():', browser.tabs.executeScript.toString().substring(0, 200) + '...');
        } else {
          console.error('🔧 [MarkDownload] 🔥 ERROR: browser.tabs.executeScript is NOT a function!');
          console.error('🔧 [MarkDownload] 🔥 Value:', browser.tabs.executeScript);
          
          // Try to restore the function on-demand
          console.log('🔧 [MarkDownload] 🔥 Attempting to restore executeScript function...');
          
          // First try to use stored reference
          if (window.markdownloadExecuteScript) {
            console.log('🔧 [MarkDownload] 🔥 Using stored function reference!');
            browser.tabs.executeScript = window.markdownloadExecuteScript;
            console.log('🔧 [MarkDownload] 🔥 Function restored from storage!');
          } else if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            console.log('🔧 [MarkDownload] 🔥 Creating executeScript function on-demand...');
            
            browser.tabs.executeScript = function(tabId, details) {
              console.log('🔧 [MarkDownload] 🔥 ON-DEMAND: executeScript function called!');
              logJSON('🔧 [MarkDownload] On-demand API: executeScript called with', { tabId, details });
              
              // Create browser-polyfill compatible Promise
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  chrome.runtime.sendMessage({
                    type: 'executeScript',
                    tabId: tabId,
                    details: details
                  }, (response) => {
                    console.log('🔧 [MarkDownload] On-demand API: Got response');
                    logJSON('🔧 [MarkDownload] On-demand API: Response', response);
                    
                    if (chrome.runtime.lastError) {
                      console.error('🔧 [MarkDownload] On-demand API: Runtime error:', chrome.runtime.lastError);
                      reject(chrome.runtime.lastError);
                      return;
                    }
                    
                    if (response && response.error) {
                      console.error('🔧 [MarkDownload] On-demand API: Response error:', response.error);
                      reject(new Error(response.error));
                      return;
                    }
                    
                    const results = response ? response.results : [];
                    logJSON('🔧 [MarkDownload] On-demand API: Resolving with', results);
                    
                    setTimeout(() => {
                      resolve(results);
                    }, 0);
                  });
                }, 0);
              });
            };
            
            // Store this new function too
            window.markdownloadExecuteScript = browser.tabs.executeScript;
            console.log('🔧 [MarkDownload] 🔥 executeScript function created and stored!');
          } else {
            throw new Error('browser.tabs.executeScript is not available and cannot be restored');
          }
        }
        
        try {
                         // Skip browser-polyfill.min.js injection - we don't need it anymore!
             console.log('🔧 [MarkDownload] 🔥 NO-POLYFILL: Skipping browser-polyfill.min.js injection');
             console.log('🔧 [MarkDownload] 🔥 NO-POLYFILL: Going directly to contentScript injection');
             
             // Create a resolved promise to continue the chain
             const polyfillPromise = Promise.resolve([null]);
        
        console.log('🔧 [MarkDownload] ✅ executeScript call successful, got promise:', polyfillPromise);
        console.log('🔧 [MarkDownload] Promise type:', typeof polyfillPromise);
        console.log('🔧 [MarkDownload] Promise constructor:', polyfillPromise.constructor.name);
        
        console.log('🔧 [MarkDownload] About to attach .then() handler...');
        
        // Add debugging for the Promise state
        polyfillPromise.then(
            (result) => {
                console.log('🔧 [MarkDownload] 🔥 🎉 polyfillPromise RESOLVED!');
                logJSON('🔧 [MarkDownload] 🔥 🎉 Resolved with', result);
                console.log('🔧 [MarkDownload] 🔥 🎉 This should trigger the main .then() chain!');
            },
            (error) => {
                console.error('🔧 [MarkDownload] 🔥 💥 polyfillPromise REJECTED!');
                logJSON('🔧 [MarkDownload] 🔥 💥 Rejected with', error);
                console.error('🔧 [MarkDownload] 🔥 💥 This explains why .then() chain is not running!');
            }
        );
        
        // Force Promise resolution test
        console.log('🔧 [MarkDownload] 🔥 Testing direct Promise.resolve...');
        const testPromise = Promise.resolve(['test']);
        testPromise.then(result => console.log('🔧 [MarkDownload] 🔥 Test promise resolved:', result));
        
        // Test our adapter directly
        console.log('🔧 [MarkDownload] 🔥 Testing Chrome API adapter directly...');
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          const directTest = new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
              type: 'executeScript',
              tabId: id,
              details: { file: "/browser-polyfill.min.js" }
            }, (response) => {
              console.log('🔧 [MarkDownload] 🔥 Direct test response:', response);
              resolve(response ? response.results : []);
            });
          });
          
          directTest.then(result => {
            console.log('🔧 [MarkDownload] 🔥 Direct Chrome API test resolved:', result);
          });
        }
        
        // Testing code removed - using pure Chrome API now
        
        const chainedPromise = polyfillPromise.then((result) => {
             console.log('🔧 [MarkDownload] ========== INSIDE FIRST .then() ==========');
             console.log('🔧 [MarkDownload] 🎯 First .then() called! This means the promise resolved!');
             logJSON('🔧 [MarkDownload] 🎯 POLYFILL INJECTION RESULT', result);
             console.log('🔧 [MarkDownload] 🎯 Result type:', typeof result, 'Array?', Array.isArray(result));
             console.log('🔧 [MarkDownload] 🎯 About to inject contentScript.js...');
             
             console.log('🔧 [MarkDownload] 🎯 Injecting contentScript.js...');
             const contentScriptPromise = browser.tabs.executeScript(id, {
                 file: "/contentScript/contentScript.js"
             });
             
             console.log('🔧 [MarkDownload] 🎯 Created contentScript promise:', contentScriptPromise);
             console.log('🔧 [MarkDownload] 🎯 Returning contentScript promise from first .then()');
             return contentScriptPromise;
                    }).then((result) => {
               console.log('🔧 [MarkDownload] ========== INSIDE SECOND .then() ==========');
               console.log('🔧 [MarkDownload] 🎯 Second .then() called! ContentScript injected!');
               console.log('🔧 [MarkDownload] 🎯 CONTENTSCRIPT INJECTION RESULT:', result);
               console.log('🔧 [MarkDownload] 🎯 About to call clipSite...');
               
               const clipSitePromise = clipSite(id);
               console.log('🔧 [MarkDownload] 🎯 Created clipSite promise:', clipSitePromise);
               console.log('🔧 [MarkDownload] 🎯 Returning clipSite promise from second .then()');
               return clipSitePromise;
           }).catch( (error) => {
               console.error('❌ [MarkDownload] ========== PROMISE CHAIN ERROR ==========');
               console.error('❌ [MarkDownload] Script injection failed:', error);
               console.error('❌ [MarkDownload] Error details:', error);
               console.error('❌ [MarkDownload] Error stack:', error.stack);
               
               // Provide user-friendly error messages
               if (error.message && error.message.includes('Cannot access a chrome://')) {
                   showError('MarkDownload cannot work on chrome:// pages.\n\nPlease try on a regular website like Wikipedia, GitHub, or news sites.');
               } else if (error.message && error.message.includes('Cannot access contents of')) {
                   showError('MarkDownload cannot access this page due to browser security restrictions.\n\nPlease try on a different website.');
               } else {
                   showError(`Error: ${error.message || error}\n\nPlease try on a different website or reload the page.`);
               }
           });
           
           console.log('🔧 [MarkDownload] ✅ Promise chain created successfully:', chainedPromise);
           console.log('🔧 [MarkDownload] ✅ Returning promise chain from main function');
           return chainedPromise;
           
       } catch (syncError) {
           console.error('❌ [MarkDownload] ========== SYNCHRONOUS ERROR ==========');
           console.error('❌ [MarkDownload] Synchronous error in script injection:', syncError);
           console.error('❌ [MarkDownload] Sync error stack:', syncError.stack);
           showError(`Synchronous error: ${syncError.message || syncError}`);
       }
});

// listen for notifications from the background page
browser.runtime.onMessage.addListener(notify);

//function to send the download message to the background page
function sendDownloadMessage(text) {
    if (text != null) {

        return browser.tabs.query({
            currentWindow: true,
            active: true
        }).then(tabs => {
            var message = {
                type: "download",
                markdown: text,
                title: document.getElementById("title").value,
                tab: tabs[0],
                imageList: imageList,
                mdClipsFolder: mdClipsFolder
            };
            return browser.runtime.sendMessage(message);
        });
    }
}

// event handler for download button
async function download(e) {
    e.preventDefault();
    await sendDownloadMessage(cm.getValue());
    window.close();
}

// event handler for download selected button
async function downloadSelection(e) {
    e.preventDefault();
    if (cm.somethingSelected()) {
        await sendDownloadMessage(cm.getSelection());
    }
}

//function that handles messages from the injected script into the site
function notify(message) {
    console.log('🔧 [MarkDownload] Popup: notify called with message:', message.type, message);
    // message for displaying markdown
    if (message.type == "display.md") {
        console.log('🔧 [MarkDownload] Popup: Processing display.md message');

        // set the values from the message
        //document.getElementById("md").value = message.markdown;
        console.log('🔧 [MarkDownload] Popup: Setting markdown content and title');
        cm.setValue(message.markdown);
        document.getElementById("title").value = message.article.title;
        imageList = message.imageList;
        mdClipsFolder = message.mdClipsFolder;
        
        // show the hidden elements
        console.log('🔧 [MarkDownload] Popup: Showing UI elements');
        document.getElementById("container").style.display = 'flex';
        document.getElementById("spinner").style.display = 'none';
         // focus the download button
        document.getElementById("download").focus();
        cm.refresh();
        console.log('🔧 [MarkDownload] Popup: UI setup complete');
    }
}

function showError(err) {
    // show the hidden elements
    document.getElementById("container").style.display = 'flex';
    document.getElementById("spinner").style.display = 'none';
    cm.setValue(`Error clipping the page\n\n${err}`)
}

