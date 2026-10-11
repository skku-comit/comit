-- Existing operations imported without account links or historical recruitment dates.
ALTER TABLE "comit"."studies" ADD COLUMN "isLegacy" BOOLEAN NOT NULL DEFAULT false;
