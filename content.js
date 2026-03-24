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
        /* Prevent layout shifts in flex/grid containers */
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
    const target = e.target.closest('[data-ymo-highlight="true"]');
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
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0 && selection.rangeCount > 0) {
      highlightText(selection);
    }
  }, 10);
}

function highlightText(selection) {
  let range = selection.getRangeAt(0);
  
  // --- INTEGRATION LOGIC ---
  const startHighlight = range.startContainer.parentElement?.closest('[data-ymo-highlight="true"]');
  const endHighlight = range.endContainer.parentElement?.closest('[data-ymo-highlight="true"]');

  if (startHighlight) range.setStartBefore(startHighlight);
  if (endHighlight) range.setEndAfter(endHighlight);

  // Use extractContents to manipulate the DOM "offline" (high performance)
  const fragment = range.extractContents();
  
  // Remove existing spans within the fragment to prevent nesting
  fragment.querySelectorAll('[data-ymo-highlight="true"]').forEach(oldSpan => {
    const p = oldSpan.parentNode;
    while (oldSpan.firstChild) p.insertBefore(oldSpan.firstChild, oldSpan);
    oldSpan.remove();
  });

  const isDarkMode = isDarkModePage();
  const parentEl = range.commonAncestorContainer.nodeType === 1 
    ? range.commonAncestorContainer 
    : range.commonAncestorContainer.parentElement;
  
  const textColor = window.getComputedStyle(parentEl).color;
  const highlightColor = getHighlightColor(textColor, isDarkMode);
  
  // High-performance TreeWalker
  const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    // Only wrap nodes that contain actual visible text
    if (node.nodeValue.replace(/\s/g, '').length > 0) {
      textNodes.push(node);
    }
  }

  if (textNodes.length === 0) {
    range.insertNode(fragment);
    return;
  }

  const groupId = `ymo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const spans = [];

  textNodes.forEach(textNode => {
    const span = document.createElement("span");
    span.dataset.ymoHighlight = "true";
    span.dataset.ymoGroup = groupId;
    span.style.backgroundColor = highlightColor;
    span.style.color = isDarkMode ? "#ffffff" : "#000000"; 
    
    // Wrap the text node
    if (textNode.parentNode) {
      textNode.parentNode.insertBefore(span, textNode);
      span.appendChild(textNode);
      spans.push(span);
    }
  });

  try {
    range.insertNode(fragment);
    
    // Smooth selection recovery
    const newRange = document.createRange();
    if (spans.length > 0) {
      newRange.setStartBefore(spans[0]);
      newRange.setEndAfter(spans[spans.length - 1]);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  } catch (error) {
    console.error("Critical collapse prevented:", error);
  }
}

function removeHighlight(spanElement) {
  const parent = spanElement.parentNode;
  if (!parent) return; 
  while (spanElement.firstChild) {
    parent.insertBefore(spanElement.firstChild, spanElement);
  }
  spanElement.remove();
  // normalize() merges adjacent text nodes to prevent DOM bloat
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
