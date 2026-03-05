# Fix GitHub Pages Deployment - Action Required

## Problem
GitHub Pages doesn't support the jekyll-polyglot plugin, so it's building the site WITHOUT multilingual support. That's why the production site shows English content even though we configured it for Bulgarian.

## Solution: GitHub Actions Workflow

I've created a GitHub Actions workflow that will build the site with all plugins (including jekyll-polyglot) and then deploy it to GitHub Pages.

## Required: Change GitHub Pages Settings

You MUST update the GitHub Pages settings to use GitHub Actions instead of the default Jekyll build:

### Steps:

1. **Go to Repository Settings:**
   - Visit: https://github.com/terry81/artforum/settings/pages

2. **Change the Source:**
   - Under "Build and deployment"
   - Change **Source** from "Deploy from a branch" to **"GitHub Actions"**

3. **Save:**
   - The setting should save automatically

### Visual Guide:

```
Current (WRONG):
┌─────────────────────────────────────┐
│ Source: Deploy from a branch       │
│ Branch: master / (root)            │
└─────────────────────────────────────┘

Should be (CORRECT):
┌─────────────────────────────────────┐
│ Source: GitHub Actions              │
└─────────────────────────────────────┘
```

## What Happens Next

Once you change the setting to "GitHub Actions":

1. **Automatic Build Triggered:**
   - The workflow will run automatically
   - You can watch progress at: https://github.com/terry81/artforum/actions

2. **Build Process:**
   - Installs Ruby 3.1 and Node.js 18
   - Installs all dependencies (gems and npm packages)
   - Runs `bundle exec jekyll build` with jekyll-polyglot
   - Deploys the _site folder to GitHub Pages

3. **Result:**
   - Bulgarian homepage at https://artforumhair.com/
   - English version at https://artforumhair.com/en/
   - Working language switcher

## Expected Timeline

After changing the setting:
- **2-3 minutes**: GitHub Actions builds the site
- **1-2 minutes**: Deploy to GitHub Pages
- **Total**: 3-5 minutes until site is live

## Verification

After the GitHub Actions workflow completes, check:

```bash
# Should show Bulgarian title
curl -s https://artforumhair.com/ | grep '<title>'
# Expected: Премиум екстеншъни в София

# Should show "За нас" (not "About us")
curl -s https://artforumhair.com/ | grep 'nav__sub-title' | head -1
# Expected: За нас
```

## Troubleshooting

### If the workflow fails:

1. **Check the Actions tab:**
   - https://github.com/terry81/artforum/actions
   - Click on the failed workflow to see the error

2. **Common issues:**
   - Ruby/Node version mismatch
   - Missing dependencies
   - Permission issues

### If the site still shows English:

1. **Clear browser cache:**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or try incognito/private mode

2. **Check CDN cache:**
   - GitHub Pages uses a CDN that may take up to 10 minutes to update

3. **Verify the workflow ran:**
   - Check https://github.com/terry81/artforum/actions
   - Latest workflow should show ✅ green checkmark

## Why This Is Necessary

**GitHub Pages Standard Build:**
- ✅ Supports basic Jekyll
- ❌ Does NOT support jekyll-polyglot plugin
- ❌ Does NOT support custom plugins
- Result: Site builds but ignores multilingual configuration

**GitHub Actions Build:**
- ✅ Full control over build process
- ✅ Can install ANY Jekyll plugin
- ✅ Supports jekyll-polyglot
- ✅ Deploys pre-built site with all features
- Result: Site works exactly as designed

## Summary

**Action Required:** Change GitHub Pages source to "GitHub Actions" in repository settings.

**Location:** https://github.com/terry81/artforum/settings/pages

**Expected Result:** Bulgarian site at https://artforumhair.com/ with working language switcher.

**Time:** 3-5 minutes after changing the setting.
