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
- **Database**: Neon Postgres with pgvector extension
- **ORM**: Prisma
- **AI**: Vercel AI SDK with streaming responses
- **Authentication**: JWT-based auth with bcrypt
- **File Processing**: pdf-parse, mammoth for document parsing
- **UI**: shadcn/ui components with Tailwind CSS

## Setup Instructions

### 1. Environment Variables

Create a `.env` file with the following:

```env
# Database
DATABASE_URL="your-neon-postgres-connection-string"

# Authentication
JWT_SECRET="your-secure-jwt-secret-key"

# OpenAI (for embeddings)
OPENAI_API_KEY="your-openai-api-key"
```

### 2. Database Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run initialization script (creates admin user and default components)
# Execute scripts/001-init-database.sql in your Neon dashboard
```

### 3. Default Admin Credentials

- **Email**: admin@macanderson.com
- **Password**: admin123

**IMPORTANT**: Change these credentials immediately after first login!

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the interactive resume. To login as an admin, use http://localhost:3000/admin/login. Make sure a user with a matching email and password is created in the database first.

## Admin Dashboard

Access the admin dashboard at `/admin/login` to:

- Upload knowledge base documents (markdown, PDF, Word, text files)
- View all uploaded documents
- Manage the knowledge base

Uploaded documents are automatically:

1. Parsed and extracted
2. Chunked into manageable pieces
3. Converted to vector embeddings
4. Stored in the database for semantic search

## Component Registry

The system includes a component registry that maps user intents to React Server Components:

- **work-timeline**: Career history and work experience
- **education-selector**: Undergraduate and graduate education
- **social-links**: Personal interests and social media

### Adding New Components

1. Create your React Server Component
2. Add an entry to the `ComponentRegistry` table via the database
3. The AI will automatically detect when to render it based on intent keywords

## How It Works

### Intent Detection Flow

1. User sends a message
2. AI analyzes the message to detect intent
3. System decides: render component OR use RAG
4. If component: Display interactive widget
5. If RAG: Retrieve relevant context from knowledge base and stream AI response

### RAG Pipeline

1. User query is converted to vector embedding
2. Semantic search finds similar document chunks
3. Top 5 most relevant chunks are retrieved
4. Context is formatted and added to AI prompt
5. AI generates response using retrieved context
6. Response is streamed back to user

## Customization

### Theme Settings

Users can customize:
- Font size
- Font family
- Primary brand color
- Dark/light mode

Settings are persisted in localStorage.

### Prompt Suggestions

The system generates smart follow-up prompts based on:
- Last 10 user prompts
- Current conversation context
- Unexplored areas of Mac's background

Suggestions are cached for 5 minutes to reduce API calls.

## Architecture

```
app/
├── api/
│   ├── auth/          # Authentication endpoints
│   ├── chat/          # Main chat API with streaming
│   ├── documents/     # Document upload and management
│   ├── intent/        # Intent detection
│   ├── rag/           # RAG query endpoint
│   └── suggestions/   # Prompt suggestions
├── admin/
│   ├── login/         # Admin login page
│   └── dashboard/     # Admin dashboard
└── page.tsx           # Main interactive resume

components/
├── chat-interface.tsx      # Main chat UI
├── work-timeline.tsx       # Career timeline component
├── education-selector.tsx  # Education component
├── social-links.tsx        # Social media component
└── settings-drawer.tsx     # Theme settings

lib/
├── prisma.ts          # Prisma client
├── auth.ts            # Authentication utilities
├── vector-store.ts    # Vector embeddings and search
├── rag.ts             # RAG retrieval logic
├── intent-router.ts   # Intent detection system
└── file-processor.ts  # Document parsing
```

## Performance Optimizations

- **Caching**: Prompt suggestions cached for 5 minutes
- **Debouncing**: 500ms debounce on suggestion generation
- **Rate Limit Handling**: Contextual fallbacks when AI Gateway is rate limited
- **Vector Indexing**: IVFFlat index on embeddings for fast similarity search
- **Streaming**: All AI responses stream for better UX

## Security

- JWT-based authentication with httpOnly cookies
- Password hashing with bcrypt
- Admin-only routes protected with middleware
- SQL injection prevention via Prisma
- File type validation on uploads

## Future Enhancements

- OAuth integration for admin login
- Multi-user support with roles
- Document versioning
- Analytics dashboard
- Export conversation history
- Mobile app with React Native

## License

MIT
```
