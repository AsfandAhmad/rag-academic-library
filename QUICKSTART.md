# 🚀 Quick Start Guide

Get the RAG Academic Library running in 5 minutes!

---

## ⚡ Fast Setup

### **1. Get API Keys (2 minutes)**

#### Groq API Key (Free)
1. Go to https://console.groq.com
2. Sign up / Log in
3. Go to "API Keys"
4. Click "Create API Key"
5. Copy the key

#### Pinecone API Key (Free)
1. Go to https://www.pinecone.io
2. Sign up / Log in
3. Go to "API Keys"
4. Copy your API key
5. Note your region (e.g., us-east-1)

---

### **2. Backend Setup (2 minutes)**

```bash
# Navigate to project
cd ~/Desktop/IR_Project

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r Backend/requirements.txt

# Configure environment
cp Backend/.env.example Backend/.env
nano Backend/.env  # Or use any text editor
```

**Edit Backend/.env:**
```env
GROQ_API_KEY=paste_your_groq_key_here
PINECONE_API_KEY=paste_your_pinecone_key_here
PINECONE_REGION=us-east-1  # Or your region
```

**Start backend:**
```bash
cd Backend
uvicorn main:app --reload
```

✅ Backend running at: http://localhost:8000

---

### **3. Frontend Setup (1 minute)**

**Open new terminal:**
```bash
cd ~/Desktop/IR_Project

# Install dependencies
npm install

# Start frontend
npm run dev
```

✅ Frontend running at: http://localhost:3000

---

## 🎉 You're Ready!

1. Open http://localhost:3000
2. Click "Register"
3. Create account
4. Upload a PDF
5. Ask questions!

---

## 🐛 Common Issues

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -i :8000
# Kill process if needed
kill -9 <PID>
```

### Frontend won't start
```bash
# Check if port 3000 is in use
lsof -i :3000
# Kill process if needed
kill -9 <PID>
```

### "Module not found" error
```bash
# Recreate virtual environment
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r Backend/requirements.txt
```

### API connection error
- Ensure backend is running on port 8000
- Check Backend/.env has correct API keys
- Verify no firewall blocking localhost

---

## 📚 Next Steps

- Read full [README.md](README.md) for detailed documentation
- Check API docs at http://localhost:8000/docs
- Try uploading academic PDFs
- Experiment with different questions

---

**Need Help?**
- Check terminal logs for errors
- Open browser console (F12) for frontend errors
- Verify API keys are correct
