/** Static catalog metadata for kytalist clients (tier 2 — no DB). */
export function getMetaPayload() {
  return {
    regions: [
      "All regions",
      "Northeast",
      "Southeast",
      "Midwest",
      "Southwest",
      "Pacific",
      "Mountain",
      "Nationwide",
    ],
    extracurricularTypes: [
      "All",
      "Competition",
      "Research",
      "Program",
      "Club",
      "Volunteer",
      "Leadership",
      "Arts",
      "STEM",
    ],
    costOptions: ["Any cost", "Free", "Paid", "Stipend"],
    gradeOptions: [9, 10, 11, 12],
    sortOptions: [
      { value: "deadline", label: "Deadline soonest" },
      { value: "alpha", label: "A → Z" },
      { value: "recent", label: "Recently added" },
    ],
  };
}
