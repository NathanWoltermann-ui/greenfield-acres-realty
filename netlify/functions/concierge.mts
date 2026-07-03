// AI concierge for the Home-Finder wizard (/api/concierge).
// Without ANTHROPIC_API_KEY it responds { ai: false } and the wizard's
// built-in summary stands alone. With the key set, it returns a short,
// personally written note that the wizard displays on the result step.

export default async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return Response.json({ ai: false });

  let answers: Record<string, unknown> = {};
  try {
    ({ answers = {} } = await req.json());
  } catch {
    return Response.json({ ai: false });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 300,
        system:
          "You are the friendly concierge for Greenfield Acres Realty, Aimee Greenfield's boutique luxury brokerage in Sparta, NC (High Country / Blue Ridge Mountains). " +
          "Given a home-buyer's wizard answers, write ONE warm, specific note of 2–3 sentences (max 60 words): acknowledge what they're looking for, add one genuinely useful local insight about their chosen towns or property style, and say Aimee will follow up personally. " +
          "No greetings, no sign-off, no emojis, no exclamation overload. Do not invent listings, prices, or availability.",
        messages: [{ role: "user", content: `Wizard answers: ${JSON.stringify(answers)}` }],
      }),
    });

    if (!res.ok) {
      console.error(`concierge: Anthropic API ${res.status}`);
      return Response.json({ ai: false });
    }
    const data = await res.json();
    const message = data?.content?.[0]?.text?.trim();
    return Response.json(message ? { ai: true, message } : { ai: false });
  } catch (err) {
    console.error("concierge failed:", err);
    return Response.json({ ai: false });
  }
};

export const config = {
  path: "/api/concierge",
};
