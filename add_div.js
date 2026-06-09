import fs from 'fs';

const filePath = 'src/App.tsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// We want to add a closing div right before ") : (" at line 632
// Let's locate ") : ("
const targetIndex = lines.findIndex(line => line.includes(') : ('));
console.log('Found ") : (" at index:', targetIndex);

if (targetIndex !== -1) {
  // Let's insert a closing div 
  lines.splice(targetIndex, 0, '                  </div>');
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Successfully inserted the closing div tag!');
} else {
  console.log('Could not find ") : (" in App.tsx');
}
