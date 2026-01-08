#!/usr/bin/env node

/**
 * Performance monitoring script for Art Forum Hair website
 * Checks various performance and SEO metrics
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Art Forum Hair - Site Performance Check\n');

// Check if critical files exist
const criticalFiles = [
  '_config.yml',
  'robots.txt',
  'manifest.json',
  '_headers',
  '_includes/structured-data.html',
  'assets/css/custom.css'
];

console.log('📁 Checking critical files...');
let allFilesExist = true;

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✓' : '✗'} ${file}`);
  if (!exists) allFilesExist = false;
});

console.log('');

// Check _config.yml settings
console.log('⚙️  Checking configuration...');
const configPath = path.join(__dirname, '_config.yml');

if (fs.existsSync(configPath)) {
  const config = fs.readFileSync(configPath, 'utf8');

  const checks = [
    { name: 'Search enabled', pattern: /search\s*:\s*true/i },
    { name: 'Breadcrumbs enabled', pattern: /breadcrumbs\s*:\s*true/i },
    { name: 'Site description set', pattern: /description\s*:\s*"[^"]{50,}"/i },
    { name: 'URL configured', pattern: /url\s*:\s*"https?:\/\//i },
    { name: 'OG image set', pattern: /og_image\s*:\s*"\/[^"]+"/i },
    { name: 'HTML compression enabled', pattern: /compress_html:/i }
  ];

  checks.forEach(check => {
    const passed = check.pattern.test(config);
    console.log(`  ${passed ? '✓' : '✗'} ${check.name}`);
  });
} else {
  console.log('  ✗ _config.yml not found');
}

console.log('');

// Check image optimization
console.log('🖼️  Image optimization check...');
const imagesDir = path.join(__dirname, 'assets/images');

if (fs.existsSync(imagesDir)) {
  let totalSize = 0;
  let imageCount = 0;
  let largeImages = [];

  function checkImages(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        checkImages(filePath);
      } else if (/\.(jpg|jpeg|png|gif)$/i.test(file)) {
        imageCount++;
        totalSize += stat.size;

        // Flag images larger than 500KB
        if (stat.size > 500 * 1024) {
          largeImages.push({
            file: filePath.replace(__dirname, ''),
            size: Math.round(stat.size / 1024)
          });
        }
      }
    });
  }

  checkImages(imagesDir);

  console.log(`  Total images: ${imageCount}`);
  console.log(`  Total size: ${Math.round(totalSize / 1024 / 1024 * 100) / 100} MB`);
  console.log(`  Average size: ${Math.round(totalSize / imageCount / 1024)} KB`);

  if (largeImages.length > 0) {
    console.log(`\n  ⚠️  Large images detected (>500KB):`);
    largeImages.forEach(img => {
      console.log(`     ${img.file} (${img.size} KB)`);
    });
    console.log(`\n  💡 Consider optimizing these images with TinyPNG or ImageOptim`);
  } else {
    console.log(`  ✓ All images are reasonably sized`);
  }
} else {
  console.log('  ⚠️  Images directory not found');
}

console.log('');

// Check posts for SEO
console.log('📝 Checking blog posts...');
const postsDir = path.join(__dirname, '_posts');

if (fs.existsSync(postsDir)) {
  const posts = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  console.log(`  Total posts: ${posts.length}`);

  let postsWithoutExcerpt = 0;
  posts.forEach(post => {
    const content = fs.readFileSync(path.join(postsDir, post), 'utf8');
    if (!/excerpt\s*:/i.test(content)) {
      postsWithoutExcerpt++;
    }
  });

  if (postsWithoutExcerpt > 0) {
    console.log(`  ⚠️  ${postsWithoutExcerpt} posts missing excerpt (recommended for SEO)`);
  } else {
    console.log(`  ✓ All posts have excerpts`);
  }
} else {
  console.log('  ⚠️  Posts directory not found');
}

console.log('');
console.log('✅ Performance check complete!\n');

// Summary
if (allFilesExist) {
  console.log('✨ All critical optimizations are in place!');
} else {
  console.log('⚠️  Some optimizations are missing. Please review the results above.');
}

console.log('\n📚 For more information, see README.md\n');

