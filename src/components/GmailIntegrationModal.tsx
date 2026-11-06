import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Loader2,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { MeetingRecord } from '../types/meeting';
import { sendMeetingSummaryEmail } from '../services/gmail';
import { getAccessToken } from '../services/auth';

interface GmailIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingRecord | null;
  gmailConnected: boolean;
  onConnectGmail: () => void;
}

export const GmailIntegrationModal: React.FC<GmailIntegrationModalProps> = ({
  isOpen,
  onClose,
  meeting,
  gmailConnected,
  onConnectGmail
}) => {
  if (!isOpen || !meeting) return null;

  const [toEmail, setToEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('');
  const [subject, setSubject] = useState(`[Meeting Recap] ${meeting.title}`);
  const [previewTab, setPreviewTab] = useState<'formatted' | 'raw'>('formatted');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userConfirmed, setUserConfirmed] = useState(false);

  // Generate Email HTML
  const generateEmailHtml = () => {
    const actionItemsHtml =
      meeting.actionItems && meeting.actionItems.length > 0
        ? meeting.actionItems
            .map(
              item => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px; font-weight: 600; color: #1e293b;">${item.task}</td>
            <td style="padding: 10px; color: #475569;">${item.assignee}</td>
            <td style="padding: 10px; color: #6366f1; font-weight: 500;">${item.deadline}</td>
            <td style="padding: 10px;">
              <span style="padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: bold; background-color: ${
                item.priority === 'High' ? '#fee2e2; color: #991b1b;' : '#fef3c7; color: #92400e;'
              }">
                ${item.priority}
              </span>
            </td>
          </tr>`
            )
            .join('')
        : '<tr><td colspan="4" style="padding: 10px; color: #64748b;">No action items recorded.</td></tr>';

    const decisionsHtml =
      meeting.decisions && meeting.decisions.length > 0
        ? meeting.decisions
            .map(
              d => `
          <li style="margin-bottom: 8px; color: #334155;">
            <strong>${d.decision}</strong><br/>
            <span style="font-size: 12px; color: #64748b;">Rationale: ${d.rationale} ${d.owner ? `(Owner: ${d.owner})` : ''}</span>
          </li>`
            )
            .join('')
        : '<p style="color: #64748b;">No decisions recorded.</p>';

    const discussionPointsHtml =
      meeting.discussionPoints && meeting.discussionPoints.length > 0
        ? meeting.discussionPoints
            .map(
              dp => `
          <li style="margin-bottom: 8px; color: #334155;">
            <strong>${dp.topic}:</strong> ${dp.details}
          </li>`
            )
            .join('')
        : '<p style="color: #64748b;">No discussion points recorded.</p>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; }
          .container { max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; }
          .header { border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: bold; color: #0f172a; margin: 0; }
          .meta { font-size: 13px; color: #64748b; margin-top: 6px; }
          .badge { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-right: 6px; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 16px; font-weight: bold; color: #4338ca; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 10px; }
          .summary-box { background: #f8fafc; border-left: 4px solid #6366f1; padding: 14px; border-radius: 4px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { text-align: left; padding: 8px 10px; background-color: #f1f5f9; color: #475569; font-weight: bold; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">${meeting.title}</h1>
            <div class="meta">
              <span>Date: ${new Date(meeting.date).toLocaleDateString()}</span> •
              <span>Duration: ${meeting.duration}</span> •
              <span>Attendees: ${meeting.speakers.join(', ') || 'Team'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Executive Summary</div>
            <div class="summary-box">
              <p style="margin: 0; font-size: 14px; color: #0f172a;">${meeting.shortSummary}</p>
            </div>
            <p style="font-size: 13px; color: #334155; margin-top: 8px;">${meeting.detailedSummary}</p>
          </div>

          <div class="section">
            <div class="section-title">Key Action Items & Assignments</div>
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assignee</th>
                  <th>Deadline</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                ${actionItemsHtml}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Decisions Agreed Upon</div>
            <ul style="padding-left: 20px; margin: 0;">
              ${decisionsHtml}
            </ul>
          </div>

          <div class="section">
            <div class="section-title">Key Discussion Points</div>
            <ul style="padding-left: 20px; margin: 0;">
              ${discussionPointsHtml}
            </ul>
          </div>

          <div class="footer">
            Generated automatically by <strong>MeetMind AI</strong> — AI-Powered Meeting Assistant
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Generate Email Plaintext
  const generateEmailText = () => {
    return `
MEETMIND AI — MEETING RECAP
==================================================
Title: ${meeting.title}
Date: ${new Date(meeting.date).toLocaleDateString()}
Duration: ${meeting.duration}
Attendees: ${meeting.speakers.join(', ') || 'Team'}

EXECUTIVE SUMMARY:
${meeting.shortSummary}

DETAILED SUMMARY:
${meeting.detailedSummary}

ACTION ITEMS:
${
  meeting.actionItems && meeting.actionItems.length > 0
    ? meeting.actionItems
        .map(i => `• [${i.priority}] ${i.task} | Assignee: ${i.assignee} | Due: ${i.deadline}`)
        .join('\n')
    : 'None recorded'
}

DECISIONS MADE:
${
  meeting.decisions && meeting.decisions.length > 0
    ? meeting.decisions.map(d => `• ${d.decision} (Rationale: ${d.rationale})`).join('\n')
    : 'None'
}

NEXT STEPS:
${meeting.nextSteps?.map(ns => `• ${ns}`).join('\n') || 'None'}
    `.trim();
  };

  const handleSend = async () => {
    setErrorMessage(null);

    if (!toEmail.trim()) {
      setErrorMessage('Please provide at least one recipient email address.');
      return;
    }

    if (!userConfirmed) {
      setErrorMessage('Please confirm that you have reviewed the email summary before sending.');
      return;
    }

    setIsSending(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Your Gmail session has expired or is not connected. Please connect Gmail first.');
      }

      await sendMeetingSummaryEmail(token, {
        to: toEmail,
        cc: ccEmail,
        subject,
        bodyHtml: generateEmailHtml(),
        bodyText: generateEmailText()
      });

      setSendSuccess(true);
      setTimeout(() => {
        onClose();
        setSendSuccess(false);
      }, 2500);
    } catch (err: any) {
      console.error('Failed to send email:', err);
      setErrorMessage(err.message || 'Failed to send email through Gmail. Please check permissions.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Mail className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Send Meeting Summary via Gmail</h3>
              <p className="text-xs text-slate-400">
                Official Gmail API integration • Strict user authorization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* If Gmail not connected */}
          {!gmailConnected && (
            <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-center space-y-3">
              <ShieldAlert className="w-8 h-8 text-indigo-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Gmail Account Required</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                To send meeting summaries directly from your Gmail inbox, connect your Google account with official Gmail API permissions.
              </p>
              <button
                onClick={onConnectGmail}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>Connect Google Gmail</span>
              </button>
            </div>
          )}

          {sendSuccess ? (
            <div className="p-8 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-lg font-bold text-white">Email Sent Successfully!</h4>
              <p className="text-xs text-slate-300">
                The meeting summary and action item digest was dispatched from your connected Gmail address to{' '}
                <span className="font-semibold text-emerald-300">{toEmail}</span>.
              </p>
            </div>
          ) : (
            <>
              {/* Form fields */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    To: Recipient Email(s) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={toEmail}
                    onChange={e => setToEmail(e.target.value)}
                    placeholder="teammate@company.com, manager@company.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cc: (Optional)
                  </label>
                  <input
                    type="text"
                    value={ccEmail}
                    onChange={e => setCcEmail(e.target.value)}
                    placeholder="project-leads@company.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Complete Email Preview Section */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Complete Email Preview</span>
                  </div>

                  <div className="flex items-center space-x-1 text-xs">
                    <button
                      onClick={() => setPreviewTab('formatted')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                        previewTab === 'formatted'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Formatted HTML
                    </button>
                    <button
                      onClick={() => setPreviewTab('raw')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                        previewTab === 'raw'
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Plain Text
                    </button>
                  </div>
                </div>

                <div className="p-4 max-h-72 overflow-y-auto">
                  {previewTab === 'formatted' ? (
                    <div
                      className="bg-white rounded-xl p-4 text-slate-900 text-xs shadow-inner"
                      dangerouslySetInnerHTML={{ __html: generateEmailHtml() }}
                    />
                  ) : (
                    <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {generateEmailText()}
                    </pre>
                  )}
                </div>
              </div>

              {/* Explicit User Confirmation Checkbox */}
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="userConfirmCheck"
                  checked={userConfirmed}
                  onChange={e => setUserConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="userConfirmCheck" className="text-xs text-slate-300 leading-normal cursor-pointer">
                  <span className="font-semibold text-white">Explicit Confirmation:</span> I have reviewed the recipients, subject, and meeting summary content above and approve sending this email through my connected Gmail account.
                </label>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!sendSuccess && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
            <span className="text-[11px] text-slate-500">
              Sends using official Gmail API <code className="text-slate-400">gmail.send</code> scope
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || !gmailConnected || !userConfirmed}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-40 active:scale-95"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending through Gmail...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm & Send via Gmail</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
