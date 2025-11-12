# Canvas MCP Structure Comparison

## Before (Original Structure)

```
src/
├── index.ts              # 432 lines - Everything in one file
│                         # - Server creation
│                         # - All tool definitions
│                         # - Tool handlers
│                         # - Configuration loading
├── canvas-api.ts         # Canvas LMS API client
├── gradescope-api.ts     # Gradescope API client
├── config.ts             # Basic configuration
└── cache.ts              # Caching system
```

**Issues:**
- ❌ Large monolithic `index.ts` (432 lines)
- ❌ Mixed concerns in single file
- ❌ Duplicate type definitions
- ❌ No separation between tools and server logic
- ❌ Hard to maintain and extend
- ❌ Not following Dedalus Labs structure

---

## After (Dedalus Labs Structure)

```
src/
├── index.ts              # 47 lines - Clean entry point
│   └── Transport selection (HTTP vs STDIO)
│
├── cli.ts                # Command-line interface
│   └── Argument parsing (--port, --stdio, --help)
│
├── config.ts             # Enhanced configuration
│   ├── loadConfig() - New Dedalus pattern
│   ├── getConfig() - Backward compatibility
│   └── Zod schema validation
│
├── server.ts             # Server creation and orchestration
│   ├── createStandaloneServer()
│   ├── Tool registration
│   ├── Request routing
│   └── CanvasMCPServer class
│
├── types.ts              # Centralized type definitions
│   ├── Canvas types
│   ├── Gradescope types
│   └── Tool argument types
│
├── cache.ts              # Caching system (unchanged)
│
├── client/               # External API clients
│   ├── index.ts          # Exports
│   ├── canvas.ts         # Canvas LMS client
│   └── gradescope.ts     # Gradescope client
│
├── tools/                # MCP tool definitions
│   ├── index.ts          # Exports
│   ├── canvas.ts         # Canvas tools
│   │   ├── Tool definitions
│   │   ├── Type guards
│   │   └── Tool handlers
│   └── gradescope.ts     # Gradescope tools
│       ├── Tool definitions
│       ├── Type guards
│       └── Tool handlers
│
└── transport/            # Transport layer
    ├── index.ts          # Exports
    ├── http.ts           # HTTP transport
    │   ├── StreamableHTTP (MCP sessions)
    │   ├── SSE (backward compatibility)
    │   ├── Health checks
    │   └── Session management
    └── stdio.ts          # STDIO transport
        └── For Claude Desktop & development
```

**Benefits:**
- ✅ Modular architecture with clear separation of concerns
- ✅ Each file has a single responsibility
- ✅ Centralized type definitions (no duplication)
- ✅ Easy to extend with new tools or transports
- ✅ Follows Dedalus Labs best practices
- ✅ Production-ready with proper error handling
- ✅ Development-friendly with STDIO support
- ✅ Type-safe with proper TypeScript configuration

---

## File Size Comparison

| File | Before | After | Notes |
|------|--------|-------|-------|
| `index.ts` | 432 lines | 47 lines | 🎯 90% reduction |
| `server.ts` | N/A | ~280 lines | New - Server logic |
| `tools/canvas.ts` | N/A | ~370 lines | New - Canvas tools |
| `tools/gradescope.ts` | N/A | ~220 lines | New - Gradescope tools |
| `transport/http.ts` | N/A | ~190 lines | New - HTTP transport |
| `transport/stdio.ts` | N/A | ~20 lines | New - STDIO transport |
| `cli.ts` | N/A | ~50 lines | New - CLI |
| `types.ts` | N/A | ~150 lines | New - Type definitions |

---

## Architecture Flow

### Before
```
index.ts
  ↓
  ├─ Load config
  ├─ Create server
  ├─ Define ALL tools (7+ tools inline)
  ├─ Register handlers
  └─ Export for MCP
```

### After (Dedalus Labs)
```
index.ts (Entry Point)
  ↓
  ├─ cli.ts (Parse arguments)
  ├─ config.ts (Load & validate config)
  │     ↓
  │     └─ server.ts (Create server)
  │           ↓
  │           ├─ client/canvas.ts
  │           ├─ client/gradescope.ts
  │           ├─ tools/canvas.ts (Tool definitions & handlers)
  │           └─ tools/gradescope.ts (Tool definitions & handlers)
  │                 ↓
  │                 └─ types.ts (Shared types)
  └─ transport/
        ├─ http.ts (Production)
        └─ stdio.ts (Development)
```

---

## Comparison Matrix

| Aspect | Before | After |
|--------|--------|-------|
| **Structure** | Flat | Modular |
| **Maintainability** | Difficult | Easy |
| **Type Safety** | Duplicated types | Centralized types |
| **Testability** | Hard | Easy |
| **Extensibility** | Manual | Structured |
| **Dedalus Compatible** | ❌ No | ✅ Yes |
| **Production Ready** | Partial | Full |
| **Transport Options** | Limited | Multiple (HTTP, SSE, STDIO) |
| **Session Management** | Basic | Advanced |
| **Health Checks** | None | Built-in |
| **CLI Support** | None | Full |

---

## Key Improvements

### 1. **Separation of Concerns**
   - Each module has a single, well-defined purpose
   - Easy to locate and modify specific functionality

### 2. **Dedalus Labs Compliance**
   ```typescript
   // Follows Dedalus recommended structure:
   src/
   ├── index.ts          ✅ Main entry point
   ├── cli.ts            ✅ CLI arguments
   ├── config.ts         ✅ Configuration
   ├── server.ts         ✅ Server instance
   ├── types.ts          ✅ Type definitions
   ├── client/           ✅ API clients
   ├── tools/            ✅ Tool definitions
   └── transport/        ✅ HTTP & STDIO
       ├── http.ts       ✅ StreamableHTTP
       └── stdio.ts      ✅ STDIO
   ```

### 3. **Type Safety**
   ```typescript
   // Before: Types scattered across files
   // After: Centralized in types.ts
   import type { Course, Module, Assignment } from '../types.js';
   ```

### 4. **Tool Organization**
   ```typescript
   // Before: All tools in index.ts
   server.tool("get_courses", ...);
   server.tool("get_modules", ...);
   // ... 7+ more tools inline

   // After: Organized in tools/
   export const getCoursesToolDefinition: Tool = { ... };
   export async function handleGetCoursesTool(...) { ... }
   ```

### 5. **Transport Flexibility**
   ```bash
   # Development (STDIO)
   node dist/index.js --stdio

   # Production (HTTP)
   node dist/index.js --port 8080

   # Claude Desktop compatible ✅
   # Dedalus platform ready ✅
   ```

---

## Migration Path

### ✅ Completed
1. Created new directory structure
2. Extracted types to `types.ts`
3. Moved API clients to `client/`
4. Created tool modules in `tools/`
5. Implemented transport layer
6. Created server orchestration
7. Added CLI support
8. Updated configuration
9. Created new entry point
10. Configured TypeScript & build system

### 🔄 Optional Next Steps
1. Remove old files (`index-old.ts`, old API files)
2. Add unit tests for new modules
3. Add integration tests
4. Update README with new structure
5. Add more tools using the new pattern

---

## Conclusion

The restructuring transforms the Canvas MCP project from a monolithic structure into a well-organized, modular architecture that follows Dedalus Labs best practices. The new structure is:

- **More maintainable**: Clear separation of concerns
- **More extensible**: Easy to add new features
- **Production-ready**: Proper error handling and session management
- **Developer-friendly**: STDIO support and clear module organization
- **Type-safe**: Centralized type definitions
- **Dedalus-compliant**: Follows recommended MCP server architecture

🎉 **The project is now structured according to Dedalus Labs standards!**
