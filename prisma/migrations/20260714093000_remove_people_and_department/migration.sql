-- Drop obsolete visitor fields removed from the active registration workflow.
ALTER TABLE "visitors"
  DROP COLUMN "department",
  DROP COLUMN "partySize";
