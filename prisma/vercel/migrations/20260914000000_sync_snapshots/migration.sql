CREATE TABLE "SyncState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastSuccessfulAt" TIMESTAMP(3),
    "lastError" TEXT,
    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SyncSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SyncSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SyncState_userId_key" ON "SyncState"("userId");
CREATE UNIQUE INDEX "SyncSnapshot_userId_kind_key" ON "SyncSnapshot"("userId", "kind");
CREATE INDEX "SyncSnapshot_userId_syncedAt_idx" ON "SyncSnapshot"("userId", "syncedAt");
ALTER TABLE "SyncState" ADD CONSTRAINT "SyncState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SyncSnapshot" ADD CONSTRAINT "SyncSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
