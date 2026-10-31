import os
import sys

# Ensure backend directory is in the python search path
backend_path = os.path.join(os.path.dirname(__file__), "..", "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app import create_app

app = create_app()

if __name__ == "__main__":
    app.run()

