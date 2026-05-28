import '@testing-library/jest-dom/vitest';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

const jestAxeMatchers: Parameters<typeof expect.extend>[0] = {
  toHaveNoViolations,
};

expect.extend(jestAxeMatchers);
