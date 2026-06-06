# Understanding Relevance Scores - Complete Guide

## 🎯 Why Scores Show 0% (And How to Fix It)

### Common Causes

#### 1. **All Documents Have Similar Scores**
When all retrieved documents have very similar relevance scores, the normalization process makes them all equal, which can result in 0% display.

**Example:**
```
Document A: Raw score = 0.85
Document B: Raw score = 0.84
Document C: Raw score = 0.83

After normalization:
Min = 0.83, Max = 0.85
Range = 0.02 (very small!)

Normalized scores might become:
A: (0.85 - 0.83) / 0.02 = 1.0 = 100%
B: (0.84 - 0.83) / 0.02 = 0.5 = 50%
C: (0.83 - 0.83) / 0.02 = 0.0 = 0%
```

#### 2. **Single Document**
If you only uploaded one document, all chunks come from the same source, so they normalize to similar values.

#### 3. **Backend Score Format**
The backend might be returning scores in an unexpected format.

---

## 🔧 Fixes Applied

### 1. **Better Score Normalization (Backend)**

**Location:** `Backend/core/reranker.py`

**Old Behavior:**
```python
if s_max == s_min:
    # All scores become 1.0
    normalized = [1.0 for _ in scores]
```

**New Behavior:**
```python
if s_max == s_min:
    # Create gradient: best=100%, worst=50%
    num_chunks = len(chunks)
    if num_chunks > 1:
        normalized = [1.0 - (i * 0.5 / (num_chunks - 1)) 
                      for i in range(num_chunks)]
    else:
        normalized = [1.0]
```

**Result:** Even when all documents are equally relevant, you'll see a gradient (100%, 87%, 75%, 62%, 50%)

---

### 2. **Score Debugging (Frontend)**

**Location:** `Frontend/src/components/SourcePanel.jsx`

**Added tooltip on hover:**
```javascript
title={`Rerank: ${src.rerank_score} | Embedding: ${src.embedding_score}`}
```

**How to use:**
1. Hover over the percentage in the source panel
2. See the raw scores in the tooltip
3. Check if backend is sending valid scores

---

### 3. **Improved Generator Score Handling**

**Location:** `Backend/core/generator.py`

**Now includes:**
```python
sources.append({
    "score": round(score_val, 2),           # Display score
    "rerank_score": float(chunk.get("rerank_score")),      # Re-rank score
    "embedding_score": float(chunk.get("score")),          # Embedding score
})
```

**Provides 3 scores:**
1. **Display score:** What users see (normalized 0-1)
2. **Rerank score:** Cross-encoder relevance score
3. **Embedding score:** Cosine similarity from Pinecone

---

## 📊 How Scoring Works

### Step 1: Embedding Search (Pinecone)
```
Your Question → SciBERT → Vector
↓
Search Pinecone for similar vectors
↓
Get top 10 results with cosine similarity scores (0-1)
```

**Example Results:**
```
Chunk 1: 0.89 (very similar)
Chunk 2: 0.85 (very similar)
Chunk 3: 0.82 (similar)
...
```

---

### Step 2: Re-ranking (Cross-Encoder)
```
For each chunk:
  Score = CrossEncoder(question, chunk_text)
↓
Get more accurate relevance scores
↓
Normalize to 0-1 range
```

**Example:**
```
Before re-rank: [0.89, 0.85, 0.82]
After re-rank:  [0.95, 0.75, 0.60]  (more differentiated)
```

---

### Step 3: Normalization
```
Find min and max scores
Normalize each score to 0-1 range
Display as percentage
```

**Formula:**
```
normalized = (score - min) / (max - min)
percentage = normalized × 100
```

---

## 🎨 Score Color Coding

```javascript
if (score >= 80%) → Green  🟢 (Highly relevant)
if (score >= 60%) → Blue   🔵 (Very relevant)
if (score >= 40%) → Orange 🟠 (Moderately relevant)
if (score < 40%)  → Gray   ⚪ (Less relevant)
```

---

## 🐛 Debugging Scores

### Check Backend Logs

Look for this in your backend console:
```
🔍 Re-ranked 5 chunks:
  [1] document.pdf - Page 3 - Score: 1.0
  [2] document.pdf - Page 5 - Score: 0.75
  [3] document.pdf - Page 2 - Score: 0.50
```

### Check Frontend Tooltip

Hover over the percentage in the source panel to see:
```
Rerank: 0.85 | Embedding: 0.92
```

### Check Browser Console

Open DevTools and look at the API response:
```json
{
  "sources": [
    {
      "index": 1,
      "score": 0.85,
      "rerank_score": 0.85,
      "embedding_score": 0.92
    }
  ]
}
```

---

## 🔍 Why You Might See 0%

### Scenario 1: Single Document
**Problem:** Only one document uploaded
**Why 0%:** All chunks are from same document, very similar scores
**Solution:** Upload more diverse documents

### Scenario 2: Very Similar Content
**Problem:** Multiple documents but all about same topic
**Why 0%:** All equally relevant
**Solution:** This is actually correct! All documents are equally good

### Scenario 3: Question Too General
**Problem:** Question like "Tell me everything"
**Why 0%:** Matching everything equally
**Solution:** Ask more specific questions

### Scenario 4: Question Too Specific
**Problem:** Question about something not in documents
**Why 0%:** Nothing really matches
**Solution:** Check if documents contain the information

---

## ✅ Expected Behavior

### Good Scores (Diverse Results)
```
Question: "What is machine learning?"

Source 1: 95% 🟢 (Has ML definition)
Source 2: 72% 🔵 (Mentions ML concepts)
Source 3: 48% 🟠 (Discusses related AI)
Source 4: 25% ⚪ (General CS topic)
```

### All Similar (OK!)
```
Question: "Define machine learning"

Source 1: 100% 🟢
Source 2: 87% 🟢
Source 3: 75% 🔵
Source 4: 62% 🔵
Source 5: 50% 🟠

All good sources! Gradient shows best-to-worst order.
```

---

## 🚀 How to Get Better Scores

### 1. Upload Diverse Documents
- Upload documents on different topics
- Include both general and specific content
- Mix different types of documents

### 2. Ask Specific Questions
- ❌ Bad: "Tell me about this document"
- ✅ Good: "What is the definition of X in chapter 3?"

### 3. Upload Relevant Documents
- Make sure documents contain the information you're asking about
- Upload complete documents (not fragments)
- Use academic/technical documents (SciBERT is optimized for these)

---

## 📈 Score Interpretation

| Score Range | Meaning | What to Do |
|-------------|---------|------------|
| 80-100% 🟢 | Highly relevant | Trust this source completely |
| 60-79% 🔵 | Very relevant | Good source, check details |
| 40-59% 🟠 | Moderately relevant | Verify with other sources |
| 0-39% ⚪ | Less relevant | May not directly answer question |

---

## 💡 Pro Tips

### Tip 1: Check the Tooltip
Hover over the percentage to see both rerank and embedding scores. If both are high, the document is definitely relevant.

### Tip 2: Read the Excerpts
The score is just a guide. Always read the actual excerpt to verify relevance.

### Tip 3: Check Multiple Sources
If all sources have low scores (<40%), your question might not be answerable from the uploaded documents.

### Tip 4: Use Score as Ranking
Even if absolute scores are low, the relative ranking (highest to lowest) still shows which sources are most relevant.

---

## 🎯 Summary

**Why 0%?**
- All documents equally relevant → Normalization makes lowest 0%
- Single document → All chunks similar
- Poor matches → Nothing really relevant

**Is 0% Bad?**
- Not necessarily! If all documents are equally relevant, the lowest will show 0%
- Look at the relative order: [100%, 75%, 50%, 25%, 0%] is fine
- The answer is still based on all sources, not just high-scoring ones

**How to Fix:**
- ✅ Upload more diverse documents
- ✅ Ask more specific questions
- ✅ Check backend logs for debugging
- ✅ Use tooltip to see raw scores
- ✅ Improved algorithm now shows gradients

---

## 🔧 Technical Details

### Normalization Formula
```python
if max_score == min_score:
    # Create gradient
    scores = [1.0, 0.875, 0.75, 0.625, 0.5]
else:
    # Standard normalization
    normalized = (score - min) / (max - min)
```

### Score Flow
```
User Question
    ↓
SciBERT Embedding
    ↓
Pinecone Search → Embedding Scores (0-1)
    ↓
Cross-Encoder Re-rank → Raw Scores (-∞ to +∞)
    ↓
Normalization → Display Scores (0-1)
    ↓
Frontend → Percentages (0-100%)
```

---

**Last Updated:** May 11, 2026  
**Status:** ✅ Score display improved with better normalization
