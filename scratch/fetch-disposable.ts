import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Fetching disposable email domains from GitHub...');
  try {
    const urls = [
      'https://raw.githubusercontent.com/7c/fakefilter/main/txt/data.txt',
      'https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/refs/heads/main/disposable_email_blocklist.conf'
    ];

    const domains = new Set<string>();

    for (const url of urls) {
      console.log(`Fetching from: ${url}`);
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`Failed to fetch ${url}: ${res.statusText}`);
        continue;
      }
      const text = await res.text();
      const lines = text.split('\n');
      for (const line of lines) {
        const cleaned = line.trim().toLowerCase();
        if (cleaned && !cleaned.startsWith('#') && !cleaned.startsWith('//')) {
          domains.add(cleaned);
        }
      }
    }

    console.log(`Successfully fetched and parsed ${domains.size} unique disposable email domains.`);
    
    const outputPath = path.resolve('C:/Users/ossamamehmood/.gemini/antigravity/scratch/LeadPure-AI/src/lib/disposable-domains.json');
    fs.writeFileSync(outputPath, JSON.stringify(Array.from(domains), null, 2), 'utf-8');
    console.log(`Saved output to ${outputPath}`);
  } catch (err) {
    console.error('Error fetching disposable domains:', err);
  }
}

main();
