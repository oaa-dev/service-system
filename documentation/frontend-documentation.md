# Frontend Documentation

This document provides setup instructions and guidelines for the Next.js frontend application.

## Project Setup

### 1. Create Next.js Application

```bash
npx create-next-app@latest
```

Follow the prompts:
- Project name: `my-next-app`
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: No
- App Router: Yes
- Import alias: `@/*`

### 2. Initialize Shadcn/UI

Shadcn/UI provides beautifully designed components built with Radix UI and Tailwind CSS.

```bash
npx shadcn-ui@latest init
```

Configuration options:
- Style: Default
- Base color: Slate (or your preference)
- CSS variables: Yes

### 3. Install All Shadcn Components

Install the complete Shadcn/UI component library:

```bash
npx shadcn@latest add --all
```

This includes:
- Accordion, Alert, Alert Dialog
- Avatar, Badge, Button
- Calendar, Card, Checkbox
- Collapsible, Combobox, Command
- Context Menu, Dialog, Drawer
- Dropdown Menu, Form, Hover Card
- Input, Label, Menubar
- Navigation Menu, Popover, Progress
- Radio Group, Scroll Area, Select
- Separator, Sheet, Skeleton
- Slider, Switch, Table
- Tabs, Textarea, Toast
- Toggle, Tooltip, and more...

### 4. Install TanStack Form with Zod Validation

TanStack Form for form state management with Zod for schema validation:

```bash
npm install @tanstack/react-form zod
```

### 5. Install TanStack Query

TanStack Query (React Query) for server state management and API calls:

```bash
npm install @tanstack/react-query
```

### 6. Install Zustand

Zustand for lightweight client state management:

```bash
npm install zustand
```

## Complete Installation Script

Run all installations at once:

```bash
# From project root
npx create-next-app@latest my-next-app
cd my-next-app

# Initialize Shadcn/UI
npx shadcn-ui@latest init

# Install all Shadcn components
npx shadcn@latest add --all

# Install state management and form libraries
npm install @tanstack/react-form @tanstack/react-query zustand zod
```

## Project Structure

```
my-next-app/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── globals.css         # Global styles
├── components/
│   └── ui/                 # Shadcn/UI components
├── lib/
│   └── utils.ts            # Utility functions (cn helper)
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand stores
├── services/               # API service functions
├── types/                  # TypeScript type definitions
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Library Usage

### TanStack Query Setup

Create a provider in `app/providers.tsx`:

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

Wrap your app in `app/layout.tsx`:

```tsx
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### TanStack Query Example

```tsx
import { useQuery, useMutation } from '@tanstack/react-query'

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/v1/users').then(res => res.json())
})

// Mutate data
const mutation = useMutation({
  mutationFn: (newUser) => fetch('/api/v1/users', {
    method: 'POST',
    body: JSON.stringify(newUser)
  })
})
```

### TanStack Form with Zod Example

```tsx
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

function LoginForm() {
  const form = useForm({
    defaultValues: {
      email: '',
      password: ''
    },
    onSubmit: async ({ value }) => {
      const validated = schema.parse(value)
      // Handle submit
    }
  })

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      form.handleSubmit()
    }}>
      <form.Field name="email">
        {(field) => (
          <input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>
      <button type="submit">Submit</button>
    </form>
  )
}
```

### Zustand Store Example

Create a store in `stores/authStore.ts`:

```tsx
import { create } from 'zustand'

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null })
}))
```

Usage in components:

```tsx
import { useAuthStore } from '@/stores/authStore'

function Profile() {
  const { user, logout } = useAuthStore()

  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

## Development Commands

```bash
npm install             # Install dependencies (first time)
npm run dev             # Start development server (localhost:3000)
npm run build           # Create production build
npm run start           # Start production server
npm run lint            # Run ESLint
```

## Running the Application

1. **Start the backend first** (from `laravel-template-api/`):
   ```bash
   sail up -d
   ```

2. **Start the frontend** (from `my-next-app/`):
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:8080/api/v1

## API Integration

The frontend connects to the Laravel API at `/api/v1/`. Configure the base URL in your environment:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn/UI Documentation](https://ui.shadcn.com)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [TanStack Form Documentation](https://tanstack.com/form/latest)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)
- [Zod Documentation](https://zod.dev)
