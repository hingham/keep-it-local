<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# The Local Board - Project Instructions

This is a Next.js project built with TypeScript, React, and Vercel Postgres database. The project supports local businesses and communities through technology.

## Tech Stack
- **Frontend**: Next.js 15 with App Router, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Vercel Postgres
- **Deployment**: Vercel

## Project Structure
- `src/app/` - App Router pages and layouts
- `src/app/api/` - API routes
- `src/app/api/health/route.ts` - Health check endpoint
- `src/app/api/events/route.ts` - Events CRUD operations
- `src/app/api/services/route.ts` - Services CRUD operations
- `src/app/api/setup/route.ts` - Database initialization

## Development Guidelines
- Use TypeScript for all new files
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling
- Create API routes in the `src/app/api/` directory
- Use Vercel Postgres for database operations
- Ensure responsive design for mobile and desktop

## API Routes
- Health check: `/api/health` - Returns API status
- Events: `/api/events` - GET all events, POST to create
- Services: `/api/services` - GET all services, POST to create
- Setup: `/api/setup` - Database initialization and connection test

## Database Schema
- **events**: date, recurring (boolean), date_list (array), title, time, location, categories (enum: family, music, festival)
- **services**: title, owner, description

## Database
- Use `@vercel/postgres` for database connections
- Configure environment variables in `.env.local` (see `.env.example`)

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
