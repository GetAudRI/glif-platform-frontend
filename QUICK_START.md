# 🚀 Quick Start Guide - GLIFAudit Clean v2.1

Frontend (React + Vite):
URL: http://localhost:5173
Location: /Users/keshavhome/glifaudit-New/V2.1/glifaudit-clean2
Features: Batch Audit, Single Audit, Portfolio View
Connects to: Backend API at http://localhost:5005
Backend (Flask):
URL: http://localhost:5005
Location: /Users/keshavhome/glif-RulesEngine/Stage123/Stage123-checkpost
Features:
    Audit Oversight API (for frontend)
    Rules Engine Dashboard
    Auto Claims with Checkposts
    Cost Analytics
    Contract Review
Customer Demo URLs:
Feature	URL	Description
    Batch Audit UI	http://localhost:5173	Modern React frontend
    Rules Engine	http://localhost:5005	Backend dashboard
    Cost Analytics	http://localhost:5005/analytics/costs	AI spending tracker
    Auto Claims	http://localhost:5005/rules-engine/auto-claims	Claims validation
To Start Everything:
bash
# Terminal 1 - Backend (already running ✅)
cd /Users/keshavhome/glif-RulesEngine/Stage123/Stage123-checkpost
python app.py

# Terminal 2 - Frontend
cd /Users/keshavhome/glifaudit-New/V2.1/glifaudit-clean2
npm run dev
You're all set! One clean backend, one modern frontend, ready for customer demos. 🚀
## For Immediate Demo

### Option 1: Development Server (Recommended)

```bash
# Navigate to the project folder
cd glifaudit-clean

# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev

# Open your browser to: http://localhost:5173
```

**Expected startup time:** 30-60 seconds

### Option 2: Static Build

```bash
# Build for production
npm run build

# Preview the build
npm run preview

# Open your browser to the displayed URL
```

## 📱 Demo Checklist

Before your investor meeting:

- [ ] Test all 7 tabs work correctly
- [ ] Verify the "Connect AWS S3" button works
- [ ] Click through a few claims in the Claim Drilldown
- [ ] Start the Audit workflow and expand steps
- [ ] Test the Request Document modal
- [ ] Check responsiveness (resize browser window)

## 🎬 Demo Script (5-minute version)

### 1. Opening (30 seconds)
"GLIF is an intelligent audit platform that transforms insurance underwriting audits from weeks to hours."

### 2. Connectors Tab (30 seconds)
"We connect seamlessly to any data source - AWS, Google Cloud, SharePoint. [Click Connect AWS S3]"

"Once connected, we automatically index thousands of documents."

### 3. Corpus Tab (30 seconds)
"Our AI classifies every document - policies, claims, invoices - and extracts key metadata with 95%+ confidence."

### 4. Rules Engine (45 seconds)
"We've codified 15 audit rules across Auto, Home, and Travel policies. These rules automatically flag issues before they become problems."

### 5. Portfolio Dashboard (60 seconds)
"At a glance, you see portfolio health: 85% compliant, 12% under review, 3% exceptions."

"We can drill into high-risk claims immediately. [Click on a high-risk claim]"

### 6. Claim Drilldown (60 seconds)
"Here's a specific claim that triggered multiple rules. [Select C1234]"

"We instantly see: proof of age is missing, premium validation needs review."

"[Click Request Document] With one click, we can request missing documentation."

### 7. Audits Tab (60 seconds)
"[Navigate to Audits] This is our complete audit workflow."

"[Click Start Audit] Traditional audits follow 5 steps that take weeks."

"GLIF automates data gathering, applies rule-based evaluation, and generates findings in real-time."

"[Show compliance dashboard] We're seeing 82% compliance, with clear areas for improvement."

### Closing (30 seconds)
"The result: audits that took 2-3 weeks now take 2-3 hours, with better accuracy and complete documentation."

## 🎯 Key Messages

**Problem:** 
- Manual audits take weeks
- Inconsistent quality
- Limited coverage
- High cost

**Solution:**
- AI-powered automation
- Real-time insights  
- 100% portfolio coverage
- 90% cost reduction

**Traction:**
- Proven with [X] pilot customers
- [Y] documents processed
- [Z]% accuracy improvement

## 💡 Common Questions & Answers

**Q: Is this connected to real data?**
A: "This is a functional prototype with realistic mock data. In production, it connects to actual insurance systems via API."

**Q: How long does implementation take?**
A: "Typical deployment is 6-8 weeks including data integration and rule configuration."

**Q: What about existing audit processes?**
A: "GLIF augments your existing workflow. Auditors focus on exceptions and judgment calls while GLIF handles routine checks."

**Q: Can we customize the rules?**
A: "Absolutely. The rules engine is fully configurable to match your specific underwriting guidelines."

**Q: What's your pricing model?**
A: "We offer per-policy pricing starting at $X per policy per year, with volume discounts for larger portfolios."

## 🛠️ Troubleshooting

### "npm: command not found"
- Install Node.js from https://nodejs.org/
- Restart your terminal

### Port 5173 is already in use
```bash
# Use a different port
npm run dev -- --port 3000
```

### Dependencies fail to install
```bash
# Clear npm cache and retry
npm cache clean --force
npm install
```

### Page doesn't load
- Check console for errors (F12 in browser)
- Verify npm run dev is still running
- Try refreshing the page (Ctrl+R / Cmd+R)

## 📧 Support

For technical issues during setup:
- Check the README.md for detailed documentation
- Review the IMPROVEMENTS.md for feature explanations

---

**Good luck with your investor presentation! 🚀**
