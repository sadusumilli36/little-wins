import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const GEMINI_MODEL = "gemini-3.5-flash-lite";
const MAX_TASK_LENGTH = 120;
const MAX_SUBTASKS = 7;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

function isValidSubtasks(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= MAX_SUBTASKS &&
    value.every(
      (item) =>
        typeof item === "string" &&
        item.trim().length > 0 &&
        item.trim().length <= 200,
    )
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  if (!supabaseUrl || !supabaseKey || !accessToken) {
    return NextResponse.json(
      { error: "You must be signed in to generate steps." },
      { status: 401 },
    );
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    return NextResponse.json(
      { error: "Your session has expired. Please sign in again." },
      { status: 401 },
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini is not configured yet. Add GEMINI_API_KEY to .env.local." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a task name to generate steps." }, { status: 400 });
  }

  const taskName =
    typeof body === "object" &&
    body !== null &&
    "task" in body &&
    typeof body.task === "string"
      ? body.task.trim()
      : "";

  if (!taskName || taskName.length > MAX_TASK_LENGTH) {
    return NextResponse.json(
      { error: "Enter a task name before generating steps." },
      { status: 400 },
    );
  }

  const prompt = `Create a short list of actionable subtasks for this task: "${taskName}".

Guidelines:
- Make the steps appropriate for people with cognitive disabilities, including autism and ADHD.
- Break larger tasks into small, concrete, actionable steps.
- Use clear, literal language. Avoid vague instructions, idioms, unnecessary complexity, and overwhelming lists.
- Keep each step focused on one main action.
- Use a logical order when needed.
- Return approximately 2 to 7 steps based on the task's complexity.
- Use encouraging, neutral language.
- Return only the JSON array of step strings. Do not include numbering, markdown, or extra text.`;

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: { type: "STRING" },
              minItems: 2,
              maxItems: MAX_SUBTASKS,
            },
          },
        }),
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not connect to Gemini. Please try again." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    let providerMessage = "";
    try {
      const providerResult = (await response.json()) as GeminiResponse;
      providerMessage = providerResult.error?.message ?? "";
    } catch {
      // Keep the user-facing error generic when Gemini does not return JSON.
    }

    return NextResponse.json(
      {
        error: providerMessage
          ? `Gemini could not generate steps: ${providerMessage}`
          : `Gemini could not generate steps (HTTP ${response.status}). Please try again.`,
      },
      { status: 502 },
    );
  }

  let result: GeminiResponse;
  try {
    result = (await response.json()) as GeminiResponse;
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = text ? JSON.parse(text) : null;
    if (!isValidSubtasks(parsed)) throw new Error("Invalid Gemini output");

    return NextResponse.json({
      subtasks: parsed.map((subtask) => subtask.trim()),
    });
  } catch {
    return NextResponse.json(
      { error: "Gemini returned steps in an unexpected format. Please try again." },
      { status: 502 },
    );
  }
}
