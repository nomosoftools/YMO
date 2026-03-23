// 1. HIGH-PERFORMANCE CSS INJECTION
// We inject this as early as possible to ensure hover works immediately.
(function injectStyles() {
  const styleId = "ymo-highlight-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      span[data-ymo-highlight="true"] {
        transition: filter 0.1s ease !important;
        cursor: pointer !important;
      }
      span[data-ymo-highlight="true"]:hover {
        filter: brightness(0.8) saturate(1.4) !important;
        outline: 1px solid rgba(0,0,0,0.2) !important;
      }
      span[data-ymo-highlight="true"]:active {
        opacity: 0.7 !important;
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
// We use 'mousedown' instead of 'click' for faster response and to beat site-specific blocks
document.addEventListener('mousedown', (e) => {
  const target = e.target;
  if (target && target.dataset.ymoHighlight === "true") {
    // If the user is just clicking (not dragging), remove the highlight
    removeHighlight(target);
    
    // Stop the event from bubbling up to the website's own scripts
    e.preventDefault();
    e.stopPropagation();
  }
}, true); // The 'true' here uses Event Capturing - it's the most aggressive way to catch a click

function handleSelection() {
  setTimeout(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0 && selection.rangeCount > 0) {
      highlightText(selection);
    }
  }, 10);
}

function highlightText(selection) {
  const range = selection.getRangeAt(0);
  
  // Prevent nesting highlights
  if (range.commonAncestorContainer.parentElement.closest('[data-ymo-highlight="true"]')) {
    return;
  }

  const span = document.createElement("span");
  span.dataset.ymoHighlight = "true";

  const isDarkMode = isDarkModePage();
  let selectedElement = selection.anchorNode;
  if (selectedElement.nodeType === Node.TEXT_NODE) {
    selectedElement = selectedElement.parentNode;
  }
  
  const textColor = window.getComputedStyle(selectedElement).color;
  const highlightColor = getHighlightColor(textColor, isDarkMode);
  
  span.style.backgroundColor = highlightColor;
  span.style.color = isDarkMode ? "#ffffff" : "#000000"; 
  
  try {
    range.surroundContents(span);
    
    // Re-apply selection so it stays blue
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(newRange);
  } catch (error) {
    console.warn("Complex selection skipped to prevent page error.");
  }
}

function removeHighlight(spanElement) {
  const parent = spanElement.parentNode;
  // Move text back to the parent
  while (spanElement.firstChild) {
    parent.insertBefore(spanElement.firstChild, spanElement);
  }
  spanElement.remove();
  parent.normalize(); // High performance DOM cleanup
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
