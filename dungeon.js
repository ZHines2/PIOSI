<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>3D Isometric Dungeon - Focused Game Loop</title>
    <style>
      body {
        background-color: #222;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        font-family: sans-serif;
      }
      canvas {
        border: 2px solid #fff;
        background-color: #000;
      }
    </style>
  </head>
  <body>
    <canvas id="dungeonCanvas" width="800" height="600"></canvas>
    <script>
            // ========================
            // 1. CONSTANTS & GLOBALS
            // ========================

            const GRID_SIZE = 25;
            const FLOOR_COUNT = 25;
            const TILE_WIDTH = 32;
            const TILE_HEIGHT = 16;

            // Dungeon Generation Configuration
            const WALKERS = 3;
            const STEPS_PER_WALKER = 300;

            // Global State
            let dungeon = [];      // 3D array: dungeon[floor][row][col]
            let gameStarted = false;
            let playerX, playerY, playerFloor;

            // Movement Log (for HUD)
            let movementLog = [];
            function addLog(message) {
              movementLog.push(message);
              if (movementLog.length > 5) {
                movementLog.shift();
              }
            }

            // Canvas Setup
            const canvas = document.getElementById("dungeonCanvas");
            const ctx = canvas.getContext("2d");

            // ================================
            // 2. BFS CONNECTIVITY & CARVING
            // ================================

            function isFloorConnected(z) {
              let start = null;
              for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                  if (["floor", "up", "down"].includes(dungeon[z][y][x])) {
                    start = { x, y };
                    break;
                  }
                }
                if (start) break;
              }
              if (!start) return true;

              let visited = new Set();
              let queue = [start];
              visited.add(`${start.x},${start.y}`);

              while (queue.length) {
                let { x, y } = queue.shift();
                const dirs = [
                  { dx: 1, dy: 0 },
                  { dx: -1, dy: 0 },
                  { dx: 0, dy: 1 },
                  { dx: 0, dy: -1 },
                ];
                for (let d of dirs) {
                  let nx = x + d.dx, ny = y + d.dy;
                  if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    let cell = dungeon[z][ny][nx];
                    if (["floor", "up", "down"].includes(cell) && !visited.has(`${nx},${ny}`)) {
                      visited.add(`${nx},${ny}`);
                      queue.push({ x: nx, y: ny });
                    }
                  }
                }
              }

              for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                  let cell = dungeon[z][y][x];
                  if (["floor", "up", "down"].includes(cell) && !visited.has(`${x},${y}`)) {
                    return false;
                  }
                }
              }
              return true;
            }

            function carveCorridorBetweenCells(z, x1, y1, x2, y2) {
              let curX = x1, curY = y1;
              while (curX !== x2) {
                dungeon[z][curY][curX] = "floor";
                curX += (x2 > curX ? 1 : -1);
              }
              while (curY !== y2) {
                dungeon[z][curY][curX] = "floor";
                curY += (y2 > curY ? 1 : -1);
              }
              dungeon[z][curY][curX] = "floor";
            }

            function ensureFloorConnectivity(z) {
              if (isFloorConnected(z)) return;

              let start = null;
              let visited = new Set();
              let queue = [];
              for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                  if (["floor", "up", "down"].includes(dungeon[z][y][x])) {
                    start = { x, y };
                    break;
                  }
                }
                if (start) break;
              }
              if (!start) return;

              queue.push(start);
              visited.add(`${start.x},${start.y}`);

              while (queue.length) {
                let { x, y } = queue.shift();
                for (let d of [
                  { dx: 1, dy: 0 },
                  { dx: -1, dy: 0 },
                  { dx: 0, dy: 1 },
                  { dx: 0, dy: -1 },
                ]) {
                  let nx = x + d.dx, ny = y + d.dy;
                  if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    let cell = dungeon[z][ny][nx];
                    if (["floor", "up", "down"].includes(cell) && !visited.has(`${nx},${ny}`)) {
                      visited.add(`${nx},${ny}`);
                      queue.push({ x: nx, y: ny });
                    }
                  }
                }
              }

              for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                  let cell = dungeon[z][y][x];
                  if (["floor", "up", "down"].includes(cell) && !visited.has(`${x},${y}`)) {
                    carveCorridorBetweenCells(z, start.x, start.y, x, y);
                    ensureFloorConnectivity(z);
                    return;
                  }
                }
              }
            }

            // =======================
            // 3. DUNGEON GENERATION
            // =======================

            function buildFloors() {
              for (let z = 0; z < FLOOR_COUNT; z++) {
                dungeon[z] = [];
                for (let y = 0; y < GRID_SIZE; y++) {
                  dungeon[z][y] = [];
                  for (let x = 0; x < GRID_SIZE; x++) {
                    dungeon[z][y][x] = "wall";
                  }
                }
                for (let w = 0; w < WALKERS; w++) {
                  let currentX = (w === 0)
                    ? Math.floor(GRID_SIZE / 2)
                    : Math.floor(Math.random() * GRID_SIZE);
                  let currentY = (w === 0)
                    ? Math.floor(GRID_SIZE / 2)
                    : Math.floor(Math.random() * GRID_SIZE);
                  dungeon[z][currentY][currentX] = "floor";
                  for (let i = 0; i < STEPS_PER_WALKER; i++) {
                    const direction = Math.floor(Math.random() * 4);
                    if (direction === 0 && currentY > 0) currentY--;
                    else if (direction === 1 && currentX < GRID_SIZE - 1) currentX++;
                    else if (direction === 2 && currentY < GRID_SIZE - 1) currentY++;
                    else if (direction === 3 && currentX > 0) currentX--;
                    dungeon[z][currentY][currentX] = "floor";
                  }
                }
                ensureFloorConnectivity(z);
              }
            }

            // =========================
            // 4. STAIRS BETWEEN FLOORS
            // =========================

            function hasOrthogonalAdjacentFloor(z, x, y) {
              const dirs = [
                { dx: 1, dy: 0 },
                { dx: -1, dy: 0 },
                { dx: 0, dy: 1 },
                { dx: 0, dy: -1 },
              ];
              for (let d of dirs) {
                const nx = x + d.dx, ny = y + d.dy;
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                  if (["floor", "up", "down"].includes(dungeon[z][ny][nx])) {
                    return true;
                  }
                }
              }
              return false;
            }

            function guaranteedStairPlacement(z) {
              for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                  if (dungeon[z][y][x] === "floor" && dungeon[z + 1][y][x] === "floor") {
                    dungeon[z][y][x] = "up";
                    dungeon[z + 1][y][x] = "down";
                    return true;
                  }
                }
              }
              return false;
            }

            function addStairsFirstPass() {
              for (let z = 0; z < FLOOR_COUNT - 1; z++) {
                let added = false;
                for (let attempt = 0; attempt < 200; attempt++) {
                  const stairX = Math.floor(Math.random() * GRID_SIZE);
                  const stairY = Math.floor(Math.random() * GRID_SIZE);
                  if (
                    dungeon[z][stairY][stairX] === "floor" &&
                    dungeon[z + 1][stairY][stairX] === "floor" &&
                    hasOrthogonalAdjacentFloor(z, stairX, stairY)
                  ) {
                    dungeon[z][stairY][stairX] = "up";
                    dungeon[z + 1][stairY][stairX] = "down";
                    added = true;
                    break;
                  }
                }
                if (!added) {
                  if (!guaranteedStairPlacement(z)) {
                    console.log("First pass: Failed to add stairs between floors", z, "and", z + 1);
                  }
                }
              }
            }

            function addStairsSecondPass() {
              for (let z = 1; z < FLOOR_COUNT; z++) {
                let hasDown = false;
                for (let y = 0; y < GRID_SIZE; y++) {
                  for (let x = 0; x < GRID_SIZE; x++) {
                    if (dungeon[z][y][x] === "down") {
                      hasDown = true;
                      break;
                    }
                  }
                  if (hasDown) break;
                }
                if (!hasDown) {
                  for (let y = 0; y < GRID_SIZE; y++) {
                    for (let x = 0; x < GRID_SIZE; x++) {
                      if (
                        dungeon[z - 1][y][x] === "floor" &&
                        dungeon[z][y][x] === "floor" &&
                        hasOrthogonalAdjacentFloor(z - 1, x, y)
                      ) {
                        dungeon[z - 1][y][x] = "up";
                        dungeon[z][y][x] = "down";
                        hasDown = true;
                        break;
                      }
                    }
                    if (hasDown) break;
                  }
                  if (!hasDown) {
                    console.log("Second pass: Failed to add a down stair on floor", z);
                  }
                }
              }
              for (let z = 0; z < FLOOR_COUNT - 1; z++) {
                let hasUp = false;
                for (let y = 0; y < GRID_SIZE; y++) {
                  for (let x = 0; x < GRID_SIZE; x++) {
                    if (dungeon[z][y][x] === "up") {
                      hasUp = true;
                      break;
                    }
                  }
                  if (hasUp) break;
                }
                if (!hasUp) {
                  for (let y = 0; y < GRID_SIZE; y++) {
                    for (let x = 0; x < GRID_SIZE; x++) {
                      if (
                        dungeon[z][y][x] === "floor" &&
                        dungeon[z + 1][y][x] === "floor" &&
                        hasOrthogonalAdjacentFloor(z, x, y)
                      ) {
                        dungeon[z][y][x] = "up";
                        dungeon[z + 1][y][x] = "down";
                        hasUp = true;
                        break;
                      }
                    }
                    if (hasUp) break;
                  }
                  if (!hasUp) {
                    console.log("Second pass: Failed to add an up stair on floor", z);
                  }
                }
              }
            }

            function addStairs() {
              addStairsFirstPass();
              addStairsSecondPass();
            }

            // ======================
            // 5. ISOMETRIC RENDERING & CAMERA
            // ======================

            function toIsometric(x, y) {
              const isoX = (x - y) * (TILE_WIDTH / 2) + canvas.width / 2;
              const isoY = (x + y) * (TILE_HEIGHT / 2) + 50;
              return { isoX, isoY };
            }

            function drawTile(x, y, color) {
              const { isoX, isoY } = toIsometric(x, y);
              ctx.beginPath();
              ctx.moveTo(isoX, isoY);
              ctx.lineTo(isoX + TILE_WIDTH / 2, isoY + TILE_HEIGHT / 2);
              ctx.lineTo(isoX, isoY + TILE_HEIGHT);
              ctx.lineTo(isoX - TILE_WIDTH / 2, isoY + TILE_HEIGHT / 2);
              ctx.closePath();
              ctx.fillStyle = color;
              ctx.fill();
              ctx.strokeStyle = "#111";
              ctx.stroke();
            }

            // Draw text upright using a shear transform.
            function drawTextUpright(gridX, gridY, text) {
              const { isoX, isoY } = toIsometric(gridX, gridY);
              ctx.save();
              ctx.translate(isoX, isoY);
              ctx.transform(1, 0, -0.5, 1, 0, 0);
              ctx.font = "16px sans-serif";
              ctx.fillStyle = "#fff";
              ctx.fillText(text, 0, -5);
              ctx.restore();
            }

            // ==============================
            // 6. FLOATING SIGN AT TOP EDGE
            // ==============================

            function drawFloatingSign() {
              const topX = Math.floor(GRID_SIZE / 2);
              const topY = 0;
              let { isoX, isoY } = toIsometric(topX, topY);
              isoY -= 60; // shift sign above the top row

              ctx.save();
              ctx.translate(isoX, isoY);
              ctx.transform(1, 0, -0.5, 1, 0, 0);
              const rectWidth = 160;
              const rectHeight = 50;
              ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
              ctx.fillRect(-rectWidth / 2, -rectHeight, rectWidth, rectHeight);
              ctx.fillStyle = "#fff";
              ctx.font = "16px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText(`Floor: ${playerFloor + 1} / ${FLOOR_COUNT}`, 0, -rectHeight + 20);
              ctx.fillText(`Pos: (${playerX}, ${playerY})`, 0, -rectHeight + 40);
              ctx.restore();
            }

            // =================
            // 7. DRAW & CAMERA FUNCTION WITH GAME LOOP
            // =================

            function drawDungeon() {
              // Compute camera offset so player is centered.
              const playerIso = toIsometric(playerX, playerY);
              const cameraOffsetX = playerIso.isoX - canvas.width / 2;
              const cameraOffsetY = playerIso.isoY - canvas.height / 2;

              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.save();
              ctx.translate(-cameraOffsetX, -cameraOffsetY);

              // Draw dungeon tiles.
              for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                  const cell = dungeon[playerFloor][y][x];
                  let color;
                  if (cell === "floor") color = "#bbb";
                  else if (cell === "wall") color = "#333";
                  else if (cell === "up") color = "#4caf50";
                  else if (cell === "down") color = "#2196f3";
                  else color = "#000";
                  drawTile(x, y, color);
                }
              }

              // Draw player.
              const { isoX, isoY } = toIsometric(playerX, playerY);
              ctx.beginPath();
              ctx.moveTo(isoX, isoY);
              ctx.lineTo(isoX + TILE_WIDTH / 2, isoY + TILE_HEIGHT / 2);
              ctx.lineTo(isoX, isoY + TILE_HEIGHT);
              ctx.lineTo(isoX - TILE_WIDTH / 2, isoY + TILE_HEIGHT / 2);
              ctx.closePath();
              ctx.fillStyle = "#e74c3c";
              ctx.fill();

              // Draw floating sign (floor and position info).
              drawFloatingSign();

              ctx.restore();

              // Draw HUD in fixed coordinates (movement log, mini-map, instructions).
              drawHUD();
            }

           // =================
      // 8. HUD, MOVEMENT LOG, & MINI-MAP
      // =================

      function drawHUD() {
        const HUD_HEIGHT = 120;
        // Draw the semi-transparent HUD background at the bottom
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, canvas.height - HUD_HEIGHT, canvas.width, HUD_HEIGHT);

        // Set text color to white for readability
        ctx.fillStyle = "#fff";
        ctx.font = "14px sans-serif";

        // Movement Log (drawn at the left side of the HUD)
        let logX = 200;
        let logY = canvas.height - 23;
        // Draw from the oldest (top) to newest (bottom)
        for (let i = 0; i < movementLog.length; i++) {
          ctx.textAlign = "left";
          ctx.fillText(movementLog[i], logX, logY);
          logY -= 18;
        }

        // Draw instructions on the right side of the HUD
        ctx.textAlign = "right";
        ctx.fillText("Use Arrow keys to move", canvas.width - 20, canvas.height - 85);
        ctx.fillText("SPACE: Generate Dungeon", canvas.width - 20, canvas.height - 60);

        // Draw the mini-map at the bottom-right of the HUD
        drawMiniMap();
      }

      function drawMiniMap() {
        const mapScale = 0.2;
        const mapWidth = GRID_SIZE * TILE_WIDTH * mapScale;
        const mapHeight = GRID_SIZE * TILE_HEIGHT * mapScale;
        // Place the mini-map in the bottom-right with some margin
        const offsetX = canvas.width - mapWidth - 630;
        const offsetY = canvas.height - mapHeight - 20;

        // Draw mini-map background
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(offsetX - 5, offsetY - 5, mapWidth + 10, mapHeight + 10);

        // Draw each cell in the mini-map
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            const cell = dungeon[playerFloor][y][x];
            let color;
            if (cell === "floor") color = "#bbb";
            else if (cell === "wall") color = "#333";
            else if (cell === "up") color = "#4caf50";
            else if (cell === "down") color = "#2196f3";
            else color = "#000";
            ctx.fillStyle = color;
            ctx.fillRect(
              offsetX + x * TILE_WIDTH * mapScale,
              offsetY + y * TILE_HEIGHT * mapScale,
              TILE_WIDTH * mapScale,
              TILE_HEIGHT * mapScale
            );
          }
        }

        // Draw the player indicator on the mini-map
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(
          offsetX + playerX * TILE_WIDTH * mapScale,
          offsetY + playerY * TILE_HEIGHT * mapScale,
          TILE_WIDTH * mapScale,
          TILE_HEIGHT * mapScale
        );
      }

            // =================
            // 9. GAME LOOP & FLOW
            // =================

            // Draw a simple welcome screen.
            function drawWelcomeScreen() {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = "#fff";
              ctx.font = "32px sans-serif";
              ctx.textAlign = "center";
              ctx.fillText("3D Isometric Dungeon", canvas.width / 2, canvas.height / 2 - 20);
              ctx.font = "20px sans-serif";
              ctx.fillText("Press SPACE to begin", canvas.width / 2, canvas.height / 2 + 20);
            }

            drawWelcomeScreen();

            // Game loop: repeatedly update and draw.
            function gameLoop() {
              drawDungeon();
              requestAnimationFrame(gameLoop);
            }

            // Handle player movement.
            document.addEventListener("keydown", (e) => {
              if (!gameStarted) return;
              let newX = playerX;
              let newY = playerY;
              let action = "";
              switch (e.key) {
                case "ArrowUp":
                  newY--;
                  action = "Moved Up";
                  break;
                case "ArrowDown":
                  newY++;
                  action = "Moved Down";
                  break;
                case "ArrowLeft":
                  newX--;
                  action = "Moved Left";
                  break;
                case "ArrowRight":
                  newX++;
                  action = "Moved Right";
                  break;
                default:
                  return;
              }
              if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
                const target = dungeon[playerFloor][newY][newX];
                if (["floor", "up", "down"].includes(target)) {
                  playerX = newX;
                  playerY = newY;
                  if (target === "up" && playerFloor < FLOOR_COUNT - 1) {
                    playerFloor++;
                    action = "Ascended Stairs";
                  } else if (target === "down" && playerFloor > 0) {
                    playerFloor--;
                    action = "Descended Stairs";
                  }
                  addLog(action);
                }
              }
            });

            // Start dungeon generation on SPACE.
            document.addEventListener("keydown", (e) => {
              if (e.code === "Space" && !gameStarted) {
                gameStarted = true;
                buildFloors();
                addStairs();
                do {
                  playerX = Math.floor(Math.random() * GRID_SIZE);
                  playerY = Math.floor(Math.random() * GRID_SIZE);
                } while (dungeon[0][playerY][playerX] !== "floor");
                playerFloor = 0;
                addLog("Dungeon Generated");
                // Start game loop.
                gameLoop();
              }
            });

            // Initial prompt.
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "white";
            ctx.font = "24px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("PRESS SPACE", canvas.width / 2, canvas.height / 2);
    </script>
  </body>
</html>
