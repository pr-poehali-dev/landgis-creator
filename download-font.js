import https from 'https';
import http from 'http';
import fs from 'fs';

// Try multiple sources for PT Sans Regular TTF
const fontUrls = [
  'https://github.com/google/fonts/raw/main/ofl/ptsans/PTSans-Regular.ttf',
  'https://raw.githubusercontent.com/google/fonts/main/ofl/ptsans/PTSans-Regular.ttf',
  'https://github.com/google/fonts/blob/main/ofl/ptsans/PTSans-Regular.ttf?raw=true'
];

async function downloadFont(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        downloadFont(response.headers.location).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  for (const url of fontUrls) {
    try {
      console.error(`Trying: ${url}`);
      const buffer = await downloadFont(url);
      const base64 = buffer.toString('base64');
      console.log(base64);
      return;
    } catch (error) {
      console.error(`Failed: ${error.message}`);
    }
  }
  
  console.error('All download attempts failed');
  process.exit(1);
}

main();
