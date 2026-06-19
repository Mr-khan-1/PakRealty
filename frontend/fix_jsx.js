const fs = require('fs');
const path = require('path');

const PAGES_DIR = path.join(__dirname, 'frontend/src/pages');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Remove the incorrectly injected icons that ended up between `=>` and ``` `sidebar-link... ```
  // Example broken text:
  // className={({isActive}) =><LayoutDashboard size={18} /> `sidebar-link${isActive ? ' active' : ''}`}> Dashboard</NavLink>
  
  const badIconRegex = /=>\s*<[A-Za-z]+ size=\{18\} \/>\s*`/g;
  content = content.replace(badIconRegex, '=> `');

  // 2. Now correctly inject the icons before the inner text.
  // Example correct text:
  // className={({isActive}) => `sidebar-link${isActive ? ' active' : ''}`}><LayoutDashboard size={18} /> Dashboard</NavLink>
  // Let's find all instances of `}> Text</NavLink>` where Text is one of the dashboard texts.
  
  const iconMap = {
    'Dashboard': 'LayoutDashboard',
    'My Listings': 'Building',
    'Listings': 'Building',
    'Add Property': 'PlusCircle',
    'Add Listing': 'PlusCircle',
    'Inquiries': 'MessageSquare',
    'Profile': 'UserCircle',
    'My Profile': 'UserCircle',
    'Users': 'Users',
    'Settings': 'Settings',
    'Saved': 'Heart',
    'Watchlist': 'Heart',
    'Compare': 'Scale',
    'Investor Hub': 'Briefcase',
    'Portfolio': 'PieChart'
  };

  // Replace text only inside the NavLink tag boundaries (from `}>` to `</NavLink>`)
  // By targeting exactly `}> Dashboard</NavLink>` or `}> <LayoutDashboard size={18} /> Dashboard</NavLink>` to avoid double injecting.
  
  for (const [text, icon] of Object.entries(iconMap)) {
    // If the icon is already correctly injected, skip
    // If it's not injected, inject it.
    
    // We look for `}>` optionally followed by spaces, then the text (which might have other stuff like spans after it)
    // Actually, looking for `}> Text` is safe.
    // Let's use a regex to find `}> (text)` and replace it with `}> <Icon size={18} /> (text)`
    
    // Some texts are substrings of others (e.g., Dashboard vs Dashboard), so we match word boundaries.
    const textRegex = new RegExp(`}>\\s*(${text})\\b`, 'g');
    
    content = content.replace(textRegex, (match, matchedText) => {
      // Check if there's already an icon right after `}>`
      // We already stripped the bad ones, but let's avoid double injecting if it somehow worked somewhere
      return '}> <' + icon + ' size={18} /> ' + matchedText;
    });
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${filePath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      fixFile(fullPath);
    }
  }
}

console.log('Fixing corrupted JSX syntax...');
traverseDir(PAGES_DIR);
console.log('Done.');
