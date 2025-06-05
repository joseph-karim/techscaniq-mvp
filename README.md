[![CodeGuide](/codeguide-backdrop.svg)](https://codeguide.dev)

# CodeGuide Vite + Supabase Starter

A modern web application starter template built with Vite and React, featuring a beautiful UI and Supabase integration.

## Tech Stack

- **Framework:** [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- **Database:** [Supabase](https://supabase.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Data Management:** [TanStack Query](https://tanstack.com/query)
- **Form Handling:** [React Hook Form](https://react-hook-form.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Validation:** [Zod](https://zod.dev/)

## Prerequisites

Before you begin, ensure you have the following:

- Node.js 18+ installed
- A [Supabase](https://supabase.com/) account for database
- Generated project documents from [CodeGuide](https://codeguide.dev/) for best development experience

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd techscaniq-mvp
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Variables Setup**

   - Copy the `.env.example` file to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```

4. **Quick Setup (Recommended)**

   ```bash
   # Run automated setup script
   npm run setup
   ```

   Or manually:

   ```bash
   # Recommended: Start on port 5173 (default)
   npm run dev
   
   # Alternative: Start on port 3000  
   npm run dev:3000
   ```

   📖 **Important:** See [Development Setup Guide](docs/development-setup.md) for detailed CORS configuration and troubleshooting.

5. **Open [http://localhost:5173](http://localhost:5173) with your browser to see the result.**

## Development Commands

```bash
npm run dev          # Start development server on port 5173
npm run dev:3000     # Start development server on port 3000
npm run build        # Build for production
npm run preview      # Preview production build
npm run setup        # Run automated development setup
npm run cors-help    # Show CORS configuration instructions
```

## Documentation

- **[Development Setup](docs/development-setup.md)** - Complete guide for local development and CORS configuration
- **[CORS Troubleshooting](docs/cors-troubleshooting.md)** - Quick reference for resolving CORS issues
- **[Setup Guide](docs/setup-guide.md)** - Additional setup instructions

## Configuration

### Supabase Setup

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Go to Project Settings > API
4. Copy the `Project URL` as `VITE_SUPABASE_URL`
5. Copy the `anon` public key as `VITE_SUPABASE_ANON_KEY`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Features

- 📦 Supabase Database Integration
- 🎨 Modern UI with Tailwind CSS and Radix UI
- 🚀 Fast Development with Vite
- 🔄 Data Fetching with TanStack Query
- 📱 Responsive Design
- 🎭 Beautiful Animations with Framer Motion
- 📝 Type-Safe Forms with React Hook Form and Zod

## Project Structure

```
codeguide-vite-supabase/
├── src/                # Source files
│   ├── components/    # React components
│   ├── lib/          # Utility functions
│   ├── hooks/        # Custom hooks
│   └── types/        # TypeScript types
├── public/            # Static assets
└── documentation/     # Generated documentation from CodeGuide
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Documentation Setup

To implement the generated documentation from CodeGuide:

1. Create a `documentation` folder in the root directory:

   ```bash
   mkdir documentation
   ```

2. Place all generated markdown files from CodeGuide in this directory:

   ```bash
   # Example structure
   documentation/
   ├── project_requirements_document.md
   ├── app_flow_document.md
   ├── frontend_guideline_document.md
   └── backend_structure_document.md
   ```

3. These documentation files will be automatically tracked by git and can be used as a reference for your project's features and implementation details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
