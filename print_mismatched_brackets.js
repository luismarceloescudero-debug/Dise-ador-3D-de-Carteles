import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];

// Let's analyze from line 360 (index 359) to line 632 (index 631)
for (let i = 359; i < 632; i++) {
  const line = lines[i];
  const tagRegex = /<\/?(div|span|button|select|input)\b[^>]*>/g;
  let match;
  while ((match = tagRegex.exec(line)) !== null) {
    const fullTag = match[0];
    const isClosing = fullTag.startsWith('</');
    const tagName = match[1];
    if (fullTag.endsWith('/>')) continue;
    
    if (isClosing) {
      if (stack.length === 0) {
        console.log(`EXTRA CLOSING TAG: </${tagName}> on line ${i + 1}`);
      } else {
        const last = stack.pop();
        if (last.name !== tagName) {
          console.log(`MISMATCH: Closing </${tagName}> on line ${i + 1}, but opened <${last.name}> on line ${last.line}`);
        }
      }
    } else {
      stack.push({ name: tagName, line: i + 1 });
    }
  }
}

console.log('\n--- Tags left unclosed in the parameters block ---');
for (let tag of stack) {
  console.log(`<${tag.name}> opened on line ${tag.line}`);
}
