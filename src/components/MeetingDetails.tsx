import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Target,
  Sparkles,
  CheckCircle2,
  Circle,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  FileText,
  Mail,
  Download,
  Trash2,
  Edit2,
  Save,
  Plus,
  Copy,
  Check,
  Search,
  Tag,
  Share2
} from 'lucide-react';
import { MeetingRecord, ActionItem } from '../types/meeting';

interface MeetingDetailsProps {
  meeting: MeetingRecord;
  onBack: () => void;
  onUpdateMeeting: (updated: MeetingRecord) => void;
  onDeleteMeeting: (id: string) => void;
  onOpenGmailModal: (meeting: MeetingRecord) => void;
}

export const MeetingDetails: React.FC<MeetingDetailsProps> = ({
  meeting,
  onBack,
  onUpdateMeeting,
  onDeleteMeeting,
  onOpenGmailModal
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'actionItems' | 'transcript'>('summary');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(meeting.title);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // New action item state
  const [isAddingActionItem, setIsAddingActionItem] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Handle Title Save
  const handleSaveTitle = () => {
    if (!titleInput.trim()) return;
    const updated = { ...meeting, title: titleInput.trim() };
    onUpdateMeeting(updated);
    setIsEditingTitle(false);
  };

  // Toggle Action Item Status
  const handleToggleActionStatus = (itemId: string) => {
    const updatedItems = meeting.actionItems.map(item => {
      if (item.id === itemId) {
        const nextStatus = item.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...item, status: nextStatus };
      }
      return item;
    });
    onUpdateMeeting({ ...meeting, actionItems: updatedItems });
  };

  // Add Action Item
  const handleAddActionItem = () => {
    if (!newTask.trim()) return;
    const newItem: ActionItem = {
      id: `act-${Date.now()}`,
      task: newTask.trim(),
      assignee: newAssignee.trim() || 'Not specified',
      deadline: newDeadline.trim() || 'Not specified',
      priority: newPriority,
      status: 'Pending'
    };

    onUpdateMeeting({
      ...meeting,
      actionItems: [...meeting.actionItems, newItem]
    });

    setNewTask('');
    setNewAssignee('');
    setNewDeadline('');
    setIsAddingActionItem(false);
  };

  // Delete Action Item
  const handleDeleteActionItem = (itemId: string) => {
    const updatedItems = meeting.actionItems.filter(item => item.id !== itemId);
    onUpdateMeeting({ ...meeting, actionItems: updatedItems });
  };

  // Copy Transcript
  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(meeting.transcript);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  // Export as TXT
  const handleExportTxt = () => {
    const lines = [
      `==================================================`,
      `MEETMIND AI — MEETING SUMMARY & ACTION DIGEST`,
      `==================================================`,
      `Title: ${meeting.title}`,
      `Date: ${new Date(meeting.date).toLocaleDateString()} ${new Date(meeting.date).toLocaleTimeString()}`,
      `Duration: ${meeting.duration}`,
      `Speakers: ${meeting.speakers.join(', ') || 'Various'}`,
      `Main Goal: ${meeting.overview?.mainGoal || 'Not specified'}`,
      ``,
      `--- SHORT EXECUTIVE SUMMARY ---`,
      meeting.shortSummary,
      ``,
      `--- DETAILED SUMMARY ---`,
      meeting.detailedSummary,
      ``,
      `--- IMPORTANT DISCUSSION POINTS ---`,
      ...(meeting.discussionPoints?.map(dp => `• ${dp.topic}: ${dp.details}`) || []),
      ``,
      `--- DECISIONS MADE ---`,
      ...(meeting.decisions?.map(d => `• Decision: ${d.decision}\n  Rationale: ${d.rationale}\n  Owner: ${d.owner || 'Team'}`) || []),
      ``,
      `--- PROBLEMS & BLOCKERS DISCUSSED ---`,
      ...(meeting.problems?.map(p => `• Problem: ${p.problem}\n  Impact: ${p.impact}${p.proposedSolution ? `\n  Solution: ${p.proposedSolution}` : ''}`) || []),
      ``,
      `--- UNRESOLVED QUESTIONS ---`,
      ...(meeting.unresolvedQuestions?.map(q => `• Question: ${q.question}${q.context ? ` (${q.context})` : ''}`) || []),
      ``,
      `--- NEXT STEPS ---`,
      ...(meeting.nextSteps?.map(ns => `• ${ns}`) || []),
      ``,
      `--- ACTION ITEMS ---`,
      ...(meeting.actionItems?.map(
        ai => `[${ai.status === 'Completed' ? 'X' : ' '}] ${ai.task} | Assignee: ${ai.assignee} | Deadline: ${ai.deadline} | Priority: ${ai.priority}`
      ) || []),
      ``,
      `--- FULL TRANSCRIPT ---`,
      meeting.transcript
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export / Print as PDF
  const handleExportPdf = () => {
    window.print();
  };

  const completedActionsCount = meeting.actionItems.filter(i => i.status === 'Completed').length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Navigation & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Meetings</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Send via Gmail */}
          <button
            onClick={() => onOpenGmailModal(meeting)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Mail className="w-4 h-4" />
            <span>Send via Gmail</span>
          </button>

          {/* Export TXT */}
          <button
            onClick={handleExportTxt}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
            title="Download formatted text summary"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export TXT</span>
          </button>

          {/* Export PDF / Print */}
          <button
            onClick={handleExportPdf}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
            title="Print or Save as PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          {/* Delete Meeting */}
          <button
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${meeting.title}"? This cannot be undone.`)) {
                onDeleteMeeting(meeting.id);
              }
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition-colors"
            title="Delete this meeting"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Meeting Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            {/* Title */}
            <div className="flex items-center space-x-3">
              {isEditingTitle ? (
                <div className="flex items-center space-x-2 flex-1 max-w-lg">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={e => setTitleInput(e.target.value)}
                    className="w-full px-3.5 py-1.5 rounded-lg bg-slate-950 border border-indigo-500 text-white text-xl font-bold focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 group">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {meeting.title}
                  </h1>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-white transition-opacity"
                    title="Edit Title"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center space-x-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/70">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>{new Date(meeting.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </span>

              <span className="flex items-center space-x-1.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/70">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{meeting.duration}</span>
              </span>

              {meeting.overview?.mainGoal && (
                <span className="flex items-center space-x-1.5 bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-xl border border-indigo-500/20">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="truncate max-w-xs sm:max-w-md">Goal: {meeting.overview.mainGoal}</span>
                </span>
              )}
            </div>

            {/* Speakers List */}
            {meeting.speakers && meeting.speakers.length > 0 && (
              <div className="flex items-center space-x-2 pt-1 text-xs text-slate-400">
                <Users className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-semibold text-slate-300">Participants:</span>
                <div className="flex flex-wrap gap-1.5">
                  {meeting.speakers.map((speaker, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700/60"
                    >
                      {speaker}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Item Quick Badge */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shrink-0 min-w-[200px] text-center">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Action Items Status
            </span>
            <div className="mt-2 text-2xl font-black text-white">
              {completedActionsCount} <span className="text-sm font-normal text-slate-400">/ {meeting.actionItems.length} completed</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${meeting.actionItems.length > 0 ? (completedActionsCount / meeting.actionItems.length) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 text-sm font-medium">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-semibold transition-colors ${
            activeTab === 'summary'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Executive Summary & Analysis (8 Sections)</span>
        </button>

        <button
          onClick={() => setActiveTab('actionItems')}
          className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-semibold transition-colors ${
            activeTab === 'actionItems'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Action Items ({meeting.actionItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-semibold transition-colors ${
            activeTab === 'transcript'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Full Transcript</span>
        </button>
      </div>

      {/* TAB 1: 8 Structured Summary Sections */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Section 1 & 2: Short Executive Summary & Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex items-center space-x-2.5 text-indigo-400 font-bold text-lg">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2>1. Meeting Overview & Executive Summary</h2>
            </div>
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-slate-100 text-sm leading-relaxed">
              <span className="font-semibold text-indigo-300 block mb-1">Executive Elevator Pitch:</span>
              {meeting.shortSummary}
            </div>
            {meeting.overview?.mainGoal && (
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Core Objective:</span> {meeting.overview.mainGoal}
              </p>
            )}
          </div>

          {/* Section 3: Detailed Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-lg">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h2>2. Detailed Summary</h2>
            </div>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-5 rounded-xl border border-slate-800/80">
              {meeting.detailedSummary}
            </div>
          </div>

          {/* Section 4: Important Discussion Points */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-lg">
              <Users className="w-5 h-5 text-cyan-400" />
              <h2>3. Important Discussion Points</h2>
            </div>
            {meeting.discussionPoints && meeting.discussionPoints.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {meeting.discussionPoints.map((point, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-1.5"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <h4 className="font-semibold text-sm text-white">{point.topic}</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-4">{point.details}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No specific discussion points recorded.</p>
            )}
          </div>

          {/* Section 5: Decisions Made */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2>4. Decisions Made</h2>
            </div>
            {meeting.decisions && meeting.decisions.length > 0 ? (
              <div className="space-y-3">
                {meeting.decisions.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                        Decision #{idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-white">{item.decision}</p>
                      <p className="text-xs text-slate-300">
                        <span className="text-slate-400 font-medium">Rationale:</span> {item.rationale}
                      </p>
                    </div>
                    {item.owner && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold shrink-0">
                        Owner: {item.owner}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No explicit consensus or decisions recorded.</p>
            )}
          </div>

          {/* Section 6: Problems Discussed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2>5. Problems & Blockers Discussed</h2>
            </div>
            {meeting.problems && meeting.problems.length > 0 ? (
              <div className="space-y-3">
                {meeting.problems.map((prob, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1.5"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <h4 className="font-semibold text-sm text-white">{prob.problem}</h4>
                    </div>
                    <p className="text-xs text-slate-300 pl-4">
                      <span className="text-slate-400 font-medium">Impact:</span> {prob.impact}
                    </p>
                    {prob.proposedSolution && (
                      <p className="text-xs text-emerald-300 pl-4">
                        <span className="font-medium">Proposed Solution:</span> {prob.proposedSolution}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No blockers or problems were raised.</p>
            )}
          </div>

          {/* Section 7: Unresolved Questions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-sky-400 font-bold text-lg">
              <HelpCircle className="w-5 h-5 text-sky-400" />
              <h2>6. Unresolved Questions</h2>
            </div>
            {meeting.unresolvedQuestions && meeting.unresolvedQuestions.length > 0 ? (
              <div className="space-y-2.5">
                {meeting.unresolvedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start space-x-3 text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                      ?
                    </span>
                    <div>
                      <p className="text-white font-medium text-sm">{q.question}</p>
                      {q.context && <p className="text-slate-400 mt-0.5">{q.context}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">All questions were answered in this session.</p>
            )}
          </div>

          {/* Section 8: Next Steps */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-lg">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h2>7. Next Steps & Forward Trajectory</h2>
            </div>
            {meeting.nextSteps && meeting.nextSteps.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-300">
                {meeting.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start space-x-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500">No explicit next steps defined.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Action Items Tracker */}
      {activeTab === 'actionItems' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-6 h-6 text-indigo-400" />
                <h3 className="text-xl font-bold text-white">8. Action Items & Responsible Owners</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Extracted directly from dialogue. Assigned persons and deadlines are preserved faithfully without hallucination.
              </p>
            </div>

            <button
              onClick={() => setIsAddingActionItem(!isAddingActionItem)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Add Action Item</span>
            </button>
          </div>

          {/* Form to add action item */}
          {isAddingActionItem && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h4 className="text-sm font-semibold text-white">Add New Action Item</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Task Description
                  </label>
                  <input
                    type="text"
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    placeholder="e.g. Schedule follow-up with marketing lead"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={e => setNewAssignee(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Deadline</label>
                  <input
                    type="text"
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                    placeholder="e.g. Friday 5 PM"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Priority:</span>
                  {(['High', 'Medium', 'Low'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        newPriority === p
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsAddingActionItem(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddActionItem}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    Save Item
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Items List */}
          {meeting.actionItems && meeting.actionItems.length > 0 ? (
            <div className="space-y-3">
              {meeting.actionItems.map(item => {
                const isCompleted = item.status === 'Completed';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isCompleted
                        ? 'bg-slate-950/50 border-slate-800/80 opacity-70'
                        : 'bg-slate-950 border-slate-800 hover:border-indigo-500/40 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5 flex-1">
                      <button
                        onClick={() => handleToggleActionStatus(item.id)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                        )}
                      </button>

                      <div className="space-y-1">
                        <p
                          className={`text-sm font-medium ${
                            isCompleted ? 'line-through text-slate-500' : 'text-white'
                          }`}
                        >
                          {item.task}
                        </p>

                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                          <span className="flex items-center space-x-1">
                            <span className="text-slate-500 font-medium">Assignee:</span>
                            <span className="text-slate-300 font-semibold">{item.assignee}</span>
                          </span>

                          <span>•</span>

                          <span className="flex items-center space-x-1">
                            <span className="text-slate-500 font-medium">Due:</span>
                            <span className="text-indigo-300">{item.deadline}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5 self-end sm:self-center">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          item.priority === 'High'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            : item.priority === 'Medium'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {item.priority}
                      </span>

                      <button
                        onClick={() => handleDeleteActionItem(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              No action items found in this meeting.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Transcript Viewer */}
      {activeTab === 'transcript' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Full Meeting Speech Transcript</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {meeting.transcript.split(/\s+/).filter(Boolean).length} words • Diarized with Gemini AI
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Search in transcript */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={transcriptSearch}
                  onChange={e => setTranscriptSearch(e.target.value)}
                  placeholder="Search transcript..."
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
                />
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopyTranscript}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTranscript ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 max-h-[550px] overflow-y-auto text-sm text-slate-200 font-mono leading-relaxed whitespace-pre-line space-y-3">
            {transcriptSearch.trim() ? (
              // Highlight matched text
              meeting.transcript
                .split('\n')
                .filter(line => line.toLowerCase().includes(transcriptSearch.toLowerCase()))
                .map((line, i) => (
                  <p key={i} className="p-1 rounded bg-indigo-900/30 border border-indigo-500/20">
                    {line}
                  </p>
                ))
            ) : (
              meeting.transcript
            )}
          </div>
        </div>
      )}
    </div>
  );
};
