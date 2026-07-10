const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');

function fixFiles(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      fixFiles(fullPath);
    } else if (file.endsWith('route.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Check if dynamic export already exists
      if (!content.includes('export const dynamic')) {
        // Add dynamic export after the first import
        content = content.replace(
          /import.*from.*";\n/,
          (match) => match + '\nexport const dynamic = "force-static";\n'
        );
        fs.writeFileSync(fullPath, content);
        console.log('Fixed:', fullPath);
      }
    }
  }
}

fixFiles(apiDir);
console.log('Done!');
