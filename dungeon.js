<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>3D Isometric Dungeon with Stairs</title>
    <style>
      body {
        background-color: #222;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        color: #fff;
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
      // ----- Constants -----
      const GRID_SIZE = 25;
      const FLOOR_COUNT = 25;
      const TILE_WIDTH = 32;
      const TILE_HEIGHT = 16;

      // ----- Global State -----
      let dungeon = []; // 3D array: dungeon[floor][row][col]
      let gameStarted = false;
      let playerX, playerY, playerFloor;

      // ----- Dungeon Generation -----
      // Build every floor with a random walk carving out "floor" cells.
      function buildFloors() {
        for (let z = 0; z < FLOOR_COUNT; z++) {
          dungeon[z] = [];
          for (let y = 0; y < GRID_SIZE; y++) {
            dungeon[z][y] = [];
            for (let x = 0; x < GRID_SIZE; x++) {
              dungeon[z][y][x] = "wall"; // Initialize as wall.
            }
          }
          // Carve out floor cells on floor z using a random walk from the center.
          let currentX = Math.floor(GRID_SIZE / 2);
          let currentY = Math.floor(GRID_SIZE / 2);
          dungeon[z][currentY][currentX] = "floor";
          const steps = 100; // Adjust for open space density.
          for (let i = 0; i < steps; i++) {
            const direction = Math.floor(Math.random() * 4); // 0: up, 1: right, 2: down, 3: left.
            if (direction === 0 && currentY > 0) currentY--;
            else if (direction === 1 && currentX < GRID_SIZE - 1) currentX++;
            else if (direction === 2 && currentY < GRID_SIZE - 1) currentY++;
            else if (direction === 3 && currentX > 0) currentX--;
            dungeon[z][currentY][currentX] = "floor";
          }
        }
      }

      // Check if cell (x,y) on floor z has at least one orthogonal adjacent cell that is walkable.
      function hasOrthogonalAdjacentFloor(z, x, y) {
        const dirs = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 }
        ];
        for (let d of dirs) {
          const nx = x + d.dx, ny = y + d.dy;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
            const neighbor = dungeon[z][ny][nx];
            if (neighbor === "floor" || neighbor === "up" || neighbor === "down") {
              return true;
            }
          }
        }
        return false;
      }

      // First pass: Try to add a stair pair between each consecutive pair of floors.
      function addStairsFirstPass() {
        for (let z = 0; z < FLOOR_COUNT - 1; z++) {
          let added = false;
          for (let attempt = 0; attempt < 200; attempt++) {
            const stairX = Math.floor(Math.random() * GRID_SIZE);
            const stairY = Math.floor(Math.random() * GRID_SIZE);
            if (dungeon[z][stairY][stairX] === "floor" &&
                dungeon[z+1][stairY][stairX] === "floor" &&
                hasOrthogonalAdjacentFloor(z, stairX, stairY)) {
              dungeon[z][stairY][stairX] = "up";       // Mark as stairs up on current floor.
              dungeon[z+1][stairY][stairX] = "down";     // Mark as stairs down on next floor.
              added = true;
              break;
            }
          }
          if (!added) {
            console.log("First pass: Failed to add stair pair between floors", z, "and", z+1);
          }
        }
      }

      // Second pass: Ensure each floor has at least one "up" and each floor (except floor 0) has a "down".
      function addStairsSecondPass() {
        // Ensure floors 1..(FLOOR_COUNT-1) have a "down".
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
                if (dungeon[z-1][y][x] === "floor" &&
                    dungeon[z][y][x] === "floor" &&
                    hasOrthogonalAdjacentFloor(z-1, x, y)) {
                  dungeon[z-1][y][x] = "up";
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
        // Ensure floors 0..(FLOOR_COUNT-2) have an "up".
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
                if (dungeon[z][y][x] === "floor" &&
                    dungeon[z+1][y][x] === "floor" &&
                    hasOrthogonalAdjacentFloor(z, x, y)) {
                  dungeon[z][y][x] = "up";
                  dungeon[z+1][y][x] = "down";
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

      // Combined function to add stairs.
      function addStairs() {
        addStairsFirstPass();
        addStairsSecondPass();
      }

      // ----- Isometric Drawing Setup -----
      const canvas = document.getElementById("dungeonCanvas");
      const ctx = canvas.getContext("2d");

      // Convert grid coordinates (x,y) to isometric screen coordinates.
      function toIsometric(x, y) {
        const isoX = (x - y) * (TILE_WIDTH / 2) + canvas.width / 2;
        const isoY = (x + y) * (TILE_HEIGHT / 2) + 50;
        return { isoX, isoY };
      }

      // Draw a single tile.
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
        ctx.strokeStyle = "#222";
        ctx.stroke();
      }

      // Draw the current floor and the player.
      function drawDungeon() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            const cell = dungeon[playerFloor][y][x];
            let color;
            if (cell === "floor") color = "#ccc";      // Light gray floor.
            else if (cell === "wall") color = "#444";    // Dark gray wall.
            else if (cell === "up") color = "#0f0";        // Green for stairs up.
            else if (cell === "down") color = "#00f";      // Blue for stairs down.
            else color = "#000";
            drawTile(x, y, color);
          }
        }
        // Draw the player as a red diamond.
        const { isoX, isoY } = toIsometric(playerX, playerY);
        ctx.beginPath();
        ctx.moveTo(isoX, isoY);
        ctx.lineTo(isoX + TILE_WIDTH / 2, isoY + TILE_HEIGHT / 2);
        ctx.lineTo(isoX, isoY + TILE_HEIGHT);
        ctx.lineTo(isoX - TILE_WIDTH / 2, isoY + TILE_HEIGHT / 2);
        ctx.closePath();
        ctx.fillStyle = "red";
        ctx.fill();
        // Display the current floor.
        ctx.fillStyle = "white";
        ctx.font = "20px sans-serif";
        ctx.fillText("Floor: " + (playerFloor + 1), 10, 30);
      }

      // ----- Player Movement -----
      document.addEventListener("keydown", function(e) {
        if (!gameStarted) return;
        let newX = playerX, newY = playerY;
        switch (e.key) {
          case "ArrowUp":
            newY--;
            break;
          case "ArrowDown":
            newY++;
            break;
          case "ArrowLeft":
            newX--;
            break;
          case "ArrowRight":
            newX++;
            break;
          default:
            return;
        }
        if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
          const target = dungeon[playerFloor][newY][newX];
          if (["floor", "up", "down"].includes(target)) {
            playerX = newX;
            playerY = newY;
            if (target === "up" && playerFloor < FLOOR_COUNT - 1) playerFloor++;
            else if (target === "down" && playerFloor > 0) playerFloor--;
            drawDungeon();
          }
        }
      });

      // ----- Start Dungeon Generation on Space Bar -----
      document.addEventListener("keydown", function(e) {
        if (e.code === "Space" && !gameStarted) {
          gameStarted = true;
          buildFloors();
          addStairs();
          // Start the player at the center of floor 0.
          playerX = Math.floor(GRID_SIZE / 2);
          playerY = Math.floor(GRID_SIZE / 2);
          playerFloor = 0;
          drawDungeon();
        }
      });

      // ----- Initial Instruction -----
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PRESS SPACE", canvas.width / 2, canvas.height / 2);
    </script>
  </body>
</html>
