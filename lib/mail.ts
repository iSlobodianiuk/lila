import { Resend } from "resend";

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendGameResultEmail(input: {
  to: string;
  playerRequest: string;
  gamePath: string;
  chatText: string;
  finalSummary: string;
  actionPlan: string;
}): Promise<{ ok: boolean; skipped?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Lila <onboarding@resend.dev>";
  if (!key) {
    console.warn("sendGameResultEmail: RESEND_API_KEY is not set, skipping email");
    return { ok: false, skipped: "no_api_key" };
  }

  const resend = new Resend(key);
  const { data, error } = await resend.emails.send({
    from,
    to: [input.to],
    subject: "Ліла — твій результат гри",
    html: buildHtml(input),
  });

  if (error) {
    console.error("Resend error:", error);
    return { ok: false, skipped: String(error) };
  }
  void data;
  return { ok: true };
}

function buildHtml(input: {
  playerRequest: string;
  gamePath: string;
  chatText: string;
  finalSummary: string;
  actionPlan: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="uk">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia, 'Times New Roman', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="560" style="max-width:560px;background:#fffdf9;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(60,50,30,0.08);">
          <tr>
            <td style="background:#1c1917;padding:20px 24px;">
              <div style="color:#e7e5e4;font-size:11px;letter-spacing:0.2em;">ЛІЛА · LEELA</div>
              <div style="color:#fafaf9;font-size:20px;font-weight:600;margin-top:6px;">Результат гри</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 24px 8px 24px;">
              <div style="font-size:12px;font-weight:600;color:#57534e;text-transform:uppercase;letter-spacing:0.1em;">Запит</div>
              <p style="margin:8px 0 0 0;font-size:15px;line-height:1.55;color:#292524;">${escapeHtml(input.playerRequest)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 8px 24px;">
              <div style="font-size:12px;font-weight:600;color:#57534e;text-transform:uppercase;letter-spacing:0.1em;">Хід гри</div>
              <p style="margin:8px 0 0 0;font-size:14px;line-height:1.5;color:#44403c;">${escapeHtml(input.gamePath)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 8px 24px;">
              <div style="font-size:12px;font-weight:600;color:#57534e;text-transform:uppercase;letter-spacing:0.1em;">Переписка з провідником</div>
              <pre style="margin:8px 0 0 0;white-space:pre-wrap;font-size:12px;line-height:1.45;font-family:ui-sans-serif,system-ui,sans-serif;color:#57534e;background:#fafaf9;padding:12px;border-radius:10px;border:1px solid #e7e5e4;">${escapeHtml(input.chatText)}</pre>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 8px 24px;">
              <div style="font-size:12px;font-weight:600;color:#78350f;text-transform:uppercase;letter-spacing:0.1em;">Висновок</div>
              <p style="margin:8px 0 0 0;font-size:15px;line-height:1.55;color:#292524;">${escapeHtml(input.finalSummary).replace(/\n/g, "<br/>")}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px 24px;">
              <div style="font-size:12px;font-weight:600;color:#78350f;text-transform:uppercase;letter-spacing:0.1em;">План дій</div>
              <p style="margin:8px 0 0 0;font-size:15px;line-height:1.55;color:#292524;white-space:pre-wrap;">${escapeHtml(input.actionPlan).replace(/\n/g, "<br/>")}</p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0 0;font-size:11px;color:#a8a29e;">Повідомлення з гри «Ліла»</p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
