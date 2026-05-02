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
