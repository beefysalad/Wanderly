-- CreateTable
CREATE TABLE "Budget" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "activityId" TEXT,
    "category" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "description" TEXT,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
