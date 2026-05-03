# QA Test Mode

## What it does

Test mode suppresses the cookie-consent banner so manual QA testers aren't interrupted by it on every session.

## Activating via keyboard shortcut (recommended)

Press **Ctrl+Shift+,** (or **⌘+Shift+,** on Mac) on any page of the app.

> Note: Ctrl+Shift+T was intentionally avoided — browsers reserve it for "reopen closed tab" and intercept it before the page can act on it.

- First press → sets the flag and reloads the page (banner suppressed for this browser).
- Second press → clears the flag and reloads (banner restored to normal behaviour).

The current state is stored in `localStorage` under the key `cortea_test_mode`. It persists across page navigations and browser restarts until toggled off.

## Activating via URL query param (one-time)

Append `?test_mode=1` to any URL. The banner is suppressed for that page load only — it reappears if you navigate away or reload without the param.

```
https://<app-url>/?test_mode=1
```

## Activating via browser console (one-time setup)

Open the browser DevTools console and run:

```js
localStorage.setItem('cortea_test_mode', '1'); location.reload();
```

To clear it:

```js
localStorage.removeItem('cortea_test_mode'); location.reload();
```

## Bookmarklet

Create a browser bookmark with the following URL to toggle test mode from your bookmarks bar:

```
javascript:(function(){var k='cortea_test_mode';localStorage.getItem(k)==='1'?localStorage.removeItem(k):localStorage.setItem(k,'1');location.reload();})();
```

## How it works

`CookieConsentBanner.tsx` checks three conditions on mount and silently skips rendering the banner when any of them is true:

1. `navigator.webdriver` is set (Playwright / Selenium)
2. The URL contains `?test_mode=1`
3. `localStorage.cortea_test_mode === '1'`

The keyboard shortcut (Ctrl+Shift+,) is wired up in `TestModeToggle.tsx` and mounted globally in `App.tsx`.
