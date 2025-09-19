# Git 完整操作指南

## 目录
- [基础配置](#基础配置)
- [仓库初始化](#仓库初始化)
- [文件状态管理](#文件状态管理)
- [暂存区操作](#暂存区操作)
- [提交管理](#提交管理)
- [分支操作](#分支操作)
- [远程仓库](#远程仓库)
- [回退操作](#回退操作)
- [冲突解决](#冲突解决)
- [高级技巧](#高级技巧)

## 基础配置

### 首次使用配置
```bash
# 设置用户名和邮箱
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 查看配置
git config --list

# 设置默认编辑器
git config --global core.editor "code --wait"

# 设置默认分支名
git config --global init.defaultBranch main
```

## 仓库初始化

### 创建新仓库
```bash
# 初始化本地仓库
git init

# 克隆远程仓库
git clone https://github.com/username/repository.git

# 克隆指定分支
git clone -b branch-name https://github.com/username/repository.git
```

### 连接远程仓库
```bash
# 添加远程仓库
git remote add origin https://github.com/username/repository.git

# 查看远程仓库
git remote -v

# 修改远程仓库地址
git remote set-url origin https://github.com/username/new-repository.git
```

## 文件状态管理

### 查看状态
```bash
# 查看工作区状态
git status

# 简洁状态显示
git status -s

# 查看文件差异
git diff                    # 工作区 vs 暂存区
git diff --cached          # 暂存区 vs 最后提交
git diff HEAD              # 工作区 vs 最后提交
git diff commit1 commit2   # 两个提交之间的差异
```

### 文件追踪
```bash
# 开始追踪文件
git add filename.txt

# 停止追踪文件（但保留文件）
git rm --cached filename.txt

# 删除文件并停止追踪
git rm filename.txt

# 重命名文件
git mv old-name.txt new-name.txt
```

## 暂存区操作

### 添加到暂存区
```bash
# 添加单个文件
git add filename.txt

# 添加多个文件
git add file1.txt file2.txt

# 添加所有修改的文件
git add .

# 添加所有文件（包括删除的）
git add -A

# 添加所有 .js 文件
git add "*.js"

# 交互式添加
git add -i

# 部分添加（选择文件的部分内容）
git add -p filename.txt
```

### 从暂存区移除
```bash
# 移除单个文件（保留工作区修改）
git reset HEAD filename.txt

# 移除所有文件（保留工作区修改）
git reset HEAD

# 使用 restore 命令（Git 2.23+）
git restore --staged filename.txt
git restore --staged .
```

## 提交管理

### 基本提交
```bash
# 提交暂存区文件
git commit -m "提交信息"

# 添加并提交（跳过暂存区）
git commit -am "提交信息"

# 详细提交信息
git commit -m "标题" -m "详细描述"

# 空提交（用于触发 CI/CD）
git commit --allow-empty -m "触发构建"
```

### 修改提交
```bash
# 修改最后一次提交信息
git commit --amend -m "新的提交信息"

# 添加文件到最后一次提交
git add forgotten-file.txt
git commit --amend --no-edit

# 修改提交信息（打开编辑器）
git commit --amend
```

### 查看提交历史
```bash
# 查看提交历史
git log

# 简洁显示
git log --oneline

# 图形化显示分支
git log --graph --oneline --all

# 查看指定文件的历史
git log filename.txt

# 查看提交统计
git log --stat

# 查看最近 n 次提交
git log -n 5
```

## 分支操作

### 分支管理
```bash
# 查看所有分支
git branch -a

# 查看本地分支
git branch

# 查看远程分支
git branch -r

# 创建分支
git branch new-branch

# 创建并切换分支
git checkout -b new-branch

# 使用 switch 命令（Git 2.23+）
git switch -c new-branch

# 切换分支
git checkout branch-name
git switch branch-name

# 重命名分支
git branch -m old-name new-name

# 删除本地分支
git branch -d branch-name

# 强制删除分支
git branch -D branch-name

# 删除远程分支
git push origin --delete branch-name
```

### 分支合并
```bash
# 合并分支
git merge branch-name

# 不使用快进合并
git merge --no-ff branch-name

# 压缩合并（将多个提交合并为一个）
git merge --squash branch-name

# 变基合并
git rebase branch-name

# 交互式变基
git rebase -i HEAD~3
```

## 远程仓库

### 拉取操作
```bash
# 拉取并合并
git pull origin main

# 拉取所有分支
git fetch --all

# 拉取但不合并（推荐）
git fetch origin main
git merge origin/main

# 变基拉取
git pull --rebase origin main
```

### 推送操作
```bash
# 推送到远程分支
git push origin main

# 首次推送并设置上游分支
git push -u origin main

# 推送所有分支
git push --all origin

# 推送标签
git push --tags origin

# 强制推送（危险）
git push --force origin main

# 安全的强制推送
git push --force-with-lease origin main
```

## 回退操作

### 工作区回退
```bash
# 丢弃单个文件的修改
git checkout -- filename.txt

# 丢弃所有修改
git checkout -- .

# 使用 restore 命令
git restore filename.txt
git restore .

# 回退到指定提交的状态
git checkout commit-hash -- filename.txt
```

### 暂存区回退
```bash
# 从暂存区回退到工作区
git reset HEAD filename.txt
git reset HEAD

# 使用 restore 命令
git restore --staged filename.txt
git restore --staged .
```

### 提交回退
```bash
# 软回退（保留暂存区和工作区）
git reset --soft HEAD~1

# 混合回退（保留工作区，默认模式）
git reset HEAD~1
git reset --mixed HEAD~1

# 硬回退（丢弃所有修改，危险）
git reset --hard HEAD~1

# 回退到指定提交
git reset --hard commit-hash

# 回退多个提交
git reset --hard HEAD~3
```

### 远程仓库回退
```bash
# 方法1：本地回退后强制推送（危险）
git reset --hard HEAD~1
git push --force origin main

# 方法2：使用 revert（推荐）
git revert HEAD
git push origin main

# 撤销多个提交
git revert HEAD~3..HEAD
```

## 冲突解决

### 合并冲突
```bash
# 查看冲突文件
git status

# 手动编辑冲突文件后
git add conflicted-file.txt
git commit -m "解决合并冲突"

# 取消合并
git merge --abort

# 使用工具解决冲突
git mergetool
```

### 变基冲突
```bash
# 解决冲突后继续变基
git add conflicted-file.txt
git rebase --continue

# 跳过当前提交
git rebase --skip

# 取消变基
git rebase --abort
```

## 高级技巧

### 暂存工作
```bash
# 暂存当前工作
git stash

# 暂存包括未跟踪文件
git stash -u

# 暂存时添加消息
git stash save "工作进度描述"

# 查看暂存列表
git stash list

# 应用最新暂存
git stash pop

# 应用指定暂存
git stash apply stash@{1}

# 删除暂存
git stash drop stash@{1}

# 清空所有暂存
git stash clear
```

### 标签管理
```bash
# 创建轻量标签
git tag v1.0.0

# 创建附注标签
git tag -a v1.0.0 -m "版本 1.0.0"

# 查看标签
git tag

# 查看标签信息
git show v1.0.0

# 推送标签
git push origin v1.0.0

# 推送所有标签
git push --tags

# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin --delete v1.0.0
```

### 查找和调试
```bash
# 查找包含指定文本的提交
git log --grep="关键词"

# 查找修改了指定文件的提交
git log --follow filename.txt

# 查看文件的每一行最后修改信息
git blame filename.txt

# 二分查找问题提交
git bisect start
git bisect bad HEAD
git bisect good commit-hash

# 查看引用日志
git reflog

# 恢复删除的分支
git checkout -b recovered-branch commit-hash
```

## 实用别名配置

```bash
# 设置常用别名
git config --global alias.st status
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
```

## 最佳实践

### 提交信息规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动

示例：
feat: 添加用户登录功能
fix: 修复登录页面验证码显示问题
docs: 更新API文档
```

### 工作流程建议
1. **功能开发**: 创建功能分支 → 开发 → 测试 → 合并
2. **Bug修复**: 创建修复分支 → 修复 → 测试 → 合并
3. **发布管理**: 使用标签标记版本
4. **代码审查**: 使用Pull Request/Merge Request
5. **持续集成**: 配置自动化测试和部署
