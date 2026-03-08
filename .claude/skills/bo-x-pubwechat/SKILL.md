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

### 步骤3：压缩图片并转为base64

**目标：** 减小图片体积，避免HTML文件过大导致粘贴失败

**执行流程：**

```bash
# 1. 检查文章中是否有本地图片引用
# 查找 Markdown 中的图片语法：![alt](path/to/image.png)

# 2. 压缩图片为WebP格式（质量75%，体积减少约95%）
# 使用 sharp 库进行压缩

# 3. 将压缩后的图片转为base64
# 生成 data:image/webp;base64,xxx 格式
```

**压缩脚本示例：**
```javascript
import sharp from 'sharp';

// 压缩单张图片
await sharp('image.png')
  .webp({ quality: 75 })
  .toFile('image.webp');

// 转为base64
const buffer = readFileSync('image.webp');
const base64 = `data:image/webp;base64,${buffer.toString('base64')}`;
```

**压缩效果：**
- PNG (2-3MB) → WebP (80-250KB)
- 压缩率：约95%
- 6张图片总大小：从15MB降至约1MB

### 步骤4：转换Markdown为HTML（含base64图片）

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
- **图片** → `<img src="data:image/webp;base64,xxx" style="max-width:100%">`

**图片处理逻辑：**
1. 解析Markdown中的图片引用：`![alt](path/to/image.png)`
2. 如果存在对应的 `.webp` 文件（步骤3生成），使用base64格式
3. 否则保留原始路径（可能无法在微信中显示）

**保存位置：** 与markdown文件同目录，同名但后缀为`.html`

### 步骤5：发布到微信

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

### 步骤6：更新文章状态

如果发布成功，更新原Markdown文件的frontmatter：

**添加/更新字段：**
```yaml
publish_date: {{DATE:YYYY-MM-DD}}
publish_time: {{TIME:HH:mm}}
publish_platform: 公众号
publish_status: 已发布到草稿箱
```

### 步骤7：输出报告

向用户报告发布结果：

```
✅ 微信公众号发布成功！

📄 文章信息：
- 标题：{{标题}}
- 作者：{{作者}}
- 摘要：{{摘要前50字}}...

🖼️ 图片处理：
- 原图片：{{N}}张 PNG ({{原大小}}MB)
- 压缩后：{{N}}张 WebP ({{压缩后大小}}MB)
- 压缩率：{{压缩率}}%
- 图片已转为base64嵌入HTML

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
- 图片已以WebP格式嵌入，如显示异常请检查微信编辑器
```

## 错误处理

### 错误1：文件不存在

**提示：**
```
❌ 文件不存在：{{文件路径}}

请检查文件路径是否正确，或提供有效的Markdown文件路径。
```

### 错误2：依赖问题（bun缓存损坏）

**错误信息：**
```
Cannot find module 'unist-util-visit-parents/do-not-use-color'
```

**原因：** bun 缓存中的模块损坏

**解决方案：**

**方案A：清理bun缓存（推荐）**
```bash
rm -rf ~/.bun/install/cache/*
```
清理后重试。

**方案B：使用备用脚本（100%成功）**

如果方案A无效，使用内置的备用脚本：

```bash
# 1. 先用备用脚本将Markdown转为HTML（含base64图片）
npx -y bun .claude/skills/bo-x-pubwechat/scripts/convert-to-html.js "markdown文件路径"

# 2. 然后用 --html 参数发布
npx -y bun /c/Users/tju_g/.claude/skills/baoyu-post-to-wechat/scripts/wechat-article.ts --html "生成的HTML文件路径" --author "作者名" --submit
```

**备用脚本位置：**
`.claude/skills/bo-x-pubwechat/scripts/convert-to-html.js`

**完整命令示例：**
```bash
# Step 1: 转换
npx -y bun .claude/skills/bo-x-pubwechat/scripts/convert-to-html.js "05-图文工厂/公众号/文章标题-公众号.md"

# Step 2: 发布
npx -y bun /c/Users/tju_g/.claude/skills/baoyu-post-to-wechat/scripts/wechat-article.ts --html "05-图文工厂/公众号/文章标题-公众号.html" --author "作者" --submit
```

---

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
发布公众号：05-图文工厂/公众号/2026-03-08-文章标题-公众号.md
```

**执行流程：**
1. 验证文件存在
2. 提取标题、作者、摘要
3. **压缩图片**（PNG → WebP，体积减少95%）
4. **转换Markdown为HTML**（图片转为base64嵌入）
5. 启动Chrome
6. 发布到微信草稿箱
7. 报告成功

**输出示例：**
```
✅ 微信公众号发布成功！

📄 文章信息：
- 标题：从用户痛点到蓝海市场：AI驱动的创业新思路

🖼️ 图片处理：
- 原图片：6张 PNG (15MB)
- 压缩后：6张 WebP (0.8MB)
- 压缩率：95%
- 图片已转为base64嵌入HTML

📦 发布结果：
- 方式：Chrome CDP（浏览器自动化）
- 状态：已保存到草稿箱
```

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
5. **支持base64图片嵌入**（解决微信编辑器无法加载本地图片的问题）

**转换规则：**
- 使用基础HTML标签
- 保持语义结构
- 支持常见Markdown语法
- **图片处理**：`![alt](path.png)` → `<img src="data:image/webp;base64,xxx">`
  - 先压缩为WebP格式（减少95%体积）
  - 再转为base64嵌入HTML
  - 确保图片可以在微信编辑器中正常显示

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
7. **图片处理：**
   - 自动将PNG图片压缩为WebP格式（质量75%）
   - 压缩后图片转为base64嵌入HTML
   - 如微信编辑器中图片显示异常，可能需要手动上传封面图
   - 压缩后的WebP文件保留在原目录，可供手动上传使用
8. **依赖安装位置：**
   - sharp 依赖安装在 `.claude/skills/bo-x-pubwechat/node_modules/`
   - 不会污染内容目录（05-图文工厂/公众号/）

## 图片压缩与base64嵌入实现

完整的脚本实现示例：

```javascript
// compress-and-embed.js
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { basename, dirname, join } from 'path';

/**
 * 压缩图片并转为base64
 * @param {string} imagePath - 图片路径
 * @returns {string} - base64 data URL
 */
async function compressAndEmbed(imagePath) {
  const webpPath = imagePath.replace('.png', '.webp');

  // 如果已存在压缩后的webp文件，直接使用
  if (!existsSync(webpPath)) {
    // 压缩为WebP (质量75%)
    await sharp(imagePath)
      .webp({ quality: 75 })
      .toFile(webpPath);
  }

  // 读取并转为base64
  const buffer = readFileSync(webpPath);
  const base64 = buffer.toString('base64');

  return `data:image/webp;base64,${base64}`;
}

/**
 * 处理Markdown中的图片
 * @param {string} mdContent - Markdown内容
 * @param {string} mdDir - Markdown文件所在目录
 * @returns {string} - 处理后的HTML
 */
async function processImages(mdContent, mdDir) {
  // 匹配Markdown图片语法: ![alt](path)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let html = mdContent;

  // 收集所有图片引用
  const matches = [...mdContent.matchAll(imageRegex)];

  console.log(`发现 ${matches.length} 张图片`);

  // 逐一处理
  for (const match of matches) {
    const [fullMatch, alt, imgPath] = match;
    const absolutePath = join(mdDir, imgPath);

    if (existsSync(absolutePath)) {
      try {
        const base64Url = await compressAndEmbed(absolutePath);
        // 替换为HTML img标签
        const imgTag = `<img src="${base64Url}" alt="${alt}" style="max-width:100%;">`;
        html = html.replace(fullMatch, imgTag);
        console.log(`✓ 已处理: ${basename(imgPath)}`);
      } catch (err) {
        console.error(`✗ 处理失败: ${imgPath}`, err.message);
      }
    } else {
      console.warn(`⚠ 图片不存在: ${absolutePath}`);
    }
  }

  return html;
}

// 使用示例
async function main() {
  const mdFile = process.argv[2];
  const mdDir = dirname(mdFile);
  const mdContent = readFileSync(mdFile, 'utf-8');

  const htmlWithImages = await processImages(mdContent, mdDir);

  // 生成完整HTML
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>文章标题</title>
</head>
<body>
${convertMarkdownToHtml(htmlWithImages)}
</body>
</html>`;

  writeFileSync(mdFile.replace('.md', '.html'), html);
  console.log('HTML文件已生成');
}

main();
```

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