# Canvas LMS and Gradescope MCP Server (JavaScript)

A comprehensive JavaScript/TypeScript implementation of the Canvas LMS and Gradescope MCP server, providing AI agents with access to educational data and resources.

## Features

This MCP server replicates all functionality from the Python implementation:

### Canvas LMS Integration
- **Get courses** - Retrieve all available Canvas courses
- **Get modules** - Fetch modules within a specific course  
- **Get module items** - List items within a module with file content enrichment
- **Get file URLs** - Direct download URLs for Canvas files
- **Get assignments** - Course assignments with filtering options
- **Course search** - Find assignments by course name

### Gradescope Integration
- **Get courses** - Retrieve Gradescope courses organized by role
- **Course search** - Find courses by name with partial matching
- **Get assignments** - Course assignments with metadata
- **Assignment search** - Find assignments by name within courses
- **Get submissions** - Assignment submissions with details
- **Student submissions** - Individual student submission data
- **Natural language search** - Query Gradescope with plain language

### Advanced Features
- **Smart caching** - TTL-based caching system (1hr courses, 30min modules/assignments)
- **File content processing** - Downloads and processes files with base64 encoding
- **Error handling** - Comprehensive error handling with detailed logging
- **Cross-platform search** - Search across both Canvas and Gradescope
- **Debug utilities** - Cache statistics and management tools

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables by copying `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. Configure your API credentials in `.env`:
   ```env
   # Required
   CANVAS_API_KEY=your_canvas_api_key_here
   CANVAS_BASE_URL=https://canvas.asu.edu

   # Optional - for Gradescope integration
   GRADESCOPE_EMAIL=your_gradescope_email@example.com
   GRADESCOPE_PASSWORD=your_gradescope_password

   # Debug mode
   DEBUG=false
   ```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### With Smithery (Recommended)
This server is designed to work with Smithery for easy deployment and management.

## API Reference

### Canvas Tools

#### `get_courses()`
Retrieve all available Canvas courses as a name-to-ID mapping.

#### `get_modules(course_id)`
Get all modules within a specific Canvas course.

#### `get_module_items(course_id, module_id)`
Retrieve all items within a module, including enriched file content.

#### `get_file_url(course_id, file_id)`
Get direct download URL for a Canvas file.

#### `get_course_assignments(course_id, bucket?)`
Get assignments for a course with optional status filtering.

#### `get_assignments_by_course_name(course_name, bucket?)`
Find assignments using course name instead of ID.

#### `get_canvas_courses()`
Alias for `get_courses()`.

### Gradescope Tools

#### `get_gradescope_courses()`
Retrieve all Gradescope courses organized by user role.

#### `get_gradescope_course_by_name(course_name)`
Find a specific Gradescope course by name.

#### `get_gradescope_assignments(course_id)`
Get all assignments for a Gradescope course.

#### `get_gradescope_assignment_by_name(course_id, assignment_name)`
Find a specific assignment within a course.

#### `get_gradescope_submissions(course_id, assignment_id)`
Retrieve all submissions for an assignment.

#### `get_gradescope_student_submission(course_id, assignment_id, student_email)`
Get a specific student's submission.

#### `call_search_gradescope(query)`
Search Gradescope using natural language queries.

#### `search_education_platforms(query)`
Search across both Canvas and Gradescope platforms.

### Utility Tools

#### `get_cache_stats()`
Get current cache statistics for debugging.

#### `clear_cache()`
Clear all cached data to force fresh API requests.

## Configuration

The server uses a Zod schema for configuration validation:

```typescript
{
  debug: boolean (default: false)
  canvasApiKey: string (required)
  canvasBaseUrl: string (default: "https://canvas.asu.edu")
  gradescopeEmail?: string (optional)
  gradescopePassword?: string (optional)
}
```

## Architecture

- **Modular design** - Separate modules for Canvas API, Gradescope API, caching, and configuration
- **Type safety** - Full TypeScript implementation with comprehensive type definitions
- **Error resilience** - Graceful error handling with detailed logging
- **Performance optimization** - Intelligent caching and efficient API usage
- **Extensible** - Easy to add new features and integrations

## Implementation Notes

### Canvas API
- Uses official Canvas REST API with Bearer token authentication
- Implements file content downloading with size limits (5MB)
- Supports both text and binary file processing
- Includes comprehensive error handling for API failures

### Gradescope API
- Currently uses mock data for demonstration (Gradescope lacks official API)
- Implements natural language query analysis
- Ready for integration with actual Gradescope scraping libraries
- Maintains same interface as Python implementation

### Caching System
- In-memory TTL-based caching
- Configurable expiration times per data type
- Cache statistics and management utilities
- Thread-safe operations

## Troubleshooting

### Common Issues

1. **Canvas API Key Invalid**
   - Verify your API key in Canvas Settings → Approved Integrations
   - Ensure the key has necessary permissions

2. **Gradescope Authentication**
   - Currently returns mock data - real implementation requires additional development
   - Check credentials are correctly set in environment variables

3. **Network Timeouts**
   - Adjust timeout values in the API configuration
   - Check Canvas server availability

4. **Cache Issues**
   - Use `clear_cache()` tool to reset cache
   - Check cache statistics with `get_cache_stats()`

## Contributing

This implementation replicates the Python canvas-mcp functionality in JavaScript/TypeScript. When contributing:

1. Maintain compatibility with the original Python API
2. Follow TypeScript best practices
3. Include comprehensive error handling
4. Update tests for new features
5. Document any breaking changes

## License

ISC License - see LICENSE file for details.

## Credits

Built by [Aryan Keluskar](https://aryankeluskar.com) - JavaScript port of the original Python implementation.
