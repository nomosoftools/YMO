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
        /* Prevent layout shifts */
        display: inline; 
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
  const target = e.target;
  if (target && target.dataset.ymoHighlight === "true") {
    removeHighlight(target);
    e.preventDefault();
    e.stopPropagation();
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
  
  // --- INTEGRATION LOGIC START ---
  // 1. Check if we are touching or inside existing highlights
  const startHighlight = range.startContainer.parentElement.closest('[data-ymo-highlight="true"]');
  const endHighlight = range.endContainer.parentElement.closest('[data-ymo-highlight="true"]');

  // 2. Expand range to absorb partially selected highlights
  if (startHighlight) range.setStartBefore(startHighlight);
  if (endHighlight) range.setEndAfter(endHighlight);

  // 3. Find and "unwrap" any existing highlights inside the selection
  const fragment = range.cloneContents();
  const existingInSelection = fragment.querySelectorAll('[data-ymo-highlight="true"]');
  
  if (existingInSelection.length > 0 || startHighlight || endHighlight) {
    // If we found highlights to integrate, we must manually clean the range
    const rawText = range.toString();
    range.deleteContents();
    range.insertNode(document.createTextNode(rawText));
    // Re-select the newly inserted text so we can wrap it
    range = selection.getRangeAt(0);
  }
  // --- INTEGRATION LOGIC END ---

  const span = document.createElement("span");
  span.dataset.ymoHighlight = "true";

  const isDarkMode = isDarkModePage();
  // Use commonAncestor for more robust color detection on merged text
  const parentEl = range.commonAncestorContainer.nodeType === 1 
    ? range.commonAncestorContainer 
    : range.commonAncestorContainer.parentElement;
  
  const textColor = window.getComputedStyle(parentEl).color;
  const highlightColor = getHighlightColor(textColor, isDarkMode);
  
  span.style.backgroundColor = highlightColor;
  span.style.color = isDarkMode ? "#ffffff" : "#000000"; 
  
  try {
    range.surroundContents(span);
    
    // Maintain selection status
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(newRange);
  } catch (error) {
    console.warn("Integration failed due to complex HTML structure.");
  }
}

function removeHighlight(spanElement) {
  const parent = spanElement.parentNode;
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
    const brightness = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]);
    return brightness < 128 ? "#FFFF99" : "#3333FF";
  }
  return "#FFFF99"; 
}
