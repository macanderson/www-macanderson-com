# Mac Anderson - Interactive AI Resume

An intelligent, conversational resume powered by RAG (Retrieval Augmented Generation) and dynamic React Server Components.

## Features

- **Conversational Interface**: Chat-based navigation powered by AI
- **Intent Detection**: Automatically determines whether to show interactive components or provide detailed RAG-based answers  
- **RAG Knowledge Base**: Upload documents (markdown, PDF, Word, text) to enhance the AI's knowledge
- **Dynamic Components**: Interactive timeline, education selector, and social links that render based on user intent
- **Admin Dashboard**: Secure admin panel for managing knowledge base content
- **Vector Search**: pgvector-powered semantic search for relevant context retrieval
- **Smart Suggestions**: AI-generated prompt suggestions based on conversation history
- **Theme Customization**: Dark/light mode with customizable brand colors and fonts

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Prisma
- **AI**: Vercel AI SDK with streaming responses
- **Authentication**: JWT-based auth with bcrypt
- **File Processing**: pdf-parse, mammoth for document parsing
- **UI**: shadcn/ui components with Tailwind CSS
- **Package Manager**: pnpm

## Prerequisites

- Node.js 18+ 
- PostgreSQL database with pgvector extension
- pnpm package manager
- OpenAI API key (for embeddings)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/macanderson/www-macanderson-com.git
cd www-macanderson-com

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your configuration

# Setup database and seed with super user
pnpm db:setup

# Start development server
pnpm dev
```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DB_URL="postgresql://user:password@host:5432/database?sslmode=require"
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Authentication
JWT_SECRET="your-secure-jwt-secret-key-min-32-chars"

# OpenAI (for embeddings)
OPENAI_API_KEY="sk-your-openai-api-key"

# AI Gateway (optional - for Vercel AI)
AI_GATEWAY_API_KEY="your-vercel-ai-gateway-key"

# Super User Configuration (optional)
SUPER_USER_EMAIL="mac@macanderson.com"  # Defaults to mac@macanderson.com if not set
```

## Database Setup

The project includes automated database setup scripts:

```bash
# Generate Prisma client
pnpm prisma generate

# Push schema to database
pnpm db:push

# Run database migrations
pnpm db:migrate

# Seed database with super user
pnpm db:seed

# Complete setup (generate + push + seed)
pnpm db:setup

# Reset database (dangerous - will delete all data)
pnpm db:reset
```

### Default Super User

The seed script creates a super user with the following credentials:

- **Email**: Set via `SUPER_USER_EMAIL` env var, defaults to `mac@macanderson.com`
- **Password**: `password123`

**IMPORTANT**: Change the password immediately after first login!

## Available Scripts

```bash
# Development
pnpm dev           # Start development server (localhost:3000)
pnpm build         # Build for production
pnpm start         # Start production server
pnpm lint          # Run ESLint

# Database
pnpm db:setup      # Complete database setup
pnpm db:push       # Push schema changes
pnpm db:migrate    # Run migrations
pnpm db:seed       # Seed database
pnpm db:reset      # Reset database (destructive)

# Prisma
pnpm prisma studio # Open Prisma Studio GUI
pnpm prisma generate # Generate Prisma client
```

## Project Structure

```
www-macanderson-com/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   ├── auth/         # Authentication routes
│   │   ├── chat/         # Main chat API with streaming
│   │   ├── documents/    # Document upload/management
│   │   ├── intent/       # Intent detection
│   │   ├── rag/          # RAG query endpoint
│   │   └── suggestions/  # Prompt suggestions
│   ├── admin/            # Admin pages
│   │   ├── login/       # Admin login
│   │   └── dashboard/   # Admin dashboard
│   └── page.tsx         # Main interactive resume
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── chat-interface.tsx
│   ├── work-timeline.tsx
│   ├── education-selector.tsx
│   └── personal-passions.tsx
├── lib/                  # Utility functions
│   ├── auth.ts          # Authentication utilities
│   ├── prisma.ts        # Prisma client
│   ├── vector-store.ts  # Vector embeddings
│   ├── rag.ts           # RAG retrieval logic
│   ├── intent-router.ts # Intent detection
│   └── file-processor.ts # Document parsing
├── prisma/              # Database schema and migrations
│   ├── schema.prisma    # Database schema
│   ├── seed.ts         # Database seeding script
│   └── migrations/     # Migration history
├── scripts/            # Setup scripts
│   └── 001-init-database.sql
└── public/            # Static assets
```

## Admin Dashboard

Access the admin dashboard at `/admin/login` to:

- Upload knowledge base documents (markdown, PDF, Word, text files)
- View all uploaded documents
- Manage the knowledge base
- Monitor system status

### Document Processing

Uploaded documents are automatically:

1. Parsed and extracted based on file type
2. Chunked into manageable pieces (max 1000 chars)
3. Converted to vector embeddings using OpenAI
4. Stored in PostgreSQL with pgvector for semantic search

## How It Works

### Intent Detection Flow

1. User sends a message via chat interface
2. AI analyzes the message to detect intent
3. System decides: render component OR use RAG
4. If component: Display interactive React component
5. If RAG: Retrieve relevant context and stream AI response

### RAG Pipeline

1. User query → Vector embedding (OpenAI)
2. Semantic similarity search in pgvector
3. Retrieve top 5 most relevant chunks
4. Format context and construct prompt
5. Generate response with AI model
6. Stream response back to user

## Customization

### Theme Settings

Users can customize:
- Font size (small, medium, large)
- Font family (system, serif, mono)
- Primary brand color
- Dark/light mode toggle

Settings persist in localStorage.

### Adding New Components

1. Create your React Server Component in `/components`
2. Register it in the database (ComponentRegistry table)
3. Define intent keywords for automatic detection
4. The AI will automatically render it when relevant

## Performance Optimizations

- **Caching**: Prompt suggestions cached for 5 minutes
- **Debouncing**: 500ms debounce on suggestion generation
- **Rate Limiting**: Graceful fallbacks for API limits
- **Vector Index**: IVFFlat index for fast similarity search
- **Streaming**: All AI responses stream for better UX
- **Connection Pooling**: Prisma connection pool management

## Security Features

- JWT-based authentication with httpOnly cookies
- Password hashing with bcrypt (10 rounds)
- Admin-only routes protected with middleware
- SQL injection prevention via Prisma ORM
- File type validation on uploads
- Environment variable validation
- CORS protection
- XSS prevention

## Deployment

### Vercel Deployment

1. Fork/clone the repository
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Docker Deployment

```bash
# Build Docker image
docker build -t macanderson-resume .

# Run container
docker run -p 3000:3000 \
  -e DB_URL="your-database-url" \
  -e JWT_SECRET="your-secret" \
  -e OPENAI_API_KEY="your-key" \
  macanderson-resume
```

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Verify DB_URL is correct
   - Ensure PostgreSQL has pgvector extension
   - Check network/firewall settings

2. **Prisma client errors**
   - Run `pnpm prisma generate`
   - Clear `.next` folder and rebuild

3. **Seed script fails**
   - Ensure database is accessible
   - Check SUPER_USER_EMAIL format
   - Verify pgcrypto extension is enabled

4. **OpenAI API errors**
   - Verify API key is valid
   - Check API usage limits
   - Ensure network connectivity

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Future Enhancements

- [ ] OAuth integration (Google, GitHub)
- [ ] Multi-user support with roles
- [ ] Document versioning system
- [ ] Analytics dashboard
- [ ] Export conversation history
- [ ] Voice interface
- [ ] Mobile app (React Native)
- [ ] Kubernetes deployment manifests
- [ ] GraphQL API
- [ ] Real-time collaboration

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

**Mac Anderson**
- Website: [macanderson.com](https://www.macanderson.com)
- Email: mac@macanderson.com
- GitHub: [@macanderson](https://github.com/macanderson)

## Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and AI SDK
- shadcn for the beautiful UI components
- OpenAI for embeddings API
- PostgreSQL and pgvector teams