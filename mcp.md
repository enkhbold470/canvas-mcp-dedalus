# Canvas MCP Server

MCP server for Canvas LMS and Gradescope integration with comprehensive educational tool support.

## Overview

The Canvas MCP Server provides AI agents with access to Canvas Learning Management System and Gradescope functionality through the Model Context Protocol. It enables natural language queries for course content, assignments, grades, and educational resources.

## Features

### Canvas LMS Integration
- **Course Discovery**: Retrieve all available courses for authenticated users
- **Module Navigation**: Access course modules and their content structure
- **Assignment Management**: Get assignment details, due dates, and submission status
- **File Access**: Direct download URLs for course materials and resources
- **Content Enrichment**: Automatic file content extraction and metadata

### Gradescope Integration
- **Course Access**: Retrieve Gradescope courses organized by user role
- **Assignment Tracking**: Comprehensive assignment and submission information
- **Grade Management**: Access grades, submission status, and due dates
- **Natural Language Search**: Find courses and assignments by partial name matching

### Caching System
- **TTL-based Caching**: Intelligent caching with configurable expiration times
- **Performance Optimization**: Reduces API calls and improves response times
- **Cache Management**: Built-in cache statistics and clearing utilities

## Architecture

### Stateless Design
- Each request is independent with no persistent state
- Environment-based configuration
- Automatic cleanup and resource management

### API Integration
- **Canvas API**: RESTful integration with Canvas LMS v1 API
- **Gradescope Web Scraping**: Automated browser-based access to Gradescope
- **Authentication**: Secure token-based and credential-based auth

### Transport Support
- **STDIO**: For CLI integration and local development
- **HTTP**: For web services and remote deployment

## Tools

### Canvas Tools

#### get_courses / get_canvas_courses
Retrieve all available Canvas courses for the current user.

**Input:** None

**Output:** JSON object mapping course names to IDs

#### get_modules
Get all modules within a specific Canvas course.

**Input:**
- `course_id` (string): Canvas course ID

**Output:** Array of module objects with ID, name, and status

#### get_module_items
Retrieve all items within a specific module, with file content enrichment.

**Input:**
- `course_id` (string): Canvas course ID
- `module_id` (string): Canvas module ID

**Output:** Array of module item objects with content details and file URLs

#### get_file_url
Get direct download URL for a Canvas file.

**Input:**
- `course_id` (string): Canvas course ID
- `file_id` (string): Canvas file ID

**Output:** Direct download URL string

#### get_course_assignments
Retrieve assignments for a specific Canvas course with optional filtering.

**Input:**
- `course_id` (string): Canvas course ID
- `bucket` (optional): Filter by status (past, overdue, undated, ungraded, unsubmitted, upcoming, future)

**Output:** Array of assignment objects with details and due dates

#### get_assignments_by_course_name
Get assignments using course name instead of ID.

**Input:**
- `course_name` (string): Course name (partial matches supported)
- `bucket` (optional): Filter by status

**Output:** Array of assignment objects

### Gradescope Tools

#### get_gradescope_courses
Retrieve all available Gradescope courses organized by user role.

**Input:** None

**Output:** JSON object with courses grouped by instructor/student roles

#### get_gradescope_course_by_name
Find a specific Gradescope course by name.

**Input:**
- `course_name` (string): Course name or partial name

**Output:** Course object if found

#### get_gradescope_assignments
Get all assignments for a Gradescope course with submission details.

**Input:**
- `course_id` (string): Gradescope course ID

**Output:** Array of assignment objects with grades and submission status

#### get_gradescope_assignment_by_name
Find a specific assignment within a Gradescope course.

**Input:**
- `course_id` (string): Gradescope course ID
- `assignment_name` (string): Assignment name or partial name

**Output:** Assignment object with submission details

### Utility Tools

#### get_cache_stats
Get statistics about the current cache state.

**Input:** None

**Output:** JSON with total entries and cache type breakdown

#### clear_cache
Clear all cached data to force fresh API requests.

**Input:** None

**Output:** Success confirmation

## Configuration

### Environment Variables

```bash
# Canvas Configuration
CANVAS_API_KEY=your_canvas_api_key
CANVAS_BASE_URL=https://your-canvas-instance.com

# Gradescope Configuration
GRADESCOPE_EMAIL=your_gradescope_email
GRADESCOPE_PASSWORD=your_gradescope_password

# Application Settings
DEBUG=true                    # Enable debug logging
PORT=3002                     # HTTP server port
NODE_ENV=production          # Production mode
```

### Cache Configuration

TTL settings (in seconds):
- Courses: 3600 (1 hour)
- Modules: 1800 (30 minutes)
- Module Items: 1800 (30 minutes)
- File URLs: 3600 (1 hour)
- Assignments: 1800 (30 minutes)
- Gradescope data: 1800-3600 (30-60 minutes)

## Transport

### STDIO Transport

For CLI integration and local development:

```bash
# Development mode
npm run dev:stdio

# Production build
npm run build
node dist/index.js
```

### HTTP Transport

For web services and remote deployment:

```bash
# Development mode
npm run dev:shttp

# Production
npm run start
```

**Endpoints:**
- `/mcp` - MCP protocol endpoint (SSE/streamable)
- `/health` - Health check endpoint

## Testing

```bash
# Run all tests
bun test

# Run tests with artifact preservation
bun run test:keep
```

**Test Coverage:**
- Cache functionality and expiration
- Configuration loading and validation
- CLI argument parsing
- API client instantiation
- Server creation and tool registration

## Performance

**Response Times:**
- Cached requests: <50ms
- API requests: 200-1000ms depending on Canvas/Gradescope response times
- File processing: Variable based on file size and content type

**Memory Usage:**
- Base: ~30-50 MB
- Per request: +10-50 MB for API responses and caching
- File processing: Additional memory for content extraction

**Concurrency:**
- I/O bound for API requests
- CPU bound for content processing
- Horizontal scaling supported

## Security

- **API Key Protection**: Canvas tokens stored securely in environment
- **Credential Management**: Gradescope credentials encrypted in memory
- **Request Validation**: Input sanitization and type checking
- **Error Handling**: Secure error messages without credential exposure

## License

ISC
