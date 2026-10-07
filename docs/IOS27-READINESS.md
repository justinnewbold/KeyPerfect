# KeyPerfect: iOS 27 Readiness Plan

Written October 2026, after iOS 27 shipped (September 14, 2026). This is the
roadmap for making the web app look and behave like an iOS 27 app today, and for
what the native Expo port can add later.

## 1. What actually changed in iOS 27

**Design (Liquid Glass, year two).** Liquid Glass is now mandatory for apps built
with Xcode 27 (the iOS 26 opt-out key is gone). Apple retuned it for readability:
glass diffuses the content behind it more, contrast is higher, and users get a
system slider from "clear" to "tinted". Search buttons returned to the tab bar in
system apps. Extra-large widgets were added.

**Siri AI and App Intents.** Siri was rebuilt as a conversational assistant with
on-screen awareness and follow-ups. App Intents is now the only way Siri can act
inside an app (SiriKit is deprecated). "Describe a Shortcut" lets users build
Shortcuts in plain English from any app's intents.

**New developer frameworks.**
- *Music Understanding*: on-device analysis of audio for key, tempo/beats/bars,
  song structure, pace, instrument activity and loudness. Works on files and on
  live microphone buffers. Private and offline.
- *Foundation Models*: one Swift API for Apple's on-device model, Private Cloud
  Compute, or third-party models (Claude, Gemini) via a Language Model protocol.
- *Core AI*: run your own on-device model on the Neural Engine.
- *NowPlaying*: unified API for Lock Screen and CarPlay playback controls.
- *WidgetKit*: widgets configurable through App Intents; extra-large widgets.
- *Live Activities*: expanded Dynamic Island presentations, landscape support,
  interactive buttons driven by App Intents.
- *Scene-based lifecycle and resizable windows* are now required.

**Safari 27 / WebKit (this is what the web app runs on).**
- Customizable `<select>` (`appearance: base-select`, `::picker`, `::checkmark`).
- CSS Grid Lanes (pure CSS masonry).
- `stretch` sizing keyword, `:heading` pseudo-class, `revert-rule`.
- Transform-aware anchor positioning.
- Scroll anchoring (no jumps when content loads above the viewport).
- `<model>` element for interactive 3D on iPhone and iPad.
- `img sizes="auto"`.
- Service Worker static routing API.
- ReadableStream async iteration, Cookie Store `maxAge`.
- Subpixel inline layout for crisper text.
- 1,100+ quality fixes. Declarative Web Push and Screen Wake Lock remain
  available for Home Screen web apps (from iOS 18.4).

**Still not available to web apps on iOS 27:** Web Bluetooth, Web NFC, Web MIDI
in the browser, Background Sync, Background Fetch, Badging API outside Home
Screen apps, and `navigator.vibrate` (haptics).

## 2. Where KeyPerfect stands today

Already good:
- `viewport-fit=cover`, `theme-color`, `apple-mobile-web-app-capable`, and
  `black-translucent` status bar in `index.html`.
- Safe-area utilities in `src/styles/globals.css` used by the bottom nav and
  action bars.
- 44px tap targets, 16px input floor (stops iOS focus zoom), tap highlight
  removed, hover gated behind `(hover: hover)`.
- Edge-swipe tab navigation and long press hooks.
- Reduced-motion support, skip link, live-region announcements.
- Web Share with clipboard fallback.
- Offline service worker with update banner.

Gaps that will show immediately on an iPhone:
- No `apple-touch-icon` and no PNG icons in `public/manifest.json` (only an
  SVG). iOS ignores SVG for Home Screen icons, so the icon is a screenshot.
- No `apple-mobile-web-app-title`, no startup images.
- `src/utils/haptics.ts` uses `navigator.vibrate`, which iOS Safari ignores, so
  no haptics at all on iPhone today.
- No `prefers-color-scheme` support; theme is a manual class only.
- Light theme is implemented by overriding `text-white` classes, which will fight
  a true glass material.
- Large-text mode is a fixed 120% scale, not Dynamic Type.
- Glass surfaces are flat `bg-white/10 backdrop-blur-lg` with a 1px border; they
  do not look like iOS 26/27 Liquid Glass (no specular edge, no lensing, no
  tint).
- Bottom nav is a full-width bar; iOS 27 uses a floating glass pill.
- `/mobile` Expo stub is incomplete (only HomeScreen exists) and on Expo 51.

## 3. Tier 1: do now on the web (makes the PWA look iOS 27 native)

Each item is small, safe, and testable in Safari on your iPhone 17 Pro Max.
Items 1 to 5 shipped in the "iOS 27 Tier 1 polish" PR, which also made the
Purple, Blue and Light themes actually recolour the page (they previously
only painted the body hidden under the app).

1. **Icons and install metadata.** Generate 180x180 `apple-touch-icon.png`,
   plus 192, 512 and maskable PNGs. Add `apple-touch-icon`,
   `apple-mobile-web-app-title`, and `color-scheme` meta tags to `index.html`.
   Add the PNGs to `manifest.json`.

2. **Liquid Glass material.** Replace `.glass`, `.glass-card`, `.glass-button`
   in `globals.css` with a layered material: `backdrop-filter: blur(24px)
   saturate(180%)`, a subtle radial highlight on the top edge, a 1px inner
   stroke using `box-shadow: inset 0 1px 0 rgba(255,255,255,.25)`, a soft
   outer shadow, and a `--glass-tint` CSS variable. Expose a "Glass intensity"
   setting (Clear / Balanced / Tinted) in `SettingsScreen.tsx` to mirror the new
   iOS 27 slider. Default to Balanced.

3. **Floating tab bar.** Change `Navigation.tsx` from a full-width bar to a
   floating rounded pill (`rounded-full`, inset 12px from the sides, lifted
   above the safe area) with a glass background and a sliding selected-tab
   indicator. Keep `NAV_HEIGHT_PX` in sync with the new height so content
   clearance tests still pass.

4. **Real haptics on iOS.** Keep `navigator.vibrate` for Android, and on iOS
   trigger an `<input type="checkbox" switch>` toggle inside a hidden element
   on tap. Safari fires the system haptic for the switch element in Home Screen
   web apps. Wire this into `triggerHapticFeedback` so existing callers get it
   free.

5. **System dark and light.** Add `@media (prefers-color-scheme)` defaults in
   `globals.css` and a "System" option alongside the existing themes. Set
   `<meta name="color-scheme" content="dark light">` and a second
   `theme-color` meta with `media="(prefers-color-scheme: light)"`.

6. **Dynamic-Type-style text.** Replace the fixed 120% large-text scale in
   `src/utils/accessibility.ts` with a `--kp-text-scale` variable and `rem`
   units, with a five-step picker (XS to XXL) like iOS Settings.

7. **SF Symbols look.** Keep lucide icons but tune stroke width to 1.75 and
   size to match SF Symbols weights, and use `-apple-system` first in the font
   stack so SF Pro renders on Apple devices (Inter is never actually loaded).

8. **Customizable `<select>`.** Any dropdowns (settings, level filters) should
   use `appearance: base-select` with `::picker(select)` styled as glass, with
   the old native select as fallback. This is a Safari 27 feature.

9. **Scroll and layout polish.** Rely on Safari 27 scroll anchoring for the
   stats and lesson lists. Use `height: stretch` for the screen root instead of
   the `100dvh` calc chain. Use CSS Grid Lanes for the mode catalog cards for a
   masonry layout without JavaScript.

10. **Wake Lock in practice modes.** Request `navigator.wakeLock` during
    Interval Singing, Tuner and Pitch Detector so the screen doesn't dim while
    the mic is open. Supported in Home Screen web apps since iOS 18.4.

## 4. Tier 2: web features that mirror iOS 27 behaviour

1. **Declarative Web Push for practice reminders.** The Settings toggle at
   `SettingsScreen.tsx` currently only writes to localStorage. Implement
   Declarative Web Push (JSON payload, no service worker code needed) for daily
   streak and weekly-goal reminders. Needs a small backend to store
   subscriptions and send pushes; Supabase Edge Functions fit this.

2. **Badging.** Show the number of due spaced-repetition reviews on the Home
   Screen icon via `navigator.setAppBadge`. Works for installed web apps.

3. **Live Activity stand-in.** During a session, show a compact persistent
   "session chip" at the top of the screen with timer, streak and accuracy. On
   native this becomes a real Live Activity in the Dynamic Island.

4. **Shortcuts-style deep links.** Add hash routes for "start 5-minute interval
   drill", "open tuner", "today's review" in `src/utils/routing.ts`. On iPhone
   the user can wrap these in a Shortcut and say "Hey Siri, open KeyPerfect
   tuner". These same routes become App Intents in the native port.

5. **Share Sheet rich cards.** Extend `src/utils/social.ts` to share a generated
   PNG result card (`files` array in `navigator.share`) so results post as an
   image in Messages, matching what iOS apps do.

6. **Siri-friendly on-screen structure.** Siri AI's on-screen understanding
   reads accessibility labels. Audit `aria-label`s on result and lesson screens
   so they describe content ("Correct: C major chord, 92% accuracy") rather
   than UI ("card").

7. **3D instrument view (optional).** Safari 27 adds `<model>` on iPhone. A
   rotatable 3D guitar or piano in Guitar Tools using a `.usdz` file would be a
   distinctive touch and fall back to an image elsewhere.

## 5. Tier 3: native-only, for the Expo port

These need the Swift SDK or Expo modules and cannot be done in the browser.

1. **Music Understanding framework (biggest win).** Replace the autocorrelation
   pitch detector in `src/utils/audioEngine.ts` for song analysis with Apple's
   on-device key, tempo, beat and structure detection. Song Analysis in Guitar
   Tools would get instant key and BPM from a recording or the mic, and Melodic
   Dictation could auto-align to beats. Wrap it as an Expo Module in Swift.

2. **App Intents.** Expose "Start practice", "Open tuner", "Review mistakes",
   "What's my streak" as intents so Siri AI and Shortcuts can run them. Keep
   intent names identical to the web hash routes from Tier 2.

3. **Widgets.** Small: streak and daily goal ring. Medium: next review due and
   weak areas. Extra-large (new in iOS 27): weekly progress chart. Make them
   configurable through App Intents.

4. **Live Activities.** Practice-session timer in the Dynamic Island with a
   Pause button driven by an App Intent. Landscape support is new in iOS 27.

5. **Foundation Models.** On-device lesson explanations ("why is this a
   dominant seventh?") and personalized practice plans generated from the stats
   store, with no API cost and offline. The same Swift call can route to Claude
   via the Language Model protocol if you want a stronger model later.

6. **Core Haptics.** Map the six existing haptic types to real CHHapticPattern
   transients (expo-haptics covers light/medium/heavy/success/error/warning).

7. **Controls and Lock Screen.** Add a Control Center button for "Quick tuner"
   and a Lock Screen control for "Start daily drill".

8. **Required by the iOS 27 SDK.** Scene-based lifecycle, a declared launch
   screen, and resizable layout (iPad and iPhone Mirroring). Expo SDK 54+
   handles these; the `/mobile` stub on Expo 51 should be recreated rather
   than upgraded.

## 6. Suggested order

1. Tier 1 items 1 to 5 in one PR (icons, glass, floating nav, haptics, system
   theme). This is the visible "looks like iOS 27" change.
2. Tier 1 items 6 to 10 in a second PR.
3. Tier 2 items 3, 4 and 5 (session chip, deep links, share cards). No backend.
4. Tier 2 items 1 and 2 once a Supabase project exists for push.
5. Start the Expo port with the Music Understanding module and App Intents.

## Sources

- Apple Newsroom, iOS 27 announcement (June 2026)
- MacRumors, "Apple Releases iOS 27" (Sept 14, 2026) and 250-change list
- 9to5Mac, iOS 27 features and compatible iPhones
- WebKit blog, "News from WWDC26: WebKit in Safari 27 beta"
- WWDC26 session 204, "What's new in WebKit for Safari 27"
- WWDC26 session 253, "Meet the Music Understanding framework"
- WWDC26 iOS developer guide (developer.apple.com/wwdc26/guides/ios)
