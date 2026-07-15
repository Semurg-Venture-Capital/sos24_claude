-- AlterTable
ALTER TABLE "whoop_snapshots" ADD COLUMN     "dayKilojoule" DOUBLE PRECISION,
ADD COLUMN     "sleepConsistency" INTEGER,
ADD COLUMN     "sleepEfficiency" INTEGER,
ADD COLUMN     "sleepNeedMin" INTEGER;
