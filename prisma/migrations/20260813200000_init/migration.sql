-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "username" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "workHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "workHoursEnd" TEXT NOT NULL DEFAULT '18:00',
    "afterHoursThreshold" TEXT NOT NULL DEFAULT '20:00',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "plan" TEXT NOT NULL DEFAULT 'solo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "company" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "afterHoursSignal" BOOLEAN NOT NULL DEFAULT true,
    "weekendSignal" BOOLEAN NOT NULL DEFAULT true,
    "churnSignal" BOOLEAN NOT NULL DEFAULT true,
    "meetingsSignal" BOOLEAN NOT NULL DEFAULT true,
    "longWorkSignal" BOOLEAN NOT NULL DEFAULT true,
    "interruptionSignal" BOOLEAN NOT NULL DEFAULT true,
    "privacyActivity" TEXT NOT NULL DEFAULT 'PRIVATE',
    "privacyDevHealth" TEXT NOT NULL DEFAULT 'PRIVATE',
    "privacyFocus" TEXT NOT NULL DEFAULT 'PRIVATE',
    "privacyAiSummaries" TEXT NOT NULL DEFAULT 'PRIVATE',
    "privacyPerformance" TEXT NOT NULL DEFAULT 'PRIVATE',
    "privacyCalendar" TEXT NOT NULL DEFAULT 'PRIVATE',
    "privacyRepositories" TEXT NOT NULL DEFAULT 'PRIVATE',
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifySlack" BOOLEAN NOT NULL DEFAULT false,
    "notifyInApp" BOOLEAN NOT NULL DEFAULT true,
    "rankingWeights" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'disconnected',
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "externalId" TEXT,
    "handle" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationId" TEXT,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "url" TEXT,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "defaultBranch" TEXT,
    "selected" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT,
    "lastActivityAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "repository" TEXT,
    "repositoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "externalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT,
    "provider" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "url" TEXT,
    "authoredAt" TIMESTAMP(3) NOT NULL,
    "additions" INTEGER,
    "deletions" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Commit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PullRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "url" TEXT,
    "authorLogin" TEXT,
    "isAuthor" BOOLEAN NOT NULL DEFAULT false,
    "draft" BOOLEAN NOT NULL DEFAULT false,
    "merged" BOOLEAN NOT NULL DEFAULT false,
    "mergedAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3) NOT NULL,
    "updatedAtSrc" TIMESTAMP(3),
    "reviewState" TEXT,
    "additions" INTEGER,
    "deletions" INTEGER,
    "changedFiles" INTEGER,
    "labels" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PullRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PullRequestReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pullRequestId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PullRequestReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "url" TEXT,
    "isAuthor" BOOLEAN NOT NULL DEFAULT false,
    "isAssigned" BOOLEAN NOT NULL DEFAULT false,
    "labels" JSONB,
    "milestoneDue" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CICDRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "conclusion" TEXT,
    "branch" TEXT,
    "url" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CICDRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "environment" TEXT,
    "status" TEXT NOT NULL,
    "url" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google_calendar',
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'derived',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FocusSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DevHealthSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "why" TEXT NOT NULL,
    "recommendation" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DevHealthSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DismissedInsight" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DismissedInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'generated',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "summaryId" TEXT,
    "token" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "url" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "Integration_userId_idx" ON "Integration"("userId");

-- CreateIndex
CREATE INDEX "Integration_provider_idx" ON "Integration"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_userId_provider_key" ON "Integration"("userId", "provider");

-- CreateIndex
CREATE INDEX "Repository_userId_idx" ON "Repository"("userId");

-- CreateIndex
CREATE INDEX "Repository_provider_idx" ON "Repository"("provider");

-- CreateIndex
CREATE INDEX "Repository_fullName_idx" ON "Repository"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_userId_provider_externalId_key" ON "Repository"("userId", "provider", "externalId");

-- CreateIndex
CREATE INDEX "ActivityEvent_userId_timestamp_idx" ON "ActivityEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "ActivityEvent_userId_type_idx" ON "ActivityEvent"("userId", "type");

-- CreateIndex
CREATE INDEX "ActivityEvent_repositoryId_idx" ON "ActivityEvent"("repositoryId");

-- CreateIndex
CREATE INDEX "ActivityEvent_provider_idx" ON "ActivityEvent"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityEvent_userId_provider_type_externalId_key" ON "ActivityEvent"("userId", "provider", "type", "externalId");

-- CreateIndex
CREATE INDEX "Commit_userId_authoredAt_idx" ON "Commit"("userId", "authoredAt");

-- CreateIndex
CREATE INDEX "Commit_repositoryId_idx" ON "Commit"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Commit_userId_provider_sha_key" ON "Commit"("userId", "provider", "sha");

-- CreateIndex
CREATE INDEX "PullRequest_userId_openedAt_idx" ON "PullRequest"("userId", "openedAt");

-- CreateIndex
CREATE INDEX "PullRequest_userId_state_idx" ON "PullRequest"("userId", "state");

-- CreateIndex
CREATE INDEX "PullRequest_repositoryId_idx" ON "PullRequest"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "PullRequest_userId_provider_externalId_key" ON "PullRequest"("userId", "provider", "externalId");

-- CreateIndex
CREATE INDEX "PullRequestReview_userId_submittedAt_idx" ON "PullRequestReview"("userId", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PullRequestReview_userId_provider_externalId_key" ON "PullRequestReview"("userId", "provider", "externalId");

-- CreateIndex
CREATE INDEX "Issue_userId_openedAt_idx" ON "Issue"("userId", "openedAt");

-- CreateIndex
CREATE INDEX "Issue_userId_state_idx" ON "Issue"("userId", "state");

-- CreateIndex
CREATE INDEX "Issue_repositoryId_idx" ON "Issue"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_userId_provider_externalId_key" ON "Issue"("userId", "provider", "externalId");

-- CreateIndex
CREATE INDEX "CICDRun_userId_startedAt_idx" ON "CICDRun"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "CICDRun_userId_conclusion_idx" ON "CICDRun"("userId", "conclusion");

-- CreateIndex
CREATE INDEX "CICDRun_repositoryId_idx" ON "CICDRun"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "CICDRun_userId_provider_externalId_key" ON "CICDRun"("userId", "provider", "externalId");

-- CreateIndex
CREATE INDEX "Deployment_userId_timestamp_idx" ON "Deployment"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Deployment_userId_provider_externalId_key" ON "Deployment"("userId", "provider", "externalId");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_startAt_idx" ON "CalendarEvent"("userId", "startAt");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_userId_provider_externalId_key" ON "CalendarEvent"("userId", "provider", "externalId");

-- CreateIndex
CREATE INDEX "FocusSession_userId_startedAt_idx" ON "FocusSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "DevHealthSignal_userId_createdAt_idx" ON "DevHealthSignal"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DevHealthSignal_userId_signalType_idx" ON "DevHealthSignal"("userId", "signalType");

-- CreateIndex
CREATE UNIQUE INDEX "DismissedInsight_userId_signalId_key" ON "DismissedInsight"("userId", "signalId");

-- CreateIndex
CREATE INDEX "AIConversation_userId_createdAt_idx" ON "AIConversation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AIMessage_conversationId_createdAt_idx" ON "AIMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedSummary_userId_type_idx" ON "GeneratedSummary"("userId", "type");

-- CreateIndex
CREATE INDEX "GeneratedSummary_userId_createdAt_idx" ON "GeneratedSummary"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SharedReport_token_key" ON "SharedReport"("token");

-- CreateIndex
CREATE INDEX "SharedReport_userId_idx" ON "SharedReport"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commit" ADD CONSTRAINT "Commit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commit" ADD CONSTRAINT "Commit_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequest" ADD CONSTRAINT "PullRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequest" ADD CONSTRAINT "PullRequest_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequestReview" ADD CONSTRAINT "PullRequestReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequestReview" ADD CONSTRAINT "PullRequestReview_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CICDRun" ADD CONSTRAINT "CICDRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CICDRun" ADD CONSTRAINT "CICDRun_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusSession" ADD CONSTRAINT "FocusSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DevHealthSignal" ADD CONSTRAINT "DevHealthSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DismissedInsight" ADD CONSTRAINT "DismissedInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIConversation" ADD CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMessage" ADD CONSTRAINT "AIMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedSummary" ADD CONSTRAINT "GeneratedSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedReport" ADD CONSTRAINT "SharedReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

