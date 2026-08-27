import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/health")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          ok: true,
          service: "lock",
          ai_configured: Boolean(process.env["LOVABLE_API_KEY"]),
          model: "google/gemini-3.7-flash",
          time: new Date().toISOString(),
        });
      },
    },
  },
});
