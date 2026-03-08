---
name: bo-x-pubwechat
description: 使用Chrome CDP将Markdown文章发布到微信公众号。当用户说"/发布公众号"、"发布到微信"或提供markdown文件要求发布时触发。
---

# 发布到微信公众号 Skill

这是内容生产工厂的微信发布工作流：将终稿Markdown文章通过Chrome CDP方式发布到微信公众号草稿箱。

## 触发条件

当用户出现以下任一情况时，触发此skill：

- 明确说"发布公众号"、"发布到微信"、"post to wechat"
- 用户提供markdown文件路径并要求发布
- 用户说"用chrome cdp发布到微信"
- 在终稿阶段说"/发布公众号"

## 前提条件检查

### 检查Chrome和Profile

运行环境检查脚本：

```bash
npx -y bun /c/Users/tju_g/.claude/skills/baoyu-post-to-wechat/scripts/check-permissions.ts
```

关键检查项：
- ✅ Chrome浏览器已安装
- ✅ Chrome profile目录存在（`~/.local/share/baoyu-skills/chrome-profile`）
- ✅ Bun运行时可用

如果检查失败，提供修复指导。

## 工作流程

### 步骤1：确定输入文件

**场景A：用户明确提供了文件路径**
- 检查文件是否存在
- 验证是否为Markdown文件（`.md`后缀）
- 提取文件frontmatter信息

**场景B：用户未提供文件路径**
- 提示用户："请提供要发布的Markdown文件路径"
- 等待用户提供文件

**文件验证：**
```bash
test -f "文件路径" && echo "存在" || echo "不存在"
```

### 步骤2：提取元数据

从Markdown文件的YAML frontmatter中提取：

- **title**：文章标题（必需）
- **author**：作者（可选）
- **summary**：摘要（可选，如未提供则自动生成）

**自动生成规则：**
- **摘要**：取第一个段落的前120字符

### 步骤3：转换Markdown为HTML

由于依赖问题，使用手动HTML创建方式：

**HTML模板结构：**
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>{{标题}}</title>
</head>
<body>
<h1>{{标题}}</h1>
{{转换后的正文内容}}
</body>
</html>
```

**转换规则：**
- H1 → `<h1>`
- H2 → `<h2>`
- H3 → `<h3>`
- 段落 → `<p>`
- 粗体 → `<strong>`
- 列表 → `<ul><li>`
- 分隔线 → `<hr>`

**保存位置：** 与markdown文件同目录，同名但后缀为`.html`

### 步骤4：发布到微信

使用`baoyu-post-to-wechat`技能的`wechat-article.ts`脚本：

```bash
npx -y bun /c/Users/tju_g/.claude/skills/baoyu-post-to-wechat/scripts/wechat-article.ts --html "HTML文件路径"
```

**关键流程：**
1. 启动Chrome浏览器（使用隔离profile）
2. 检查登录状态（如未登录，等待用户扫码）
3. 点击"文章"菜单
4. 填充标题
5. 粘贴HTML内容
6. 填充摘要
7. 保存为草稿
8. 保持浏览器窗口打开

**预期输出：**
```
[wechat] Parsing HTML: 文件路径
[wechat] Title: 标题
[wechat] Author: 作者
[wechat] Summary: 摘要
[wechat] Found N images to insert
[cdp] Launching Chrome (profile: ...)
[wechat] Waiting for page load...
[wechat] Logged in.
[wechat] Clicking "文章" menu...
[wechat] Editor tab opened.
[wechat] Filling title...
[wechat] Title verified OK.
[wechat] Clicking on editor...
[wechat] Ensuring editor focus...
[wechat] Copying HTML content...
[wechat] Pasting into editor...
[wechat] Body content verified OK.
[wechat] Filling summary...
[wechat] Summary verified OK.
[wechat] Saving as draft...
[wechat] Waiting for save confirmation...
[wechat] Done. Browser window left open.
```

### 步骤5：更新文章状态

如果发布成功，更新原Markdown文件的frontmatter：

**添加/更新字段：**
```yaml
publish_date: {{DATE:YYYY-MM-DD}}
publish_time: {{TIME:HH:mm}}
publish_platform: 公众号
publish_status: 已发布到草稿箱
```

### 步骤6：输出报告

向用户报告发布结果：

```
✅ 微信公众号发布成功！

📄 文章信息：
- 标题：{{标题}}
- 作者：{{作者}}
- 摘要：{{摘要前50字}}...
- 图片：{{N}}张

📦 发布结果：
- 方式：Chrome CDP（浏览器自动化）
- 状态：已保存到草稿箱
- 浏览器：保持打开，可预览编辑

📁 创建的文件：
- HTML文件：{{路径}}

🎯 下一步操作：
1. 在浏览器中预览草稿
2. 添加封面图片（如需要）
3. 检查排版和格式
4. 点击"发布"按钮正式发布

💡 提示：
- 草稿已保存，尚未正式发布
- 浏览器窗口保持打开，方便检查和编辑
```

## 错误处理

### 错误1：文件不存在

**提示：**
```
❌ 文件不存在：{{文件路径}}

请检查文件路径是否正确，或提供有效的Markdown文件路径。
```

### 错误2：依赖问题

**如果遇到模块错误（如unist-util-visit）：**

**解决方案：**
1. 清理bun缓存：`rm -rf ~/.bun/install/cache/unist-util-*`
2. 使用手动HTML创建方式（本skill默认方式）
3. 直接粘贴HTML内容到编辑器

### 错误3：浏览器启动失败

**检查：**
- Chrome是否已安装
- Profile目录是否存在
- 是否有Chrome进程冲突

**修复：**
```bash
# 检查Chrome路径
which google-chrome || which chrome

# 创建profile目录
mkdir -p ~/.local/share/baoyu-skills/chrome-profile
```

### 错误4：未登录

**提示：**
```
📱 需要扫码登录

浏览器已打开，请使用微信扫码登录公众号平台。
登录成功后将自动继续发布流程。
```

等待用户扫码登录，最长等待2分钟。

### 错误5：内容粘贴失败

**检查：**
- HTML文件是否创建成功
- HTML内容是否有效
- 剪贴板权限是否正常

**重试：**
1. 重新创建HTML文件
2. 手动复制HTML内容
3. 使用浏览器手动粘贴

## 使用示例

### 示例1：基本发布

**用户输入：**
```
发布公众号：03-内容工厂/3-终稿发布区/2026-03-08-文章标题-终稿.md
```

**执行流程：**
1. 验证文件存在
2. 提取标题、作者、摘要
3. 创建HTML文件
4. 启动Chrome
5. 发布到微信草稿箱
6. 报告成功

### 示例2：交互式发布

**用户输入：**
```
发布到微信
```

**系统响应：**
```
请提供要发布的Markdown文件路径：
```

**用户提供：**
```
06-已发布归档/2026-03/文章标题/文章标题-终稿.md
```

**执行流程：**
同示例1

### 示例3：带指定主题

**用户输入：**
```
发布公众号：文章.md --theme default
```

**说明：**
- Chrome CDP方式会应用微信编辑器的默认样式
- 主题参数可选，默认使用微信编辑器样式

## 技术说明

### Chrome Profile隔离

使用独立的Chrome profile避免与日常浏览冲突：

**Profile路径：** `~/.local/share/baoyu-skills/chrome-profile`

**优点：**
- 保持微信公众号登录状态
- 不污染个人浏览器数据
- 可以复用登录session

### HTML转换策略

**为什么手动创建HTML？**

1. 避免依赖问题（unist-util-visit等模块）
2. 更可控的转换结果
3. 减少外部依赖
4. 提高发布成功率

**转换规则：**
- 使用基础HTML标签
- 保持语义结构
- 支持常见Markdown语法

### 内容粘贴流程

1. 在新标签页打开HTML文件
2. 使用JavaScript选择`body`内容
3. 执行复制操作
4. 切换回编辑器标签
5. 执行粘贴操作
6. 验证内容是否成功粘贴

## 参考文档

- 主技能：`baoyu-post-to-wechat`
- 系统文档：@用Claude和Obsidian做内容生产工厂.md
- Chrome CDP文档：`baoyu-post-to-wechat/scripts/cdp.ts`

## 注意事项

1. **登录状态：** 首次使用需要扫码登录，之后会保持登录状态
2. **浏览器窗口：** 发布后浏览器窗口保持打开，方便用户预览和编辑
3. **草稿状态：** 文章保存为草稿，需要用户手动点击发布
4. **封面图片：** Chrome CDP方式暂不支持自动添加封面，需要手动添加
5. **文件命名：** HTML文件与Markdown文件同名，保存在同一目录
6. **依赖问题：** 遇到依赖错误时，自动切换到手动HTML创建方式

## 与bo-系列集成

此skill可以与bo-系列其他skill配合使用：

- **bo-4-draft-to-final**：生成终稿后，可以调用此skill发布
- **bo-advance**：推进流程时，可以自动触发发布
- **bo-autoflow**：全自动流程中，作为最后一步发布

**集成方式：**

在`bo-advance`或`bo-autoflow`中，检测到终稿完成后：

```
检测到终稿已完成，是否发布到微信公众号？(y/n)
```

用户确认后，自动调用此skill完成发布。