-- CreateSchema
-- A pre-provisioned schema lets a limited migration role avoid database CREATE.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'comit') THEN
    CREATE SCHEMA "comit";
  END IF;
END $$;

-- CreateTable
CREATE TABLE "comit"."users" (
    "id" UUID NOT NULL,
    "authId" UUID,
    "name" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "birthDate" DATE NOT NULL,
    "academicStatus" TEXT NOT NULL,
    "academicOther" TEXT,
    "campus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comit"."semesters" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "newStartsAt" TIMESTAMP(3) NOT NULL,
    "newEndsAt" TIMESTAMP(3) NOT NULL,
    "returningStartsAt" TIMESTAMP(3) NOT NULL,
    "returningEndsAt" TIMESTAMP(3) NOT NULL,
    "newFee" INTEGER NOT NULL,
    "returningFee" INTEGER NOT NULL,
    "bank" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "consentText" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "semesters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comit"."memberships" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "semesterId" UUID NOT NULL,
    "applicantAuthId" UUID,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "linkConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "profile" JSONB NOT NULL,
    "fee" INTEGER NOT NULL,
    "consentText" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3),
    "reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comit"."audit_logs" (
    "id" UUID NOT NULL,
    "actorId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_authId_key" ON "comit"."users"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "users_studentId_key" ON "comit"."users"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "semesters_name_key" ON "comit"."semesters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_userId_semesterId_key" ON "comit"."memberships"("userId", "semesterId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_applicantAuthId_semesterId_key" ON "comit"."memberships"("applicantAuthId", "semesterId");

-- CreateIndex
CREATE INDEX "audit_logs_entityId_createdAt_idx" ON "comit"."audit_logs"("entityId", "createdAt");

-- AddForeignKey
ALTER TABLE "comit"."memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "comit"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comit"."memberships" ADD CONSTRAINT "memberships_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "comit"."semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Exactly one current semester, including concurrent activation requests.
CREATE UNIQUE INDEX "semesters_one_current" ON "comit"."semesters" (("isCurrent")) WHERE "isCurrent" = true;
-- API-only data access; no browser-facing grants or Supabase Auth changes.
REVOKE ALL ON SCHEMA "comit" FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA "comit" FROM PUBLIC;
