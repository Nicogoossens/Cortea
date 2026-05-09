/**
 * Unit tests for <LanguageSwitcher /> server-sync behaviour.
 *
 * Verifies that selecting a new locale while authenticated triggers
 * PATCH /api/users/profile with { language_code, explicit_language_choice: true }
 * so the server stays in sync across devices.
 */

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { LanguageSwitcher } from "@/components/language-switcher";

const mockSetLocale = vi.fn();

vi.mock("@/lib/i18n", () => ({
  useLocale: () => ({
    locale: "en-GB" as const,
    setLocale: mockSetLocale,
    t: (k: string) => k,
    dir: "ltr" as const,
    language: "en" as const,
  }),
}));

let mockIsAuthenticated = true;

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    userId: "user-test-123",
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/active-region", () => ({
  FlagEmoji: ({ code }: { code: string }) => <span data-testid="flag">{code}</span>,
}));

function makeFetch(ok = true) {
  return vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify({ ok: true }), {
        status: ok ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      })
    )
  );
}

beforeEach(() => {
  mockSetLocale.mockClear();
  mockIsAuthenticated = true;
  cleanup();
});

describe("LanguageSwitcher — PATCH on locale change (authenticated)", () => {
  it("opens the dropdown when the button is clicked", async () => {
    vi.stubGlobal("fetch", makeFetch());

    render(<LanguageSwitcher />);

    const trigger = screen.getByRole("button", { expanded: false });
    fireEvent.click(trigger);

    const listbox = await screen.findByRole("listbox");
    expect(listbox).toBeTruthy();
  });

  it("calls setLocale immediately when a locale option is clicked", async () => {
    vi.stubGlobal("fetch", makeFetch());

    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));

    const options = await screen.findAllByRole("option");
    const unselected = options.find((o) => o.getAttribute("aria-selected") === "false")!;
    fireEvent.click(unselected);

    expect(mockSetLocale).toHaveBeenCalledTimes(1);
  });

  it("calls PATCH /api/users/profile with language_code and explicit_language_choice: true", async () => {
    const fetchMock = makeFetch();
    vi.stubGlobal("fetch", fetchMock);

    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));

    const options = await screen.findAllByRole("option");
    const unselected = options.find((o) => o.getAttribute("aria-selected") === "false")!;
    fireEvent.click(unselected);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/profile"),
        expect.objectContaining({
          method: "PATCH",
          credentials: "include",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
          body: expect.stringContaining('"explicit_language_choice":true'),
        })
      );
    });

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(callBody).toMatchObject({
      language_code: expect.stringMatching(/^[a-z]{2,3}$/),
      explicit_language_choice: true,
    });
  });

  it("sends only the base language code (no region suffix) to the server", async () => {
    const fetchMock = makeFetch();
    vi.stubGlobal("fetch", fetchMock);

    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));

    const options = await screen.findAllByRole("option");
    const unselected = options.find((o) => o.getAttribute("aria-selected") === "false")!;
    fireEvent.click(unselected);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(callBody.language_code).not.toContain("-");
  });
});

describe("LanguageSwitcher — no PATCH when unauthenticated", () => {
  it("does NOT call fetch when the user is not signed in", async () => {
    mockIsAuthenticated = false;
    const fetchMock = makeFetch();
    vi.stubGlobal("fetch", fetchMock);

    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));

    const options = await screen.findAllByRole("option");
    const unselected = options.find((o) => o.getAttribute("aria-selected") === "false")!;
    fireEvent.click(unselected);

    expect(mockSetLocale).toHaveBeenCalledTimes(1);

    await new Promise((r) => setTimeout(r, 30));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("LanguageSwitcher — network failure is silently ignored", () => {
  it("does not throw when the PATCH request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("Network error"))));

    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole("button", { expanded: false }));

    const options = await screen.findAllByRole("option");
    const unselected = options.find((o) => o.getAttribute("aria-selected") === "false")!;

    expect(() => fireEvent.click(unselected)).not.toThrow();
    expect(mockSetLocale).toHaveBeenCalledTimes(1);
  });
});
