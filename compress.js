const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'dist', 'image');

async function compressImages() {
  try {
    const files = fs.readdirSync(directoryPath);
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        const filePath = path.join(directoryPath, file);
        const tempFilePath = path.join(directoryPath, 'temp_' + file);
        
        const stats = fs.statSync(filePath);
        totalOriginalSize += stats.size;

        try {
          const image = sharp(filePath);
          
          if (ext === '.png') {
            image.png({ quality: 75, compressionLevel: 8 });
          } else if (ext === '.jpg' || ext === '.jpeg') {
            image.jpeg({ quality: 75, progressive: true });
          } else if (ext === '.webp') {
            image.webp({ quality: 75 });
          }

          // Optional: Resize if width is larger than 1920
          image.resize({ width: 1920, withoutEnlargement: true });

          await image.toFile(tempFilePath);
          
          const newStats = fs.statSync(tempFilePath);
          
          // Only replace if the compressed version is actually smaller
          if (newStats.size < stats.size) {
            fs.renameSync(tempFilePath, filePath);
            totalCompressedSize += newStats.size;
            console.log(`✅ Compressed: ${file} (Saved ${(100 - (newStats.size / stats.size) * 100).toFixed(1)}%)`);
          } else {
            // If not smaller, delete the temp file and keep original
            fs.unlinkSync(tempFilePath);
            totalCompressedSize += stats.size;
            console.log(`⏩ Skipped: ${file} (Original is already optimal)`);
          }
        } catch (err) {
          console.error(`❌ Error compressing ${file}:`, err.message);
        }
      }
    }

    console.log('\n🎉 Compression Complete!');
    console.log(`Original Total Size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Compressed Total Size: ${(totalCompressedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total Saved: ${((totalOriginalSize - totalCompressedSize) / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (err) {
    console.log('Unable to scan directory: ' + err);
  }
}

compressImages();
