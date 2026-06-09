import fs from 'fs';

const filePath = 'src/App.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Line Index 499 (1-indexed 500) content is:', JSON.stringify(lines[499]));

if (lines[499].trim() === '</div>') {
  lines.splice(499, 1);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Successfully removed the extra div at line 500!');
} else {
  console.log('Line index 499 did not match "</div>". Printing neighboring lines:');
  for (let i = 495; i <= 505; i++) {
    console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
  }
}
