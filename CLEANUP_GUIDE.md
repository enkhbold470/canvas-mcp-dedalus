# Cleanup Guide

## Files That Can Be Safely Removed

After verifying that the new structure works correctly, you can remove these old files:

### Old API Files (now in src/client/)
- `src/canvas-api.ts` → Replaced by `src/client/canvas.ts`
- `src/gradescope-api.ts` → Replaced by `src/client/gradescope.ts`

### Cleanup Commands

```bash
# Remove old API files
rm src/canvas-api.ts
rm src/gradescope-api.ts

# Or remove all at once
rm src/canvas-api.ts src/gradescope-api.ts
```

### Verify Before Removing

Before removing the old files, make sure:

1. ✅ The project builds successfully:
   ```bash
   npm run build
   ```

2. ✅ The server starts in STDIO mode:
   ```bash
   npm run start:stdio
   ```

3. ✅ The server starts in HTTP mode:
   ```bash
   npm start
   ```

4. ✅ All tests pass (if you have tests)

## What's Already Been Cleaned

- ✅ Old `index.ts` was replaced with new modular entry point
- ✅ TypeScript compilation excludes old files via `tsconfig.json`
- ✅ Build outputs only include new structure in `dist/`

## New File Locations Reference

| Old Location | New Location |
|--------------|--------------|
| `src/canvas-api.ts` | `src/client/canvas.ts` |
| `src/gradescope-api.ts` | `src/client/gradescope.ts` |
| `src/index.ts` (old monolithic) | Split into: |
| | `src/index.ts` (entry point) |
| | `src/server.ts` (server logic) |
| | `src/tools/canvas.ts` (Canvas tools) |
| | `src/tools/gradescope.ts` (Gradescope tools) |
| | `src/transport/http.ts` (HTTP transport) |
| | `src/transport/stdio.ts` (STDIO transport) |
| | `src/cli.ts` (CLI) |

## After Cleanup

Your `src/` directory should contain only:

```
src/
├── index.ts              ✅ New entry point
├── cli.ts                ✅ New CLI
├── config.ts             ✅ Enhanced config
├── server.ts             ✅ New server logic
├── cache.ts              ✅ Unchanged (still needed)
├── types.ts              ✅ New type definitions
├── client/               ✅ New directory
│   ├── index.ts
│   ├── canvas.ts
│   └── gradescope.ts
├── tools/                ✅ New directory
│   ├── index.ts
│   ├── canvas.ts
│   └── gradescope.ts
└── transport/            ✅ New directory
    ├── index.ts
    ├── http.ts
    └── stdio.ts
```

## Rollback Plan (Just in Case)

If you need to rollback to the old structure:

1. The old files are currently still in `src/`:
   - `canvas-api.ts`
   - `gradescope-api.ts`

2. You can restore from git:
   ```bash
   git checkout src/index.ts
   ```

3. Or keep the old files as backup:
   ```bash
   mkdir src/backup
   mv src/canvas-api.ts src/backup/
   mv src/gradescope-api.ts src/backup/
   ```

## Recommendation

**Wait 1-2 weeks** after deploying the new structure to production before removing the old files. This gives you time to:
- Test thoroughly in production
- Verify all functionality works
- Ensure no references to old files exist
- Get comfortable with the new structure

After that period, if everything works perfectly, proceed with cleanup.
