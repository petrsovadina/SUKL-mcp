import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@sukl-mcp.vercel.app";

export async function sendRegistrationConfirmation(to: string, name: string) {
  return getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: "SÚKL MCP Pro — Vaše registrace byla přijata",
    html: `
      <h2>Děkujeme za registraci, ${name}!</h2>
      <p>Vaše žádost o Pro API klíč byla přijata. Ozveme se vám s přístupovými údaji.</p>
      <p><strong>Co vás čeká:</strong></p>
      <ul>
        <li>14denní bezplatný trial</li>
        <li>1 000 požadavků / min</li>
        <li>API klíč + dashboard</li>
      </ul>
      <p>Pokud máte mezitím jakékoli dotazy, neváhejte nás kontaktovat.</p>
      <br>
      <p>S pozdravem,<br>SÚKL MCP tým</p>
    `,
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
    html: `
      <h2>Nová Enterprise poptávka</h2>
      <table style="border-collapse: collapse;">
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Jméno:</td><td>${data.name}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Email:</td><td>${data.email}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Firma:</td><td>${data.company}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Velikost:</td><td>${data.companySize}</td></tr>
      </table>
      <h3>Zpráva:</h3>
      <p>${data.message}</p>
    `,
  });
}
