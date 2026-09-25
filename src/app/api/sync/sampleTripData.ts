import type { PaymentMethod } from "@prisma/client";

/**
 * Sample data seeded into every new account: a 5-day Singapore trip planned with three
 * dummy friends. Kept declarative so the seeding logic (sampleTripSeeder.ts) stays small.
 */

/** "self" is the user who just signed up; a number indexes DUMMY_USERS. */
export type MemberRef = "self" | 0 | 1 | 2;

/** [day, index] of an activity inside ACTIVITIES_BY_DAY. */
export type ActivityRef = readonly [day: number, index: number];

export interface DummyUserSeed {
  name: string;
  email: string;
  firebaseId: string;
  imageUrl: string;
}

export interface ActivitySeed {
  title: string;
  startTime: string;
  endTime: string;
  notes: string;
  transportationMode?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

export interface BudgetSeed {
  activity?: ActivityRef;
  category: string;
  amount: number;
  description: string;
  isBooked: boolean;
}

export interface ExpenseSeed {
  activity?: ActivityRef;
  paidBy: MemberRef;
  amount: number;
  description: string;
  /** Either N days before seeding ("booked N days ago") or a day of the trip (0 = first day). */
  when: { daysAgo: number } | { tripDay: number };
  category: string;
  paymentMethod: PaymentMethod;
  /** "everyone" = all four members, otherwise exactly these members in this order. */
  splitWith: "everyone" | MemberRef[];
  bankDetails?: { bankName: string; accountNumber: string };
}

export const GROUP_NAME = "Singapore Adventure 2024 (sample)";
export const TRIP_NAME = "Marina Bay & Island Hopping (sample)";
export const TRIP_LOCATION = "Singapore";
/** The trip starts this many days after seeding and lasts five days. */
export const TRIP_START_OFFSET_DAYS = 30;

// Shared across every seeded account (reused if they already exist).
export const DUMMY_USERS: DummyUserSeed[] = [
  {
    "name": "Eleven",
    "email": "eleven.dummy@example.com",
    "firebaseId": "dummy_eleven_seed",
    "imageUrl": "https://res.cloudinary.com/ddmrbjevx/image/upload/v1771241672/eleven_q1wfzp.jpg"
  },
  {
    "name": "Mike",
    "email": "mike.dummy@example.com",
    "imageUrl": "https://res.cloudinary.com/ddmrbjevx/image/upload/v1771241672/Mike_Stranger_Things_Image_ljf6ll.jpg",
    "firebaseId": "dummy_mike_seed"
  },
  {
    "name": "Steve",
    "email": "steve.dummy@example.com",
    "firebaseId": "dummy_steve_seed",
    "imageUrl": "https://res.cloudinary.com/ddmrbjevx/image/upload/v1771241672/Steve_Stranger_Things_Image_mnn35x.jpg"
  }
];

export const ACTIVITIES_BY_DAY: ActivitySeed[][] = [
  // Day 1
  [
    {"title": "Flight MNL → SIN", "startTime": "06:30", "endTime": "10:15", "notes": "Cebu Pacific 5J807 - Terminal 3\nCheck-in 2 hours before", "transportationMode": "flight", "pickupLocation": "NAIA Terminal 3", "dropoffLocation": "Changi Airport Terminal 1"},
    {"title": "Airport Transfer to Hotel", "startTime": "10:30", "endTime": "11:30", "notes": "Grab from Changi to Marina Bay area", "transportationMode": "car", "pickupLocation": "Changi Airport T1", "dropoffLocation": "Marina Bay Sands"},
    {"title": "Check-in at Marina Bay Sands", "startTime": "14:00", "endTime": "15:00", "notes": "Booking confirmation: #MBS-8392\nEarly check-in requested"},
    {"title": "Lunch at Lau Pa Sat", "startTime": "12:30", "endTime": "14:00", "notes": "Famous hawker center in CBD\nTry satay street!"},
    {"title": "Explore Merlion Park", "startTime": "16:00", "endTime": "17:30", "notes": "Iconic photo spot with Marina Bay backdrop"},
    {"title": "Marina Bay Light Show", "startTime": "20:00", "endTime": "20:30", "notes": "Spectra - Free water & light show at Event Plaza"},
    {"title": "Dinner at Maxwell Food Centre", "startTime": "18:30", "endTime": "20:00", "notes": "Must try: Tian Tian Hainanese Chicken Rice"},
  ],
  // Day 2
  [
    {"title": "Breakfast at Hotel", "startTime": "08:00", "endTime": "09:00", "notes": "Included in hotel booking"},
    {"title": "Sentosa Express to Island", "startTime": "09:30", "endTime": "10:00", "notes": "From VivoCity Station\nSentosa Fun Pass purchased", "transportationMode": "train", "pickupLocation": "VivoCity", "dropoffLocation": "Sentosa"},
    {"title": "Universal Studios Singapore", "startTime": "10:00", "endTime": "17:00", "notes": "Express Pass recommended\nPriority rides: Transformers, Battlestar Galactica"},
    {"title": "Lunch at USS (Malaysian Food Street)", "startTime": "13:00", "endTime": "14:00", "notes": "Inside Universal Studios"},
    {"title": "S.E.A Aquarium Visit", "startTime": "17:30", "endTime": "19:00", "notes": "One of world's largest aquariums\n45,000 marine animals"},
    {"title": "Wings of Time Show", "startTime": "19:40", "endTime": "20:15", "notes": "Outdoor night show at Siloso Beach\nBook tickets online"},
    {"title": "Late Dinner at Sentosa Boardwalk", "startTime": "20:30", "endTime": "22:00", "notes": "Various restaurants along the boardwalk"},
  ],
  // Day 3
  [
    {"title": "Breakfast at Ya Kun Kaya Toast", "startTime": "08:30", "endTime": "09:30", "notes": "Traditional Singaporean breakfast\nSoft-boiled eggs & kaya toast"},
    {"title": "Gardens by the Bay", "startTime": "10:00", "endTime": "13:00", "notes": "Cloud Forest + Flower Dome combo ticket\nSupertree Observatory optional"},
    {"title": "Lunch at Satay by the Bay", "startTime": "13:30", "endTime": "14:30", "notes": "Hawker center next to Gardens"},
    {"title": "Chinatown Walking Tour", "startTime": "15:30", "endTime": "17:30", "notes": "Buddha Tooth Relic Temple\nChinatown Street Market\nTraditional shops"},
    {"title": "Tea Break at TWG Tea Salon", "startTime": "17:45", "endTime": "18:30", "notes": "Luxury tea experience at ION Orchard"},
    {"title": "Dinner at Jumbo Seafood", "startTime": "19:30", "endTime": "21:30", "notes": "Famous chili crab & black pepper crab\nReservation confirmed for 4 pax"},
    {"title": "Marina Bay Sands SkyPark", "startTime": "22:00", "endTime": "23:00", "notes": "Observation deck with city views\nNight photography session"},
  ],
  // Day 4
  [
    {"title": "Brunch at PS.Cafe", "startTime": "10:30", "endTime": "12:00", "notes": "Instagram-worthy cafe\nTruffle fries & Big Breakfast"},
    {"title": "Shopping at Orchard Road", "startTime": "12:30", "endTime": "17:00", "notes": "ION Orchard, Ngee Ann City, Paragon\nTax refund available for tourists"},
    {"title": "Coffee Break at % Arabica", "startTime": "15:30", "endTime": "16:00", "notes": "Japanese specialty coffee"},
    {"title": "Haji Lane & Arab Street", "startTime": "17:30", "endTime": "19:00", "notes": "Colorful street art\nBoutique shopping\nSultan Mosque"},
    {"title": "Dinner at Zam Zam Restaurant", "startTime": "19:30", "endTime": "20:30", "notes": "Famous murtabak since 1908"},
    {"title": "Clarke Quay Riverside Walk", "startTime": "21:00", "endTime": "22:00", "notes": "Scenic riverside with colorful buildings"},
    {"title": "Drinks at Ce La Vi Rooftop Bar", "startTime": "22:30", "endTime": "00:30", "notes": "Rooftop bar with panoramic views\nDress code: Smart casual"},
  ],
  // Day 5
  [
    {"title": "Final Breakfast at Toast Box", "startTime": "08:00", "endTime": "09:00", "notes": "Local chain for traditional breakfast"},
    {"title": "Hotel Check-out", "startTime": "11:00", "endTime": "11:30", "notes": "Late check-out arranged\nLuggage storage available"},
    {"title": "Last Minute Shopping at Jewel Changi", "startTime": "12:00", "endTime": "14:00", "notes": "Rain Vortex waterfall\nDuty-free shopping\nSouvenirs"},
    {"title": "Lunch at Jewel Changi", "startTime": "14:00", "endTime": "15:00", "notes": "Various options at Canopy Park"},
    {"title": "Airport Check-in", "startTime": "15:30", "endTime": "16:30", "notes": "Cebu Pacific 5J808\nTerminal 1"},
    {"title": "Flight SIN → MNL", "startTime": "18:30", "endTime": "22:15", "notes": "Cebu Pacific 5J808\nBring pasalubong!", "transportationMode": "flight", "pickupLocation": "Changi Airport T1", "dropoffLocation": "NAIA Terminal 3"},
  ],
];

export const BUDGETS: BudgetSeed[] = [
  {"activity": [0, 0], "category": "transport", "amount": 32000, "description": "Round-trip flights MNL-SIN for 4 pax", "isBooked": true},
  {"category": "transport", "amount": 8000, "description": "Local transport (MRT, Grab, Sentosa)", "isBooked": false},
  {"activity": [0, 2], "category": "accommodation", "amount": 60000, "description": "Marina Bay Sands (4 nights, 2 rooms)", "isBooked": true},
  {"activity": [1, 2], "category": "activities", "amount": 16000, "description": "Universal Studios tickets + Express Pass", "isBooked": true},
  {"activity": [2, 1], "category": "activities", "amount": 5000, "description": "Gardens by the Bay combo tickets", "isBooked": true},
  {"activity": [1, 4], "category": "activities", "amount": 6000, "description": "S.E.A Aquarium entrance", "isBooked": true},
  {"category": "food", "amount": 25000, "description": "Meals & dining for 5 days", "isBooked": false},
  {"category": "shopping", "amount": 30000, "description": "Shopping & souvenirs allowance", "isBooked": false},
];

export const EXPENSES: ExpenseSeed[] = [
  {"activity": [0, 0], "paidBy": 2, "amount": 31200, "description": "Cebu Pacific Round-trip Tickets (4 pax)", "when": {"daysAgo": 15}, "category": "transport", "paymentMethod": "bank", "splitWith": "everyone"},
  {"activity": [0, 2], "paidBy": "self", "amount": 58500, "description": "Marina Bay Sands Hotel (4 nights, 2 rooms)", "when": {"daysAgo": 20}, "category": "accommodation", "paymentMethod": "bank", "splitWith": "everyone", "bankDetails": {"bankName": "BDO", "accountNumber": "1234567890"}},
  {"activity": [0, 1], "paidBy": 1, "amount": 1850, "description": "Grab from Changi to Marina Bay", "when": {"tripDay": 0}, "category": "transport", "paymentMethod": "gcash", "splitWith": "everyone"},
  {"activity": [0, 3], "paidBy": 0, "amount": 2400, "description": "Lunch at Lau Pa Sat Hawker Center", "when": {"tripDay": 0}, "category": "food", "paymentMethod": "cash", "splitWith": "everyone"},
  {"activity": [0, 6], "paidBy": "self", "amount": 3200, "description": "Maxwell Food Centre - Chicken Rice & Char Kway Teow", "when": {"tripDay": 0}, "category": "food", "paymentMethod": "cash", "splitWith": "everyone"},
  {"activity": [1, 2], "paidBy": 1, "amount": 15800, "description": "USS Tickets + Express Pass (4 pax)", "when": {"tripDay": 1}, "category": "activities", "paymentMethod": "bank", "splitWith": "everyone"},
  {"activity": [1, 1], "paidBy": 2, "amount": 680, "description": "Sentosa Express & Island Admission", "when": {"tripDay": 1}, "category": "transport", "paymentMethod": "cash", "splitWith": "everyone"},
  {"activity": [1, 3], "paidBy": 0, "amount": 4500, "description": "Lunch at Malaysian Food Street (USS)", "when": {"tripDay": 1}, "category": "food", "paymentMethod": "cash", "splitWith": "everyone"},
  {"activity": [1, 4], "paidBy": "self", "amount": 5600, "description": "S.E.A Aquarium Tickets (4 pax)", "when": {"tripDay": 1}, "category": "activities", "paymentMethod": "maya", "splitWith": "everyone"},
  {"activity": [1, 5], "paidBy": 1, "amount": 3200, "description": "Wings of Time Night Show (4 pax)", "when": {"tripDay": 1}, "category": "activities", "paymentMethod": "bank", "splitWith": "everyone"},
  {"activity": [1, 6], "paidBy": 2, "amount": 5800, "description": "Dinner at Sentosa Boardwalk Restaurant", "when": {"tripDay": 1}, "category": "food", "paymentMethod": "cash", "splitWith": "everyone"},
  {"activity": [2, 0], "paidBy": 0, "amount": 1600, "description": "Ya Kun Kaya Toast Breakfast", "when": {"tripDay": 2}, "category": "food", "paymentMethod": "cash", "splitWith": "everyone"},
  {"activity": [2, 1], "paidBy": "self", "amount": 4800, "description": "Gardens by the Bay - Cloud Forest & Flower Dome", "when": {"tripDay": 2}, "category": "activities", "paymentMethod": "maya", "splitWith": "everyone"},
  {"activity": [2, 2], "paidBy": 1, "amount": 2800, "description": "Satay by the Bay - Lunch", "when": {"tripDay": 2}, "category": "food", "paymentMethod": "cash", "splitWith": "everyone"},
  {"activity": [2, 4], "paidBy": 0, "amount": 2200, "description": "TWG Tea Salon - Afternoon Tea", "when": {"tripDay": 2}, "category": "food", "paymentMethod": "cash", "splitWith": [0, 1]},
  {"activity": [2, 5], "paidBy": "self", "amount": 22500, "description": "Jumbo Seafood - Chili Crab, Black Pepper Crab, Mantou", "when": {"tripDay": 2}, "category": "food", "paymentMethod": "bank", "splitWith": "everyone", "bankDetails": {"bankName": "BPI", "accountNumber": "9876543210"}},
  {"activity": [2, 6], "paidBy": 2, "amount": 3600, "description": "Marina Bay Sands SkyPark Tickets", "when": {"tripDay": 2}, "category": "activities", "paymentMethod": "maya", "splitWith": "everyone"},
  {"activity": [3, 0], "paidBy": 1, "amount": 5200, "description": "PS.Cafe Brunch", "when": {"tripDay": 3}, "category": "food", "paymentMethod": "gcash", "splitWith": "everyone"},
  {"activity": [3, 1], "paidBy": "self", "amount": 12500, "description": "Shopping at ION Orchard - Clothing & Accessories", "when": {"tripDay": 3}, "category": "shopping", "paymentMethod": "bank", "splitWith": ["self"]},
  {"activity": [3, 1], "paidBy": 1, "amount": 8900, "description": "Shopping at Ngee Ann City - Cosmetics", "when": {"tripDay": 3}, "category": "shopping", "paymentMethod": "bank", "splitWith": [1]},
  {"activity": [3, 2], "paidBy": 0, "amount": 950, "description": "% Arabica Coffee", "when": {"tripDay": 3}, "category": "food", "paymentMethod": "cash", "splitWith": [0, 2]},
  {"activity": [3, 4], "paidBy": 2, "amount": 3400, "description": "Zam Zam Restaurant - Murtabak & Biryani", "when": {"tripDay": 3}, "category": "food", "paymentMethod": "cash", "splitWith": "everyone"},
  {"activity": [3, 6], "paidBy": "self", "amount": 8600, "description": "Ce La Vi Rooftop Bar - Cocktails & Snacks", "when": {"tripDay": 3}, "category": "food", "paymentMethod": "bank", "splitWith": "everyone"},
  {"activity": [4, 0], "paidBy": 0, "amount": 1500, "description": "Toast Box Final Breakfast", "when": {"tripDay": 4}, "category": "food", "paymentMethod": "cash", "splitWith": "everyone"},
  {"activity": [4, 2], "paidBy": 1, "amount": 4200, "description": "Souvenirs & Duty-free Shopping at Jewel", "when": {"tripDay": 4}, "category": "shopping", "paymentMethod": "bank", "splitWith": [1]},
  {"activity": [4, 2], "paidBy": 2, "amount": 3800, "description": "Pasalubong - Bak Kwa & Kaya", "when": {"tripDay": 4}, "category": "shopping", "paymentMethod": "cash", "splitWith": [2]},
  {"activity": [4, 3], "paidBy": 1, "amount": 4100, "description": "Final Lunch at Jewel Changi", "when": {"tripDay": 4}, "category": "food", "paymentMethod": "bank", "splitWith": "everyone"},
  {"activity": [4, 4], "paidBy": "self", "amount": 1650, "description": "Grab to Changi Airport", "when": {"tripDay": 4}, "category": "transport", "paymentMethod": "gcash", "splitWith": "everyone"},
  {"paidBy": 2, "amount": 2000, "description": "EZ-Link MRT Cards Top-up (4 cards)", "when": {"tripDay": 1}, "category": "transport", "paymentMethod": "cash", "splitWith": "everyone"},
  {"paidBy": 0, "amount": 1200, "description": "Bubble Tea at HeyTea Orchard", "when": {"tripDay": 3}, "category": "food", "paymentMethod": "cash", "splitWith": [0, 1]},
  {"paidBy": "self", "amount": 850, "description": "Watson's Pharmacy - Motion Sickness Medicine", "when": {"tripDay": 2}, "category": "shopping", "paymentMethod": "cash", "splitWith": ["self"]},
];
