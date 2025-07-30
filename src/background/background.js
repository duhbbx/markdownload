// Import required scripts for service worker
importScripts(
  '/browser-polyfill.min.js',
  '/background/mv3-adapter.js',
  '/background/apache-mime-types.js',
  '/background/moment.min.js',
  '/background/turndown.js',
  '/background/turndown-plugin-gfm.js',
  '/background/Readability.js',
  '/shared/context-menus.js',
  '/shared/default-options.js'
);

console.log('🔧 [MarkDownload] Background script loaded');

// log some info
browser.runtime.getPlatformInfo().then(async platformInfo => {
  const browserInfo = browser.runtime.getBrowserInfo ? await browser.runtime.getBrowserInfo() : "Can't get browser info"
  console.info('🔧 [MarkDownload] Platform info:', platformInfo, browserInfo);
});

console.log('🔧 [MarkDownload] Setting up unified message listener...');
// Unified message listener for all types
browser.runtime.onMessage.addListener(async (message, sender) => {
  console.log('🔧 [MarkDownload] Background: Received message:', message.type, message);
  
  // Handle executeScript requests from popup
  if (message.type === 'executeScript') {
    console.log('🔧 [MarkDownload] Background: Processing executeScript request');
    try {
      let results;
      if (message.details.code) {
        console.log('🔧 [MarkDownload] Background: Executing code:', message.details.code);
        // Execute code directly in the page context using func
        results = await chrome.scripting.executeScript({
          target: { tabId: message.tabId },
          func: () => {
            console.log('🔧 [MarkDownload] 🔥 BACKGROUND: Starting page context execution');
            console.log('🔧 [MarkDownload] 🔥 BACKGROUND: Current context:', typeof window, typeof document);
            console.log('🔧 [MarkDownload] 🔥 BACKGROUND: window.location:', window.location.href);
            
            try {
              console.log('🔧 [MarkDownload] 🔥 BACKGROUND: Step 1 - Basic checks');
              console.log('🔧 [MarkDownload] 🔥 BACKGROUND: document exists:', !!document);
              console.log('🔧 [MarkDownload] 🔥 BACKGROUND: document.readyState:', document.readyState);
              console.log('🔧 [MarkDownload] 🔥 BACKGROUND: document.body exists:', !!document.body);
              console.log('🔧 [MarkDownload] 🔥 BACKGROUND: document.documentElement exists:', !!document.documentElement);
              
              console.log('🔧 [MarkDownload] 🔥 BACKGROUND: Step 2 - Testing DOM access');
              const bodyElement = document.querySelector('body');
              console.log('🔧 [MarkDownload] 🔥 BACKGROUND: bodyElement exists:', !!bodyElement);
              
              console.log('🔧 [MarkDownload] 🔥 BACKGROUND: Step 3 - Getting HTML');
              const testHTML = document.documentElement.outerHTML;
              console.log('🔧 [MarkDownload] 🔥 BACKGROUND: HTML length:', testHTML ? testHTML.length : 'N/A');
              console.log('🔧 [MarkDownload] 🔥 BACKGROUND: HTML preview:', testHTML ? testHTML.substring(0, 200) + '...' : 'N/A');
              
              console.log('🔧 [MarkDownload] 🔥 BACKGROUND: Step 4 - Creating result object');
              const result = {
                selection: '',
                dom: testHTML || '',
                success: true,
                timestamp: new Date().toISOString()
              };
              
              console.log('🔧 [MarkDownload] 🔥 BACKGROUND: Step 5 - Final result:', {
                hasSelection: !!result.selection,
                hasDom: !!result.dom,
                domLength: result.dom ? result.dom.length : 'N/A',
                success: result.success
              });
              
              console.log('🔧 [MarkDownload] 🔥 BACKGROUND: ===== RETURNING RESULT =====');
              return result;
              
            } catch (error) {
              console.error('🔧 [MarkDownload] 🔥 BACKGROUND: ===== ERROR OCCURRED =====');
              console.error('🔧 [MarkDownload] 🔥 BACKGROUND: Error message:', error.message);
              console.error('🔧 [MarkDownload] 🔥 BACKGROUND: Error stack:', error.stack);
              console.error('🔧 [MarkDownload] 🔥 BACKGROUND: Error type:', error.constructor.name);
              
              return { 
                error: error.message, 
                stack: error.stack,
                success: false,
                timestamp: new Date().toISOString()
              };
            }
          }
        });
      } else if (message.details.file) {
        console.log('🔧 [MarkDownload] Background: Executing file:', message.details.file);
        results = await chrome.scripting.executeScript({
          target: { tabId: message.tabId },
          files: [message.details.file]
        });
      }
      // Convert MV3 result format to MV2 format
      const convertedResults = results ? results.map(result => result.result) : [];
      console.log('🔧 [MarkDownload] Background: Script execution successful, results:', convertedResults);
      return { results: convertedResults };
    } catch (error) {
      console.error('❌ [MarkDownload] Background: Script execution failed:', error);
      return { error: error.message };
    }
  }
  
  // Handle other message types (clip, download, etc.)
  else {
    console.log('🔧 [MarkDownload] Background: Delegating to notify function for:', message.type);
    const result = await notify(message);
    console.log('🔧 [MarkDownload] Background: notify function result:', result);
    return result;
  }
});
  
  // create context menus
  console.log('🔧 [MarkDownload] Creating context menus...');
  createMenus()

TurndownService.prototype.defaultEscape = TurndownService.prototype.escape;

// function to convert the article content to markdown using Turndown
function turndown(content, options, article) {
  console.log('═══════════════════ TURNDOWN CONVERSION START ═══════════════════');
  console.log('📥 [TURNDOWN INPUT] Content length:', content ? content.length : 'N/A');
  console.log('📥 [TURNDOWN INPUT] Content type:', typeof content);
  console.log('📥 [TURNDOWN INPUT] Content preview:', content ? content.substring(0, 300) + '...' : 'N/A');
  console.log('📥 [TURNDOWN INPUT] Is HTML document?', content ? content.includes('<html') : false);
  console.log('📥 [TURNDOWN INPUT] Has headings?', content ? content.includes('<h') : false);
  console.log('📥 [TURNDOWN INPUT] Has paragraphs?', content ? content.includes('<p>') : false);
  
  // Clean up content for better turndown processing
  if (content && content.includes('<html')) {
    const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      console.log('🔄 [TURNDOWN PROCESSING] Extracted body from HTML document, length:', bodyMatch[1].length);
      content = bodyMatch[1];
    } else {
      console.log('🔄 [TURNDOWN PROCESSING] No body tag found, using full content');
    }
  }
  
  console.log('🔄 [TURNDOWN PROCESSING] After cleanup - Content length:', content ? content.length : 'N/A');
  console.log('🔄 [TURNDOWN PROCESSING] After cleanup - Content preview:', content ? content.substring(0, 300) + '...' : 'N/A');
  console.log('🔄 [TURNDOWN PROCESSING] Final content has headings?', content ? content.includes('<h') : false);
  console.log('🔄 [TURNDOWN PROCESSING] Final content has paragraphs?', content ? content.includes('<p>') : false);
  
  // Create document polyfill for Service Worker environment
  if (typeof document === 'undefined') {
    console.log('🔧 [MarkDownload] turndown: Creating document polyfill for Service Worker');
    
    // Create a comprehensive document polyfill
    const createMockElement = (tagName, id = null, innerHTML = '') => {
      const element = {
        nodeName: tagName.toUpperCase(),
        tagName: tagName.toUpperCase(),
        id: id || '',
        innerHTML: innerHTML || '',
        textContent: (innerHTML || '').replace(/<[^>]*>/g, ''),
        className: '',
        attributes: {},
        childNodes: [],
        parentNode: null,
        nextSibling: null,
        previousSibling: null,
        nodeType: 1, // ELEMENT_NODE
        nodeValue: null,
        style: {},
        
        // DOM properties
        get children() {
          // Return only element nodes (nodeType === 1), not text nodes
          return this.childNodes.filter(child => child.nodeType === 1);
        },
        
        get firstElementChild() {
          const elementChildren = this.children;
          return elementChildren.length > 0 ? elementChildren[0] : null;
        },
        
        get lastElementChild() {
          const elementChildren = this.children;
          return elementChildren.length > 0 ? elementChildren[elementChildren.length - 1] : null;
        },
        
        get nextElementSibling() {
          if (!this.parentNode) return null;
          const siblings = this.parentNode.children;
          const index = siblings.indexOf(this);
          return index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;
        },
        
        get previousElementSibling() {
          if (!this.parentNode) return null;
          const siblings = this.parentNode.children;
          const index = siblings.indexOf(this);
          return index > 0 ? siblings[index - 1] : null;
        },
        
        appendChild: function(child) {
          this.childNodes.push(child);
          child.parentNode = this;
          return child;
        },
        removeChild: function(child) {
          const index = this.childNodes.indexOf(child);
          if (index > -1) {
            this.childNodes.splice(index, 1);
            child.parentNode = null;
          }
          return child;
        },
        setAttribute: function(name, value) {
          this.attributes[name] = value;
          if (name === 'id') this.id = value;
          if (name === 'class') this.className = value;
        },
        getAttribute: function(name) {
          return this.attributes[name] || null;
        },
        hasAttribute: function(name) {
          return name in this.attributes;
        },
        removeAttribute: function(name) {
          delete this.attributes[name];
          if (name === 'id') this.id = '';
          if (name === 'class') this.className = '';
        },
        querySelector: () => null,
        querySelectorAll: () => [],
        getElementsByTagName: () => [],
        cloneNode: function(deep) {
          const clone = createMockElement(this.tagName, this.id, this.innerHTML);
          clone.className = this.className;
          clone.attributes = { ...this.attributes };
          if (deep && this.childNodes) {
            this.childNodes.forEach(child => {
              clone.appendChild(child.cloneNode(true));
            });
          }
          return clone;
        }
      };
      return element;
    };

    // Create a mock document that will be returned by createHTMLDocument
    const createMockDocument = (title) => {
      let htmlContent = '';
      let parsedElements = {};
      
      const mockDoc = {
        title: title || '',
        documentElement: createMockElement('HTML'),
        body: createMockElement('BODY'),
        head: createMockElement('HEAD'),
        createElement: (tagName) => createMockElement(tagName),
        createTextNode: (text) => ({
          nodeType: 3,
          nodeName: '#text',
          textContent: text,
          nodeValue: text,
          parentNode: null
        }),
        getElementById: function(id) {
          console.log('🔧 [MarkDownload] mockDoc.getElementById called with:', id);
          if (id === 'turndown-root') {
            if (!parsedElements[id]) {
              // Create element with the HTML content that was written
              const element = createMockElement('x-turndown', id, htmlContent);
              
              // Parse HTML content and create proper DOM structure for turndown to traverse
              if (htmlContent) {
                console.log('🔧 [MarkDownload] Parsing HTML content for turndown-root...');
                try {
                  // Parse and create actual DOM elements from HTML content
                  element.childNodes = [];
                  
                  // Helper function to parse HTML and create DOM structure
                  const parseHTMLContent = (content) => {
                    // Create elements for common HTML tags that turndown needs to recognize
                    const createElementFromMatch = (tagName, content, attributes = {}) => {
                      const elem = createMockElement(tagName, attributes.id, content);
                      if (attributes.class) elem.className = attributes.class;
                      elem.parentNode = element;
                      
                      // For elements with nested content, try to parse inner HTML too
                      if (content && content.includes('<')) {
                        const innerText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                        if (innerText) {
                          const textNode = {
                            nodeType: 3,
                            nodeName: '#text',
                            nodeValue: innerText,
                            textContent: innerText,
                            parentNode: elem
                          };
                          elem.childNodes.push(textNode);
                        }
                      } else if (content) {
                        const textNode = {
                          nodeType: 3,
                          nodeName: '#text',
                          nodeValue: content,
                          textContent: content,
                          parentNode: elem
                        };
                        elem.childNodes.push(textNode);
                      }
                      return elem;
                    };

                    // Parse headings
                    const headingPattern = /<(h[1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
                    let match;
                    while ((match = headingPattern.exec(content)) !== null) {
                      const headingLevel = match[1].toUpperCase();
                      const headingContent = match[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                      if (headingContent) {
                        element.childNodes.push(createElementFromMatch(headingLevel, headingContent));
                      }
                    }

                    // Parse paragraphs
                    const paragraphPattern = /<p[^>]*>(.*?)<\/p>/gi;
                    while ((match = paragraphPattern.exec(content)) !== null) {
                      const pContent = match[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                      if (pContent) {
                        element.childNodes.push(createElementFromMatch('P', pContent));
                      }
                    }

                    // Parse strong/bold elements
                    const strongPattern = /<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi;
                    while ((match = strongPattern.exec(content)) !== null) {
                      const strongContent = match[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                      if (strongContent) {
                        element.childNodes.push(createElementFromMatch('STRONG', strongContent));
                      }
                    }

                    // Parse links
                    const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
                    while ((match = linkPattern.exec(content)) !== null) {
                      const href = match[1];
                      const linkText = match[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                      if (linkText) {
                        const linkElem = createElementFromMatch('A', linkText);
                        linkElem.setAttribute('href', href);
                        element.childNodes.push(linkElem);
                      }
                    }

                    // Parse lists
                    const ulPattern = /<ul[^>]*>(.*?)<\/ul>/gi;
                    while ((match = ulPattern.exec(content)) !== null) {
                      const ulElem = createElementFromMatch('UL', '');
                      const liPattern = /<li[^>]*>(.*?)<\/li>/gi;
                      let liMatch;
                      while ((liMatch = liPattern.exec(match[1])) !== null) {
                        const liContent = liMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                        if (liContent) {
                          const liElem = createElementFromMatch('LI', liContent);
                          liElem.parentNode = ulElem;
                          ulElem.childNodes.push(liElem);
                        }
                      }
                      if (ulElem.childNodes.length > 0) {
                        element.childNodes.push(ulElem);
                      }
                    }

                    // If no specific elements were parsed, create basic text nodes from remaining content
                    if (element.childNodes.length === 0) {
                      const cleanText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                      if (cleanText) {
                        // Split into paragraphs and create P elements
                        const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim());
                        paragraphs.forEach(para => {
                          if (para.trim()) {
                            element.childNodes.push(createElementFromMatch('P', para.trim()));
                          }
                        });
                      }
                    }
                  };

                  parseHTMLContent(htmlContent);
                  console.log('🔧 [MarkDownload] Created', element.childNodes.length, 'child elements for turndown-root');
                  
                } catch (parseError) {
                  console.error('🔧 [MarkDownload] Error parsing HTML for turndown-root:', parseError);
                  // Fallback: create basic text content
                  const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                  if (textContent) {
                    const textNode = {
                      nodeType: 3,
                      nodeName: '#text',
                      nodeValue: textContent,
                      textContent: textContent,
                      parentNode: element
                    };
                    element.childNodes.push(textNode);
                  }
                }
              }
              
              parsedElements[id] = element;
              console.log('🔧 [MarkDownload] Created turndown-root element with content length:', htmlContent.length);
              console.log('🔧 [MarkDownload] turndown-root element structure:', {
                nodeName: element.nodeName,
                id: element.id,
                innerHTML: element.innerHTML.substring(0, 200) + '...',
                textContent: element.textContent.substring(0, 200) + '...',
                childNodes: element.childNodes.length,
                children: element.children.length
              });
            } else {
              console.log('🔧 [MarkDownload] Returning existing turndown-root element');
            }
            return parsedElements[id];
          }
          return null;
        },
        open: function() {
          console.log('🔧 [MarkDownload] mockDoc.open() called');
          htmlContent = '';
        },
        write: function(string) {
          console.log('🔧 [MarkDownload] mockDoc.write() called with length:', string ? string.length : 'N/A');
          htmlContent += string;
        },
        close: function() {
          console.log('🔧 [MarkDownload] mockDoc.close() called, final content length:', htmlContent.length);
          // Update any existing turndown-root element
          if (parsedElements['turndown-root']) {
            parsedElements['turndown-root'].innerHTML = htmlContent;
            parsedElements['turndown-root'].textContent = htmlContent.replace(/<[^>]*>/g, '');
          }
        },
        querySelector: () => null,
        querySelectorAll: () => [],
        getElementsByTagName: () => []
      };
      
      return mockDoc;
    };

    globalThis.document = {
      implementation: {
        createHTMLDocument: createMockDocument
      },
      createElement: (tagName) => createMockElement(tagName),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => []
    };

    // Also create a global DOMParser for turndown
    if (typeof globalThis.DOMParser === 'undefined') {
      globalThis.DOMParser = function() {
        this.parseFromString = function(string, mimeType) {
          console.log('🔧 [MarkDownload] DOMParser.parseFromString called with string length:', string ? string.length : 'N/A');
          console.log('🔧 [MarkDownload] DOMParser.parseFromString mimeType:', mimeType);
          
          const doc = createMockDocument('');
          doc.open();
          doc.write(string);
          doc.close();
          return doc;
        };
      };
    }
  }

  if (options.turndownEscape) TurndownService.prototype.escape = TurndownService.prototype.defaultEscape;
  else TurndownService.prototype.escape = s => s;

  var turndownService = new TurndownService(options);

  turndownService.use(turndownPluginGfm.gfm)

  turndownService.keep(['iframe', 'sub', 'sup', 'u', 'ins', 'del', 'small', 'big']);

  let imageList = {};
  // add an image rule
  turndownService.addRule('images', {
    filter: function (node, tdopts) {
      // if we're looking at an img node with a src
      if (node.nodeName == 'IMG' && node.getAttribute('src')) {
        
        // get the original src
        let src = node.getAttribute('src')
        // set the new src
        node.setAttribute('src', validateUri(src, article.baseURI));
        
        // if we're downloading images, there's more to do.
        if (options.downloadImages) {
          // generate a file name for the image
          let imageFilename = getImageFilename(src, options, false);
          if (!imageList[src] || imageList[src] != imageFilename) {
            // if the imageList already contains this file, add a number to differentiate
            let i = 1;
            while (Object.values(imageList).includes(imageFilename)) {
              const parts = imageFilename.split('.');
              if (i == 1) parts.splice(parts.length - 1, 0, i++);
              else parts.splice(parts.length - 2, 1, i++);
              imageFilename = parts.join('.');
            }
            // add it to the list of images to download later
            imageList[src] = imageFilename;
          }
          // check if we're doing an obsidian style link
          const obsidianLink = options.imageStyle.startsWith("obsidian");
          // figure out the (local) src of the image
          const localSrc = options.imageStyle === 'obsidian-nofolder'
            // if using "nofolder" then we just need the filename, no folder
            ? imageFilename.substring(imageFilename.lastIndexOf('/') + 1)
            // otherwise we may need to modify the filename to uri encode parts for a pure markdown link
            : imageFilename.split('/').map(s => obsidianLink ? s : encodeURI(s)).join('/')
          
          // set the new src attribute to be the local filename
          if(options.imageStyle != 'originalSource' && options.imageStyle != 'base64') node.setAttribute('src', localSrc);
          // pass the filter if we're making an obsidian link (or stripping links)
          return true;
        }
        else return true
      }
      // don't pass the filter, just output a normal markdown link
      return false;
    },
    replacement: function (content, node, tdopts) {
      // if we're stripping images, output nothing
      if (options.imageStyle == 'noImage') return '';
      // if this is an obsidian link, so output that
      else if (options.imageStyle.startsWith('obsidian')) return `![[${node.getAttribute('src')}]]`;
      // otherwise, output the normal markdown link
      else {
        var alt = cleanAttribute(node.getAttribute('alt'));
        var src = node.getAttribute('src') || '';
        var title = cleanAttribute(node.getAttribute('title'));
        var titlePart = title ? ' "' + title + '"' : '';
        if (options.imageRefStyle == 'referenced') {
          var id = this.references.length + 1;
          this.references.push('[fig' + id + ']: ' + src + titlePart);
          return '![' + alt + '][fig' + id + ']';
        }
        else return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : ''
      }
    },
    references: [],
    append: function (options) {
      var references = '';
      if (this.references.length) {
        references = '\n\n' + this.references.join('\n') + '\n\n';
        this.references = []; // Reset references
      }
      return references
    }

  });

  // add a rule for links
  turndownService.addRule('links', {
    filter: (node, tdopts) => {
      // check that this is indeed a link
      if (node.nodeName == 'A' && node.getAttribute('href')) {
        // get the href
        const href = node.getAttribute('href');
        // set the new href
        node.setAttribute('href', validateUri(href, article.baseURI));
        // if we are to strip links, the filter needs to pass
        return options.linkStyle == 'stripLinks';
      }
      // we're not passing the filter, just do the normal thing.
      return false;
    },
    // if the filter passes, we're stripping links, so just return the content
    replacement: (content, node, tdopts) => content
  });

  // handle multiple lines math
  turndownService.addRule('mathjax', {
    filter(node, options) {
      return article.math.hasOwnProperty(node.id);
    },
    replacement(content, node, options) {
      const math = article.math[node.id];
      let tex = math.tex.trim().replaceAll('\xa0', '');

      if (math.inline) {
        tex = tex.replaceAll('\n', ' ');
        return `$${tex}$`;
      }
      else
        return `$$\n${tex}\n$$`;
    }
  });

  function repeat(character, count) {
    return Array(count + 1).join(character);
  }

  function convertToFencedCodeBlock(node, options) {
    node.innerHTML = node.innerHTML.replaceAll('<br-keep></br-keep>', '<br>');
    const langMatch = node.id?.match(/code-lang-(.+)/);
    const language = langMatch?.length > 0 ? langMatch[1] : '';

    const code = node.innerText;

    const fenceChar = options.fence.charAt(0);
    let fenceSize = 3;
    const fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm');

    let match;
    while ((match = fenceInCodeRegex.exec(code))) {
      if (match[0].length >= fenceSize) {
        fenceSize = match[0].length + 1;
      }
    }

    const fence = repeat(fenceChar, fenceSize);

    return (
      '\n\n' + fence + language + '\n' +
      code.replace(/\n$/, '') +
      '\n' + fence + '\n\n'
    )
  }

  turndownService.addRule('fencedCodeBlock', {
    filter: function (node, options) {
      return (
        options.codeBlockStyle === 'fenced' &&
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: function (content, node, options) {
      return convertToFencedCodeBlock(node.firstChild, options);
    }
  });

  // handle <pre> as code blocks
  turndownService.addRule('pre', {
    filter: (node, tdopts) => {
      return node.nodeName == 'PRE'
             && (!node.firstChild || node.firstChild.nodeName != 'CODE')
             && !node.querySelector('img');
    },
    replacement: (content, node, tdopts) => {
      return convertToFencedCodeBlock(node, tdopts);
    }
  });

  console.log('🚀 [TURNDOWN EXECUTION] Calling turndownService.turndown()...');
  console.log('🚀 [TURNDOWN EXECUTION] TurndownService type:', typeof turndownService);
  console.log('🚀 [TURNDOWN EXECUTION] TurndownService.turndown type:', typeof turndownService.turndown);
  console.log('🚀 [TURNDOWN EXECUTION] Input to turndownService:', content.substring(0, 500) + '...');
  
  let rawMarkdown;
  try {
    rawMarkdown = turndownService.turndown(content);
    
    console.log('📤 [TURNDOWN OUTPUT] Raw markdown returned');
    console.log('📤 [TURNDOWN OUTPUT] Raw markdown type:', typeof rawMarkdown);
    console.log('📤 [TURNDOWN OUTPUT] Raw markdown length:', rawMarkdown ? rawMarkdown.length : 'N/A');
    console.log('📤 [TURNDOWN OUTPUT] Raw markdown is empty?', rawMarkdown === '');
    
    if (rawMarkdown && rawMarkdown.length > 0) {
      console.log('📤 [TURNDOWN OUTPUT] Raw markdown preview:', rawMarkdown.substring(0, 300) + '...');
      console.log('📤 [TURNDOWN OUTPUT] Raw markdown has headers?', rawMarkdown.includes('#'));
      console.log('📤 [TURNDOWN OUTPUT] Raw markdown has bold?', rawMarkdown.includes('**'));
      console.log('📤 [TURNDOWN OUTPUT] Raw markdown has links?', rawMarkdown.includes('['));
    } else {
      console.log('⚠️ [TURNDOWN OUTPUT] Raw markdown is empty - running diagnostic test...');
      
      // Try with simple HTML to test turndown
      const testHTML = '<h1>Test Header</h1><p>Test paragraph with <strong>bold</strong> text.</p>';
      const testResult = turndownService.turndown(testHTML);
      console.log('🧪 [TURNDOWN TEST] Simple test input:', testHTML);
      console.log('🧪 [TURNDOWN TEST] Simple test output:', testResult);
      
      // Check if turndown service is properly configured
      console.log('🔍 [TURNDOWN DEBUG] globalThis.document exists?', typeof globalThis.document !== 'undefined');
      console.log('🔍 [TURNDOWN DEBUG] DOMParser exists?', typeof globalThis.DOMParser !== 'undefined');
      console.log('🔍 [TURNDOWN DEBUG] TurndownService options:', turndownService.options);
      console.log('🔍 [TURNDOWN DEBUG] TurndownService rules count:', Object.keys(turndownService.rules).length);
    }
  } catch (error) {
    console.error('❌ [TURNDOWN ERROR] Error in turndownService.turndown():', error);
    console.error('❌ [TURNDOWN ERROR] Error stack:', error.stack);
    rawMarkdown = '';
  }
  
  console.log('🔄 [FINAL PROCESSING] Adding frontmatter and backmatter...');
  console.log('🔄 [FINAL PROCESSING] Frontmatter length:', options.frontmatter ? options.frontmatter.length : 0);
  console.log('🔄 [FINAL PROCESSING] Backmatter length:', options.backmatter ? options.backmatter.length : 0);
  
  let markdown = options.frontmatter + rawMarkdown + options.backmatter;

  // strip out non-printing special characters which CodeMirror displays as a red dot
  // see: https://codemirror.net/doc/manual.html#option_specialChars
  markdown = markdown.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g, '');
  
  console.log('✅ [FINAL OUTPUT] Markdown processing complete');
  console.log('✅ [FINAL OUTPUT] Final markdown length:', markdown ? markdown.length : 'N/A');
  console.log('✅ [FINAL OUTPUT] Final markdown preview:', markdown ? markdown.substring(0, 400) + '...' : 'N/A');
  console.log('✅ [FINAL OUTPUT] Final markdown has headers?', markdown ? markdown.includes('#') : false);
  console.log('✅ [FINAL OUTPUT] Final markdown has bold?', markdown ? markdown.includes('**') : false);
  console.log('✅ [FINAL OUTPUT] Final markdown has links?', markdown ? markdown.includes('[') : false);
  console.log('✅ [FINAL OUTPUT] Image list count:', imageList ? Object.keys(imageList).length : 0);
  console.log('═══════════════════ TURNDOWN CONVERSION END ═══════════════════');
  
  return { markdown: markdown, imageList: imageList };
}

function cleanAttribute(attribute) {
  return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : ''
}

function validateUri(href, baseURI) {
  // check if the href is a valid url
  try {
    new URL(href);
  }
  catch {
    // if it's not a valid url, that likely means we have to prepend the base uri
    const baseUri = new URL(baseURI);

    // if the href starts with '/', we need to go from the origin
    if (href.startsWith('/')) {
      href = baseUri.origin + href
    }
    // otherwise we need to go from the local folder
    else {
      href = baseUri.href + (baseUri.href.endsWith('/') ? '/' : '') + href
    }
  }
  return href;
}

function getImageFilename(src, options, prependFilePath = true) {
  const slashPos = src.lastIndexOf('/');
  const queryPos = src.indexOf('?');
  let filename = src.substring(slashPos + 1, queryPos > 0 ? queryPos : src.length);

  let imagePrefix = (options.imagePrefix || '');

  if (prependFilePath && options.title.includes('/')) {
    imagePrefix = options.title.substring(0, options.title.lastIndexOf('/') + 1) + imagePrefix;
  }
  else if (prependFilePath) {
    imagePrefix = options.title + (imagePrefix.startsWith('/') ? '' : '/') + imagePrefix
  }
  
  if (filename.includes(';base64,')) {
    // this is a base64 encoded image, so what are we going to do for a filename here?
    filename = 'image.' + filename.substring(0, filename.indexOf(';'));
  }
  
  let extension = filename.substring(filename.lastIndexOf('.'));
  if (extension == filename) {
    // there is no extension, so we need to figure one out
    // for now, give it an 'idunno' extension and we'll process it later
    filename = filename + '.idunno';
  }

  filename = generateValidFileName(filename, options.disallowedChars);

  return imagePrefix + filename;
}

// function to replace placeholder strings with article info
function textReplace(string, article, disallowedChars = null) {
  for (const key in article) {
    if (article.hasOwnProperty(key) && key != "content") {
      let s = (article[key] || '') + '';
      if (s && disallowedChars) s = this.generateValidFileName(s, disallowedChars);

      string = string.replace(new RegExp('{' + key + '}', 'g'), s)
        .replace(new RegExp('{' + key + ':lower}', 'g'), s.toLowerCase())
        .replace(new RegExp('{' + key + ':upper}', 'g'), s.toUpperCase())
        .replace(new RegExp('{' + key + ':kebab}', 'g'), s.replace(/ /g, '-').toLowerCase())
        .replace(new RegExp('{' + key + ':mixed-kebab}', 'g'), s.replace(/ /g, '-'))
        .replace(new RegExp('{' + key + ':snake}', 'g'), s.replace(/ /g, '_').toLowerCase())
        .replace(new RegExp('{' + key + ':mixed_snake}', 'g'), s.replace(/ /g, '_'))
        // For Obsidian Custom Attachment Location plugin, we need to replace spaces with hyphens, but also remove any double hyphens.
        .replace(new RegExp('{' + key + ':obsidian-cal}', 'g'), s.replace(/ /g, '-').replace(/-{2,}/g, "-"))
        .replace(new RegExp('{' + key + ':camel}', 'g'), s.replace(/ ./g, (str) => str.trim().toUpperCase()).replace(/^./, (str) => str.toLowerCase()))
        .replace(new RegExp('{' + key + ':pascal}', 'g'), s.replace(/ ./g, (str) => str.trim().toUpperCase()).replace(/^./, (str) => str.toUpperCase()))
    }
  }

  // replace date formats
  const now = new Date();
  const dateRegex = /{date:(.+?)}/g
  const matches = string.match(dateRegex);
  if (matches && matches.forEach) {
    matches.forEach(match => {
      const format = match.substring(6, match.length - 1);
      const dateString = moment(now).format(format);
      string = string.replaceAll(match, dateString);
    });
  }

  // replace keywords
  const keywordRegex = /{keywords:?(.*)?}/g
  const keywordMatches = string.match(keywordRegex);
  if (keywordMatches && keywordMatches.forEach) {
    keywordMatches.forEach(match => {
      let seperator = match.substring(10, match.length - 1)
      try {
        seperator = JSON.parse(JSON.stringify(seperator).replace(/\\\\/g, '\\'));
      }
      catch { }
      const keywordsString = (article.keywords || []).join(seperator);
      string = string.replace(new RegExp(match.replace(/\\/g, '\\\\'), 'g'), keywordsString);
    })
  }

  // replace anything left in curly braces
  const defaultRegex = /{(.*?)}/g
  string = string.replace(defaultRegex, '')

  return string;
}

// function to convert an article info object into markdown
async function convertArticleToMarkdown(article, downloadImages = null) {
  console.log('🔧 [MarkDownload] convertArticleToMarkdown: Starting conversion');
  console.log('🔧 [MarkDownload] convertArticleToMarkdown: Input article:', {
    title: article.title,
    hasContent: !!article.content,
    contentLength: article.content ? article.content.length : 'N/A'
  });
  
  const options = await getOptions();
  console.log('🔧 [MarkDownload] convertArticleToMarkdown: Got options:', Object.keys(options));
  
  if (downloadImages != null) {
    options.downloadImages = downloadImages;
    console.log('🔧 [MarkDownload] convertArticleToMarkdown: Override downloadImages to:', downloadImages);
  }

  // substitute front and backmatter templates if necessary
  if (options.includeTemplate) {
    options.frontmatter = textReplace(options.frontmatter, article) + '\n';
    options.backmatter = '\n' + textReplace(options.backmatter, article);
  }
  else {
    options.frontmatter = options.backmatter = '';
  }

  options.imagePrefix = textReplace(options.imagePrefix, article, options.disallowedChars)
    .split('/').map(s=>generateValidFileName(s, options.disallowedChars)).join('/');

  console.log('🎯 [MAIN CONVERSION] Starting turndown conversion...');
  console.log('🎯 [MAIN CONVERSION] Article content being sent to turndown:');
  console.log('🎯 [MAIN CONVERSION] - Content length:', article.content ? article.content.length : 'N/A');
  console.log('🎯 [MAIN CONVERSION] - Content preview:', article.content ? article.content.substring(0, 200) + '...' : 'N/A');
  
  let result = turndown(article.content, options, article);
  
  console.log('🎯 [MAIN CONVERSION] Turndown conversion completed!');
  console.log('🎯 [MAIN CONVERSION] Conversion results summary:');
  console.log('🎯 [MAIN CONVERSION] - Has markdown:', !!result.markdown);
  console.log('🎯 [MAIN CONVERSION] - Markdown length:', result.markdown ? result.markdown.length : 'N/A');
  console.log('🎯 [MAIN CONVERSION] - Image count:', result.imageList ? Object.keys(result.imageList).length : 'N/A');
  console.log('🎯 [MAIN CONVERSION] - Markdown preview:', result.markdown ? result.markdown.substring(0, 200) + '...' : 'N/A');
  
  if (options.downloadImages && options.downloadMode == 'downloadsApi') {
    console.log('🔧 [MarkDownload] convertArticleToMarkdown: Pre-downloading images...');
    // pre-download the images
    result = await preDownloadImages(result.imageList, result.markdown);
    console.log('🔧 [MarkDownload] convertArticleToMarkdown: Images pre-download complete');
  }
  
  console.log('🔧 [MarkDownload] convertArticleToMarkdown: Final result ready');
  return result;
}

// function to turn the title into a valid file name
function generateValidFileName(title, disallowedChars = null) {
  if (!title) return title;
  else title = title + '';
  // remove < > : " / \ | ? * 
  var illegalRe = /[\/\?<>\\:\*\|":]/g;
  // and non-breaking spaces (thanks @Licat)
  var name = title.replace(illegalRe, "").replace(new RegExp('\u00A0', 'g'), ' ')
      // collapse extra whitespace
      .replace(new RegExp(/\s+/, 'g'), ' ')
      // remove leading/trailing whitespace that can cause issues when using {pageTitle} in a download path
      .trim();

  if (disallowedChars) {
    for (let c of disallowedChars) {
      if (`[\\^$.|?*+()`.includes(c)) c = `\\${c}`;
      name = name.replace(new RegExp(c, 'g'), '');
    }
  }
  
  return name;
}

async function preDownloadImages(imageList, markdown) {
  const options = await getOptions();
  let newImageList = {};
  // originally, I was downloading the markdown file first, then all the images
  // however, in some cases we need to download images *first* so we can get the
  // proper file extension to put into the markdown.
  // so... here we are waiting for all the downloads and replacements to complete
  await Promise.all(Object.entries(imageList).map(([src, filename]) => new Promise((resolve, reject) => {
        // we're doing an xhr so we can get it as a blob and determine filetype
        // before the final save
        const xhr = new XMLHttpRequest();
        xhr.open('GET', src);
        xhr.responseType = "blob";
        xhr.onload = async function () {
          // here's the returned blob
          const blob = xhr.response;

          if (options.imageStyle == 'base64') {
            var reader = new FileReader();
            reader.onloadend = function () {
              markdown = markdown.replaceAll(src, reader.result)
              resolve()
            }
            reader.readAsDataURL(blob);
          }
          else {

            let newFilename = filename;
            if (newFilename.endsWith('.idunno')) {
              // replace any unknown extension with a lookup based on mime type
              newFilename = filename.replace('.idunno', '.' + mimedb[blob.type]);

              // and replace any instances of this in the markdown
              // remember to url encode for replacement if it's not an obsidian link
              if (!options.imageStyle.startsWith("obsidian")) {
                markdown = markdown.replaceAll(filename.split('/').map(s => encodeURI(s)).join('/'), newFilename.split('/').map(s => encodeURI(s)).join('/'))
              }
              else {
                markdown = markdown.replaceAll(filename, newFilename)
              }
            }

            // create an object url for the blob (no point fetching it twice)
            const blobUrl = URL.createObjectURL(blob);

            // add this blob into the new image list
            newImageList[blobUrl] = newFilename;

            // resolve this promise now
            // (the file might not be saved yet, but the blob is and replacements are complete)
            resolve();
          }
        };
        xhr.onerror = function () {
          reject('A network error occurred attempting to download ' + src);
        };
        xhr.send();
  })));

  return { imageList: newImageList, markdown: markdown };
}

// function to actually download the markdown file
async function downloadMarkdown(markdown, title, tabId, imageList = {}, mdClipsFolder = '') {
  // get the options
  const options = await getOptions();
  
  // download via the downloads API
  if (options.downloadMode == 'downloadsApi' && browser.downloads) {
    
    // create the object url with markdown data as a blob
    const url = URL.createObjectURL(new Blob([markdown], {
      type: "text/markdown;charset=utf-8"
    }));
  
    try {

      if(mdClipsFolder && !mdClipsFolder.endsWith('/')) mdClipsFolder += '/';
      // start the download
      const id = await browser.downloads.download({
        url: url,
        filename: mdClipsFolder + title + ".md",
        saveAs: options.saveAs
      });

      // add a listener for the download completion
      browser.downloads.onChanged.addListener(downloadListener(id, url));

      // download images (if enabled)
      if (options.downloadImages) {
        // get the relative path of the markdown file (if any) for image path
        let destPath = mdClipsFolder + title.substring(0, title.lastIndexOf('/'));
        if(destPath && !destPath.endsWith('/')) destPath += '/';
        Object.entries(imageList).forEach(async ([src, filename]) => {
          // start the download of the image
          const imgId = await browser.downloads.download({
            url: src,
            // set a destination path (relative to md file)
            filename: destPath ? destPath + filename : filename,
            saveAs: false
          })
          // add a listener (so we can release the blob url)
          browser.downloads.onChanged.addListener(downloadListener(imgId, src));
        });
      }
    }
    catch (err) {
      console.error("Download failed", err);
    }
  }
  // // download via obsidian://new uri
  // else if (options.downloadMode == 'obsidianUri') {
  //   try {
  //     await ensureScripts(tabId);
  //     let uri = 'obsidian://new?';
  //     uri += `${options.obsidianPathType}=${encodeURIComponent(title)}`;
  //     if (options.obsidianVault) uri += `&vault=${encodeURIComponent(options.obsidianVault)}`;
  //     uri += `&content=${encodeURIComponent(markdown)}`;
  //     let code = `window.location='${uri}'`;
  //     await browser.tabs.executeScript(tabId, {code: code});
  //   }
  //   catch (error) {
  //     // This could happen if the extension is not allowed to run code in
  //     // the page, for example if the tab is a privileged page.
  //     console.error("Failed to execute script: " + error);
  //   };
    
  // }
  // download via content link
  else {
    try {
      await ensureScripts(tabId);
      const filename = mdClipsFolder + generateValidFileName(title, options.disallowedChars) + ".md";
      const code = `downloadMarkdown("${filename}","${base64EncodeUnicode(markdown)}");`
      await browser.tabs.executeScript(tabId, {code: code});
    }
    catch (error) {
      // This could happen if the extension is not allowed to run code in
      // the page, for example if the tab is a privileged page.
      console.error("Failed to execute script: " + error);
    };
  }
}

function downloadListener(id, url) {
  const self = (delta) => {
    if (delta.id === id && delta.state && delta.state.current == "complete") {
      // detatch this listener
      browser.downloads.onChanged.removeListener(self);
      //release the url for the blob
      URL.revokeObjectURL(url);
    }
  }
  return self;
}

function base64EncodeUnicode(str) {
  // Firstly, escape the string using encodeURIComponent to get the UTF-8 encoding of the characters, 
  // Secondly, we convert the percent encodings into raw bytes, and add it to btoa() function.
  const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
    return String.fromCharCode('0x' + p1);
  });

  return btoa(utf8Bytes);
}

//function that handles messages from the injected script into the site
async function notify(message) {
  console.log('🔧 [MarkDownload] Background: notify called with message:', message.type, message);
  const options = await this.getOptions();
  console.log('🔧 [MarkDownload] Background: Got options in notify');
  // message for initial clipping of the dom
  if (message.type == "clip") {
    console.log('🔧 [MarkDownload] Background: Processing clip message');
    console.log('🔧 [MarkDownload] Background: Clip message details:', {
      hasDOM: !!message.dom,
      domLength: message.dom ? message.dom.length : 'N/A',
      hasSelection: !!message.selection,
      clipSelection: message.clipSelection,
      messageKeys: Object.keys(message)
    });
    
    if (!message.dom) {
      console.error('❌ [MarkDownload] Background: No DOM content in clip message');
      return { error: 'No DOM content provided' };
    }
    
    try {
      // get the article info from the passed in dom
      console.log('🔧 [MarkDownload] Background: Calling getArticleFromDom...');
      const article = await getArticleFromDom(message.dom);
      console.log('🔧 [MarkDownload] Background: Article extracted successfully');
      console.log('🔧 [MarkDownload] Background: Article details:', {
        title: article.title,
        hasContent: !!article.content,
        contentLength: article.content ? article.content.length : 'N/A',
        baseURI: article.baseURI
      });

      // if selection info was passed in (and we're to clip the selection)
      // replace the article content
      if (message.selection && message.clipSelection) {
        console.log('🔧 [MarkDownload] Background: Using selection content instead of full article');
        console.log('🔧 [MarkDownload] Background: Selection length:', message.selection.length);
        article.content = message.selection;
      }
      
      // convert the article to markdown
      console.log('🔧 [MarkDownload] Background: Converting to markdown...');
      console.log('🔧 [MarkDownload] Background: Article content length before conversion:', article.content ? article.content.length : 'N/A');
      const { markdown, imageList } = await convertArticleToMarkdown(article);
      console.log('🔧 [MarkDownload] Background: Markdown conversion complete');
      console.log('🔧 [MarkDownload] Background: Markdown details:', {
        markdownLength: markdown ? markdown.length : 'N/A',
        imageCount: imageList ? Object.keys(imageList).length : 'N/A',
        markdownPreview: markdown ? markdown.substring(0, 200) + '...' : 'N/A'
      });

      // format the title
      const originalTitle = article.title;
      article.title = await formatTitle(article);
      console.log('🔧 [MarkDownload] Background: Title formatting:', {
        original: originalTitle,
        formatted: article.title
      });

      // format the mdClipsFolder
      const mdClipsFolder = await formatMdClipsFolder(article);
      console.log('🔧 [MarkDownload] Background: mdClipsFolder:', mdClipsFolder);

      // display the data in the popup
      const displayMessage = { 
        type: "display.md", 
        markdown: markdown, 
        article: article, 
        imageList: imageList, 
        mdClipsFolder: mdClipsFolder
      };
      console.log('🔧 [MarkDownload] Background: Preparing display.md message');
      console.log('🔧 [MarkDownload] Background: Display message details:', {
        type: displayMessage.type,
        hasMarkdown: !!displayMessage.markdown,
        markdownLength: displayMessage.markdown ? displayMessage.markdown.length : 'N/A',
        hasArticle: !!displayMessage.article,
        articleTitle: displayMessage.article ? displayMessage.article.title : 'N/A'
      });
      
      console.log('🔧 [MarkDownload] Background: Sending display.md message to popup...');
      const sendResult = await browser.runtime.sendMessage(displayMessage);
      console.log('🔧 [MarkDownload] Background: display.md message sent, result:', sendResult);
      
      return { success: true };
    } catch (error) {
      console.error('❌ [MarkDownload] Background: Error in clip processing:', error);
      console.error('❌ [MarkDownload] Background: Error stack:', error.stack);
      return { error: error.message };
    }
  }
  // message for triggering download
  else if (message.type == "download") {
    console.log('🔧 [MarkDownload] Background: Processing download message');
    downloadMarkdown(message.markdown, message.title, message.tab.id, message.imageList, message.mdClipsFolder);
  }
}

browser.commands.onCommand.addListener(function (command) {
  const tab = browser.tabs.getCurrent()
  if (command == "download_tab_as_markdown") {
    const info = { menuItemId: "download-markdown-all" };
    downloadMarkdownFromContext(info, tab);
  }
  else if (command == "copy_tab_as_markdown") {
    const info = { menuItemId: "copy-markdown-all" };
    copyMarkdownFromContext(info, tab);
  }
  else if (command == "copy_selection_as_markdown") {
    const info = { menuItemId: "copy-markdown-selection" };
    copyMarkdownFromContext(info, tab);
  }
  else if (command == "copy_tab_as_markdown_link") {
    copyTabAsMarkdownLink(tab);
  }
  else if (command == "copy_selected_tab_as_markdown_link") {
    copySelectedTabAsMarkdownLink(tab);
  }
  else if (command == "copy_selection_to_obsidian") {
    const info = { menuItemId: "copy-markdown-obsidian" };
    copyMarkdownFromContext(info, tab);
  }
  else if (command == "copy_tab_to_obsidian") {
    const info = { menuItemId: "copy-markdown-obsall" };
    copyMarkdownFromContext(info, tab);
  }
});

// click handler for the context menus
browser.contextMenus.onClicked.addListener(function (info, tab) {
  // one of the copy to clipboard commands
  if (info.menuItemId.startsWith("copy-markdown")) {
    copyMarkdownFromContext(info, tab);
  }
  else if (info.menuItemId == "download-markdown-alltabs" || info.menuItemId == "tab-download-markdown-alltabs") {
    downloadMarkdownForAllTabs(info);
  }
  // one of the download commands
  else if (info.menuItemId.startsWith("download-markdown")) {
    downloadMarkdownFromContext(info, tab);
  }
  // copy tab as markdown link
  else if (info.menuItemId.startsWith("copy-tab-as-markdown-link-all")) {
    copyTabAsMarkdownLinkAll(tab);
  }
  // copy only selected tab as markdown link
  else if (info.menuItemId.startsWith("copy-tab-as-markdown-link-selected")) {
    copySelectedTabAsMarkdownLink(tab);
  }
  else if (info.menuItemId.startsWith("copy-tab-as-markdown-link")) {
    copyTabAsMarkdownLink(tab);
  }
  // a settings toggle command
  else if (info.menuItemId.startsWith("toggle-") || info.menuItemId.startsWith("tabtoggle-")) {
    toggleSetting(info.menuItemId.split('-')[1]);
  }
});

// this function toggles the specified option
async function toggleSetting(setting, options = null) {
  // if there's no options object passed in, we need to go get one
  if (options == null) {
      // get the options from storage and toggle the setting
      await toggleSetting(setting, await getOptions());
  }
  else {
    // toggle the option and save back to storage
    options[setting] = !options[setting];
    await browser.storage.sync.set(options);
    if (setting == "includeTemplate") {
      browser.contextMenus.update("toggle-includeTemplate", {
        checked: options.includeTemplate
      });
      try {
        browser.contextMenus.update("tabtoggle-includeTemplate", {
          checked: options.includeTemplate
        });
      } catch { }
    }
    
    if (setting == "downloadImages") {
      browser.contextMenus.update("toggle-downloadImages", {
        checked: options.downloadImages
      });
      try {
        browser.contextMenus.update("tabtoggle-downloadImages", {
          checked: options.downloadImages
        });
      } catch { }
    }
  }
}

// this function ensures the content script is loaded (and loads it if it isn't)
async function ensureScripts(tabId) {
  const results = await browser.tabs.executeScript(tabId, { code: "typeof getSelectionAndDom === 'function';" })
  // The content script's last expression will be true if the function
  // has been defined. If this is not the case, then we need to run
  // pageScraper.js to define function getSelectionAndDom.
  if (!results || results[0] !== true) {
    await browser.tabs.executeScript(tabId, {file: "/contentScript/contentScript.js"});
  }
}

// get Readability article info from the dom passed in
async function getArticleFromDom(domString) {
  console.log('🔧 [MarkDownload] getArticleFromDom: Starting DOM processing');
  console.log('🔧 [MarkDownload] getArticleFromDom: DOM string length:', domString ? domString.length : 'N/A');
  
  if (!domString) {
    console.error('❌ [MarkDownload] getArticleFromDom: Empty DOM string provided');
    throw new Error('Empty DOM string provided');
  }
  
  // parse the dom - use a polyfill for Service Worker environment
  let dom;
  try {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      dom = parser.parseFromString(domString, "text/html");
    } else {
      // Fallback for Service Worker environment
      console.log('🔧 [MarkDownload] getArticleFromDom: Using fallback DOM parsing for Service Worker');
      console.log('🔧 [MarkDownload] DOM content length:', domString.length);
      // Create a simple DOM-like structure
      const createMockElementList = (tagName) => {
        // Return a basic array-like object for getElementsByTagName
        if (tagName.toLowerCase() === 'noscript') {
          return []; // Return empty array for noscript elements
        }
        return [];
      };

      // Enhanced mock element creator with more DOM methods
      const createMockElement = (tagName, innerHTML = '') => {
        const element = {
          nodeName: tagName.toUpperCase(),
          tagName: tagName.toUpperCase(),
          nodeType: 1, // ELEMENT_NODE
          innerHTML: innerHTML,
          textContent: innerHTML.replace(/<[^>]*>/g, ''),
          className: '',
          id: '',
          attributes: {},
          childNodes: [],
          parentNode: null,
          nextSibling: null,
          previousSibling: null,
          style: {},
          
          // DOM properties
          get children() {
            // Return only element nodes (nodeType === 1), not text nodes
            return this.childNodes.filter(child => child.nodeType === 1);
          },
          
          get firstElementChild() {
            const elementChildren = this.children;
            return elementChildren.length > 0 ? elementChildren[0] : null;
          },
          
          get lastElementChild() {
            const elementChildren = this.children;
            return elementChildren.length > 0 ? elementChildren[elementChildren.length - 1] : null;
          },
          
          get nextElementSibling() {
            if (!this.parentNode) return null;
            const siblings = this.parentNode.children;
            const index = siblings.indexOf(this);
            return index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;
          },
          
          get previousElementSibling() {
            if (!this.parentNode) return null;
            const siblings = this.parentNode.children;
            const index = siblings.indexOf(this);
            return index > 0 ? siblings[index - 1] : null;
          },
          
          // DOM methods
          appendChild: function(child) {
            this.childNodes.push(child);
            child.parentNode = this;
            return child;
          },
          removeChild: function(child) {
            const index = this.childNodes.indexOf(child);
            if (index > -1) {
              this.childNodes.splice(index, 1);
              child.parentNode = null;
            }
            return child;
          },
          setAttribute: function(name, value) {
            this.attributes[name] = value;
            if (name === 'id') this.id = value;
            if (name === 'class') this.className = value;
          },
          getAttribute: function(name) {
            return this.attributes[name] || null;
          },
          hasAttribute: function(name) {
            return name in this.attributes;
          },
          removeAttribute: function(name) {
            delete this.attributes[name];
            if (name === 'id') this.id = '';
            if (name === 'class') this.className = '';
          },
          querySelector: function() { return null; },
          querySelectorAll: function() { return []; },
          getElementsByTagName: createMockElementList,
          cloneNode: function(deep) {
            const clone = createMockElement(this.tagName, this.innerHTML);
            clone.className = this.className;
            clone.id = this.id;
            clone.attributes = { ...this.attributes };
            return clone;
          }
        };
        return element;
      };

      // Enhanced document element using createMockElement
      const documentElement = createMockElement('HTML');
      documentElement.firstChild = { __JSDOMParser__: undefined };

      // Enhanced body element with actual child structure
      const bodyElement = createMockElement('BODY', domString);
      
      // Create a simple but effective DOM structure for Readability
      console.log('🔧 [MarkDownload] Creating simplified DOM structure for Readability...');
      try {
        // Clear body children and create a main article container
        bodyElement.childNodes = [];
        
        // Create a main article container - Readability likes article tags
        const articleContainer = createMockElement('ARTICLE');
        articleContainer.setAttribute('id', 'main-content');
        articleContainer.setAttribute('class', 'post-content');
        
        // Extract text content and create paragraphs
        const textContent = domString.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log('🔧 [MarkDownload] Extracted text content length:', textContent.length);
        
        if (textContent && textContent.length > 100) {
          // Split into paragraphs based on sentence boundaries or line breaks
          const paragraphs = textContent.split(/[.!?]\s+(?=[A-Z])|[\n\r]+/).filter(p => p.trim().length > 20);
          console.log('🔧 [MarkDownload] Created', paragraphs.length, 'paragraphs');
          
          paragraphs.slice(0, 10).forEach((paraText, index) => { // Limit to first 10 paragraphs
            const para = createMockElement('P');
            const textNode = { 
              nodeType: 3, 
              nodeName: '#text', 
              textContent: paraText.trim(), 
              nodeValue: paraText.trim(), 
              parentNode: para 
            };
            para.childNodes.push(textNode);
            para.parentNode = articleContainer;
            articleContainer.childNodes.push(para);
          });
          
          // If we have few paragraphs, create more by splitting longer ones
          if (articleContainer.childNodes.length < 3 && textContent.length > 500) {
            const chunks = textContent.match(/.{1,200}(?:\s|$)/g) || [textContent];
            chunks.slice(0, 5).forEach(chunk => {
              const para = createMockElement('P');
              const textNode = { 
                nodeType: 3, 
                nodeName: '#text', 
                textContent: chunk.trim(), 
                nodeValue: chunk.trim(), 
                parentNode: para 
              };
              para.childNodes.push(textNode);
              para.parentNode = articleContainer;
              articleContainer.childNodes.push(para);
            });
          }
        } else {
          // Fallback: create a single paragraph with all content
          const para = createMockElement('P');
          const textNode = { 
            nodeType: 3, 
            nodeName: '#text', 
            textContent: textContent || 'No content available', 
            nodeValue: textContent || 'No content available', 
            parentNode: para 
          };
          para.childNodes.push(textNode);
          para.parentNode = articleContainer;
          articleContainer.childNodes.push(para);
        }
        
        // Add the article container to body
        articleContainer.parentNode = bodyElement;
        bodyElement.childNodes.push(articleContainer);
        
        console.log('🔧 [MarkDownload] Final DOM structure - Body children:', bodyElement.childNodes.length, 
                   'Article children:', articleContainer.childNodes.length);
        
      } catch (parseError) {
        console.error('🔧 [MarkDownload] Error creating DOM structure:', parseError);
        // Fallback: ensure we have at least some content
        if (bodyElement.childNodes.length === 0) {
          const fallbackPara = createMockElement('P');
          const textContent = domString.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const textNode = { 
            nodeType: 3, 
            nodeName: '#text', 
            textContent: textContent.substring(0, 1000), 
            nodeValue: textContent.substring(0, 1000), 
            parentNode: fallbackPara 
          };
          fallbackPara.childNodes.push(textNode);
          fallbackPara.parentNode = bodyElement;
          bodyElement.childNodes.push(fallbackPara);
        }
      }
      
      dom = {
        documentElement: documentElement,
        // Add firstChild to root document object for Readability
        firstChild: {
          __JSDOMParser__: undefined
        },
        body: bodyElement,
        title: "Extracted Content",
        baseURI: "about:blank",  // Add baseURI to prevent URL construction error
        // Add getElementsByTagName to root document
        getElementsByTagName: createMockElementList,
        // Add more DOM methods
        createElement: (tagName) => createMockElement(tagName),
        createTextNode: (text) => ({
          nodeType: 3,
          nodeName: '#text',
          textContent: text,
          nodeValue: text,
          parentNode: null
        }),
        // Add more document methods
        getElementById: (id) => null,
        getElementsByClassName: (className) => [],
        querySelector: () => null,
        querySelectorAll: () => []
      };
    }
  } catch (error) {
    console.error('❌ [MarkDownload] getArticleFromDom: Error parsing DOM:', error);
    throw new Error('DOM parsing failed: ' + error.message);
  }

  if (dom.documentElement.nodeName == "parsererror") {
    console.error("❌ [MarkDownload] getArticleFromDom: Error while parsing DOM");
    console.error("❌ [MarkDownload] getArticleFromDom: Parser error details:", dom.documentElement.textContent);
    throw new Error('DOM parsing failed');
  }
  
  console.log('🔧 [MarkDownload] getArticleFromDom: DOM parsed successfully');
  console.log('🔧 [MarkDownload] getArticleFromDom: Document title:', dom.title);
  console.log('🔧 [MarkDownload] getArticleFromDom: Body content length:', dom.body ? dom.body.innerHTML.length : 'N/A');

  const math = {};

  const storeMathInfo = (el, mathInfo) => {
    let randomId = URL.createObjectURL(new Blob([]));
    randomId = randomId.substring(randomId.length - 36);
    el.id = randomId;
    math[randomId] = mathInfo;
  };

  dom.body.querySelectorAll('script[id^=MathJax-Element-]')?.forEach(mathSource => {
    const type = mathSource.attributes.type.value
    storeMathInfo(mathSource, {
      tex: mathSource.innerText,
      inline: type ? !type.includes('mode=display') : false
    });
  });

  dom.body.querySelectorAll('[markdownload-latex]')?.forEach(mathJax3Node =>  {
    const tex = mathJax3Node.getAttribute('markdownload-latex')
    const display = mathJax3Node.getAttribute('display')
    const inline = !(display && display === 'true')

    const mathNode = document.createElement(inline ? "i" : "p")
    mathNode.textContent = tex;
    mathJax3Node.parentNode.insertBefore(mathNode, mathJax3Node.nextSibling)
    mathJax3Node.parentNode.removeChild(mathJax3Node)

    storeMathInfo(mathNode, {
      tex: tex,
      inline: inline
    });
  });

  dom.body.querySelectorAll('.katex-mathml')?.forEach(kaTeXNode => {
    storeMathInfo(kaTeXNode, {
      tex: kaTeXNode.querySelector('annotation').textContent,
      inline: true
    });
  });

  dom.body.querySelectorAll('[class*=highlight-text],[class*=highlight-source]')?.forEach(codeSource => {
    const language = codeSource.className.match(/highlight-(?:text|source)-([a-z0-9]+)/)?.[1]
    if (codeSource.firstChild.nodeName == "PRE") {
      codeSource.firstChild.id = `code-lang-${language}`
    }
  });

  dom.body.querySelectorAll('[class*=language-]')?.forEach(codeSource => {
    const language = codeSource.className.match(/language-([a-z0-9]+)/)?.[1]
    codeSource.id = `code-lang-${language}`;
  });

  dom.body.querySelectorAll('pre br')?.forEach(br => {
    // we need to keep <br> tags because they are removed by Readability.js
    br.outerHTML = '<br-keep></br-keep>';
  });

  dom.body.querySelectorAll('.codehilite > pre')?.forEach(codeSource => {
    if (codeSource.firstChild.nodeName !== 'CODE' && !codeSource.className.includes('language')) {
      codeSource.id = `code-lang-text`;
    }
  });

  dom.body.querySelectorAll('h1, h2, h3, h4, h5, h6')?.forEach(header => {
    // Readability.js will strip out headings from the dom if certain words appear in their className
    // See: https://github.com/mozilla/readability/issues/807  
    header.className = '';
    header.outerHTML = header.outerHTML;  
  });

  // Prevent Readability from removing the <html> element if has a 'class' attribute
  // which matches removal criteria.
  // Note: The document element is guaranteed to be the HTML tag because the 'text/html'
  // mime type was used when the DOM was created.
  dom.documentElement.removeAttribute('class')

  // simplify the dom into an article
  console.log('🔧 [MarkDownload] getArticleFromDom: Starting Readability processing...');
  
  let article;
  try {
    if (typeof Readability !== 'undefined' && dom.documentElement && dom.body) {
      // Create custom serializer for Service Worker environment
      const customSerializer = function(el) {
        console.log('🔧 [MarkDownload] Custom serializer called for element:', el.nodeName);
        
        // If it's our mock element, return the original HTML content
        if (el && el.innerHTML && typeof el.innerHTML === 'string') {
          console.log('🔧 [MarkDownload] Custom serializer returning innerHTML length:', el.innerHTML.length);
          return el.innerHTML;
        }
        
        // If it's a mock element without innerHTML, construct HTML from structure
        if (el && el.childNodes) {
          console.log('🔧 [MarkDownload] Custom serializer constructing HTML from childNodes');
          let html = '';
          
          const serializeNode = (node) => {
            if (node.nodeType === 3) { // Text node
              return node.textContent || node.nodeValue || '';
            } else if (node.nodeType === 1) { // Element node
              const tagName = node.nodeName.toLowerCase();
              let attrs = '';
              
              // Add attributes
              if (node.id) attrs += ` id="${node.id}"`;
              if (node.className) attrs += ` class="${node.className}"`;
              if (node.getAttribute) {
                const href = node.getAttribute('href');
                if (href) attrs += ` href="${href}"`;
              }
              
              // Self-closing tags
              if (['img', 'br', 'hr'].includes(tagName)) {
                return `<${tagName}${attrs} />`;
              }
              
              // Container tags
              let childContent = '';
              if (node.childNodes && node.childNodes.length > 0) {
                childContent = node.childNodes.map(serializeNode).join('');
              } else if (node.textContent) {
                childContent = node.textContent;
              }
              
              return `<${tagName}${attrs}>${childContent}</${tagName}>`;
            }
            return '';
          };
          
          html = serializeNode(el);
          console.log('🔧 [MarkDownload] Custom serializer constructed HTML length:', html.length);
          return html;
        }
        
        // Fallback
        console.warn('🔧 [MarkDownload] Custom serializer fallback - returning original innerHTML or empty');
        return el ? (el.innerHTML || '') : '';
      };
      
      // Initialize Readability with custom serializer and debug options
      console.log('🔧 [MarkDownload] Initializing Readability with DOM:', {
        hasDocumentElement: !!dom.documentElement,
        hasBody: !!dom.body,
        bodyChildrenCount: dom.body ? dom.body.childNodes.length : 'N/A',
        documentElementChildrenCount: dom.documentElement ? dom.documentElement.childNodes.length : 'N/A'
      });
      
      const readability = new Readability(dom, { 
        serializer: customSerializer,
        debug: true // Enable debug logging
      });
      
      console.log('🔧 [MarkDownload] Calling Readability.parse()...');
      article = readability.parse();
      console.log('🔧 [MarkDownload] Readability.parse() returned:', article ? 'success' : 'null');
      
      // If Readability failed, create article with smart content extraction
      if (!article) {
        console.log('🔧 [MarkDownload] Readability failed, performing smart content extraction...');
        
        // Smart content extraction function
        const extractMainContent = (htmlString) => {
          console.log('🔧 [MarkDownload] Starting smart content extraction...');
          
          // Remove unwanted elements
          let cleaned = htmlString
            .replace(/<script[^>]*>.*?<\/script>/gsi, '') // Remove scripts
            .replace(/<style[^>]*>.*?<\/style>/gsi, '') // Remove styles
            .replace(/<nav[^>]*>.*?<\/nav>/gsi, '') // Remove navigation
            .replace(/<header[^>]*>.*?<\/header>/gsi, '') // Remove headers
            .replace(/<footer[^>]*>.*?<\/footer>/gsi, '') // Remove footers
            .replace(/<aside[^>]*>.*?<\/aside>/gsi, '') // Remove sidebars
            .replace(/<!--.*?-->/gs, '') // Remove comments
            .replace(/<iframe[^>]*>.*?<\/iframe>/gsi, '') // Remove iframes
            .replace(/<noscript[^>]*>.*?<\/noscript>/gsi, ''); // Remove noscript
          
          // Extract meaningful content patterns
          const contentPatterns = [
            // Try to find article content
            /<article[^>]*>(.*?)<\/article>/gsi,
            // Try to find main content
            /<main[^>]*>(.*?)<\/main>/gsi,
            // Try to find content divs
            /<div[^>]*(?:class|id)="[^"]*(?:content|article|post|entry|main)[^"]*"[^>]*>(.*?)<\/div>/gsi,
            // Try to find text-heavy divs
            /<div[^>]*>((?:[^<]*<(?!div)[^>]*>[^<]*<\/[^>]*>)*[^<]{100,}.*?)<\/div>/gsi
          ];
          
          let extractedContent = '';
          
          for (const pattern of contentPatterns) {
            const matches = cleaned.match(pattern);
            if (matches && matches.length > 0) {
              console.log('🔧 [MarkDownload] Found content with pattern, matches:', matches.length);
              extractedContent = matches.join('\n');
              break;
            }
          }
          
          // If no patterns matched, use the cleaned content
          if (!extractedContent) {
            extractedContent = cleaned;
          }
          
          // Extract and structure text content
          const structureContent = (content) => {
            let structured = '';
            
            // Extract title if present
            const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
            if (titleMatch) {
              const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
              if (title) {
                structured += `<h1>${title}</h1>\n\n`;
              }
            }
            
            // Extract headings
            const headings = Array.from(content.matchAll(/<h([2-6])[^>]*>(.*?)<\/h[2-6]>/gi));
            const paragraphs = Array.from(content.matchAll(/<p[^>]*>(.*?)<\/p>/gi));
            const divs = Array.from(content.matchAll(/<div[^>]*>(.*?)<\/div>/gi));
            
            // Combine all text content and split intelligently
            let allText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            
            if (headings.length > 0) {
              console.log('🔧 [MarkDownload] Found', headings.length, 'headings');
              headings.forEach(match => {
                const level = match[1];
                const text = match[2].replace(/<[^>]*>/g, '').trim();
                if (text && text.length > 3) {
                  structured += `<h${level}>${text}</h${level}>\n\n`;
                }
              });
            }
            
            if (paragraphs.length > 0) {
              console.log('🔧 [MarkDownload] Found', paragraphs.length, 'paragraphs');
              paragraphs.forEach(match => {
                const text = match[1].replace(/<[^>]*>/g, '').trim();
                if (text && text.length > 20) {
                  structured += `<p>${text}</p>\n\n`;
                }
              });
            } else {
              // Create paragraphs from text
              console.log('🔧 [MarkDownload] Creating paragraphs from text, length:', allText.length);
              if (allText) {
                // Split by common paragraph indicators
                const sections = allText.split(/[。！？]\s*(?=[A-Z\u4e00-\u9fff])|[\n\r]{2,}/).filter(s => s.trim().length > 30);
                
                sections.forEach(section => {
                  const cleanSection = section.trim();
                  if (cleanSection && cleanSection.length > 30) {
                    structured += `<p>${cleanSection}</p>\n\n`;
                  }
                });
              }
            }
            
            return structured || `<p>${allText.substring(0, 2000)}</p>`;
          };
          
          const result = structureContent(extractedContent);
          console.log('🔧 [MarkDownload] Smart extraction result length:', result.length);
          return result;
        };
        
        console.log('📥 [MarkDownload] INPUT - Original DOM string length:', domString.length);
        console.log('📥 [MarkDownload] INPUT - Original DOM preview:', domString.substring(0, 300) + '...');
        
        const smartContent = extractMainContent(domString);
        
        console.log('🔄 [MarkDownload] PROCESSING - Smart extraction output length:', smartContent.length);
        console.log('🔄 [MarkDownload] PROCESSING - Smart extraction preview:', smartContent.substring(0, 500) + '...');
        
        const textContent = smartContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        article = {
          title: dom.title || "Extracted Content",
          content: smartContent,
          textContent: textContent,
          length: textContent.length,
          excerpt: textContent.substring(0, 200) + "...",
          byline: "",
          siteName: "",
          dir: null,
          lang: null
        };
        
        console.log('📤 [MarkDownload] OUTPUT - Article created');
        console.log('📤 [MarkDownload] OUTPUT - Article title:', article.title);
        console.log('📤 [MarkDownload] OUTPUT - Article content length:', article.content.length);
        console.log('📤 [MarkDownload] OUTPUT - Article content preview:', article.content.substring(0, 300) + '...');
      }
    } else {
      // Fallback for Service Worker environment
      console.log('🔧 [MarkDownload] getArticleFromDom: Using fallback article creation for Service Worker');
      article = {
        title: dom.title || "Extracted Content",
        content: dom.body ? dom.body.innerHTML : domString,
        textContent: dom.body ? dom.body.textContent || "" : "",
        length: domString.length,
        excerpt: "",
        byline: "",
        siteName: ""
      };
    }
  } catch (error) {
    console.error('❌ [MarkDownload] getArticleFromDom: Error in Readability processing:', error);
    // Create a basic article from the DOM string
    const textContent = domString.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    article = {
      title: "Extracted Content",
      content: domString,
      textContent: textContent,
      length: textContent.length,
      excerpt: textContent.substring(0, 200) + "...",
      byline: "",
      siteName: ""
    };
  }
  
  // Article should always exist at this point
  if (!article) {
    console.error('❌ [MarkDownload] getArticleFromDom: Failed to create article');
    throw new Error('Failed to create article');
  }
  
  console.log('🔧 [MarkDownload] getArticleFromDom: Readability processing complete');
  console.log('🔧 [MarkDownload] getArticleFromDom: Readability results:', {
    title: article.title,
    hasContent: !!article.content,
    contentLength: article.content ? article.content.length : 'N/A',
    excerpt: article.excerpt,
    byline: article.byline
  });

  // get the base uri from the dom and attach it as important article info
  article.baseURI = dom.baseURI;
  // also grab the page title
  article.pageTitle = dom.title;
  
  // and some URL info - handle invalid URLs safely
  try {
    if (dom.baseURI && dom.baseURI !== "about:blank") {
      const url = new URL(dom.baseURI);
      article.hash = url.hash;
      article.host = url.host;
      article.origin = url.origin;
      article.hostname = url.hostname;
      article.pathname = url.pathname;
      article.port = url.port;
      article.protocol = url.protocol;
      article.search = url.search;
    } else {
      // Fallback for invalid or missing baseURI
      article.hash = "";
      article.host = "";
      article.origin = "";
      article.hostname = "";
      article.pathname = "";
      article.port = "";
      article.protocol = "";
      article.search = "";
    }
  } catch (urlError) {
    console.warn('🔧 [MarkDownload] getArticleFromDom: Invalid baseURI, using fallback values:', dom.baseURI);
    article.hash = "";
    article.host = "";
    article.origin = "";
    article.hostname = "";
    article.pathname = "";
    article.port = "";
    article.protocol = "";
    article.search = "";
  }
  

  // make sure the dom has a head
  if (dom.head) {
    // and the keywords, should they exist, as an array
    article.keywords = dom.head.querySelector('meta[name="keywords"]')?.content?.split(',')?.map(s => s.trim());

    // add all meta tags, so users can do whatever they want
    dom.head.querySelectorAll('meta[name][content], meta[property][content]')?.forEach(meta => {
      const key = (meta.getAttribute('name') || meta.getAttribute('property'))
      const val = meta.getAttribute('content')
      if (key && val && !article[key]) {
        article[key] = val;
      }
    })
  }

  article.math = math

  console.log('🔧 [MarkDownload] getArticleFromDom: Final article object ready');
  console.log('🔧 [MarkDownload] getArticleFromDom: Final article details:', {
    title: article.title,
    pageTitle: article.pageTitle,
    hasContent: !!article.content,
    contentLength: article.content ? article.content.length : 'N/A',
    baseURI: article.baseURI,
    hasKeywords: !!article.keywords,
    keywordCount: article.keywords ? article.keywords.length : 'N/A'
  });

  // return the article
  return article;
}

// get Readability article info from the content of the tab id passed in
// `selection` is a bool indicating whether we should just get the selected text
async function getArticleFromContent(tabId, selection = false) {
  // run the content script function to get the details
  const results = await browser.tabs.executeScript(tabId, { code: "getSelectionAndDom()" });

  // make sure we actually got a valid result
  if (results && results[0] && results[0].dom) {
    const article = await getArticleFromDom(results[0].dom, selection);

    // if we're to grab the selection, and we've selected something,
    // replace the article content with the selection
    if (selection && results[0].selection) {
      article.content = results[0].selection;
    }

    //return the article
    return article;
  }
  else return null;
}

// function to apply the title template
async function formatTitle(article) {
  let options = await getOptions();
  
  let title = textReplace(options.title, article, options.disallowedChars + '/');
  title = title.split('/').map(s=>generateValidFileName(s, options.disallowedChars)).join('/');
  return title;
}

async function formatMdClipsFolder(article) {
  let options = await getOptions();

  let mdClipsFolder = '';
  if (options.mdClipsFolder && options.downloadMode == 'downloadsApi') {
    mdClipsFolder = textReplace(options.mdClipsFolder, article, options.disallowedChars);
    mdClipsFolder = mdClipsFolder.split('/').map(s => generateValidFileName(s, options.disallowedChars)).join('/');
    if (!mdClipsFolder.endsWith('/')) mdClipsFolder += '/';
  }

  return mdClipsFolder;
}

async function formatObsidianFolder(article) {
  let options = await getOptions();

  let obsidianFolder = '';
  if (options.obsidianFolder) {
    obsidianFolder = textReplace(options.obsidianFolder, article, options.disallowedChars);
    obsidianFolder = obsidianFolder.split('/').map(s => generateValidFileName(s, options.disallowedChars)).join('/');
    if (!obsidianFolder.endsWith('/')) obsidianFolder += '/';
  }

  return obsidianFolder;
}

// function to download markdown, triggered by context menu
async function downloadMarkdownFromContext(info, tab) {
  await ensureScripts(tab.id);
  const article = await getArticleFromContent(tab.id, info.menuItemId == "download-markdown-selection");
  const title = await formatTitle(article);
  const { markdown, imageList } = await convertArticleToMarkdown(article);
  // format the mdClipsFolder
  const mdClipsFolder = await formatMdClipsFolder(article);
  await downloadMarkdown(markdown, title, tab.id, imageList, mdClipsFolder); 

}

// function to copy a tab url as a markdown link
async function copyTabAsMarkdownLink(tab) {
  try {
    await ensureScripts(tab.id);
    const article = await getArticleFromContent(tab.id);
    const title = await formatTitle(article);
    await browser.tabs.executeScript(tab.id, { code: `copyToClipboard("[${title}](${article.baseURI})")` });
    // await navigator.clipboard.writeText(`[${title}](${article.baseURI})`);
  }
  catch (error) {
    // This could happen if the extension is not allowed to run code in
    // the page, for example if the tab is a privileged page.
    console.error("Failed to copy as markdown link: " + error);
  };
}

// function to copy all tabs as markdown links
async function copyTabAsMarkdownLinkAll(tab) {
  try {
    const options = await getOptions();
    options.frontmatter = options.backmatter = '';
    const tabs = await browser.tabs.query({
      currentWindow: true
    });
    
    const links = [];
    for(const tab of tabs) {
      await ensureScripts(tab.id);
      const article = await getArticleFromContent(tab.id);
      const title = await formatTitle(article);
      const link = `${options.bulletListMarker} [${title}](${article.baseURI})`
      links.push(link)
    };
    
    const markdown = links.join(`\n`)
    await browser.tabs.executeScript(tab.id, { code: `copyToClipboard(${JSON.stringify(markdown)})` });

  }
  catch (error) {
    // This could happen if the extension is not allowed to run code in
    // the page, for example if the tab is a privileged page.
    console.error("Failed to copy as markdown link: " + error);
  };
}

// function to copy only selected tabs as markdown links
async function copySelectedTabAsMarkdownLink(tab) {
  try {
    const options = await getOptions();
    options.frontmatter = options.backmatter = '';
    const tabs = await browser.tabs.query({
      currentWindow: true,
      highlighted: true
    });

    const links = [];
    for (const tab of tabs) {
      await ensureScripts(tab.id);
      const article = await getArticleFromContent(tab.id);
      const title = await formatTitle(article);
      const link = `${options.bulletListMarker} [${title}](${article.baseURI})`
      links.push(link)
    };

    const markdown = links.join(`\n`)
    await browser.tabs.executeScript(tab.id, { code: `copyToClipboard(${JSON.stringify(markdown)})` });

  }
  catch (error) {
    // This could happen if the extension is not allowed to run code in
    // the page, for example if the tab is a privileged page.
    console.error("Failed to copy as markdown link: " + error);
  };
}

// function to copy markdown to the clipboard, triggered by context menu
async function copyMarkdownFromContext(info, tab) {
  try{
    await ensureScripts(tab.id);

    const platformOS = navigator.platform;
    var folderSeparator = "";
    if(platformOS.indexOf("Win") === 0){
      folderSeparator = "\\";
    }else{
      folderSeparator = "/";
    }

    if (info.menuItemId == "copy-markdown-link") {
      const options = await getOptions();
      options.frontmatter = options.backmatter = '';
      const article = await getArticleFromContent(tab.id, false);
      const { markdown } = turndown(`<a href="${info.linkUrl}">${info.linkText || info.selectionText}</a>`, { ...options, downloadImages: false }, article);
      await browser.tabs.executeScript(tab.id, {code: `copyToClipboard(${JSON.stringify(markdown)})`});
    }
    else if (info.menuItemId == "copy-markdown-image") {
      await browser.tabs.executeScript(tab.id, {code: `copyToClipboard("![](${info.srcUrl})")`});
    }
    else if(info.menuItemId == "copy-markdown-obsidian") {
      const article = await getArticleFromContent(tab.id, info.menuItemId == "copy-markdown-obsidian");
      const title = await formatTitle(article);
      const options = await getOptions();
      const obsidianVault = options.obsidianVault;
      const obsidianFolder = await formatObsidianFolder(article);
      const { markdown } = await convertArticleToMarkdown(article, downloadImages = false);
      await browser.tabs.executeScript(tab.id, { code: `copyToClipboard(${JSON.stringify(markdown)})` });
      await chrome.tabs.update({url: "obsidian://advanced-uri?vault=" + obsidianVault + "&clipboard=true&mode=new&filepath=" + obsidianFolder + generateValidFileName(title)});
    }
    else if(info.menuItemId == "copy-markdown-obsall") {
      const article = await getArticleFromContent(tab.id, info.menuItemId == "copy-markdown-obsall");
      const title = await formatTitle(article);
      const options = await getOptions();
      const obsidianVault = options.obsidianVault;
      const obsidianFolder = await formatObsidianFolder(article);
      const { markdown } = await convertArticleToMarkdown(article, downloadImages = false);
      await browser.tabs.executeScript(tab.id, { code: `copyToClipboard(${JSON.stringify(markdown)})` });
      await browser.tabs.update({url: "obsidian://advanced-uri?vault=" + obsidianVault + "&clipboard=true&mode=new&filepath=" + obsidianFolder + generateValidFileName(title)});
    }
    else {
      const article = await getArticleFromContent(tab.id, info.menuItemId == "copy-markdown-selection");
      const { markdown } = await convertArticleToMarkdown(article, downloadImages = false);
      await browser.tabs.executeScript(tab.id, { code: `copyToClipboard(${JSON.stringify(markdown)})` });
    }
  }
  catch (error) {
    // This could happen if the extension is not allowed to run code in
    // the page, for example if the tab is a privileged page.
    console.error("Failed to copy text: " + error);
  };
}

async function downloadMarkdownForAllTabs(info) {
  const tabs = await browser.tabs.query({
    currentWindow: true
  });
  tabs.forEach(tab => {
    downloadMarkdownFromContext(info, tab);
  });
}

/**
 * String.prototype.replaceAll() polyfill
 * https://gomakethings.com/how-to-replace-a-section-of-a-string-with-another-one-with-vanilla-js/
 * @author Chris Ferdinandi
 * @license MIT
 */
if (!String.prototype.replaceAll) {
	String.prototype.replaceAll = function(str, newStr){

		// If a regex pattern
		if (Object.prototype.toString.call(str).toLowerCase() === '[object regexp]') {
			return this.replace(str, newStr);
		}

		// If a string
		return this.replace(new RegExp(str, 'g'), newStr);

	};
}
