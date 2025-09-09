const fs = require('fs');
const path = require('path');

// Direct import of Supabase client
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://oeqlxurzbdvliuqutqyo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcWx4dXJ6YmR2bGl1cXV0cXlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIzMjQ2MywiZXhwIjoyMDY2ODA4NDYzfQ.wC1DH3v10iAHjsIhKyr3heOvNsQAX7DaLxlEM5ySc7Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadSuitImage() {
  try {
    console.log('🚀 Starting suit image upload process...');
    
    // Check if the image file exists
    const imagePath = path.join(__dirname, 'suitpic.jpg');
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found at: ${imagePath}`);
    }
    
    console.log('✅ Image file found:', imagePath);
    
    // Check if bucket exists
    console.log('📦 Checking storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.log('⚠️ Could not list buckets, proceeding with upload:', bucketsError.message);
    }
    
    const bucketExists = buckets && buckets.some(bucket => bucket.name === 'suit-images');
    if (!bucketExists) {
      console.log('📦 Creating storage bucket...');
      const { error: createError } = await supabase.storage.createBucket('suit-images', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880 // 5MB
      });
      if (createError) {
        console.log('⚠️ Could not create bucket (might already exist):', createError.message);
      } else {
        console.log('✅ Storage bucket created successfully');
      }
    } else {
      console.log('✅ Storage bucket already exists');
    }
    
    // Upload the image
    console.log('📤 Uploading suit image...');
    const imageBuffer = fs.readFileSync(imagePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('suit-images')
      .upload('suit-icon.jpg', imageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('suit-images')
      .getPublicUrl('suit-icon.jpg');
    
    const result = {
      path: uploadData.path,
      publicUrl: publicUrlData.publicUrl
    };
    
    console.log('🎉 Image uploaded successfully!');
    console.log('📁 File path:', result.path);
    console.log('🔗 Public URL:', result.publicUrl);
    
    // Test the URL by trying to fetch it
    console.log('🧪 Testing image URL accessibility...');
    try {
      const response = await fetch(result.publicUrl);
      if (response.ok) {
        console.log('✅ Image URL is accessible');
        console.log('📊 Image size:', response.headers.get('content-length'), 'bytes');
        console.log('🎭 Content type:', response.headers.get('content-type'));
      } else {
        console.log('⚠️ Image URL returned status:', response.status);
      }
    } catch (fetchError) {
      console.log('⚠️ Could not test URL accessibility:', fetchError.message);
    }
    
    // Save the URL to a config file for easy access
    const configPath = path.join(__dirname, 'suit-image-url.json');
    fs.writeFileSync(configPath, JSON.stringify({
      url: result.publicUrl,
      path: result.path,
      uploadedAt: new Date().toISOString()
    }, null, 2));
    
    console.log('💾 Image URL saved to:', configPath);
    console.log('🏁 Upload process completed successfully!');
    
    return result;
    
  } catch (error) {
    console.error('❌ Error uploading suit image:', error);
    throw error;
  }
}

// Run the upload if this script is executed directly
if (require.main === module) {
  uploadSuitImage()
    .then((result) => {
      console.log('\n✨ SUCCESS! Use this URL in your bill generation:');
      console.log(result.publicUrl);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 FAILED!', error.message);
      process.exit(1);
    });
}

module.exports = { uploadSuitImage };
