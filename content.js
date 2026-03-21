document.addEventListener('mouseup', function() {
  var selection = window.getSelection();
  var selectedText = selection.toString();
  
  // Only proceed if there's a valid selection
  if (selectedText) {
    highlightText(selection);
  }
});

function highlightText(selection) {
  var range = selection.getRangeAt(0);  // Get the range of selected text
  var span = document.createElement("span");
  
  // Get the color-scheme of the page to determine if we're in dark mode
  var isDarkMode = isDarkModePage();
  
  // Get the color of the selected text to determine highlight color
  var selectedElement = selection.anchorNode.parentElement; // Get the parent element of the selection
  var textColor = window.getComputedStyle(selectedElement).color;
  
  // Calculate highlight color based on text color and color-scheme
  var highlightColor = getHighlightColor(textColor, isDarkMode);
  
  // Apply the background color for the highlight
  span.style.backgroundColor = highlightColor;
  
  // Insert the span around the selected text without removing it
  range.surroundContents(span);
}

// Function to check if the page is using dark mode based on the color-scheme
function isDarkModePage() {
  var colorScheme = window.getComputedStyle(document.documentElement).getPropertyValue('color-scheme');
  return colorScheme && colorScheme.includes('dark');
}

// Function to calculate a contrasting highlight color based on the text color and color-scheme
function getHighlightColor(textColor, isDarkMode) {
  if (isDarkMode) {
    return "#3399FF"; // Blue highlight for dark mode
  }

  // Convert textColor from rgb format (or any valid CSS color format) to RGB
  var rgb = textColor.match(/\d+/g);
  
  if (rgb) {
    var r = parseInt(rgb[0], 10);
    var g = parseInt(rgb[1], 10);
    var b = parseInt(rgb[2], 10);
    
    // Calculate brightness using the luminance formula
    var brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b);
    
    // If the text color is dark (low brightness), use a light highlight color
    if (brightness < 128) {
      return "#FFFF99"; // Light yellow for dark text
    } else {
      return "#3333FF"; // Dark blue for light text (or white)
    }
  }
  
  // Default color if unable to determine RGB values
  return "#FFFF99"; // Light yellow
}
