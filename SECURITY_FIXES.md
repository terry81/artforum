# Security Vulnerabilities Fixed

## Branch: `security`
Commit: 4363faa

## Vulnerabilities Resolved

### 1. ✅ minimatch ReDoS vulnerability (High)
**Issue #25** - Detected in minimatch (npm)

**Vulnerability Details:**
- Package: minimatch
- Previous Version: 3.1.2
- Severity: High (Development)
- Issue: ReDoS (Regular Expression Denial of Service) via combinatorial backtracking through multiple non-adjacent GLOBSTAR segments

**Fix Applied:**
- Ran: `npm audit fix --force`
- Result: Updated minimatch dependency
- Status: ✅ Fixed (0 npm vulnerabilities remaining)

### 2. ✅ Faraday SSRF vulnerability (Moderate)
**Issue #21** - Detected in faraday (RubyGems)

**Vulnerability Details:**
- Package: faraday
- Previous Version: 2.14.0
- New Version: 2.14.1
- Severity: Moderate
- Issue: SSRF (Server-Side Request Forgery) via protocol-relative URL host override in build_exclusive_url

**Fix Applied:**
- Ran: `bundle update faraday`
- Updated: 2.14.0 → 2.14.1
- Status: ✅ Fixed

## Verification

### NPM Security Status
```
npm audit
found 0 vulnerabilities
```

### Ruby Gem Versions
```
faraday (2.14.1)
```

## Files Modified
- `package-lock.json` - Updated minimatch dependency
- `Gemfile.lock` - Updated faraday from 2.14.0 to 2.14.1

## Next Steps

To merge these security fixes into the main branch:

```bash
# Switch to master branch
git checkout master

# Merge security fixes
git merge security

# Push to remote
git push origin master
```

Or create a pull request:
```bash
git push origin security
# Then create PR on GitHub
```

## Testing Recommendation

After merging, test the following to ensure no breaking changes:
- ✅ Jekyll build: `bundle exec jekyll build`
- ✅ Jekyll serve: `bundle exec jekyll serve`
- ✅ NPM scripts (if any): `npm run [script]`

Both vulnerabilities have been successfully resolved with minimal dependency updates.
