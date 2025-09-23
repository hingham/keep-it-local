# The Local Board

A Next.js project built with TypeScript, React, and Vercel Postgres database. This project supports local businesses and communities through technology.

## Tech Stack

- **Frontend**: Next.js 15 with App Router, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Vercel Postgres
- **Deployment**: Vercel

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Vercel Postgres database credentials in `.env.local`

3. **Set up your database schema:**
   ```bash
   # Option 1: Use the API endpoint (recommended)
   curl -X POST http://localhost:3001/api/setup
   
   # Option 2: Run SQL directly in Vercel Postgres dashboard
   # Copy and paste the contents of sql/001_initial_schema.sql
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/
│   ├── api/          # API routes
│   │   └── health/   # Health check endpoint
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
└── ...
```

## API Routes

- **Health Check**: `GET /api/health` - Returns API status and timestamp
- **Database Setup**: `POST /api/setup` - Initialize database schema
- **Database Test**: `GET /api/setup` - Test database connection
- **Events**: `GET /api/events` - Get all events
- **Create Event**: `POST /api/events` - Create a new event
- **Services**: `GET /api/services` - Get all services
- **Create Service**: `POST /api/services` - Create a new service

## Database Setup

This project uses Vercel Postgres. Here's how to set it up:

### 1. Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or select your existing project
3. Go to the **Storage** tab
4. Click **Create Database** and select **Postgres**
5. Follow the setup instructions

### 2. Get Database Credentials

1. In your Vercel dashboard, go to your database
2. Click on **Settings** tab
3. Copy the environment variables
4. Paste them into your `.env.local` file

### 3. Initialize Database Schema

**Option 1: Using the API endpoint (Recommended)**
```bash
# Start your dev server first
npm run dev

# Then initialize the schema
curl -X POST http://localhost:3001/api/setup
```

**Option 2: Using Vercel Dashboard**
1. Go to your Vercel Postgres dashboard
2. Click on **Query** tab
3. Copy and paste the contents of `sql/001_initial_schema.sql`
4. Execute the query

**Option 3: Using Vercel CLI**
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Run the SQL file
vercel env pull .env.local
psql $POSTGRES_URL -f sql/001_initial_schema.sql
```

### 4. Verify Setup

Test your database connection:
```bash
curl http://localhost:3001/api/setup
```

You should see a successful connection response.

### Database Schema

The database includes these tables:
- **events**: Community events with categories (family, music, festival), dates, and locations
- **services**: Local services offered by community members

Sample API calls:
```bash
# Get all events
curl http://localhost:3001/api/events

# Create a new event
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-09-15", "title": "Community BBQ", "time": "17:00", "location": "City Park", "categories": ["family"]}'

# Get all services
curl http://localhost:3001/api/services

# Create a new service
curl -X POST http://localhost:3001/api/services \
  -H "Content-Type: application/json" \
  -d '{"title": "Lawn Care", "owner": "John Doe", "description": "Professional lawn mowing and landscaping"}'
```

## Development

- Edit pages in `src/app/`
- Add API routes in `src/app/api/`
- Use TypeScript for all new files
- Follow Next.js App Router conventions
- Use Tailwind CSS for styling

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [React Documentation](https://react.dev) - learn about React
- [TypeScript Documentation](https://www.typescriptlang.org/docs) - learn about TypeScript
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn about Tailwind CSS
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres) - learn about Vercel Postgres

## Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Feature to Build out
[] Add image upload for users. Upload image to cloudinary? Offer users option to upload two images.
[] Update reoccurring on form to allow users to enter in multiple dates
[] Add way for user to see macro-neighborhood events as well. Add option for users to publish to the macro-neighborhood page somehow when they upload their event.
[] Add way to select macro neighborhood then the neighborhood under that when adding document


Almost ready to deploy:
- need tofor make sure vercel datastore and image store will work in prod
- update form to accept filter by macro neighborhood
- update the display for singular event / service
- filter for events that are verified
- 
The app is just lacking DRY standards. 
Need to focus on creating function to fetch neighborhood since that is repeated. Or just update the API to not return an array...
And fix all the errors from replacing "name" with "id"