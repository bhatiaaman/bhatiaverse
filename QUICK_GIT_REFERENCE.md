# 🚀 Quick Reference Card - Daily Git Workflow

## Every Day Workflow (Copy-Paste Ready)

### 📥 Start Working (Run Once Per Session)
```bash
git checkout stage
git pull origin stage
```

### 💾 Save & Push to Stage (After Making Changes)
```bash
git add .
git commit -m "Brief description of what you changed"
git push origin stage
```
✅ **Test on staging environment**

### 🚢 Deploy to Production (When Stage is Working)
```bash
git checkout main
git pull origin main
git merge stage
git push origin main
git checkout stage
```
✅ **Live on bhatiaverse.com**

---

## One-Liner Commands

### Just Push to Stage
```bash
git add . && git commit -m "Update" && git push origin stage
```

### Deploy Stage to Main
```bash
git checkout main && git pull origin main && git merge stage && git push origin main && git checkout stage
```

---

## 🆘 Emergency Commands

### Undo Last Commit (Before Push)
```bash
git reset --soft HEAD~1
```

### Discard All Local Changes
```bash
git checkout -- .
```

### Check Which Branch You're On
```bash
git branch
```

### Switch Branch
```bash
git checkout stage    # for development
git checkout main     # for production
```

---

## 📍 Remember
- ✅ ALWAYS work on **stage**
- ✅ Test on staging URL before going to main
- ✅ **stage** = testing | **main** = production

---

Print this and keep it near your desk! 📌
