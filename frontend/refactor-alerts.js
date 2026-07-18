const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(srcDir, (filePath) => {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  if (filePath.includes('GlobalAlert.js') || filePath.includes('alertService.js')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace window.alert and alert
  content = content.replace(/\bwindow\.alert\(/g, 'alert(');
  // We don't need to replace `alert(` with `alert(` because it's the same, 
  // but we do need to add the import if it uses alert or confirm

  // Replace window.confirm and confirm with await confirm
  content = content.replace(/\bwindow\.confirm\(/g, 'await confirm(');
  content = content.replace(/(?<!await )\bconfirm\(/g, 'await confirm(');

  if (content !== originalContent || content.match(/\b(alert|confirm)\(/)) {
    // Check if we need to add import
    if (!content.includes("import { alert, confirm } from '@/utils/alertService';") &&
        !content.includes("import { alert, confirm } from")) {
      // Add import after the last import statement or at top
      const lines = content.split('\n');
      let lastImportIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) lastImportIdx = i;
      }
      
      const importStatement = "import { alert, confirm } from '@/utils/alertService';";
      if (lastImportIdx >= 0) {
        lines.splice(lastImportIdx + 1, 0, importStatement);
      } else {
        lines.unshift(importStatement);
      }
      content = lines.join('\n');
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
