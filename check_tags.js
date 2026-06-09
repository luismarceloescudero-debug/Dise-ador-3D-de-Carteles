import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');

let openTags = 0;

for (let i = 359; i < 631; i++) {
  const line = lines[i];
  const openCount = (line.match(/<div/g) || []).length;
  const closeCount = (line.match(/<\/div>/g) || []).length;
  openTags += openCount - closeCount;
  console.log(`Line ${i + 1}: net=${openCount - closeCount} (total=${openTags}) | ${line.trim()}`);
}
console.log(`Scan finished: net open tags in true block = ${openTags}`);
