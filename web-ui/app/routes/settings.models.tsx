import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ArrowLeft, Brain } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { useSettingsStore } from "~/stores/app-store";
import api from "~/services/api";
import type { Settings } from "~/types";

const NONE_MODEL_VALUE = "__none__";

function getAllModels(type?: string): { id: string; label: string; providerName: string }[] {
  const settings = useSettingsStore.getState().settings;
  if (!settings) return [];
  return settings.providers.flatMap(p =>
    (p.models || [])
      .filter(m => !type || m.type === type)
      .map(m => ({
        id: m.id,
        label: `${m.displayName} (${p.name})`,
        providerName: p.name,
      }))
  );
}

export default function SettingsModelsPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore((state) => state.settings);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const [saving, setSaving] = React.useState(false);
  const { t } = useTranslation("page");

  if (!settings) return null;

  const chatModels = getAllModels("CHAT");
  const imageModels = getAllModels("IMAGE");

  async function handleChange(field: string, value: unknown) {
    setSettings({ ...settings!, [field]: value } as Settings);
    setSaving(true);
    try {
      await api.patch<Settings>("settings", { [field]: value });
      toast.success(t("settings.models.updated"));
    } catch {
      setSettings(settings!);
      toast.error(t("settings.models.update_failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-8 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <ArrowLeft className="size-5" />
        </Button>
        <Brain className="size-8" />
        <div>
          <h1 className="text-2xl font-bold">{t("settings.models.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("settings.models.description")}</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.models.chat.0")}</CardTitle>
            <CardDescription>{t("settings.models.chat.1")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.chatModelId}
              onValueChange={(v) => handleChange("chatModelId", v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("settings.models.select")} />
              </SelectTrigger>
              <SelectContent>
                {chatModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.models.fast.0")}</CardTitle>
            <CardDescription>{t("settings.models.fast.1")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.fastModelId}
              onValueChange={(v) => handleChange("fastModelId", v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("settings.models.select")} />
              </SelectTrigger>
              <SelectContent>
                {chatModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.models.title_model.0")}</CardTitle>
            <CardDescription>{t("settings.models.title_model.1")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.titleModelId ?? NONE_MODEL_VALUE}
              onValueChange={(v) => handleChange("titleModelId", v === NONE_MODEL_VALUE ? null : v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("settings.models.select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_MODEL_VALUE}>{t("settings.models.none")}</SelectItem>
                {chatModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.models.translate.0")}</CardTitle>
            <CardDescription>{t("settings.models.translate.1")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.translateModeId}
              onValueChange={(v) => handleChange("translateModeId", v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("settings.models.select")} />
              </SelectTrigger>
              <SelectContent>
                {chatModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.models.suggestion.0")}</CardTitle>
            <CardDescription>{t("settings.models.suggestion.1")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.suggestionModelId ?? NONE_MODEL_VALUE}
              onValueChange={(v) => handleChange("suggestionModelId", v === NONE_MODEL_VALUE ? null : v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("settings.models.select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_MODEL_VALUE}>{t("settings.models.none")}</SelectItem>
                {chatModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.models.image.0")}</CardTitle>
            <CardDescription>{t("settings.models.image.1")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.imageGenerationModelId}
              onValueChange={(v) => handleChange("imageGenerationModelId", v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("settings.models.select")} />
              </SelectTrigger>
              <SelectContent>
                {imageModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.models.ocr.0")}</CardTitle>
            <CardDescription>{t("settings.models.ocr.1")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.ocrModelId}
              onValueChange={(v) => handleChange("ocrModelId", v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("settings.models.select")} />
              </SelectTrigger>
              <SelectContent>
                {chatModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.models.compress.0")}</CardTitle>
            <CardDescription>{t("settings.models.compress.1")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.compressModelId}
              onValueChange={(v) => handleChange("compressModelId", v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("settings.models.select")} />
              </SelectTrigger>
              <SelectContent>
                {chatModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.models.web_search.0")}</CardTitle>
            <CardDescription>{t("settings.models.web_search.1")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.enableWebSearch}
                onCheckedChange={(v) => handleChange("enableWebSearch", v)}
                disabled={saving}
              />
              <Label>{t("settings.models.web_search.0")}</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("settings.models.suggestions.0")}</CardTitle>
            <CardDescription>{t("settings.models.suggestions.1")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.enableSuggestion}
                onCheckedChange={(v) => handleChange("enableSuggestion", v)}
                disabled={saving}
              />
              <Label>{t("settings.models.suggestions.0")}</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
