import nodemailer from "nodemailer";
import { logger } from "./logger";

export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  if (isSmtpConfigured()) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

const BASE_PATH = (process.env.BASE_PATH ?? "").replace(/\/$/, "");
const APP_URL = process.env.APP_URL ?? `https://sowiso-01.replit.app${BASE_PATH}`;
const FROM_ADDRESS = process.env.SMTP_FROM ?? "noreply@sowiso.app";
const FROM_NAME = "Cortéa";

function buildActivationEmailHtml(verificationUrl: string, locale: string = "en"): string {
  const content = {
    subject: {
      en: "Activate your Cortéa account",
      nl: "Activeer uw Cortéa-account",
      fr: "Activez votre compte Cortéa",
      de: "Aktivieren Sie Ihr Cortéa-Konto",
      es: "Active su cuenta Cortéa",
    },
    greeting: {
      en: "Distinguished guest,",
      nl: "Geachte gast,",
      fr: "Distingué invité,",
      de: "Geehrter Gast,",
      es: "Estimado invitado,",
    },
    body: {
      en: "Your passage into the art of conduct has been prepared. To complete your admission, please verify your correspondence address by selecting the button below.",
      nl: "Uw toegang tot de kunst van het gedrag is voorbereid. Om uw aanmelding te voltooien, verifieer uw correspondentieadres door op de onderstaande knop te klikken.",
      fr: "Votre accès à l'art de la conduite a été préparé. Pour finaliser votre inscription, veuillez vérifier votre adresse de correspondance en sélectionnant le bouton ci-dessous.",
      de: "Ihr Zugang zur Kunst des Benehmens wurde vorbereitet. Um Ihre Aufnahme abzuschließen, bestätigen Sie bitte Ihre Korrespondenzadresse über die Schaltfläche unten.",
      es: "Su acceso al arte de la conducta ha sido preparado. Para completar su admisión, verifique su dirección de correspondencia seleccionando el botón de abajo.",
    },
    button: {
      en: "Verify My Address",
      nl: "Mijn Adres Verifiëren",
      fr: "Vérifier Mon Adresse",
      de: "Meine Adresse Bestätigen",
      es: "Verificar Mi Dirección",
    },
    expiry: {
      en: "This invitation expires in 24 hours. If you did not request admission to Cortéa, kindly disregard this correspondence.",
      nl: "Deze uitnodiging vervalt over 24 uur. Als u geen toegang tot Cortéa heeft aangevraagd, kunt u dit bericht negeren.",
      fr: "Cette invitation expire dans 24 heures. Si vous n'avez pas demandé l'accès à Cortéa, veuillez ignorer cette correspondance.",
      de: "Diese Einladung läuft in 24 Stunden ab. Falls Sie keinen Zugang zu Cortéa beantragt haben, ignorieren Sie bitte diese Korrespondenz.",
      es: "Esta invitación caduca en 24 horas. Si no solicitó acceso a Cortéa, por favor ignore esta correspondencia.",
    },
    footer: {
      en: "The art of conduct, since 2024.",
      nl: "De kunst van gedrag, sinds 2024.",
      fr: "L'art de la conduite, depuis 2024.",
      de: "Die Kunst des Benehmens, seit 2024.",
      es: "El arte de la conducta, desde 2024.",
    },
  };

  const lang = (["en", "nl", "fr", "de", "es"].includes(locale) ? locale : "en") as keyof typeof content.greeting;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${content.subject[lang]}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f5f0eb; font-family: Georgia, "Times New Roman", serif; color: #2c2c2c; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fffdf9; border: 1px solid #e8e0d5; }
    .header { background-color: #1a2e1a; padding: 40px 48px; text-align: center; }
    .header-title { color: #f0ebe3; font-size: 28px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: normal; }
    .header-tagline { color: #8fa88f; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; margin-top: 6px; font-family: 'Courier New', monospace; }
    .body { padding: 48px; }
    .greeting { font-size: 18px; color: #1a2e1a; margin-bottom: 20px; font-style: italic; }
    .body-text { font-size: 15px; line-height: 1.8; color: #4a4a4a; margin-bottom: 36px; font-weight: normal; }
    .button-wrapper { text-align: center; margin: 36px 0; }
    .button { display: inline-block; background-color: #1a2e1a; color: #f0ebe3 !important; text-decoration: none; padding: 14px 40px; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; font-family: 'Courier New', monospace; border: none; }
    .divider { border: none; border-top: 1px solid #e8e0d5; margin: 36px 0; }
    .expiry { font-size: 12px; color: #8a8a8a; line-height: 1.7; font-family: 'Courier New', monospace; }
    .fallback-link { font-size: 12px; color: #8a8a8a; margin-top: 12px; word-break: break-all; }
    .footer { background-color: #f5f0eb; padding: 24px 48px; text-align: center; border-top: 1px solid #e8e0d5; }
    .footer-text { font-size: 11px; color: #9a9a9a; letter-spacing: 0.15em; text-transform: uppercase; font-family: 'Courier New', monospace; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-title">Cortéa</div>
      <div class="header-tagline">${content.footer[lang]}</div>
    </div>

    <div class="body">
      <p class="greeting">${content.greeting[lang]}</p>
      <p class="body-text">${content.body[lang]}</p>

      <div class="button-wrapper">
        <a href="${verificationUrl}" class="button">${content.button[lang]}</a>
      </div>

      <hr class="divider" />

      <p class="expiry">${content.expiry[lang]}</p>
      <p class="fallback-link">${verificationUrl}</p>
    </div>

    <div class="footer">
      <p class="footer-text">Cortéa &mdash; ${content.footer[lang]}</p>
    </div>
  </div>
</body>
</html>`;
}

function buildPasswordResetEmailHtml(resetUrl: string, locale: string = "en"): string {
  const content = {
    subject: {
      en: "Reset your Cortéa password",
      nl: "Stel uw Cortéa-wachtwoord opnieuw in",
      fr: "Réinitialisez votre mot de passe Cortéa",
      de: "Setzen Sie Ihr Cortéa-Passwort zurück",
      es: "Restablezca su contraseña de Cortéa",
    },
    greeting: {
      en: "Distinguished guest,",
      nl: "Geachte gast,",
      fr: "Distingué invité,",
      de: "Geehrter Gast,",
      es: "Estimado invitado,",
    },
    body: {
      en: "A request has been received to reset the password for your Cortéa account. Select the button below to choose a new password. If you did not make this request, you may safely disregard this correspondence.",
      nl: "Er is een verzoek ontvangen om het wachtwoord van uw Cortéa-account opnieuw in te stellen. Selecteer de knop hieronder om een nieuw wachtwoord te kiezen. Als u dit verzoek niet heeft gedaan, kunt u dit bericht negeren.",
      fr: "Une demande de réinitialisation du mot de passe de votre compte Cortéa a été reçue. Sélectionnez le bouton ci-dessous pour choisir un nouveau mot de passe. Si vous n'avez pas fait cette demande, vous pouvez ignorer cette correspondance.",
      de: "Es wurde eine Anfrage zum Zurücksetzen des Passworts Ihres Cortéa-Kontos eingegangen. Wählen Sie die Schaltfläche unten, um ein neues Passwort festzulegen. Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese Korrespondenz ignorieren.",
      es: "Se ha recibido una solicitud para restablecer la contraseña de su cuenta Cortéa. Seleccione el botón a continuación para elegir una nueva contraseña. Si no realizó esta solicitud, puede ignorar esta correspondencia.",
    },
    button: {
      en: "Reset My Password",
      nl: "Mijn Wachtwoord Opnieuw Instellen",
      fr: "Réinitialiser Mon Mot de Passe",
      de: "Mein Passwort Zurücksetzen",
      es: "Restablecer Mi Contraseña",
    },
    expiry: {
      en: "This link expires in 1 hour. If you did not request a password reset, kindly disregard this correspondence.",
      nl: "Deze link verloopt over 1 uur. Als u geen wachtwoordreset heeft aangevraagd, kunt u dit bericht negeren.",
      fr: "Ce lien expire dans 1 heure. Si vous n'avez pas demandé de réinitialisation de mot de passe, veuillez ignorer cette correspondance.",
      de: "Dieser Link läuft in 1 Stunde ab. Falls Sie keinen Passwort-Reset beantragt haben, ignorieren Sie bitte diese Korrespondenz.",
      es: "Este enlace caduca en 1 hora. Si no solicitó un restablecimiento de contraseña, por favor ignore esta correspondencia.",
    },
    footer: {
      en: "The art of conduct, since 2024.",
      nl: "De kunst van gedrag, sinds 2024.",
      fr: "L'art de la conduite, depuis 2024.",
      de: "Die Kunst des Benehmens, seit 2024.",
      es: "El arte de la conducta, desde 2024.",
    },
  };

  const lang = (["en", "nl", "fr", "de", "es"].includes(locale) ? locale : "en") as keyof typeof content.greeting;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${content.subject[lang]}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #f5f0eb; font-family: Georgia, "Times New Roman", serif; color: #2c2c2c; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #fffdf9; border: 1px solid #e8e0d5; }
    .header { background-color: #1a2e1a; padding: 40px 48px; text-align: center; }
    .header-title { color: #f0ebe3; font-size: 28px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: normal; }
    .header-tagline { color: #8fa88f; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; margin-top: 6px; font-family: 'Courier New', monospace; }
    .body { padding: 48px; }
    .greeting { font-size: 18px; color: #1a2e1a; margin-bottom: 20px; font-style: italic; }
    .body-text { font-size: 15px; line-height: 1.8; color: #4a4a4a; margin-bottom: 36px; font-weight: normal; }
    .button-wrapper { text-align: center; margin: 36px 0; }
    .button { display: inline-block; background-color: #1a2e1a; color: #f0ebe3 !important; text-decoration: none; padding: 14px 40px; font-size: 13px; letter-spacing: 0.15em; text-transform: uppercase; font-family: 'Courier New', monospace; border: none; }
    .divider { border: none; border-top: 1px solid #e8e0d5; margin: 36px 0; }
    .expiry { font-size: 12px; color: #8a8a8a; line-height: 1.7; font-family: 'Courier New', monospace; }
    .fallback-link { font-size: 12px; color: #8a8a8a; margin-top: 12px; word-break: break-all; }
    .footer { background-color: #f5f0eb; padding: 24px 48px; text-align: center; border-top: 1px solid #e8e0d5; }
    .footer-text { font-size: 11px; color: #9a9a9a; letter-spacing: 0.15em; text-transform: uppercase; font-family: 'Courier New', monospace; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="header-title">Cortéa</div>
      <div class="header-tagline">${content.footer[lang]}</div>
    </div>

    <div class="body">
      <p class="greeting">${content.greeting[lang]}</p>
      <p class="body-text">${content.body[lang]}</p>

      <div class="button-wrapper">
        <a href="${resetUrl}" class="button">${content.button[lang]}</a>
      </div>

      <hr class="divider" />

      <p class="expiry">${content.expiry[lang]}</p>
      <p class="fallback-link">${resetUrl}</p>
    </div>

    <div class="footer">
      <p class="footer-text">Cortéa &mdash; ${content.footer[lang]}</p>
    </div>
  </div>
</body>
</html>`;
}

export interface SendPasswordResetEmailOptions {
  to: string;
  token: string;
  locale?: string;
}

export interface SendPasswordResetEmailResult {
  sent: boolean;
  url: string;
}

export async function sendPasswordResetEmail({
  to,
  token,
  locale = "en",
}: SendPasswordResetEmailOptions): Promise<SendPasswordResetEmailResult> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const html = buildPasswordResetEmailHtml(resetUrl, locale);

  const lang = (["en", "nl", "fr", "de", "es"].includes(locale) ? locale : "en") as "en" | "nl" | "fr" | "de" | "es";
  const subjects: Record<"en" | "nl" | "fr" | "de" | "es", string> = {
    en: "Reset your Cortéa password",
    nl: "Stel uw Cortéa-wachtwoord opnieuw in",
    fr: "Réinitialisez votre mot de passe Cortéa",
    de: "Setzen Sie Ihr Cortéa-Passwort zurück",
    es: "Restablezca su contraseña de Cortéa",
  };

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
    to,
    subject: subjects[lang],
    html,
  };

  const transport = createTransport();

  if (transport) {
    try {
      await transport.sendMail(mailOptions);
      logger.info({ to, token: token.slice(0, 8) + "…" }, "Password reset email sent via SMTP");
      return { sent: true, url: resetUrl };
    } catch (err) {
      logger.error({ err, to }, "Failed to send password reset email via SMTP");
      throw err;
    }
  } else {
    logger.warn(
      { to, subject: mailOptions.subject, url: resetUrl },
      "SMTP not configured — password reset email could not be delivered. Returning reset URL in response."
    );
    console.log("\n" + "=".repeat(70));
    console.log("  CORTÉA PASSWORD RESET EMAIL (SMTP not configured)");
    console.log("=".repeat(70));
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${mailOptions.subject}`);
    console.log(`  Link:    ${resetUrl}`);
    console.log(`  Token:   ${token}`);
    console.log("=".repeat(70) + "\n");
    return { sent: false, url: resetUrl };
  }
}

export interface SendActivationEmailOptions {
  to: string;
  token: string;
  locale?: string;
}

export interface SendActivationEmailResult {
  sent: boolean;
  url: string;
}

function buildWaitlistConfirmationHtml(opts: {
  name: string;
  founderCode: string | null;
  founderPosition: number | null;
  locale: string;
}): string {
  const { name, founderCode, founderPosition, locale } = opts;
  const lang = (["en", "nl", "fr", "de", "es"].includes(locale) ? locale : "en") as "en" | "nl" | "fr" | "de" | "es";

  const c = {
    subject: {
      en: "Welcome to the Cortéa waitlist", nl: "Welkom op de Cortéa-wachtlijst",
      fr: "Bienvenue sur la liste d'attente Cortéa", de: "Willkommen auf der Cortéa-Warteliste",
      es: "Bienvenido a la lista de espera de Cortéa",
    },
    greeting: {
      en: `Dear ${name},`, nl: `Beste ${name},`,
      fr: `Cher ${name},`, de: `Liebe(r) ${name},`, es: `Estimado ${name},`,
    },
    bodyFounder: {
      en: "You are among the Founding 100 — those receiving exclusive early access to the art of conduct. Your personal founder code below grants you one month of The Traveller, complimentary, when registration opens.",
      nl: "U behoort tot de Founding 100 — degenen die exclusieve vroege toegang krijgen tot de kunst van het gedrag. Uw persoonlijke foundercode hieronder geeft u één maand The Traveller cadeau wanneer de registratie opent.",
      fr: "Vous faites partie des 100 fondateurs — ceux qui reçoivent un accès anticipé exclusif à l'art de la conduite. Votre code fondateur personnel ci-dessous vous offre un mois gratuit de The Traveller dès l'ouverture des inscriptions.",
      de: "Sie gehören zu den Founding 100 — jenen mit exklusivem Vorabzugang zur Kunst des Benehmens. Ihr persönlicher Founder-Code unten schenkt Ihnen einen Monat The Traveller, sobald die Registrierung öffnet.",
      es: "Está entre los 100 fundadores — quienes reciben acceso anticipado exclusivo al arte de la conducta. Su código personal de fundador a continuación le otorga un mes gratis de The Traveller cuando se abra el registro.",
    },
    bodyWaitlist: {
      en: "The Founding 100 spots are now claimed, but you have a confirmed seat on the regular waitlist. We will write to you the moment your invitation is ready.",
      nl: "De 100 founding spots zijn vergeven, maar uw plek op de reguliere wachtlijst is bevestigd. Wij schrijven u zodra uw uitnodiging klaarstaat.",
      fr: "Les 100 places fondatrices sont attribuées, mais votre place sur la liste d'attente régulière est confirmée. Nous vous écrirons dès que votre invitation sera prête.",
      de: "Die 100 Founding-Plätze sind vergeben, doch Ihr Platz auf der regulären Warteliste ist bestätigt. Wir schreiben Ihnen, sobald Ihre Einladung bereitsteht.",
      es: "Las 100 plazas fundadoras están ocupadas, pero su lugar en la lista de espera regular está confirmado. Le escribiremos en cuanto su invitación esté lista.",
    },
    codeLabel: { en: "Your founder code", nl: "Uw foundercode", fr: "Votre code fondateur", de: "Ihr Founder-Code", es: "Su código de fundador" },
    positionLabel: {
      en: (n: number) => `Founding member #${n} of 100`,
      nl: (n: number) => `Founding member #${n} van 100`,
      fr: (n: number) => `Membre fondateur n°${n} sur 100`,
      de: (n: number) => `Founding Member Nr. ${n} von 100`,
      es: (n: number) => `Miembro fundador n.º ${n} de 100`,
    },
    howTo: {
      en: "When registration opens, sign in with this same email address — your discount will be applied automatically at checkout.",
      nl: "Wanneer de registratie opent, log dan in met dit e-mailadres — uw korting wordt automatisch toegepast bij de checkout.",
      fr: "Lors de l'ouverture des inscriptions, connectez-vous avec cette même adresse e-mail — votre remise sera appliquée automatiquement au paiement.",
      de: "Wenn die Registrierung öffnet, melden Sie sich mit dieser E-Mail-Adresse an — Ihr Rabatt wird automatisch beim Checkout angewandt.",
      es: "Cuando se abra el registro, inicie sesión con este mismo correo — su descuento se aplicará automáticamente en el pago.",
    },
    footer: {
      en: "The art of conduct, since 2024.", nl: "De kunst van gedrag, sinds 2024.",
      fr: "L'art de la conduite, depuis 2024.", de: "Die Kunst des Benehmens, seit 2024.",
      es: "El arte de la conducta, desde 2024.",
    },
  };

  const codeBlock = founderCode ? `
    <div style="text-align:center;margin:32px 0;">
      <p style="font-size:11px;color:#8a8a8a;letter-spacing:0.2em;text-transform:uppercase;font-family:'Courier New',monospace;margin-bottom:8px;">${c.codeLabel[lang]}</p>
      <div style="display:inline-block;background:#1a2e1a;color:#f0ebe3;padding:18px 36px;font-family:'Courier New',monospace;font-size:22px;letter-spacing:0.15em;">${founderCode}</div>
      ${founderPosition ? `<p style="margin-top:12px;font-size:12px;color:#8fa88f;font-family:'Courier New',monospace;letter-spacing:0.15em;text-transform:uppercase;">${c.positionLabel[lang](founderPosition)}</p>` : ""}
    </div>` : "";

  const body = founderCode ? c.bodyFounder[lang] : c.bodyWaitlist[lang];

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8" /><title>${c.subject[lang]}</title></head>
<body style="margin:0;background:#f5f0eb;font-family:Georgia,'Times New Roman',serif;color:#2c2c2c;">
  <div style="max-width:600px;margin:40px auto;background:#fffdf9;border:1px solid #e8e0d5;">
    <div style="background:#1a2e1a;padding:40px 48px;text-align:center;">
      <div style="color:#f0ebe3;font-size:28px;letter-spacing:0.2em;text-transform:uppercase;">Cortéa</div>
      <div style="color:#8fa88f;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin-top:6px;font-family:'Courier New',monospace;">${c.footer[lang]}</div>
    </div>
    <div style="padding:48px;">
      <p style="font-size:18px;color:#1a2e1a;margin-bottom:20px;font-style:italic;">${c.greeting[lang]}</p>
      <p style="font-size:15px;line-height:1.8;color:#4a4a4a;">${body}</p>
      ${codeBlock}
      ${founderCode ? `<p style="font-size:13px;line-height:1.7;color:#6a6a6a;">${c.howTo[lang]}</p>` : ""}
    </div>
    <div style="background:#f5f0eb;padding:24px 48px;text-align:center;border-top:1px solid #e8e0d5;">
      <p style="font-size:11px;color:#9a9a9a;letter-spacing:0.15em;text-transform:uppercase;font-family:'Courier New',monospace;">Cortéa &mdash; ${c.footer[lang]}</p>
    </div>
  </div>
</body></html>`;
}

export interface SendWaitlistConfirmationOptions {
  to: string;
  name: string;
  founderCode: string | null;
  founderPosition: number | null;
  locale?: string;
}

export async function sendWaitlistConfirmationEmail(opts: SendWaitlistConfirmationOptions): Promise<{ sent: boolean }> {
  const lang = (["en", "nl", "fr", "de", "es"].includes(opts.locale ?? "") ? opts.locale : "en") as "en" | "nl" | "fr" | "de" | "es";
  const subjects: Record<typeof lang, string> = {
    en: opts.founderCode ? "Welcome to the Cortéa Founding 100" : "You're on the Cortéa waitlist",
    nl: opts.founderCode ? "Welkom bij de Cortéa Founding 100" : "U staat op de Cortéa-wachtlijst",
    fr: opts.founderCode ? "Bienvenue parmi les 100 fondateurs Cortéa" : "Vous êtes sur la liste d'attente Cortéa",
    de: opts.founderCode ? "Willkommen bei den Cortéa Founding 100" : "Sie stehen auf der Cortéa-Warteliste",
    es: opts.founderCode ? "Bienvenido a los 100 fundadores de Cortéa" : "Está en la lista de espera de Cortéa",
  };
  const html = buildWaitlistConfirmationHtml({
    name: opts.name, founderCode: opts.founderCode, founderPosition: opts.founderPosition, locale: lang,
  });
  const mailOptions = { from: `"${FROM_NAME}" <${FROM_ADDRESS}>`, to: opts.to, subject: subjects[lang], html };
  const transport = createTransport();
  if (transport) {
    try {
      await transport.sendMail(mailOptions);
      logger.info({ to: opts.to, founderCode: opts.founderCode ? "yes" : "no" }, "Waitlist confirmation email sent");
      return { sent: true };
    } catch (err) {
      logger.error({ err, to: opts.to }, "Failed to send waitlist confirmation email");
      throw err;
    }
  }
  logger.warn({ to: opts.to, code: opts.founderCode }, "SMTP not configured — waitlist confirmation not delivered (logged only)");
  console.log("\n" + "=".repeat(70));
  console.log("  CORTÉA WAITLIST CONFIRMATION (SMTP not configured)");
  console.log("=".repeat(70));
  console.log(`  To:      ${opts.to}`);
  console.log(`  Subject: ${subjects[lang]}`);
  if (opts.founderCode) console.log(`  Code:    ${opts.founderCode} (position ${opts.founderPosition ?? "?"} / 100)`);
  console.log("=".repeat(70) + "\n");
  return { sent: false };
}

export interface SendWaitlistInvitationOptions {
  to: string;
  name: string;
  founderCode: string | null;
  locale?: string;
}

export async function sendWaitlistInvitationEmail(opts: SendWaitlistInvitationOptions): Promise<{ sent: boolean }> {
  const lang = (["en", "nl", "fr", "de", "es"].includes(opts.locale ?? "") ? opts.locale : "en") as "en" | "nl" | "fr" | "de" | "es";
  const subjects: Record<typeof lang, string> = {
    en: "Your Cortéa invitation is ready", nl: "Uw Cortéa-uitnodiging staat klaar",
    fr: "Votre invitation Cortéa est prête", de: "Ihre Cortéa-Einladung ist bereit",
    es: "Su invitación a Cortéa está lista",
  };
  const greeting: Record<typeof lang, string> = {
    en: `Dear ${opts.name},`, nl: `Beste ${opts.name},`,
    fr: `Cher ${opts.name},`, de: `Liebe(r) ${opts.name},`, es: `Estimado ${opts.name},`,
  };
  const body: Record<typeof lang, string> = {
    en: "Your seat at Cortéa is ready. Sign in with this email address to begin.",
    nl: "Uw plek bij Cortéa staat klaar. Log in met dit e-mailadres om te beginnen.",
    fr: "Votre place chez Cortéa est prête. Connectez-vous avec cette adresse e-mail pour commencer.",
    de: "Ihr Platz bei Cortéa ist bereit. Melden Sie sich mit dieser E-Mail-Adresse an.",
    es: "Su plaza en Cortéa está lista. Inicie sesión con este correo electrónico para empezar.",
  };
  const cta: Record<typeof lang, string> = {
    en: "Activate Membership", nl: "Lidmaatschap Activeren",
    fr: "Activer l'adhésion", de: "Mitgliedschaft Aktivieren", es: "Activar Membresía",
  };
  const url = `${APP_URL}/register?waitlist=1${opts.founderCode ? `&code=${opts.founderCode}` : ""}`;
  const html = `<!DOCTYPE html><html lang="${lang}"><body style="margin:0;background:#f5f0eb;font-family:Georgia,serif;color:#2c2c2c;">
  <div style="max-width:600px;margin:40px auto;background:#fffdf9;border:1px solid #e8e0d5;">
    <div style="background:#1a2e1a;padding:40px 48px;text-align:center;color:#f0ebe3;font-size:28px;letter-spacing:0.2em;text-transform:uppercase;">Cortéa</div>
    <div style="padding:48px;">
      <p style="font-size:18px;color:#1a2e1a;margin-bottom:20px;font-style:italic;">${greeting[lang]}</p>
      <p style="font-size:15px;line-height:1.8;color:#4a4a4a;">${body[lang]}</p>
      ${opts.founderCode ? `<p style="font-family:'Courier New',monospace;font-size:14px;color:#1a2e1a;margin-top:24px;">Founder code: <strong>${opts.founderCode}</strong></p>` : ""}
      <div style="text-align:center;margin:36px 0;">
        <a href="${url}" style="display:inline-block;background:#1a2e1a;color:#f0ebe3;text-decoration:none;padding:14px 40px;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;font-family:'Courier New',monospace;">${cta[lang]}</a>
      </div>
    </div>
  </div>
</body></html>`;
  const mailOptions = { from: `"${FROM_NAME}" <${FROM_ADDRESS}>`, to: opts.to, subject: subjects[lang], html };
  const transport = createTransport();
  if (transport) {
    try {
      await transport.sendMail(mailOptions);
      return { sent: true };
    } catch (err) {
      logger.error({ err, to: opts.to }, "Failed to send waitlist invitation email");
      throw err;
    }
  }
  console.log("\n" + "=".repeat(70));
  console.log("  CORTÉA WAITLIST INVITATION (SMTP not configured)");
  console.log("=".repeat(70));
  console.log(`  To:      ${opts.to}`);
  console.log(`  Link:    ${url}`);
  console.log("=".repeat(70) + "\n");
  return { sent: false };
}

export interface SendFounderWelcomeOptions {
  to: string;
  name: string;
  founderCode: string;
  locale?: string;
}

/**
 * Sent immediately after a waitlist user successfully registers an account.
 * Reminds them their Founding 100 perk (one month of The Traveller free) is
 * waiting and shows the personal founder code that will be auto-applied at
 * Stripe checkout.
 */
export async function sendFounderWelcomeEmail(opts: SendFounderWelcomeOptions): Promise<{ sent: boolean }> {
  const lang = (["en", "nl", "fr", "de", "es"].includes(opts.locale ?? "") ? opts.locale : "en") as "en" | "nl" | "fr" | "de" | "es";

  const subjects: Record<typeof lang, string> = {
    en: "Welcome to Cortéa — your Founding 100 perk is ready",
    nl: "Welkom bij Cortéa — uw Founding 100 voordeel staat klaar",
    fr: "Bienvenue chez Cortéa — votre avantage 100 fondateurs est prêt",
    de: "Willkommen bei Cortéa — Ihr Founding 100 Vorteil ist bereit",
    es: "Bienvenido a Cortéa — su ventaja de los 100 fundadores está lista",
  };
  const greeting: Record<typeof lang, string> = {
    en: `Dear ${opts.name},`, nl: `Beste ${opts.name},`,
    fr: `Cher ${opts.name},`, de: `Liebe(r) ${opts.name},`, es: `Estimado ${opts.name},`,
  };
  const body: Record<typeof lang, string> = {
    en: "Welcome to Cortéa. As a member of the Founding 100, your reserved perk — one month of The Traveller, complimentary — is waiting for you. Use the founder code below at checkout, or simply proceed to the membership page where it will be applied automatically.",
    nl: "Welkom bij Cortéa. Als lid van de Founding 100 staat uw voordeel klaar — één maand The Traveller cadeau. Gebruik de foundercode hieronder bij de checkout, of ga gewoon naar de lidmaatschapspagina waar deze automatisch wordt toegepast.",
    fr: "Bienvenue chez Cortéa. En tant que membre des 100 fondateurs, votre avantage est prêt — un mois de The Traveller offert. Utilisez le code fondateur ci-dessous au paiement, ou rendez-vous simplement sur la page d'adhésion où il sera appliqué automatiquement.",
    de: "Willkommen bei Cortéa. Als Mitglied der Founding 100 wartet Ihr Vorteil auf Sie — ein Monat The Traveller geschenkt. Verwenden Sie den Founder-Code unten beim Checkout oder besuchen Sie einfach die Mitgliedschaftsseite, wo er automatisch angewandt wird.",
    es: "Bienvenido a Cortéa. Como miembro de los 100 fundadores, su ventaja está lista — un mes de The Traveller gratis. Use el código de fundador a continuación en el pago, o simplemente vaya a la página de membresía donde se aplicará automáticamente.",
  };
  const codeLabel: Record<typeof lang, string> = {
    en: "Your founder code", nl: "Uw foundercode", fr: "Votre code fondateur",
    de: "Ihr Founder-Code", es: "Su código de fundador",
  };
  const cta: Record<typeof lang, string> = {
    en: "Claim My Free Month", nl: "Claim Mijn Gratis Maand",
    fr: "Réclamer Mon Mois Gratuit", de: "Meinen Gratismonat Einlösen", es: "Reclamar Mi Mes Gratis",
  };
  const footer: Record<typeof lang, string> = {
    en: "The art of conduct, since 2024.", nl: "De kunst van gedrag, sinds 2024.",
    fr: "L'art de la conduite, depuis 2024.", de: "Die Kunst des Benehmens, seit 2024.",
    es: "El arte de la conducta, desde 2024.",
  };

  const url = `${APP_URL}/membership`;

  const html = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8" /><title>${subjects[lang]}</title></head>
<body style="margin:0;background:#f5f0eb;font-family:Georgia,'Times New Roman',serif;color:#2c2c2c;">
  <div style="max-width:600px;margin:40px auto;background:#fffdf9;border:1px solid #e8e0d5;">
    <div style="background:#1a2e1a;padding:40px 48px;text-align:center;">
      <div style="color:#f0ebe3;font-size:28px;letter-spacing:0.2em;text-transform:uppercase;">Cortéa</div>
      <div style="color:#8fa88f;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;margin-top:6px;font-family:'Courier New',monospace;">${footer[lang]}</div>
    </div>
    <div style="padding:48px;">
      <p style="font-size:18px;color:#1a2e1a;margin-bottom:20px;font-style:italic;">${greeting[lang]}</p>
      <p style="font-size:15px;line-height:1.8;color:#4a4a4a;">${body[lang]}</p>
      <div style="text-align:center;margin:32px 0;">
        <p style="font-size:11px;color:#8a8a8a;letter-spacing:0.2em;text-transform:uppercase;font-family:'Courier New',monospace;margin-bottom:8px;">${codeLabel[lang]}</p>
        <div style="display:inline-block;background:#1a2e1a;color:#f0ebe3;padding:18px 36px;font-family:'Courier New',monospace;font-size:22px;letter-spacing:0.15em;">${opts.founderCode}</div>
      </div>
      <div style="text-align:center;margin:36px 0;">
        <a href="${url}" style="display:inline-block;background:#1a2e1a;color:#f0ebe3;text-decoration:none;padding:14px 40px;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;font-family:'Courier New',monospace;">${cta[lang]}</a>
      </div>
    </div>
    <div style="background:#f5f0eb;padding:24px 48px;text-align:center;border-top:1px solid #e8e0d5;">
      <p style="font-size:11px;color:#9a9a9a;letter-spacing:0.15em;text-transform:uppercase;font-family:'Courier New',monospace;">Cortéa &mdash; ${footer[lang]}</p>
    </div>
  </div>
</body></html>`;

  const mailOptions = { from: `"${FROM_NAME}" <${FROM_ADDRESS}>`, to: opts.to, subject: subjects[lang], html };
  const transport = createTransport();
  if (transport) {
    try {
      await transport.sendMail(mailOptions);
      logger.info({ to: opts.to }, "Founder welcome email sent");
      return { sent: true };
    } catch (err) {
      logger.error({ err, to: opts.to }, "Failed to send founder welcome email");
      throw err;
    }
  }
  logger.warn({ to: opts.to, code: opts.founderCode }, "SMTP not configured — founder welcome email not delivered (logged only)");
  console.log("\n" + "=".repeat(70));
  console.log("  CORTÉA FOUNDER WELCOME EMAIL (SMTP not configured)");
  console.log("=".repeat(70));
  console.log(`  To:      ${opts.to}`);
  console.log(`  Subject: ${subjects[lang]}`);
  console.log(`  Code:    ${opts.founderCode}`);
  console.log("=".repeat(70) + "\n");
  return { sent: false };
}

export async function sendActivationEmail({
  to,
  token,
  locale = "en",
}: SendActivationEmailOptions): Promise<SendActivationEmailResult> {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;
  const html = buildActivationEmailHtml(verificationUrl, locale);

  const lang = (["en", "nl", "fr", "de", "es"].includes(locale) ? locale : "en") as "en" | "nl" | "fr" | "de" | "es";
  const subjects: Record<"en" | "nl" | "fr" | "de" | "es", string> = {
    en: "Activate your Cortéa account",
    nl: "Activeer uw Cortéa-account",
    fr: "Activez votre compte Cortéa",
    de: "Aktivieren Sie Ihr Cortéa-Konto",
    es: "Active su cuenta Cortéa",
  };

  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
    to,
    subject: subjects[lang],
    html,
  };

  const transport = createTransport();

  if (transport) {
    try {
      await transport.sendMail(mailOptions);
      logger.info({ to, token: token.slice(0, 8) + "…" }, "Activation email sent via SMTP");
      return { sent: true, url: verificationUrl };
    } catch (err) {
      logger.error({ err, to }, "Failed to send activation email via SMTP");
      throw err;
    }
  } else {
    logger.warn(
      { to, subject: mailOptions.subject, url: verificationUrl },
      "SMTP not configured — activation email could not be delivered. Returning verification URL in response."
    );
    console.log("\n" + "=".repeat(70));
    console.log("  CORTÉA ACTIVATION EMAIL (SMTP not configured)");
    console.log("=".repeat(70));
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${mailOptions.subject}`);
    console.log(`  Link:    ${verificationUrl}`);
    console.log(`  Token:   ${token}`);
    console.log("=".repeat(70) + "\n");
    return { sent: false, url: verificationUrl };
  }
}
