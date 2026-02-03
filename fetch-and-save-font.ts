// Fetch PT Sans font base64 and save to file
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const url = 'https://functions.poehali.dev/cefc89ce-9c6a-4a3a-81a1-25e6d62ca32d';
const outputPath = 'public/fonts/PTSans-Regular.txt';

console.log('Fetching PT Sans font from backend...');

try {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const text = await response.text();
  
  // Check if it's JSON or plain text
  let base64String: string;
  try {
    const json = JSON.parse(text);
    base64String = json.base64 || text;
  } catch {
    // Not JSON, use as-is
    base64String = text;
  }
  
  console.log(`Received ${base64String.length} characters`);
  
  // Create directory if it doesn't exist
  mkdirSync(dirname(outputPath), { recursive: true });
  
  // Save to file
  writeFileSync(outputPath, base64String, 'utf-8');
  
  console.log(`✓ Successfully saved to ${outputPath}`);
  console.log(`✓ File size: ${base64String.length} characters`);
  
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
