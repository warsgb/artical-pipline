# CLAUDE.md - 内容生产工厂 (Content Factory)

## 项目概述

这是基于 Claude Code + Obsidian 的内容生产工厂，实现从灵感入库到多平台发布的全自动化流程。

## 核心技术栈

- **内容管理**: Obsidian (Markdown)
- **浏览器自动化**: Chrome CDP (DevTools Protocol)
- **图片生成**: Google Gemini (gemini-3-pro-image-preview)
- **运行时**: Bun

## 完整工作流程

```
URL/素材 → bo-1(灵感) → bo-2(选题) → bo-3(大纲) → bo-4(初稿) → bo-5(终稿)
     ↓
  bo-5-distribute(多平台分发)
     ↓
  bo-autoimages(自动配图) → 小红书/公众号
     ↓
  bo-6-publish(发布) → bo-x-pubwechat(公众号)
     ↓
  bo-7-archive(归档)
```

## Skills 调用关系

| Skill                 | 职责      | 被谁调用            |
| --------------------- | ------- | --------------- |
| bo-autoflow           | 自动化编排   | 用户直接调用          |
| bo-1-inspiration      | 灵感入库+选题 | bo-autoflow     |
| bo-2-topic-to-outline | 选题→大纲   | bo-autoflow     |
| bo-3-outline-to-draft | 大纲→初稿   | bo-autoflow     |
| bo-4-draft-to-final   | 初稿→终稿   | bo-autoflow     |
| bo-5-distribute       | 多平台分发   | bo-autoflow     |
| bo-autoimages         | 自动生成配图  | bo-5-distribute |
| bo-6-publish          | 发布到平台   | bo-autoflow     |
| bo-x-pubwechat        | 公众号发布   | bo-6-publish    |
| baoyu-url-to-markdown | URL抓取   | bo-autoflow     |
| baoyu-image-gen       | AI图片生成  | bo-autoimages   |

## 文件结构

```
内容工厂/
├── 00-网文收藏/                    # 原始文章备份
├── 01-灵感与素材库/                # 灵感卡片
│   └── 1-日常灵感剪报/
├── 02-选题池/                      # 选题库
│   └── 待写选题库/
├── 03-内容工厂/                    # 生产中的内容
│   ├── 1-大纲对焦区/               # 大纲文件
│   ├── 2-初稿打磨区/               # 初稿文件
│   └── 3-终稿发布区/               # 终稿文件
├── 04-视频工厂/                    # 视频脚本
├── 05-图文工厂/                    # 分发版本
│   ├── 小红书/
│   │   └── img-{标题}/            # 小红书配图(3:4)
│   └── 公众号/
│       └── img-{标题}/             # 公众号配图(4:3)
├── 06-已发布归档/                  # 已发布内容
└── 90-系统配置/                    # 模板和规则
```

## 内容生产各阶段说明

| 阶段 | Skill | 输入 | 输出目录 | 文件命名规则 |
|------|-------|------|---------|-------------|
| 灵感入库 | bo-1 | URL/素材 | 01-灵感与素材库/1-日常灵感剪报/ | YYYY-MM-DD-关键词.md |
| 选题 | bo-1 | 灵感卡 | 02-选题池/待写选题库/ | YYYY-MM-DD-选题标题.md |
| 大纲 | bo-2 | 选题 | 03-内容工厂/1-大纲对焦区/ | YYYY-MM-DD-标题-大纲.md |
| 初稿 | bo-3 | 大纲 | 03-内容工厂/2-初稿打磨区/ | YYYY-MM-DD-标题-初稿.md |
| 终稿 | bo-4 | 初稿 | 03-内容工厂/3-终稿发布区/ | YYYY-MM-DD-标题-终稿.md |
| 分发 | bo-5 | 终稿 | 05-图文工厂/{平台}/ | YYYY-MM-DD-标题-{平台}.md |
| 配图 | bo-autoimages | 分发文件 | 05-图文工厂/{平台}/img-{标题}/ | p1-cover.png, p2-xxx.png... |
| 发布 | bo-6 | 分发文件 | 05-图文工厂/{平台}/ | 更新原文件状态 |
| 归档 | bo-7 | 已发布 | 06-已发布归档/ | 按月份整理 |

### 各阶段文件内容要求

**1. 灵感卡 (bo-1)**
- 位置: `01-灵感与素材库/1-日常灵感剪报/`
- 包含: 原始素材、核心亮点、我的联想、相关笔记

**2. 选题 (bo-1)**
- 位置: `02-选题池/待写选题库/`
- 包含: 核心观点、目标受众、平台适配、参考素材、大纲草稿

**3. 大纲 (bo-2)**
- 位置: `03-内容工厂/1-大纲对焦区/`
- 包含: 大纲结构(开篇/正文/结尾)、预估字数、配图建议

**4. 初稿 (bo-3)**
- 位置: `03-内容工厂/2-初稿打磨区/`
- 包含: 完整文章、待优化标记

**5. 终稿 (bo-4)**
- 位置: `03-内容工厂/3-终稿发布区/`
- 包含: 润色后的终稿、可直接分发

**6. 分发版本 (bo-5)**
- 位置: `05-图文工厂/{小红书|公众号|知乎|微博}/`
- 包含: 平台适配版本、配图引用

**7. 配图 (bo-autoimages)**
- 位置: `05-图文工厂/{平台}/img-{标题}/`
- 比例: 小红书 3:4，公众号 4:3
- 数量: 3-6张

## 关键执行命令

### 1. 全自动模式 (无需用户确认)

```bash
/bo-autoflow 全自动，https://xxx
```

### 2. 单独调用

```bash
# 灵感入库
/bo-1-inspiration @素材

# 选题转大纲
/bo-2-topic-to-outline @选题

# 生成配图
/bo-autoimages @05-图文工厂/小红书/xxx.md

# 发布公众号
/bo-x-pubwechat @05-图文工厂/公众号/xxx.md
```

### 3. URL 转 Markdown

```bash
npx -y bun ~/.claude/skills/baoyu-url-to-markdown/scripts/main.ts <url>
```

### 4. AI 图片生成

```bash
npx -y bun ~/.claude/skills/baoyu-image-gen/scripts/main.ts \
  --prompt "提示词" \
  --image "输出路径.png" \
  --ar 3:4 \
  --quality 2k
```

### 5. 公众号发布 (含依赖问题解决)

```bash
# 方法1: 直接发布 (可能遇到依赖错误)
npx -y bun ~/.claude/skills/baoyu-post-to-wechat/scripts/wechat-article.ts \
  --markdown "xxx.md" --author "作者" --submit

# 方法2: 备用方案 (100%成功)
# Step 1: 转HTML
npx -y bun .claude/skills/bo-x-pubwechat/scripts/convert-to-html.js "xxx.md"
# Step 2: 发布
npx -y bun ~/.claude/skills/baoyu-post-to-wechat/scripts/wechat-article.ts \
  --html "xxx.html" --author "作者" --submit
```

## 常见问题与解决方案

### Q1: baoyu-post-to-wechat 依赖错误

**错误:**
```
Cannot find module 'unist-util-visit-parents/do-not-use-color'
```

**解决方案:**
```bash
# 方案A: 清理bun缓存
rm -rf ~/.bun/install/cache/*

# 方案B: 使用备用脚本 (推荐)
npx -y bun .claude/skills/bo-x-pubwechat/scripts/convert-to-html.js "markdown文件.md"
npx -y bun ~/.claude/skills/baoyu-post-to-wechat/scripts/wechat-article.ts --html "生成的html.html" --author "作者" --submit
```

### Q2: 图片生成失败

- 检查 API Key 是否有效
- 尝试更换 provider: `--provider openai` 或 `--provider dashscope`

### Q3: Chrome CDP 连接失败

```bash
# 检查 profile 目录
ls -la ~/.local/share/baoyu-skills/chrome-profile

# 如不存在，手动创建
mkdir -p ~/.local/share/baoyu-skills/chrome-profile
```

## 配置位置

| 配置 | 位置 |
|------|------|
| baoyu-image-gen | `.baoyu-skills/baoyu-image-gen/EXTEND.md` |
| baoyu-url-to-markdown | `.baoyu-skills/baoyu-url-to-markdown/EXTEND.md` |
| bo-x-pubwechat | `.claude/skills/bo-x-pubwechat/` |

## 注意事项

1. **子技能不要直接调用**: bo-autoflow 应该调用 bo-1~bo-7，而不是 bo-x-pubwechat 或 bo-autoimages（这些是被其他技能内部调用的）

2. **平台图片比例**:
   - 小红书: 3:4
   - 公众号: 4:3

3. **配图自动生成**: bo-5-distribute 会自动调用 bo-autoimages 生成配图

4. **公众号发布**: 保存到草稿箱，需要手动点击发布

5. **Bun缓存**: 定期清理可避免依赖问题 `rm -rf ~/.bun/install/cache/*`
