const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const foldersToDump = ['app', 'components', 'content', 'lib', 'sanity/schemaTypes']; // Las carpetas que nos interesan
const outputFile = path.join(rootDir, 'proyecto_completo.txt');

let fullContent = '';

function dumpFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        if (['node_modules', '.next', '.git', 'dist'].includes(file)) return;
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            dumpFiles(filePath);
        } else if (file.match(/\.(ts|tsx|js|jsx|css)$/)) {
            const relativePath = path.relative(rootDir, filePath);
            const content = fs.readFileSync(filePath, 'utf8');
            fullContent += `\n--- FILE: ${relativePath} ---\n${content}\n`;
        }
    });
}

console.log('📦 Generando volcado de código...');
foldersToDump.forEach(folder => {
    const folderPath = path.join(rootDir, folder);
    if (fs.existsSync(folderPath)) dumpFiles(folderPath);
});

fs.writeFileSync(outputFile, fullContent);
console.log(`✅ ¡Listo! Código guardado en: ${outputFile}`);