ALTER TABLE "User" ADD COLUMN "githubLogin" TEXT;

CREATE INDEX "User_githubLogin_idx" ON "User"("githubLogin");
