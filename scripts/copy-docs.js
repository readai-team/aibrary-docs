#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '../../../');
const docsTargetDir = path.resolve(__dirname, '../docs');

const docSources = [
  {
    source: 'CLAUDE.md',
    target: 'development/claude-guidelines.md',
  },
  {
    source: 'common/docs',
    target: 'architecture',
    isDirectory: true,
  },
  {
    source: 'apps/cms/README.md',
    target: 'apps/cms.md',
  },
  {
    source: 'apps/assistant/README.md',
    target: 'apps/assistant.md',
  },
  {
    source: 'apps/agent/README.md',
    target: 'apps/agent.md',
  },
  {
    source: 'packages/provider-upload-aws-s3/README.md',
    target: 'packages/provider-upload-aws-s3.md',
  },
  {
    source: 'packages/provider-email-amazon-ses/README.md',
    target: 'packages/provider-email-amazon-ses.md',
  },
];

function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

function copyFile(source, target) {
  try {
    if (fs.existsSync(source)) {
      ensureDirectoryExists(target);
      fs.copyFileSync(source, target);
      console.log(`✓ Copied: ${source} → ${target}`);
    } else {
      console.log(`⚠ Skipped (not found): ${source}`);
    }
  } catch (error) {
    console.error(`✗ Error copying ${source}: ${error.message}`);
  }
}

function copyDirectory(source, target) {
  try {
    if (fs.existsSync(source)) {
      ensureDirectoryExists(target);

      const files = fs.readdirSync(source);
      files.forEach(file => {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);

        const stat = fs.statSync(sourcePath);
        if (stat.isDirectory()) {
          copyDirectory(sourcePath, targetPath);
        } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
          copyFile(sourcePath, targetPath);
        }
      });
    } else {
      console.log(`⚠ Skipped directory (not found): ${source}`);
    }
  } catch (error) {
    console.error(`✗ Error copying directory ${source}: ${error.message}`);
  }
}

function findMarkdownFiles() {
  console.log('🔍 Searching for additional markdown files...');

  try {
    const gitFiles = execSync('git ls-files "*.md" "*.mdx"', {
      cwd: rootDir,
      encoding: 'utf-8',
    })
      .trim()
      .split('\n');

    const additionalFiles = gitFiles.filter(file => {
      const isInDocsApp = file.startsWith('apps/docs/');
      const isInNodeModules = file.includes('node_modules/');
      const isInBackup = file.includes('backup/');
      const isInPlayground = file.includes('playground/');
      const isAlreadyCovered = docSources.some(
        source => file === source.source || (source.isDirectory && file.startsWith(source.source + '/')),
      );

      return !isInDocsApp && !isInNodeModules && !isInBackup && !isInPlayground && !isAlreadyCovered;
    });

    return additionalFiles;
  } catch (error) {
    console.error('Error finding markdown files:', error.message);
    return [];
  }
}

function main() {
  console.log('📄 Starting documentation copy process...\n');

  docSources.forEach(({ source, target, isDirectory }) => {
    const sourcePath = path.join(rootDir, source);
    const targetPath = path.join(docsTargetDir, target);

    if (isDirectory) {
      copyDirectory(sourcePath, targetPath);
    } else {
      copyFile(sourcePath, targetPath);
    }
  });

  const additionalFiles = findMarkdownFiles();
  if (additionalFiles.length > 0) {
    console.log(`\n📋 Found ${additionalFiles.length} additional markdown files`);

    additionalFiles.forEach(file => {
      const sourcePath = path.join(rootDir, file);
      const targetFileName = file.replace(/\//g, '-');
      const targetPath = path.join(docsTargetDir, 'auto-collected', targetFileName);
      copyFile(sourcePath, targetPath);
    });
  }

  console.log('\n✅ Documentation copy completed!');
}

main();
