-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('once', 'daily', 'weekly', 'monthly', 'custom');

-- AlterEnum
ALTER TYPE "Category" ADD VALUE 'call';

-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "frequency" "Frequency" NOT NULL DEFAULT 'once',
ADD COLUMN     "frequency_days" JSONB,
ADD COLUMN     "next_occurrence" TIMESTAMP(3),
ADD COLUMN     "notify_before" INTEGER;
