const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('testScrape.html', 'utf8');
const $ = cheerio.load(html);

// Find elements by some classes
console.log('Player name: ', $('title').text());

// Look for stat blocks
$('.stats-block').each((i, el) => {
    console.log('Stats block:', $(el).text().replace(/\s+/g, ' ').trim());
});

// Maybe they don't have id="kpd" etc. Let's find any div that contains k/d
$('div, span').each((i, el) => {
    const text = $(el).text();
    if (text.includes('K/D') || text.includes('KPD') || text.includes('Win Rate') || text.includes('Rating')) {
        // console.log($(el).prop('tagName'), $(el).attr('id'), $(el).attr('class'), text.replace(/\s+/g, ' ').trim());
    }
});

// Let's just print out all elements with some generic stat classes or ids
console.log('IDs containing kd or rating:', $('[id*="kd"], [id*="rating"], [id*="kpd"], [id*="win"]').length);
