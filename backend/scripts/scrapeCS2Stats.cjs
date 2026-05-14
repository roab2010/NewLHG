/**
 * CS2 Stats Scraper - Scrape player stats from csstats.gg
 * Uses puppeteer-extra with stealth plugin to bypass Cloudflare
 * 
 * Run: node scripts/scrapeCS2Stats.cjs
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

// All team members with their Steam64 IDs
const PLAYERS = [
  {
    nickname: 'NhanHoang',
    realName: 'Hoàng Hữu Nhân',
    steamId: '76561198390172300',
    color: '#3B82F6',
  },
  {
    nickname: 'Roab',
    realName: 'Lâm Quốc Bảo',
    steamId: '76561199167690122',
    color: '#EAB308',
  },
  {
    nickname: 'YenOi',
    realName: 'Hoàng Trí Luật',
    steamId: '76561199042104680',
    color: '#A855F7',
  },
  {
    nickname: 'LocMaster',
    realName: 'Đặng Thành Lộc',
    steamId: '76561199229851727',
    color: '#EF4444',
  },
  {
    nickname: 'TuanKitt',
    realName: 'Nguyễn Trương Tuấn Kiệt',
    steamId: '76561198876989182',
    color: '#F97316',
  },
  {
    nickname: 'XunWon',
    realName: 'Nguyễn Anh Xuân Quân',
    steamId: '76561198877435442',
    color: '#9CA3AF',
  },
];

async function scrapePlayer(browser, player) {
  console.log(`\n🔍 Scraping stats for ${player.nickname} (${player.realName})...`);
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1920, height: 1080 });
  
  const url = `https://csstats.gg/player/${player.steamId}`;
  console.log(`   URL: ${url}`);

  try {
    // Navigate and wait for AJAX stats to load
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for stats to load via AJAX - the page fires getStats() after 100ms
    // Wait up to 15 seconds for the stats content to appear
    try {
      await page.waitForFunction(() => {
        // Check if stats have loaded (the stats section has content)
        const el = document.getElementById('player-loading-section');
        if (!el) return false;
        // If loading spinner is gone and there's content
        return !el.classList.contains('loading') && el.innerHTML.length > 100;
      }, { timeout: 15000 });
      console.log(`   ✅ Stats loaded for ${player.nickname}`);
    } catch (e) {
      console.log(`   ⚠️ Stats may not have fully loaded for ${player.nickname}`);
    }

    // Small delay to ensure rendering is complete
    await new Promise(r => setTimeout(r, 2000));

    // Extract all data from the page
    const stats = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };

      const getNumber = (selector) => {
        const text = getText(selector);
        if (!text) return null;
        const num = parseFloat(text.replace(/,/g, '').replace('%', ''));
        return isNaN(num) ? null : num;
      };

      // Player info
      const playerName = getText('#player-name') || getText('.player-name') || '';
      const avatarEl = document.querySelector('#player-avatar img, .player-avatar img, .steam-avatar img');
      const avatar = avatarEl ? avatarEl.src : '';

      // Rank info (Premier rating)
      let currentRank = null;
      let currentRankBg = null;
      let bestRank = null;
      let bestRankBg = null;

      // Find the first premier rating block (S4 or current season)
      const premierBlocks = document.querySelectorAll('.cs2rating');
      if (premierBlocks.length > 0) {
        // Extract text like "10<small>,740</small>"
        const extractRating = (el) => {
          if (!el) return null;
          let text = '';
          const span = el.querySelector('span');
          if (span) {
            // Get all child nodes to reconstruct the text
            span.childNodes.forEach(node => {
               if (node.nodeType === 3) text += node.textContent.trim();
               if (node.nodeName === 'SMALL') text += ',' + node.textContent.trim();
            });
          }
          text = text.replace(/^,|,$/g, '').trim(); // clean up
          return text === '---' || text === '' ? null : text;
        };

        const extractBg = (el) => {
          if (!el) return null;
          const style = el.getAttribute('style') || '';
          const match = style.match(/url\((.*?)\)/);
          return match ? match[1] : null;
        };

        currentRank = extractRating(premierBlocks[0]);
        currentRankBg = extractBg(premierBlocks[0]);

        if (premierBlocks.length > 1) {
           bestRank = extractRating(premierBlocks[1]);
           bestRankBg = extractBg(premierBlocks[1]);
        }
      }

      // Fallback to competitive rank images if no premier rating is found
      if (!currentRank && !currentRankBg) {
        const rankImages = document.querySelectorAll('img[src*="ranks"]');
        if (rankImages.length > 0) currentRank = rankImages[0].src;
        if (rankImages.length > 1) bestRank = rankImages[1].src;
      }

      // Try to get stats from the stats section
      // The stats section loads via AJAX into #player-loading-section
      const statsSection = document.getElementById('player-loading-section');
      
      // Helper to find stat values in the page
      const findStatValue = (labels) => {
        const allText = document.body.innerText;
        for (const label of labels) {
          // Try finding by looking at specific stat containers
          const allElements = document.querySelectorAll('span, div, td, p');
          for (const el of allElements) {
            if (el.textContent.trim() === label) {
              // Look for value in siblings or parent
              const parent = el.closest('div, td, tr');
              if (parent) {
                const valueEls = parent.querySelectorAll('span, div');
                for (const ve of valueEls) {
                  const val = ve.textContent.trim();
                  if (val !== label && val.match(/^[\d,.%]+$/)) {
                    return parseFloat(val.replace(/,/g, '').replace('%', ''));
                  }
                }
              }
            }
          }
        }
        return null;
      };

      // Try to extract stats from the rendered page
      // csstats.gg uses specific class patterns for stat blocks
      const statBlocks = {};
      
      // Look for stat containers with specific patterns
      const containers = document.querySelectorAll('[class*="stat"], [class*="info"], .row');
      
      // Get all text content and try to parse structured data
      const bodyText = document.body.innerText;
      
      // Parse K/D - usually displayed prominently
      let kd = null;
      let rating = null;
      let winRate = null;
      let hsPercent = null;
      let adr = null;
      let kills = null;
      let deaths = null;
      let assists = null;
      let headshots = null;
      let played = null;
      let won = null;
      let lost = null;
      let tied = null;
      let damage = null;
      let rounds = null;

      // Try finding stat values by looking for labeled pairs
      const findPairValue = (labelText) => {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (node.textContent.trim().toUpperCase() === labelText.toUpperCase()) {
            // Look at parent and siblings for the number
            let parent = node.parentElement;
            for (let i = 0; i < 5; i++) {
              if (!parent) break;
              const texts = parent.innerText.split('\n').map(t => t.trim()).filter(Boolean);
              const labelIdx = texts.findIndex(t => t.toUpperCase() === labelText.toUpperCase());
              if (labelIdx >= 0) {
                // Look for a number near the label
                for (let j = Math.max(0, labelIdx - 2); j < Math.min(texts.length, labelIdx + 3); j++) {
                  if (j === labelIdx) continue;
                  const val = texts[j].replace(/,/g, '').replace('%', '');
                  if (val.match(/^\d+\.?\d*$/)) {
                    return parseFloat(val);
                  }
                }
              }
              parent = parent.parentElement;
            }
          }
        }
        return null;
      };

      kills = findPairValue('KILLS');
      deaths = findPairValue('DEATHS');
      assists = findPairValue('ASSISTS');
      headshots = findPairValue('HEADSHOTS');
      played = findPairValue('PLAYED');
      won = findPairValue('WON');
      lost = findPairValue('LOST');
      tied = findPairValue('TIED');
      damage = findPairValue('DAMAGE');
      rounds = findPairValue('ROUNDS');

      // K/D and rating are usually in big numbers
      // Look for elements with large font sizes or specific classes
      const bigNumbers = document.querySelectorAll('[style*="font-size"], .big-stat, .stat-value');
      
      // Alternative: try to get K/D from the text pattern
      const kdMatch = bodyText.match(/K\/D[\s\S]*?([\d.]+)/);
      if (kdMatch) kd = parseFloat(kdMatch[1]);

      const ratingMatch = bodyText.match(/HLTV RATING[\s\S]*?([\d.]+)/i);
      if (ratingMatch) rating = parseFloat(ratingMatch[1]);

      const winRateMatch = bodyText.match(/WIN RATE[\s\S]*?([\d.]+)%/i);
      if (winRateMatch) winRate = parseFloat(winRateMatch[1]);

      const hsMatch = bodyText.match(/HS%[\s\S]*?([\d.]+)%/i);
      if (hsMatch) hsPercent = parseFloat(hsMatch[1]);

      const adrMatch = bodyText.match(/ADR[\s\S]*?([\d.]+)/i);
      if (adrMatch) adr = parseFloat(adrMatch[1]);

      return {
        playerName,
        avatar,
        currentRank,
        currentRankBg,
        bestRank,
        bestRankBg,
        kd,
        rating,
        winRate,
        hsPercent,
        adr,
        kills,
        deaths,
        assists,
        headshots,
        played,
        won,
        lost,
        tied,
        damage,
        rounds,
      };
    });

    await page.close();

    return {
      ...player,
      steamProfile: `https://steamcommunity.com/profiles/${player.steamId}`,
      csstatsUrl: url,
      ...stats,
      scrapedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error(`   ❌ Error scraping ${player.nickname}:`, error.message);
    await page.close();
    return {
      ...player,
      steamProfile: `https://steamcommunity.com/profiles/${player.steamId}`,
      csstatsUrl: url,
      error: error.message,
      scrapedAt: new Date().toISOString(),
    };
  }
}

async function main() {
  console.log('🎮 CS2 Stats Scraper - Long Hải Esports');
  console.log('========================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1920,1080',
    ],
  });

  const results = [];

  for (const player of PLAYERS) {
    const result = await scrapePlayer(browser, player);
    results.push(result);
    console.log(`   Data:`, JSON.stringify(result, null, 2).substring(0, 300));
    // Small delay between players to be polite
    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();

  // Save results to JSON
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, 'cs2stats.json');
  const output = {
    lastUpdated: new Date().toISOString(),
    players: results,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\n✅ Results saved to ${outputPath}`);
  console.log(`📊 Scraped ${results.length} players`);
  
  // Summary
  console.log('\n📋 Summary:');
  for (const r of results) {
    console.log(`   ${r.nickname}: K/D=${r.kd || '?'}, HS=${r.hsPercent || '?'}%, WR=${r.winRate || '?'}%, ADR=${r.adr || '?'}`);
  }
}

main().catch(console.error);
