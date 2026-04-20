import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { google } from "@ai-sdk/google"
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      // The AI framework string-based model resolution handles gateway pass-through.
      model: google("gemini-2.5-flash"),
      system: "You are a helpful, smart, and concisely polite assistant.",
      messages: await convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error('Error in chat API route:', err);
    return new Response(JSON.stringify({ error: (err as Error).message || 'Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
