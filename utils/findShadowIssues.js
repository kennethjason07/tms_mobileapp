// Utility script to help identify files with deprecated shadow properties
// Run with: node utils/findShadowIssues.js

const fs = require('fs');
const path = require('path');

// Files to check (excluding node_modules, .git, etc.)
const filesToCheck = [
  'DashboardScreen.js',
  'CustomerInfoScreen.js', 
  'NewBillScreen.js',
  'OrdersOverviewScreen.js',
  'WorkersScreen.js',
  'WorkerExpenseScreen.js',
  'WorkerDetailScreen.js',
  'ShopExpenseScreen.js',
  'DailyProfitScreen.js',
  'WeeklyPayScreen.js',
  'WhatsAppConfigScreen.js'
];

const deprecatedProps = [
  'shadowColor:',
  'shadowOpacity:',
  'shadowRadius:',
  'shadowOffset:'
];

console.log('🔍 Scanning for deprecated shadow properties...\n');

filesToCheck.forEach(fileName => {
  const filePath = path.join(__dirname, '..', fileName);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let hasDeprecatedShadows = false;
    
    lines.forEach((line, index) => {
      deprecatedProps.forEach(prop => {
        if (line.includes(prop)) {
          if (!hasDeprecatedShadows) {
            console.log(`📁 ${fileName}:`);
            hasDeprecatedShadows = true;
          }
          console.log(`  Line ${index + 1}: ${line.trim()}`);
        }
      });
    });
    
    if (hasDeprecatedShadows) {
      console.log(''); // Empty line for readability
    }
  } else {
    console.log(`❌ File not found: ${fileName}`);
  }
});

console.log('✅ Scan complete!');
