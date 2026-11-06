import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data directory exists for persistent meeting storage
const DATA_DIR = path.join(__dirname, 'data');
const MEETINGS_FILE = path.join(DATA_DIR, 'meetings.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read meetings
function readMeetings(): any[] {
  try {
    if (fs.existsSync(MEETINGS_FILE)) {
      const data = fs.readFileSync(MEETINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading meetings file:', err);
  }
  return [];
}

// Helper to write meetings
function writeMeetings(meetings: any[]): void {
  try {
    fs.writeFileSync(MEETINGS_FILE, JSON.stringify(meetings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing meetings file:', err);
  }
}

// Seed initial sample meetings if empty
function initializeSeedMeetings() {
  const existing = readMeetings();
  if (existing.length === 0) {
    const seedData = [
      {
        id: 'seed-meet-1',
        title: 'Q4 Product Roadmap & Sprint Planning',
        date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        duration: '42m',
        audioSource: 'Recorded Audio (Demo)',
        speakers: ['Sarah Chen (PM)', 'David Ross (Eng Lead)', 'Elena Rostova (Design)', 'Marcus Vance (QA)'],
        status: 'completed',
        transcript: `Sarah: Welcome everyone. Today we are aligning on our Q4 product roadmap, specifically the AI meeting intelligence workspace and the Gmail integration features.
David: On the engineering side, the Gemini integration for audio transcription is working with sub-5-second latency. We've verified that gemini-3.5-transcribe and gemini-3.8-flash deliver high accuracy with speaker segmentation.
Elena: The design team finished the user flows for action item extraction and the Gmail email thread reader. The feedback from the alpha cohort was that inline task completion and one-click PDF export are must-haves.
Marcus: QA completed load testing for audio uploads up to 25MB. WebM and MP3 formats are running smoothly. We still need to verify Safari's audio recording fallback.
Sarah: Excellent. Let's make sure the Gmail send functionality has an explicit user preview dialog before anything sends. David, can your team finalize the OAuth token in-memory handling by Thursday?
David: Yes, we will have the token refresh and secure headers completed by Thursday 5 PM.
Elena: I'll deliver the high-fidelity icons and email template layouts by Wednesday morning.
Marcus: QA will run end-to-end regression testing on Friday before the staging cut.
Sarah: Sounds like a solid plan. Thank you all.`,
        overview: {
          title: 'Q4 Product Roadmap & Sprint Planning',
          date: new Date(Date.now() - 24 * 3600 * 1000).toLocaleDateString(),
          estimatedDuration: '42 minutes',
          speakers: ['Sarah Chen (PM)', 'David Ross (Eng Lead)', 'Elena Rostova (Design)', 'Marcus Vance (QA)'],
          mainGoal: 'Align engineering, design, and QA on Q4 roadmap deliverables and Gmail integration security.'
        },
        shortSummary: 'The team finalized milestones for Q4, confirming audio transcription performance and design deliverables. Key decisions were made to enforce strict user preview before sending Gmail summaries and finalize OAuth token caching by Thursday.',
        detailedSummary: 'The session began with Sarah introducing the Q4 objectives centering on the MeetMind AI meeting assistant. David confirmed that Gemini-based audio transcription achieved high accuracy and sub-5-second response times. Elena presented user research confirming high demand for inline action item completion and direct PDF exports. Marcus discussed audio recording compatibility across browsers, highlighting Safari validation. The meeting concluded with explicit deadlines assigned for engineering token security, design assets, and QA sign-off.',
        discussionPoints: [
          {
            topic: 'Audio Transcription Performance',
            details: 'Evaluated Gemini models for audio transcription; latency is under 5 seconds with high speaker fidelity.'
          },
          {
            topic: 'Gmail Integration Security',
            details: 'Agreed that sending emails on behalf of the user must always require an explicit preview modal with recipient confirmation.'
          },
          {
            topic: 'Browser Compatibility',
            details: 'Need specific browser microphone testing for Safari and iOS WebKit audio recorders.'
          }
        ],
        decisions: [
          {
            decision: 'Enforce explicit email preview modal',
            rationale: 'Avoids unintended email dispatches and gives the user full control over copy and recipients.',
            owner: 'Elena Rostova & David Ross'
          },
          {
            decision: 'Use in-memory token storage for Google OAuth',
            rationale: 'Maintains strict security standards and avoids persistent token exposure in browser storage.',
            owner: 'David Ross'
          }
        ],
        problems: [
          {
            problem: 'Safari AudioContext recording idiosyncrasies',
            impact: 'Could affect iOS/Safari users when recording live meetings.',
            proposedSolution: 'Add cross-browser MediaRecorder fallback with WebM/WAV containers.'
          }
        ],
        unresolvedQuestions: [
          {
            question: 'Will we support automated multi-language transcription in the first public release?',
            context: 'Raised by marketing team for European enterprise customers.'
          }
        ],
        nextSteps: [
          'Design team delivers email templates by Wednesday.',
          'Engineering finalizes OAuth in-memory token handling by Thursday 5 PM.',
          'Full QA regression run scheduled for Friday.'
        ],
        actionItems: [
          {
            id: 'act-1',
            task: 'Finalize in-memory OAuth token management and secure headers',
            assignee: 'David Ross',
            deadline: 'Thursday 5:00 PM',
            priority: 'High',
            status: 'Pending'
          },
          {
            id: 'act-2',
            task: 'Deliver email summary layout designs and export icons',
            assignee: 'Elena Rostova',
            deadline: 'Wednesday 10:00 AM',
            priority: 'Medium',
            status: 'Completed'
          },
          {
            id: 'act-3',
            task: 'Run end-to-end regression testing on live recording and upload pipeline',
            assignee: 'Marcus Vance',
            deadline: 'Friday 4:00 PM',
            priority: 'High',
            status: 'Pending'
          }
        ],
        tags: ['Planning', 'Sprint', 'Roadmap', 'Engineering']
      }
    ];
    writeMeetings(seedData);
  }
}

initializeSeedMeetings();

// Parse JSON bodies up to 50MB for audio uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to initialize GoogleGenAI
function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured. Please check your settings.');
  }
  return new GoogleGenAI({ apiKey });
}

// API Routes

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'MeetMind AI',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Get all meetings
app.get('/api/meetings', (_req: Request, res: Response) => {
  try {
    const meetings = readMeetings();
    res.json(meetings);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch meetings' });
  }
});

// Get single meeting
app.get('/api/meetings/:id', (req: Request, res: Response) => {
  try {
    const meetings = readMeetings();
    const meeting = meetings.find(m => m.id === req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch meeting' });
  }
});

// Save or update meeting
app.post('/api/meetings', (req: Request, res: Response) => {
  try {
    const meetingData = req.body;
    if (!meetingData || !meetingData.title) {
      return res.status(400).json({ error: 'Meeting title is required' });
    }

    const meetings = readMeetings();
    const existingIndex = meetings.findIndex(m => m.id === meetingData.id);

    const now = new Date().toISOString();
    const meetingToSave = {
      ...meetingData,
      id: meetingData.id || `meet-${Date.now()}`,
      updatedAt: now,
      createdAt: meetingData.createdAt || now
    };

    if (existingIndex >= 0) {
      meetings[existingIndex] = meetingToSave;
    } else {
      meetings.unshift(meetingToSave);
    }

    writeMeetings(meetings);
    res.json(meetingToSave);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save meeting' });
  }
});

// Delete meeting
app.delete('/api/meetings/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let meetings = readMeetings();
    const initialCount = meetings.length;
    meetings = meetings.filter(m => m.id !== id);

    if (meetings.length === initialCount) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    writeMeetings(meetings);
    res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete meeting' });
  }
});

// Transcribe and analyze audio
app.post('/api/transcribe-and-summarize', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType, meetingTitle, durationEstimate } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const ai = getGenAIClient();
    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
    const audioMime = mimeType || 'audio/webm';

    // Step 1: Speech-to-Text Transcription using gemini-3.5-transcribe
    const transcriptionPrompt = `Please transcribe this meeting audio accurately and completely. 
Format instructions:
- Label different speakers clearly as "Speaker 1:", "Speaker 2:", etc., or with names if explicitly spoken.
- Include natural paragraph breaks when the topic changes.
- Do NOT invent words or guess names if inaudible; use "[inaudible]" where appropriate.
- Provide a clean, faithful transcript of everything said.`;

    const transcriptionResponse = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: [
        {
          inlineData: {
            mimeType: audioMime,
            data: cleanBase64
          }
        },
        transcriptionPrompt
      ]
    });

    const transcript = transcriptionResponse.text || 'No speech detected in audio file.';

    // Step 2: Intelligent Meeting Analysis & Structured Extraction using gemini-3.8-flash
    const summaryPrompt = `You are MeetMind AI, an elite executive meeting assistant.
Analyze the following meeting transcript thoroughly and produce a structured, high-value JSON report.

Meeting Title/Context: ${meetingTitle || 'Meeting Session'}
Estimated Duration: ${durationEstimate || 'Not specified'}

TRANSCRIPT:
"""
${transcript}
"""

Rules:
1. Executive Overview: Extract high level meta, attendees mentioned, and core objective.
2. Short Summary: 2-3 sentence executive elevator pitch.
3. Detailed Summary: Comprehensive breakdown organized chronologically or by major discussion pillars.
4. Discussion Points: Clear list of topics explored and specific details.
5. Decisions Made: Explicit agreements reached, including rationale and responsible parties.
6. Problems Discussed: Roadblocks, risks, or technical hurdles raised and potential solutions.
7. Unresolved Questions: Open topics requiring future clarification.
8. Next Steps: High-level forward trajectory.
9. Action Items: Extract every single actionable task.
   - For assignee: ONLY use real names mentioned in the transcript. If not stated, use "Not specified". Never invent names.
   - For deadline: ONLY use dates/times mentioned (e.g. "Thursday 5 PM", "next Monday"). If not stated, use "Not specified".
   - Priority: Assign "High", "Medium", or "Low" based on discussion urgency.
   - Status: Default to "Pending".`;

    const analysisResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: summaryPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: { type: Type.STRING },
            speakers: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            overview: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                date: { type: Type.STRING },
                estimatedDuration: { type: Type.STRING },
                speakers: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                mainGoal: { type: Type.STRING }
              },
              required: ['title', 'mainGoal']
            },
            shortSummary: { type: Type.STRING },
            detailedSummary: { type: Type.STRING },
            discussionPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  details: { type: Type.STRING }
                },
                required: ['topic', 'details']
              }
            },
            decisions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  decision: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  owner: { type: Type.STRING }
                },
                required: ['decision', 'rationale']
              }
            },
            problems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  problem: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  proposedSolution: { type: Type.STRING }
                },
                required: ['problem', 'impact']
              }
            },
            unresolvedQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  context: { type: Type.STRING }
                },
                required: ['question']
              }
            },
            nextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  task: { type: Type.STRING },
                  assignee: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  status: { type: Type.STRING }
                },
                required: ['task', 'assignee', 'deadline', 'priority', 'status']
              }
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            'shortSummary',
            'detailedSummary',
            'discussionPoints',
            'decisions',
            'problems',
            'unresolvedQuestions',
            'nextSteps',
            'actionItems'
          ]
        }
      }
    });

    let analysis: any = {};
    try {
      analysis = JSON.parse(analysisResponse.text || '{}');
    } catch (parseErr) {
      console.error('Failed to parse JSON response:', parseErr);
      analysis = {
        shortSummary: analysisResponse.text || 'Summary generated',
        detailedSummary: analysisResponse.text || '',
        discussionPoints: [],
        decisions: [],
        problems: [],
        unresolvedQuestions: [],
        nextSteps: [],
        actionItems: []
      };
    }

    // Ensure action item IDs
    if (Array.isArray(analysis.actionItems)) {
      analysis.actionItems = analysis.actionItems.map((item: any, idx: number) => ({
        ...item,
        id: item.id || `act-${Date.now()}-${idx}`
      }));
    }

    const meetingRecord = {
      id: `meet-${Date.now()}`,
      title: meetingTitle || analysis.suggestedTitle || analysis.overview?.title || 'Meeting Session',
      date: new Date().toISOString(),
      duration: durationEstimate || analysis.overview?.estimatedDuration || 'Audio File',
      speakers: analysis.speakers || analysis.overview?.speakers || [],
      transcript,
      overview: {
        title: meetingTitle || analysis.suggestedTitle || 'Meeting Session',
        date: new Date().toLocaleDateString(),
        estimatedDuration: durationEstimate || '15m',
        speakers: analysis.speakers || [],
        mainGoal: analysis.overview?.mainGoal || 'Team Alignment and Strategy',
        ...analysis.overview
      },
      shortSummary: analysis.shortSummary,
      detailedSummary: analysis.detailedSummary,
      discussionPoints: analysis.discussionPoints || [],
      decisions: analysis.decisions || [],
      problems: analysis.problems || [],
      unresolvedQuestions: analysis.unresolvedQuestions || [],
      nextSteps: analysis.nextSteps || [],
      actionItems: analysis.actionItems || [],
      tags: analysis.tags || ['Audio Recording', 'AI Analyzed']
    };

    // Auto-save to meetings database
    const meetings = readMeetings();
    meetings.unshift(meetingRecord);
    writeMeetings(meetings);

    res.json({
      success: true,
      meeting: meetingRecord
    });
  } catch (err: any) {
    console.error('Error in transcribe-and-summarize:', err);
    res.status(500).json({
      error: err.message || 'Failed to transcribe and analyze audio. Please try again.'
    });
  }
});

// Summarize raw text/transcript directly
app.post('/api/summarize-transcript', async (req: Request, res: Response) => {
  try {
    const { transcript, meetingTitle } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript text is required' });
    }

    const ai = getGenAIClient();

    const summaryPrompt = `You are MeetMind AI, an elite executive meeting assistant.
Analyze this transcript and produce a structured JSON summary following the required sections.

Meeting Title: ${meetingTitle || 'Meeting Session'}

TRANSCRIPT:
"""
${transcript}
"""

Rules:
1. Short Summary: 2-3 sentences.
2. Detailed Summary: Comprehensive overview.
3. Discussion Points: Key topics and points.
4. Decisions Made: Decisions with rationale.
5. Problems Discussed: Roadblocks and impact.
6. Unresolved Questions: Open issues.
7. Next Steps: Forward looking steps.
8. Action Items: Explicit tasks. Assignee and deadline must NOT be invented; use "Not specified" if omitted. Priority High/Medium/Low. Status "Pending".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: summaryPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: { type: Type.STRING },
            speakers: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            overview: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                date: { type: Type.STRING },
                estimatedDuration: { type: Type.STRING },
                speakers: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                mainGoal: { type: Type.STRING }
              },
              required: ['title', 'mainGoal']
            },
            shortSummary: { type: Type.STRING },
            detailedSummary: { type: Type.STRING },
            discussionPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  details: { type: Type.STRING }
                },
                required: ['topic', 'details']
              }
            },
            decisions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  decision: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  owner: { type: Type.STRING }
                },
                required: ['decision', 'rationale']
              }
            },
            problems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  problem: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  proposedSolution: { type: Type.STRING }
                },
                required: ['problem', 'impact']
              }
            },
            unresolvedQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  context: { type: Type.STRING }
                },
                required: ['question']
              }
            },
            nextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  task: { type: Type.STRING },
                  assignee: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  status: { type: Type.STRING }
                },
                required: ['task', 'assignee', 'deadline', 'priority', 'status']
              }
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            'shortSummary',
            'detailedSummary',
            'discussionPoints',
            'decisions',
            'problems',
            'unresolvedQuestions',
            'nextSteps',
            'actionItems'
          ]
        }
      }
    });

    const analysis = JSON.parse(response.text || '{}');
    if (Array.isArray(analysis.actionItems)) {
      analysis.actionItems = analysis.actionItems.map((item: any, idx: number) => ({
        ...item,
        id: item.id || `act-${Date.now()}-${idx}`
      }));
    }

    const meetingRecord = {
      id: `meet-${Date.now()}`,
      title: meetingTitle || analysis.suggestedTitle || 'Transcript Session',
      date: new Date().toISOString(),
      duration: 'Text Transcript',
      speakers: analysis.speakers || [],
      transcript,
      overview: {
        title: meetingTitle || analysis.suggestedTitle || 'Transcript Session',
        date: new Date().toLocaleDateString(),
        estimatedDuration: 'Text Document',
        speakers: analysis.speakers || [],
        mainGoal: analysis.overview?.mainGoal || 'General Discussion',
        ...analysis.overview
      },
      shortSummary: analysis.shortSummary,
      detailedSummary: analysis.detailedSummary,
      discussionPoints: analysis.discussionPoints || [],
      decisions: analysis.decisions || [],
      problems: analysis.problems || [],
      unresolvedQuestions: analysis.unresolvedQuestions || [],
      nextSteps: analysis.nextSteps || [],
      actionItems: analysis.actionItems || [],
      tags: analysis.tags || ['Transcript', 'Notes']
    };

    const meetings = readMeetings();
    meetings.unshift(meetingRecord);
    writeMeetings(meetings);

    res.json({ success: true, meeting: meetingRecord });
  } catch (err: any) {
    console.error('Error in summarize-transcript:', err);
    res.status(500).json({ error: err.message || 'Failed to summarize transcript' });
  }
});

// Analyze Gmail Email Thread for Meeting Intelligence
app.post('/api/analyze-email-thread', async (req: Request, res: Response) => {
  try {
    const { emailSubject, emailBody, sender, date, threadMessages } = req.body;

    if (!emailBody && (!threadMessages || threadMessages.length === 0)) {
      return res.status(400).json({ error: 'Email content is required for analysis' });
    }

    const ai = getGenAIClient();

    let formattedContent = '';
    if (threadMessages && Array.isArray(threadMessages) && threadMessages.length > 0) {
      formattedContent = threadMessages
        .map((m: any, i: number) => `--- Message ${i + 1} from ${m.from || 'Unknown'} (${m.date || ''}) ---\nSubject: ${m.subject || ''}\n${m.body || ''}`)
        .join('\n\n');
    } else {
      formattedContent = `From: ${sender || 'Unknown'}\nDate: ${date || ''}\nSubject: ${emailSubject || ''}\n\n${emailBody}`;
    }

    const prompt = `You are MeetMind AI. Analyze this meeting-related email or email thread and extract structured intelligence.

EMAIL THREAD CONTENT:
"""
${formattedContent}
"""

Extract the following information faithfully without hallucinating:
1. Meeting Dates and Times: Any scheduled meetings, past meetings, or proposed dates/times.
2. Participants: All individuals participating or mentioned.
3. Discussion Topics: Core themes and agenda items discussed.
4. Decisions Made: Any agreements or confirmations reached in the thread.
5. Action Items: Tasks assigned with specific assignee and deadline (use "Not specified" if omitted).
6. Deadlines & Follow-ups: Concrete target dates or follow-up milestones.
7. Executive Conversation Summary: 2-3 paragraph synthesis of the exchange.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conversationSummary: { type: Type.STRING },
            meetingDatesTimes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dateTime: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ['dateTime', 'description']
              }
            },
            participants: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            discussionTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            decisions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  decision: { type: Type.STRING },
                  context: { type: Type.STRING }
                },
                required: ['decision']
              }
            },
            actionItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  task: { type: Type.STRING },
                  assignee: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  priority: { type: Type.STRING }
                },
                required: ['task', 'assignee', 'deadline', 'priority']
              }
            },
            followUpRequirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: [
            'conversationSummary',
            'participants',
            'discussionTopics',
            'decisions',
            'actionItems'
          ]
        }
      }
    });

    const analysis = JSON.parse(response.text || '{}');
    res.json({ success: true, emailAnalysis: analysis });
  } catch (err: any) {
    console.error('Error analyzing email thread:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze email thread' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MeetMind AI server is listening on port ${PORT} (isProduction: ${isProduction})`);
  });
}

startServer();
