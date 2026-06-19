const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, 'frontend/src/pages');

// Map of link text to lucide-react icon component name
const iconMap = {
  'Dashboard': 'LayoutDashboard',
  'My Listings': 'Building',
  'Listings': 'Building',
  'Add Property': 'PlusCircle',
  'Add Listing': 'PlusCircle',
  'Inquiries': 'MessageSquare',
  'Profile': 'UserCircle',
  'Users': 'Users',
  'Settings': 'Settings',
  'Saved': 'Heart',
  'Watchlist': 'Heart',
  'Compare': 'Scale',
  'Investor Hub': 'Briefcase',
  'Portfolio': 'PieChart'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Check if the file has NavLinks inside a sidebar-menu or similar layout
  const linkRegex = /<NavLink[^>]*>(.*?)<\/NavLink>/g;
  let hasSidebarLinks = false;
  let neededIcons = new Set();

  content = content.replace(linkRegex, (match, inner) => {
    // Determine which icon matches the inner text
    let matchedIcon = null;
    for (const [text, icon] of Object.entries(iconMap)) {
      if (inner.includes(text) && !inner.includes('<' + icon)) {
        matchedIcon = icon;
        break;
      }
    }

    if (matchedIcon) {
      hasSidebarLinks = true;
      neededIcons.add(matchedIcon);
      // Clean up the inner text to remove any existing emojis or leading spaces
      let cleanInner = inner.replace(/[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '').trim();
      
      // Inject the icon
      return match.replace(inner, `<${matchedIcon} size={18} /> ${cleanInner}`);
    }
    return match;
  });

  if (hasSidebarLinks && neededIcons.size > 0) {
    // 2. Add import statement at the top if not present
    const iconsList = Array.from(neededIcons).join(', ');
    const importStmt = `import { ${iconsList} } from 'lucide-react';\n`;
    
    // Check if lucide-react is already imported
    if (content.includes("'lucide-react'")) {
      // It's easier to just add another import for now, or replace it if we were parsing AST.
      // Since it's regex, let's just prepend a new import if we don't have these exact ones.
      // But actually, it's safer to just prepend it.
      if (!content.includes(`import { ${iconsList} }`)) {
          content = content.replace(/(import React.*?;)/, `$1\n${importStmt}`);
      }
    } else {
      content = content.replace(/(import React.*?;)/, `$1\n${importStmt}`);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

console.log('Scanning for sidebars to inject premium icons...');
traverseDir(PAGES_DIR);
console.log('Done.');
