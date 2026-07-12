import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("c/:id", "routes/c.$id.tsx"),
  route("settings", "routes/settings.tsx"),
  route("settings/providers", "routes/settings.providers.tsx"),
  route("settings/providers/:id", "routes/settings.providers.$id.tsx"),
  route("settings/models", "routes/settings.models.tsx"),
  route("settings/prompts", "routes/settings.prompts.tsx"),
  route("settings/assistants", "routes/settings.assistants.tsx"),
  route("settings/assistants/:id", "routes/settings.assistants.$id.tsx"),
  route("settings/mcp", "routes/settings.mcp.tsx"),
  route("settings/search", "routes/settings.search.tsx"),
  route("settings/speech", "routes/settings.speech.tsx"),
  route("settings/web", "routes/settings.web.tsx"),
  route("settings/injections", "routes/settings.injections.tsx"),
  route("settings/preferences", "routes/settings.preferences.tsx"),
  route("settings/headless", "routes/settings.headless.tsx"),
] satisfies RouteConfig;
