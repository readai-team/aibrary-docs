# syntax=docker.io/docker/dockerfile:1

FROM node:22-alpine AS base
# 启用 corepack 以支持 pnpm
RUN corepack enable

# 1. 依赖安装阶段
FROM base AS deps
# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 只复制依赖相关文件
COPY package.json pnpm-lock.yaml* .npmrc* ./
# 使用 frozen-lockfile 确保依赖版本一致性
RUN pnpm install --frozen-lockfile

# 2. 构建阶段
FROM base AS builder
WORKDIR /app

# 复制已安装的依赖
COPY --from=deps /app/node_modules ./node_modules
# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 3. 生产镜像
FROM node:22-alpine AS runner
WORKDIR /app

# 创建非 root 用户和组
RUN addgroup -g 1001 -S nodejs && \
    adduser -S www -u 1001

# 使用 npm 安装 serve（pnpm 不适合全局安装）
RUN npm install -g serve

# 复制构建产物并设置正确的权限
COPY --from=builder --chown=www:nodejs /app/build ./

# 切换到非 root 用户
USER www

EXPOSE 3000

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 使用数组形式的 CMD 以避免 shell 解析
CMD ["serve", ".", "-p", "3000"]