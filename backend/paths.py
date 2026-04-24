# ==============================================================================
# MTRX-TriAxis | Cross-Platform Path Configuration
# ==============================================================================
# All data directory paths are defined here using os.path.join() so that
# the correct separator (/ on Mac/Linux, \ on Windows) is used automatically.
#
# Import this module wherever you need a data path:
#   from backend.paths import DATA_DIR, DB_PATH, VECTORSTORE_DIR, UPLOADS_DIR

import os

# Root of all persisted data (sits next to app.py)
DATA_DIR = os.path.join("data")

# SQLite database
DB_PATH = os.path.join(DATA_DIR, "classroom.db")

# FAISS vector store
VECTORSTORE_DIR = os.path.join(DATA_DIR, "vectorstore")

# PDF uploads
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
