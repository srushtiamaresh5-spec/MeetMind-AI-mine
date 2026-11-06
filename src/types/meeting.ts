export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  deadline: string;
  priority: 'High' | 'Medium' | 'Low' | string;
  status: 'Pending' | 'In Progress' | 'Completed' | string;
}

export interface DiscussionPoint {
  topic: string;
  details: string;
}

export interface Decision {
  decision: string;
  rationale: string;
  owner?: string;
}

export interface Problem {
  problem: string;
  impact: string;
  proposedSolution?: string;
}

export interface UnresolvedQuestion {
  question: string;
  context?: string;
}

export interface MeetingOverview {
  title: string;
  date: string;
  estimatedDuration: string;
  speakers: string[];
  mainGoal: string;
}

export interface MeetingRecord {
  id: string;
  title: string;
  date: string;
  duration: string;
  audioSource?: string;
  speakers: string[];
  transcript: string;
  overview: MeetingOverview;
  shortSummary: string;
  detailedSummary: string;
  discussionPoints: DiscussionPoint[];
  decisions: Decision[];
  problems: Problem[];
  unresolvedQuestions: UnresolvedQuestion[];
  nextSteps: string[];
  actionItems: ActionItem[];
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GmailEmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  body: string;
}

export interface EmailAnalysis {
  conversationSummary: string;
  meetingDatesTimes?: Array<{ dateTime: string; description: string }>;
  participants: string[];
  discussionTopics: string[];
  decisions: Array<{ decision: string; context?: string }>;
  actionItems: Array<{ task: string; assignee: string; deadline: string; priority: string }>;
  followUpRequirements?: string[];
}
