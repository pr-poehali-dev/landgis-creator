export async function getPTSansFont(): Promise<string> {
  const response = await fetch('https://functions.poehali.dev/cefc89ce-9c6a-4a3a-81a1-25e6d62ca32d');
  const text = await response.text();
  
  try {
    const data = JSON.parse(text);
    return data.base64 || text;
  } catch {
    return text;
  }
}