# سیستم حسابداری تپور

## Overview

This is a full-stack Persian accounting application called "تپور" (Tapor) built with modern web technologies. The application provides comprehensive accounting features including inventory management, customer management, invoice generation, and reporting - all designed with Persian language support and RTL (right-to-left) layout.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React.js with TypeScript
- **Styling**: Tailwind CSS with custom RTL configuration
- **UI Components**: Radix UI with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Font**: Vazirmatn (Persian font) loaded from Google Fonts

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon serverless)
- **API Design**: RESTful endpoints under `/api/*`
- **Session Management**: Express sessions with PostgreSQL store

### Build System
- **Frontend Bundler**: Vite with React plugin
- **Backend Bundler**: esbuild for production builds
- **Development**: tsx for TypeScript execution
- **CSS Processing**: PostCSS with Tailwind and Autoprefixer

## Key Components

### Database Schema
The application uses a well-structured PostgreSQL schema with the following main entities:
- **Users**: Basic user management
- **Customers**: Customer information with Persian fields
- **Products**: Inventory items with pricing and stock tracking
- **Invoices**: Both regular invoices and pre-invoices with comprehensive metadata
- **Invoice Items**: Line items for invoices with product relationships

### Authentication & Authorization
- Session-based authentication using connect-pg-simple
- User management with encrypted passwords
- Protected API routes with middleware

### Business Logic Features
1. **Inventory Management**: Product CRUD with low stock alerts
2. **Customer Management**: Full customer lifecycle with search capabilities
3. **Invoice System**: Dual invoice types (invoice/pre-invoice) with automatic numbering
4. **Discount System**: Both percentage and fixed amount discounts
5. **Stock Management**: Automatic inventory updates on invoice confirmation
6. **Reporting**: Comprehensive dashboard with sales analytics

### Persian Localization
- Complete RTL layout support
- Persian date handling (Jalali calendar approximation)
- Persian number formatting and conversion
- Persian font integration (Vazirmatn)
- All UI text in Persian language

## Data Flow

### Client-Server Communication
1. **API Layer**: RESTful endpoints with standardized error handling
2. **Query Management**: TanStack Query for caching and synchronization
3. **Form Validation**: Client-side validation with Zod schemas
4. **Real-time Updates**: Optimistic updates with query invalidation

### Database Operations
1. **ORM**: Drizzle provides type-safe database operations
2. **Migrations**: Schema management through Drizzle Kit
3. **Connection Pooling**: Neon serverless PostgreSQL with connection pooling
4. **Transactions**: Atomic operations for complex business logic

### State Management
1. **Server State**: TanStack Query for API data
2. **Form State**: React Hook Form for form management
3. **UI State**: React local state for component interactions
4. **Global State**: Minimal global state, primarily server-driven

## External Dependencies

### Core Technologies
- **React Ecosystem**: React 18 with hooks and modern patterns
- **Database**: PostgreSQL via Neon serverless platform
- **UI Framework**: Radix UI primitives with custom styling
- **Validation**: Zod for runtime type checking and validation

### Development Tools
- **Build Tools**: Vite, esbuild, TypeScript compiler
- **Code Quality**: ESLint-compatible setup (implied)
- **Development Experience**: Hot module replacement, error overlays

### Production Dependencies
- **Date Handling**: date-fns for date manipulations
- **Excel Export**: SheetJS (xlsx) for report generation
- **PDF Generation**: Browser-based PDF generation
- **Styling**: class-variance-authority for component variants

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds optimized React application to `dist/public`
2. **Backend**: esbuild bundles Node.js application to `dist/index.js`
3. **Assets**: Static assets served from build directory
4. **Environment**: Production/development environment detection

### Database Setup
1. **Schema Management**: Drizzle migrations for database versioning
2. **Connection**: Environment-based DATABASE_URL configuration
3. **Pooling**: Neon serverless handles connection management automatically

### Hosting Considerations
- **Server**: Node.js application server with Express
- **Database**: Neon PostgreSQL serverless (production ready)
- **Static Files**: Vite-optimized assets with proper caching headers
- **Environment Variables**: DATABASE_URL required for database connection

### Development vs Production
- **Development**: Vite dev server with HMR and development tools
- **Production**: Optimized bundles with minification and compression
- **Database**: Same PostgreSQL setup for both environments
- **Monitoring**: Custom logging middleware for API request tracking

The application is designed to be deployment-ready on platforms like Replit, Vercel, or any Node.js hosting service with PostgreSQL database support.