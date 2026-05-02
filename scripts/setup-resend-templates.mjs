import templates from "../lib/resendTemplates.json" with { type: "json" };

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL || "Tu dia de blanco <onboarding@resend.dev>";
const baseUrl = "https://api.resend.com";

if (!apiKey) {
  console.error("Missing RESEND_API_KEY.");
  process.exit(1);
}

async function resend(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "wedsite-app/1.0",
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function getTemplate(alias) {
  const response = await fetch(`${baseUrl}/templates/${alias}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "wedsite-app/1.0",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }

  return response.json();
}

for (const template of templates) {
  const payload = {
    ...template,
    from,
  };
  const existing = await getTemplate(template.alias);
  const result = existing
    ? await resend(`/templates/${template.alias}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    : await resend("/templates", {
        method: "POST",
        body: JSON.stringify(payload),
      });

  await resend(`/templates/${template.alias}/publish`, {
    method: "POST",
  });

  console.log(`${existing ? "Updated" : "Created"} and published ${template.alias}`);
  console.log(`Template id: ${result.id}`);
}
