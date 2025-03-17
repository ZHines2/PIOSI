/**
 * logger.js
 *
 * This file contains the logic for logging messages.
 * The function `logMessage` is used to handle the logging logic for modularity.
 */

/**
 * Logs a message to the game log area.
 * @param {string} message - The message to log.
 */
export function logMessage(message) {
  const logDiv = document.getElementById("log");
  logDiv.innerHTML += `<p>${message}</p>`;
  logDiv.scrollTop = logDiv.scrollHeight;
}
