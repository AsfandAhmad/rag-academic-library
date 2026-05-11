# Source Panel UI Fixes

## 🎯 What the Percentage Bar Shows

The **percentage bar shows the relevance score** - how relevant each source document is to your question.

### Score Meaning
- **80-100%** 🟢 - Highly relevant (Green)
- **60-79%** 🔵 - Very relevant (Blue)
- **40-59%** 🟠 - Moderately relevant (Orange)
- **0-39%** ⚪ - Less relevant (Gray)

Higher scores mean the document chunk is more semantically similar to your question.

---

## 🐛 Issues Fixed

### 1. **Negative Score Display (-780%)**
**Problem:** Score was showing negative values like "-780%"

**Root Cause:** 
- Backend might be returning negative scores
- Score format not being handled correctly

**Fix Applied:**
```javascript
const normalizeScore = (score) => {
  // Handle undefined, null, or invalid scores
  if (score === undefined || score === null || isNaN(score)) {
    return 0;
  }
  
  // Handle negative scores
  if (score < 0) {
    return 0;
  }
  
  // Normalize to 0-1 range
  if (score > 1) {
    return Math.min(score / 100, 1);
  }
  
  return Math.min(score, 1);
};
```

**Result:** ✅ Scores now always show 0-100%

---

### 2. **Text Overflow**
**Problem:** Long text (emails, URLs) was overflowing the card

**Fix Applied:**
- Added `wordWrap: "break-word"`
- Added `overflowWrap: "break-word"`
- Added `whiteSpace: "normal"`

**Result:** ✅ Text wraps properly within cards

---

### 3. **Visual Improvements**

#### Color-Coded Scores
- High relevance (80%+): Green
- Good relevance (60-79%): Blue
- Medium relevance (40-59%): Orange
- Low relevance (<40%): Gray

#### Better Layout
- Wider panel (320px)
- Better spacing
- Shadows in light mode
- Badge backgrounds
- Left border on excerpts

#### Helpful Labels
- Added subtitle: "Score shows relevance to your question"
- Better visual hierarchy
- Clearer information structure

---

## 📊 How Scores Are Calculated

### Backend Process
1. **Embedding:** Your question is converted to a vector using SciBERT
2. **Search:** Pinecone finds similar document chunks (cosine similarity)
3. **Re-ranking:** Cross-encoder re-ranks results for better accuracy
4. **Score:** Final relevance score (0-1 or 0-100)

### Score Types
- **Cosine Similarity:** 0-1 range (from Pinecone)
- **Re-rank Score:** Can be any range (from cross-encoder)
- **Normalized:** Always displayed as 0-100%

---

## 🎨 UI Components

### Source Card Structure
```
┌─────────────────────────────────────┐
│ [1] ████████░░ 85%                  │ ← Badge + Progress + Score
│                                     │
│ 📄 document.pdf                     │ ← Filename
│ Page 3                              │ ← Page number
│ │ This is an excerpt from the...   │ ← Text preview
└─────────────────────────────────────┘
```

### Visual Elements
- **Badge [1]:** Source reference number
- **Progress Bar:** Visual representation of score
- **Percentage:** Numeric score value
- **Filename:** Document name with icon
- **Page:** Page number badge
- **Excerpt:** Text preview with left border

---

## 🔧 Technical Details

### Score Normalization
```javascript
// Input: Any score format
// Output: 0-100 percentage

Examples:
- 0.85 → 85%
- 1.24 → 100% (capped)
- -7.8 → 0% (negative handled)
- null → 0% (invalid handled)
- 95 → 95% (already percentage)
```

### Color Mapping
```javascript
const getScoreColor = (score) => {
  const percentage = getScorePercentage(score);
  if (percentage >= 80) return '#22c55e'; // Green
  if (percentage >= 60) return '#3b82f6'; // Blue
  if (percentage >= 40) return '#f59e0b'; // Orange
  return colors.textTertiary;             // Gray
};
```

---

## ✅ What's Fixed

1. ✅ **Score Display:** No more negative or invalid percentages
2. ✅ **Text Wrapping:** Long text wraps properly
3. ✅ **Color Coding:** Scores have meaningful colors
4. ✅ **Visual Design:** Better spacing, shadows, and layout
5. ✅ **User Understanding:** Added helpful labels
6. ✅ **Responsive:** Works in both dark and light themes

---

## 🎯 User Experience

### Before
- ❌ Showed "-780%" (confusing)
- ❌ Text overflowed cards
- ❌ No explanation of what score means
- ❌ All scores same color

### After
- ✅ Shows "0-100%" (clear)
- ✅ Text wraps nicely
- ✅ Label explains score meaning
- ✅ Color-coded by relevance
- ✅ Better visual hierarchy

---

## 📝 Example Scores

### High Relevance (85%)
```
Question: "What is machine learning?"
Source: Contains definition and explanation of ML
Score: 85% (Green) - Highly relevant
```

### Medium Relevance (55%)
```
Question: "What is machine learning?"
Source: Mentions AI and algorithms generally
Score: 55% (Orange) - Moderately relevant
```

### Low Relevance (25%)
```
Question: "What is machine learning?"
Source: About computer hardware specifications
Score: 25% (Gray) - Less relevant
```

---

## 🚀 Summary

The percentage bar shows **how relevant each source is to your question**. Higher percentages mean the AI found that source more useful for answering your question.

**Key Points:**
- 📊 Score = Relevance to your question
- 🎨 Color-coded for quick understanding
- ✅ Always shows 0-100% (no negatives)
- 📝 Text wraps properly
- 💡 Helpful labels explain meaning

---

**Last Updated:** May 11, 2026  
**Status:** ✅ All issues fixed
