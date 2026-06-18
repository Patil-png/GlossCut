const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Store chrome in the project folder to ensure it is packaged and available at runtime on Render
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
