# TypeScript migration notes

Foundly's application source has been migrated from JavaScript to TypeScript:

- React Native / Expo Router screens: `.jsx` → `.tsx`
- Components and context providers: `.jsx` → `.tsx`
- Firebase and upload services: `.js` → `.ts`
- `tsconfig.json` now includes all TypeScript source files and disables emit.

## Run locally

```bash
npm ci
npx tsc --noEmit
npx expo start
```

The current TypeScript configuration starts with compatibility-friendly settings to make the migration non-breaking. After confirming the app type-checks locally, enable `strict: true` and address any stricter typing issues incrementally.

The migration environment could not complete dependency installation, so a full Expo/TypeScript build could not be verified here. Please run the commands above in an environment with package registry access.
