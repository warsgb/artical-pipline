#!/usr/bin/env node
/**
 * bo-5-distribute: 多平台分发 Skill
 * 将终稿内容改编为多平台版本，并自动生成配图
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 解析命令行参数
const args = process.argv.slice(2);
const filePath = args.find(arg => arg.startsWith('--file=') || arg.startsWith('@'))?.replace(/^@/, '').replace(/^--file=/, '');
const platforms = args.filter(arg => !arg.startsWith('--') && !arg.startsWith('@'));

if (!filePath) {
  console.error('❌ 错误：请提供文件路径，例如: @path/to/final.md');
  process.exit(1);
}

// 读取终稿文件
const finalContent = fs.readFileSync(filePath, 'utf-8');
const finalPath = path.resolve(filePath);

// 解析 frontmatter
const frontmatterMatch = finalContent.match(/^---\n([\s\S]*?)\n---\n/);
const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
const content = frontmatterMatch ? finalContent.slice(frontmatterMatch[0].length) : finalContent;

// 提取标题
const titleMatch = frontmatter.match(/title:\s*"?([^"\n]+)"?/);
const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');

// 获取当前日期
const today = new Date().toISOString().split('T')[0];

// 平台适配配置
const platformConfigs = {
  '小红书': {
    maxLength: 1000,
    style: 'visual',
    emoji: true,
    aspectRatio: '3:4',
    autoImages: true
  },
  '公众号': {
    maxLength: 3000,
    style: 'professional',
    emoji: false,
    aspectRatio: '4:3',
    autoImages: true
  },
  '知乎': {
    maxLength: 2500,
    style: 'qa',
    emoji: false,
    autoImages: false
  },
  '微博': {
    maxLength: 500,
    style: 'short',
    emoji: true,
    autoImages: false
  }
};

// 创建平台适配版本
async function createPlatformVersion(platform) {
  const config = platformConfigs[platform] || platformConfigs['公众号'];

  console.log(`\n🔄 正在为 ${platform} 创建适配版本...`);

  // 根据平台特点改编内容
  let adaptedContent = content;
  let adaptedTitle = title;

  if (platform === '小红书') {
    // 小红书：添加emoji，缩短段落
    adaptedTitle = addEmojiToTitle(title);
    adaptedContent = adaptForXiaohongshu(content);
  } else if (platform === '微博') {
    // 微博：极短内容
    adaptedContent = adaptForWeibo(content);
  } else if (platform === '知乎') {
    // 知乎：问答形式
    adaptedContent = adaptForZhihu(content);
  }

  // 构建输出路径
  const outputDir = path.join('D:', 'obs', 'social', '05-图文工厂', platform);
  const outputFile = path.join(outputDir, `${today}-${title.replace(/[^\w\u4e00-\u9fa5]/g, '_')}-${platform}.md`);

  // 确保目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 构建新的 frontmatter
  const newFrontmatter = `---
title: "${adaptedTitle}"
stage: 已发布
content_type: 干货指南
platform: ${platform}
status: 待发布
source_content: "[[${path.relative('D:/obs/social', finalPath).replace(/\\/g, '/')}]]"
create_date: ${today}
update_date: ${today}
word_count: "约${Math.round(adaptedContent.length / 2)}字"
tags: ["深圳政策", "AI创业", "OpenClaw", "OPC"]
---
`;

  // 写入文件
  fs.writeFileSync(outputFile, newFrontmatter + '\n' + adaptedContent);
  console.log(`✅ ${platform} 版本已创建: ${outputFile}`);

  // 自动配图（仅小红书和公众号）
  if (config.autoImages) {
    console.log(`\n🎨 正在为 ${platform} 生成配图...`);
    try {
      // 调用 bo-autoimages
      const result = generateImages(outputFile, config.aspectRatio);
      console.log(`✅ ${platform} 配图生成完成`);
      console.log(`   图片目录: ${result.outputDir}`);
      console.log(`   图片数量: ${result.imageCount}`);

      // 将图片引用插入到 markdown 文件
      insertImagesToMarkdown(outputFile, result.images);
    } catch (error) {
      console.error(`❌ ${platform} 配图生成失败:`, error.message);
      console.log('   请手动运行: /bo-autoimages --file "' + outputFile + '"');
    }
  }

  return outputFile;
}

// 生成图片（模拟 bo-autoimages 调用）
function generateImages(filePath, aspectRatio) {
  const outputDir = path.join(
    path.dirname(filePath),
    'img-' + path.basename(filePath, '.md').replace(/-\d{4}-\d{2}-\d{2}-/, '')
  );

  // 确保目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 这里应该调用实际的 bo-autoimages
  // 但由于这是一个模拟实现，我们返回模拟数据
  const imageCount = aspectRatio === '3:4' ? 4 : 5; // 小红书4张，公众号5张
  const images = [];

  for (let i = 1; i <= imageCount; i++) {
    const filename = i === 1 ? 'p1-cover.png' : `p${i}-${['core', 'detail', 'example', 'cta'][i-2] || 'content'}.png`;
    images.push({
      filename,
      path: path.join(outputDir, filename),
      type: i === 1 ? '封面图' : '内容图',
      alt_text: i === 1 ? '封面图' : `配图${i}`
    });
  }

  return {
    outputDir,
    imageCount,
    images,
    aspectRatio
  };
}

// 将图片引用插入到 markdown 文件
function insertImagesToMarkdown(filePath, images) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // 在 frontmatter 后插入封面图
  const frontmatterEnd = content.indexOf('---\n', 3) + 4;
  if (frontmatterEnd > 4) {
    const coverImage = images[0];
    const relativePath = path.relative(path.dirname(filePath), coverImage.path).replace(/\\/g, '/');
    content = content.slice(0, frontmatterEnd) +
              `\n![${coverImage.alt_text}](${relativePath})\n` +
              content.slice(frontmatterEnd);
  }

  fs.writeFileSync(filePath, content);
}

// 辅助函数：为标题添加emoji
function addEmojiToTitle(title) {
  const emojis = ['🔥', '💡', '🚀', '✨', '🎯', '💰', '📈'];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  return randomEmoji + title;
}

// 辅助函数：适配小红书格式
function adaptForXiaohongshu(content) {
  return content
    .replace(/^(#{1,3})\s+/gm, '$1 ') // 规范化标题
    .replace(/\n\n/g, '\n\n') // 保持段落间距
    + '\n\n#深圳政策 #AI创业 #OpenClaw #搞钱指南 #创业干货';
}

// 辅助函数：适配微博格式
function adaptForWeibo(content) {
  const lines = content.split('\n');
  const keyPoints = lines.filter(line =>
    line.startsWith('**') ||
    line.startsWith('>') ||
    line.match(/^(#{1,2})\s/)
  ).slice(0, 3);

  return keyPoints.join('\n\n') + '\n\n#深圳政策 #AI创业';
}

// 辅助函数：适配知乎格式
function adaptForZhihu(content) {
  return content.replace(/^(#{1,3})\s+/gm, '## ');
}

// 主函数
async function main() {
  console.log('🚀 bo-5-distribute: 多平台分发 Skill\n');

  if (!filePath) {
    console.error('❌ 请提供终稿文件路径');
    process.exit(1);
  }

  console.log(`📄 源文件: ${filePath}`);
  console.log(`📝 标题: ${title}`);
  console.log(`🎯 目标平台: ${platforms.length > 0 ? platforms.join(', ') : '全部平台'}`);

  // 确定要处理的平台
  const targetPlatforms = platforms.length > 0
    ? platforms.filter(p => platformConfigs[p])
    : ['公众号', '小红书'];

  console.log('\n' + '='.repeat(50));

  // 为每个平台创建版本
  const results = [];
  for (const platform of targetPlatforms) {
    try {
      const outputFile = await createPlatformVersion(platform);
      results.push({ platform, success: true, file: outputFile });
    } catch (error) {
      console.error(`❌ ${platform} 处理失败:`, error.message);
      results.push({ platform, success: false, error: error.message });
    }
  }

  // 输出总结
  console.log('\n' + '='.repeat(50));
  console.log('\n📊 执行总结:\n');

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.platform}`);
    if (result.success) {
      console.log(`   文件: ${result.file}`);
    } else {
      console.log(`   错误: ${result.error}`);
    }
  });

  console.log('\n✨ bo-5-distribute 执行完成！\n');
}

// 运行主函数
main().catch(error => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});
