/**
 * 路径验证工具 - 确保文件操作使用正确的路径
 * 使用方法：在技能脚本开头调用 validatePath(path) 或 getCorrectPath(type)
 */

const fs = require('fs');
const path = require('path');

// 加载路径配置
const CONFIG_PATH = path.join(__dirname, '..', 'config', 'paths.json');
let config = null;

try {
  const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
  config = JSON.parse(configContent);
} catch (error) {
  console.error('无法加载路径配置文件:', error.message);
  console.error('配置文件路径:', CONFIG_PATH);
}

/**
 * 验证路径是否正确，返回修正后的路径
 * @param {string} inputPath - 输入的路径
 * @returns {string} - 修正后的路径
 */
function validatePath(inputPath) {
  if (!inputPath) return inputPath;

  // 检测常见问题：路径中包含重复的目录名
  const segments = inputPath.split(/[\\/]/);
  const uniqueSegments = [];

  for (let i = 0; i < segments.length; i++) {
    // 跳过空段
    if (!segments[i]) continue;

    // 检查是否与前面连续重复（如 "内容工厂/03-内容工厂"）
    if (i > 0 && segments[i].includes(segments[i-1]) && segments[i] !== segments[i-1]) {
      // 发现重复模式，只保留标准的 "03-内容工厂"
      continue;
    }

    uniqueSegments.push(segments[i]);
  }

  return uniqueSegments.join('/');
}

/**
 * 获取正确的路径配置
 * @param {string} type - 路径类型，如 'factory.final', 'image_text.xiaohongshu'
 * @returns {string} - 正确的路径
 */
function getCorrectPath(type) {
  if (!config) {
    console.error('路径配置未加载');
    return null;
  }

  const parts = type.split('.');
  let current = config.content_factory;

  for (const part of parts) {
    if (current[part] === undefined) {
      console.error(`路径类型 "${type}" 不存在，检查点: ${part}`);
      return null;
    }
    current = current[part];
  }

  // 构建完整路径
  const baseDir = config.base_dir.replace(/\\/g, '/');
  const relativePath = current.replace(/\\/g, '/');

  return `${baseDir}/${relativePath}`;
}

/**
 * 检查路径是否存在常见错误
 * @param {string} path - 要检查的路径
 * @returns {object} - 检查结果 { isValid: boolean, errors: array, suggestedPath: string }
 */
function checkPath(path) {
  const errors = [];

  // 检查1：路径为空
  if (!path || path.trim() === '') {
    errors.push('路径为空');
    return { isValid: false, errors, suggestedPath: null };
  }

  // 检查2：重复目录名（如 "内容工厂/03-内容工厂"）
  const normalizedPath = path.replace(/\\/g, '/');
  if (normalizedPath.includes('内容工厂/') && normalizedPath.includes('03-内容工厂')) {
    errors.push('路径包含重复目录名（内容工厂/03-内容工厂）');
  }

  // 检查3：使用了错误的基础路径
  if (normalizedPath.startsWith('内容工厂/')) {
    errors.push('路径使用了错误的根目录（内容工厂/），应使用 03-内容工厂/');
  }

  // 生成建议路径
  let suggestedPath = normalizedPath;
  if (errors.length > 0) {
    // 修复重复目录名问题
    suggestedPath = suggestedPath.replace(/内容工厂\//g, '');
    // 确保使用正确的根目录
    if (!suggestedPath.startsWith('03-')) {
      suggestedPath = '03-内容工厂/' + suggestedPath;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    suggestedPath: suggestedPath !== normalizedPath ? suggestedPath : null
  };
}

// 导出模块
module.exports = {
  validatePath,
  getCorrectPath,
  checkPath,
  config
};

// 如果直接运行此脚本，执行测试
if (require.main === module) {
  console.log('路径验证工具测试\n');

  // 测试用例
  const testCases = [
    '内容工厂/03-内容工厂/3-终稿发布区/test.md',
    '03-内容工厂/3-终稿发布区/test.md',
    '内容工厂/test.md',
    '正确的路径/没有任何问题.md'
  ];

  for (const testPath of testCases) {
    console.log(`测试路径: ${testPath}`);
    const result = checkPath(testPath);
    console.log(`  是否有效: ${result.isValid}`);
    if (result.errors.length > 0) {
      console.log(`  错误: ${result.errors.join(', ')}`);
    }
    if (result.suggestedPath) {
      console.log(`  建议路径: ${result.suggestedPath}`);
    }
    console.log('');
  }

  // 测试路径配置
  console.log('\n路径配置测试:');
  if (config) {
    console.log('基础路径:', config.base_dir);
    console.log('终稿发布区:', getCorrectPath('factory.final'));
    console.log('小红书:', getCorrectPath('image_text.xiaohongshu'));
  } else {
    console.error('配置未加载');
  }
}
