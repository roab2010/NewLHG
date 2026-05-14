const axios = require('axios');

// Resolve custom Steam vanity URLs to Steam64 IDs via XML endpoint
async function resolveSteamId(customUrl) {
  try {
    const resp = await axios.get(`https://steamcommunity.com/id/${customUrl}?xml=1`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 10000,
    });
    const match = resp.data.match(/<steamID64>(\d+)<\/steamID64>/);
    return match ? match[1] : null;
  } catch (e) {
    console.error(`Error resolving ${customUrl}:`, e.message);
    return null;
  }
}

async function main() {
  const vanityNames = ['sae2k', 'Jumbo00', 'quan15082004'];
  for (const name of vanityNames) {
    const id = await resolveSteamId(name);
    console.log(`${name} => ${id}`);
  }
}

main();
