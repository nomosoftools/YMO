// 1. HIGH-PERFORMANCE CSS INJECTION
(function injectStyles() {
  const styleId = "ymo-highlight-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      span[data-ymo-highlight="true"] {
        transition: filter 0.1s ease !important;
        cursor: pointer !important;
        pointer-events: auto !important;
        user-select: text !important;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
        display: inline !important; 
        vertical-align: baseline !important;
      }
      span[data-ymo-highlight="true"]:hover {
        filter: brightness(0.85) saturate(1.2) !important;
        outline: 1px solid rgba(0,0,0,0.15) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }
})();

// 2. SELECTION LISTENERS
document.addEventListener('mouseup', handleSelection);
document.addEventListener('keyup', (e) => {
  if (e.shiftKey && e.key.startsWith('Arrow')) handleSelection();
});

// 3. ROBUST CLICK LISTENER (UNDO)
document.addEventListener('mousedown', (e) => {
  if (e.button === 0) { 
    // Added safety check: ensure .closest exists in case of weird SVG clicks
    const target = e.target.closest && e.target.closest('[data-ymo-highlight="true"]');
    if (target) {
      const groupId = target.dataset.ymoGroup;
      if (groupId) {
        document.querySelectorAll(`span[data-ymo-group="${groupId}"]`).forEach(removeHighlight);
      } else {
        removeHighlight(target);
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }
}, true);

function handleSelection() {
  setTimeout(() => {
    // --- BUG FIX START: Prevent script from interfering with Search Engines and Inputs ---
    const active = document.activeElement;
    // 1st Check: Is the user actively focused on an input, textarea, or rich text editor?
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
      return; // Abort highlight logic entirely
    }
    // --- BUG FIX END ---

    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0 && selection.rangeCount > 0) {
      
      // 2nd Check: Verify the actual highlighted text isn't inside a nested editable area
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const element = container.nodeType === 1 ? container : container.parentElement;
      
      if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable)) {
        return; // Abort
      }

      highlightText(selection);
    }
  }, 10);
}

function highlightText(selection) {
  const range = selection.getRangeAt(0);
  const commonAncestor = range.commonAncestorContainer;
  
  // Create a unique group ID for this specific highlight action
  const groupId = `ymo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  
  // Determine colors based on the page context
  const isDarkMode = isDarkModePage();
  const parentEl = commonAncestor.nodeType === 1 ? commonAncestor : commonAncestor.parentElement;
  const textColor = window.getComputedStyle(parentEl).color;
  const highlightColor = getHighlightColor(textColor, isDarkMode);

  // 1. IDENTIFY ALL TEXT NODES WITHIN RANGE
  const walker = document.createTreeWalker(
    commonAncestor.nodeType === 1 ? commonAncestor : commonAncestor.parentElement,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (range.intersectsNode(node)) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodesToWrap = [];
  while (walker.nextNode()) nodesToWrap.push(walker.currentNode);

  const spans = [];

  // 2. WRAP NODES NON-DESTRUCTIVELY
  nodesToWrap.forEach(node => {
    let nodeToWrap = node;

    // Handle partial selections by splitting text nodes
    if (node === range.startContainer && range.startOffset > 0) {
      nodeToWrap = node.splitText(range.startOffset);
    }
    if (nodeToWrap === range.endContainer && range.endOffset < nodeToWrap.nodeValue.length) {
      nodeToWrap.splitText(range.endOffset);
    }

    // Check if already highlighted (Integration Logic)
    if (nodeToWrap.parentElement.dataset.ymoHighlight === "true") {
      // If already highlighted, just update the group and color to "merge" them
      nodeToWrap.parentElement.dataset.ymoGroup = groupId;
      nodeToWrap.parentElement.style.backgroundColor = highlightColor;
      spans.push(nodeToWrap.parentElement);
    } else {
      // Create new span
      const span = document.createElement("span");
      span.dataset.ymoHighlight = "true";
      span.dataset.ymoGroup = groupId;
      span.style.backgroundColor = highlightColor;
      span.style.color = isDarkMode ? "#ffffff" : "#000000";
      
      nodeToWrap.parentNode.insertBefore(span, nodeToWrap);
      span.appendChild(nodeToWrap);
      spans.push(span);
    }
  });

  // 3. CLEAN UP & RECOVERY
  selection.removeAllRanges();
  if (spans.length > 0) {
    const newRange = document.createRange();
    newRange.setStartBefore(spans[0]);
    newRange.setEndAfter(spans[spans.length - 1]);
    selection.addRange(newRange);
  }
}

function removeHighlight(spanElement) {
  const parent = spanElement.parentNode;
  if (!parent) return; 
  while (spanElement.firstChild) {
    parent.insertBefore(spanElement.firstChild, spanElement);
  }
  spanElement.remove();
  parent.normalize(); 
}

function isDarkModePage() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getHighlightColor(textColor, isDarkMode) {
  if (isDarkMode) return "#3399FF"; 
  const rgb = textColor.match(/\d+/g);
  if (rgb && rgb.length >= 3) {
    const r = parseInt(rgb[0], 10), g = parseInt(rgb[1], 10), b = parseInt(rgb[2], 10);
    const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b);
    return brightness < 128 ? "#FFFF99" : "#3333FF";
  }
  return "#FFFF99"; 
}
