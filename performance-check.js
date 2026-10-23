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
  '_sass/minimal-mistakes/_artforum.scss',
  'assets/images/GPA9099.webp',
  'assets/images/artforum-teaser.webp'
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
    { name: 'Client-side search disabled for leaner pages', pattern: /search\s*:\s*false/i },
    { name: 'Breadcrumbs enabled', pattern: /breadcrumbs\s*:\s*true/i },
    { name: 'Site description set', pattern: /description\s*:\s*"[^"]{50,}"/i },
    { name: 'URL configured', pattern: /url\s*:\s*"https?:\/\//i },
    { name: 'OG image uses real salon photo', pattern: /og_image\s*:\s*"\/assets\/images\/GPA9099\.jpg"/i },
    { name: 'Optimized teaser configured', pattern: /teaser\s*:\s*"\/assets\/images\/artforum-teaser\.webp"/i },
    { name: 'Sass compression enabled', pattern: /style\s*:\s*compressed/i },
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
        if (file === 'gallery_BACK') return;
        checkImages(filePath);
      } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file)) {
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
  console.log(`  Average size: ${imageCount > 0 ? Math.round(totalSize / imageCount / 1024) : 0} KB`);

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
  function collectPosts(dir) {
    return fs.readdirSync(dir).flatMap(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        return collectPosts(filePath);
      }

      return file.endsWith('.md') ? [filePath] : [];
    });
  }

  const posts = collectPosts(postsDir);
  console.log(`  Total posts: ${posts.length}`);

  /**
   * Strip HTML tags from a string.
   *
   * A single-pass regex such as `s.replace(/<[^>]*>/g, '')` is incomplete:
   * removing the inner match of a nested construct like `<<a>script>` *creates*
   * a new `<script>` tag out of the surrounding characters. Scanning character
   * by character cannot reintroduce a tag, because the result never contains
   * a `<` at all.
   */
  function stripTags(input) {
    let out = '';
    let inTag = false;

    for (const ch of input) {
      if (inTag) {
        if (ch === '>') inTag = false;
      } else if (ch === '<') {
        inTag = true;
      } else {
        out += ch;
      }
    }

    return out;
  }

  let postsWithoutExcerpt = 0;
  posts.forEach(post => {
    const content = fs.readFileSync(post, 'utf8');
    const hasExplicitExcerpt = /\nexcerpt\s*:/i.test(content);
    const body = content.replace(/^---[\s\S]*?---\s*/, '').trim();
    const hasGeneratedExcerpt = body
      .split(/\n\s*\n/)
      .some(block => stripTags(block).trim().length > 50);

    if (!hasExplicitExcerpt && !hasGeneratedExcerpt) {
      postsWithoutExcerpt++;
    }
  });

  if (postsWithoutExcerpt > 0) {
    console.log(`  ⚠️  ${postsWithoutExcerpt} posts missing explicit or generated excerpt content`);
  } else {
    console.log(`  ✓ All posts have explicit or generated excerpts`);
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

