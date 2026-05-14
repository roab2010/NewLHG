const fs=require('fs'); 
const cheerio=require('cheerio'); 
const html=fs.readFileSync('trackerHtml.html', 'utf8'); 
const $=cheerio.load(html); 
fs.writeFileSync('trackerText.txt', $('body').text().replace(/\s+/g, ' '));
