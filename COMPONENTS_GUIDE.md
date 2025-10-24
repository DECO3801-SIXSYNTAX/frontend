# 📁 Components Structure Guide

## 🎯 **Overview**
Semua komponen React berada di `src/components/` dengan struktur yang terorganisir berdasarkan fungsi dan kegunaannya.

## 📂 **Folder Structure**

### 🎨 **`/ui/` - UI Components**
**Purpose**: Reusable, generic UI elements yang bisa digunakan di seluruh aplikasi

**Examples**:
- `Button` - Tombol dengan berbagai variant (default, outline, ghost)
- `Input` - Input field dengan styling konsisten
- `Modal` - Popup modal
- `Card` - Container dengan shadow dan border

**Rules**:
- ✅ No business logic
- ✅ Highly reusable
- ✅ Generic styling
- ✅ Props-based customization

**Usage**:
```typescript
import { Button, Input } from '@/components'
```

---

### 📄 **`/sections/` - Page Sections**
**Purpose**: Komponen yang membentuk bagian-bagian dari halaman

**Examples**:
- `Hero` - Section utama landing page dengan CTA
- `FeaturesGrid` - Grid fitur-fitur aplikasi
- `CTASection` - Call-to-action section
- `Navbar` - Navigation bar
- `Footer` - Footer dengan links
- `DashboardHeader` - Header untuk dashboard
- `DashboardSidebar` - Sidebar untuk dashboard

**Rules**:
- ✅ Self-contained sections
- ✅ Can contain business logic
- ✅ Page-specific styling
- ✅ Can use UI components

**Usage**:
```typescript
import { Hero, FeaturesGrid, Navbar } from '@/components'
```

---

### 🏗️ **`/layouts/` - Layout Components**
**Purpose**: Komponen yang mendefinisikan struktur halaman dan layout

**Examples**:
- `MarketingLayout` - Layout untuk landing page (Navbar + Footer)
- `DashboardLayout` - Layout untuk dashboard (Header + Sidebar + Main)
- `AuthLayout` - Layout untuk halaman login/register

**Rules**:
- ✅ Define page structure
- ✅ Handle routing with `<Outlet />`
- ✅ Contain other components
- ✅ Set overall page styling

**Usage**:
```typescript
import { MarketingLayout, DashboardLayout } from '@/components'
```

---

### 🎮 **`/demo/` - Interactive Demos**
**Purpose**: Komponen demonstrasi interaktif untuk showcase fitur

**Examples**:
- `InteractiveSeatingDemo` - Demo drag-and-drop seating arrangement

**Rules**:
- ✅ Standalone demos
- ✅ Can be complex
- ✅ Interactive features
- ✅ Showcase functionality

**Usage**:
```typescript
import { InteractiveSeatingDemo } from '@/components'
```

---

### ⚙️ **`/features/` - Feature Components**
**Purpose**: Komponen yang spesifik untuk fitur tertentu

**Examples**:
- `EventCreation` - Form untuk membuat event
- `GuestManagement` - Manajemen tamu
- `SeatingArrangement` - Pengaturan kursi

**Rules**:
- ✅ Feature-specific
- ✅ Can contain business logic
- ✅ Complex functionality
- ✅ Domain-specific

**Usage**:
```typescript
import { EventCreation, GuestManagement } from '@/components'
```

---

## 📋 **Import Guidelines**

### ✅ **Recommended Imports**
```typescript
// From centralized index (BEST)
import { Button, Hero, MarketingLayout } from '@/components'

// Direct imports for specific components
import { Button } from '@/components/ui/button'
import { Hero } from '@/components/sections/Hero'
```

### ❌ **Avoid These**
```typescript
// Deep relative imports
import { Button } from '../../../components/ui/button'

// Inconsistent paths
import { Button } from '../src/components/ui/button'
```

---

## 🔄 **Team Collaboration Rules**

1. **✅ Always use centralized exports** from `@/components`
2. **✅ Keep components in correct folders** based on their purpose
3. **✅ Update index.ts** when adding new components
4. **✅ Use consistent naming** (PascalCase for components)
5. **✅ Avoid duplicate components** - check existing before creating new

---

## 🚀 **Benefits**

- **Easier merging** - clear separation of concerns
- **Better maintainability** - organized structure
- **Reduced conflicts** - consistent patterns
- **Faster development** - clear component locations
- **Team clarity** - everyone knows where to find things
