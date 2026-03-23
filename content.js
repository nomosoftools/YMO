// 1. Listen to both mouse and keyboard selections
document.addEventListener('mouseup', handleSelection);
document.addEventListener('keyup', (e) => {
  // Capture Shift + Arrow key selections
  if (e.shiftKey && e.key.startsWith('Arrow')) {
    handleSelection();
  }
});

function handleSelection() {
  // Small timeout ensures the browser OS has finished painting the selection
  setTimeout(() => {
    const selection = window.getSelection();
    
    // Check if selection exists, has actual text, and isn't just a cursor click
    if (selection && selection.toString().trim().length > 0 && selection.rangeCount > 0) {
      highlightText(selection);
    }
  }, 10);
}

function highlightText(selection) {
  const range = selection.getRangeAt(0);
  const span = document.createElement("span");
  
  const isDarkMode = isDarkModePage();
  
  // Ensure we get the actual element, as anchorNode is often just a text node (#text)
  let selectedElement = selection.anchorNode;
  if (selectedElement.nodeType === Node.TEXT_NODE) {
    selectedElement = selectedElement.parentNode;
  }
  
  const textColor = window.getComputedStyle(selectedElement).color;
  const highlightColor = getHighlightColor(textColor, isDarkMode);
  
  span.style.backgroundColor = highlightColor;
  // Ensure text contrast against the new background
  span.style.color = isDarkMode ? "#ffffff" : "#000000"; 
  
  try {
    // Attempt to wrap the text
    range.surroundContents(span);
    
    // Clear the native blue browser selection so it doesn't overlap your new span
    selection.removeAllRanges();
  } catch (error) {
    // surroundContents FAILS if the selection crosses multiple HTML tags.
    // Catching this prevents the rest of your script from breaking.
    console.warn("Highlight failed: Selection crossed element boundaries.");
  }
}

function isDarkModePage() {
  // Modern, highly robust OS/Browser-level dark mode check
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return true;
  }
  
  // Fallback to your original CSS variable check
  const colorScheme = window.getComputedStyle(document.documentElement).getPropertyValue('color-scheme');
  return colorScheme && colorScheme.includes('dark');
}

function getHighlightColor(textColor, isDarkMode) {
  if (isDarkMode) return "#3399FF"; 

  // Safely match rgb() or rgba() values
  const rgb = textColor.match(/\d+/g);
  if (rgb && rgb.length >= 3) {
    const r = parseInt(rgb[0], 10);
    const g = parseInt(rgb[1], 10);
    const b = parseInt(rgb[2], 10);
    
    const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b);
    return brightness < 128 ? "#FFFF99" : "#3333FF";
  }
  return "#FFFF99"; 
}
