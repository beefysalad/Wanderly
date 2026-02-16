import prisma from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { generateUniqueGroupCode } from "@/lib/utils/groupCode";
import { TripStatus, PaymentMethod } from "@prisma/client";

/**
 * Seeds comprehensive test data for a newly registered user
 * Includes a realistic 5-day Singapore trip with detailed activities, expenses, and budgets.
 */
export async function seedTestData(userId: string) {
  try {
    logger.info("🌱 Seeding ultra-enhanced test data for new user", { userId });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      logger.warn("User not found, skipping seed", { userId });
      return;
    }

    // Check if user has already been seeded to prevent duplicates
    if (user.hasSeededTestData) {
      logger.info("User already has seeded data, skipping", { userId });
      return;
    }

    // Mark user as seeded immediately to prevent race conditions
    await prisma.user.update({
      where: { id: userId },
      data: { hasSeededTestData: true },
    });

    // Variables to track for logging
    let groupId = "";
    let tripId = "";
    let allMemberEmails: string[] = [];
    let totalActivities = 0;

    // Use a transaction to ensure all-or-nothing seeding
    await prisma.$transaction(async (tx) => {
      // 1. Get or Create Dummy Users for realistic group dynamics
      // IMPORTANT: These dummy users are SHARED across all test data seeds.
      // This means:
      // - First signup: Creates Eleven, Mike, Steve
      // - Second signup: Reuses the same Eleven, Mike, Steve (no new users created)
      // - Each real user still gets their own isolated group/trip
      // - Dummy users appear in multiple groups but data remains separate
      // See DUMMY_USERS_EXPLAINED.md for more details
      const dummyUsersData = [
        {
          name: "Eleven",
          email: "eleven.dummy@example.com",
          firebaseId: "dummy_eleven_seed",
          imageUrl:
            "https://res.cloudinary.com/ddmrbjevx/image/upload/v1771241672/eleven_q1wfzp.jpg",
        },
        {
          name: "Mike",
          email: "mike.dummy@example.com",
          imageUrl:
            "https://res.cloudinary.com/ddmrbjevx/image/upload/v1771241672/Mike_Stranger_Things_Image_ljf6ll.jpg",
          firebaseId: "dummy_mike_seed",
        },
        {
          name: "Steve",
          email: "steve.dummy@example.com",
          firebaseId: "dummy_steve_seed",
          imageUrl:
            "https://res.cloudinary.com/ddmrbjevx/image/upload/v1771241672/Steve_Stranger_Things_Image_mnn35x.jpg",
        },
      ];

      const dummyUsers = await Promise.all(
        dummyUsersData.map(async (d) => {
          // Check if user already exists
          const existing = await tx.user.findUnique({
            where: { email: d.email, imageUrl: d.imageUrl },
          });

          // Return existing user or create new one
          if (existing) {
            logger.info(`♻️  Reusing existing dummy user: ${d.name}`, {
              email: d.email,
            });
            return existing;
          }

          logger.info(`✨ Creating new dummy user: ${d.name}`, {
            email: d.email,
          });
          return tx.user.create({ data: d });
        }),
      );

      const allMemberUserIds = [userId, ...dummyUsers.map((u) => u.id)];
      allMemberEmails = [user.email, ...dummyUsers.map((u) => u.email)];

      // 2. Create Test Group
      const groupCode = await generateUniqueGroupCode();
      const group = await tx.group.create({
        data: {
          name: "Singapore Adventure 2024",
          code: groupCode,
          colorScheme: "orange",
          emoji: "🇸🇬",
          createdById: userId,
          members: {
            create: allMemberUserIds.map((id) => ({
              userId: id,
              role: id === userId ? "admin" : "member",
            })),
          },
        },
      });

      // 3. Create Test Trip (5 days)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 30); // 1 month from now
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 4); // 5 days total

      const trip = await tx.trip.create({
        data: {
          groupId: group.id,
          createdById: userId,
          name: "Marina Bay & Island Hopping",
          startDate,
          endDate,
          location: "Singapore",
          status: TripStatus.planning,
        },
      });

      groupId = group.id;
      tripId = trip.id;

      // Helper function to create date for each day
      const getDay = (dayOffset: number) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayOffset);
        return date;
      };

      // ========== DAY 1: ARRIVAL & CITY ORIENTATION ==========
      const day1Activities = await Promise.all([
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Flight MNL → SIN",
            date: getDay(0),
            startTime: "06:30",
            endTime: "10:15",
            notes: "Cebu Pacific 5J807 - Terminal 3\nCheck-in 2 hours before",
            transportationMode: "flight",
            pickupLocation: "NAIA Terminal 3",
            dropoffLocation: "Changi Airport Terminal 1",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Airport Transfer to Hotel",
            date: getDay(0),
            startTime: "10:30",
            endTime: "11:30",
            notes: "Grab from Changi to Marina Bay area",
            transportationMode: "car",
            pickupLocation: "Changi Airport T1",
            dropoffLocation: "Marina Bay Sands",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Check-in at Marina Bay Sands",
            date: getDay(0),
            startTime: "14:00",
            endTime: "15:00",
            notes: "Booking confirmation: #MBS-8392\nEarly check-in requested",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Lunch at Lau Pa Sat",
            date: getDay(0),
            startTime: "12:30",
            endTime: "14:00",
            notes: "Famous hawker center in CBD\nTry satay street!",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Explore Merlion Park",
            date: getDay(0),
            startTime: "16:00",
            endTime: "17:30",
            notes: "Iconic photo spot with Marina Bay backdrop",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Marina Bay Light Show",
            date: getDay(0),
            startTime: "20:00",
            endTime: "20:30",
            notes: "Spectra - Free water & light show at Event Plaza",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Dinner at Maxwell Food Centre",
            date: getDay(0),
            startTime: "18:30",
            endTime: "20:00",
            notes: "Must try: Tian Tian Hainanese Chicken Rice",
          },
        }),
      ]);

      // ========== DAY 2: SENTOSA ISLAND ==========
      const day2Activities = await Promise.all([
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Breakfast at Hotel",
            date: getDay(1),
            startTime: "08:00",
            endTime: "09:00",
            notes: "Included in hotel booking",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Sentosa Express to Island",
            date: getDay(1),
            startTime: "09:30",
            endTime: "10:00",
            notes: "From VivoCity Station\nSentosa Fun Pass purchased",
            transportationMode: "train",
            pickupLocation: "VivoCity",
            dropoffLocation: "Sentosa",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Universal Studios Singapore",
            date: getDay(1),
            startTime: "10:00",
            endTime: "17:00",
            notes:
              "Express Pass recommended\nPriority rides: Transformers, Battlestar Galactica",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Lunch at USS (Malaysian Food Street)",
            date: getDay(1),
            startTime: "13:00",
            endTime: "14:00",
            notes: "Inside Universal Studios",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "S.E.A Aquarium Visit",
            date: getDay(1),
            startTime: "17:30",
            endTime: "19:00",
            notes: "One of world's largest aquariums\n45,000 marine animals",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Wings of Time Show",
            date: getDay(1),
            startTime: "19:40",
            endTime: "20:15",
            notes: "Outdoor night show at Siloso Beach\nBook tickets online",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Late Dinner at Sentosa Boardwalk",
            date: getDay(1),
            startTime: "20:30",
            endTime: "22:00",
            notes: "Various restaurants along the boardwalk",
          },
        }),
      ]);

      // ========== DAY 3: GARDENS & CULTURE ==========
      const day3Activities = await Promise.all([
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Breakfast at Ya Kun Kaya Toast",
            date: getDay(2),
            startTime: "08:30",
            endTime: "09:30",
            notes:
              "Traditional Singaporean breakfast\nSoft-boiled eggs & kaya toast",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Gardens by the Bay",
            date: getDay(2),
            startTime: "10:00",
            endTime: "13:00",
            notes:
              "Cloud Forest + Flower Dome combo ticket\nSupertree Observatory optional",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Lunch at Satay by the Bay",
            date: getDay(2),
            startTime: "13:30",
            endTime: "14:30",
            notes: "Hawker center next to Gardens",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Chinatown Walking Tour",
            date: getDay(2),
            startTime: "15:30",
            endTime: "17:30",
            notes:
              "Buddha Tooth Relic Temple\nChinatown Street Market\nTraditional shops",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Tea Break at TWG Tea Salon",
            date: getDay(2),
            startTime: "17:45",
            endTime: "18:30",
            notes: "Luxury tea experience at ION Orchard",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Dinner at Jumbo Seafood",
            date: getDay(2),
            startTime: "19:30",
            endTime: "21:30",
            notes:
              "Famous chili crab & black pepper crab\nReservation confirmed for 4 pax",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Marina Bay Sands SkyPark",
            date: getDay(2),
            startTime: "22:00",
            endTime: "23:00",
            notes:
              "Observation deck with city views\nNight photography session",
          },
        }),
      ]);

      // ========== DAY 4: SHOPPING & NIGHTLIFE ==========
      const day4Activities = await Promise.all([
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Brunch at PS.Cafe",
            date: getDay(3),
            startTime: "10:30",
            endTime: "12:00",
            notes: "Instagram-worthy cafe\nTruffle fries & Big Breakfast",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Shopping at Orchard Road",
            date: getDay(3),
            startTime: "12:30",
            endTime: "17:00",
            notes:
              "ION Orchard, Ngee Ann City, Paragon\nTax refund available for tourists",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Coffee Break at % Arabica",
            date: getDay(3),
            startTime: "15:30",
            endTime: "16:00",
            notes: "Japanese specialty coffee",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Haji Lane & Arab Street",
            date: getDay(3),
            startTime: "17:30",
            endTime: "19:00",
            notes: "Colorful street art\nBoutique shopping\nSultan Mosque",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Dinner at Zam Zam Restaurant",
            date: getDay(3),
            startTime: "19:30",
            endTime: "20:30",
            notes: "Famous murtabak since 1908",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Clarke Quay Riverside Walk",
            date: getDay(3),
            startTime: "21:00",
            endTime: "22:00",
            notes: "Scenic riverside with colorful buildings",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Drinks at Ce La Vi Rooftop Bar",
            date: getDay(3),
            startTime: "22:30",
            endTime: "00:30",
            notes: "Rooftop bar with panoramic views\nDress code: Smart casual",
          },
        }),
      ]);

      // ========== DAY 5: LAST DAY & DEPARTURE ==========
      const day5Activities = await Promise.all([
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Final Breakfast at Toast Box",
            date: getDay(4),
            startTime: "08:00",
            endTime: "09:00",
            notes: "Local chain for traditional breakfast",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Hotel Check-out",
            date: getDay(4),
            startTime: "11:00",
            endTime: "11:30",
            notes: "Late check-out arranged\nLuggage storage available",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Last Minute Shopping at Jewel Changi",
            date: getDay(4),
            startTime: "12:00",
            endTime: "14:00",
            notes: "Rain Vortex waterfall\nDuty-free shopping\nSouvenirs",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Lunch at Jewel Changi",
            date: getDay(4),
            startTime: "14:00",
            endTime: "15:00",
            notes: "Various options at Canopy Park",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Airport Check-in",
            date: getDay(4),
            startTime: "15:30",
            endTime: "16:30",
            notes: "Cebu Pacific 5J808\nTerminal 1",
          },
        }),
        tx.activity.create({
          data: {
            tripId: trip.id,
            title: "Flight SIN → MNL",
            date: getDay(4),
            startTime: "18:30",
            endTime: "22:15",
            notes: "Cebu Pacific 5J808\nBring pasalubong!",
            transportationMode: "flight",
            pickupLocation: "Changi Airport T1",
            dropoffLocation: "NAIA Terminal 3",
          },
        }),
      ]);

      // Collect all activities for easier reference
      const allActivities = [
        ...day1Activities,
        ...day2Activities,
        ...day3Activities,
        ...day4Activities,
        ...day5Activities,
      ];

      totalActivities = allActivities.length;

      // ========== BUDGETS ==========
      await tx.budget.createMany({
        data: [
          // Transportation
          {
            tripId: trip.id,
            activityId: day1Activities[0].id, // Flight
            category: "transport",
            amount: 32000,
            description: "Round-trip flights MNL-SIN for 4 pax",
            isBooked: true,
          },
          {
            tripId: trip.id,
            category: "transport",
            amount: 8000,
            description: "Local transport (MRT, Grab, Sentosa)",
            isBooked: false,
          },
          // Accommodation
          {
            tripId: trip.id,
            activityId: day1Activities[2].id, // Hotel
            category: "accommodation",
            amount: 60000,
            description: "Marina Bay Sands (4 nights, 2 rooms)",
            isBooked: true,
          },
          // Activities
          {
            tripId: trip.id,
            activityId: day2Activities[2].id, // USS
            category: "activities",
            amount: 16000,
            description: "Universal Studios tickets + Express Pass",
            isBooked: true,
          },
          {
            tripId: trip.id,
            activityId: day3Activities[1].id, // Gardens
            category: "activities",
            amount: 5000,
            description: "Gardens by the Bay combo tickets",
            isBooked: true,
          },
          {
            tripId: trip.id,
            activityId: day2Activities[4].id, // Aquarium
            category: "activities",
            amount: 6000,
            description: "S.E.A Aquarium entrance",
            isBooked: true,
          },
          // Food
          {
            tripId: trip.id,
            category: "food",
            amount: 25000,
            description: "Meals & dining for 5 days",
            isBooked: false,
          },
          // Shopping
          {
            tripId: trip.id,
            category: "shopping",
            amount: 30000,
            description: "Shopping & souvenirs allowance",
            isBooked: false,
          },
        ],
      });

      // ========== EXPENSES ==========
      // Flight tickets (Paid by Steve, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day1Activities[0].id,
          paidById: dummyUsers[2].id, // Steve
          createdById: userId,
          amount: 31200,
          description: "Cebu Pacific Round-trip Tickets (4 pax)",
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Booked 15 days ago
          category: "transport",
          paymentMethod: PaymentMethod.bank,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Hotel accommodation (Paid by main user, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day1Activities[2].id,
          paidById: userId,
          createdById: userId,
          amount: 58500,
          description: "Marina Bay Sands Hotel (4 nights, 2 rooms)",
          date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // Booked 20 days ago
          category: "accommodation",
          paymentMethod: PaymentMethod.bank,
          bankName: "BDO",
          accountNumber: "1234567890",
          accountName: user.name,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Airport transfer Day 1 (Paid by Mike, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day1Activities[1].id,
          paidById: dummyUsers[1].id, // Mike
          createdById: userId,
          amount: 1850,
          description: "Grab from Changi to Marina Bay",
          date: getDay(0),
          category: "transport",
          paymentMethod: PaymentMethod.gcash,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Lunch at Lau Pa Sat (Paid by Eleven, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day1Activities[3].id,
          paidById: dummyUsers[0].id, // Eleven
          createdById: userId,
          amount: 2400,
          description: "Lunch at Lau Pa Sat Hawker Center",
          date: getDay(0),
          category: "food",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Dinner Day 1 (Paid by main user, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day1Activities[6].id,
          paidById: userId,
          createdById: userId,
          amount: 3200,
          description: "Maxwell Food Centre - Chicken Rice & Char Kway Teow",
          date: getDay(0),
          category: "food",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Universal Studios tickets (Paid by Mike, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day2Activities[2].id,
          paidById: dummyUsers[1].id, // Mike
          createdById: userId,
          amount: 15800,
          description: "USS Tickets + Express Pass (4 pax)",
          date: getDay(1),
          category: "activities",
          paymentMethod: PaymentMethod.bank,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Sentosa transport (Paid by Steve, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day2Activities[1].id,
          paidById: dummyUsers[2].id, // Steve
          createdById: userId,
          amount: 680,
          description: "Sentosa Express & Island Admission",
          date: getDay(1),
          category: "transport",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // USS Lunch (Paid by Eleven, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day2Activities[3].id,
          paidById: dummyUsers[0].id, // Eleven
          createdById: userId,
          amount: 4500,
          description: "Lunch at Malaysian Food Street (USS)",
          date: getDay(1),
          category: "food",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // S.E.A Aquarium (Paid by main user, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day2Activities[4].id,
          paidById: userId,
          createdById: userId,
          amount: 5600,
          description: "S.E.A Aquarium Tickets (4 pax)",
          date: getDay(1),
          category: "activities",
          paymentMethod: PaymentMethod.maya,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Wings of Time show (Paid by Mike, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day2Activities[5].id,
          paidById: dummyUsers[1].id, // Mike
          createdById: userId,
          amount: 3200,
          description: "Wings of Time Night Show (4 pax)",
          date: getDay(1),
          category: "activities",
          paymentMethod: PaymentMethod.bank,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Late dinner Day 2 (Paid by Steve, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day2Activities[6].id,
          paidById: dummyUsers[2].id, // Steve
          createdById: userId,
          amount: 5800,
          description: "Dinner at Sentosa Boardwalk Restaurant",
          date: getDay(1),
          category: "food",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Breakfast Day 3 (Paid by Eleven, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day3Activities[0].id,
          paidById: dummyUsers[0].id, // Eleven
          createdById: userId,
          amount: 1600,
          description: "Ya Kun Kaya Toast Breakfast",
          date: getDay(2),
          category: "food",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Gardens by the Bay (Paid by main user, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day3Activities[1].id,
          paidById: userId,
          createdById: userId,
          amount: 4800,
          description: "Gardens by the Bay - Cloud Forest & Flower Dome",
          date: getDay(2),
          category: "activities",
          paymentMethod: PaymentMethod.maya,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Lunch Day 3 (Paid by Mike, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day3Activities[2].id,
          paidById: dummyUsers[1].id, // Mike
          createdById: userId,
          amount: 2800,
          description: "Satay by the Bay - Lunch",
          date: getDay(2),
          category: "food",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Tea at TWG (Paid by Eleven and Mike only - just the two of them)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day3Activities[4].id,
          paidById: dummyUsers[0].id, // Eleven
          createdById: userId,
          amount: 2200,
          description: "TWG Tea Salon - Afternoon Tea",
          date: getDay(2),
          category: "food",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: [
              { userId: dummyUsers[0].id }, // Eleven
              { userId: dummyUsers[1].id }, // Mike
            ],
          },
        },
      });

      // Jumbo Seafood dinner (Paid by main user, split among all) - OVER BUDGET!
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day3Activities[5].id,
          paidById: userId,
          createdById: userId,
          amount: 22500,
          description: "Jumbo Seafood - Chili Crab, Black Pepper Crab, Mantou",
          date: getDay(2),
          category: "food",
          paymentMethod: PaymentMethod.bank,
          bankName: "BPI",
          accountNumber: "9876543210",
          accountName: user.name,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // SkyPark observation (Paid by Steve, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day3Activities[6].id,
          paidById: dummyUsers[2].id, // Steve
          createdById: userId,
          amount: 3600,
          description: "Marina Bay Sands SkyPark Tickets",
          date: getDay(2),
          category: "activities",
          paymentMethod: PaymentMethod.maya,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Brunch Day 4 (Paid by Mike, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day4Activities[0].id,
          paidById: dummyUsers[1].id, // Mike
          createdById: userId,
          amount: 5200,
          description: "PS.Cafe Brunch",
          date: getDay(3),
          category: "food",
          paymentMethod: PaymentMethod.gcash,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Shopping expenses - individual purchases (Paid by each person for themselves)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day4Activities[1].id,
          paidById: userId,
          createdById: userId,
          amount: 12500,
          description: "Shopping at ION Orchard - Clothing & Accessories",
          date: getDay(3),
          category: "shopping",
          paymentMethod: PaymentMethod.bank,
          splits: {
            create: [{ userId: userId }],
          },
        },
      });

      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day4Activities[1].id,
          paidById: dummyUsers[1].id, // Mike shopping
          createdById: userId,
          amount: 8900,
          description: "Shopping at Ngee Ann City - Cosmetics",
          date: getDay(3),
          category: "shopping",
          paymentMethod: PaymentMethod.bank,
          splits: {
            create: [{ userId: dummyUsers[1].id }],
          },
        },
      });

      // Coffee break (Paid by Eleven, split between Eleven and Steve)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day4Activities[2].id,
          paidById: dummyUsers[0].id, // Eleven
          createdById: userId,
          amount: 950,
          description: "% Arabica Coffee",
          date: getDay(3),
          category: "food",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: [
              { userId: dummyUsers[0].id }, // Eleven
              { userId: dummyUsers[2].id }, // Steve
            ],
          },
        },
      });

      // Dinner Day 4 (Paid by Steve, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day4Activities[4].id,
          paidById: dummyUsers[2].id, // Steve
          createdById: userId,
          amount: 3400,
          description: "Zam Zam Restaurant - Murtabak & Biryani",
          date: getDay(3),
          category: "food",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Rooftop bar (Paid by main user, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day4Activities[6].id,
          paidById: userId,
          createdById: userId,
          amount: 8600,
          description: "Ce La Vi Rooftop Bar - Cocktails & Snacks",
          date: getDay(3),
          category: "food",
          paymentMethod: PaymentMethod.bank,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Breakfast Day 5 (Paid by Eleven, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day5Activities[0].id,
          paidById: dummyUsers[0].id, // Eleven
          createdById: userId,
          amount: 1500,
          description: "Toast Box Final Breakfast",
          date: getDay(4),
          category: "food",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Jewel Changi shopping (Individual purchases)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day5Activities[2].id,
          paidById: dummyUsers[1].id, // Mike
          createdById: userId,
          amount: 4200,
          description: "Souvenirs & Duty-free Shopping at Jewel",
          date: getDay(4),
          category: "shopping",
          paymentMethod: PaymentMethod.bank,
          splits: {
            create: [{ userId: dummyUsers[1].id }],
          },
        },
      });

      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day5Activities[2].id,
          paidById: dummyUsers[2].id, // Steve
          createdById: userId,
          amount: 3800,
          description: "Pasalubong - Bak Kwa & Kaya",
          date: getDay(4),
          category: "shopping",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: [{ userId: dummyUsers[2].id }],
          },
        },
      });

      // Final lunch (Paid by Mike, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day5Activities[3].id,
          paidById: dummyUsers[1].id, // Mike
          createdById: userId,
          amount: 4100,
          description: "Final Lunch at Jewel Changi",
          date: getDay(4),
          category: "food",
          paymentMethod: PaymentMethod.bank,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Airport departure transfer (Paid by main user, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          activityId: day5Activities[4].id,
          paidById: userId,
          createdById: userId,
          amount: 1650,
          description: "Grab to Changi Airport",
          date: getDay(4),
          category: "transport",
          paymentMethod: PaymentMethod.gcash,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Additional miscellaneous expenses
      // MRT Cards (Paid by Steve, split among all)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          paidById: dummyUsers[2].id, // Steve
          createdById: userId,
          amount: 2000,
          description: "EZ-Link MRT Cards Top-up (4 cards)",
          date: getDay(1),
          category: "transport",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: allMemberUserIds.map((id) => ({ userId: id })),
          },
        },
      });

      // Random snacks/bubble tea (Paid by Eleven, split between Eleven and Mike)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          paidById: dummyUsers[0].id, // Eleven
          createdById: userId,
          amount: 1200,
          description: "Bubble Tea at HeyTea Orchard",
          date: getDay(3),
          category: "food",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: [
              { userId: dummyUsers[0].id }, // Eleven
              { userId: dummyUsers[1].id }, // Mike
            ],
          },
        },
      });

      // Emergency pharmacy (Paid by main user, for themselves)
      await tx.expense.create({
        data: {
          groupId: group.id,
          tripId: trip.id,
          paidById: userId,
          createdById: userId,
          amount: 850,
          description: "Watson's Pharmacy - Motion Sickness Medicine",
          date: getDay(2),
          category: "shopping",
          paymentMethod: PaymentMethod.cash,
          splits: {
            create: [{ userId: userId }],
          },
        },
      });

      // Close transaction
    }); // End of transaction

    logger.info("✅ Ultra-Enhanced test data seeded successfully", {
      userId,
      groupId,
      tripId,
      members: allMemberEmails,
      totalActivities,
      daysOfActivities: 5,
    });
  } catch (error) {
    logger.error("❌ Failed to seed test data", { userId, error });

    // Rollback the seeded flag if seeding failed
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { hasSeededTestData: false },
      });
    } catch (rollbackError) {
      logger.error("Failed to rollback hasSeededTestData flag", {
        userId,
        rollbackError,
      });
    }

    throw error; // Re-throw to let caller handle
  }
}
