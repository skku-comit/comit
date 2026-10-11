-- CreateTable
CREATE TABLE "comit"."studies" (
    "id" UUID NOT NULL,
    "semesterId" UUID NOT NULL,
    "representativeId" UUID,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "resourceUrl" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comit"."study_applications" (
    "id" UUID NOT NULL,
    "studyId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "motivation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "studies_semesterId_status_idx" ON "comit"."studies"("semesterId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "study_applications_studyId_userId_key" ON "comit"."study_applications"("studyId", "userId");

-- AddForeignKey
ALTER TABLE "comit"."studies" ADD CONSTRAINT "studies_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "comit"."semesters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comit"."studies" ADD CONSTRAINT "studies_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "comit"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comit"."study_applications" ADD CONSTRAINT "study_applications_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "comit"."studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comit"."study_applications" ADD CONSTRAINT "study_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "comit"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

