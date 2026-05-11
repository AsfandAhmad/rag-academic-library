# ✅ Deployment Checklist

Use this checklist before deploying to production or sharing the project.

---

## 🔐 Security

- [ ] Change `JWT_SECRET_KEY` in `.env` to a strong random string
- [ ] Verify `.env` files are in `.gitignore`
- [ ] Remove any hardcoded API keys from code
- [ ] Review CORS settings in `Backend/main.py`
- [ ] Enable HTTPS in production
- [ ] Set secure cookie flags if using cookies
- [ ] Review user input validation
- [ ] Test authentication edge cases

---

## 🔑 API Keys

- [ ] Obtain Groq API key from https://console.groq.com
- [ ] Obtain Pinecone API key from https://www.pinecone.io
- [ ] Add keys to `Backend/.env`
- [ ] Verify keys are working (test API calls)
- [ ] Set up API key rotation policy
- [ ] Monitor API usage and quotas

---

## 🗄️ Database

- [ ] Verify SQLite database path is correct
- [ ] Test database initialization
- [ ] Backup database before major changes
- [ ] Consider PostgreSQL for production
- [ ] Set up database backups
- [ ] Test database migrations

---

## 📦 Dependencies

### Backend
- [ ] Run `pip install -r Backend/requirements.txt`
- [ ] Verify all packages install successfully
- [ ] Check for security vulnerabilities: `pip audit`
- [ ] Update outdated packages if needed

### Frontend
- [ ] Run `npm install`
- [ ] Verify no errors during installation
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Fix critical vulnerabilities: `npm audit fix`

---

## 🧪 Testing

### Backend Tests
- [ ] Test user registration
- [ ] Test user login
- [ ] Test JWT token validation
- [ ] Test PDF upload (small file)
- [ ] Test PDF upload (large file ~20MB)
- [ ] Test PDF upload (invalid file type)
- [ ] Test query with no documents
- [ ] Test query with documents
- [ ] Test feedback submission
- [ ] Test document deletion
- [ ] Test Pinecone connection
- [ ] Test Groq LLM connection

### Frontend Tests
- [ ] Test registration form
- [ ] Test login form
- [ ] Test protected route redirect
- [ ] Test PDF drag-and-drop
- [ ] Test PDF file picker
- [ ] Test chat message sending
- [ ] Test source expansion
- [ ] Test feedback buttons
- [ ] Test theme toggle
- [ ] Test logout
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices

---

## 🚀 Performance

- [ ] Test with multiple concurrent users
- [ ] Monitor response times
- [ ] Check memory usage
- [ ] Optimize large PDF processing
- [ ] Enable caching if needed
- [ ] Consider CDN for frontend assets
- [ ] Optimize database queries
- [ ] Monitor Pinecone usage

---

## 📝 Documentation

- [ ] Review README.md for accuracy
- [ ] Update QUICKSTART.md if setup changed
- [ ] Document any custom configurations
- [ ] Add troubleshooting section
- [ ] Include example PDFs for testing
- [ ] Document API endpoints
- [ ] Add architecture diagrams (optional)

---

## 🌐 Environment Setup

### Development
- [ ] Backend runs on http://localhost:8000
- [ ] Frontend runs on http://localhost:3000
- [ ] CORS allows localhost:3000
- [ ] Environment variables loaded from `.env`

### Production
- [ ] Set `APP_URL` to production domain
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Update CORS to allow production domain only
- [ ] Use production-grade database (PostgreSQL)
- [ ] Enable HTTPS
- [ ] Set up reverse proxy (Nginx)
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging

---

## 🔧 Configuration Files

- [ ] `Backend/.env` - All required variables set
- [ ] `Frontend/.env` - API URL configured
- [ ] `vite.config.js` - Proxy settings correct
- [ ] `Backend/main.py` - CORS origins updated
- [ ] `.gitignore` - Sensitive files excluded

---

## 📊 Monitoring

- [ ] Set up error logging
- [ ] Monitor API response times
- [ ] Track user activity
- [ ] Monitor database size
- [ ] Track Pinecone vector count
- [ ] Monitor Groq API usage
- [ ] Set up alerts for errors
- [ ] Create dashboard for metrics

---

## 🐛 Error Handling

- [ ] Test error scenarios
- [ ] Verify error messages are user-friendly
- [ ] Check backend error logging
- [ ] Test frontend error boundaries
- [ ] Verify 404 page handling
- [ ] Test network error handling
- [ ] Test API timeout handling

---

## 🔄 Backup & Recovery

- [ ] Backup SQLite database
- [ ] Export Pinecone index (if possible)
- [ ] Document recovery procedures
- [ ] Test restore from backup
- [ ] Set up automated backups
- [ ] Store backups securely

---

## 📱 Accessibility

- [ ] Test with screen readers
- [ ] Verify keyboard navigation
- [ ] Check color contrast ratios
- [ ] Test with browser zoom
- [ ] Add ARIA labels where needed
- [ ] Test with assistive technologies

---

## 🌍 Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## 📦 Build & Deploy

### Backend
```bash
# Activate virtual environment
source .venv/bin/activate

# Install dependencies
pip install -r Backend/requirements.txt

# Run migrations (if any)
# python Backend/migrate.py

# Start server
cd Backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy dist/ folder to hosting service
```

---

## 🚦 Pre-Launch Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] No console warnings (or documented)
- [ ] API keys secured
- [ ] Database backed up
- [ ] Documentation complete
- [ ] Error handling tested
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Monitoring set up
- [ ] Backup strategy in place

---

## 🎉 Post-Launch

- [ ] Monitor error logs
- [ ] Track user feedback
- [ ] Monitor performance metrics
- [ ] Check API usage
- [ ] Review security logs
- [ ] Plan for updates
- [ ] Document issues
- [ ] Gather user feedback

---

## 📞 Support

- [ ] Set up support email
- [ ] Create FAQ document
- [ ] Document common issues
- [ ] Set up issue tracking
- [ ] Create user guide
- [ ] Set up feedback form

---

**Use this checklist to ensure a smooth deployment!**
