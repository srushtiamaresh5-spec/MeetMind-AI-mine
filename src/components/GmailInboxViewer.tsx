import React, { useState } from 'react';
import {
  Mail,
  Search,
  Sparkles,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Users,
  Target,
  ExternalLink
} from 'lucide-react';
import { GmailEmailMessage, EmailAnalysis, MeetingRecord } from '../types/meeting';
import { searchMeetingEmails } from '../services/gmail';
import { analyzeEmailThread, saveMeeting } from '../services/api';
import { getAccessToken } from '../services/auth';

interface GmailInboxViewerProps {
  gmailConnected: boolean;
  onConnectGmail: () => void;
  onDisconnectGmail: () => void;
  onMeetingImported: (meeting: MeetingRecord) => void;
}

const PRESET_QUERIES = [
  { label: 'Subject: Meeting', query: 'subject:meeting' },
  { label: 'Sync / Standup', query: 'subject:sync OR subject:standup' },
  { label: 'Roadmap & Sprint', query: 'subject:roadmap OR subject:sprint' },
  { label: 'General Meeting Emails', query: 'meeting OR "meeting notes" OR agenda' }
];

export const GmailInboxViewer: React.FC<GmailInboxViewerProps> = ({
  gmailConnected,
  onConnectGmail,
  onDisconnectGmail,
  onMeetingImported
}) => {
  const [searchQuery, setSearchQuery] = useState('subject:meeting');
  const [emails, setEmails] = useState<GmailEmailMessage[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<GmailEmailMessage | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emailAnalysis, setEmailAnalysis] = useState<EmailAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Search Emails
  const handleSearchEmails = async (queryToUse?: string) => {
    const q = queryToUse !== undefined ? queryToUse : searchQuery;
    setErrorMessage(null);
    setSelectedEmail(null);
    setEmailAnalysis(null);
    setImportSuccess(false);

    if (!gmailConnected) {
      setErrorMessage('Please connect your Gmail account first.');
      return;
    }

    setIsLoadingEmails(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Your Gmail session has expired. Please reconnect.');
      }

      const results = await searchMeetingEmails(token, q.trim() || 'meeting', 12);
      setEmails(results);
      if (results.length === 0) {
        setErrorMessage(`No emails found matching query "${q}". Try another search term.`);
      }
    } catch (err: any) {
      console.error('Failed to search emails:', err);
      setErrorMessage(err.message || 'Failed to search Gmail. Please check permissions.');
    } finally {
      setIsLoadingEmails(false);
    }
  };

  // Analyze Selected Email
  const handleAnalyzeEmail = async () => {
    if (!selectedEmail) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const analysis = await analyzeEmailThread({
        emailSubject: selectedEmail.subject,
        emailBody: selectedEmail.body,
        sender: selectedEmail.from,
        date: selectedEmail.date
      });

      setEmailAnalysis(analysis);
    } catch (err: any) {
      console.error('Failed to extract email intel:', err);
      setErrorMessage(err.message || 'Failed to analyze email content.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Convert Analyzed Email to MeetMind Meeting Record
  const handleImportAsMeeting = async () => {
    if (!selectedEmail || !emailAnalysis) return;

    try {
      const newMeeting: Partial<MeetingRecord> = {
        title: selectedEmail.subject.replace(/^(re:|fwd:)\s*/i, '').trim(),
        date: selectedEmail.date ? new Date(selectedEmail.date).toISOString() : new Date().toISOString(),
        duration: 'Email Thread Discussion',
        audioSource: 'Gmail Thread Import',
        speakers: emailAnalysis.participants || [selectedEmail.from],
        transcript: `--- Gmail Thread: ${selectedEmail.subject} ---\nFrom: ${selectedEmail.from}\nDate: ${selectedEmail.date}\n\n${selectedEmail.body}`,
        overview: {
          title: selectedEmail.subject,
          date: new Date().toLocaleDateString(),
          estimatedDuration: 'Email Thread',
          speakers: emailAnalysis.participants || [],
          mainGoal: emailAnalysis.discussionTopics?.[0] || 'Email-based Alignment'
        },
        shortSummary: emailAnalysis.conversationSummary.slice(0, 300) + '...',
        detailedSummary: emailAnalysis.conversationSummary,
        discussionPoints: emailAnalysis.discussionTopics.map(topic => ({
          topic,
          details: 'Extracted from email discussion thread.'
        })),
        decisions: emailAnalysis.decisions.map(d => ({
          decision: d.decision,
          rationale: d.context || 'Confirmed in email thread'
        })),
        problems: [],
        unresolvedQuestions: [],
        nextSteps: emailAnalysis.followUpRequirements || [],
        actionItems: emailAnalysis.actionItems.map((item, idx) => ({
          id: `email-act-${Date.now()}-${idx}`,
          task: item.task,
          assignee: item.assignee || 'Not specified',
          deadline: item.deadline || 'Not specified',
          priority: item.priority || 'Medium',
          status: 'Pending'
        })),
        tags: ['Gmail Import', 'Email Thread', 'Intelligence']
      };

      const saved = await saveMeeting(newMeeting);
      setImportSuccess(true);
      setTimeout(() => {
        onMeetingImported(saved);
      }, 1200);
    } catch (err: any) {
      console.error('Failed to import meeting:', err);
      setErrorMessage('Failed to save imported meeting to database.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gmail Intelligence Reader (Feature B)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Read & Extract Meeting Emails
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Connect your Gmail account to search for meeting threads. MeetMind AI identifies participants, agenda items, key decisions, and action items from your email discussions without scanning your entire mailbox.
            </p>
          </div>

          {/* Connection card */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shrink-0 min-w-[240px]">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider mb-2">
              <span className={`w-2 h-2 rounded-full ${gmailConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className={gmailConnected ? 'text-emerald-400' : 'text-slate-400'}>
                {gmailConnected ? 'Gmail Connected' : 'Gmail Not Connected'}
              </span>
            </div>

            {gmailConnected ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-300">
                  Ready to read meeting emails on demand.
                </p>
                <button
                  onClick={onDisconnectGmail}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                >
                  Disconnect Account
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">
                  Authorize Google OAuth to access meeting emails.
                </p>
                <button
                  onClick={onConnectGmail}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Connect Gmail</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security & Consent Note */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Privacy First: Queries only execute when you search. No background scanning or storing of email passwords.
            </span>
          </div>
          <span className="text-slate-500">
            Scope: <code className="text-slate-400">gmail.readonly</code>
          </span>
        </div>
      </div>

      {gmailConnected ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Search & Email List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                Search Meeting Emails
              </label>

              {/* Search input */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchEmails()}
                    placeholder="e.g. subject:meeting, standup, sprint"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={() => handleSearchEmails()}
                  disabled={isLoadingEmails}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
                >
                  {isLoadingEmails ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </div>

              {/* Preset search chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_QUERIES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(preset.query);
                      handleSearchEmails(preset.query);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-800 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email list */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-800 text-xs font-semibold text-slate-400">
                <span>Matching Emails ({emails.length})</span>
                {isLoadingEmails && <span className="text-indigo-400 animate-pulse">Loading from Gmail...</span>}
              </div>

              {emails.length === 0 && !isLoadingEmails && (
                <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                  <Mail className="w-8 h-8 mx-auto text-slate-600" />
                  <p>Click "Search" or select a preset query to load meeting emails from your Gmail inbox.</p>
                </div>
              )}

              {emails.map(email => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      setEmailAnalysis(null);
                      setImportSuccess(false);
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-300 truncate max-w-[170px]">
                        {email.from.split('<')[0].replace(/"/g, '')}
                      </span>
                      <span>{email.date ? new Date(email.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}</span>
                    </div>

                    <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">{email.subject}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{email.snippet}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Email Content & AI Intel Analysis (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {selectedEmail ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                {/* Email Header */}
                <div className="border-b border-slate-800 pb-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-bold text-white">{selectedEmail.subject}</h3>
                    <button
                      onClick={handleAnalyzeEmail}
                      disabled={isAnalyzing}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow transition-all shrink-0 active:scale-95 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                      <span>{isAnalyzing ? 'Analyzing Intel...' : 'Extract Meeting Intel'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-400 space-y-0.5">
                    <p>
                      <span className="text-slate-500 font-medium">From:</span> {selectedEmail.from}
                    </p>
                    {selectedEmail.to && (
                      <p>
                        <span className="text-slate-500 font-medium">To:</span> {selectedEmail.to}
                      </p>
                    )}
                    <p>
                      <span className="text-slate-500 font-medium">Date:</span> {selectedEmail.date}
                    </p>
                  </div>
                </div>

                {/* AI Extracted Intel Display */}
                {emailAnalysis && (
                  <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-indigo-300 font-bold text-sm">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span>AI Meeting Intelligence Extracted</span>
                      </div>

                      {/* Import to MeetMind */}
                      <button
                        onClick={handleImportAsMeeting}
                        disabled={importSuccess}
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-60"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{importSuccess ? 'Imported to Meetings!' : 'Import as Meeting'}</span>
                      </button>
                    </div>

                    {/* Executive Summary */}
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                      <span className="font-semibold text-indigo-300 block mb-1">
                        Executive Conversation Synthesis:
                      </span>
                      {emailAnalysis.conversationSummary}
                    </div>

                    {/* Scheduled dates/times */}
                    {emailAnalysis.meetingDatesTimes && emailAnalysis.meetingDatesTimes.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Meeting Dates & Times:</span>
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {emailAnalysis.meetingDatesTimes.map((item, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                              <span className="font-bold text-indigo-300 block">{item.dateTime}</span>
                              <span className="text-slate-400 text-[11px]">{item.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Discussion Topics & Decisions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                        <span className="font-bold text-cyan-400 flex items-center space-x-1">
                          <Target className="w-3.5 h-3.5" />
                          <span>Discussion Topics</span>
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                          {emailAnalysis.discussionTopics?.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                        <span className="font-bold text-emerald-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Decisions Agreed</span>
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                          {emailAnalysis.decisions?.map((d, i) => (
                            <li key={i}>{d.decision}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Extracted Action Items */}
                    {emailAnalysis.actionItems && emailAnalysis.actionItems.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-slate-300">
                          Extracted Action Items & Deadlines:
                        </span>
                        <div className="space-y-1.5">
                          {emailAnalysis.actionItems.map((act, i) => (
                            <div
                              key={i}
                              className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="space-y-0.5">
                                <span className="font-medium text-white">{act.task}</span>
                                <div className="text-[11px] text-slate-400">
                                  <span>Owner: <strong className="text-slate-300">{act.assignee}</strong></span> •{' '}
                                  <span>Due: <strong className="text-indigo-300">{act.deadline}</strong></span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                {act.priority}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Email Raw Body Review */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Original Email Body
                  </span>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-72 overflow-y-auto text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {selectedEmail.body}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-slate-400">Select an email to view details</p>
                <p>Choose any meeting email from the search results on the left to read its full message and extract meeting intelligence.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Not connected banner */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white">Connect Your Google Gmail Account</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Connecting your account allows MeetMind AI to look up relevant meeting threads and send summary emails directly with your permission.
          </p>
          <button
            onClick={onConnectGmail}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <span>Connect Gmail with Google</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
