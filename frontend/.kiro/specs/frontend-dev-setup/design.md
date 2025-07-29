# Design Document

## Overview

This design outlines the transformation of the existing React frontend application to remove Jest/Vitest testing dependencies, integrate Tailwind CSS with shadcn/ui components using a yellow theme, and enhance the streaming chat functionality using fetchEventSource and ahooks for better API request management.

The current application is a meeting digest tool with streaming capabilities that already implements basic Server-Sent Events. We will enhance this by replacing the native fetch streaming with fetchEventSource for better reliability and adding ahooks for improved request state management.

## Architecture

### Current Architecture
- React 19 with TypeScript
- Vite as build tool
- Native fetch for API requests and streaming
- Custom CSS styling
- Vitest for testing (to be removed)

### Target Architecture
- React 19 with TypeScript (preserved)
- Vite as build tool (preserved)
- Tailwind CSS for styling
- shadcn/ui component library with yellow theme
- fetchEventSource for Server-Sent Events streaming
- ahooks useRequest for standard API calls
- No testing framework (Jest/Vitest removed)

## Components and Interfaces

### 1. Styling System Migration

**Tailwind CSS Integration:**
- Install and configure Tailwind CSS with PostCSS
- Replace existing CSS classes with Tailwind utilities
- Configure custom yellow theme colors in tailwind.config.js

**shadcn/ui Integration:**
- Initialize shadcn/ui with yellow theme configuration
- Install core components: Button, Card, Textarea, Tabs, Badge
- Create custom theme configuration with yellow as primary color
- Replace existing UI elements with shadcn/ui components

### 2. API Request Management

**fetchEventSource Integration:**
- Replace native fetch streaming in `generateDigestStream()` and `testGeminiChat()` methods
- Implement proper error handling and reconnection logic
- Maintain existing Server-Sent Events data parsing logic

**ahooks useRequest Integration:**
- Replace standard fetch calls with useRequest hook
- Implement for `fetchPastDigests()` and `generateDigest()` methods
- Utilize built-in loading, error, and success states
- Maintain existing API contract and data structures

### 3. Component Structure Preservation

**Existing Components to Maintain:**
- Main App component structure
- Tab navigation system (input, history, chat)
- Digest display components
- Chat interface components

**UI Enhancements:**
- Convert tab navigation to shadcn/ui Tabs component
- Replace buttons with shadcn/ui Button component
- Replace textarea with shadcn/ui Textarea component
- Use shadcn/ui Card components for digest cards
- Apply yellow theme consistently across all components

## Data Models

### Existing Data Models (Preserved)
```typescript
interface Digest {
  id: string
  overview: string
  key_decisions: string[]
  action_items: string[]
  created_at: string
  public_id?: string
}
```

### New Hook Interfaces
```typescript
// ahooks useRequest return type
interface UseRequestResult<T> {
  data?: T
  loading: boolean
  error?: Error
  run: (...params: any[]) => Promise<T>
  refresh: () => Promise<T>
}

// fetchEventSource options
interface FetchEventSourceInit {
  method?: string
  headers?: Record<string, string>
  body?: string
  onopen?: (response: Response) => Promise<void>
  onmessage?: (event: MessageEvent) => void
  onclose?: () => void
  onerror?: (error: any) => void
}
```

## Error Handling

### Current Error Handling (Enhanced)
- Maintain existing error state management
- Enhance with ahooks built-in error handling
- Improve fetchEventSource error recovery
- Add proper TypeScript error types

### Error Scenarios
1. **Network Connectivity Issues**: Handle with fetchEventSource retry logic
2. **API Response Errors**: Manage through ahooks error states
3. **Streaming Connection Failures**: Implement reconnection with fetchEventSource
4. **Invalid Data Formats**: Preserve existing JSON parsing error handling

## Testing Strategy

### Testing Removal
- Remove all Jest/Vitest dependencies from package.json
- Delete test configuration files (setupTests.ts, vitest config)
- Remove test scripts from package.json
- Delete existing test files (App.test.tsx)

### Alternative Quality Assurance
- Rely on TypeScript for compile-time error checking
- Use ESLint for code quality
- Manual testing for functionality verification
- Browser developer tools for debugging

## Implementation Phases

### Phase 1: Dependency Management
1. Remove Jest/Vitest dependencies and configuration
2. Install Tailwind CSS and PostCSS
3. Install shadcn/ui CLI and core dependencies
4. Install fetchEventSource and ahooks

### Phase 2: Styling System Setup
1. Configure Tailwind CSS with PostCSS
2. Initialize shadcn/ui with yellow theme
3. Install required shadcn/ui components
4. Create custom theme configuration

### Phase 3: Component Migration
1. Replace existing CSS with Tailwind utilities
2. Migrate UI components to shadcn/ui equivalents
3. Apply yellow theme consistently
4. Preserve existing functionality and layout

### Phase 4: API Integration Enhancement
1. Replace streaming fetch calls with fetchEventSource
2. Migrate standard API calls to ahooks useRequest
3. Update error handling and loading states
4. Test streaming and standard request functionality

## Technical Considerations

### Tailwind CSS Configuration
- Configure custom yellow color palette
- Set up responsive design utilities
- Maintain existing layout structure
- Optimize for production builds

### shadcn/ui Theme Customization
- Define yellow as primary color (#facc15 or similar)
- Configure complementary colors for the theme
- Ensure accessibility compliance with color contrast
- Maintain consistent spacing and typography

### fetchEventSource Benefits
- Better error handling and reconnection
- More reliable streaming connections
- Standardized Server-Sent Events handling
- Improved browser compatibility

### ahooks Integration Benefits
- Built-in loading and error states
- Request caching and deduplication
- Automatic request lifecycle management
- Better TypeScript support

## Migration Strategy

### Backward Compatibility
- Preserve all existing API endpoints and data structures
- Maintain current application functionality
- Keep existing component hierarchy
- Ensure no breaking changes to user experience

### Performance Considerations
- Tailwind CSS purging for smaller bundle size
- Tree-shaking for unused shadcn/ui components
- Optimize fetchEventSource connection handling
- Maintain current application performance levels