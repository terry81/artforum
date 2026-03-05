# Production Deployment Fix

## Issue
The production site at https://artforumhair.com/ was showing:
- English content instead of Bulgarian (despite lang="bg")
- Language switcher linking to English when already on English version
- No Bulgarian version accessible

## Root Cause
The production site (GitHub Pages) was deployed from an older commit that didn't include the multilingual setup. The last deployed commit was `3257cf3 (Cleanup)`.

## Solution Applied

### 1. ✅ Security Vulnerabilities Fixed
- Fixed minimatch ReDoS vulnerability (High)
- Fixed Faraday SSRF vulnerability (Moderate)
- Committed to `security` branch

### 2. ✅ Merged to Master
```bash
git checkout master
git merge security
git push origin master
```

### 3. ✅ Pushed to Remote
Both `master` and `security` branches pushed to GitHub:
- Master: `4ff2ced` (includes security fixes + all multilingual features)
- Security: `4ff2ced`

## Current State

### Master Branch Now Includes:
✅ Bulgarian as default language (`default_lang: "bg"`)
✅ Multilingual setup with Jekyll Polyglot
✅ Proper language switcher (🇬🇧 English / 🇧🇬 Български)
✅ Sidebar navigation on all pages
✅ Search disabled
✅ Security vulnerabilities fixed
✅ Improved design (footer, sidebar enhancements)

### Build Structure:
```
_site/
├── index.html          # Bulgarian homepage
├── about-us/          # Bulgarian pages
├── gallery/           # Bulgarian pages
├── en/                # English version
│   ├── index.html     # English homepage
│   ├── about-us/      # English pages
│   └── gallery/       # English pages
└── assets/
```

## GitHub Pages Deployment

GitHub Pages will automatically rebuild and deploy the site from the master branch. This typically takes 1-10 minutes.

### Expected Production Site Behavior:

**Root URL (https://artforumhair.com/):**
- Language: Bulgarian (bg)
- Title: "Премиум екстеншъни в София - Art Forum Hair"
- Content: Bulgarian text
- Language Switcher: 🇬🇧 English → links to /en/

**English URL (https://artforumhair.com/en/):**
- Language: English (en)
- Title: "Premium Hair Extensions Salon in Sofia - Art Forum Hair"
- Content: English text
- Language Switcher: 🇧🇬 Български → links to /

## Verification Steps

After GitHub Pages finishes deploying (check https://github.com/terry81/artforum/deployments):

1. **Check Bulgarian Homepage:**
   ```bash
   curl -s https://artforumhair.com/ | grep '<title>'
   # Expected: Премиум екстеншъни в София
   ```

2. **Check English Version:**
   ```bash
   curl -s https://artforumhair.com/en/ | grep '<title>'
   # Expected: Premium Hair Extensions Salon in Sofia
   ```

3. **Check Language Switcher on Bulgarian:**
   ```bash
   curl -s https://artforumhair.com/ | grep -A 3 'language-switcher'
   # Expected: Link to /en/ with 🇬🇧 English
   ```

4. **Check Language Switcher on English:**
   ```bash
   curl -s https://artforumhair.com/en/ | grep -A 3 'language-switcher'
   # Expected: Relative link to / with 🇧🇬 Български
   ```

## If Production Still Shows Old Version

If after 10-15 minutes the production site still shows the old version:

### Option 1: Force Rebuild
Create an empty commit to trigger rebuild:
```bash
git commit --allow-empty -m "Trigger GitHub Pages rebuild"
git push origin master
```

### Option 2: Check GitHub Pages Settings
1. Go to: https://github.com/terry81/artforum/settings/pages
2. Verify:
   - Source: Deploy from branch `master`
   - Branch: `master` / `root`
3. If needed, temporarily switch to another branch and back to master

### Option 3: Clear CDN Cache
GitHub Pages uses a CDN. You may need to:
- Wait 15-30 minutes for CDN propagation
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Use incognito/private browsing mode

## Summary

✅ Security vulnerabilities fixed
✅ All multilingual features committed
✅ Master branch updated and pushed
✅ GitHub Pages will automatically deploy

The production site should show the correct Bulgarian default with working language switcher within 1-15 minutes of the push completing.
