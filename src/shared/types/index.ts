export interface Group {
  id: string;
  name: string;
  code: string;
  colorScheme?: string;
  emoji?: string;
  trips?: Trip[];
  createdAt: string;
  createdBy?: string;
  createdByEmail?: string;
  memberEmails?: string[];
  memberNames?: Record<string, string>; // email -> name mapping
  memberMetadata?: Record<
    string,
    { joinedAt: string; name?: string; imageUrl?: string }
  >; // email -> metadata with joined date and imageUrl
}

export interface Trip {
  id: string;
  groupId: string;
  name: string;
  startDate: string;
  endDate: string;
  activities: Activity[];
  createdAt: string;
  location?: string; // Added optional location field
  status?: "planning" | "finalized" | "ongoing" | "cancelled"; // Trip status
  createdBy?: string; // Creator name or email
  createdById?: string; // Creator user ID
}
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  avatar?: string; // Added avatar field to store image URL or base64
  imageUrl?: string; // Prisma field
  bio?: string;
  referralSource?: string;
  hasCompletedOnboarding?: boolean;
}

export interface Activity {
  id: string;
  date: string;
  title: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  done: boolean;
  transportationMode?: string;
  pickupTime?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

export interface Expense {
  id: string;
  groupId: string;
  tripId: string;
  paidBy: string;
  createdById?: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    imageUrl?: string;
  };
  amount: number;
  description: string;
  date: string;
  category?: string;
  splitWith?: string[]; // members who should split this expense
  paymentMethod?: "cash" | "bank" | "maya" | "gcash";
  accountNumber?: string;
  bankName?: string; // for bank transfer
  accountName?: string; // for all payment methods
  qrImage?: string; // blob URL or base64 image
  paidMembers?: string[]; // members who have confirmed paid their share
  pendingPayments?: string[]; // members who have marked themselves as paid but pending confirmation
  paymentStatusMap?: Record<string, "pending" | "confirmed" | "rejected">; // email -> payment status
  activityId?: string; // optional link to activity
}

export interface PaymentLog {
  id: string;
  tripId: string;
  expenseId: string;
  expenseDescription: string;
  payer: string; // who paid (name or email)
  payee: string; // who received payment (name or email)
  payerEmail?: string; // payer email for avatar lookup
  payeeEmail?: string; // payee email for avatar lookup
  payerImageUrl?: string; // payer avatar URL
  payeeImageUrl?: string; // payee avatar URL
  amount: number;
  timestamp: string;
  paymentMethod?: "cash" | "bank" | "maya" | "gcash";
}

export interface Review {
  id: string;
  rating: number; // 1-5 stars
  comment: string;
  name?: string;
  email?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | "payment"
    | "payment_confirmed"
    | "payment_rejected"
    | "group_join"
    | "group_leave"
    | "activity_added"
    | "activity_edited"
    | "activity_deleted"
    | "expense_added"
    | "expense_edited"
    | "expense_deleted"
    | "trip_created"
    | "trip_updated"
    | "trip_deleted";
  title: string;
  message: string;
  read: boolean;
  readAt?: string;
  relatedGroupId?: string;
  relatedTripId?: string;
  relatedExpenseId?: string;
  relatedActivityId?: string;
  createdAt: string;
}
