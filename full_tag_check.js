import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
let lineNum = 0;

for (let line of lines) {
  lineNum++;
  // Parse tags manually and roughly using a regex for <tag> or </tag>
  // Filter for structural tags of interest: div, main, header, footer
  const tagRegex = /<\/?(div|main|header|footer)\b[^>]*>/g;
  let match;
  while ((match = tagRegex.exec(line)) !== null) {
    const fullTag = match[0];
    const isClosing = fullTag.startsWith('</');
    const tagName = match[1];
    
    // Ignore self-closing ones
    if (fullTag.endsWith('/>')) continue;
    
    if (isClosing) {
      if (stack.length === 0) {
        console.log(`ERROR: Unexpected closing tag </${tagName}> at line ${lineNum}: ${line.trim()}`);
      } else {
        const last = stack.pop();
        if (last.name !== tagName) {
          console.log(`ERROR: Mismatched closing tag </${tagName}> at line ${lineNum} (expected </${last.name}> opened at line ${last.line}): ${line.trim()}`);
        }
      }
    } else {
      stack.push({ name: tagName, line: lineNum, text: line.trim() });
    }
  }
}

console.log('\n--- Unclosed Tags Stack at End of File ---');
for (let tag of stack) {
  console.log(`Unclosed: <${tag.name}> opened at line ${tag.line}: "${tag.text}"`);
}
