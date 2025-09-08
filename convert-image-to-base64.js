const fs = require('fs');
const path = require('path');

// Convert suitpic.jpg to base64
try {
    const imagePath = path.join(__dirname, 'suitpic.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const dataUri = `data:image/jpeg;base64,${base64Image}`;
    
    console.log('Base64 Data URI for suitpic.jpg:');
    console.log('Length:', dataUri.length, 'characters');
    console.log('\n--- Copy the line below to use in your HTML ---');
    console.log(dataUri);
    console.log('--- End ---\n');
    
    // Also save to a file for easy access
    fs.writeFileSync('suitpic-base64.txt', dataUri);
    console.log('✅ Base64 string saved to suitpic-base64.txt');
    
} catch (error) {
    console.error('❌ Error converting image:', error.message);
    console.log('\nMake sure suitpic.jpg exists in the current directory.');
}
