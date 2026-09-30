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
  memberIds?: Record<string, string>; // email -> userId mapping
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
  // Present on trip/group-detail responses; list responses (groups list) send activityCount instead.
  activities?: Activity[];
  // Present on list responses in place of the full activities array; undefined on detail responses
  // (fall back to activities?.length there).
  activityCount?: number;
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
  travelStyle?: string;
  hasCompletedOnboarding?: boolean;
}

export interface Activity {
  id: string;
  date: string;
  title: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  notes?: string;
  done: boolean;
  transportationMode?: string;
  pickupTime?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

/** One person's part of an expense, as the server computed it. */
export interface ExpenseSplitShare {
  member: string; // email, or a guest's name (same identifiers as splitWith)
  shareAmount: number; // pesos, exact to the centavo; the shares add up to the expense amount
  isGuest?: boolean; // true when member is a free-text name with no account, not a registered member's email
}

export interface Expense {
  id: string;
  groupId: string;
  tripId: string;
  paidBy: string;
  paidByIsGuest?: boolean; // true when paidBy is a free-text name with no account
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
  splits: ExpenseSplitShare[]; // same people as splitWith, in the same order, with their shares; empty = nobody owes anything
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
/** A row in the admin "User Management" table — the `/admin/users` list response, not the full `User` model. */
export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  authCreationTime: string | null;
  stats: {
    trips: number;
    groups: number;
  };
}

export interface Budget {
  id: string;
  tripId: string;
  activityId?: string;
  category?: string;
  amount: number;
  description?: string;
  isBooked: boolean;
  createdAt: string;
  updatedAt: string;
  activity?: {
    id: string;
    title: string;
    date: string;
  };
}
