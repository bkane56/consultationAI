import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import Product from '../../pages/product';
import { fetchEventSource } from '@microsoft/fetch-event-source';

const { getTokenMock } = vi.hoisted(() => ({
  getTokenMock: vi.fn().mockResolvedValue('token'),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ getToken: getTokenMock }),
  UserButton: () => <div>User</div>,
  PricingTable: () => <div>Pricing</div>,
  Protect: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-datepicker', () => ({
  default: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input data-testid="visit-date" value="2026-01-15" readOnly {...props} />
  ),
}));

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: vi.fn(),
}));

const fetchEventSourceMock = vi.mocked(fetchEventSource);

afterEach(() => {
  getTokenMock.mockReset();
  getTokenMock.mockResolvedValue('token');
  fetchEventSourceMock.mockReset();
  cleanup();
});

describe('Product page quality gates', () => {
  it('renders required critical-path fields and action button', () => {
    render(<Product />);

    expect(screen.getByLabelText(/patient name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/consultation notes/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate summary/i })).toBeInTheDocument();
  });

  it('passes basic accessibility checks', async () => {
    const { container } = render(<Product />);
    const result = await axe(container);
    expect(result.violations).toEqual([]);
  });

  it.each([
    [375, 667],
    [768, 1024],
    [1280, 800],
  ])('supports responsive viewport %ipx x %ipx', (width, height) => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
    window.dispatchEvent(new Event('resize'));

    render(<Product />);
    expect(screen.getByRole('button', { name: /generate summary/i })).toBeVisible();
  });

  it('shows authentication-required message when token is unavailable', async () => {
    getTokenMock.mockResolvedValueOnce(null);
    const user = userEvent.setup();
    render(<Product />);

    await user.type(screen.getByLabelText(/patient name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/consultation notes/i), 'Patient follow-up notes');
    await user.click(screen.getByRole('button', { name: /generate summary/i }));

    expect(await screen.findByText(/authentication required/i)).toBeInTheDocument();
    expect(fetchEventSourceMock).not.toHaveBeenCalled();
  });

  it('submits and renders streamed output', async () => {
    fetchEventSourceMock.mockImplementation(async (_url, handlers) => {
      handlers.onmessage({ data: 'Line 1' });
      handlers.onmessage({ data: '\nLine 2' });
      handlers.onclose();
    });

    const user = userEvent.setup();
    render(<Product />);

    await user.type(screen.getByLabelText(/patient name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/consultation notes/i), 'Patient follow-up notes');
    await user.click(screen.getByRole('button', { name: /generate summary/i }));

    expect(fetchEventSourceMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/line 1/i)).toBeInTheDocument();
    expect(await screen.findByText(/line 2/i)).toBeInTheDocument();
  });

  it('handles stream errors and returns to idle state', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    fetchEventSourceMock.mockImplementation(async (_url, handlers) => {
      handlers.onerror(new Error('stream failed'));
    });

    const user = userEvent.setup();
    render(<Product />);

    await user.type(screen.getByLabelText(/patient name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/consultation notes/i), 'Patient follow-up notes');
    await user.click(screen.getByRole('button', { name: /generate summary/i }));

    expect(fetchEventSourceMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('button', { name: /generate summary/i })).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
