from dotenv import load_dotenv
import os
import json
import requests
import base64
import time
from mcp.server.fastmcp import FastMCP
import gradescope

# Initialize FastMCP server
mcp = FastMCP("canvas_and_gradescope")

load_dotenv()

# Simple in-memory cache
cache = {
    "courses": None,
    "modules": {},
    "module_items": {},
    "file_urls": {},
    "assignments": {}
}

# Cache expiration times (in seconds)
CACHE_TTL = {
    "courses": 3600,  # 1 hour
    "modules": 1800,  # 30 minutes
    "module_items": 1800,  # 30 minutes
    "file_urls": 3600,  # 1 hour
    "assignments": 1800  # 30 minutes
}

cache_timestamps = {
    "courses": 0,
    "modules": {},
    "module_items": {},
    "file_urls": {},
    "assignments": {}
}

def cache_get(cache_type, key=None):
    """Get an item from cache if it exists and is not expired"""
    current_time = time.time()
    
    if key is None:
        # For single-item caches like courses
        if cache_type in cache and cache[cache_type] is not None:
            if current_time - cache_timestamps[cache_type] < CACHE_TTL[cache_type]:
                return cache[cache_type]
    else:
        # For multi-item caches
        if cache_type in cache and key in cache[cache_type]:
            if key in cache_timestamps[cache_type] and current_time - cache_timestamps[cache_type][key] < CACHE_TTL[cache_type]:
                return cache[cache_type][key]
    
    return None

def cache_set(cache_type, value, key=None):
    """Store an item in cache with current timestamp"""
    current_time = time.time()
    
    if key is None:
        # For single-item caches
        cache[cache_type] = value
        cache_timestamps[cache_type] = current_time
    else:
        # For multi-item caches
        if cache_type not in cache:
            cache[cache_type] = {}
        if cache_type not in cache_timestamps:
            cache_timestamps[cache_type] = {}
            
        cache[cache_type][key] = value
        cache_timestamps[cache_type][key] = current_time

@mcp.tool()
async def get_courses():
    """Use this tool to retrieve all available Canvas courses for the current user. This tool returns a dictionary mapping course names to their corresponding IDs. Use this when you need to find course IDs based on names, display all available courses, or when needing to access any course-related information."""
    # Check cache first
    cached_courses = cache_get("courses")
    if cached_courses:
        print("Using cached courses data")
        return cached_courses

    try:
        url = "https://canvas.asu.edu/api/v1/courses?page=1&per_page=100"
        
        # Check if API key is available
        api_key = os.getenv('CANVAS_API_KEY')
        if not api_key:
            print("Error: CANVAS_API_KEY environment variable not set")
            return None
            
        headers = {
            "Authorization": f"Bearer {api_key}"
        }
        
        # Add timeout to prevent hanging
        response = requests.get(url, headers=headers, timeout=10)
        
        # Check response status
        if response.status_code != 200:
            print(f"Error: Canvas API returned status code {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
        courses = response.json()

        out = {}

        for course in courses:
            if "id" in course and "name" in course:
                out.update({
                    course["name"]: course["id"]
                })

        # Only write to file if we have data and the filesystem is writable
        if out:
            try:
                is_writable = os.access(os.getcwd(), os.W_OK)
                if is_writable:
                    with open("courses.json", "w") as f:
                        json.dump(out, f)
                    print("Saved courses data to courses.json")
            except Exception as e:
                print(f"Warning: Could not save courses to file: {e}")
                
            # Store in cache
            cache_set("courses", out)
        else:
            print("Warning: No courses found in Canvas API response")
            return None

        return out

    except Exception as e:
        import traceback, sys
        print(f"Unexpected error in get_courses: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None

@mcp.tool()
async def get_modules(course_id):
    """Use this tool to retrieve all modules within a specific Canvas course. This tool returns a list of module objects containing module details like ID, name, and status. Use this when exploring or navigating course content structure."""
    # Check cache first
    cached_modules = cache_get("modules", course_id)
    if cached_modules:
        print(f"Using cached modules data for course {course_id}")
        return cached_modules

    try:
        url = f"https://canvas.asu.edu/api/v1/courses/{course_id}/modules"
        
        # Check if API key is available
        api_key = os.getenv('CANVAS_API_KEY')
        if not api_key:
            print("Error: CANVAS_API_KEY environment variable not set")
            return None
            
        headers = {
            "Authorization": f"Bearer {api_key}"
        }
        
        # Add timeout
        response = requests.get(url, headers=headers, timeout=10)
        
        # Check response status
        if response.status_code != 200:
            print(f"Error: Canvas API returned status code {response.status_code}")
            print(f"Response: {response.text}")
            return None

        modules = response.json()
        
        # Only write to file if we have data and the filesystem is writable
        if modules:
            try:
                is_writable = os.access(os.getcwd(), os.W_OK)
                if is_writable:
                    with open("modules.json", "w") as f:
                        json.dump(modules, f)
                    print(f"Saved modules data for course {course_id} to modules.json")
            except Exception as e:
                print(f"Warning: Could not save modules to file: {e}")
                
            # Store in cache
            cache_set("modules", modules, course_id)
        else:
            print(f"Warning: No modules found for course {course_id}")
            return None

        return modules
        
    except Exception as e:
        import traceback, sys
        print(f"Unexpected error in get_modules: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None

@mcp.tool()
async def get_module_items(course_id, module_id):
    """Use this tool to retrieve all items within a specific module in a Canvas course.
    This now enriches File-type items with a direct download URL and (size-limited) file contents.

    Returns a list of module item objects containing details like title, type, Canvas URLs,
    and, for File items, `file_url`, `file_meta`, and optionally `file_content_text` and/or
    `file_content_base64` (content download limited by size and type).
    """
    # Check cache first
    cache_key = f"{course_id}_{module_id}"
    cached_items = cache_get("module_items", cache_key)
    if cached_items:
        print(f"Using cached module items for module {module_id} in course {course_id}")
        return cached_items

    try:
        url = f"https://canvas.asu.edu/api/v1/courses/{course_id}/modules/{module_id}/items?per_page=100"
        
        # Check if API key is available
        api_key = os.getenv('CANVAS_API_KEY')
        if not api_key:
            print("Error: CANVAS_API_KEY environment variable not set")
            return None
            
        headers = {
            "Authorization": f"Bearer {api_key}"
        }
        
        # Add timeout
        response = requests.get(url, headers=headers, timeout=10)
        
        # Check response status
        if response.status_code != 200:
            print(f"Error: Canvas API returned status code {response.status_code} for module items")
            print(f"Response: {response.text}")
            return None
            
        items = response.json()
        
        if not items:
            print(f"Warning: No items found for module {module_id} in course {course_id}")
            return None
            
        # Enrich File-type items with direct file URLs and (size-limited) contents
        MAX_CONTENT_BYTES = 5 * 1024 * 1024  # 5 MB cap to avoid huge downloads
        for item in items:
            try:
                if item.get("type") == "File" and "content_id" in item:
                    file_id = item["content_id"]

                    # Resolve direct file URL (with cache)
                    file_cache_key = f"{course_id}_{file_id}"
                    file_url = cache_get("file_urls", file_cache_key)

                    if not file_url:
                        file_meta_url = f"https://canvas.asu.edu/api/v1/courses/{course_id}/files/{file_id}"
                        api_key = os.getenv('CANVAS_API_KEY')
                        if not api_key:
                            print("Error: CANVAS_API_KEY environment variable not set")
                            continue
                        file_headers = {
                            "Authorization": f"Bearer {api_key}"
                        }
                        meta_resp = requests.get(file_meta_url, headers=file_headers, timeout=10)
                        if meta_resp.status_code != 200:
                            print(f"Error: Canvas API returned status {meta_resp.status_code} for file metadata {file_id}")
                            continue
                        file_data = meta_resp.json()
                        # Prefer 'url' if present
                        file_url = file_data.get('url') or file_data.get('download_url') or None

                        # Attach minimal metadata
                        item["file_meta"] = {
                            "display_name": file_data.get("display_name"),
                            "filename": file_data.get("filename"),
                            "size": file_data.get("size"),
                            "content_type": file_data.get("content-type") or file_data.get("content_type"),
                        }

                        if file_url:
                            cache_set("file_urls", file_url, file_cache_key)
                    else:
                        item["file_meta"] = item.get("file_meta", {})

                    if file_url:
                        item["file_url"] = file_url

                        # Try to download file content, respecting size and type
                        try:
                            # First attempt a HEAD to check size (may not always work); fallback to GET
                            head_resp = requests.head(file_url, allow_redirects=True, timeout=10)
                            content_length = head_resp.headers.get("Content-Length") if head_resp is not None else None
                            if content_length is not None and content_length.isdigit():
                                if int(content_length) > MAX_CONTENT_BYTES:
                                    item["file_content_truncated"] = True
                                    continue

                            # GET content
                            file_resp = requests.get(file_url, allow_redirects=True, timeout=20)
                            if file_resp.status_code == 200:
                                content_bytes = file_resp.content
                                content_type = file_resp.headers.get("Content-Type", "")
                                item["file_content_type"] = content_type
                                item["file_content_size"] = len(content_bytes)

                                if len(content_bytes) > MAX_CONTENT_BYTES:
                                    item["file_content_truncated"] = True
                                    # Keep first MAX_CONTENT_BYTES bytes
                                    content_bytes = content_bytes[:MAX_CONTENT_BYTES]
                                else:
                                    item["file_content_truncated"] = False

                                # If text-like, attach decoded text; always attach base64
                                if content_type.startswith("text/") or content_type in ("application/json", "application/xml"):
                                    try:
                                        # Use response encoding if provided
                                        encoding = file_resp.encoding or "utf-8"
                                        item["file_content_text"] = content_bytes.decode(encoding, errors="replace")
                                    except Exception:
                                        # Fallback to utf-8 replace
                                        item["file_content_text"] = content_bytes.decode("utf-8", errors="replace")

                                item["file_content_base64"] = base64.b64encode(content_bytes).decode("utf-8")
                            else:
                                print(f"Warning: Could not download file content for {file_id}, status {file_resp.status_code}")
                        except requests.RequestException as e:
                            print(f"Warning: RequestException while downloading file content: {e}")
                        except Exception as e:
                            print(f"Warning: Unexpected error while handling file content: {e}")
            except Exception as e:
                print(f"Warning: Failed to enrich file item: {e}")
                continue

        # Store enriched items in cache
        cache_set("module_items", items, cache_key)
            
        return items
        
    except requests.RequestException as e:
        import traceback, sys
        print(f"Error connecting to Canvas API for module items: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None
    except Exception as e:
        import traceback, sys
        print(f"Unexpected error in get_module_items: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None

@mcp.tool()
async def get_file_url(course_id, file_id):
    """Use this tool to get the direct download URL for a file stored in Canvas. This tool returns a URL string that can be used to access or download the file. Use this when you need direct access to file content rather than just the Canvas page URL."""
    # Check cache first
    cache_key = f"{course_id}_{file_id}"
    cached_url = cache_get("file_urls", cache_key)
    if cached_url:
        print(f"Using cached file URL for file {file_id} in course {course_id}")
        return cached_url

    try:
        url = f"https://canvas.asu.edu/api/v1/courses/{course_id}/files/{file_id}"
        
        # Check if API key is available
        api_key = os.getenv('CANVAS_API_KEY')
        if not api_key:
            print("Error: CANVAS_API_KEY environment variable not set")
            return None
            
        headers = {
            "Authorization": f"Bearer {api_key}"
        }
        
        # Add timeout
        response = requests.get(url, headers=headers, timeout=10)
        
        # Check response status
        if response.status_code != 200:
            print(f"Error: Canvas API returned status code {response.status_code} for file URL")
            print(f"Response: {response.text}")
            return None
            
        file_data = response.json()
        
        if 'url' in file_data:
            # Store in cache
            cache_set("file_urls", file_data['url'], cache_key)
            return file_data['url']
            
        print(f"Warning: No URL found in file data for file {file_id}")
        return None
        
    except requests.RequestException as e:
        import traceback, sys
        print(f"Error connecting to Canvas API for file URL: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None
    except Exception as e:
        import traceback, sys
        print(f"Unexpected error in get_file_url: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None
    







    




@mcp.tool()
async def get_course_assignments(course_id, bucket: str = None):
    """Use this tool to retrieve all assignments for a specific Canvas course, with optional filtering by status. This tool returns assignment details including name, description, due date, and submission status. Use this when helping users manage their coursework, check due dates, or find assignment details.
    
    Args:
        course_id: The Canvas course ID
        bucket: Optional filter - past, overdue, undated, ungraded, unsubmitted, upcoming, future
    """

    # if course_id is not a string, convert it to a string
    if not isinstance(course_id, str):
        course_id = str(course_id)

    try:
        # Build URL with optional bucket parameter
        url = f"https://canvas.asu.edu/api/v1/courses/{course_id}/assignments"
        params = {
            "order_by": "due_at",
            "per_page": 100,  # Get max assignments per page
            "include[]": ["submission", "all_dates"]  # Include submission details
        }
        if bucket:
            params["bucket"] = bucket
            
        # Check if API key is available
        api_key = os.getenv('CANVAS_API_KEY')
        if not api_key:
            print("Error: CANVAS_API_KEY environment variable not set")
            return None
            
        headers = {
            "Authorization": f"Bearer {api_key}"
        }
        
        # Add timeout to prevent hanging
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        # Check response status
        if response.status_code != 200:
            print(f"Error: Canvas API returned status code {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
        assignments = response.json()
        
        # Store in cache
        # cache_set("assignments", assignments, cache_key)

        # only return "id", "description", "due_at", "has_submitted_submissions" and "name" of the assignments
        return [{"id": assignment["id"], "description": assignment["description"], "due_at": assignment["due_at"], "has_submitted_submissions": assignment["has_submitted_submissions"], "name": assignment["name"]} for assignment in assignments]


    except Exception as e:
        import traceback, sys
        print(f"Unexpected error in get_course_assignments: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None

@mcp.tool()
async def get_assignments_by_course_name(course_name: str, bucket: str = None):
    """Use this tool to retrieve all assignments for a Canvas course using its name rather than ID. This tool returns assignment details the same as get_course_assignments. Use this when you have the course name but not the ID, or when helping users find assignments across multiple courses.
    
    Args:
        course_name: The name of the course as it appears in Canvas (partial matches supported)
        bucket: Optional filter - past, overdue, undated, ungraded, unsubmitted, upcoming, future
    """
    try:
        # First get all courses to find the course ID
        courses = await get_courses()
        if not courses:
            print("Error: Could not fetch courses")
            return None
        
        course_found = False

        for courseName, courseId in courses.items():
            if course_name in courseName:
                course_id = courseId
                course_found = True
                break
            
        # Find the course ID by name
        if not course_found:
            print(f"Error: Course '{course_name}' not found")
            print(f"Available courses: {list(courses.keys())}")
            return None
            
        # Get assignments using the course ID
        return await get_course_assignments(course_id, bucket)
        
    except Exception as e:
        import traceback, sys
        print(f"Unexpected error in get_assignments_by_course_name: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None





# Add MCP tools for Gradescope

@mcp.tool()
async def get_canvas_courses():
    """Use this tool to retrieve all available Canvas courses for the current user. This is an alias for get_courses. Use this when you need to find course IDs based on names or display all available courses."""
    return await get_courses()

@mcp.tool()
async def get_gradescope_courses(random_string: str = ""):
    """Use this tool to retrieve all available Gradescope courses for the current user. This tool returns a dictionary of courses organized by user role. Use this when helping users access or manage their Gradescope course information."""
    return gradescope._get_gradescope_courses()

@mcp.tool()
async def get_gradescope_course_by_name(course_name: str):
    """Use this tool to find a specific Gradescope course by name (partial matches supported). This tool returns the course object if found. Use this when you need to get course details or ID when only the name is known.
    
    Args:
        course_name: The name or partial name of the Gradescope course to search for
    """
    return gradescope.get_course_by_name(course_name)

@mcp.tool()
async def get_gradescope_assignments(course_id: str):
    """Use this tool to retrieve all assignments for a specific Gradescope course. This tool returns a list of assignment objects with details like name, due date, and status. Use this when helping users manage their Gradescope coursework.
    
    Args:
        course_id: The Gradescope course ID
    """
    return gradescope.get_assignments_for_course(course_id)

@mcp.tool()
async def get_gradescope_assignment_by_name(course_id: str, assignment_name: str):
    """Use this tool to find a specific Gradescope assignment by name within a course. This tool returns the assignment object if found. Use this when you need assignment details or ID when only the name and course are known.
    
    Args:
        course_id: The Gradescope course ID
        assignment_name: The name or partial name of the assignment to search for
    """
    return gradescope.get_assignment_by_name(course_id, assignment_name)

@mcp.tool()
async def get_gradescope_submissions(course_id: str, assignment_id: str):
    """Use this tool to retrieve all submissions for a specific Gradescope assignment. This tool returns a list of submission objects with details like submission time and score. Use this when helping users review or manage submission information.
    
    Args:
        course_id: The Gradescope course ID
        assignment_id: The Gradescope assignment ID
    """
    return gradescope.get_assignment_submissions(course_id, assignment_id)

@mcp.tool()
async def get_gradescope_student_submission(course_id: str, assignment_id: str, student_email: str):
    """Use this tool to retrieve a specific student's submission for a Gradescope assignment. This tool returns the submission object if found. Use this when helping a student review their own submission or when an instructor needs details about a specific student's work.
    
    Args:
        course_id: The Gradescope course ID
        assignment_id: The Gradescope assignment ID
        student_email: The email address of the student whose submission to retrieve
    """
    return gradescope.get_student_submission(course_id, assignment_id, student_email)

@mcp.tool()
async def call_search_gradescope(query: str):
    """Use this tool to search for information across Gradescope using natural language queries. This tool analyzes the query and returns relevant information about courses, assignments, or submissions. Use this when helping users find Gradescope information without knowing specific IDs or technical details.
    
    Args:
        query: Natural language query about Gradescope courses, assignments, etc.
    """
    # Analyze the query to determine what is being asked
    analysis = gradescope.analyze_gradescope_query(query)
    
    if analysis["type"] == "get_courses":
        # User is asking about courses
        courses = gradescope._get_gradescope_courses()
        if not courses:
            return {"error": "Could not retrieve Gradescope courses"}
        return courses
    
    elif analysis["type"] == "get_assignments":
        # User is asking about assignments
        course_id = analysis.get("course_id")
        course_name = analysis.get("course_name")
        
        # If we don't have a course ID but have a name, try to get the ID
        if not course_id and course_name:
            course = gradescope.get_course_by_name(course_name)
            if course:
                course_id = course.get("id")
        
        # If we still don't have a course ID, return an error
        if not course_id:
            # Try to get all courses and return that instead
            courses = gradescope._get_gradescope_courses()
            if courses:
                return {
                    "message": "Please specify which course you're interested in. Here are your courses:",
                    "courses": courses
                }
            else:
                return {"error": "Could not determine which course to get assignments for"}
        
        # Get assignments for the course
        assignments = gradescope.get_assignments_for_course(course_id)
        if not assignments:
            return {"error": f"No assignments found for the course {course_name or course_id}"}
        
        return assignments
    
    elif analysis["type"] == "get_submission":
        # User is asking about a submission
        course_id = analysis.get("course_id")
        course_name = analysis.get("course_name")
        assignment_id = analysis.get("assignment_id")
        assignment_name = analysis.get("assignment_name")
        
        # If we don't have a course ID but have a name, try to get the ID
        if not course_id and course_name:
            course = gradescope.get_course_by_name(course_name)
            if course:
                course_id = course.get("id")
        
        # If we don't have an assignment ID but have a name and course ID, try to get the ID
        if not assignment_id and assignment_name and course_id:
            assignment = gradescope.get_assignment_by_name(course_id, assignment_name)
            if assignment:
                assignment_id = assignment.id
        
        # If we still don't have both IDs, return an error
        if not course_id or not assignment_id:
            return {"error": "Could not determine which course or assignment to get submissions for"}
        
        # Get submissions for the assignment
        submissions = gradescope.get_assignment_submissions(course_id, assignment_id)
        if not submissions:
            return {"error": f"No submissions found for the assignment {assignment_name or assignment_id}"}
        
        return submissions
    
    else:
        # Unknown query type
        return {
            "error": "I'm not sure what you're asking about Gradescope. Try asking about your courses, assignments, or submissions."
        }



if __name__ == "__main__":
        # Initialize and run the server
        mcp.run(transport='stdio')
