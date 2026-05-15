# 📊 ANALYTICS TRACKING GAPS - Complete Audit

## Overview
This document lists all the places in the codebase where click analytics tracking is **missing** but should be added. The tracking functions are already available via `useTracking()` hook.

---

## 🔴 CRITICAL TRACKING GAPS

### 1. **CATEGORY NAVIGATION** (Missing `trackCategoryClick`)

#### File: [app/components/CategoriesBar.tsx](app/components/CategoriesBar.tsx)
Desktop category bar with hover dropdowns.

**Locations to add tracking:**
- **Line 97**: Sub-subcategory links in level 2 dropdown
  ```tsx
  <Link href={`${basePath}?cat=${category.id}&sub=${sub.id}&subsub=${subsub.id}`}
  ```
  → Add `onClick={() => trackCategoryClick()}`

- **Line 112**: Category links without subcategories
  ```tsx
  <Link href={`${basePath}?cat=${category.id}`}
  ```
  → Add `onClick={() => trackCategoryClick()}`

---

#### File: [app/components/CategoriesBarMobile.tsx](app/components/CategoriesBarMobile.tsx)
Mobile category accordion navigation.

**Locations to add tracking:**
- **Line 57**: Sub-subcategory links
  ```tsx
  <Link href={`${basePath}?category=${category.id}&subcategory=${subcat.id}&subsubcategory=${subsubcat.id}`}
  ```
  → Add `onClick={() => trackCategoryClick()}`

- **Line 67**: Subcategory links (no deeper level)
  ```tsx
  <Link href={`${basePath}?category=${category.id}&subcategory=${subcat.id}`}
  ```
  → Add `onClick={() => trackCategoryClick()}`

- **Line 79**: Category links (no subcategories)
  ```tsx
  <Link href={`${basePath}?category=${category.id}`}
  ```
  → Add `onClick={() => trackCategoryClick()}`

---

#### File: [app/components/Navbar.tsx](app/components/Navbar.tsx)
Multiple category navigation areas in a large navbar component.

**Desktop Dropdown Categories Section (Lines ~620-740):**

- **Line 641**: Main category links
  ```tsx
  <Link href={`${basePath}?cat=${cat.id}`}
  ```
  → `onClick={() => trackCategoryClick()}`

- **Line 697**: Sub-subcategory links
  ```tsx
  <Link href={`${basePath}?cat=${cat.id}&sub=${sub.id}&subsub=${subsub.id}`}
  ```
  → `onClick={() => trackCategoryClick()}`

- **Line 707**: Subcategory links
  ```tsx
  <Link href={`${basePath}?cat=${cat.id}&sub=${sub.id}`}
  ```
  → `onClick={() => trackCategoryClick()}`

**Mobile Drawer Categories (Lines ~30-150, inside `MobileCategoriesAccordion`):**

- **Line ~100**: Sub-subcategory navigation links
  ```tsx
  <a href={`${basePath}?cat=${cat.id}&sub=${sub.id}&subsub=${subsub.id}`}
  ```
  → Add `onClick={() => trackCategoryClick()}`

- **Line ~115**: Subcategory links
  ```tsx
  <a href={`${basePath}?cat=${cat.id}&sub=${sub.id}`}
  ```
  → Add `onClick={() => trackCategoryClick()}`

- **Line ~130**: Category root links
  ```tsx
  <a href={`${basePath}?cat=${cat.id}`}
  ```
  → Add `onClick={() => trackCategoryClick()}`

---

### 2. **BLOG NAVIGATION** (Missing blog-specific tracking)

#### File: [app/blogs/page.tsx](app/blogs/page.tsx)
Main blogs page with featured blog and blog cards.

**Locations to add tracking:**
- **Line 71**: Featured blog button click
  ```tsx
  onClick={() => router.push(`/blogs/${featured.id}`)}
  ```
  → Add `trackLinkClick()` before navigation

- **Line 120**: Individual blog card clicks
  ```tsx
  onClick={() => router.push(`/blogs/${b.id}`)}
  ```
  → Add `trackLinkClick()` before navigation

---

#### File: [app/components/Navbar.tsx](app/components/Navbar.tsx)
Blogs navigation link in navbar.

**Locations to add tracking:**
- **Line 266** or **270**: Blogs link in navigation links array
  ```tsx
  { href: isClient ? "/home/blogs" : "/admin/blogs", label: "Blogs" },
  { href: "/blogs", label: "Blogs" },
  ```
  → These are in a `links` array rendered as navigation; add tracking to the Link component that renders them

---

### 3. **EXTERNAL LINKS & SOCIAL MEDIA** (Missing `trackLinkClick`)

#### File: [app/components/Navbar.tsx](app/components/Navbar.tsx)

**Social Media & Contact Links:**
- **Line 409**: WhatsApp contact link
  ```tsx
  href="https://wa.me/593962873167"
  ```
  → `onClick={() => trackLinkClick()}`

- **Line 426**: Google Maps location link
  ```tsx
  href="https://www.google.com/maps/place/TECNOTHINGS+GYE/..."
  ```
  → `onClick={() => trackLinkClick()}`

- **Line 445**: Facebook link
  ```tsx
  href="https://www.facebook.com/TecnothingsEc/"
  ```
  → `onClick={() => trackLinkClick()}`

- **Line 458**: Instagram link
  ```tsx
  href="https://www.instagram.com/tecnothings_ec/"
  ```
  → `onClick={() => trackLinkClick()}`

- **Line 473**: TikTok link
  ```tsx
  href="https://www.tiktok.com/@tecnothings_ec"
  ```
  → `onClick={() => trackLinkClick()}`

**Search Results Navigation:**
- **Line 374**: Product links in search dropdown
  ```tsx
  <a href={href}
  ```
  → `onClick={() => trackLinkClick()}`

---

#### File: [app/components/Footer.tsx](app/components/Footer.tsx)

**Policy Links:**
- **Line 91**: Terms & Conditions link
  ```tsx
  <Link href="/politicas/terminos-y-condiciones">
  ```
  → `onClick={() => trackLinkClick()}`

- **Line 97**: Privacy Policy link
  ```tsx
  <Link href="/politicas/privacidad">
  ```
  → `onClick={() => trackLinkClick()}`

**Social Media Links:**
- **Line 189-191**: Social links map iteration
  ```tsx
  <a href={href} target="_blank" rel="noreferrer" title={label}>
  ```
  → `onClick={() => trackLinkClick()}`

**Contact Links:**
- **Line 122**: Phone link in desktop/modal
  ```tsx
  <a href="tel:+593962873167"
  ```
  → `onClick={() => trackLinkClick()}`

- **Line 128**: Email link in desktop/modal
  ```tsx
  <a href="mailto:Tecnothings.sas@gmail.com"
  ```
  → `onClick={() => trackLinkClick()}`

- **Line 152**: Phone link in desktop view
  ```tsx
  <a href="tel:+593962873167"
  ```
  → `onClick={() => trackLinkClick()}`

- **Line 158**: Email link in desktop view
  ```tsx
  <a href="mailto:Tecnothings.sas@gmail.com"
  ```
  → `onClick={() => trackLinkClick()}`

---

### 4. **UI CONTROL BUTTONS** (Missing `trackButtonClick`)

#### File: [app/components/ThemeToggle.tsx](app/components/ThemeToggle.tsx)

**Location:**
- **Line 23**: Theme toggle button
  ```tsx
  onClick={handleToggleTheme}
  ```
  → Wrap handler: `onClick={() => { trackButtonClick(); handleToggleTheme(); }}`

---

#### File: [app/components/Navbar.tsx](app/components/Navbar.tsx)

**Hamburger Menu:**
- **Line 301**: Mobile hamburger menu button
  ```tsx
  onClick={() => setMobileOpen(true)}
  ```
  → `onClick={() => { trackButtonClick(); setMobileOpen(true); }}`

**Mobile Drawer Close Buttons:**
- **Line 726**: Backdrop close button
  ```tsx
  onClick={() => setMobileOpen(false)}
  ```
  → `onClick={() => { trackButtonClick(); setMobileOpen(false); }}`

---

### 5. **FILTER & SORTING CONTROLS** (Missing `trackButtonClick`)

#### File: [app/home/products-by-category/page.tsx](app/home/products-by-category/page.tsx)

**Breadcrumb Navigation Clicks:**
- **Line 205**: "Categorías" breadcrumb
  ```tsx
  onClick={() => window.location.href = '/home/products-by-category'}
  ```
  → Add `trackCategoryClick()` before navigation

- **Line 209**: Category name breadcrumb
  ```tsx
  onClick={() => window.location.href = `/home/products-by-category?cat=${encodeURIComponent(categoria)}`}
  ```
  → Add `trackCategoryClick()` before navigation

- **Line 215**: Subcategory name breadcrumb
  ```tsx
  onClick={() => window.location.href = `/home/products-by-category?cat=${encodeURIComponent(categoria)}&subcat=${encodeURIComponent(subcategoria)}`}
  ```
  → Add `trackCategoryClick()` before navigation

**Filter Buttons:**
- **Line 253**: Clear search button
  ```tsx
  onClick={() => setSearch("")}
  ```
  → `onClick={() => { trackButtonClick(); setSearch(""); }}`

- **Line 263**: Price filter toggle button
  ```tsx
  onClick={() => setShowPrecio((v) => !v)}
  ```
  → `onClick={() => { trackButtonClick(); setShowPrecio((v) => !v); }}`

- **Line 276**: Clear filters button
  ```tsx
  onClick={clearFilters}
  ```
  → `onClick={() => { trackButtonClick(); clearFilters(); }}`

**Sorting:**
- **Line 315**: Sort option buttons
  ```tsx
  onClick={() => setOrden(opt.value)}
  ```
  → `onClick={() => { trackButtonClick(); setOrden(opt.value); }}`

**Pagination:**
- **Line 380**: Previous page button
  ```tsx
  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
  ```
  → Add `trackButtonClick()` before state change

- **Line 389**: Page number buttons
  ```tsx
  onClick={() => setCurrentPage(n)}
  ```
  → Add `trackButtonClick()` before state change

- **Line 396**: Next page button
  ```tsx
  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
  ```
  → Add `trackButtonClick()` before state change

---

#### File: [app/home/productos/page.tsx](app/home/productos/page.tsx)

Similar pattern to products-by-category:

**Locations (same pattern as above):**
- **Line 217**: Clear search
- **Line 227**: Price filter toggle
- **Line 240**: Clear filters
- **Line 279**: Sort options
- **Line 353**: Pagination previous
- **Line 362**: Pagination page numbers
- **Line 369**: Pagination next

---

### 6. **PRODUCT DETAIL PAGE INTERACTIONS** (Some tracking exists via ProductoCard, but page-level interactions need tracking)

#### File: [app/home/product-detail/page.tsx](app/home/product-detail/page.tsx)

**Tab Navigation:**
- **Line 272**: "Características" tab
  ```tsx
  onClick={() => handleTabToggle("caracteristicas")}
  ```
  → `onClick={() => { trackButtonClick(); handleTabToggle("caracteristicas"); }}`

- **Line 284**: "Reseñas" tab
  ```tsx
  onClick={() => handleTabToggle("resenas")}
  ```
  → `onClick={() => { trackButtonClick(); handleTabToggle("resenas"); }}`

- **Line 529**: Mobile "Características" tab
  ```tsx
  onClick={() => handleTabToggle("caracteristicas")}
  ```
  → Add tracking

- **Line 541**: Mobile "Reseñas" tab
  ```tsx
  onClick={() => handleTabToggle("resenas")}
  ```
  → Add tracking

**Quantity Controls:**
- **Line 400**: Decrease quantity button
  ```tsx
  onClick={() => setCantidad((v) => Math.max(1, v - 1))}
  ```
  → Add `trackButtonClick()` before state change

- **Line 407**: Increase quantity button
  ```tsx
  onClick={() => setCantidad((v) => Math.min(maxCantidad, v + 1))}
  ```
  → Add `trackButtonClick()` before state change

**Action Buttons:**
- **Line 417**: Add to cart button
  ```tsx
  onClick={handleAddCart}
  ```
  → Already has tracking via ProductoCard, but verify in this context

- **Line 435**: Favorite button
  ```tsx
  onClick={handleFav}
  ```
  → Add `trackButtonClick()` before handler

**Review Rating:**
- **Line 681**: Star rating click for reviews
  ```tsx
  onClick={() => setReviewRating(i + 1)}
  ```
  → Add `trackButtonClick()` before state change

---

### 7. **CART PAGE INTERACTIONS** (Missing `trackButtonClick`)

#### File: [app/home/cart/page.tsx](app/home/cart/page.tsx)

**Quantity Adjustments:**
- **Line 492**: Decrease quantity
  ```tsx
  onClick={() => handleCantidad(p.id, (p.cantidad || 1) - 1)}
  ```
  → Add `trackButtonClick()` before handler

- **Line 499**: Increase quantity
  ```tsx
  onClick={() => handleCantidad(p.id, (p.cantidad || 1) + 1)}
  ```
  → Add `trackButtonClick()` before handler

**Remove Item:**
- **Line 507**: Remove product button
  ```tsx
  onClick={() => removeCarrito(p.id)}
  ```
  → `onClick={() => { trackButtonClick(); removeCarrito(p.id); }}`

**Payment Mode Selection:**
- **Line 564**: "Generar Orden" mode button
  ```tsx
  onClick={() => setPayMode("order")}
  ```
  → `onClick={() => { trackButtonClick(); setPayMode("order"); }}`

- **Line 583**: "Pagar con Stripe" mode button
  ```tsx
  onClick={() => setPayMode("stripe")}
  ```
  → `onClick={() => { trackButtonClick(); setPayMode("stripe"); }}`

---

### 8. **PROFILE & SETTINGS PAGE BUTTONS** (Missing tracking)

#### File: [app/home/perfil/page.tsx](app/home/perfil/page.tsx)

**Photo Upload:**
- **Line 116**: Photo upload click
  ```tsx
  onClick={() => fileInputRef.current && fileInputRef.current.click()}
  ```
  → Add `trackButtonClick()` before handler

**Edit/Save Buttons:**
- **Line 153**: Save name button
  ```tsx
  onClick={handleNameSave}
  ```
  → `onClick={() => { trackButtonClick(); handleNameSave(); }}`

- **Line 156**: Cancel edit button
  ```tsx
  onClick={() => setEditName(false)}
  ```
  → `onClick={() => { trackButtonClick(); setEditName(false); }}`

- **Line 163**: Edit name button
  ```tsx
  onClick={() => setEditName(true)}
  ```
  → `onClick={() => { trackButtonClick(); setEditName(true); }}`

- **Line 192**: Save phone button
  ```tsx
  onClick={handlePhoneSave}
  ```
  → Add `trackButtonClick()` before handler

---

#### File: [app/home/config/page.tsx](app/home/config/page.tsx)

**Theme Toggle:**
- **Line 34**: Theme change button
  ```tsx
  onClick={() => handleThemeChange(theme === "light" ? "dark" : "light")}
  ```
  → `onClick={() => { trackButtonClick(); handleThemeChange(...); }}`

---

### 9. **ORDER & UTILITY BUTTONS** (Missing tracking)

#### File: [app/home/ordenes/[id]/page.tsx](app/home/ordenes/[id]/page.tsx)

**Print Order:**
- **Line 192**: Print button
  ```tsx
  onClick={handlePrint}
  ```
  → `onClick={() => { trackButtonClick(); handlePrint(); }}`

---

#### File: [app/home/page.tsx](app/home/page.tsx)

**Onboarding/Action Buttons:**
- **Line 114**: Any onClick handlers for user CTAs
  → Add `trackButtonClick()` to relevant actions

---

### 10. **SIDEBAR NAVIGATION** (Missing tracking)

#### File: [app/components/Sidebar.tsx](app/components/Sidebar.tsx)

**Navigation Links:**
- **Line 38**: Sidebar navigation links
  ```tsx
  <a href={item.path}
  ```
  → Add `onClick={() => trackLinkClick()}`

---

#### File: [app/components/BottomBar.tsx](app/components/BottomBar.tsx)

**Bottom Navigation Links:**
- **Line 34**: Bottom nav links
  ```tsx
  <a href={item.path}
  ```
  → Add `onClick={() => trackLinkClick()}`

---

#### File: [app/components/BottomBarPublic.tsx](app/components/BottomBarPublic.tsx)

**Public Bottom Navigation:**
- **Line 30**: Public nav links
  ```tsx
  href={item.path}
  ```
  → Add `onClick={() => trackLinkClick()}`

---

### 11. **RELATED PRODUCTS CAROUSEL** (Partially tracked, but control buttons need tracking)

#### File: [app/components/RelatedProductsCarousel.tsx](app/components/RelatedProductsCarousel.tsx)

**Carousel Controls:**
- **Line 120**: Previous button
  ```tsx
  onClick={handlePrev}
  ```
  → `onClick={() => { trackButtonClick(); handlePrev(); }}`

- **Line 134**: Next button
  ```tsx
  onClick={handleNext}
  ```
  → `onClick={() => { trackButtonClick(); handleNext(); }}`

**Related Product Cards:**
- **Line 177**: Related product click
  ```tsx
  onClick={() => { ... }}
  ```
  → Verify if `trackProductClick()` is called

---

### 12. **WHATSAPP FLOATING BUTTON** (Missing tracking)

#### File: [app/components/WhatsAppFloatingButton.tsx](app/components/WhatsAppFloatingButton.tsx)

**Location:**
- **Line 136**: WhatsApp floating button link
  ```tsx
  href="https://wa.me/593962873167"
  ```
  → `onClick={() => trackLinkClick()}`

---

## 📋 SUMMARY TABLE

| Category | Component | Missing Tracking Type | Lines |
|----------|-----------|----------------------|-------|
| **Categories** | CategoriesBar.tsx | trackCategoryClick | 97, 112 |
| **Categories** | CategoriesBarMobile.tsx | trackCategoryClick | 57, 67, 79 |
| **Categories** | Navbar.tsx | trackCategoryClick | 641, 697, 707, ~100-130 |
| **Blogs** | blogs/page.tsx | trackLinkClick | 71, 120 |
| **Blogs** | Navbar.tsx | trackLinkClick | 266, 270 |
| **Social Links** | Navbar.tsx | trackLinkClick | 409, 426, 445, 458, 473, 374 |
| **Social Links** | Footer.tsx | trackLinkClick | 91, 97, 189-191, 122, 128, 152, 158 |
| **UI Controls** | ThemeToggle.tsx | trackButtonClick | 23 |
| **UI Controls** | Navbar.tsx | trackButtonClick | 301, 726 |
| **Filters** | home/products-by-category/page.tsx | trackButtonClick/trackCategoryClick | 205, 209, 215, 253, 263, 276, 315, 380, 389, 396 |
| **Filters** | home/productos/page.tsx | trackButtonClick/trackCategoryClick | 217, 227, 240, 279, 353, 362, 369 |
| **Product Detail** | home/product-detail/page.tsx | trackButtonClick | 272, 284, 400, 407, 435, 529, 541, 681 |
| **Cart** | home/cart/page.tsx | trackButtonClick | 492, 499, 507, 564, 583 |
| **Profile** | home/perfil/page.tsx | trackButtonClick | 116, 153, 156, 163, 192 |
| **Settings** | home/config/page.tsx | trackButtonClick | 34 |
| **Orders** | home/ordenes/[id]/page.tsx | trackButtonClick | 192 |
| **Navigation** | Sidebar.tsx | trackLinkClick | 38 |
| **Navigation** | BottomBar.tsx | trackLinkClick | 34 |
| **Navigation** | BottomBarPublic.tsx | trackLinkClick | 30 |
| **Carousel** | RelatedProductsCarousel.tsx | trackButtonClick | 120, 134 |
| **WhatsApp** | WhatsAppFloatingButton.tsx | trackLinkClick | 136 |

---

## 📌 IMPLEMENTATION STRATEGY

### Step 1: Import useTracking hook
Add to each component that needs tracking:
```tsx
import { useTracking } from "../lib/useAnalytics";

// Inside component:
const { trackCategoryClick, trackButtonClick, trackLinkClick } = useTracking();
```

### Step 2: Add tracking to handlers
Wrap existing handlers or add tracking before navigation:
```tsx
// Option 1: Wrap handler
onClick={() => { trackButtonClick(); myHandler(); }}

// Option 2: Async before navigation
onClick={async () => {
  await trackButtonClick();
  router.push('/path');
}}
```

### Step 3: For Link components
Use `tracking-friendly-link` pattern or add onClick handler:
```tsx
<Link 
  href="/path"
  onClick={() => trackLinkClick()}
>
  Link text
</Link>
```

---

## ✅ VALIDATION CHECKLIST

After implementing tracking:
- [ ] Analytics Widget shows increased clicks for each type
- [ ] Breadcrumb clicks counted as category clicks
- [ ] Social link clicks counted as link clicks
- [ ] Filter/sort buttons counted as button clicks
- [ ] No double-tracking (verify API only receives one call per click)
- [ ] Navigation still works smoothly after tracking added
- [ ] Async tracking doesn't delay navigation
- [ ] Mobile and desktop versions both trackings

