Quick Start

#️⃣ Clone the Repository

git clone [https://github.com/your-org/voicebridge.git](https://github.com/your-org/voicebridge.git)
cd voicebridge


#️⃣ Backend Initialization

# Setup virtual environment
cd voicebridge-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies & Whisper models
pip install -r requirements.txt
python -c "import whisper; whisper.load_model('medium')"

# Set environment variables
export FLASK_APP=app.py
export WHISPER_PRECISION=fp16
flask run --port 5000


#️⃣ Frontend Initialization

cd voicebridge-frontend
npm install --legacy-peer-deps

# Start development server
npm start
