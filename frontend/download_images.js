const fs = require('fs');
const https = require('https');
const path = require('path');

const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
];

const destDir = 'c:/Users/muham/OneDrive/Desktop/pakistan-property-hub-professional/frontend/public/images/properties';

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location, filename).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}, status: ${res.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(filename);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filename, () => { });
      reject(err);
    });
  });
}

async function main() {
  for (let i = 0; i < IMAGE_POOL.length; i++) {
    const filename = path.join(destDir, `prop-${i + 1}.jpg`);
    console.log(`Downloading ${IMAGE_POOL[i]} to ${filename}`);
    try {
      await downloadImage(IMAGE_POOL[i], filename);
      console.log(`Success: ${filename}`);
    } catch (err) {
      console.error(`Error: ${err.message}`);
    }
  }
}

main();
