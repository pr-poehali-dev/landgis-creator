// Run with: bun run fetch-font.ts
// This will fetch the PT Sans font base64 from the backend function

const url = 'https://functions.poehali.dev/cefc89ce-9c6a-4a3a-81a1-25e6d62ca32d';

console.error('Fetching PT Sans font base64...');
console.error(`URL: ${url}\n`);

try {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const base64 = await response.text();
  
  console.error(`Success! Received ${base64.length} characters`);
  console.error('Base64 string output below:\n');
  console.error('='.repeat(80));
  
  // Output to stdout (so it can be redirected to a file)
  console.log(base64);
  
} catch (error) {
  console.error(`Error: ${error}`);
  process.exit(1);
}
