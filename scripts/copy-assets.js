const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../node_modules/katex/dist');
const destDir = path.resolve(__dirname, '../media');

// Create media directory if it doesn't exist
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Copy CSS
const cssSrc = path.join(srcDir, 'katex.min.css');
const cssDest = path.join(destDir, 'katex.min.css');
if (fs.existsSync(cssSrc)) {
    fs.copyFileSync(cssSrc, cssDest);
    console.log(`Copied ${cssSrc} to ${cssDest}`);
} else {
    console.warn(`Warning: ${cssSrc} not found. skipping.`);
}

// Copy Fonts
const fontsSrc = path.join(srcDir, 'fonts');
const fontsDest = path.join(destDir, 'fonts');

if (fs.existsSync(fontsSrc)) {
    if (!fs.existsSync(fontsDest)) {
        fs.mkdirSync(fontsDest, { recursive: true });
    }

    const fonts = fs.readdirSync(fontsSrc);
    fonts.forEach(font => {
        const srcFile = path.join(fontsSrc, font);
        const destFile = path.join(fontsDest, font);
        fs.copyFileSync(srcFile, destFile);
        console.log(`Copied ${font} to ${fontsDest}`);
    });
} else {
    console.warn(`Warning: ${fontsSrc} not found. skipping.`);
}
