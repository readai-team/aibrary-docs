# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a turborepo monorepo for the Aibrary project, a book reading AI platform. The system consists of multiple applications including a CMS (Strapi), assistant interface (Next.js), and various other services organized as a monorepo using Turbo and pnpm workspaces.

## Architecture

The project follows a multi-tier architecture with:

- **Apps Layer**: Frontend applications (CMS, Assistant, Mobile, Web)
- **Service Layer**: API services and backend containers
- **Storage Layer**: MySQL, Redis cache, S3 object storage

Key applications:

- `apps/cms`: Strapi CMS for content management
- `apps/assistant`: Next.js AI assistant interface
- `apps/agent`: Mastra-based AI agent
- `packages/`: Shared packages and providers

## Development Commands

### Root Level Commands

```bash
# Install dependencies
pnpm install

# Build all packages
turbo build

# Development mode
turbo dev

# Lint all packages
turbo lint

# Lint with Biome (faster alternative)
turbo lint:biome

# Format code with Biome
turbo format

# Check formatting (dry run)
turbo format:check

# Type checking
turbo check-types

# Clean all node_modules
find . -name 'node_modules' -type d -exec rm -rf {} +
```

### Git Workflow Commands

```bash
# Interactive commit with commitizen
pnpm commit

# Manual commit (will trigger hooks)
git commit -m "feat: add new feature"

# Check commit message format
npx commitlint --from HEAD~1 --to HEAD --verbose

# Run lint-staged manually
npx lint-staged
```

### Commit Message Convention

We use [Conventional Commits](https://conventionalcommits.org/) with the following format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or external dependencies
- `ci`: CI/CD changes
- `chore`: Other changes (maintenance, etc.)

**Scopes:**

- `cms`, `assistant`, `agent`, `portal`, `reader`
- `packages`, `provider-s3`, `provider-ses`
- `config`, `deps`, `monorepo`, `docs`, `ci`

**Examples:**

```bash
feat(cms): add book recommendation engine
fix(assistant): resolve chat message formatting issue
docs(monorepo): update development setup guide
chore(deps): update dependencies to latest versions
```

### Application-Specific Commands

#### CMS (Strapi)

```bash
cd apps/cms

# Development
pnpm dev

# Build
pnpm build

# Production start
pnpm start

# Seed data
pnpm seed:book
pnpm seed:example

# Content type generation
pnpm gen:content-types

# Data transfer
pnpm transfer
```

#### Assistant (Next.js)

```bash
cd apps/assistant

# Development
pnpm dev

# Build
pnpm build

# Start production
pnpm start

# Lint
pnpm lint
```

#### Agent

```bash
cd apps/agent

# Development
pnpm dev

# Build
pnpm build
```

### Package Development

```bash
# For shared packages in packages/
cd packages/[package-name]

# Build package
pnpm build

# Development with watch
pnpm dev
```

## Technology Stack

- **Package Manager**: pnpm with workspaces
- **Build System**: Turbo (turborepo)
- **Code Quality**: Biome (fast formatter/linter), ESLint, Prettier
- **Git Workflow**: Husky, lint-staged, commitlint, commitizen
- **CMS**: Strapi 5.15.1
- **Frontend**: Next.js 15.3.2, React 19
- **AI Integration**: Vercel AI SDK, Assistant UI
- **Database**: MySQL, PostgreSQL, Redis
- **Cloud Services**: AWS S3, SES
- **Languages**: TypeScript, JavaScript

## Key Directories

- `apps/`: All applications
  - `cms/`: Strapi CMS with custom configurations
  - `assistant/`: AI chat interface
  - `agent/`: AI agent service
  - `backup/`: Legacy applications
  - `playground/`: Development sandbox
- `packages/`: Shared packages
  - `provider-upload-aws-s3/`: Custom S3 upload provider
  - `provider-email-amazon-ses/`: SES email provider
  - `tsconfig/`: Shared TypeScript configurations
- `.kiro/`: Architecture and technical documentation

## Database & External Services

- **Primary Database**: MySQL for CMS and application data
- **Cache**: Redis for application caching
- **File Storage**: AWS S3 for media files
- **Email**: AWS SES for transactional emails
- **Message Queue**: Kafka for event processing

## Docker Support

Most applications include Dockerfiles:

- `apps/cms/Dockerfile.turborepo`: CMS container
- `apps/assistant/Dockerfile`: Assistant interface
- `apps/agent/Dockerfile`: Agent service

## Environment Configuration

Applications use environment-specific configs:

- `.env.production` for production settings
- Individual app configs in respective directories

## Testing

Each application may have its own testing setup. Check individual `package.json` files for test scripts.

## Strapi Development Guidelines

### Custom Routes

When adding custom routes to Strapi APIs:

- Keep the default router file (e.g., `routes/[api-name].ts`) unchanged with only the factory export
- Create a separate `routes/custom.ts` file for custom routes
- This approach avoids TypeScript issues and keeps the code organized

Example:

```typescript
// routes/user-external-profile.ts
export default factories.createCoreRouter('api::user-external-profile.user-external-profile');

// routes/custom.ts
export default {
  routes: [
    {
      method: 'POST',
      path: '/user-external-profiles/create-or-update',
      handler: 'user-external-profile.createOrUpdate',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
```

### Service Best Practices (Strapi v5)

Use the Document Service API (`strapi.documents`) instead of the Query Engine (`strapi.db.query`):

```typescript
// ❌ Old way (Query Engine)
const result = await strapi.db.query('api::content-type.content-type').findOne({
  where: { field: value },
});

// ✅ New way (Document Service API)
const results = await strapi.documents('api::content-type.content-type').findMany({
  filters: { field: value },
  limit: 1,
});

// Update using documentId
await strapi.documents('api::content-type.content-type').update({
  documentId: results[0].documentId,
  data: { field: newValue },
});

// Create
await strapi.documents('api::content-type.content-type').create({
  data: { field: value },
});
```

Key differences:

- Use `filters` instead of `where`
- Use `documentId` instead of `id` for updates
- `findMany` returns an array even with `limit: 1`
- Better TypeScript support and consistent API

### Controller and Service Architecture

Follow proper separation of concerns between controllers and services:

**Controllers** should handle:

- HTTP request/response handling
- User authentication checks
- Request data validation
- Calling appropriate service methods
- Setting response status codes

**Services** should handle:

- Business logic implementation
- Database operations
- Integration with external services
- Data processing and transformation
- Internal method calls
- Error handling and logging

**Important**: Controllers should NOT use try-catch blocks because Strapi has global error middleware that handles exceptions. Simply throw errors or return appropriate responses.

**Error Handling Best Practices**:

- Use `@strapi/utils` errors instead of generic JavaScript errors
- Common error types:
  - `errors.ValidationError` - for validation failures
  - `errors.ApplicationError` - for application-specific errors
  - `errors.NotFoundError` - when resources are not found
  - `errors.ForbiddenError` - for permission issues
  - `errors.UnauthorizedError` - for authentication issues

Example:

```typescript
// ❌ Bad: Business logic in controller + unnecessary try-catch
export default factories.createCoreController('api::user-external-profile.user-external-profile', ({ strapi }) => ({
  async syncExternalProfile(ctx) {
    try {
      // Authentication, validation, AND business logic all mixed together
      const authUser = ctx.state.user;
      const externalProfile = await unipileService.getSocialProfileByUrl(url);
      await strapi.documents('api::user-external-profile.user-external-profile').create({...});
    } catch (error) {
      // Unnecessary - Strapi handles this
      return ctx.badRequest(error.message);
    }
  }
}));

// ✅ Good: Proper separation + no try-catch in controller
// Controller
export default factories.createCoreController('api::user-external-profile.user-external-profile', ({ strapi }) => ({
  async syncExternalProfile(ctx) {
    const authUser = ctx.state.user;
    if (!authUser) {
      return ctx.unauthorized();
    }

    const { body = {} as any } = ctx.request;

    if (!body.data || typeof body.data !== 'object') {
      throw new errors.ValidationError('Missing "data" payload in the request body');
    }

    const { provider, publicIdentifier, publicProfileURL } = body.data;

    await strapi.service('api::user-external-profile.user-external-profile').syncProfile({
      userId: authUser.id,
      provider,
      publicIdentifier,
      publicProfileURL,
    });

    ctx.status = 204;
  }
}));

// Service
export default factories.createCoreService('api::user-external-profile.user-external-profile', ({ strapi }) => ({
  async syncProfile({ userId, provider, publicIdentifier, publicProfileURL }) {
    try {
      // All business logic here with proper error handling
      const unipileService = strapi.service('api::common.unipile');
      const externalProfile = await unipileService.getSocialProfileByUrl(publicProfileURL);

      return await this.createOrUpdate({
        userId,
        provider: externalProfile.provider.toLowerCase(),
        profile: externalProfile,
      });
    } catch (error) {
      strapi.log.error('Error in syncProfile service:', error);
      throw error;
    }
  }
}));
```

## File Creation Best Practices

### Avoiding Encoding Issues with Markdown Files

When creating files with Chinese content, avoid using the `Write` tool directly as it may cause encoding issues. Instead, use one of these methods:

1. **Use Bash commands with proper UTF-8 handling**:

   ```bash
   # Method 1: Using cat with heredoc
   cat > file.md << 'EOF'
   内容
   EOF

   # Method 2: Using echo
   echo '内容' > file.md
   ```

2. **Create empty file first, then use Edit tool**:

   ```bash
   touch file.md
   # Then use Edit tool to add content
   ```

3. **For large documents, write in segments** to avoid encoding issues

This approach ensures proper UTF-8 encoding for files containing Chinese characters.

## Other

- 使用中文回复
- 使用中文注释
- Error 的 message 使用 English
