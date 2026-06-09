import fs from 'fs';

const filePath = 'src/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF
content = content.replace(/\r\n/g, '\n');

// Find the target block with duplicate enclosing div and replace it
const targetStr = `                          </div>
                        </div>
                      </div>

                       {/* Chapa Coverage properties */}`;

const replacementStr = `                          </div>
                        </div>

                       {/* Chapa Coverage properties */}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log('Successfully replaced standard skeleton closing block!');
} else {
  // Try alternative search matching slightly different spaces
  console.log('Target string not found literally, trying regex replace...');
  content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*\n\s*\{\/\* Chapa Coverage properties \*\/\}/g, '</div>\n</div>\n\n                       {/* Chapa Coverage properties */}');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('App.tsx normalized and written successfully.');
