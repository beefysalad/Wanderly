export interface Group {
  id: string;
  name: string;
  code: string;
  trips?: Trip[];
  createdAt: string;
  createdBy?: string;
  memberEmails?: string[];
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
}
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  avatar?: string; // Added avatar field to store image URL or base64
}

export interface Activity {
  id: string;
  date: string;
  title: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  done: boolean;
}

export interface Expense {
  id: string;
  groupId: string;
  tripId: string;
  paidBy: string;
  amount: number;
  description: string;
  date: string;
  category?: string;
  splitWith?: string[]; // members who should split this expense
  paymentMethod?: "bank" | "maya" | "gcash";
  accountNumber?: string;
  bankName?: string; // for bank transfer
  accountName?: string; // for all payment methods
  qrImage?: string; // blob URL or base64 image
  paidMembers?: string[]; // members who have paid their share
}

export interface PaymentLog {
  id: string;
  tripId: string;
  expenseId: string;
  expenseDescription: string;
  payer: string; // who paid
  payee: string; // who received payment
  amount: number;
  timestamp: string;
  paymentMethod?: "cash" | "bank" | "maya" | "gcash";
}
