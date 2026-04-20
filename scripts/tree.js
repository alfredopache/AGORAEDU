const fs = require('fs');
const path = require('path');

// Buscamos la raíz (donde está el package.json)
const rootDir = path.resolve(__dirname, '..'); 

function listFiles(dir, indent = '') {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        // Filtros de exclusión
        if (['node_modules', '.next', '.git', 'dist', '.env.local'].includes(file)) return;
        
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        console.log(`${indent}${stats.isDirectory() ? '📁' : '📄'} ${file}`);
        
        if (stats.isDirectory()) {
            listFiles(filePath, indent + '  ');
        }
    });
}

console.log(`\n🌳 Estructura de: ${path.basename(rootDir)}\n`);
listFiles(rootDir);