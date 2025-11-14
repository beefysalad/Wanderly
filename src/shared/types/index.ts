export interface Group {
  id: string;
  name: string;
  code: string;
  members?: string[]; // <= make optional
  trips?: Trip[]; // <= make optional
  createdAt: string;
  creatorEmail?: string; // <= make optional
  isGuest?: boolean;
  guestId?: string;
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
}
export interface User {
  id: string;
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

export interface TripGroup {
  id: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  activities: Activity[];
  createdAt: string;
}
