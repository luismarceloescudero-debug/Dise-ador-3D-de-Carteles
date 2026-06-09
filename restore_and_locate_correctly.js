import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\n');

// 1. Revert the erroneous insert done by add_div.js around list line 322.
// Let's print lines 318 to 326 first to inspect.
console.log('--- Inspecting erroneously edited area before correction ---');
for (let i = 318; i <= 326; i++) {
  console.log(`${i + 1}: ${JSON.stringify(lines[i])}`);
}

// In lines 318 to 326, is there "                  </div>" inserted?
// Let's find index where line matches exactly '                  </div>' close to index 321
const insertedIdx = lines.findIndex((line, idx) => idx > 310 && idx < 330 && line.trim() === '</div>');
if (insertedIdx !== -1) {
  console.log('Removing misplaced </div> at line index:', insertedIdx);
  lines.splice(insertedIdx, 1);
} else {
  console.log('Misplaced </div> not found literally!');
}

// 2. Now find the correct ") : (" that represents the sidebarTab parameters/computo switch.
// This is definitely after the foundation/anchors variables (so after index 550)
const correctTernaryIdx = lines.findIndex((line, idx) => idx > 550 && line.includes(') : ('));
if (correctTernaryIdx !== -1) {
  console.log('Correct ") : (" found at index:', correctTernaryIdx);
  // We want to insert the closing div right before it
  lines.splice(correctTernaryIdx, 0, '                  </div>');
  console.log('Inserted missing closing div tag successfully!');
} else {
  console.log('Could not find correct ") : (" after line 550!');
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('App.tsx restored and corrected.');
