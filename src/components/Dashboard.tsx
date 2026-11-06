import React, { useState } from 'react';
import {
  Mic,
  UploadCloud,
  Mail,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  ListTodo,
  Sparkles,
  ArrowRight,
  Trash2,
  Users,
  Radio,
  FileAudio,
  ShieldCheck
} from 'lucide-react';
import { MeetingRecord } from '../types/meeting';

interface DashboardProps {
  meetings: MeetingRecord[];
  onSelectMeeting: (meeting: MeetingRecord) => void;
  onOpenGmailModal: (meeting: MeetingRecord) => void;
  onDeleteMeeting: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  gmailConnected: boolean;
  onConnectGmail: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  meetings,
  onSelectMeeting,
  onOpenGmailModal,
  onDeleteMeeting,
  onNavigateTab,
  gmailConnected,
  onConnectGmail
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Compute metrics
  const totalMeetings = meetings.length;
  const totalActionItems = meetings.reduce((acc, m) => acc + (m.actionItems?.length || 0), 0);
  const completedActionItems = meetings.reduce(
    (acc, m) => acc + (m.actionItems?.filter(a => a.status === 'Completed').length || 0),
    0
  );
  const pendingActionItems = totalActionItems - completedActionItems;

  // Extract all unique tags
  const allTags = Array.from(
    new Set(meetings.flatMap(m => m.tags || []).filter(Boolean))
  );

  // Filter meetings
  const filteredMeetings = meetings.filter(m => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.shortSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.speakers && m.speakers.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTag =
      selectedTag === 'all' || (m.tags && m.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI-Powered Executive Meeting Assistant</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Understand meetings in seconds without listening to hours of audio.
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Record directly from your browser, upload audio files, or pull meeting email threads from Gmail. MeetMind AI generates 8-section executive summaries, pinpoints decisions, and tracks action items.
          </p>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onNavigateTab('record')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-xs shadow-lg shadow-rose-600/25 transition-all active:scale-95"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Record Live Meeting</span>
            </button>

            <button
              onClick={() => onNavigateTab('upload')}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Audio File</span>
            </button>

            <button
              onClick={() => onNavigateTab('gmail')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 font-medium text-xs transition-all"
            >
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>Gmail Intel Reader</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Meetings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Meetings Analyzed</span>
            <FileAudio className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">{totalMeetings}</div>
          <p className="text-[11px] text-slate-400 mt-1">Transcribed & summarized</p>
        </div>

        {/* Pending Action Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Tasks</span>
            <ListTodo className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300">{pendingActionItems}</div>
          <p className="text-[11px] text-slate-400 mt-1">Requires follow-up</p>
        </div>

        {/* Completed Action Items */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tasks Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">{completedActionItems}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalActionItems > 0
              ? `${Math.round((completedActionItems / totalActionItems) * 100)}% completion rate`
              : 'No action items yet'}
          </p>
        </div>

        {/* Gmail Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gmail Integration</span>
            <Mail className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                gmailConnected ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
            <span className={`text-base font-bold ${gmailConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
              {gmailConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('gmail')}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-1.5 font-medium flex items-center space-x-1"
          >
            <span>{gmailConnected ? 'Manage emails' : 'Connect now'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Meeting History Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Recent Meeting Sessions</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any meeting to inspect transcripts, modify action items, or dispatch summaries.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search meetings, speakers..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium mr-1 text-[11px]">Filter by tag:</span>
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                selectedTag === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Meetings
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedTag === tag
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Meeting Cards List */}
        {filteredMeetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMeetings.map(meeting => {
              const pendingCount = meeting.actionItems?.filter(a => a.status !== 'Completed').length || 0;
              const completedCount = meeting.actionItems?.filter(a => a.status === 'Completed').length || 0;

              return (
                <div
                  key={meeting.id}
                  className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top Row: Date, Duration, Tag */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(meeting.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{meeting.duration}</span>
                        </span>
                      </div>

                      {meeting.tags && meeting.tags[0] && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {meeting.tags[0]}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => onSelectMeeting(meeting)}
                      className="text-base font-bold text-white hover:text-indigo-300 cursor-pointer transition-colors line-clamp-1"
                    >
                      {meeting.title}
                    </h3>

                    {/* Summary Snippet */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {meeting.shortSummary}
                    </p>

                    {/* Speakers */}
                    {meeting.speakers && meeting.speakers.length > 0 && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                        <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate max-w-xs">{meeting.speakers.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Bar: Action Items & Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-400">
                      <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        <strong className="text-white">{completedCount}</strong>/{meeting.actionItems?.length || 0} tasks done
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => onOpenGmailModal(meeting)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 border border-slate-700/60 transition-colors"
                        title="Send Summary via Gmail"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete meeting "${meeting.title}"?`)) {
                            onDeleteMeeting(meeting.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition-colors"
                        title="Delete Meeting"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onSelectMeeting(meeting)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] transition-all"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-white">No Meetings Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No meetings match "${searchQuery}". Clear your search query to see all records.`
                : 'Start by recording live audio from your microphone or uploading an audio file.'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => onNavigateTab('record')}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow"
              >
                Record Meeting
              </button>
              <button
                onClick={() => onNavigateTab('upload')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow"
              >
                Upload Audio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
