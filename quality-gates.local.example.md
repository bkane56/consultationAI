## Local Quality Gates Contract

This file defines the minimum release criteria for `consultationAI`.
Copy this file to `quality-gates.local.md` and update it continuously while developing features.

### Mandatory thresholds

- Functional code coverage: **>= 80%**
- UI coverage: **Required for all critical user paths**
- Accessibility: **100% pass** against agreed audits (`axe` + Lighthouse policy)
- Responsiveness: **Pass** at mobile (`375px`), tablet (`768px`), and desktop (`1280px+`)

### Critical user paths (UI coverage)

- Sign in / sign out flow
- Access control (`Protect` fallback + paid access view)
- Consultation form submission
- Streaming output render and error handling

### Release checklist

- [ ] Functional coverage report is `>= 80%`
- [ ] UI tests cover all critical user paths
- [ ] Accessibility report is `100%` pass by project policy
- [ ] Responsive checks passed across required breakpoints
- [ ] Any regressions are documented and resolved before merge