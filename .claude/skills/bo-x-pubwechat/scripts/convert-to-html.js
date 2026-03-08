import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';

const mdFile = process.argv[2];
const mdDir = dirname(mdFile);

// Read markdown file
const mdContent = readFileSync(mdFile, 'utf-8');

// Extract title from frontmatter
const titleMatch = mdContent.match(/title:\s*(.+)/);
const title = titleMatch ? titleMatch[1].trim() : '无标题';

// Simple markdown to HTML conversion
function mdToHtml(md) {
  let html = md;

  // Remove frontmatter
  html = html.replace(/^---[\s\S]*?---\n/, '');

  // Remove image references for now (we'll handle them separately)
  const imageRefs = [];
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, path) => {
    imageRefs.push({ alt, path });
    return `<img data-src="${path}" alt="${alt}" style="max-width:100%;">`;
  });

  // Convert headings
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Convert bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Convert italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Convert lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');

  // Convert hr
  html = html.replace(/^---$/gm, '<hr>');

  // Convert paragraphs
  const lines = html.split('\n');
  let inList = false;
  let result = [];
  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (line.startsWith('<h') || line.startsWith('<li>') || line.startsWith('<hr>') || line.startsWith('<img')) {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(line);
    } else if (line.startsWith('<li>')) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(line);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }
      result.push(`<p>${line}</p>`);
    }
  }
  if (inList) result.push('</ul>');

  return { html: result.join('\n'), imageRefs };
}

const { html, imageRefs } = mdToHtml(mdContent);

console.log('Found images:', imageRefs.length);

// Process images and convert to base64
async function processImages() {
  let finalHtml = html;

  for (const img of imageRefs) {
    const imgPath = join(mdDir, img.path);
    console.log('Processing:', imgPath);

    if (existsSync(imgPath)) {
      try {
        // Convert to webp and get base64
        const webpBuffer = await sharp(imgPath).webp({ quality: 75 }).toBuffer();
        const base64 = webpBuffer.toString('base64');
        const dataUrl = `data:image/webp;base64,${base64}`;

        finalHtml = finalHtml.replace(
          `<img data-src="${img.path}" alt="${img.alt}" style="max-width:100%;">`,
          `<img src="${dataUrl}" alt="${img.alt}" style="max-width:100%;">`
        );
        console.log('Converted:', img.path);
      } catch (e) {
        console.error('Error processing:', img.path, e.message);
      }
    } else {
      console.log('Image not found:', imgPath);
    }
  }

  return finalHtml;
}

processImages().then(finalHtml => {
  // Create complete HTML
  const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${title}</title>
</head>
<body>
${finalHtml}
</body>
</html>`;

  const htmlPath = mdFile.replace('.md', '.html');
  writeFileSync(htmlPath, fullHtml, 'utf-8');
  console.log('HTML saved to:', htmlPath);
});
