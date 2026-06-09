-- Rename old enums out of the way
ALTER TYPE "ListingCategory" RENAME TO "ListingCategory_old";
ALTER TYPE "ExtracurricularType" RENAME TO "ExtracurricularType_old";

-- Create new enums
CREATE TYPE "ListingCategory" AS ENUM ('academic', 'professional', 'competition', 'opportunity');
CREATE TYPE "ExtracurricularType" AS ENUM (
  'Olympiad', 'Quiz', 'LocalFairs', 'Research', 'WritingCompetition', 'Debate',
  'Internship', 'Mentorship',
  'TechContest', 'Hackathon', 'Startup', 'FilmArt',
  'ExchangeProgram', 'Conference', 'MUN'
);

-- Migrate category column (activity→academic, camp→academic, internship→professional)
ALTER TABLE "Listing"
  ALTER COLUMN "category" TYPE "ListingCategory" USING (
    CASE category::text
      WHEN 'activity' THEN 'academic'::"ListingCategory"
      WHEN 'camp' THEN 'academic'::"ListingCategory"
      WHEN 'internship' THEN 'professional'::"ListingCategory"
      ELSE 'academic'::"ListingCategory"
    END
  );

-- Migrate type column (best-effort, unmapped values become NULL)
ALTER TABLE "Listing"
  ALTER COLUMN "type" TYPE "ExtracurricularType" USING (
    CASE
      WHEN type IS NULL THEN NULL
      WHEN type::text = 'Research' THEN 'Research'::"ExtracurricularType"
      WHEN type::text = 'Arts' THEN 'FilmArt'::"ExtracurricularType"
      WHEN type::text IN ('Competition', 'STEM') THEN 'TechContest'::"ExtracurricularType"
      ELSE NULL
    END
  );

-- Drop old enums
DROP TYPE "ListingCategory_old";
DROP TYPE "ExtracurricularType_old";
