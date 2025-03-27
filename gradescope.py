from gradescopeapi.classes.connection import GSConnection
from datetime import datetime
import json
import os
import traceback
import sys
from typing import List, Dict, Optional, Any, Union

from dotenv import load_dotenv

load_dotenv()

"""
Gradescope API integration functions
"""

# Credentials
DEFAULT_EMAIL = os.getenv("GRADESCOPE_EMAIL")
DEFAULT_PASSWORD = os.getenv("GRADESCOPE_PASSWORD")

# Cache storage
cache = {
    "connection": None,
    "courses": None,
    "assignments": {},
    "submissions": {},
    "users": {},
    "extensions": {}
}

def get_connection():
    """Get a GSConnection instance (with caching)"""
    if cache["connection"] is None:
        try:
            connection = GSConnection()
            connection.login(DEFAULT_EMAIL, DEFAULT_PASSWORD)
            cache["connection"] = connection
        except Exception as e:
            print(f"Error creating Gradescope connection: {e}")
            print(traceback.format_exc())
            return None
    
    return cache["connection"]

def _get_gradescope_courses():
    """Get all courses from Gradescope"""
    # Check cache first
    if cache["courses"] is not None:
        return cache["courses"]
    
    try:
        connection = get_connection()
        if not connection:
            return None
            
        courses = connection.account.get_courses()

        # Convert courses to serializable format
        serializable_courses = {
            "student": {
                f"Course ID: {course_id}": {
                    "id": course_id,
                    "name": course.name,
                    "full_name": course.full_name,
                    "semester": course.semester,
                    "year": course.year,
                    "num_grades_published": course.num_grades_published,
                    "num_assignments": course.num_assignments
                } for course_id, course in courses["student"].items()
            }
        }

        # Save to cache
        cache["courses"] = serializable_courses
        
        # Try to save to file if filesystem is writable
        try:
            is_writable = os.access(os.getcwd(), os.W_OK)
            if is_writable:
                with open("gs_courses.json", "w") as f:
                    json.dump(serializable_courses, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save courses to file: {e}")
        
        return serializable_courses
    except Exception as e:
        print(f"Error in _get_gradescope_courses: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None

def get_course_by_name(course_name: str):
    """Get a course from Gradescope by name"""
    courses = _get_gradescope_courses()
    if not courses:
        return None
        
    for course in courses["student"].values():
        if course_name.lower() in course["name"].lower() or course_name.lower() in course.get("full_name", "").lower():
            return course
    return None

def get_course_by_id(course_id: str):
    """Get a course from Gradescope by ID"""
    courses = _get_gradescope_courses()
    if not courses:
        return None
        
    for key, course in courses["student"].items():
        if f"Course ID: {course_id}" == key or course.get("id") == course_id:
            return course
    return None

def get_assignments_for_course(course_id: str):
    """Get all assignments for a course"""
    # Check cache first
    if course_id in cache["assignments"]:
        return cache["assignments"][course_id]
    
    try:
        connection = get_connection()
        if not connection:
            return None
            
        assignments = connection.account.get_assignments(course_id)
        
        # Save to cache
        cache["assignments"][course_id] = assignments
        
        return assignments
    except Exception as e:
        print(f"Error in get_assignments_for_course: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None

def get_assignment_by_name(course_id: str, assignment_name: str):
    """Get an assignment by name within a course"""
    assignments = get_assignments_for_course(course_id)
    if not assignments:
        return None
        
    for assignment in assignments:
        if assignment_name.lower() in assignment.name.lower():
            return assignment
    return None

def get_assignment_submissions(course_id: str, assignment_id: str):
    """Get all submissions for an assignment"""
    # Check cache first
    cache_key = f"{course_id}_{assignment_id}"
    if cache_key in cache["submissions"]:
        return cache["submissions"][cache_key]
    
    try:
        connection = get_connection()
        if not connection:
            return None
            
        submissions = connection.account.get_assignment_submissions(
            course_id=course_id, assignment_id=assignment_id
        )
        
        # Save to cache
        cache["submissions"][cache_key] = submissions
        
        return submissions
    except Exception as e:
        print(f"Error in get_assignment_submissions: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None

def get_student_submission(course_id: str, assignment_id: str, student_email: str):
    """Get a specific student's submission for an assignment"""
    try:
        connection = get_connection()
        if not connection:
            return None
            
        submission = connection.account.get_assignment_submission(
            student_email=student_email,
            course_id=course_id,
            assignment_id=assignment_id
        )
        
        return submission
    except Exception as e:
        print(f"Error in get_student_submission: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None

def get_course_users(course_id: str):
    """Get all users for a course"""
    # Check cache first
    if course_id in cache["users"]:
        return cache["users"][course_id]
    
    try:
        connection = get_connection()
        if not connection:
            return None
            
        users = connection.account.get_course_users(course_id)
        
        # Save to cache
        cache["users"][course_id] = users
        
        return users
    except Exception as e:
        print(f"Error in get_course_users: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None

def get_assignment_extensions(course_id: str, assignment_id: str):
    """Get all extensions for an assignment"""
    # Check cache first
    cache_key = f"{course_id}_{assignment_id}"
    if cache_key in cache["extensions"]:
        return cache["extensions"][cache_key]
    
    try:
        connection = get_connection()
        if not connection:
            return None
        
        from gradescopeapi.classes.extensions import get_extensions
        
        extensions = get_extensions(
            session=connection.session,
            course_id=course_id,
            assignment_id=assignment_id
        )
        
        # Save to cache
        cache["extensions"][cache_key] = extensions
        
        return extensions
    except Exception as e:
        print(f"Error in get_assignment_extensions: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return None

def update_student_extension(
    course_id: str,
    assignment_id: str,
    user_id: str,
    release_date: datetime,
    due_date: datetime,
    late_due_date: datetime
):
    """Update an extension for a student on an assignment"""
    try:
        connection = get_connection()
        if not connection:
            return False
            
        from gradescopeapi.classes.extensions import update_student_extension as gs_update_extension
        
        success = gs_update_extension(
            session=connection.session,
            course_id=course_id,
            assignment_id=assignment_id,
            user_id=user_id,
            release_date=release_date,
            due_date=due_date,
            late_due_date=late_due_date
        )
        
        # Clear the cache for this assignment's extensions
        cache_key = f"{course_id}_{assignment_id}"
        if cache_key in cache["extensions"]:
            del cache["extensions"][cache_key]
            
        return success
    except Exception as e:
        print(f"Error in update_student_extension: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return False

def update_assignment_dates(
    course_id: str,
    assignment_id: str,
    release_date: datetime,
    due_date: datetime,
    late_due_date: datetime
):
    """Update the dates for an assignment"""
    try:
        connection = get_connection()
        if not connection:
            return False
            
        from gradescopeapi.classes.assignments import update_assignment_date
        
        success = update_assignment_date(
            session=connection.session,
            course_id=course_id,
            assignment_id=assignment_id,
            release_date=release_date,
            due_date=due_date,
            late_due_date=late_due_date
        )
        
        # Clear the cache for this course's assignments
        if course_id in cache["assignments"]:
            del cache["assignments"][course_id]
            
        return success
    except Exception as e:
        print(f"Error in update_assignment_dates: {e}")
        print(f"Line number: {sys.exc_info()[-1].tb_lineno}")
        print(traceback.format_exc())
        return False

def analyze_gradescope_query(query: str) -> Dict[str, Any]:
    """
    Analyze a natural language query to determine what Gradescope information is being requested
    
    Returns a dictionary with extracted parameters and context
    """
    # This is a simple keyword-based analysis
    # In a real implementation, this would use a more sophisticated NLP approach
    
    result = {
        "type": None,
        "course_id": None,
        "course_name": None,
        "assignment_id": None,
        "assignment_name": None,
        "student_email": None,
        "confidence": 0.0
    }
    
    # Check for courses request
    if any(keyword in query.lower() for keyword in ["my courses", "list courses", "show courses", "what courses"]):
        result["type"] = "get_courses"
        result["confidence"] = 0.9
        return result
        
    # Check for assignments request
    if any(keyword in query.lower() for keyword in ["assignments", "homework", "due dates"]):
        result["type"] = "get_assignments"
        result["confidence"] = 0.8
        
        # Try to extract course name
        courses = _get_gradescope_courses()
        if courses:
            for course_data in courses["student"].values():
                course_name = course_data["name"]
                if course_name.lower() in query.lower():
                    result["course_name"] = course_name
                    result["course_id"] = course_data["id"]
                    result["confidence"] = 0.9
                    break
                    
        return result
        
    # Check for submission request
    if any(keyword in query.lower() for keyword in ["submission", "submitted", "grade", "feedback", "score"]):
        result["type"] = "get_submission"
        result["confidence"] = 0.7
        
        # Try to extract course and assignment
        courses = _get_gradescope_courses()
        if courses:
            for course_data in courses["student"].values():
                if course_data["name"].lower() in query.lower():
                    result["course_name"] = course_data["name"]
                    result["course_id"] = course_data["id"]
                    
                    # If we found a course, try to find an assignment
                    assignments = get_assignments_for_course(course_data["id"])
                    if assignments:
                        for assignment in assignments:
                            if assignment.name.lower() in query.lower():
                                result["assignment_name"] = assignment.name
                                result["assignment_id"] = assignment.id
                                result["confidence"] = 0.9
                                break
                    break
                    
        return result
        
    # Default to unknown query type
    return result

# For testing
if __name__ == "__main__":
    print("Testing Gradescope API functions")
    
    # Get courses
    print("Getting courses...")
    courses = _get_gradescope_courses()
    print(f"Found {len(courses['student']) if courses else 0} courses")
    
    if courses:
        # Get a course by name
        course_name = next(iter(courses["student"].values()))["name"]
        print(f"Getting course by name: {course_name}")
        course = get_course_by_name(course_name)
        print(f"Found course: {course}")
        
        if course:
            # Get assignments for the course
            course_id = course["id"]
            print(f"Getting assignments for course ID: {course_id}")
            assignments = get_assignments_for_course(course_id)
            print(f"Found {len(assignments) if assignments else 0} assignments")
            
            if assignments and len(assignments) > 0:
                # Get submissions for an assignment
                assignment = assignments[0]
                print(f"Getting submissions for assignment: {assignment.name}")
                submissions = get_assignment_submissions(course_id, assignment.id)
                print(f"Found submissions: {submissions}")
