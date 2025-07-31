const fs = require('fs');
const path = require('path');

// 源目录和目标目录
const kiroDir = path.join(__dirname, '..', '.kiro');
const docsDir = path.join(__dirname, '..', 'docs');

// 递归复制目录
function copyDir(src, dest) {
  // 创建目标目录
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // 读取源目录内容
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // 递归复制子目录
      copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      // 复制文件
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 执行复制
try {
  if (fs.existsSync(kiroDir)) {
    // 读取 .kiro 目录下的所有子目录
    const entries = fs.readdirSync(kiroDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const srcPath = path.join(kiroDir, entry.name);
        const destPath = path.join(docsDir, entry.name);
        
        console.log(`正在复制 ${srcPath} 到 ${destPath}...`);
        copyDir(srcPath, destPath);
      }
    }
    
    console.log('复制完成！');
  } else {
    console.log(`源目录 ${kiroDir} 不存在，跳过复制。`);
  }
} catch (error) {
  console.error('复制失败:', error);
  process.exit(1);
}