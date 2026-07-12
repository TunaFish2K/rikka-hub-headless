import * as React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ScrollText } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { useSettingsStore } from "~/stores/app-store";
import api from "~/services/api";
import type { Settings } from "~/types";

const DEFAULTS = {
  titlePrompt: "Generate a brief title (max 6 words) for this conversation based on the following messages:",
  translatePrompt: "Translate the following text to {language}:",
  suggestionPrompt: "Suggest 3 follow-up questions based on this conversation:",
  ocrPrompt: "Extract all text from this image:",
  compressPrompt: "Compress the following conversation while preserving key information:",
} as const;

type PromptField = keyof typeof DEFAULTS;

const PROMPT_LABELS: Record<PromptField, string> = {
  titlePrompt: "Title Prompt",
  translatePrompt: "Translate Prompt",
  suggestionPrompt: "Suggestion Prompt",
  ocrPrompt: "OCR Prompt",
  compressPrompt: "Compress Prompt",
};

export default function SettingsPromptsPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore((state) => state.settings);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  if (!settings) return null;

  const [form, setForm] = React.useState<Record<PromptField, string>>({
    titlePrompt: settings.titlePrompt,
    translatePrompt: settings.translatePrompt,
    suggestionPrompt: settings.suggestionPrompt,
    ocrPrompt: settings.ocrPrompt,
    compressPrompt: settings.compressPrompt,
  });

  function handleChange(field: PromptField, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  function handleReset(field: PromptField) {
    handleChange(field, DEFAULTS[field]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch<Settings>("settings", form);
      setSettings({ ...settings!, ...form } as Settings);
      setDirty(false);
      toast.success("Prompts saved");
    } catch {
      toast.error("Failed to save prompts");
    } finally {
      setSaving(false);
    }
  }

  const promptFields = Object.keys(DEFAULTS) as PromptField[];

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-8 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <ArrowLeft className="size-5" />
        </Button>
        <ScrollText className="size-8" />
        <div>
          <h1 className="text-2xl font-bold">Custom Prompts</h1>
          <p className="text-sm text-muted-foreground">Edit system prompt templates</p>
        </div>
      </div>

      <div className="grid gap-6">
        {promptFields.map((field) => (
          <Card key={field}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{PROMPT_LABELS[field]}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReset(field)}
                  disabled={form[field] === DEFAULTS[field] || saving}
                >
                  Reset to Default
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Label htmlFor={field} className="sr-only">{PROMPT_LABELS[field]}</Label>
              <Textarea
                id={field}
                value={form[field]}
                onChange={(e) => handleChange(field, e.target.value)}
                rows={4}
                disabled={saving}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={!dirty || saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
