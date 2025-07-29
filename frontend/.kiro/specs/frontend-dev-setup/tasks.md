# Implementation Plan

- [x] 1. Remove Jest/Vitest dependencies and configuration
  - Remove Jest/Vitest related dependencies from package.json
  - Delete test configuration files and test scripts
  - Remove existing test files from the project
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Install and configure Tailwind CSS with PostCSS
  - Install Tailwind CSS, PostCSS, and autoprefixer dependencies
  - Create tailwind.config.js with custom yellow theme configuration
  - Create postcss.config.js for PostCSS processing
  - Add Tailwind directives to main CSS file
  - _Requirements: 2.1, 2.4_

- [x] 3. Initialize and configure shadcn/ui with yellow theme
  - Install shadcn/ui CLI and initialize project configuration
  - Configure components.json with yellow theme settings
  - Create custom CSS variables for yellow theme colors
  - Set up shadcn/ui utilities and base styles
  - _Requirements: 2.2, 2.3, 2.5_

- [x] 4. Install shadcn/ui components and API request dependencies
  - Install required shadcn/ui components (Button, Card, Textarea, Tabs, Badge)
  - Install fetchEventSource dependency for streaming functionality
  - Install ahooks dependency for request management
  - Update TypeScript types for new dependencies
  - _Requirements: 2.1, 3.1, 4.1_

- [x] 5. Migrate main application styling to Tailwind CSS
  - Replace existing CSS classes in App.css with Tailwind utilities
  - Convert layout styles to Tailwind responsive design classes
  - Update component styling to use Tailwind color and spacing utilities
  - Remove unused CSS after migration
  - _Requirements: 2.4, 5.2_

- [x] 6. Replace UI components with shadcn/ui equivalents
  - Replace existing buttons with shadcn/ui Button components
  - Convert textarea elements to shadcn/ui Textarea components
  - Migrate tab navigation to shadcn/ui Tabs component
  - Replace digest cards with shadcn/ui Card components
  - _Requirements: 2.3, 2.5, 5.1_

- [x] 7. Implement fetchEventSource for streaming functionality
  - Replace native fetch streaming in generateDigestStream method with fetchEventSource
  - Replace native fetch streaming in testGeminiChat method with fetchEventSource
  - Implement proper error handling and reconnection logic for streaming
  - Maintain existing Server-Sent Events data parsing functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 8. Integrate ahooks useRequest for standard API calls
  - Replace fetchPastDigests method with ahooks useRequest hook
  - Replace generateDigest method with ahooks useRequest hook
  - Update component state management to use useRequest loading and error states
  - Implement proper error handling with useRequest error states
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 9. Apply yellow theme consistently across all components
  - Update all shadcn/ui components to use yellow theme colors
  - Ensure consistent yellow theme application in custom components
  - Verify color contrast and accessibility compliance
  - Test theme consistency across different component states
  - _Requirements: 2.2, 2.5_

- [ ] 10. Test and verify all functionality works correctly
  - Verify streaming chat functionality works with fetchEventSource
  - Test standard API requests work with ahooks useRequest
  - Confirm all UI components render correctly with yellow theme
  - Ensure application builds and runs without errors
  - _Requirements: 3.4, 4.3, 5.3, 5.4_