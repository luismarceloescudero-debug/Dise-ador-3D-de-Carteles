import fs from 'fs';

const filePath = 'src/App.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('--- Inspecting ending lines of parameters block ---');
for (let i = 624; i <= 634; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}

// We want to remove the extra closing div on line 632 (index 631)
if (lines[631].trim() === '</div>' && lines[630].trim() === '</div>') {
  console.log('Detected duplicate closing divs! Removing line index 631...');
  lines.splice(631, 1);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Successfully saved!');
} else {
  console.log('Did not find contiguous closing divs at index 630-631');
}
