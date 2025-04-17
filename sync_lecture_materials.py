import os
import shutil
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class SyncHandler(FileSystemEventHandler):
    def __init__(self, source_dir, target_dir):
        self.source_dir = source_dir
        self.target_dir = target_dir
        
    def on_modified(self, event):
        if not event.is_directory:
            self.sync_files()

    def sync_files(self):
        for item in os.listdir(self.source_dir):
            source_path = os.path.join(self.source_dir, item)
            target_path = os.path.join(self.target_dir, item)
            
            if os.path.isfile(source_path):
                try:
                    shutil.copy2(source_path, target_path)
                    print(f"Synced: {item}")
                except Exception as e:
                    print(f"Error syncing {item}: {str(e)}")

def setup_sync(source_dir, target_dir):
    if not os.path.exists(source_dir):
        os.makedirs(source_dir)
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
    
    event_handler = SyncHandler(source_dir, target_dir)
    observer = Observer()
    observer.schedule(event_handler, source_dir, recursive=False)
    observer.start()
    
    print(f"Syncing {source_dir} to {target_dir}...")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    # Lecture Notes
    lecture_notes_source = "/Users/mattlang/Cursor/macroeconomics-course-website/lecture_notes"
    lecture_notes_target = "/Users/mattlang/Dropbox/Matt/2025/Spring/ECON2/Lecture Notes"
    
    # Lecture Slides
    lecture_slides_source = "/Users/mattlang/Cursor/macroeconomics-course-website/lecture_slides"
    lecture_slides_target = "/Users/mattlang/Dropbox/Matt/2025/Spring/ECON2/Lecture Slides"
    
    # Start sync for both directories
    print("Starting lecture materials synchronization...")
    setup_sync(lecture_notes_source, lecture_notes_target)
    setup_sync(lecture_slides_source, lecture_slides_target)
