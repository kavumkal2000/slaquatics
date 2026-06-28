# Shoreline Ops Native iPhone App

This folder contains a native iPhone wrapper for the private Shoreline ops system.

## What it does

- launches as a real iPhone app
- loads the live private ops login and app inside a locked native `WKWebView`
- keeps users inside Shoreline-owned domains
- works with the approved-device lock already built into the web ops backend

## Open in Xcode

Open:

- `ShorelineOpsNative.xcodeproj`

## Before shipping

1. Select your Apple Developer team in Signing.
2. Confirm the bundle identifier you want to use.
3. Test the login flow on the target iPhone.
4. Archive the app from Xcode.
5. Upload to App Store Connect and distribute privately through TestFlight.

## Default live endpoint

- `https://slaquatics.com/ops-login`

## Notes

- external web links are blocked inside the app unless they use system phone or mail schemes
- the first approved phone for each ops login is still controlled by the backend trusted-device lock
