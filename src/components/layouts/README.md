# 🏗️ Layout Components

Komponen yang mendefinisikan struktur halaman dan layout keseluruhan.

## 📋 **Available Components**

- **MarketingLayout** - Layout untuk landing page (Navbar + Footer + Outlet)
- **DashboardLayout** - Layout untuk dashboard (Header + Sidebar + Main)

## 🎯 **Usage**

```typescript
import { MarketingLayout, DashboardLayout } from '@/components'

// Dalam routing
<Route path="/" element={<MarketingLayout />}>
  <Route index element={<LandingPage />} />
</Route>

<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<VendorDashboard />} />
</Route>
```

## 📝 **Rules**

- ✅ Define page structure
- ✅ Handle routing with `<Outlet />`
- ✅ Contain other components
- ✅ Set overall page styling
- ✅ Responsive layout
