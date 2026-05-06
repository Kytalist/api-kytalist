import { Resend } from "resend";
import { getLogger } from "./logger.js";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env["RESEND_API_KEY"];
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

export type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Send via Resend if configured. If not, log the email and return false
 * so dev can still see what would have been sent without crashing.
 */
export async function sendEmail(args: SendArgs): Promise<boolean> {
  const log = getLogger();
  const from = process.env["EMAIL_FROM"];
  const client = getResend();

  if (!client || !from) {
    log.warn(
      { to: args.to, subject: args.subject },
      "Email skipped: RESEND_API_KEY or EMAIL_FROM not configured",
    );
    return false;
  }

  const { error } = await client.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    ...(args.text ? { text: args.text } : {}),
  });

  if (error) {
    log.error({ to: args.to, err: error }, "Resend send failed");
    return false;
  }
  return true;
}

export function buildConfirmEmail(
  email: string,
  confirmUrl: string,
  unsubUrl: string,
): SendArgs {
  return {
    to: email,
    subject: "Confirm your kytalist newsletter subscription",
    html: `<p>Hi,</p>
<p>Please confirm your subscription to the kytalist newsletter:</p>
<p><a href="${confirmUrl}">Confirm subscription</a></p>
<p>If you didn't request this, you can safely ignore this email or
<a href="${unsubUrl}">unsubscribe here</a>.</p>`,
    text: `Confirm: ${confirmUrl}\nUnsubscribe: ${unsubUrl}`,
  };
}
