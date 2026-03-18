export interface Notification {
  notification_id: string;
  recipient_id: string;
  recipient_type: "internal" | "external";
  type: string;
  title: string;
  message: string;
  related_entity_type: "complaint" | "feedback" | null;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  complaint?: {
    ticketing_code: string;
  };
  feedback?: {
    feedback_id: string;
    full_name: string;
  };
}

export interface MarkAsReadResponse {
  success: boolean;
  message: string;
}

export interface GetNotificationsResponse {
  success: boolean;
  data: Notification[];
}
