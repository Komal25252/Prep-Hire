<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Next.js Project Setup

This workspace contains a Next.js application.

### Project Configuration
- **Framework**: Next.js 16.1.6 with Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Linting**: ESLint
- **Router**: App Router
- **Directory Structure**: Uses `src/` directory

### Getting Started

#### Development
To start the development server, run:
```bash
npm run dev
```
The application will be available at [http://localhost:3000](http://localhost:3000).

You can also use the VS Code task "Next.js Dev Server" (Tasks > Run Task).

#### Building
To create a production build:
```bash
npm run build
```

#### Type Checking
TypeScript types are automatically generated from the Next.js routes.

### Project Structure
- `src/` - Application source code
- `public/` - Static assets
- `src/app/` - App Router pages and API routes
- `.next/` - Build output (generated)

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
