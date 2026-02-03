// Script to download PT Sans Regular TTF and convert to base64

const urls = [
  'https://raw.githubusercontent.com/google/fonts/main/ofl/ptsans/PTSans-Regular.ttf',
  'https://github.com/google/fonts/raw/refs/heads/main/ofl/ptsans/PTSans-Regular.ttf'
];

async function downloadFont() {
  for (const url of urls) {
    try {
      console.error(`Attempting to download from: ${url}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed with status: ${response.status}`);
        continue;
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      
      console.error(`Successfully downloaded ${buffer.length} bytes`);
      console.log(base64);
      return;
    } catch (error) {
      console.error(`Error: ${error}`);
    }
  }
  
  console.error('All download attempts failed');
  process.exit(1);
}

downloadFont();
