# MeetMind AI — AI-Powered Meeting Assistant 🎙️✨

**MeetMind AI** is a modern, responsive web application that turns long meeting recordings into structured executive intelligence. Instead of sitting through hours of recordings or reading lengthy transcripts, MeetMind AI automatically extracts executive summaries, decisions, discussion points, action items, and connects directly with your Gmail to search relevant meeting emails and dispatch summaries.

---

## 🌟 Features

- **🎙️ Live Meeting Recording (Browser Microphone):**
  - Record meetings directly in the browser with real-time waveform visualizers using the Web Audio API.
  - Pause, resume, and preview audio playback before submitting.
  - Transparent consent indicator informing participants whenever recording is active.

- **📁 Audio File Upload:**
  - Accepts **MP3, WAV, M4A, WEBM, AAC, OGG, and FLAC** up to 25MB.
  - Drag-and-drop zone with format and size validation.
  - Instant in-browser audio preview player.
  - Manual transcript paste mode for text notes and transcripts.

- **🤖 AI Speech Transcription:**
  - Accurate speech-to-text conversion powered by **Google Gemini AI** (`gemini-3.5-transcribe`).
  - Speaker diarization (distinguishing Speaker 1, Speaker 2, etc.) and timestamp preservation.
  - Searchable full transcript viewer with one-click copy.

- **📊 8-Section Structured Executive Summary:**
  1. **Meeting Overview:** Date, duration, attendees, core objectives.
  2. **Short Summary:** 2–3 sentence executive elevator pitch.
  3. **Detailed Summary:** In-depth chronological and thematic breakdown.
  4. **Important Discussion Points:** Key topics and arguments explored.
  5. **Decisions Made:** Explicit agreements reached, including rationale and responsible owners.
  6. **Problems & Blockers Discussed:** Roadblocks, risks, and proposed solutions.
  7. **Unresolved Questions:** Open questions needing future clarification.
  8. **Next Steps:** Forward trajectory and project milestones.

- **✅ Interactive Action Item Extraction:**
  - Extracts task descriptions, assigned owners, deadlines, priority levels, and completion status.
  - Never hallucinates assignees or deadlines (defaults to "Not specified" if omitted).
  - Users can mark tasks complete, edit details, add new tasks, or delete tasks.

- **📬 Official Gmail Integration (OAuth 2.0):**
  - **Feature A (Send Summaries):** Compose and dispatch professional HTML and plain-text summaries directly from your Gmail inbox with complete previews and mandatory explicit user approval.
  - **Feature B (Read Meeting Emails):** Search meeting threads, view discussions, and extract meeting dates, participants, decisions, and action items with AI, with one-click import into your meeting records.
  - **Security First:** Strictly stores access tokens in memory (never written to disk or localStorage); never requests or stores Gmail passwords.

- **💾 Meeting History & Local Storage:**
  - Saves meetings persistently.
  - Filter by search query or tags.
  - Export summaries as clean text files (`.txt`) or print-ready PDF reports.

---

## 🛠️ Technology Stack & Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Web Audio API.
- **Backend:** Node.js + Express (Full-stack architecture mounting Vite middleware in development).
- **AI Models:**
  - `gemini-3.5-transcribe` for accurate speech-to-text audio ingestion.
  - `gemini-3.8-flash` for structured executive analysis and Gmail thread intelligence.
- **Authentication & OAuth:** Firebase Auth with Google OAuth 2.0 provider (`gmail.readonly`, `gmail.send`).
- **Database / Persistence:** Local file-backed JSON store in `/data/meetings.json` with SQLite compatibility.

---

## 🚀 Beginner Quickstart Guide (Local Setup)

If you are new to coding, follow these simple steps to run MeetMind AI on your machine:

### 1. Prerequisites
- Install **Node.js** (version 20 or higher) from [nodejs.org](https://nodejs.org).

### 2. Install Dependencies
Open your terminal in the project folder and run:
```bash
npm install
```

### 3. Configure Your Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Open `.env` in any text editor and add your Gemini API key:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```
*(You can get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/)).*

### 4. Start the Application
Run the local full-stack development server:
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🔐 Gmail Integration Setup Guide

MeetMind AI uses official Google OAuth 2.0 credentials configured through Firebase Authentication:
1. In the app header or Gmail tab, click **"Connect Gmail"**.
2. A Google sign-in popup will open asking for permission to:
   - View your email messages (`gmail.readonly`)
   - Send emails on your behalf (`gmail.send`)
3. Once approved, the access token is cached in browser memory only.
4. To disconnect at any time, click the **Log Out** button next to your account badge.

---

## 📦 Deployment Instructions

To create a production build ready for deployment on Cloud Run, Render, Railway, or VPS:

```bash
# Build the client and bundle the Express server
npm run build

# Start the production server
npm run start
```
The application will serve on port `3000` (or the port specified by the `PORT` environment variable).

---

## 📄 License
Apache-2.0
