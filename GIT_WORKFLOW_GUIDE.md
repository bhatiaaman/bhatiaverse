# Git Workflow Guide - Bhatiaverse Project

## 🎯 Your Workflow
- **stage** branch → Your testing/development environment (Vercel deploys this automatically)
- **main** branch → Your production environment (Live site)
- **VS Code** → Always push to `stage` first, then merge to `main` when ready

---

## 📋 Initial Setup (One-Time Only)

### Step 1: Check Your Current Branch
```bash
git branch
```
- You should see `* stage` (asterisk means current branch)
- If you're on `main`, switch to stage: `git checkout stage`

### Step 2: Make Sure You Have Both Branches Locally
```bash
git branch -a
```
- Should show both `main` and `stage`
- If `stage` doesn't exist locally but exists on GitHub:
  ```bash
  git fetch origin
  git checkout stage
  ```

---

## 🔄 Daily Workflow (Use This Every Time)

### When Starting Work
```bash
# 1. Make sure you're on stage branch
git checkout stage

# 2. Pull latest changes from GitHub
git pull origin stage
```

### After Making Changes in VS Code

```bash
# 1. Check what files changed
git status

# 2. Add all changed files (or add specific files)
git add .
# OR for specific files:
# git add app/api/chartink-webhook/route.js

# 3. Commit with a meaningful message
git commit -m "Add chartink webhook integration"

# 4. Push to stage branch on GitHub
git push origin stage
```

**✅ Vercel will automatically deploy your `stage` branch!**

### Test on Staging
- Visit your staging URL (check Vercel dashboard for the stage deployment URL)
- Test everything thoroughly
- If bugs found, fix → commit → push to stage again

### When Ready for Production

```bash
# 1. Make sure stage is fully pushed and working
git status
# Should say: "Your branch is up to date with 'origin/stage'"

# 2. Switch to main branch
git checkout main

# 3. Pull latest main (just to be safe)
git pull origin main

# 4. Merge stage into main
git merge stage

# 5. Push to main
git push origin main
```

**✅ Vercel will automatically deploy your `main` branch to production!**

### After Merging to Main

```bash
# Switch back to stage for next development
git checkout stage
```

---

## 🚨 Quick Commands Cheat Sheet

### Check Current Branch
```bash
git branch
```

### Switch to Stage
```bash
git checkout stage
```

### Switch to Main
```bash
git checkout main
```

### See What Changed
```bash
git status
```

### Push to Stage (Most Common)
```bash
git add .
git commit -m "Your message here"
git push origin stage
```

### Push to Main (After Testing on Stage)
```bash
git checkout main
git pull origin main
git merge stage
git push origin main
git checkout stage
```

---

## 🎨 VS Code Integrated Method

### Using VS Code's Source Control Panel

1. **Make your code changes**

2. **Open Source Control** (Ctrl+Shift+G or Cmd+Shift+G)

3. **Check you're on stage branch** (bottom left corner should say "stage")

4. **Stage Changes**
   - Click the `+` icon next to each file
   - Or click `+` next to "Changes" to stage all

5. **Commit**
   - Type your commit message in the box at top
   - Click the ✓ checkmark (or Ctrl+Enter)

6. **Push to Stage**
   - Click the `...` menu → Push
   - Or click the sync icon (↻) in the bottom left

7. **When Ready for Production**
   - Click "stage" at bottom left → Select "main"
   - Click `...` menu → Branch → Merge Branch → Select "stage"
   - Click the sync icon to push to main
   - Switch back to "stage" branch

---

## 📝 Example: Adding ChartInk Scanner Feature

```bash
# 1. Start on stage
git checkout stage
git pull origin stage

# 2. Create your files in VS Code
# - app/api/chartink-webhook/route.js
# - app/api/get-scans/route.js
# - app/stock-updates/scanner/page.js

# 3. Commit and push to stage
git add .
git commit -m "Add ChartInk scanner webhook and display page"
git push origin stage

# 4. Test on staging environment
# Visit: https://your-staging-url.vercel.app/stock-updates/scanner

# 5. If working well, push to production
git checkout main
git pull origin main
git merge stage
git push origin main

# 6. Go back to stage for next feature
git checkout stage
```

---

## ⚠️ Common Issues & Fixes

### "Your branch is behind 'origin/stage'"
```bash
git pull origin stage
```

### "Merge Conflict"
```bash
# Fix conflicts in VS Code (it will highlight them)
# After fixing:
git add .
git commit -m "Resolve merge conflicts"
git push origin stage
```

### "Already up to date" when merging
- This means main already has everything from stage
- Nothing to merge, you're good!

### Accidentally Committed to Main Instead of Stage
```bash
# Don't push yet!
git reset --soft HEAD~1  # Undo the commit but keep changes
git checkout stage        # Switch to stage
git add .
git commit -m "Your message"
git push origin stage
```

---

## 🎯 Best Practices

1. ✅ **ALWAYS work on `stage` branch**
2. ✅ **Test thoroughly on stage before merging to main**
3. ✅ **Write clear commit messages**
4. ✅ **Pull before you push** (especially after breaks)
5. ✅ **Keep commits small and focused**
6. ✅ **Never force push to main** (`git push --force`)

---

## 🔗 Vercel Configuration

Make sure in your Vercel dashboard:
- **Production Branch**: `main`
- **Preview Branches**: `stage` (and any other branches)

This way:
- `main` → Live site (bhatiaverse.com)
- `stage` → Staging preview URL
- Any push to stage gives you a preview link to test

---

## 📞 Quick Help

**Where am I?**
```bash
git branch
```

**What changed?**
```bash
git status
```

**Undo last commit (before push)?**
```bash
git reset --soft HEAD~1
```

**Start fresh on stage?**
```bash
git checkout stage
git pull origin stage
```

---

**Remember**: `stage` → test → `main` → production 🚀

Save this file in your project root for quick reference!
