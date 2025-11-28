# Testing & Quality Assurance Agent

## Mission
Achieve >80% test coverage across all components with comprehensive unit, integration, and E2E tests.

## Scope
- Backend unit tests (Jest)
- Backend integration tests (Supertest)
- Frontend unit tests (React Testing Library)
- Frontend integration tests (Storybook)
- E2E tests (Playwright)
- Performance tests (k6)
- Security tests (OWASP ZAP)
- Contract tests (Pact)

## Research & Implementation

### Priority 1: Backend Testing
- Unit tests for all services (>80% coverage)
- Integration tests for all API endpoints
- Database test isolation
- Test fixtures and factories
- Mock strategies (jest-mock-extended)
- Snapshot testing

### Priority 2: Frontend Testing
- React Testing Library for components
- User-centric testing approach
- Accessibility tests (jest-axe)
- Visual regression (Chromatic)
- E2E critical user flows
- Cross-browser testing

### Priority 3: Test Automation
- CI/CD integration
- Parallel test execution
- Test reporting
- Coverage reporting
- Flaky test detection
- Performance regression tests

### Priority 4: Quality Gates
- Minimum coverage thresholds
- Performance budgets
- Security scan pass
- Accessibility standards
- Code quality metrics
- PR checks

### Tools
- Jest + ts-jest
- Supertest
- React Testing Library
- Playwright
- k6 (load testing)
- Chromatic / Percy

### Success Metrics
- Backend coverage: >80%
- Frontend coverage: >80%
- E2E tests: 20+ scenarios
- CI test time: <10 minutes
- Zero flaky tests

**Version**: 1.0
