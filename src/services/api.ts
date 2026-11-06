import { MeetingRecord, EmailAnalysis } from '../types/meeting';

export async function fetchMeetings(): Promise<MeetingRecord[]> {
  const res = await fetch('/api/meetings');
  if (!res.ok) {
    throw new Error('Failed to load meetings');
  }
  return res.json();
}

export async function getMeeting(id: string): Promise<MeetingRecord> {
  const res = await fetch(`/api/meetings/${id}`);
  if (!res.ok) {
    throw new Error('Meeting not found');
  }
  return res.json();
}

export async function saveMeeting(meeting: Partial<MeetingRecord>): Promise<MeetingRecord> {
  const res = await fetch('/api/meetings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meeting)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to save meeting');
  }
  return res.json();
}

export async function deleteMeeting(id: string): Promise<void> {
  const res = await fetch(`/api/meetings/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete meeting');
  }
}

export async function transcribeAndSummarizeAudio(params: {
  audioBase64: string;
  mimeType: string;
  meetingTitle?: string;
  durationEstimate?: string;
}): Promise<MeetingRecord> {
  const res = await fetch('/api/transcribe-and-summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Transcription and analysis failed');
  }
  return data.meeting;
}

export async function summarizeTranscript(params: {
  transcript: string;
  meetingTitle?: string;
}): Promise<MeetingRecord> {
  const res = await fetch('/api/summarize-transcript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Summarization failed');
  }
  return data.meeting;
}

export async function analyzeEmailThread(params: {
  emailSubject?: string;
  emailBody?: string;
  sender?: string;
  date?: string;
  threadMessages?: any[];
}): Promise<EmailAnalysis> {
  const res = await fetch('/api/analyze-email-thread', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Email analysis failed');
  }
  return data.emailAnalysis;
}
