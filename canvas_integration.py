import os
import requests
import time
from typing import Optional, Dict, List, Any
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
        self._files_cache = {}  # Cache for existing files

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

    def get_files_in_folder(self, folder_path: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all files in a specific folder path."""
        url = f"{self.base_url}/api/v1/courses/{self.course_id}/files"
        params = {'per_page': 100}
        if folder_path:
            params['search_term'] = folder_path

        all_files = []
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        files = response.json()
        all_files.extend(files)

        # Handle pagination if needed
        while 'next' in response.links:
            response = requests.get(response.links['next']['url'], headers=self.headers)
            response.raise_for_status()
            files = response.json()
            all_files.extend(files)

        # Cache files by name for quick lookup
        for file in all_files:
            self._files_cache[file['filename']] = file

        return all_files

    def get_file_by_name(self, filename: str, folder_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get a file by its name, optionally filtering by folder path.

        For lecture materials, also tries to find files with similar names to prevent duplicates.
        """
        # Debug for Lecture 6
        is_lecture6 = "Lecture6" in filename or "Lecture 6" in filename
        if is_lecture6:
            print(f"\n==== LOOKING FOR FILE: '{filename}' in '{folder_path}' ====")
            print(f"Cache has {len(self._files_cache)} files")

        # Check cache first for exact match
        if filename in self._files_cache:
            file = self._files_cache[filename]
            # If folder path is specified, check if the file is in that folder
            if folder_path and folder_path not in file.get('folder_path', ''):
                if is_lecture6:
                    print(f"Found exact filename match but wrong folder: {file.get('folder_path', '')}")
                return None
            if is_lecture6:
                print(f"EXACT MATCH FOUND for '{filename}' in cache")
            return file

        # If not in cache, fetch all files in the folder
        if is_lecture6:
            print(f"No exact match in cache, fetching files from folder '{folder_path}'")
        self.get_files_in_folder(folder_path)

        # Check cache again for exact match
        if filename in self._files_cache:
            file = self._files_cache[filename]
            # If folder path is specified, check if the file is in that folder
            if folder_path and folder_path not in file.get('folder_path', ''):
                if is_lecture6:
                    print(f"Found exact filename match after fetch but wrong folder: {file.get('folder_path', '')}")
                return None
            if is_lecture6:
                print(f"EXACT MATCH FOUND for '{filename}' after fetching")
            return file

        # For lecture materials, try to find similar files to prevent duplicates
        if folder_path in ["lecture_slides", "lecture_notes"] and (filename.startswith("Lecture") or filename.startswith("Econ 2 Lecture")):
            try:
                # Extract lecture number
                lecture_num = None
                if filename.startswith("Lecture"):
                    # For slides: "Lecture6_updated.pdf"
                    lecture_num = int(''.join(filter(str.isdigit, filename.split('_')[0])))
                    if is_lecture6:
                        print(f"Extracted lecture number {lecture_num} from slides filename '{filename}'")
                else:
                    # For notes: "Econ 2 Lecture 6 S25.pdf"
                    parts = filename.split()
                    lecture_num = int(parts[parts.index("Lecture") + 1])
                    if is_lecture6:
                        print(f"Extracted lecture number {lecture_num} from notes filename '{filename}'")

                # Look for files with the same lecture number
                if is_lecture6:
                    print(f"Looking for files with lecture number {lecture_num}")

                for cached_filename, file in self._files_cache.items():
                    if folder_path and folder_path not in file.get('folder_path', ''):
                        if is_lecture6 and "Lecture" in cached_filename:
                            print(f"Skipping '{cached_filename}' due to wrong folder: {file.get('folder_path', '')}")
                        continue

                    try:
                        cached_lecture_num = None
                        if cached_filename.startswith("Lecture"):
                            cached_lecture_num = int(''.join(filter(str.isdigit, cached_filename.split('_')[0])))
                            if is_lecture6 and cached_lecture_num == 6:
                                print(f"Found slides with lecture number {cached_lecture_num}: '{cached_filename}'")
                        elif cached_filename.startswith("Econ 2 Lecture"):
                            cached_parts = cached_filename.split()
                            cached_lecture_num = int(cached_parts[cached_parts.index("Lecture") + 1])
                            if is_lecture6 and cached_lecture_num == 6:
                                print(f"Found notes with lecture number {cached_lecture_num}: '{cached_filename}'")

                        if cached_lecture_num == lecture_num:
                            print(f"Found similar file: '{cached_filename}' that matches '{filename}'")
                            if is_lecture6:
                                print(f"SIMILAR MATCH FOUND: '{cached_filename}' for '{filename}'")
                            return file
                    except (ValueError, IndexError) as e:
                        if is_lecture6 and "Lecture" in cached_filename:
                            print(f"Error parsing '{cached_filename}': {str(e)}")
                        continue
            except (ValueError, IndexError) as e:
                # If we can't parse the lecture number, fall back to exact match only
                if is_lecture6:
                    print(f"Error extracting lecture number from '{filename}': {str(e)}")
                pass

        if is_lecture6:
            print(f"NO MATCH FOUND for '{filename}'")

        return None

    def upload_file(self, filepath: str, folder_path: Optional[str] = None) -> Dict:
        """Upload a file to Canvas if it doesn't already exist."""
        filename = os.path.basename(filepath)
        is_lecture6 = "Lecture6" in filename or "Lecture 6" in filename

        if is_lecture6:
            print(f"\n==== UPLOADING FILE: '{filename}' to '{folder_path}' ====")

        # Check if file already exists
        existing_file = self.get_file_by_name(filename, folder_path)
        if existing_file:
            print(f"File {filename} already exists in Canvas, using existing file.")
            if is_lecture6:
                print(f"Using existing file with ID: {existing_file.get('id')}")
                print(f"Existing file details: {existing_file.get('filename')}, {existing_file.get('display_name')}")
            return existing_file

        # Special handling for Lecture 6 - double check by listing all files in the folder
        if is_lecture6:
            print("Double-checking for Lecture 6 files in Canvas...")
            all_files = self.get_files_in_folder(folder_path)
            print(f"Found {len(all_files)} files in folder '{folder_path}'")

            # Look for any file that might be Lecture 6
            for file in all_files:
                file_name = file.get('filename', '')
                if ("Lecture6" in file_name or "Lecture 6" in file_name) and folder_path in file.get('folder_path', ''):
                    print(f"Found potential match for Lecture 6: {file_name}")
                    print(f"Using existing file with ID: {file.get('id')}")
                    return file

            print("No existing Lecture 6 file found after thorough check, proceeding with upload")

        # File doesn't exist, proceed with upload
        url = f"{self.base_url}/api/v1/courses/{self.course_id}/files"

        data = {
            'name': filename,
            'parent_folder_path': folder_path,
        }

        if is_lecture6:
            print(f"Initiating upload request for '{filename}'")

        response = requests.post(url, headers=self.headers, data=data)
        response.raise_for_status()
        upload_data = response.json()

        if is_lecture6:
            print(f"Got upload URL, sending file content")

        with open(filepath, 'rb') as file:
            files = {'file': file}
            response = requests.post(upload_data['upload_url'], data=upload_data['upload_params'], files=files)
            response.raise_for_status()

        # Add to cache
        file_data = response.json()
        self._files_cache[filename] = file_data

        if is_lecture6:
            print(f"Successfully uploaded '{filename}' with ID: {file_data.get('id')}")

        return file_data

    def get_module_items(self, module_id: str) -> List:
        """Get all items in a module."""
        url = f"{self.base_url}/api/v1/courses/{self.course_id}/modules/{module_id}/items"
        params = {'per_page': 100}  # Get more items per page

        all_items = []
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        items = response.json()
        all_items.extend(items)

        # Handle pagination if needed
        while 'next' in response.links:
            response = requests.get(response.links['next']['url'], headers=self.headers)
            response.raise_for_status()
            items = response.json()
            all_items.extend(items)

        return all_items

    def item_exists_in_module(self, module_id: str, title: str) -> bool:
        """Check if an item with the given title already exists in the module.

        For lecture materials, also checks for similar titles to prevent duplicates.
        """
        items = self.get_module_items(module_id)

        # Debug for Lecture 6
        if "Lecture 6" in title:
            print(f"\n==== CHECKING IF ITEM EXISTS: '{title}' ====")
            print(f"Module ID: {module_id}")
            print(f"Found {len(items)} items in module")
            for item in items:
                print(f"  - Item: '{item['title']}'")

        # Exact title match
        if any(item['title'] == title for item in items):
            if "Lecture 6" in title:
                print(f"EXACT MATCH FOUND for '{title}'")
            return True

        # For lecture materials, do additional checks to prevent duplicates
        if title.startswith("Lecture ") and (" - Slides" in title or " - Notes" in title):
            # Extract lecture number
            try:
                lecture_num = int(title.split("Lecture ")[1].split(" -")[0])
                material_type = "Slides" if "- Slides" in title else "Notes"

                # Check for any item with the same lecture number and material type
                for item in items:
                    item_title = item['title']
                    if item_title.startswith(f"Lecture {lecture_num}") and f"- {material_type}" in item_title:
                        print(f"Found similar item: '{item_title}' that matches '{title}'")
                        if "Lecture 6" in title:
                            print(f"SIMILAR MATCH FOUND for '{title}' -> '{item_title}'")
                        return True
            except (ValueError, IndexError):
                # If we can't parse the lecture number, fall back to exact match only
                if "Lecture 6" in title:
                    print(f"ERROR parsing lecture number for '{title}'")
                pass

        if "Lecture 6" in title:
            print(f"NO MATCH FOUND for '{title}'")

        return False

    def create_module_item(self, module_id: str, title: str, file_id: Optional[str] = None,
                         external_url: Optional[str] = None, position: Optional[int] = None) -> Dict:
        """Create a module item in Canvas if it doesn't already exist."""
        is_lecture6 = "Lecture 6" in title
        if is_lecture6:
            print(f"\n==== CREATING MODULE ITEM: '{title}' ====")
            print(f"Module ID: {module_id}")
            print(f"File ID: {file_id}")
            print(f"Position: {position}")

        # Check if item already exists
        if self.item_exists_in_module(module_id, title):
            print(f"Module item '{title}' already exists, skipping creation.")
            # Return a dummy dict to maintain compatibility
            return {"id": "existing", "title": title}

        if is_lecture6:
            print(f"No existing item found, creating new module item for '{title}'")

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

        if is_lecture6:
            print(f"Sending request with data: {data}")

        response = requests.post(url, headers=self.headers, data=data)
        response.raise_for_status()
        result = response.json()

        if is_lecture6:
            print(f"Created module item with ID: {result.get('id')}")

        return result

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

        # Pre-load existing files to avoid duplicate uploads
        print("Loading existing files from Canvas...")
        self.get_files_in_folder("lecture_slides")
        self.get_files_in_folder("lecture_notes")
        self.get_files_in_folder("course_materials")
        self.get_files_in_folder("review_session")

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
                if not self.item_exists_in_module(course_info['id'], "Course Syllabus"):
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

        # Track processed lecture numbers to prevent duplicates
        processed_lecture_slides = set()
        processed_lecture_notes = set()

        # Pre-check for existing Lecture 6 items to prevent duplicates
        lecture_materials_items = self.get_module_items(lecture_materials['id'])
        print(f"\n==== PRE-CHECKING FOR LECTURE 6 ITEMS ====")
        print(f"Found {len(lecture_materials_items)} items in Lecture Materials module")

        for item in lecture_materials_items:
            if "Lecture 6 - Slides" in item['title']:
                print(f"Found existing Lecture 6 slides item: '{item['title']}' with ID {item['id']}")
                processed_lecture_slides.add(6)
            elif "Lecture 6 - Notes" in item['title']:
                print(f"Found existing Lecture 6 notes item: '{item['title']}' with ID {item['id']}")
                processed_lecture_notes.add(6)

        # Upload and organize lecture slides
        slides_dir = Path("lecture_slides")
        if slides_dir.exists():
            print("\n==== PROCESSING LECTURE SLIDES ====")
            print(f"Files in directory: {[f.name for f in slides_dir.glob('*.pdf')]}")

            for slide in sorted(slides_dir.glob("*.pdf")):
                try:
                    is_lecture6 = "Lecture6" in slide.name
                    print(f"\nProcessing {slide.name}...")
                    # Extract lecture number from "Lecture1_updated.pdf" format
                    lecture_num = int(''.join(filter(str.isdigit, slide.stem.split('_')[0])))

                    if is_lecture6:
                        print(f"LECTURE 6 SLIDES DETECTED: {slide.name}")
                        print(f"Extracted lecture number: {lecture_num}")
                        print(f"Already processed slides: {processed_lecture_slides}")

                    # Special handling for Lecture 6 - always skip to prevent duplicates
                    if lecture_num == 6:
                        print(f"SPECIAL HANDLING: Always skipping Lecture 6 slides to prevent duplicates")
                        continue

                    # Skip if we've already processed this lecture number
                    if lecture_num in processed_lecture_slides:
                        print(f"Skipping duplicate slide for Lecture {lecture_num}")
                        continue

                    if is_lecture6:
                        print(f"Proceeding with upload for Lecture 6 slides")

                    file_data = self.upload_file(str(slide), "lecture_slides")
                    item_title = f"Lecture {lecture_num} - Slides"

                    if is_lecture6:
                        print(f"Creating module item with title: '{item_title}'")
                        print(f"File data ID: {file_data['id']}")

                    self.create_module_item(
                        lecture_materials['id'],
                        item_title,
                        file_id=file_data['id'],
                        position=lecture_num * 2 - 1  # Odd positions for slides
                    )

                    # Mark this lecture number as processed
                    processed_lecture_slides.add(lecture_num)
                    if is_lecture6:
                        print(f"Added lecture number {lecture_num} to processed_lecture_slides")
                        print(f"Updated processed slides: {processed_lecture_slides}")
                except Exception as e:
                    print(f"Error processing {slide.name}: {e}")

        # Upload and organize lecture notes
        notes_dir = Path("lecture_notes")
        if notes_dir.exists():
            for note in sorted(notes_dir.glob("*.pdf")):
                try:
                    print(f"Processing {note.name}...")
                    # Extract lecture number from "Econ 2 Lecture 1 S25.pdf" format
                    parts = note.stem.split()
                    lecture_num = int(parts[parts.index("Lecture") + 1])

                    is_lecture6 = lecture_num == 6
                    if is_lecture6:
                        print(f"LECTURE 6 NOTES DETECTED: {note.name}")
                        print(f"Extracted lecture number: {lecture_num}")
                        print(f"Already processed notes: {processed_lecture_notes}")

                    # Special handling for Lecture 6 - always skip to prevent duplicates
                    if lecture_num == 6:
                        print(f"SPECIAL HANDLING: Always skipping Lecture 6 notes to prevent duplicates")
                        continue

                    # Skip if we've already processed this lecture number
                    if lecture_num in processed_lecture_notes:
                        print(f"Skipping duplicate note for Lecture {lecture_num}")
                        continue

                    file_data = self.upload_file(str(note), "lecture_notes")
                    item_title = f"Lecture {lecture_num} - Notes"

                    self.create_module_item(
                        lecture_materials['id'],
                        item_title,
                        file_id=file_data['id'],
                        position=lecture_num * 2  # Even positions for notes
                    )

                    # Mark this lecture number as processed
                    processed_lecture_notes.add(lecture_num)
                except Exception as e:
                    print(f"Error processing {note.name}: {e}")

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
                        item_title = f"Activity {activity_num}"

                        self.create_module_item(
                            discussion_activities['id'],
                            item_title,
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
                    print(f"Processing {review.name}...")
                    # Extract week number from "Week1ReviewSession.pdf" format
                    week_num = int(''.join(filter(str.isdigit, review.stem.split('Week')[1].split('Review')[0])))
                    if week_num not in processed_weeks and week_num != 5:  # Skip week 5 and duplicates
                        processed_weeks.add(week_num)
                        file_data = self.upload_file(str(review), "review_session")
                        item_title = f"Week {week_num} Review Questions"

                        self.create_module_item(
                            review_sessions['id'],
                            item_title,
                            file_id=file_data['id'],
                            position=week_num
                        )
                except Exception as e:
                    print(f"Error processing {review.name}: {e}")

def main():
    api_token = os.environ.get('CANVAS_API_TOKEN')
    course_id = os.environ.get('CANVAS_COURSE_ID')

    if not api_token or not course_id:
        print("Please set CANVAS_API_TOKEN and CANVAS_COURSE_ID environment variables")
        return

    canvas = CanvasIntegrator(api_token, course_id)

    try:
        print("\n==== STARTING CANVAS SYNC ====")
        print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        canvas.sync_materials()
        print("\n==== SYNC COMPLETED SUCCESSFULLY ====")
        print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")

    except requests.exceptions.RequestException as e:
        print(f"\n==== ERROR DURING SYNC ====")
        print(f"Error occurred: {e}")

if __name__ == "__main__":
    main()
