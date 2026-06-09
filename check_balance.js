import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

let openBraces = 0;
let openParens = 0;
let lineNum = 0;

for (let line of lines) {
  lineNum++;
  for (let char of line) {
    if (char === '{') openBraces++;
    if (char === '}') openBraces--;
    if (char === '(') openParens++;
    if (char === ')') openParens--;
  }
}

console.log(`Final checks: openBraces: ${openBraces}, openParens: ${openParens}`);

// Since it's a JSX file, we can also check line-by-line in our edited area
console.log('\nScanning edited area (lines 630 to 760):');
let braces = 0;
let parens = 0;
for (let i = 631; i < 755; i++) {
  const line = lines[i];
  for (let char of line) {
    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '(') parens++;
    if (char === ')') parens--;
  }
  if (braces < 0 || parens < 0) {
    console.log(`Mismatch hit at line ${i + 1}: braces=${braces}, parens=${parens} on: ${line}`);
    break;
  }
}
console.log(`Scan finished: braces=${braces}, parens=${parens}`);
