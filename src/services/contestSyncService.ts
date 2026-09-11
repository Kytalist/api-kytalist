import type { Prisma } from "../../generated/prisma/client.js";
import {
  CostOption,
  ExtracurricularType,
  ListingCategory,
  ListingStatus,
} from "../../generated/prisma/enums.js";
import { fetchClistContests, parseClistDate } from "../infrastructure/clist.js";
import { getLogger } from "../infrastructure/logger.js";
import { ListingRepository } from "../repositories/listingRepository.js";

const log = getLogger();

type Platform = {
  resourceId: number;
  name: string;
  image: string;
};

/** clist.by v4 resource ids for the platforms we surface. */
export const CLIST_PLATFORMS: Platform[] = [
  { resourceId: 1, name: "Codeforces", image: "/images/codeforces.svg" },
  { resourceId: 2, name: "CodeChef", image: "/images/codechef.svg" },
  { resourceId: 12, name: "TopCoder", image: "/images/topcoder.svg" },
  { resourceId: 93, name: "AtCoder", image: "/images/atcoder.svg" },
  { resourceId: 102, name: "LeetCode", image: "/images/leetcode.svg" },
];

export type ContestSyncResult = {
  fetched: number;
  upserted: number;
  pruned: number;
  failed: number;
  startedAt: string;
  finishedAt: string;
};

function sourceId(resourceId: number, contestId: number): string {
  return `clist-${resourceId}-${contestId}`;
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class ContestSyncService {
  constructor(private readonly repo: ListingRepository) {}

  /**
   * Pulls upcoming contests from clist.by for each platform, upserts them into
   * the listings table, then prunes ingested rows that have already ended.
   */
  async sync(): Promise<ContestSyncResult> {
    const startedAt = new Date();
    const windowDays = Number(process.env["CONTEST_SYNC_WINDOW_DAYS"] ?? 90);
    const startLt = new Date(
      startedAt.getTime() + windowDays * 24 * 60 * 60 * 1000,
    );

    let fetched = 0;
    let upserted = 0;
    let failed = 0;

    for (const platform of CLIST_PLATFORMS) {
      try {
        const contests = await fetchClistContests({
          resourceId: platform.resourceId,
          startGt: startedAt,
          startLt,
          limit: 100,
        });
        fetched += contests.length;

        for (const contest of contests) {
          const start = parseClistDate(contest.start);
          if (!start) continue;
          const end = parseClistDate(contest.end);
          const write = this.toWriteModel(platform, contest, start, end, startedAt);
          await this.repo.upsertById(write.id, write.create, write.update);
          upserted += 1;
        }
      } catch (err) {
        failed += 1;
        log.warn(
          { err, resourceId: platform.resourceId },
          "contest sync: platform fetch failed",
        );
      }
    }

    const pruned = await this.repo.deleteExpiredContests(startedAt);

    return {
      fetched,
      upserted,
      pruned,
      failed,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
    };
  }

  /** Seeds the catalog on first boot when no upcoming contests exist yet. */
  async ensureSeeded(): Promise<ContestSyncResult | null> {
    const upcoming = await this.repo.countUpcomingContests(new Date());
    if (upcoming > 0) return null;
    return this.sync();
  }

  private toWriteModel(
    platform: Platform,
    contest: { id: number; event: string; href: string },
    start: Date,
    end: Date | null,
    now: Date,
  ): {
    id: string;
    create: Prisma.ListingUncheckedCreateInput;
    update: Prisma.ListingUncheckedUpdateInput;
  } {
    const id = sourceId(platform.resourceId, contest.id);
    const deadline = dateOnly(start);
    const tags = [platform.name, "Programming", "STEM"];

    const shared = {
      title: contest.event,
      org: platform.name,
      location: "Online",
      region: "Online",
      description: `${platform.name} programming contest starting ${deadline}. Visit the contest page to learn more and register.`,
      image: platform.image,
      eventUrl: contest.href,
      category: ListingCategory.competition,
      badge: platform.name,
      footer: `Starts ${deadline}`,
      deadline,
      type: ExtracurricularType.TechContest,
      cost: CostOption.Free,
      grades: [9, 10, 11, 12],
      tags,
      keywords: tags.join(" "),
      deadlineAt: start,
      endsAt: end,
      source: "clist",
      status: ListingStatus.published,
    };

    return {
      id,
      create: { id, ...shared, publishedAt: now },
      update: shared,
    };
  }
}
