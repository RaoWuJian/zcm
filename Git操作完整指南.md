# Git 操作完整指南

## 目录
1. [Git 基础配置](#git-基础配置)
2. [仓库初始化](#仓库初始化)
3. [基本操作](#基本操作)
4. [分支管理](#分支管理)
5. [远程仓库操作](#远程仓库操作)
6. [版本回退与撤销](#版本回退与撤销)
7. [标签管理](#标签管理)
8. [高级操作](#高级操作)
9. [常见问题解决](#常见问题解决)
10. [最佳实践](#最佳实践)

---

## Git 基础配置

### 全局配置
```bash
# 设置用户名和邮箱（全局）
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 设置默认编辑器
git config --global core.editor "code --wait"  # VS Code
git config --global core.editor "vim"          # Vim

# 设置默认分支名
git config --global init.defaultBranch main

# 启用颜色输出
git config --global color.ui auto

# 设置换行符处理（Windows）
git config --global core.autocrlf true

# 设置换行符处理（Mac/Linux）
git config --global core.autocrlf input
```

### 局部配置（仅当前仓库）
```bash
# 为当前仓库设置用户信息
git config user.name "Project Specific Name"
git config user.email "project@example.com"
```

### 查看配置
```bash
# 查看所有配置
git config --list

# 查看特定配置
git config user.name
git config user.email

# 查看配置来源
git config --list --show-origin
```

---

## 仓库初始化

### 创建新仓库
```bash
# 在当前目录初始化仓库
git init

# 创建新目录并初始化
git init project-name
cd project-name
```

### 克隆现有仓库
```bash
# 克隆远程仓库
git clone https://github.com/username/repository.git

# 克隆到指定目录
git clone https://github.com/username/repository.git my-project

# 克隆指定分支
git clone -b branch-name https://github.com/username/repository.git

# 浅克隆（只克隆最近的提交）
git clone --depth 1 https://github.com/username/repository.git
```

---

## 基本操作

### 文件状态查看
```bash
# 查看仓库状态
git status

# 简洁状态显示
git status -s

# 查看文件差异
git diff                    # 工作区与暂存区差异
git diff --staged          # 暂存区与最新提交差异
git diff HEAD              # 工作区与最新提交差异
git diff commit1 commit2   # 两个提交之间差异
```

### 添加文件到暂存区
```bash
# 添加单个文件
git add filename.txt

# 添加多个文件
git add file1.txt file2.txt

# 添加所有文件
git add .
git add -A

# 添加所有已跟踪文件的修改
git add -u

# 交互式添加
git add -i

# 部分添加文件内容
git add -p filename.txt
```

### 提交更改
```bash
# 提交暂存区内容
git commit -m "提交信息"

# 提交所有已跟踪文件的修改（跳过 git add）
git commit -am "提交信息"

# 修改最后一次提交
git commit --amend -m "新的提交信息"

# 空提交（用于触发CI等）
git commit --allow-empty -m "空提交"
```

### 查看提交历史
```bash
# 查看提交历史
git log

# 简洁显示
git log --oneline

# 图形化显示分支
git log --graph --oneline --all

# 显示文件变更统计
git log --stat

# 显示具体变更内容
git log -p

# 查看指定文件的历史
git log filename.txt

# 查看指定作者的提交
git log --author="作者名"

# 查看指定时间范围的提交
git log --since="2023-01-01" --until="2023-12-31"
```

---

## 分支管理

### 分支基本操作
```bash
# 查看所有分支
git branch -a

# 查看本地分支
git branch

# 查看远程分支
git branch -r

# 创建新分支
git branch new-branch

# 创建并切换到新分支
git checkout -b new-branch
git switch -c new-branch  # Git 2.23+

# 切换分支
git checkout branch-name
git switch branch-name    # Git 2.23+

# 重命名分支
git branch -m old-name new-name

# 删除分支
git branch -d branch-name     # 安全删除
git branch -D branch-name     # 强制删除
```

### 分支合并
```bash
# 合并分支到当前分支
git merge branch-name

# 快进合并
git merge --ff-only branch-name

# 禁用快进合并
git merge --no-ff branch-name

# 压缩合并（将多个提交压缩为一个）
git merge --squash branch-name
```

### 变基操作
```bash
# 变基当前分支到目标分支
git rebase target-branch

# 交互式变基（修改历史提交）
git rebase -i HEAD~3

# 继续变基（解决冲突后）
git rebase --continue

# 中止变基
git rebase --abort

# 跳过当前提交
git rebase --skip
```

---

## 远程仓库操作

### 远程仓库管理
```bash
# 查看远程仓库
git remote -v

# 添加远程仓库
git remote add origin https://github.com/username/repository.git

# 修改远程仓库URL
git remote set-url origin https://github.com/username/new-repository.git

# 删除远程仓库
git remote remove origin

# 重命名远程仓库
git remote rename origin upstream
```

### 推送和拉取
```bash
# 推送到远程仓库
git push origin branch-name

# 首次推送并设置上游分支
git push -u origin branch-name

# 推送所有分支
git push origin --all

# 强制推送（危险操作）
git push --force origin branch-name
git push --force-with-lease origin branch-name  # 更安全的强制推送

# 拉取远程更改
git pull origin branch-name

# 拉取所有远程分支
git fetch origin

# 拉取并变基
git pull --rebase origin branch-name
```

### 跟踪远程分支
```bash
# 设置当前分支跟踪远程分支
git branch --set-upstream-to=origin/branch-name

# 创建并跟踪远程分支
git checkout -b local-branch origin/remote-branch

# 查看分支跟踪关系
git branch -vv
```

---

## 版本回退与撤销

### 撤销工作区修改
```bash
# 撤销单个文件的修改
git checkout -- filename.txt
git restore filename.txt  # Git 2.23+

# 撤销所有文件的修改
git checkout -- .
git restore .  # Git 2.23+
```

### 撤销暂存区修改
```bash
# 取消暂存单个文件
git reset HEAD filename.txt
git restore --staged filename.txt  # Git 2.23+

# 取消暂存所有文件
git reset HEAD
git restore --staged .  # Git 2.23+
```

### 版本回退
```bash
# 软回退（保留工作区和暂存区）
git reset --soft HEAD~1

# 混合回退（保留工作区，清空暂存区）
git reset --mixed HEAD~1
git reset HEAD~1  # 默认为mixed

# 硬回退（清空工作区和暂存区）
git reset --hard HEAD~1

# 回退到指定提交
git reset --hard commit-hash
```

### 撤销提交
```bash
# 创建新提交来撤销指定提交
git revert commit-hash

# 撤销合并提交
git revert -m 1 merge-commit-hash
```

---

## 标签管理

### 创建标签
```bash
# 创建轻量标签
git tag v1.0.0

# 创建附注标签
git tag -a v1.0.0 -m "版本 1.0.0"

# 为指定提交创建标签
git tag -a v1.0.0 commit-hash -m "版本 1.0.0"
```

### 查看标签
```bash
# 列出所有标签
git tag

# 查看标签信息
git show v1.0.0

# 按模式列出标签
git tag -l "v1.*"
```

### 推送标签
```bash
# 推送单个标签
git push origin v1.0.0

# 推送所有标签
git push origin --tags
```

### 删除标签
```bash
# 删除本地标签
git tag -d v1.0.0

# 删除远程标签
git push origin --delete v1.0.0
```

---

## 高级操作

### 储藏（Stash）
```bash
# 储藏当前修改
git stash

# 储藏时添加消息
git stash save "工作进行中"

# 查看储藏列表
git stash list

# 应用最新储藏
git stash apply

# 应用指定储藏
git stash apply stash@{2}

# 应用并删除储藏
git stash pop

# 删除储藏
git stash drop stash@{2}

# 清空所有储藏
git stash clear
```

### 子模块
```bash
# 添加子模块
git submodule add https://github.com/username/repository.git path/to/submodule

# 初始化子模块
git submodule init

# 更新子模块
git submodule update

# 克隆包含子模块的仓库
git clone --recursive https://github.com/username/repository.git

# 更新所有子模块到最新版本
git submodule update --remote
```

### 工作树
```bash
# 创建新的工作树
git worktree add ../feature-branch feature-branch

# 列出所有工作树
git worktree list

# 删除工作树
git worktree remove ../feature-branch
```

---

## 常见问题解决

### 解决合并冲突
```bash
# 1. 查看冲突文件
git status

# 2. 手动编辑冲突文件，解决冲突标记
# <<<<<<< HEAD
# 当前分支的内容
# =======
# 合并分支的内容
# >>>>>>> branch-name

# 3. 添加解决后的文件
git add conflicted-file.txt

# 4. 完成合并
git commit
```

### 修改提交历史
```bash
# 修改最后一次提交的作者
git commit --amend --author="New Author <new@email.com>"

# 修改历史提交的作者
git rebase -i HEAD~3
# 在编辑器中将要修改的提交前的 pick 改为 edit
# 然后执行：
git commit --amend --author="New Author <new@email.com>"
git rebase --continue
```

### 找回丢失的提交
```bash
# 查看引用日志
git reflog

# 恢复到指定提交
git reset --hard commit-hash

# 创建分支指向丢失的提交
git branch recovery-branch commit-hash
```

### 清理仓库
```bash
# 清理未跟踪的文件（预览）
git clean -n

# 清理未跟踪的文件
git clean -f

# 清理未跟踪的文件和目录
git clean -fd

# 垃圾回收
git gc

# 压缩仓库
git gc --aggressive
```

---

## 最佳实践

### 提交信息规范
```
类型(范围): 简短描述

详细描述（可选）

相关问题: #123
```

常用类型：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 分支命名规范
```
feature/功能名称
bugfix/问题描述
hotfix/紧急修复
release/版本号
```

### 工作流程建议
1. 从主分支创建功能分支
2. 在功能分支上开发
3. 定期从主分支拉取更新
4. 完成开发后创建Pull Request
5. 代码审查通过后合并到主分支
6. 删除功能分支

### 安全建议
- 不要在公共仓库中提交敏感信息
- 使用 `.gitignore` 忽略不需要版本控制的文件
- 定期备份重要仓库
- 使用SSH密钥而不是密码进行身份验证

---

## 常用 .gitignore 模板

### Node.js 项目
```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build output
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

### Python 项目
```gitignore
# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# Virtual environment
venv/
env/
ENV/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

---

这份文档涵盖了Git的大部分常用操作，建议根据实际需要逐步学习和实践。记住，Git是一个强大的工具，熟练掌握需要时间和练习。
