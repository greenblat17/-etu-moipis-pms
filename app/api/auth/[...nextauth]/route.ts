import { handlers } from "@/lib/auth";

// Принудительно используем Node.js runtime вместо Edge
export const runtime = "nodejs";

export const { GET, POST } = handlers;

