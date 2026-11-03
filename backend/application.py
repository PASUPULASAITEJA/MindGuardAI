import os
import uvicorn
from app.main import app as application

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(application, host="0.0.0.0", port=port)
