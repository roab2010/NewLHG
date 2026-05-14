const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('testScrape.html', 'utf8');
const $ = cheerio.load(html);
fs.writeFileSync('testScrapeText.txt', $('body').text().replace(/\s+/g, ' '));
