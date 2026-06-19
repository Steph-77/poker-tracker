# React Native Migration Plan

## Overview
Migration strategy to convert the poker-tracker web app (React + Vite) to a React Native mobile app while maintaining all existing functionality.

---

## Current Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: Custom components (will rebuild for React Native)
- **Backend**: Supabase (Postgres + Auth + Realtime)
- **State Management**: React hooks
- **Date Handling**: react-datepicker
- **Styling**: Tailwind CSS + custom theme

---

## Target Tech Stack
- **Framework**: React Native + Expo
- **UI Library**: Custom components (poker-specific UI)
- **Backend**: Supabase (unchanged - works with React Native)
- **Navigation**: Expo Router (file-based routing like Next.js)
- **Date Handling**: expo-date-time-picker (Expo built-in)
- **Storage**: AsyncStorage (general) + expo-secure-store (sensitive data)
- **Styling**: StyleSheet API + theme context
- **i18n**: react-i18next (French/English support)

---

## Migration Strategy

### Complete Migration to Mobile Only

You're abandoning the web app and building a pure React Native app. This is simpler - no monorepo complexity.

**Project Structure:**
```
poker-tracker-mobile/
├── app/                     # Expo Router (file-based routing)
│   ├── (tabs)/              # Tab navigation
│   │   ├── _layout.tsx      # Tab bar config
│   │   ├── games.tsx        # Games list (home)
│   │   ├── history.tsx      # Past games history
│   │   └── settings.tsx     # App settings
│   ├── game/
│   │   └── [id].tsx         # Game detail (dynamic)
│   ├── settlement/
│   │   └── [id].tsx         # Settlement calculator
│   └── _layout.tsx          # Root layout
├── src/
│   ├── lib/                 # Business logic (copied from web)
│   │   ├── db.ts           # From /Users/Steph/Desktop/poker-tracker/src/lib/db.ts
│   │   ├── settlement.ts   # From /Users/Steph/Desktop/poker-tracker/src/lib/settlement.ts
│   │   ├── chipDistribution.ts  # From /Users/Steph/Desktop/poker-tracker/src/lib/chipDistribution.ts
│   │   ├── types.ts        # From /Users/Steph/Desktop/poker-tracker/src/lib/types.ts
│   │   └── supabase.ts     # Adapted for React Native
│   ├── components/          # Mobile UI components (rebuilt)
│   │   ├── GameCard.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── TransactionCard.tsx
│   │   ├── SettlementCard.tsx
│   │   ├── ChipStack.tsx
│   │   └── ui/              # Reusable UI primitives
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       └── Toast.tsx
│   ├── hooks/               # Custom hooks
│   ├── i18n/                # Internationalization
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── en.json
│   │       └── fr.json
│   └── styles/              # Theme and StyleSheets
│       └── theme.ts
├── assets/                  # Images, fonts, icons
├── package.json
├── app.json                 # Expo config
└── tsconfig.json
```

**Setup Commands:**
```bash
# 1. Create new Expo project
npx create-expo-app poker-tracker-mobile --template tabs
cd poker-tracker-mobile

# 2. Install dependencies
npx expo install @supabase/supabase-js
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-url-polyfill
npx expo install expo-router react-native-safe-area-context react-native-screens
npx expo install expo-date-time-picker
npx expo install expo-secure-store
npm install react-i18next i18next

# 3. Create lib folder structure
mkdir -p src/lib

# 4. Copy reusable business logic files
cp /Users/Steph/Desktop/poker-tracker/src/lib/db.ts src/lib/
cp /Users/Steph/Desktop/poker-tracker/src/lib/settlement.ts src/lib/
cp /Users/Steph/Desktop/poker-tracker/src/lib/chipDistribution.ts src/lib/
cp /Users/Steph/Desktop/poker-tracker/src/lib/types.ts src/lib/
cp /Users/Steph/Desktop/poker-tracker/src/lib/supabase.ts src/lib/
```

**That's it for setup!** 4 out of 5 files work unchanged. Only supabase.ts needs one small edit.
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import 'react-native-url-polyfill/auto'

const SUPABASE_URL = 'your-url'
const SUPABASE_ANON_KEY = 'your-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,      // ← Only change from web version
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // ← Mobile doesn't use URL auth
  },
})
```

**That's it!** All other files (db.ts, settlement.ts, chipDistribution.ts, types.ts) copy over unchanged. No modifications needed.

---

### Phase 1: Project Setup (1 day)

#### Project Structure
```
/Users/Steph/Desktop/
  poker-tracker/           ← Existing web app (keep as-is)
  poker-tracker-mobile/    ← New React Native app
```

#### 1.1 Initialize Expo project
```bash
cd /Users/Steph/Desktop
npx create-expo-app poker-tracker-mobile --template
cd poker-tracker-mobile
```

#### 1.2 Install core dependencies
```bash
# Core
npx expo install @supabase/supabase-js
npx expo install react-native-url-polyfill

# Navigation (file-based routing)
npx expo install expo-router react-native-safe-area-context react-native-screens

# Storage
npx expo install @react-native-async-storage/async-storage
npx expo install expo-secure-store

# Date/Time
npx expo install expo-date-time-picker

# Internationalization
npm install react-i18next i18next
```

#### 1.3 Create folder structure
```bash
# Inside /Users/Steph/Desktop/poker-tracker-mobile
mkdir -p src/{components,screens,navigation,lib,hooks,styles}
```

**Target structure:**
```
/Users/Steph/Desktop/poker-tracker-mobile/
  app.json
  package.json
  App.tsx
  src/
    components/       ← Rebuild from scratch
    screens/          ← Rebuild from scratch
    navigation/       ← New navigation setup
    lib/              ← Copy reusable files here
      db.ts
      settlement.ts
      chipDistribution.ts
      types.ts
      supabase.ts     ← Adapt for React Native
    hooks/            ← New mobile hooks
    styles/           ← New StyleSheet styles
```

#### 1.4 Copy reusable files
```bash
# Copy pure logic files (no changes needed)
cp /Users/Steph/Desktop/poker-tracker/src/lib/types.ts \
   /Users/Steph/Desktop/poker-tracker-mobile/src/lib/

cp /Users/Steph/Desktop/poker-tracker/src/lib/db.ts \
   /Users/Steph/Desktop/poker-tracker-mobile/src/lib/

cp /Users/Steph/Desktop/poker-tracker/src/lib/settlement.ts \
   /Users/Steph/Desktop/poker-tracker-mobile/src/lib/

cp /Users/Steph/Desktop/poker-tracker/src/lib/chipDistribution.ts \
   /Users/Steph/Desktop/poker-tracker-mobile/src/lib/

# Copy supabase.ts (will need adaptation)
cp /Users/Steph/Desktop/poker-tracker/src/lib/supabase.ts \
   /Users/Steph/Desktop/poker-tracker-mobile/src/lib/supabase.ts
```

#### 1.5 Create Supabase config for mobile
```bash
# Edit /Users/Steph/Desktop/poker-tracker-mobile/src/lib/supabase.ts
# Add AsyncStorage import and config (see Phase 2)
```

---

### Phase 2: Core Infrastructure (2-3 days)

#### 2.1 Supabase Setup
- Install `@supabase/supabase-js` and `react-native-url-polyfill`
- Adapt `src/lib/supabase.ts` for React Native
- Test authentication flow
- Setup AsyncStorage for session persistence

**File Location:** `/Users/Steph/Desktop/poker-tracker-mobile/src/lib/supabase.ts`

**Key Changes:**
```typescript
// Before (Web - /Users/Steph/Desktop/poker-tracker/src/lib/supabase.ts)
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// After (React Native - /Users/Steph/Desktop/poker-tracker-mobile/src/lib/supabase.ts)
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Move to environment variables or Constants
const SUPABASE_URL = 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {Files copied from web project work as-is
  - `/Users/Steph/Desktop/poker-tracker-mobile/src/lib/db.ts` ✅
  - `/Users/Steph/Desktop/poker-tracker-mobile/src/lib/settlement.ts` ✅
  - `/Users/Steph/Desktop/poker-tracker-mobile/src/lib/chipDistribution.ts` ✅
  - `/Users/Steph/Desktop/poker-tracker-mobile/src/lib/types.ts` ✅
- Only `supabase.ts` needed modification (AsyncStorage)
- Test all database operations work on mobile
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,    // ← Disable web-only feature
  },
})
```

#### 2.2 Navigation Setup
- **Use Expo Router** (file-based routing like Next.js!)
- Familiar `app/` directory structure
- Dynamic routes: `app/game/[id].tsx`
- Tabs: `app/(tabs)/index.tsx`
- Automatic deep linking

**Expo Router Structure:**
```
app/
├── (tabs)/              # Tab navigation
│   ├── _layout.tsx      # Tab bar config (games, history, settings)
│   ├── games.tsx        # Active games list (home)
│   ├── history.tsx      # Past games history
│   └── settings.tsx     # App settings (language, theme, etc)
├── game/
│   └── [id].tsx         # Game detail (players, buy-ins, transactions)
├── settlement/
│   └── [id].tsx         # Settlement calculator (who owes whom)
└── _layout.tsx          # Root layout (theme provider, i18n)
```

**Route Examples:**
```typescript
// Navigate to game detail
router.push('/game/123')

// Navigate to settlement
router.push('/settlement/123')

// Tab navigation (automatic)
// Tabs: /games, /history, /settings
```

#### 2.3 Database Layer
- **Good news**: `db.ts`, `settlement.ts`, `chipDistribution.ts`, `types.ts` can be reused as-is
- Only need to test Supabase client works with React Native

#### 2.4 i18n Setup
**File:** `src/i18n/index.ts`
```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'

import en from './locales/en.json'
import fr from './locales/fr.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: Localization.locale.split('-')[0], // 'en' or 'fr'
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
```

**Usage:**
```typescript
import { useTranslation } from 'react-i18next'

function GamesList() {
  const { t } = useTranslation()
  return <Text>{t('games.title')}</Text>
}
```

---

### Phase 3: UI Components Migration (5-7 days)

#### 3.1 Component Mapping

| Web Component | React Native Equivalent |
|---------------------------|-------------------------|
| `Dialog` | Custom `Modal` component (RN core) |
| `Button` | Custom `Button` component with StyleSheet |
| `Input` | Custom `TextInput` component |
| `Card` | Custom `Card` component with View/Shadow |
| `Text`, `Heading` | `Text` with StyleSheet variants |
| `Stack`, `HStack`, `VStack` | `View` with flexbox |
| `IconButton` | Custom icon button with TouchableOpacity |
| `Toaster` | Custom Toast/Alert component |
| `Badge` | Custom Badge with View/Text |
| `Separator` | Custom Divider (View with border) |
| `DatePicker` | `expo-date-time-picker` |

#### 3.2 Screen Components to Convert

1. **GamesList.tsx**
   - FlatList for performance (instead of mapping)
   - Pull-to-refresh for reload
   - Swipe actions for delete
   - Empty state with illustration

2. **GameDetail.tsx**
   - ScrollView for scrollable content
   - Collapsible sections for players/transactions
   - Native share API for settlements
   - Action sheet for edit/delete

3. **CreateSessionDialog → CreateSessionScreen**
   - Full screen instead of dialog
   - Native date/time pickers
   - Dismiss keyboard on scroll
   - Form validation with error display

4. **ChipDistributionDialog → ChipDistributionScreen**
   - ScrollView layout
   - Number pad for chip quantities
   - Visual chip representation
   - Copy distribution to clipboard

#### 3.3 Custom Components Needed

```typescript
// Custom poker-specific components
- ChipStack (visual chip denomination display)
- ChipDenominationInput (custom number input with chip icon)
- PlayerCard (player info with buy-ins/rebuys)
- TransactionCard (transaction with swipe actions)
- SettlementCard (who owes whom visualization)
- GameCard (game summary in list)
- Button (custom button with theme variants)
- Input (custom text input with theme)
- Card (custom card with shadows)
- Modal (custom modal with animations)
- Toast (custom toast notifications)
- EmptyState (when no data)
- LoadingSpinner
```

---

### Phase 4: Features Implementation (3-4 days)

#### 4.1 Core Features
- ✅ Create/edit/delete poker sessions
- ✅ Track buy-ins and rebuys per player
- ✅ Chip distribution calculator
- ✅ Settlement calculation
- ✅ Transaction history
- ✅ Offline support with AsyncStorage

#### 4.2 Mobile-Specific Enhancements
- **Camera Integration**: Scan QR codes for quick player add
- **Contacts Integration**: Import player names from contacts
- **Share Sheet**: Share settlement via WhatsApp/SMS
- **Notifications**: Reminders for recurring games
- **Dark Mode**: System theme detection
- **Haptic Feedback**: Touch feedback for actions
- **Biometric Auth**: Face ID/Touch ID for app lock

#### 4.3 Offline-First Strategy
- Cache games list in AsyncStorage
- Queue mutations when offline
- Sync when back online
- Show offline indicator

---

### Phase 5: Styling & Theme (2-3 days)

#### 5.1 Design System
```typescript
// theme.ts
export const theme = {
  colors: {
    primary: '#7C3AED', // Purple
    background: '#0F172A', // Dark blue
    card: '#1E293B',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700' },
    h2: { fontSize: 24, fontWeight: '600' },
    h3: { fontSize: 20, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 14, fontWeight: '400' },
  },
}
```

#### 5.2 Platform-Specific Styling
- Use `Platform.select()` for iOS vs Android differences
- Safe area handling with `SafeAreaView`
- Keyboard avoiding view for forms
- Different navigation patterns (stack vs tabs)

---

### Phase 6: Testing & Polish (2-3 days)

#### 6.1 Testing Checklist
- [ ] All CRUD operations work
- [ ] Supabase realtime updates
- [ ] Offline mode functionality
- [ ] Settlement calculations accurate
- [ ] Chip distribution algorithm
- [ ] Navigation flows smooth
- [ ] Form validation working
- [ ] Error handling graceful
- [ ] Performance (60fps scrolling)
- [ ] Memory leaks checked

#### 6.2 Platform Testing
- Test on iOS simulator
- Test on Android emulator
- Test on real devices (both platforms)
- Different screen sizes (phone/tablet)
- Landscape orientation support

#### 6.3 Polish
- Loading states everywhere
- Smooth animations (LayoutAnimation, Animated API)
- Error messages user-friendly
- Empty states with CTAs
- Consistent spacing/padding
- Icon consistency

---

### Phase 7: Deployment (1-2 days)

#### 7.1 Build Configuration
```json
// app.json
{
  "expo": {
    "name": "Poker Tracker",
    "slug": "poker-tracker",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#0F172A"
    },
    "updates": {
---

## Common Pitfalls & Solutions

### 1. Touch Targets Too Small
**Problem:** Buttons/links too small to tap accurately
**Solution:** Minimum 44x44 points hit area

```typescript
// ❌ Bad
<TouchableOpacity style={{ width: 20, height: 20 }}>
  <Icon name="edit" size={16} />
</TouchableOpacity>

// ✅ Good - use hitSlop
<TouchableOpacity 
  style={{ width: 20, height: 20 }}
  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
>
  <Icon name="edit" size={16} />
</TouchableOpacity>
```

### 2. No Default Scrolling
**Problem:** Content doesn't scroll like web
**Solution:** Wrap in ScrollView or FlatList

```typescript
// ❌ Content gets cut off
<View>
  <LongListOfItems />
</View>

// ✅ Scrollable
<ScrollView>
  <LongListOfItems />
</ScrollView>

// ✅ Better for long lists
<FlatList
  data={items}
  renderItem={({ item }) => <ItemCard item={item} />}
  keyExtractor={(item) => item.id}
/>
```

### 3. Text Must Be Wrapped
**Problem:** Can't render text directly in View
**Solution:** Always use `<Text>` component

```typescript
// ❌ Crashes
<View>Hello</View>

// ✅ Works
<View>
  <Text>Hello</Text>
</View>
```

### 4. Absolute Imports
**Problem:** `import { db } from 'src/lib/db'` doesn't work
**Solution:** Configure tsconfig and metro

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["../shared/src/*"]
    }
  }
}
```

```javascript
// metro.config.js
const path = require('path')

module.exports = {
  resolver: {
    extraNodeModules: {
      '@shared': path.resolve(__dirname, '../shared/src'),
    },
  },
}
```

### 5. SVG Support
**Problem:** Can't use SVG files directly
**Solution:** Use `react-native-svg`

```bash
npx expo install react-native-svg
```

```typescript
import Svg, { Path } from 'react-native-svg'

// Or use transformation tools
// https://react-svgr.com/playground/ to convert SVG → React Native
```

### 6. Images Require Dimensions
**Problem:** Images don't auto-size like web
**Solution:** Always specify width/height or use `aspectRatio`

```typescript
// ❌ Won't display
<Image source={{ uri: 'https://...' }} />

// ✅ Fixed size
<Image 
  source={{ uri: 'https://...' }} 
  style={{ width: 200, height: 200 }}
/>

// ✅ Responsive with aspect ratio
<Image 
  source={{ uri: 'https://...' }} 
  style={{ width: '100%', aspectRatio: 16/9 }}
/>
```

### 7. Keyboard Covering Inputs
**Problem:** Keyboard overlaps form inputs
**Solution:** Use KeyboardAvoidingView

```typescript
import { KeyboardAvoidingView, Platform } from 'react-native'

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  <ScrollView>
    <TextInput placeholder="Name" />
    <TextInput placeholder="Buy-in" />
  </ScrollView>
</KeyboardAvoidingView>
```

### 8. Safe Area on iPhone
**Problem:** Content hidden behind notch/home indicator
**Solution:** Use SafeAreaView

```typescript
import { SafeAreaView } from 'react-native-safe-area-context'

<SafeAreaView style={{ flex: 1 }}>
  <YourContent />
</SafeAreaView>
```

---

## Libraries Used

### Navigation
- **Expo Router** ⭐ - File-based routing (like Next.js)
  - Familiar app/ directory structure
  - TypeScript support
  - Deep linking built-in

### Storage
- **AsyncStorage** - General app data (games, settings)
- **expo-secure-store** - Sensitive data (auth tokens, financial info)

### Date/Time
- **expo-date-time-picker** ⭐ - Expo's built-in date picker
  - Works seamlessly with Expo Go
  - Native iOS/Android pickers

### Internationalization
- **react-i18next** - French/English support
  - Translation management
  - RTL support if needed

### Forms & Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Dev Tools
- **Expo Dev Tools** - Built-in debugging
- **React Native Debugger** - Advanced debugging
- **Flipper** - Network inspection

---

      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "bundleIdentifier": "com.yourcompany.pokertracker",
      "supportsTablet": true
    },
    "android": {
      "package": "com.yourcompany.pokertracker",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F172A"
      }
    }
  }
}
```

#### 7.2 Build & Submit
- **iOS**: EAS Build → TestFlight → App Store
- **Android**: EAS Build → Google Play Console
- Setup app store listings
- Screenshots for both platforms
- App descriptions and keywords

---

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Phase 1: Setup | 1 day | Create project, copy files |
| Phase 2: Infrastructure | 2 days | Supabase + Expo Router |
| Phase 3: UI Migration | 5-7 days | Rebuild components |
| Phase 4: Features | 3 days | Mobile enhancements |
| Phase 5: Styling | 2 days | Polish & theme |
| Phase 6: Testing | 2 days | QA & fixes |
| Phase 7: Deployment | 1 day | Build & submit |
| **Total** | **16-22 days** | ~3-4 weeks |

---

## Key Challenges

### 1. Rebuilding UI Components
- No direct 1:1 mapping from web to native
- Need to rebuild layouts with React Native flexbox
- Custom components for complex UI patterns

### 2. Date Picker
- Web: react-datepicker (easy customization)
- Native: Platform-specific pickers (different UX)
- Solution: Use community packages or build custom

### 3. Toasts/Notifications
- Different paradigm in mobile
- Use Snackbar or Toast libraries
- Consider native push notifications

### 4. Responsive Design
- Web: CSS media queries
- Native: useWindowDimensions + responsive logic
- Different approach to "mobile-first"

### 5. Debugging
- Web: Chrome DevTools
- Native: Flipper or React Native Debugger
- Network inspection more complex

---

## Alternative: React Native Web (Hybrid Approach)

### Pros
- Write once, run everywhere (web + mobile)
- Share 90%+ of code
- Single codebase maintenance

### Cons
- Compromises on web experience
- Larger bundle size for web
- Platform-specific features harder

### Recommendation
**Go pure React Native** for best mobile experience, keep web app separate. The shared business logic (`db.ts`, `settlement.ts`, `chipDistribution.ts`) can be reused as npm package if needed.

---

## Migration Priorities

### Must-Have (MVP)
1. ✅ List all poker sessions
2. ✅ View session details
3. ✅ Create/edit sessions
4. ✅ Add players with buy-ins
5. ✅ Calculate settlements
6. ✅ Chip distribution calculator

### Nice-to-Have (v1.1)
- Camera for player QR codes
- Share settlements via WhatsApp
- Dark/light theme toggle
- Recurring game templates
- Statistics/analytics screen
- Export data as CSV

### Future (v2.0+)
- Multi-table support (already documented)
- Tournament mode
- Blind timer
- Player profiles with history
- Social features (friend invites)
- Cloud backup/restore

---

## Code Reusability

### How to Identify Reusable Code

**Criteria for 100% Reusable:**
1. No DOM dependencies (no `document`, `window`)
2. No web-specific APIs (no `localStorage`, `fetch` with CORS)
3. Pure TypeScript/JavaScript logic
4. No React component JSX (`.tsx` with `<div>`, `<button>`, etc.)
cd /Users/Steph/Desktop/poker-tracker

# Find all files in src/lib (most likely reusable)
find src/lib -type f -name "*.ts" -o -name "*.tsx"

# Check for web-specific dependencies
grep -r "localStorage\|sessionStorage\|document\|window\|HTMLElement" src/lib/
grep -r "import.*from.*'react'" src/lib/  # Should only import types

# Check imports in lib files
for file in src/lib/*.ts; do
  echo "=== $file ==="
  head -20 "$file" | grep "^import"
done
```

**Copy reusable files script:**
```bash
# Run this from /Users/Steph/Desktop/poker-tracker-mobile

WEB_LIB="/Users/Steph/Desktop/poker-tracker/src/lib"
MOBILE_LIB="/Users/Steph/Desktop/poker-tracker-mobile/src/lib"

# Copy pure logic files
cp "$WEB_LIB/types.ts" "$MOBILE_LIB/"
cp "$WEB_LIB/db.ts" "$MOBILE_LIB/"
cp "$WEB_LIB/settlement.ts" "$MOBILE_LIB/"
cp "$WEB_LIB/chipDistribution.ts" "$MOBILE_LIB/"
cp "$WEB_LIB/supabase.ts" "$MOBILE_LIB/supabase.ts.backup"

echo "✅ Copied reusable files"
echo "⚠️  Don't forget to adapt supabase.ts for AsyncStorage"
# Check imports in lib files
for file in src/lib/*.ts; do
  echo "=== $file ==="
  head -20 "$file" | grep "^import"
done
```

### Reusability Map (Current Codebase)

#### ✅ Can Reuse 100% (Copy & Paste)

| File | Purpose | Why Reusable | Dependencies |
|------|---------|--------------|--------------|
| `src/lib/types.ts` | TypeScript interfaces | Pure types, no runtime code | None |
| `src/lib/db.ts` | Supabase CRUD operations | Only uses Supabase client | `@supabase/supabase-js` |
| `src/lib/settlement.ts` | Settlement calculation logic | Pure math/algorithms | None (just types) |
| `src/lib/chipDistribution.ts` | Chip distribution algorithm | Pure algorithms | None (just types) |

**How AI finds these:**
- Look in `src/lib/` folder
- Check files have no React component exports
- Verify no DOM/window usage
- Confirm only TypeScript types and pure functions

#### 🔧 Needs Adaptation (~20% changes)

| File | Purpose | What to Change | How to Adapt |
|------|---------|----------------|--------------|
| `src/lib/supabase.ts` | Supabase client init | Replace `localStorage` | Use `AsyncStorage` from `@react-native-async-storage/async-storage` |

**Adaptation Example:**
```typescript
// WEB VERSION (src/lib/supabase.ts)
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(URL, KEY)
// Uses localStorage by default

// REACT NATIVE VERSION
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import 'react-native-url-polyfill/auto'

export const supabase = createClient(URL, KEY, {
  auth: {
   bash
# analyze-reusability.sh
# Run from /Users/Steph/Desktop/poker-tracker

#!/bin/bash

WEB_SRC="/Users/Steph/Desktop/poker-tracker/src"

echo "Analyzing reusability of web app files..."
echo ""

# Check lib files
echo "=== LIB FILES (Likely Reusable) ==="
for file in "$WEB_SRC/lib"/*.ts; do
  if grep -q "localStorage\|sessionStorage\|document\|window" "$file"; then
    echo "🔧 NEEDS_ADAPTATION  $(basename $file)"
  else
    echo "✅ REUSABLE          $(basename $file)"
  fi
done

echo ""
echo "=== COMPONENT FILES (Need Rewrite) ==="
find "$WEB_SRC/components" -name "*.tsx" -exec basename {} \; | while read file; do
  echo "❌ REWRITE           $file"
done

echo ""
echo "=== ROOT FILES ==="
for file in "$WEB_SRC"/*.tsx; do
  echo "❌ REWRITE           $(basename $file)"
done
```

**Expected Output:**
```
Analyzing reusability of web app files...

=== LIB FILES (Likely Reusable) ===
✅ REUSABLE          types.ts
✅ REUSABLE          db.ts
✅ REUSABLE          settlement.ts
✅ REUSABLE          chipDistribution.ts
🔧 NEEDS_ADAPTATION  supabase.ts
✅ REUSABLE          utils.ts

=== COMPONENT FILES (Need Rewrite) ===
❌ REWRITE           GamesList.tsx
❌ REWRITE           GameDetail.tsx
❌ REWRITE           CreateSessionDialog.tsx
❌ REWRITE           ChipDistributionDialog.tsx

=== ROOT FILES ===
❌ REWRITE           App.tsx
❌ REWRITE           ErrorFallback
    re/Users/Steph/Desktop/poker-tracker/src/lib/types.ts` ✅ 100% Reusable
```bash
# Copy directly to mobile project
cp /Users/Steph/Desktop/poker-tracker/src/lib/types.ts \
   /Users/Steph/Desktop/poker-tracker-mobile/src/lib/
```
```typescript
// Just interfaces - works everywhere
export interface Game { ... }
export interface Player { ... }
export interface Transaction { ... }
// No dependencies, no runtime code
```

#### `/Users/Steph/Desktop/poker-tracker/src/lib/db.ts` ✅ 100% Reusable
```bash
# Copy directly to mobile project
cp /Users/Steph/Desktop/poker-tracker/src/lib/db.ts \
   /Users/Steph/Desktop/poker-tracker-mobile/src/lib/
```
```typescript
// Pure Supabase operations
export async function createGame(params: CreateGameParams) {
  const { data, error } = await supabase.from('games').insert(...)
  // No DOM, no web APIs, just Supabase client
}
```

#### `/Users/Steph/Desktop/poker-tracker/src/lib/settlement.ts` ✅ 100% Reusable
```bash
# Copy directly to mobile project
cp /Users/Steph/Desktop/poker-tracker/src/lib/settlement.ts \
   /Users/Steph/Desktop/poker-tracker-mobile/src/lib/
```
```typescript
// Pure calculation logic
export function calculateSettlements(players: Player[]): Settlement[] {
  // Just math and algorithms
  // No external dependencies
}
```

#### `/Users/Steph/Desktop/poker-tracker/src/lib/chipDistribution.ts` ✅ 100% Reusable
```bash
# Copy directly to mobile project
cp /Users/Steph/Desktop/poker-tracker/src/lib/chipDistribution.ts \
   /Users/Steph/Desktop/poker-tracker-mobile/src/lib/
```
```typescript
// Pure algorithm
export function calculateChipDistribution(input: ChipDistributionInput) {
  // Recursive backtracking
  // No dependencies on web or mobile
}
```

#### `/Users/Steph/Desktop/poker-tracker/src/lib/supabase.ts` 🔧 Needs Adaptation
```bash
# Copy as template, then edit
cp /Users/Steph/Desktop/poker-tracker/src/lib/supabase.ts \
   /Users/Steph/Desktop/poker-tracker-mobile/src/lib/supabase.ts
   
# Now edit /Users/Steph/Desktop/poker-tracker-mobile/src/lib/supabase.ts
```
```typescript
// WEB: Uses localStorage implicitly
export const supabase = createClient(URL, KEY)

// MOBILE: Explicitly pass AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage'
export const supabase = createClient(URL, KEY, {
  auth: { storage: AsyncStorage }
})
```

#### `/Users/Steph/Desktop/poker-tracker/src/components/GamesList.tsx` ❌ Complete Rewrite
```bash
# DO NOT COPY - rebuild from scratch in mobile project
# /Users/Steph/Desktop/poker-tracker-mobile/src/screens/GamesListScreen.tsx
```
```typescript
// WEB (Chakra UI)
import { Box, Button, Card } from '@chakra-ui/react'

// MOBILE (React Native)
import { View, TouchableOpacity, FlatList
```

#### `src/lib/chipDistribution.ts` ✅ 100% Reusable
```typescript
// Pure algorithm
export function calculateChipDistribution(input: ChipDistributionInput) {
  // Recursive backtracking
  // No dependencies on web or mobile
}
```

#### `src/lib/supabase.ts` 🔧 Needs Adaptation
```typescript
// WEB: Uses localStorage implicitly
export const supabase = createClient(URL, KEY)

// MOBILE: Explicitly pass AsyncStorage
export const supabase = createClient(URL, KEY, {
  auth: { storage: AsyncStorage }
})
```

#### `src/components/GamesList.tsx` ❌ Complete Rewrite
```typescript
// Uses Chakra UI components
import { Box, Button, Card } from '@chakra-ui/react'

// Needs React Native equivalent
import { View, TouchableOpacity } from 'react-native'
import { Card, Button } from 'react-native-paper'
```

---

## Resources

### Documentation
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)

### UI Libraries
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [NativeBase](https://nativebase.io/)
- [React Native Elements](https://reactnativeelements.com/)

### Tools
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Flipper](https://fbflipper.com/)
- [Reactotron](https://github.com/infinitered/reactotron)

---

## Next Steps

1. **Proof of Concept** (1 day)
   - Setup basic Expo app
   - Test Supabase connection
   - Create one screen (GamesList)
   - Validate approach

2. **Go/No-Go Decision**
   - Review POC results
   - Confirm timeline acceptable
   - Budget approval if needed

3. **Start Phase 1**
   - Follow this plan
   - Track progress daily
   - Adjust timeline as needed

---

## Conclusion

Complete migration to mobile-only is straightforward. Simply:

1. Create new Expo project
2. Copy 5 files from `/Users/Steph/Desktop/poker-tracker/src/lib/`
3. Change 1 line in supabase.ts (add AsyncStorage)
4. Rebuild UI with React Native components

**No monorepo complexity, no code sharing, just a clean mobile app.** All business logic (40% of codebase) is 100% reusable. Estimated 3-4 weeks for full migration. You can archive the web repo once mobile is done.
