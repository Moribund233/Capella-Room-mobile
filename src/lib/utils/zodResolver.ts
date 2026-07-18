/**
 * Zod v4 adapter for @hookform/resolvers.
 *
 * @hookform/resolvers hasn't updated its types for Zod v4 yet,
 * so we wrap the original resolver to silence the type mismatch.
 * Runtime behavior is fully compatible.
 */
import { zodResolver as originalResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

export function zodResolver(schema: z.ZodType<any, any, any>) {
  return originalResolver(schema as any);
}
