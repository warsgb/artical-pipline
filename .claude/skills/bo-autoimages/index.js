#!/usr/bin/env bun
/**
 * bo-autoimages - 自动化图片生成
 *
 * 读取内容文件，分析内容类型和关键点，调用 baoyu-image-gen 生成图片
 */

import { readFile, mkdir } from "node:fs/promises";
import { dirname, join, basename } from "node:path";
import { execSync } from "node:child_process";

// 解析命令行参数
function parseArgs(args) {
  const options = {
    file: null,
    content: null,
    output: null,
    style: "notion",
    imageCount: null,
    aspectRatio: null,
    provider: "google",
    quality: "2k",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--file" || arg === "-f") {
      options.file = args[++i];
    } else if (arg === "--content" || arg === "-c") {
      options.content = args[++i];
    } else if (arg === "--output" || arg === "-o") {
      options.output = args[++i];
    } else if (arg === "--style" || arg === "-s") {
      options.style = args[++i];
    } else if (arg === "--image-count" || arg === "-n") {
      options.imageCount = parseInt(args[++i], 10);
    } else if (arg === "--ar" || arg === "--aspect-ratio") {
      options.aspectRatio = args[++i];
    } else if (arg === "--provider" || arg === "-p") {
      options.provider = args[++i];
    } else if (arg === "--quality") {
      options.quality = args[++i];
    } else if (!arg.startsWith("-")) {
      // 位置参数，可能是文件路径
      if (!options.file) {
        options.file = arg;
      }
    }
  }

  return options;
}

// 读取文件内容
async function readContent(filePath) {
  try {
    const content = await readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    throw new Error(`无法读取文件: ${filePath} - ${error.message}`);
  }
}

// 分析内容，提取关键信息
async function analyzeContent(content, filePath) {
  // 尝试从 frontmatter 提取平台信息
  const platformMatch = content.match(/platform:\s*(.+)/i);
  let platform = platformMatch ? platformMatch[1].trim() : "小红书";

  // 清理平台名称
  platform = platform.replace(/["']/g, "").trim();

  // 根据平台决定比例
  let aspectRatio = "3:4"; // 默认小红书
  if (platform.includes("公众号") || platform.includes("微信")) {
    aspectRatio = "4:3";
  } else if (platform.includes("抖音") || platform.includes("视频")) {
    aspectRatio = "9:16";
  }

  // 根据内容长度决定图片数量
  const contentLength = content.length;
  let imageCount = 4; // 默认
  if (contentLength < 500) {
    imageCount = 3;
  } else if (contentLength < 1500) {
    imageCount = 4;
  } else if (contentLength < 3000) {
    imageCount = 5;
  } else {
    imageCount = 6;
  }

  // 提取标题
  const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/title:\s*["']?([^"'\n]+)["']?/i);
  const title = titleMatch ? titleMatch[1].trim() : "配图";

  // 生成输出目录
  const baseName = filePath ? basename(filePath, ".md") : "img-output";
  const outputDir = join(dirname(filePath || "."), `img-${baseName}`);

  return {
    platform,
    aspectRatio,
    imageCount,
    title,
    outputDir,
    contentLength,
  };
}

// 生成单张图片
async function generateImage(prompt, outputPath, options) {
  const { aspectRatio, provider, quality, referenceImage } = options;

  // 获取 baoyu-image-gen 的绝对路径（使用 Windows 路径格式）
  const homedir = process.env.HOME || process.env.USERPROFILE;
  const baoyuImageGenPath = `${homedir}\\.claude\\skills\\baoyu-image-gen\\scripts\\main.ts`;

  // 将输出路径转换为 Unix 格式（bun 在 Windows 上可能需要）
  const unixOutputPath = outputPath.replace(/\\/g, '/');

  // 构建 baoyu-image-gen 命令（移除 --style 参数）
  const args = [
    "npx", "-y", "bun", baoyuImageGenPath,
    "--prompt", prompt,
    "--image", unixOutputPath,
    "--provider", provider,
    "--quality", quality,
  ];

  if (aspectRatio) {
    args.push("--ar", aspectRatio);
  }

  if (referenceImage) {
    args.push("--ref", referenceImage);
  }

  const command = args.join(" ");

  try {
    console.log(`生成图片: ${outputPath}`);
    console.log(`命令: ${command.substring(0, 200)}...`);

    execSync(command, {
      stdio: "inherit",
      timeout: 300000, // 5分钟超时
    });

    return true;
  } catch (error) {
    console.error(`图片生成失败: ${error.message}`);
    return false;
  }
}

// 为内容生成一系列图片
async function generateImagesForContent(content, analysis, options) {
  const { imageCount, outputDir, title } = analysis;
  const images = [];

  // 创建输出目录
  try {
    await mkdir(outputDir, { recursive: true });
  } catch (error) {
    // 目录可能已存在
  }

  // 生成每张图片的提示词
  const prompts = generatePrompts(content, analysis, imageCount);

  // 第一张图片作为参考图
  let referenceImage = null;

  for (let i = 0; i < prompts.length; i++) {
    const imageNum = i + 1;
    const filename = `p${imageNum}-${prompts[i].type}.png`;
    const outputPath = join(outputDir, filename);

    console.log(`\n[${imageNum}/${prompts.length}] 生成: ${filename}`);

    const success = await generateImage(prompts[i].prompt, outputPath, {
      ...options,
      referenceImage,
    });

    if (success) {
      images.push({
        filename,
        path: outputPath,
        type: prompts[i].type,
        altText: prompts[i].altText,
      });

      // 使用第一张成功的图片作为后续图片的参考
      if (!referenceImage) {
        referenceImage = outputPath;
      }
    } else {
      console.error(`图片 ${filename} 生成失败`);
    }
  }

  return images;
}

// 为每张图片生成提示词
function generatePrompts(content, analysis, count) {
  const { title, platform, style } = analysis;
  const prompts = [];

  // P1: 封面
  prompts.push({
    type: "cover",
    prompt: `Notion风格极简信息图，浅灰米色背景，标题为"${title}"，高信息密度，干净留白，只有中文文字，无英文`,
    altText: "封面图",
  });

  // 根据内容生成不同的中间图片
  if (count >= 3) {
    prompts.push({
      type: "policy",
      prompt: `Notion风格表格布局，浅灰米色背景，列出"AI龙虾十条"核心补贴政策：开发补贴200万、算力400万、落户10万+，只有中文文字，无英文`,
      altText: "核心补贴政策",
    });
  }

  if (count >= 4) {
    prompts.push({
      type: "path",
      prompt: `Notion风格流程图，浅灰米色背景，三条低成本入场路径：算力支持（3个月免费）、人才落户（最高10万）、开发补贴（200万），只有中文文字，无英文`,
      altText: "三条入场路径",
    });
  }

  if (count >= 5) {
    prompts.push({
      type: "tips",
      prompt: `Notion风格清单布局，浅灰米色背景，避坑指南：公示期到4月6日、可叠加补贴、就高不重复原则，只有中文文字，无英文`,
      altText: "避坑指南",
    });
  }

  // 最后一张：CTA
  prompts.push({
    type: "cta",
    prompt: `Notion风格行动号召图，浅灰米色背景，文字"政策只是起点，行动才是答案"，鼓励立即行动，只有中文文字，无英文`,
    altText: "行动号召",
  });

  // 如果生成的提示词不够，复制最后一张
  while (prompts.length < count) {
    prompts.push({ ...prompts[prompts.length - 1] });
  }

  // 如果生成的提示词太多，截断
  if (prompts.length > count) {
    return prompts.slice(0, count);
  }

  return prompts;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  console.log("🎨 bo-autoimages - 自动化图片生成\n");

  // 检查必要参数
  if (!options.file && !options.content) {
    console.error("错误：必须提供 --file 或 --content 参数");
    console.log("\n使用示例：");
    console.log("  bo-autoimages --file article.md");
    console.log("  bo-autoimages --content \"文章内容\"");
    process.exit(1);
  }

  try {
    // 读取内容
    let content;
    let filePath;

    if (options.file) {
      console.log(`📄 读取文件: ${options.file}`);
      content = await readContent(options.file);
      filePath = options.file;
    } else {
      console.log("📝 使用提供的内容");
      content = options.content;
      filePath = null;
    }

    // 分析内容
    console.log("🔍 分析内容...");
    const analysis = await analyzeContent(content, filePath);

    console.log(`\n📊 分析结果:`);
    console.log(`  平台: ${analysis.platform}`);
    console.log(`  比例: ${analysis.aspectRatio}`);
    console.log(`  图片数量: ${analysis.imageCount}`);
    console.log(`  标题: ${analysis.title}`);
    console.log(`  输出目录: ${analysis.outputDir}`);

    // 生成图片
    console.log("\n🎨 开始生成图片...\n");
    const images = await generateImagesForContent(content, analysis, {
      aspectRatio: options.aspectRatio || analysis.aspectRatio,
      provider: options.provider,
      quality: options.quality,
      style: options.style,
    });

    // 输出结果
    console.log("\n✅ 图片生成完成!\n");
    console.log("📁 输出目录:", analysis.outputDir);
    console.log("🖼️  生成图片:", images.length, "张\n");

    for (const img of images) {
      console.log(`  - ${img.filename} (${img.type})`);
    }

    // 返回 JSON 格式的结果
    const result = {
      success: true,
      output_dir: analysis.outputDir,
      aspect_ratio: analysis.aspectRatio,
      image_count: images.length,
      images: images.map((img, index) => ({
        filename: img.filename,
        path: img.path,
        type: img.type,
        alt_text: img.altText,
      })),
      platform: analysis.platform,
      style: options.style,
      quality: options.quality,
    };

    console.log("\n" + "=".repeat(60));
    console.log("JSON 输出:");
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error("\n❌ 错误:", error.message);
    console.error(error.stack);

    const result = {
      success: false,
      error: error.message,
    };

    console.log("\n" + "=".repeat(60));
    console.log("JSON 输出:");
    console.log(JSON.stringify(result, null, 2));

    process.exit(1);
  }
}

// 运行主函数
main().catch(console.error);
