import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
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
  HardDrive,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

const settingCategories = [
  {
    key: "providers",
    icon: Puzzle,
    href: "/settings/providers",
  },
  {
    key: "models",
    icon: Brain,
    href: "/settings/models",
  },
  {
    key: "prompts",
    icon: ScrollText,
    href: "/settings/prompts",
  },
  {
    key: "assistants",
    icon: Bot,
    href: "/settings/assistants",
  },
  {
    key: "mcp",
    icon: Server,
    href: "/settings/mcp",
  },
  {
    key: "search",
    icon: Globe,
    href: "/settings/search",
  },
  {
    key: "speech",
    icon: Mic,
    href: "/settings/speech",
  },
  {
    key: "web",
    icon: Globe,
    href: "/settings/web",
  },
  {
    key: "injections",
    icon: MessageSquareQuote,
    href: "/settings/injections",
  },
  {
    key: "headless",
    icon: HardDrive,
    href: "/settings/headless",
  },
  {
    key: "preferences",
    icon: SlidersHorizontal,
    href: "/settings/preferences",
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("page");

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} aria-label={t("settings.back_home")} title={t("settings.back_home")}>
          <ArrowLeft className="size-5" />
        </Button>
        <Settings2 className="size-8" />
        <div>
          <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("settings.description")}</p>
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
                  <CardTitle className="text-base">{t(`settings.categories.${category.key}.0`)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">{t(`settings.categories.${category.key}.1`)}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
