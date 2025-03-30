import os
import requests
import glob
from typing import Optional, Dict, List
from pathlib import Path

class CanvasIntegrator:
    def __init__(self, api_token: str, course_id: str, base_url: str = "https://ucsb.instructure.com"):
        self.api_token = api_token
        self.course_id = course_id
        self.base_url = base_url.rstrip('/')
        self.headers = {
            'Authorization': f'Bearer {api_token}'
        }
        self._modules = {}  # Cache for created modules

    def get_or_create_module(self, name: str, position: Optional[int] = None) -> Dict:
        """Get existing module or create a new one."""
        if name in self._modules:
            return self._modules[name]
        
        # List existing modules
        url = f"{self.base_url}/api/v1/courses/{self.course_id}/modules"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        
        # Check if module exists
        for module in response.json():
            if module['name'] == name:
                self._modules[name] = module
                return module
        
        # Create new module if it doesn't exist
        data = {'module[name]': name}
        if position is not None:
            data['module[position]'] = position
        
        response = requests.post(url, headers=self.headers, data=data)
        response.raise_for_status()
        module = response.json()
        self._modules[name] = module
        return module

    def upload_file(self, filepath: str, folder_path: Optional[str] = None) -> Dict:
        """Upload a file to Canvas."""
        url = f"{self.base_url}/api/v1/courses/{self.course_id}/files"
        
        filename = os.path.basename(filepath)
        data = {
            'name': filename,
            'parent_folder_path': folder_path,
        }
        
        response = requests.post(url, headers=self.headers, data=data)
        response.raise_for_status()
        upload_data = response.json()
        
        with open(filepath, 'rb') as file:
            files = {'file': file}
            response = requests.post(upload_data['upload_url'], data=upload_data['upload_params'], files=files)
            response.raise_for_status()
            
        return response.json()

    def create_module_item(self, module_id: str, title: str, file_id: Optional[str] = None, 
                         external_url: Optional[str] = None, position: Optional[int] = None) -> Dict:
        """Create a module item in Canvas."""
        url = f"{self.base_url}/api/v1/courses/{self.course_id}/modules/{module_id}/items"
        
        data = {
            'module_item[title]': title,
            'module_item[type]': 'File' if file_id else 'ExternalUrl',
        }
        
        if file_id:
            data['module_item[content_id]'] = file_id
        elif external_url:
            data['module_item[external_url]'] = external_url
        
        if position is not None:
            data['module_item[position]'] = position
            
        response = requests.post(url, headers=self.headers, data=data)
        response.raise_for_status()
        return response.json()

    def get_module_items(self, module_id: str) -> List:
        """Get all items in a module."""
        url = f"{self.base_url}/api/v1/courses/{self.course_id}/modules/{module_id}/items"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def delete_module(self, module_id: str, module_name: str) -> None:
        """Delete a module from Canvas if it's one we manage."""
        # List of modules we manage automatically
        managed_modules = ["Lecture Materials", "Discussion Activities", "Review Sessions"]
        
        if module_name in managed_modules:
            print(f"Deleting module: {module_name}...")
            url = f"{self.base_url}/api/v1/courses/{self.course_id}/modules/{module_id}"
            response = requests.delete(url, headers=self.headers)
            response.raise_for_status()
        else:
            print(f"Skipping deletion of manually managed module: {module_name}")

    def delete_managed_modules(self) -> None:
        """Delete only the modules that we manage automatically."""
        url = f"{self.base_url}/api/v1/courses/{self.course_id}/modules"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        
        for module in response.json():
            self.delete_module(module['id'], module['name'])

    def sync_materials(self):
        """Sync all course materials to Canvas."""
        print("Starting Canvas sync...")
        
        # Get existing modules instead of deleting them
        url = f"{self.base_url}/api/v1/courses/{self.course_id}/modules"
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        existing_modules = {module['name']: module for module in response.json()}
        
        # Course Information Module (position 1, manually managed)
        course_info = existing_modules.get("Course Information") or self.get_or_create_module("Course Information", position=1)
        print("Found/Created Course Information module")
        
        # Upload syllabus if it exists
        syllabus_path = Path("course_materials/syllabus.pdf")
        if syllabus_path.exists():
            try:
                print("Uploading syllabus...")
                file_data = self.upload_file(str(syllabus_path), "course_materials")
                # Only create the item if it doesn't already exist
                existing_items = self.get_module_items(course_info['id'])
                if not any(item.get('title') == "Course Syllabus" for item in existing_items):
                    self.create_module_item(
                        course_info['id'],
                        "Course Syllabus",
                        file_id=file_data['id'],
                        position=1
                    )
            except Exception as e:
                print(f"Error uploading syllabus: {e}")
        
        # Lecture Materials Module (position 2)
        lecture_materials = existing_modules.get("Lecture Materials") or self.get_or_create_module("Lecture Materials", position=2)
        print("Found/Created Lecture Materials module")
        
        # Discussion Activities Module (position 3)
        discussion_activities = existing_modules.get("Discussion Activities") or self.get_or_create_module("Discussion Activities", position=3)
        print("Found/Created Discussion Activities module")
        
        # Review Session Module (position 4)
        review_sessions = existing_modules.get("Review Sessions") or self.get_or_create_module("Review Sessions", position=4)
        print("Found/Created Review Sessions module")

        # Upload and organize lecture slides
        slides_dir = Path("lecture_slides")
        if slides_dir.exists():
            for slide in sorted(slides_dir.glob("*.pdf")):
                try:
                    print(f"Uploading {slide.name}...")
                    file_data = self.upload_file(str(slide), "lecture_slides")
                    # Extract lecture number from "Lecture1_updated.pdf" format
                    lecture_num = int(''.join(filter(str.isdigit, slide.stem.split('_')[0])))
                    self.create_module_item(
                        lecture_materials['id'],
                        f"Lecture {lecture_num} - Slides",
                        file_id=file_data['id'],
                        position=lecture_num * 2 - 1  # Odd positions for slides
                    )
                except Exception as e:
                    print(f"Error uploading {slide.name}: {e}")

        # Upload and organize lecture notes
        notes_dir = Path("lecture_notes")
        if notes_dir.exists():
            for note in sorted(notes_dir.glob("*.pdf")):
                try:
                    print(f"Uploading {note.name}...")
                    file_data = self.upload_file(str(note), "lecture_notes")
                    # Extract lecture number from "Econ 2 Lecture 1 S25.pdf" format
                    parts = note.stem.split()
                    lecture_num = int(parts[parts.index("Lecture") + 1])
                    self.create_module_item(
                        lecture_materials['id'],
                        f"Lecture {lecture_num} - Notes",
                        file_id=file_data['id'],
                        position=lecture_num * 2  # Even positions for notes
                    )
                except Exception as e:
                    print(f"Error uploading {note.name}: {e}")

        # Upload and organize activities (excluding node_modules)
        activities_dir = Path("activities")
        processed_activities = set()  # Keep track of processed activity numbers
        if activities_dir.exists():
            for activity in sorted(activities_dir.glob("activity*/index.html")):
                try:
                    activity_num = int(activity.parent.name.replace('activity', ''))
                    if activity_num not in processed_activities:  # Only process each activity number once
                        processed_activities.add(activity_num)
                        # Create external URL to GitHub Pages
                        github_url = f"https://matthewdlang18.github.io/macroeconomics-course-website/activities/activity{activity_num}/index.html"
                        self.create_module_item(
                            discussion_activities['id'],
                            f"Activity {activity_num}",
                            external_url=github_url,
                            position=activity_num
                        )
                except Exception as e:
                    print(f"Error processing activity {activity.parent.name}: {e}")

        # Upload and organize review sessions
        review_dir = Path("review_session")
        processed_weeks = set()  # Keep track of processed week numbers
        if review_dir.exists():
            for review in sorted(review_dir.glob("Week*ReviewSession.pdf")):
                try:
                    print(f"Uploading {review.name}...")
                    # Extract week number from "Week1ReviewSession.pdf" format
                    week_num = int(''.join(filter(str.isdigit, review.stem.split('Week')[1].split('Review')[0])))
                    if week_num not in processed_weeks and week_num != 5:  # Skip week 5 and duplicates
                        processed_weeks.add(week_num)
                        file_data = self.upload_file(str(review), "review_session")
                        self.create_module_item(
                            review_sessions['id'],
                            f"Week {week_num} Review Questions",
                            file_id=file_data['id'],
                            position=week_num
                        )
                except Exception as e:
                    print(f"Error uploading {review.name}: {e}")

def main():
    api_token = os.environ.get('CANVAS_API_TOKEN')
    course_id = os.environ.get('CANVAS_COURSE_ID')
    
    if not api_token or not course_id:
        print("Please set CANVAS_API_TOKEN and CANVAS_COURSE_ID environment variables")
        return
    
    canvas = CanvasIntegrator(api_token, course_id)
    
    try:
        canvas.sync_materials()
        print("Successfully synced materials to Canvas!")
        
    except requests.exceptions.RequestException as e:
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    main()
