import * as React from "react";
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

  if (!settings) return null;

  const chatModels = getAllModels("CHAT");
  const imageModels = getAllModels("IMAGE");

  async function handleChange(field: string, value: unknown) {
    setSettings({ ...settings!, [field]: value } as Settings);
    setSaving(true);
    try {
      await api.patch<Settings>("settings", { [field]: value });
      toast.success("Model assignment updated");
    } catch {
      setSettings(settings!);
      toast.error("Failed to update model assignment");
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
          <h1 className="text-2xl font-bold">Models</h1>
          <p className="text-sm text-muted-foreground">Assign models for different tasks</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chat Model</CardTitle>
            <CardDescription>Primary model used for conversation</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.chatModelId}
              onValueChange={(v) => handleChange("chatModelId", v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
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
            <CardTitle className="text-base">Fast Model</CardTitle>
            <CardDescription>Lightweight model for quick responses</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.fastModelId}
              onValueChange={(v) => handleChange("fastModelId", v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
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
            <CardTitle className="text-base">Title Model</CardTitle>
            <CardDescription>Model used for auto-generating conversation titles</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.titleModelId ?? ""}
              onValueChange={(v) => handleChange("titleModelId", v || null)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {chatModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Translate Model</CardTitle>
            <CardDescription>Model used for translation tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.translateModeId}
              onValueChange={(v) => handleChange("translateModeId", v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
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
            <CardTitle className="text-base">Suggestion Model</CardTitle>
            <CardDescription>Model used for generating follow-up suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.suggestionModelId ?? ""}
              onValueChange={(v) => handleChange("suggestionModelId", v || null)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {chatModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Image Generation Model</CardTitle>
            <CardDescription>Model used for generating images</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.imageGenerationModelId}
              onValueChange={(v) => handleChange("imageGenerationModelId", v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
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
            <CardTitle className="text-base">OCR Model</CardTitle>
            <CardDescription>Model used for optical character recognition</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.ocrModelId}
              onValueChange={(v) => handleChange("ocrModelId", v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
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
            <CardTitle className="text-base">Compress Model</CardTitle>
            <CardDescription>Model used for compressing conversation context</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={settings.compressModelId}
              onValueChange={(v) => handleChange("compressModelId", v)}
              disabled={saving}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a model" />
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
            <CardTitle className="text-base">Web Search</CardTitle>
            <CardDescription>Enable web search capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.enableWebSearch}
                onCheckedChange={(v) => handleChange("enableWebSearch", v)}
                disabled={saving}
              />
              <Label>Enable Web Search</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggestions</CardTitle>
            <CardDescription>Enable follow-up question suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.enableSuggestion}
                onCheckedChange={(v) => handleChange("enableSuggestion", v)}
                disabled={saving}
              />
              <Label>Enable Suggestions</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
