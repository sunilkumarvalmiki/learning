# Frontend Quality Agent

## Mission
Ensure React UI components and Tauri desktop application achieve production-grade quality through accessibility, performance, testing, and modern best practices.

## Scope
- `/ai-knowledge-ui/` - React component library
- `/ai-knowledge-system/` - Tauri desktop app
- Component architecture
- Accessibility (a11y)
- Performance optimization
- Testing coverage

## Current State Assessment

### Strengths (UI Library)
- 11 production components
- 125 tests via Storybook + Vitest
- React 19.2 (latest)
- Storybook 10 with a11y addon
- TypeScript strict mode
- ESLint configured

### Strengths (Tauri App)
- Tauri 2.0 (latest)
- React 19.1
- 3 E2E test specs
- Custom hooks (useDebounce, useFocusTrap)
- HTTP API integration

### Gaps Identified
- No explicit unit tests for UI library (only Storybook)
- Limited E2E test coverage
- No accessibility audit automation
- No performance testing
- No visual regression testing
- Missing React Testing Library tests
- No bundle size monitoring
- Limited error boundaries

## Research Areas

### 1. React Best Practices (2024-2025)
**Sources to research:**
- React Official Docs (react.dev)
- React Server Components (Next.js 14 docs)
- Kent C. Dodds - React Testing Best Practices
- Web.dev - React Performance

**Focus areas:**
- React 19 features (use hook, transitions)
- Component composition patterns
- Performance optimization (useMemo, useCallback)
- Error boundaries
- Suspense and loading states
- Code splitting strategies

### 2. Accessibility (WCAG 2.1 AA)
**Sources:**
- W3C WCAG 2.1 Guidelines
- MDN Accessibility Guide
- axe-core best practices
- ARIA Authoring Practices Guide (APG)

**Focus areas:**
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Focus management
- ARIA attributes
- Semantic HTML
- Form validation accessibility

### 3. Component Testing
**Sources:**
- React Testing Library docs
- Testing Library Best Practices
- Vitest documentation
- Playwright Component Testing

**Focus areas:**
- Unit tests with React Testing Library
- User-centric testing approach
- Accessibility testing automation
- Visual regression testing (Percy, Chromatic)
- Mock strategies (MSW for API)

### 4. Performance Optimization
**Sources:**
- Web Vitals (Core Web Vitals)
- Chrome DevTools Performance
- React Profiler
- Lighthouse CI

**Focus areas:**
- Bundle size optimization
- Code splitting
- Lazy loading
- Image optimization
- Tree shaking
- CSS optimization
- Runtime performance

### 5. Tauri Best Practices
**Sources:**
- Tauri v2 Documentation
- Tauri Security Guide
- Rust + React Integration
- Desktop App Performance

**Focus areas:**
- IPC optimization
- Window management
- Native API usage
- Security practices
- Update mechanism
- Crash reporting

## Improvement Tasks

### Priority 1: Critical (Accessibility & Testing)

#### Task 1.1: Accessibility Audit & Fixes
**Research:**
- Run axe-core audit on all components
- Review WCAG 2.1 AA requirements
- Check keyboard navigation patterns
- Review ARIA APG patterns

**Implementation:**
- Fix all critical a11y issues
- Add ARIA attributes where missing
- Ensure keyboard navigation
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Add skip links
- Ensure color contrast

**Files to audit:**
- All components in `ai-knowledge-ui/src/components/`
- Tauri app components in `ai-knowledge-system/src/components/`

**Acceptance criteria:**
- Zero critical axe violations
- All interactive elements keyboard accessible
- Proper focus indicators
- Screen reader announcements correct
- Color contrast ratios ≥4.5:1
- ARIA labels on all controls

#### Task 1.2: React Testing Library Tests
**Research:**
- Compare Storybook tests vs RTL unit tests
- Review testing-library best practices
- Learn user-centric testing approach

**Implementation:**
- Add RTL tests for all 11 components
- Test user interactions (click, type, keyboard)
- Test accessibility with jest-axe
- Test error states
- Test loading states

**Files to create:**
- `ai-knowledge-ui/src/components/**/*.test.tsx` (11 files)
- `ai-knowledge-ui/src/test-utils.tsx` (render helpers)

**Acceptance criteria:**
- All components have RTL tests
- User interactions tested
- Accessibility tested with jest-axe
- Edge cases covered
- Coverage >90%

#### Task 1.3: E2E Test Expansion (Tauri)
**Research:**
- Playwright best practices
- Page Object Model pattern
- E2E testing strategies

**Implementation:**
- Add comprehensive E2E tests
- Test critical user flows
- Test authentication flows
- Test document upload/delete
- Test search functionality
- Test error handling

**Files to create:**
- `ai-knowledge-system/tests/e2e/auth.spec.ts`
- `ai-knowledge-system/tests/e2e/documents.spec.ts`
- `ai-knowledge-system/tests/e2e/search-advanced.spec.ts`
- `ai-knowledge-system/tests/page-objects/` (POM pattern)

**Acceptance criteria:**
- Critical user flows tested
- 15+ E2E test scenarios
- Page Object Model pattern used
- Tests run in CI
- Screenshots on failure

### Priority 2: High (Performance & Quality)

#### Task 2.1: Performance Optimization
**Research:**
- Analyze bundle size with webpack-bundle-analyzer
- Review React DevTools Profiler
- Check Lighthouse scores
- Research code splitting strategies

**Implementation:**
- Implement code splitting
- Lazy load components
- Optimize bundle size
- Add performance monitoring
- Optimize images
- Remove unused dependencies

**Files to modify:**
- `ai-knowledge-ui/vite.config.ts` (bundle optimization)
- `ai-knowledge-system/vite.config.ts` (code splitting)
- Add lazy loading in route components

**Acceptance criteria:**
- Bundle size <150KB (gzipped)
- Lighthouse Performance >90
- First Contentful Paint <1.5s
- Time to Interactive <3s
- Tree shaking working
- No duplicate dependencies

#### Task 2.2: Error Boundaries
**Research:**
- React Error Boundary patterns
- Error tracking (Sentry for Electron/Tauri)
- Graceful degradation strategies

**Implementation:**
- Add error boundaries to all apps
- Create fallback UI components
- Implement error logging
- Add retry mechanisms
- User-friendly error messages

**Files to create:**
- `ai-knowledge-ui/src/components/ErrorBoundary/ErrorBoundary.tsx`
- `ai-knowledge-system/src/components/ErrorBoundary.tsx`
- `ai-knowledge-system/src/utils/errorTracking.ts`

**Acceptance criteria:**
- Top-level error boundary
- Per-route error boundaries
- Error details logged (non-production)
- User sees friendly error UI
- Retry button where applicable

#### Task 2.3: Visual Regression Testing
**Research:**
- Chromatic vs Percy vs Playwright screenshots
- Visual diff strategies
- Snapshot testing best practices

**Implementation:**
- Add visual regression testing
- Configure Chromatic with Storybook
- Add screenshot tests to Playwright
- Create baseline images

**Files to modify:**
- `.github/workflows/ai-knowledge-ui-ci.yml` (add Chromatic)
- `ai-knowledge-system/playwright.config.ts` (screenshots)

**Acceptance criteria:**
- Visual regression tests in CI
- Baseline images committed
- PR checks include visual diffs
- Storybook published to Chromatic

### Priority 3: Medium (Code Quality & Patterns)

#### Task 3.1: Component Architecture Review
**Research:**
- Atomic design principles
- Component composition patterns
- Props vs Context
- Custom hooks best practices

**Implementation:**
- Review component structure
- Extract shared logic to hooks
- Reduce prop drilling with Context
- Create compound components where appropriate
- Ensure single responsibility

**Files to review:**
- All component files
- Identify refactoring opportunities

**Acceptance criteria:**
- No components >200 lines
- Prop drilling <3 levels
- Shared logic in custom hooks
- Clear component responsibilities
- Compound components where appropriate

#### Task 3.2: TypeScript Strictness
**Research:**
- TypeScript 5.x new features
- Strict mode best practices
- Type inference optimization

**Implementation:**
- Enable all strict flags
- Remove `any` types
- Add proper generics
- Use discriminated unions
- Type all props and state

**Files to modify:**
- `tsconfig.json` files (enable strict flags)
- Fix any type errors

**Acceptance criteria:**
- No `any` types (except unavoidable)
- All props typed
- Strict mode enabled
- Generic types where appropriate
- Type errors = 0

#### Task 3.3: Storybook Enhancement
**Research:**
- Storybook 10 new features
- Docs addon best practices
- Controls addon optimization

**Implementation:**
- Add more story variants
- Improve docs pages
- Add interactive controls
- Document design tokens
- Add dark mode stories

**Files to modify:**
- All `.stories.tsx` files
- `.storybook/preview.ts` (global decorators)

**Acceptance criteria:**
- Each component has 5+ stories
- Controls for all props
- Docs addon configured
- Design tokens documented
- Dark mode supported

### Priority 4: Low (Developer Experience)

#### Task 4.1: Component Generator
**Research:**
- Plop.js component generators
- Hygen templates
- Best practices for templates

**Implementation:**
- Create component generator script
- Template for new components
- Auto-generate test files
- Auto-generate story files

**Files to create:**
- `ai-knowledge-ui/scripts/generate-component.js`
- `ai-knowledge-ui/templates/Component.tsx.template`

**Acceptance criteria:**
- `npm run generate:component ComponentName`
- Creates component, test, story, CSS
- Follows project conventions
- Saves development time

#### Task 4.2: Bundle Analysis Automation
**Research:**
- rollup-plugin-visualizer
- vite-bundle-visualizer
- Bundle size tracking

**Implementation:**
- Add bundle analyzer to build
- Track bundle size over time
- Add CI check for size increases
- Generate bundle reports

**Files to modify:**
- `vite.config.ts` (add plugin)
- `.github/workflows/*.yml` (bundle size check)

**Acceptance criteria:**
- Bundle report generated on build
- CI fails if bundle >150KB
- Size tracking in commits
- Visualizer accessible locally

## Tauri-Specific Tasks

### Task T1: IPC Optimization
**Research:**
- Tauri IPC best practices
- Rust async patterns
- Performance profiling

**Implementation:**
- Review all IPC calls
- Batch operations where possible
- Optimize serialization
- Add IPC monitoring

**Acceptance criteria:**
- IPC calls <50ms p99
- No blocking operations
- Proper error handling
- Monitoring dashboard

### Task T2: Native Features
**Research:**
- Tauri system tray
- Native notifications
- File system watch
- Auto-update implementation

**Implementation:**
- Add system tray icon
- Native notifications for events
- Watch document folder
- Implement auto-update

**Acceptance criteria:**
- System tray working
- Notifications non-intrusive
- File watching efficient
- Auto-update tested

## Testing Strategy

### Unit Tests (React Testing Library)
- Test component rendering
- Test user interactions
- Test accessibility
- Test edge cases
- Fast (<100ms per test)

### Integration Tests (Storybook)
- Visual testing
- Component combinations
- State management
- API mocking

### E2E Tests (Playwright)
- Critical user journeys
- Cross-component flows
- Authentication
- Error scenarios

### Coverage Goals
- Components: >90%
- Utilities: >95%
- Hooks: >90%
- Overall: >85%

## Validation Checklist

- [ ] All tests passing (npm test)
- [ ] No ESLint errors
- [ ] No TypeScript errors
- [ ] axe-core violations = 0
- [ ] Lighthouse score >90
- [ ] Bundle size <150KB
- [ ] E2E tests passing
- [ ] Storybook builds successfully

## Success Metrics

### Before
- Test files: 11 stories + 3 E2E
- Test coverage: Unknown
- axe violations: Unknown
- Bundle size: Unknown
- Lighthouse: Unknown

### Target
- Test files: 11 RTL + 11 stories + 15 E2E
- Test coverage: >85%
- axe violations: 0 critical
- Bundle size: <150KB
- Lighthouse: >90

## Output Report Template

```markdown
## Frontend Quality Agent Report

### Execution Date
YYYY-MM-DD

### Components Analyzed
- UI Library: 11 components
- Tauri App: 12 components

### Accessibility Improvements
- Critical violations fixed: N
- Keyboard navigation enhanced: N components
- ARIA attributes added: N locations
- Screen reader tested: ✓

### Testing Improvements
- RTL tests added: N files
- E2E tests added: N scenarios
- Coverage increased: XX% → YY%

### Performance Improvements
- Bundle size: XXkB → YYkB
- Lighthouse score: XX → YY
- Load time: XXms → YYms

### Code Quality
- TypeScript errors fixed: N
- ESLint issues fixed: N
- Components refactored: N

### Next Priorities
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]
```

---

**Status**: Ready to execute
**Priority**: P1 - Critical
**Estimated Time**: 4-6 hours
**Dependencies**: None
**Version**: 1.0
