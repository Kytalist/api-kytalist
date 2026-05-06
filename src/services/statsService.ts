import type { ListingRepository } from "../repositories/listingRepository.js";
import type { UserRepository } from "../repositories/userRepository.js";

export type StatsPayload = {
  listings: {
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    total: number;
  };
  users: {
    byRole: Record<string, number>;
    total: number;
  };
};

export class StatsService {
  constructor(
    private readonly listings: ListingRepository,
    private readonly users: UserRepository,
  ) {}

  async getDashboard(): Promise<StatsPayload> {
    const [byStatus, byCategory, byRole] = await Promise.all([
      this.listings.groupByStatus(),
      this.listings.groupByCategory(),
      this.users.groupByRole(),
    ]);

    const statusMap: Record<string, number> = {};
    let listingsTotal = 0;
    for (const r of byStatus) {
      statusMap[r.status] = r.count;
      listingsTotal += r.count;
    }

    const categoryMap: Record<string, number> = {};
    for (const r of byCategory) {
      categoryMap[r.category] = r.count;
    }

    const roleMap: Record<string, number> = {};
    let usersTotal = 0;
    for (const r of byRole) {
      roleMap[r.role] = r.count;
      usersTotal += r.count;
    }

    return {
      listings: {
        byStatus: statusMap,
        byCategory: categoryMap,
        total: listingsTotal,
      },
      users: {
        byRole: roleMap,
        total: usersTotal,
      },
    };
  }
}
