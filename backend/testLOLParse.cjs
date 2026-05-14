const cheerio = require('cheerio')
const fs = require('fs')

const html = fs.readFileSync('deeplol_dump.html', 'utf8')
const $ = cheerio.load(html)

const rank = $('.tier_color').first().text()
const lpMatch = html.match(/(\d+) LP/);
const lp = lpMatch ? lpMatch[0] : '0 LP';
const winRateMatch = html.match(/Win Rate (\d+%)/);
const winRate = winRateMatch ? winRateMatch[1] : '0%';

// For KDA: <div class="sc-jSWjmg gylagZ"><span font-weight="500" font-size="14px" value="3.00" class="sc-ZLgtj cIhIQd">3.00 KDA</span>
const kdaMatch = html.match(/([\d.]+) KDA/);
const kda = kdaMatch ? kdaMatch[1] : '0.00';

console.log('Rank:', rank)
console.log('LP:', lp)
console.log('WinRate:', winRate)
console.log('KDA:', kda)
