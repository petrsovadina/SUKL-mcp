import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@sukl-mcp.vercel.app";

function emailWrapper(title: string, bodyHtml: string): string {
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e;">
      <div style="background: #1a1a2e; padding: 24px 32px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">SÚKL MCP</h1>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e5e5; border-top: none;">
        <h2 style="margin: 0 0 16px 0; color: #1a1a2e; font-size: 18px;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="background: #f8f8fa; padding: 20px 32px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px; font-size: 13px; color: #6b7280;">
        <p style="margin: 0 0 4px 0;">SÚKL MCP — AI přístup k české farmaceutické databázi</p>
        <p style="margin: 0 0 4px 0;">Kontakt: petr.sovadina9@gmail.com</p>
        <p style="margin: 0;">© ${new Date().getFullYear()} Petr Sovadina</p>
      </div>
    </div>
  `;
}

export async function sendRegistrationConfirmation(to: string, name: string) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: "SÚKL MCP Pro — Vaše registrace byla přijata",
    html: emailWrapper("Registrace přijata", `
      <p>Děkujeme za registraci, <strong>${name}</strong>!</p>
      <p>Vaše žádost o Pro API klíč byla přijata. Ozveme se vám s přístupovými údaji.</p>
      <p><strong>Co vás čeká:</strong></p>
      <ul style="padding-left: 20px; color: #374151;">
        <li>14denní bezplatný trial</li>
        <li>1 000 požadavků / min</li>
        <li>API klíč + dashboard</li>
      </ul>
      <p>Pokud máte mezitím jakékoli dotazy, neváhejte nás kontaktovat.</p>
      <p style="margin-top: 24px;">S pozdravem,<br><strong>SÚKL MCP tým</strong></p>
    `),
  });
}

export async function sendEnterpriseNotification(data: {
  name: string;
  email: string;
  company: string;
  companySize: string;
  message: string;
}) {
  const ownerEmail = process.env.RESEND_OWNER_EMAIL || FROM_EMAIL;

  return getResend().emails.send({
    from: FROM_EMAIL,
    to: ownerEmail,
    subject: `Nová Enterprise poptávka: ${data.company}`,
    html: emailWrapper("Nová Enterprise poptávka", `
      <table style="border-collapse: collapse; width: 100%; margin-bottom: 16px;">
        <tr><td style="padding: 8px 16px 8px 0; font-weight: 600; color: #374151; white-space: nowrap;">Jméno:</td><td style="padding: 8px 0;">${data.name}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; font-weight: 600; color: #374151; white-space: nowrap;">Email:</td><td style="padding: 8px 0;">${data.email}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; font-weight: 600; color: #374151; white-space: nowrap;">Firma:</td><td style="padding: 8px 0;">${data.company}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; font-weight: 600; color: #374151; white-space: nowrap;">Velikost:</td><td style="padding: 8px 0;">${data.companySize}</td></tr>
      </table>
      <h3 style="margin: 0 0 8px 0; color: #1a1a2e; font-size: 15px;">Zpráva:</h3>
      <p style="background: #f8f8fa; padding: 12px 16px; border-radius: 8px; color: #374151;">${data.message}</p>
    `),
  });
}

export async function sendNewsletterConfirmation(to: string) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: "SÚKL MCP — Přihlášení k odběru novinek",
    html: emailWrapper("Přihlášení k odběru potvrzeno", `
      <p>Děkujeme za přihlášení k odběru novinek SÚKL MCP!</p>
      <p><strong>Co vám budeme posílat:</strong></p>
      <ul style="padding-left: 20px; color: #374151;">
        <li>Nové funkce a nástroje</li>
        <li>Aktualizace farmaceutických dat</li>
        <li>Tipy pro integraci do vašich projektů</li>
      </ul>
      <p style="color: #6b7280; font-size: 14px;">Maximálně 2× měsíčně. Žádný spam.</p>
      <p style="margin-top: 24px;">S pozdravem,<br><strong>SÚKL MCP tým</strong></p>
    `),
  });
}
