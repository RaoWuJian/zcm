# Git 常用操作命令指南

## 📋 基础状态查看

```bash
# 查看当前状态
git status

# 查看提交历史
git log --oneline

# 查看分支
git branch -a

# 查看远程仓库
git remote -v
```

## 📦 暂存区操作

### 添加到暂存区
```bash
# 添加单个文件
git add filename.txt

# 添加所有修改的文件
git add .

# 添加所有文件（包括删除的）
git add -A

# 交互式添加（选择性添加）
git add -i
```

### 从暂存区移除
```bash
# 从暂存区移除单个文件（保留工作区修改）
git reset HEAD filename.txt

# 从暂存区移除所有文件（保留工作区修改）
git reset HEAD

# 从暂存区移除文件并丢弃工作区修改
git checkout HEAD -- filename.txt
```

## 💾 提交操作

```bash
# 提交暂存区的文件
git commit -m "提交信息"

# 添加并提交（跳过暂存区）
git commit -am "提交信息"

# 修改最后一次提交信息
git commit --amend -m "新的提交信息"

# 修改最后一次提交（添加文件）
git add forgotten_file.txt
git commit --amend --no-edit
```

## 🔄 拉取和推送

### 拉取操作
```bash
# 拉取远程分支并合并
git pull origin main

# 拉取所有远程分支
git fetch --all

# 拉取但不合并（推荐）
git fetch origin main
git merge origin/main
```

### 推送操作
```bash
# 推送到远程分支
git push origin main

# 首次推送并设置上游分支
git push -u origin main

# 强制推送（危险操作，谨慎使用）
git push --force origin main

# 推送所有分支
git push --all origin
```

## ⏪ 回退操作

### 工作区回退
```bash
# 丢弃工作区的修改（单个文件）
git checkout -- filename.txt

# 丢弃工作区的所有修改
git checkout -- .

# 使用 restore 命令（Git 2.23+）
git restore filename.txt
git restore .
```

### 暂存区回退
```bash
# 从暂存区回退到工作区（保留修改）
git reset HEAD filename.txt
git reset HEAD

# 使用 restore 命令从暂存区回退
git restore --staged filename.txt
git restore --staged .
```

### 提交回退
```bash
# 软回退：回退提交，保留暂存区和工作区
git reset --soft HEAD~1

# 混合回退：回退提交和暂存区，保留工作区（默认）
git reset HEAD~1
git reset --mixed HEAD~1

# 硬回退：回退提交、暂存区和工作区（危险）
git reset --hard HEAD~1

# 回退到指定提交
git reset --hard commit_hash
```

## 🌐 远程仓库回退

### 回退远程分支
```bash
# 1. 本地回退
git reset --hard HEAD~1

# 2. 强制推送到远程（危险操作）
git push --force origin main

# 更安全的强制推送
git push --force-with-lease origin main
```

### 使用 revert（推荐）
```bash
# 创建一个新提交来撤销指定提交
git revert HEAD

# 撤销指定提交
git revert commit_hash

# 撤销多个提交
git revert HEAD~3..HEAD
```

## 🔧 实用场景命令

### 紧急修复场景
```bash
# 暂存当前工作
git stash

# 切换分支进行修复
git checkout hotfix-branch

# 修复完成后回到原分支
git checkout main

# 恢复暂存的工作
git stash pop
```

### 查看差异
```bash
# 查看工作区与暂存区的差异
git diff

# 查看暂存区与最后提交的差异
git diff --cached

# 查看工作区与最后提交的差异
git diff HEAD
```

### 分支操作
```bash
# 创建并切换分支
git checkout -b new-branch

# 切换分支
git checkout branch-name

# 合并分支
git merge branch-name

# 删除本地分支
git branch -d branch-name

# 删除远程分支
git push origin --delete branch-name
```

## ⚠️ 危险操作警告

### 需要谨慎使用的命令
```bash
# 强制推送（会覆盖远程历史）
git push --force

# 硬回退（会丢失数据）
git reset --hard

# 清理未跟踪文件（会永久删除）
git clean -fd
```

## 🆘 紧急救援命令

### 找回丢失的提交
```bash
# 查看所有操作历史
git reflog

# 恢复到指定操作
git reset --hard HEAD@{2}
```

### 撤销合并
```bash
# 撤销最后一次合并
git reset --hard HEAD~1

# 或使用 revert
git revert -m 1 HEAD
```

## 📝 最佳实践建议

1. **提交前检查**: 使用 `git status` 和 `git diff` 检查修改
2. **小步提交**: 频繁提交，每次提交一个功能点
3. **清晰信息**: 写清楚的提交信息
4. **拉取优先**: 推送前先拉取最新代码
5. **分支开发**: 使用分支进行功能开发
6. **备份重要**: 重要操作前先备份或创建分支

## 🔄 常用工作流程

### 日常开发流程
```bash
# 1. 拉取最新代码
git pull origin main

# 2. 创建功能分支
git checkout -b feature/new-feature

# 3. 开发并提交
git add .
git commit -m "feat: 添加新功能"

# 4. 推送分支
git push -u origin feature/new-feature

# 5. 合并到主分支（通过 PR/MR 或直接合并）
git checkout main
git merge feature/new-feature
git push origin main

# 6. 删除功能分支
git branch -d feature/new-feature
git push origin --delete feature/new-feature
```
