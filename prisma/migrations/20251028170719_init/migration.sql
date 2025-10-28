-- CreateTable
CREATE TABLE "Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FaceImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "angle" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "embedding" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FaceImage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_schoolEmail_key" ON "Student"("schoolEmail");
