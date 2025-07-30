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

  let markdown = options.frontmatter + turndownService.turndown(content)
      + options.backmatter;

  // strip out non-printing special characters which CodeMirror displays as a red dot
  // see: https://codemirror.net/doc/manual.html#option_specialChars
  markdown = markdown.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff\ufff9-\ufffc]/g, '');
  
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

  console.log('🔧 [MarkDownload] convertArticleToMarkdown: Calling turndown function...');
  let result = turndown(article.content, options, article);
  console.log('🔧 [MarkDownload] convertArticleToMarkdown: Turndown complete');
  console.log('🔧 [MarkDownload] convertArticleToMarkdown: Turndown result:', {
    hasMarkdown: !!result.markdown,
    markdownLength: result.markdown ? result.markdown.length : 'N/A',
    imageCount: result.imageList ? Object.keys(result.imageList).length : 'N/A',
    markdownPreview: result.markdown ? result.markdown.substring(0, 100) + '...' : 'N/A'
  });
  
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
      // Create a simple DOM-like structure
      dom = {
        documentElement: {
          nodeName: "HTML",
          removeAttribute: () => {},
          querySelector: () => null,
          querySelectorAll: () => []
        },
        body: {
          innerHTML: domString,
          querySelector: () => null,
          querySelectorAll: () => []
        },
        title: "Extracted Content"
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
      article = new Readability(dom).parse();
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
    article = {
      title: "Extracted Content",
      content: domString,
      textContent: "",
      length: domString.length,
      excerpt: "",
      byline: "",
      siteName: ""
    };
  }
  
  if (!article) {
    console.error('❌ [MarkDownload] getArticleFromDom: Readability failed to parse article');
    throw new Error('Readability failed to parse article');
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
  // and some URL info
  const url = new URL(dom.baseURI);
  article.hash = url.hash;
  article.host = url.host;
  article.origin = url.origin;
  article.hostname = url.hostname;
  article.pathname = url.pathname;
  article.port = url.port;
  article.protocol = url.protocol;
  article.search = url.search;
  

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
