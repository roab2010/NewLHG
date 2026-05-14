const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

puppeteer.use(StealthPlugin());

async function dumpRanks() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Use Roab's Steam64 ID: 76561199167690122
  await page.goto('https://csstats.gg/player/76561199167690122', { waitUntil: 'networkidle2' });
  
  const ranksHtml = await page.evaluate(() => {
    // Try to find the container holding the ranks. It's usually a table or a specific div structure.
    const rankContainers = Array.from(document.querySelectorAll('.rank, .ranks, [class*="rank"]'));
    return rankContainers.map(el => el.outerHTML).join('\n\n---\n\n');
  });

  fs.writeFileSync('ranks_dump.html', ranksHtml);
  
  // Let's also just dump the whole left column
  const leftColHtml = await page.evaluate(() => {
      const leftCol = document.querySelector('#player-sidebar, .sidebar, .left-col') || document.body;
      return leftCol.innerHTML;
  });
  fs.writeFileSync('left_col_dump.html', leftColHtml);

  await browser.close();
}

dumpRanks().catch(console.error);
