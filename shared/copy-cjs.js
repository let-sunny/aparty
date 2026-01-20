const fs = require('fs');
const path = require('path');

const files = ['index.js', 'events.js'];
const distCjsDir = path.join(__dirname, 'dist-cjs');
const distDir = path.join(__dirname, 'dist');

files.forEach(file => {
  const src = path.join(distCjsDir, file);
  const dest = path.join(distDir, file.replace('.js', '.cjs'));
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to ${path.basename(dest)}`);
  }
});
