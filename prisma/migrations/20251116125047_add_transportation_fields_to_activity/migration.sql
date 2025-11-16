-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "dropoffLocation" TEXT,
ADD COLUMN     "pickupLocation" TEXT,
ADD COLUMN     "pickupTime" TEXT,
ADD COLUMN     "transportationFee" DECIMAL(10,2),
ADD COLUMN     "transportationMode" TEXT;
