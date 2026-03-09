-- Reconcile drift: enforce creator FKs to match migration history.

-- Drop existing foreign keys first so we can alter nullability and re-create with CASCADE.
ALTER TABLE "Group" DROP CONSTRAINT IF EXISTS "Group_createdById_fkey";
ALTER TABLE "Trip" DROP CONSTRAINT IF EXISTS "Trip_createdById_fkey";

-- Guardrail: fail with a clear message if null creator IDs exist.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Group" WHERE "createdById" IS NULL) THEN
    RAISE EXCEPTION 'Cannot enforce Group.createdById NOT NULL because null values exist';
  END IF;

  IF EXISTS (SELECT 1 FROM "Trip" WHERE "createdById" IS NULL) THEN
    RAISE EXCEPTION 'Cannot enforce Trip.createdById NOT NULL because null values exist';
  END IF;
END
$$;

-- Enforce NOT NULL to match Prisma schema + migration history.
ALTER TABLE "Group" ALTER COLUMN "createdById" SET NOT NULL;
ALTER TABLE "Trip" ALTER COLUMN "createdById" SET NOT NULL;

-- Re-create FKs with ON DELETE CASCADE to match expected history.
ALTER TABLE "Group"
  ADD CONSTRAINT "Group_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Trip"
  ADD CONSTRAINT "Trip_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
