// worldMap.js
// This script handles the world map functionality for PIOSI - THE SAGAS CONTINUE.
// When the heroes beat level 20, they ascend to the world map (THE BROADLANDS) which shows destination nodes.
// Nodes:
//  - "Gratt ߁": Starting node representing the team's current position.
//  - "Gratt ߂": When selected, will (ultimately) load a new suite of levels.
//  - "Gratt ߃": Placeholder; if selected, displays "not yet accessible with current clearance level".
//  - "Gratt ߷": When selected, opens level 99.

let nodes = ["Gratt ߁", "Gratt ߂", "Gratt ߃", "Gratt ߷"];
let currentIndex = 0;
const worldMapEl = document.getElementById("world-map");

// Function to render nodes and highlight the current selection.
function renderNodes() {
  let html = `<h1>THE BROADLANDS</h1>
              <p>Select your destination:</p>
              <ul style="list-style-type: none; padding: 0;">`;
  nodes.forEach((node, index) => {
    if (index === currentIndex) {
      html += `<li style="padding: 10px; border: 2px solid yellow; margin: 5px; background-color: #333; color: #fff;">
                 ${node}
               </li>`;
    } else {
      html += `<li style="padding: 10px; border: 2px solid gray; margin: 5px; background-color: #222; color: #ccc;">
                 ${node}
               </li>`;
    }
  });
  html += `</ul>
           <p>Use Left/Right arrow keys to navigate. Press Space to select.</p>`;
  worldMapEl.innerHTML = html;
}

// Initialize the world map.
export function initWorldMap() {
  currentIndex = 0; // Set default starting position on "Gratt ߁"
  renderNodes();
  console.log("World map initialized with nodes:", nodes);
}

// Move selection to the left. Wrap around if necessary.
export function moveSelectionLeft() {
  currentIndex = (currentIndex - 1 + nodes.length) % nodes.length;
  renderNodes();
}

// Move selection to the right. Wrap around if necessary.
export function moveSelectionRight() {
  currentIndex = (currentIndex + 1) % nodes.length;
  renderNodes();
}

// Handle selection (pressing Space) based on current node.
export function selectCurrentNode(openLevel99) {
  const selectedNode = nodes[currentIndex];
  if (selectedNode === "Gratt ߂") {
    // Load new suite of levels.
    console.log("Transitioning to new suite of levels via", selectedNode);
    alert("Loading new suite of levels...");
    // In a full game, you would transition to a new set of levels here.
  } else if (selectedNode === "Gratt ߃") {
    // Not accessible.
    alert("Not yet accessible with current clearance level");
  } else if (selectedNode === "Gratt ߷") {
        // Open level 99.
        console.log("Opening level 99 via", selectedNode);
        openLevel99(); // Call the function to open level 99
  } else {
    // For "Gratt ߁", the current location.
    alert(`${selectedNode} is your current location. Use arrow keys to navigate to a new destination.`);
  }
}
