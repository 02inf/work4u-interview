export interface AgendaItem {
  topic: string;
  update: string;
  blockers: string;
  action: string;
  responsible: string[];
  deadline: string;
  requires_approval: boolean;
}

export interface MeetingSummary {
  id: string;
  title: string;
  date: string;
  created_at?: string;
  participants: string[];
  agenda?: AgendaItem[];
  key_metrics?: string[];
  next_meeting?: string;
  duration?: string;
  transcript: string;
  public_id?: string;
  natural_summary?: string;
  summary?: string; // Kept for compatibility, ideally backend would be consistent
}