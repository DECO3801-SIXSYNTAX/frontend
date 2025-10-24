# SiPanit Frontend - Project Structure

## 📁 Folder Structure

```
src/
├── components/           # All React components
│   ├── ui/              # Reusable UI components (Button, Input, etc.)
│   ├── sections/        # Page sections (Hero, Features, Footer, etc.)
│   ├── layouts/         # Layout components (MarketingLayout, etc.)
│   ├── demo/           # Interactive demo components
│   ├── features/      # Feature-specific components
│   └── index.ts        # Centralized exports
├── pages/              # Page components
├── lib/                # Utility functions
├── assets/             # Static assets
└── ...
```

## 🎯 Component Categories

### UI Components (`/ui/`)
- **Purpose**: Reusable, generic UI elements
- **Examples**: Button, Input, Modal, Card
- **Rules**: No business logic, highly reusable

### Section Components (`/sections/`)
- **Purpose**: Page sections and content blocks
- **Examples**: Hero, FeaturesGrid, CTASection, Navbar, Footer
- **Rules**: Self-contained sections, can contain business logic

### Layout Components (`/layouts/`)
- **Purpose**: Page layouts and wrappers
- **Examples**: MarketingLayout, DashboardLayout
- **Rules**: Define page structure, handle routing

### Demo Components (`/demo/`)
- **Purpose**: Interactive demonstrations
- **Examples**: InteractiveSeatingDemo
- **Rules**: Standalone demos, can be complex

### Feature Components (`/features/`)
- **Purpose**: Feature-specific components
- **Examples**: EventCreation, GuestManagement
- **Rules**: Business logic, feature-specific

## 📋 Import Guidelines

### ✅ Good Imports
```typescript
// From centralized index
import { Button, Hero } from '@/components'

// Direct imports for specific components
import { Button } from '@/components/ui/button'
import { Hero } from '@/components/sections/Hero'
```

### ❌ Avoid
```typescript
// Deep relative imports
import { Button } from '../../../components/ui/button'

// Inconsistent paths
import { Button } from '../src/components/ui/button'
```

## 🔄 Team Collaboration Rules

1. **Always use centralized exports** from `@/components`
2. **Keep components in correct folders** based on their purpose
3. **Update index.ts** when adding new components
4. **Use consistent naming** (PascalCase for components)
5. **Avoid duplicate components** - check existing before creating new

## 🚀 Benefits

- **Easier merging** - clear separation of concerns
- **Better maintainability** - organized structure
- **Reduced conflicts** - consistent patterns
- **Faster development** - clear component locations
