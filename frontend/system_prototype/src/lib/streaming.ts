// Streaming utilities for real-time message updates
import { getFetchOptions } from "@/lib/deviceId";

export interface StreamMessage {
  role: "assistant" | "user";
  content: string;
  delta?: string; // For streaming chunks
  done?: boolean;
}

/**
 * Stream a chat message and handle chunks as they arrive
 */
export async function streamMessage(
  url: string,
  options: RequestInit,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<string> {
  try {
    const fetchOptions = getFetchOptions(options);
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if response is streaming (text/event-stream or application/x-ndjson)
    const contentType = response.headers.get("content-type") || "";
    const isStreaming =
      contentType.includes("text/event-stream") ||
      contentType.includes("application/x-ndjson");

    let fullContent = "";

    if (isStreaming && response.body) {
      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.trim()) continue;

            // Handle SSE format (data: {...})
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.delta) {
                  fullContent += data.delta;
                  onChunk(data.delta);
                }
                if (data.done) {
                  onComplete();
                }
              } catch (e) {
                console.error("Error parsing SSE data:", e);
              }
            }
            // Handle NDJSON format (one JSON per line)
            else {
              try {
                const data = JSON.parse(line);
                if (data.delta) {
                  fullContent += data.delta;
                  onChunk(data.delta);
                }
                if (data.done) {
                  onComplete();
                }
              } catch (e) {
                // Ignore parse errors for non-JSON lines
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } else {
      // Handle non-streaming response (fall back to standard JSON)
      const data = await response.json();
      fullContent = data.content || "";
      onChunk(fullContent);
      onComplete();
    }

    return fullContent;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    onError(err);
    throw err;
  }
}

/**
 * Format a streaming message as it arrives
 */
export function formatStreamingContent(content: string): string {
  return content;
}
