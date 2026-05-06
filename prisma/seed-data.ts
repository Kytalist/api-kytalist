/**
 * Listing seed rows — mirrors kytalist `src/lib/data.ts` (ids preserved for #anchors).
 */
export type SeedListing = {
  id: string;
  title: string;
  org: string;
  location: string;
  region: string;
  description: string;
  image: string;
  category: "activity" | "camp" | "internship";
  badge: string;
  footer: string;
  deadline?: string;
  type?:
    | "Competition"
    | "Research"
    | "Program"
    | "Club"
    | "Volunteer"
    | "Leadership"
    | "Arts"
    | "STEM";
  cost?: "Free" | "Paid" | "Stipend";
  grades?: number[];
  tags?: string[];
  deadlineAt?: Date;
  featuredOrder?: number;
};

export const seedListings: SeedListing[] = [
  {
    id: "a1",
    title: "Robotics League — Regional Build Season",
    org: "STEM Forward Alliance",
    location: "Austin, TX",
    region: "Southwest",
    description:
      "Design and compete with a FIRST-style robot. Mentors from local tech companies; no prior experience required.",
    image: "/images/placeholder.svg",
    category: "activity",
    badge: "Competition",
    footer: "Grades 9–12 · Weekly meets",
    deadline: "Sign-ups close Sep 15",
    type: "Competition",
    cost: "Free",
    grades: [9, 10, 11, 12],
    tags: ["Robotics", "Engineering", "Team"],
  },
  {
    id: "a2",
    title: "Youth Orchestra — Chamber Ensembles",
    org: "Metro Arts Conservatory",
    location: "Chicago, IL",
    region: "Midwest",
    description:
      "Small-group coaching with conservatory faculty. Auditions are supportive and focus on growth, not perfection.",
    image: "/images/placeholder.svg",
    category: "activity",
    badge: "Music",
    footer: "All instruments welcome",
    type: "Arts",
    cost: "Paid",
    grades: [9, 10, 11, 12],
    tags: ["Music", "Performance", "Mentorship"],
    featuredOrder: 3,
  },
  {
    id: "a3",
    title: "Environmental Action Club & Field Labs",
    org: "Coastal Futures Project",
    location: "Portland, OR",
    region: "Pacific",
    description:
      "Water-quality sampling, habitat restoration weekends, and a student-led climate policy forum each semester.",
    image: "/images/placeholder.svg",
    category: "activity",
    badge: "Service",
    footer: "Outdoor days monthly",
    type: "Volunteer",
    cost: "Free",
    grades: [9, 10, 11, 12],
    tags: ["Environment", "Community", "Fieldwork"],
  },
  {
    id: "a4",
    title: "Debate & Civic Reasoning Lab",
    org: "National Student Forum",
    location: "Atlanta, GA",
    region: "Southeast",
    description:
      "Policy debate, public forum, and mock legislature tracks. Travel tournaments optional with scholarships.",
    image: "/images/placeholder.svg",
    category: "activity",
    badge: "Leadership",
    footer: "Beginner track available",
    type: "Leadership",
    cost: "Free",
    grades: [9, 10, 11, 12],
    tags: ["Debate", "Public speaking", "Policy"],
  },
  {
    id: "a5",
    title: "Science Olympiad — State Chapter",
    org: "Midwest Science Olympiad",
    location: "Columbus, OH",
    region: "Midwest",
    description:
      "Prep for 23 events across biology, chemistry, physics, and engineering. Coaches run weekly practice labs.",
    image: "/images/placeholder.svg",
    category: "activity",
    badge: "Competition",
    footer: "Team tryouts in October",
    deadline: "Tryouts Oct 10",
    type: "Competition",
    cost: "Free",
    grades: [9, 10, 11, 12],
    tags: ["STEM", "Team", "Academic"],
  },
  {
    id: "a6",
    title: "Model United Nations Conference Circuit",
    org: "Global Classrooms Initiative",
    location: "Boston, MA",
    region: "Northeast",
    description:
      "Research-heavy delegations, position papers, and regional conferences with college-student chairs.",
    image: "/images/placeholder.svg",
    category: "activity",
    badge: "Leadership",
    footer: "Conferences Nov–Apr",
    type: "Leadership",
    cost: "Paid",
    grades: [10, 11, 12],
    tags: ["Debate", "International", "Writing"],
  },
  {
    id: "a7",
    title: "High School Research Mentorship",
    org: "Polygence Scholars Network",
    location: "Remote (US)",
    region: "Nationwide",
    description:
      "1:1 mentorship with PhD mentors to produce an original research project or paper over 10 weeks.",
    image: "/images/placeholder.svg",
    category: "activity",
    badge: "Research",
    footer: "Rolling cohorts · 10 weeks",
    deadline: "Next cohort Jan 5",
    type: "Research",
    cost: "Paid",
    grades: [9, 10, 11, 12],
    tags: ["Research", "Writing", "Mentorship"],
  },
  {
    id: "a8",
    title: "Girls Who Code — Club Chapter",
    org: "Girls Who Code",
    location: "San Jose, CA",
    region: "Pacific",
    description:
      "Weekly coding sessions in Python and web dev with peer-led projects. No experience required.",
    image: "/images/placeholder.svg",
    category: "activity",
    badge: "Club",
    footer: "Weekly · After school",
    type: "Club",
    cost: "Free",
    grades: [9, 10, 11, 12],
    tags: ["Tech", "Coding", "Community"],
  },
  {
    id: "a9",
    title: "Hospital Volunteer Program",
    org: "Children's Hospital Volunteer Corps",
    location: "Philadelphia, PA",
    region: "Northeast",
    description:
      "Shadow clinicians, run family resource carts, and support child-life specialists. Training provided.",
    image: "/images/placeholder.svg",
    category: "activity",
    badge: "Service",
    footer: "Min. 4 hrs/week",
    deadline: "Applications open Feb 1",
    type: "Volunteer",
    cost: "Free",
    grades: [11, 12],
    tags: ["Healthcare", "Service", "Shadowing"],
  },
  {
    id: "a10",
    title: "Math Circle — Problem-Solving Seminar",
    org: "Bay Area Math Circle",
    location: "Berkeley, CA",
    region: "Pacific",
    description:
      "Olympiad-style problem sets guided by graduate student coaches. Weekly seminars with guest speakers.",
    image: "/images/placeholder.svg",
    category: "activity",
    badge: "STEM",
    footer: "Weekly · Fall + Spring",
    type: "STEM",
    cost: "Free",
    grades: [9, 10, 11, 12],
    tags: ["Math", "Academic", "Seminar"],
  },
  {
    id: "a11",
    title: "Student Journalism & Newsroom",
    org: "Teen Vogue Press Corps",
    location: "Remote (US)",
    region: "Nationwide",
    description:
      "Pitch, report, and publish features with editor mentorship. Published bylines for strong pitches.",
    image: "/images/placeholder.svg",
    category: "activity",
    badge: "Arts",
    footer: "Portfolio outcome",
    deadline: "Rolling pitches",
    type: "Arts",
    cost: "Free",
    grades: [10, 11, 12],
    tags: ["Writing", "Journalism", "Remote"],
  },
  {
    id: "a12",
    title: "Community Garden & Food Justice Project",
    org: "Root & Row Collective",
    location: "Detroit, MI",
    region: "Midwest",
    description:
      "Grow, harvest, and distribute produce to local pantries. Plan workshops on food systems and policy.",
    image: "/images/placeholder.svg",
    category: "activity",
    badge: "Service",
    footer: "Saturdays · All ages",
    type: "Volunteer",
    cost: "Free",
    grades: [9, 10, 11, 12],
    tags: ["Environment", "Food", "Community"],
  },
  {
    id: "c1",
    title: "Coastal Marine Science Immersion",
    org: "Blue Harbor Institute",
    location: "San Diego, CA",
    region: "Pacific",
    description:
      "Two weeks of field work, ROV workshops, and lab time with graduate students. Housing on a small college campus.",
    image: "/images/placeholder.svg",
    category: "camp",
    badge: "STEM",
    footer: "Ages 15–17 · Residential",
    deadline: "Early bird Mar 1",
    featuredOrder: 2,
  },
  {
    id: "c2",
    title: "Design & Fabrication Studio",
    org: "Maker Guild Summer",
    location: "Detroit, MI",
    region: "Midwest",
    description:
      "CNC, electronics, and sustainable materials. Capstone: a community installation co-designed with a local nonprofit.",
    image: "/images/placeholder.svg",
    category: "camp",
    badge: "Design",
    footer: "Day camp · Lunch included",
  },
  {
    id: "c3",
    title: "Creative Writing & Journalism Intensive",
    org: "Inkwell Summer",
    location: "New York, NY",
    region: "Northeast",
    description:
      "Newsroom simulations, podcast production, and mentorship from working editors. Portfolio review on the final day.",
    image: "/images/placeholder.svg",
    category: "camp",
    badge: "Arts",
    footer: "1-week sessions",
  },
  {
    id: "c4",
    title: "Outdoor Leadership & Wilderness Skills",
    org: "Ridge Trail Expeditions",
    location: "Denver, CO",
    region: "Mountain",
    description:
      "Backpacking fundamentals, leave-no-trace ethics, and peer leadership scenarios in Rocky Mountain front country.",
    image: "/images/placeholder.svg",
    category: "camp",
    badge: "Outdoors",
    footer: "Scholarships available",
  },
  {
    id: "i1",
    title: "Software Engineering Intern — Civic Tools",
    org: "OpenGov Labs",
    location: "Remote (US)",
    region: "Nationwide",
    description:
      "Ship features that help residents access public data. Stack: TypeScript, React, Postgres. Pairing-heavy culture.",
    image: "/images/placeholder.svg",
    category: "internship",
    badge: "Tech",
    footer: "Paid · 10 weeks",
    deadline: "Applications due Feb 28",
    featuredOrder: 1,
  },
  {
    id: "i2",
    title: "Healthcare Research Assistant",
    org: "Lakeside Medical Center",
    location: "Minneapolis, MN",
    region: "Midwest",
    description:
      "Support clinical studies in cardiology. Training in data ethics, REDCap, and literature reviews with PI oversight.",
    image: "/images/placeholder.svg",
    category: "internship",
    badge: "Research",
    footer: "Rising college juniors+",
  },
  {
    id: "i3",
    title: "Sustainable Supply Chain Analyst Intern",
    org: "Northwind Foods",
    location: "Seattle, WA",
    region: "Pacific",
    description:
      "Model supplier emissions, present to ops leaders, and shadow vendor audits. Excel + Python friendly team.",
    image: "/images/placeholder.svg",
    category: "internship",
    badge: "Business",
    footer: "Hybrid · Stipend",
    featuredOrder: 4,
  },
  {
    id: "i4",
    title: "Museum Education & Exhibit Design Intern",
    org: "Riverfront Museum of History",
    location: "Philadelphia, PA",
    region: "Northeast",
    description:
      "Facilitate school programs, prototype interactives, and assist curators with a new youth history gallery.",
    image: "/images/placeholder.svg",
    category: "internship",
    badge: "Education",
    footer: "Part-time summer",
  },
  {
    id: "i5",
    title: "Renewable Energy Field Intern",
    org: "SunPath Energy",
    location: "Albuquerque, NM",
    region: "Southwest",
    description:
      "Site surveys, GIS support, and community outreach for residential solar pilots. OSHA-10 training provided.",
    image: "/images/placeholder.svg",
    category: "internship",
    badge: "Energy",
    footer: "Paid mileage",
  },
];
