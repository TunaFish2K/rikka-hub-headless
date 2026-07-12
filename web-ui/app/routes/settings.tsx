import * as React from "react";
import { useNavigate } from "react-router";
import {
  Bot,
  Brain,
  FileText,
  Globe,
  Link2,
  MessageSquareQuote,
  Mic,
  Puzzle,
  ScrollText,
  Server,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

const settingCategories = [
  {
    title: "Providers",
    description: "Configure AI API providers (OpenAI, Google, Claude, etc.)",
    icon: Puzzle,
    href: "/settings/providers",
  },
  {
    title: "Models",
    description: "Assign models for chat, fast, title, translation, and more",
    icon: Brain,
    href: "/settings/models",
  },
  {
    title: "Custom Prompts",
    description: "Edit system prompt templates for titles, translation, suggestions, OCR, compress",
    icon: ScrollText,
    href: "/settings/prompts",
  },
  {
    title: "Assistants",
    description: "Manage assistant profiles, system prompts, and parameters",
    icon: Bot,
    href: "/settings/assistants",
  },
  {
    title: "MCP Servers",
    description: "Configure MCP (Model Context Protocol) server connections",
    icon: Server,
    href: "/settings/mcp",
  },
  {
    title: "Search Services",
    description: "Configure web search providers and common search options",
    icon: Globe,
    href: "/settings/search",
  },
  {
    title: "Speech",
    description: "Configure TTS (text-to-speech) and ASR (speech recognition) providers",
    icon: Mic,
    href: "/settings/speech",
  },
  {
    title: "Web Server",
    description: "Configure the Ktor web server port, JWT auth, and access control",
    icon: Globe,
    href: "/settings/web",
  },
  {
    title: "Injections",
    description: "Manage mode injections, lorebooks, and quick messages",
    icon: MessageSquareQuote,
    href: "/settings/injections",
  },
  {
    title: "Preferences",
    description: "General app preferences and UI display settings",
    icon: SlidersHorizontal,
    href: "/settings/preferences",
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-center gap-3">
        <Settings2 className="size-8" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your RikkaHub experience</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card
              key={category.href}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => navigate(category.href)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Icon className="size-5 text-muted-foreground" />
                  <CardTitle className="text-base">{category.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">{category.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
