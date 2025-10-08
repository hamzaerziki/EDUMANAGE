#!/usr/bin/env python3
"""
Simple FastAPI server launcher that properly imports the app
"""

import sys
import os
import uvicorn
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.absolute()
sys.path.insert(0, str(project_root))

# Import the app
from app.main import app

if __name__ == "__main__":
    print(f"🚀 Starting EduManage FastAPI server...")
    print(f"📁 Project root: {project_root}")
    print(f"🔧 Python path: {sys.path[:3]}")
    
    # Start the server
    uvicorn.run(
        app,
        host="0.0.0.0", 
        port=8000,
        reload=False,  # Disable reload for stability
        log_level="info"
    )