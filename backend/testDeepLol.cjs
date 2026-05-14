const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const fs = require('fs')

async function test() {
  console.log('Launching browser...')
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  console.log('Navigating to DeepLoL...')
  await page.goto('https://www.deeplol.gg/summoner/vn/Young%20B-2010', { waitUntil: 'networkidle2' })
  console.log('Waiting for content...')
  await new Promise(r => setTimeout(r, 5000))
  const html = await page.content()
  fs.writeFileSync('deeplol_dump.html', html)
  console.log('Done! Saved to deeplol_dump.html')
  await browser.close()
}
test()
