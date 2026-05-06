import { randomBytes } from "node:crypto";
import type { Subscriber } from "../../generated/prisma/client.js";
import { AppError } from "../domain/AppError.js";
import { buildConfirmEmail, sendEmail } from "../infrastructure/email.js";
import { getLogger } from "../infrastructure/logger.js";
import { SubscriberRepository } from "../repositories/subscriberRepository.js";

export type SubscriberJson = {
  id: string;
  email: string;
  status: string;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
};

function token(): string {
  return randomBytes(24).toString("hex");
}

function publicUrl(path: string): string {
  const base =
    process.env["APP_PUBLIC_URL"]?.replace(/\/+$/, "") ?? "http://localhost:3001";
  return `${base}${path}`;
}

function toJson(s: Subscriber): SubscriberJson {
  return {
    id: s.id,
    email: s.email,
    status: s.status,
    confirmedAt: s.confirmedAt?.toISOString() ?? null,
    unsubscribedAt: s.unsubscribedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  };
}

export class NewsletterService {
  constructor(private readonly subs: SubscriberRepository) {}

  async subscribe(email: string): Promise<{ status: string }> {
    const normalized = email.trim().toLowerCase();
    let subscriber = await this.subs.findByEmail(normalized);

    if (subscriber && subscriber.status === "confirmed") {
      return { status: "already-subscribed" };
    }

    if (!subscriber) {
      subscriber = await this.subs.create({
        email: normalized,
        status: "pending",
        confirmToken: token(),
        unsubToken: token(),
      });
    } else if (subscriber.status === "unsubscribed") {
      subscriber = await this.subs.update(subscriber.id, {
        status: "pending",
        confirmToken: token(),
        unsubscribedAt: null,
      });
    } else if (!subscriber.confirmToken) {
      subscriber = await this.subs.update(subscriber.id, {
        confirmToken: token(),
      });
    }

    if (subscriber.confirmToken) {
      const confirmUrl = publicUrl(
        `/api/v1/newsletter/confirm?token=${encodeURIComponent(subscriber.confirmToken)}`,
      );
      const unsubUrl = publicUrl(
        `/api/v1/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.unsubToken)}`,
      );
      await sendEmail(buildConfirmEmail(normalized, confirmUrl, unsubUrl));
    }

    return { status: "pending" };
  }

  async confirm(tokenStr: string): Promise<{ status: string }> {
    const subscriber = await this.subs.findByConfirmToken(tokenStr);
    if (!subscriber) {
      throw new AppError("Invalid or expired token", 400, "INVALID_TOKEN");
    }
    await this.subs.update(subscriber.id, {
      status: "confirmed",
      confirmedAt: new Date(),
      confirmToken: null,
    });
    return { status: "confirmed" };
  }

  async unsubscribe(tokenStr: string): Promise<{ status: string }> {
    const subscriber = await this.subs.findByUnsubToken(tokenStr);
    if (!subscriber) {
      throw new AppError("Invalid token", 400, "INVALID_TOKEN");
    }
    await this.subs.update(subscriber.id, {
      status: "unsubscribed",
      unsubscribedAt: new Date(),
    });
    return { status: "unsubscribed" };
  }

  async list(args: { status?: string; limit: number; offset: number }) {
    const where: Parameters<SubscriberRepository["findManyWithCount"]>[0]["where"] = {};
    if (args.status) where.status = args.status;
    const { rows, total } = await this.subs.findManyWithCount({
      where,
      take: args.limit,
      skip: args.offset,
    });
    return { items: rows.map(toJson), total };
  }

  /**
   * Fire-and-forget broadcast. Iterates confirmed subscribers and sends
   * one email each. Logs at start and finish; swallows individual failures
   * so a bad address doesn't stop the run.
   */
  broadcast(args: { subject: string; html: string }): { queued: true } {
    const log = getLogger();
    void (async () => {
      const recipients = await this.subs.findConfirmedEmails();
      log.info({ count: recipients.length }, "Newsletter broadcast started");
      let sent = 0;
      let failed = 0;
      for (const to of recipients) {
        try {
          const ok = await sendEmail({
            to,
            subject: args.subject,
            html: args.html,
          });
          if (ok) sent += 1;
          else failed += 1;
        } catch (err) {
          failed += 1;
          log.warn({ err, to }, "Broadcast send failed for recipient");
        }
      }
      log.info({ sent, failed }, "Newsletter broadcast finished");
    })().catch((err) => {
      log.error({ err }, "Newsletter broadcast crashed");
    });
    return { queued: true };
  }
}
