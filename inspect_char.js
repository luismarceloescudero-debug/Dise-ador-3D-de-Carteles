import fs from 'fs';

const content = fs.readFileSync('src/App.tsx', 'utf8');
const lines = content.split('\n');
for (let i = 751; i <= 756; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}
