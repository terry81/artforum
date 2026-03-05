#!/bin/bash

# Sync Optimizations to Bulgarian Site
# This script copies all optimizations from the English site to the Bulgarian site

set -e  # Exit on error

ENGLISH_SITE="/Users/i339389_1/git/sites/artforum"
BULGARIAN_SITE="/Users/i339389_1/git/sites/bg.artforum"

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║          Syncing Optimizations to Bulgarian Site                       ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if Bulgarian site exists
if [ ! -d "$BULGARIAN_SITE" ]; then
    echo "❌ Error: Bulgarian site not found at $BULGARIAN_SITE"
    exit 1
fi

echo "✓ Found Bulgarian site at: $BULGARIAN_SITE"
echo ""

# Create backup
echo "📦 Creating backup..."
BACKUP_DIR="$BULGARIAN_SITE/backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp "$BULGARIAN_SITE/_config.yml" "$BACKUP_DIR/" 2>/dev/null || true
cp "$BULGARIAN_SITE/index.html" "$BACKUP_DIR/" 2>/dev/null || true
echo "✓ Backup created at: $BACKUP_DIR"
echo ""

# 1. Copy optimization files
echo "📄 Copying optimization files..."

# Copy robots.txt
echo "  → robots.txt"
cp "$ENGLISH_SITE/robots.txt" "$BULGARIAN_SITE/" || echo "    ⚠ robots.txt not found"

# Copy manifest.json (will need to be translated)
echo "  → manifest.json"
cp "$ENGLISH_SITE/manifest.json" "$BULGARIAN_SITE/manifest.json.en" || echo "    ⚠ manifest.json not found"

# Copy _headers
echo "  → _headers"
cp "$ENGLISH_SITE/_headers" "$BULGARIAN_SITE/" || echo "    ⚠ _headers not found"

# Copy .gitignore
echo "  → .gitignore"
cp "$ENGLISH_SITE/.gitignore" "$BULGARIAN_SITE/" || echo "    ⚠ .gitignore not found"

# Copy package.json
echo "  → package.json"
cp "$ENGLISH_SITE/package.json" "$BULGARIAN_SITE/" || echo "    ⚠ package.json not found"

# Copy performance check script
echo "  → performance-check.js"
cp "$ENGLISH_SITE/performance-check.js" "$BULGARIAN_SITE/" || echo "    ⚠ performance-check.js not found"

# Copy banner.js if exists
echo "  → banner.js"
cp "$ENGLISH_SITE/banner.js" "$BULGARIAN_SITE/" 2>/dev/null || true

echo ""

# 2. Copy custom includes
echo "📦 Copying custom includes..."
echo "  → structured-data.html"
cp "$ENGLISH_SITE/_includes/structured-data.html" "$BULGARIAN_SITE/_includes/" || echo "    ⚠ structured-data.html not found"

echo ""

# 3. Copy custom CSS
echo "🎨 Copying custom CSS..."
echo "  → custom.css"
mkdir -p "$BULGARIAN_SITE/assets/css"
cp "$ENGLISH_SITE/assets/css/custom.css" "$BULGARIAN_SITE/assets/css/" || echo "    ⚠ custom.css not found"

echo ""

# 4. Copy documentation files
echo "📚 Copying documentation..."
for doc in README.md DEPLOYMENT.md SEO_CHECKLIST.md IMAGE_OPTIMIZATION.md OPTIMIZATION_SUMMARY.md QUICK_REFERENCE.md; do
    if [ -f "$ENGLISH_SITE/$doc" ]; then
        echo "  → $doc"
        cp "$ENGLISH_SITE/$doc" "$BULGARIAN_SITE/${doc%.md}.en.md"
    fi
done

echo ""

# 5. Update _includes/head.html
echo "🔧 Updating head.html..."
if [ -f "$BULGARIAN_SITE/_includes/head.html" ]; then
    # Check if structured-data is already included
    if ! grep -q "structured-data.html" "$BULGARIAN_SITE/_includes/head.html"; then
        # Backup original
        cp "$BULGARIAN_SITE/_includes/head.html" "$BULGARIAN_SITE/_includes/head.html.backup"

        # Add structured data include after seo.html
        sed -i.tmp '/{% include seo.html %}/a\
{% include structured-data.html %}
' "$BULGARIAN_SITE/_includes/head.html"

        # Add preconnect if not present
        if ! grep -q "preconnect" "$BULGARIAN_SITE/_includes/head.html"; then
            sed -i.tmp '/<meta name="viewport"/a\
<meta name="theme-color" content="#ffffff">\
<link rel="manifest" href="{{ '\''/manifest.json'\'' | relative_url }}">\
\
<!-- Preconnect to external domains for faster loading -->\
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>\
<link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
' "$BULGARIAN_SITE/_includes/head.html"
        fi

        rm "$BULGARIAN_SITE/_includes/head.html.tmp" 2>/dev/null || true
        echo "  ✓ head.html updated"
    else
        echo "  ℹ structured-data already included"
    fi
else
    echo "  ⚠ head.html not found"
fi

echo ""

# 6. Update _config.yml with key optimizations
echo "⚙️  Configuration updates needed..."
echo ""
echo "  📝 Manual updates required in _config.yml:"
echo "     1. Enable breadcrumbs: breadcrumbs: true"
echo "     2. Enable search: search: true"
echo "     3. Enable full content search: search_full_content: true"
echo "     4. Add og_image: /assets/images/[your-bg-image].jpeg"
echo "     5. Add teaser image"
echo "     6. Update URL with Bulgarian domain"
echo "     7. Add to include section: _headers, robots.txt, manifest.json"
echo ""

# 7. Install npm dependencies
echo "📦 Installing npm dependencies..."
cd "$BULGARIAN_SITE"
if [ -f "package.json" ]; then
    npm install
    echo "  ✓ npm dependencies installed"
else
    echo "  ⚠ No package.json, skipping npm install"
fi

echo ""

# 8. Update Ruby dependencies
echo "💎 Updating Ruby dependencies..."
if [ -f "$BULGARIAN_SITE/Gemfile" ]; then
    cd "$BULGARIAN_SITE"
    bundle install
    bundle update
    echo "  ✓ Ruby dependencies updated"
else
    echo "  ⚠ No Gemfile found"
fi

echo ""

# 9. Create Bulgarian-specific manifest.json
echo "🌍 Creating Bulgarian manifest..."
cat > "$BULGARIAN_SITE/manifest.json" << 'EOF'
{
  "name": "Art Forum Hair - Висококачествени Удължавания за Коса",
  "short_name": "Art Forum Hair",
  "description": "Салон за удължаване на коса в София, България",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/assets/images/artforum_logo.jpeg",
      "sizes": "192x192",
      "type": "image/jpeg",
      "purpose": "any maskable"
    }
  ]
}
EOF
echo "  ✓ Bulgarian manifest.json created"

echo ""

# 10. Update robots.txt for Bulgarian domain
echo "🤖 Updating robots.txt for Bulgarian site..."
cat > "$BULGARIAN_SITE/robots.txt" << 'EOF'
User-agent: *
Allow: /
Disallow: /assets/js/
Disallow: /assets/css/

Sitemap: https://bg.artforumhair.com/sitemap.xml
EOF
echo "  ✓ robots.txt updated with Bulgarian domain"

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "✅ Sync Complete!"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Review Bulgarian site configuration:"
echo "   cd $BULGARIAN_SITE"
echo "   nano _config.yml"
echo ""
echo "2. Update these settings in _config.yml:"
echo "   - url: https://bg.artforumhair.com"
echo "   - breadcrumbs: true"
echo "   - search: true"
echo "   - search_full_content: true"
echo "   - og_image: /assets/images/[your-image].jpeg"
echo "   - Add to include: [_headers, robots.txt, manifest.json]"
echo ""
echo "3. Translate content in manifest.json if needed"
echo ""
echo "4. Update structured data for Bulgarian language:"
echo "   Edit: _includes/structured-data.html"
echo "   Change language-specific content"
echo ""
echo "5. Build and test:"
echo "   bundle exec jekyll serve"
echo ""
echo "6. Check performance:"
echo "   npm run check"
echo ""
echo "📦 Backup location: $BACKUP_DIR"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"

