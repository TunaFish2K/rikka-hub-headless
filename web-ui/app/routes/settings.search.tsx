import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ArrowLeft, Globe, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { useSettingsStore } from "~/stores/app-store";
import api from "~/services/api";
import type { Settings, SearchServiceOption } from "~/types";

const SEARCH_TYPES = [
  "tavily",
  "exa",
  "zhipu",
  "bing_local",
  "searxng",
  "linkup",
  "brave",
  "metaso",
  "ollama",
  "perplexity",
  "firecrawl",
  "jina",
  "bocha",
  "rikkahub",
  "grok",
  "tinyfish",
  "serper",
  "custom_js",
];

const SEARCH_FIELDS: Record<string, Array<{ key: string; label: string; secret?: boolean; multiline?: boolean; number?: boolean }>> = {
  zhipu: [{ key: "apiKey", label: "API Key", secret: true }],
  tavily: [{ key: "apiKey", label: "API Key", secret: true }, { key: "depth", label: "Depth" }],
  exa: [{ key: "apiKey", label: "API Key", secret: true }],
  searxng: [{ key: "url", label: "URL" }, { key: "engines", label: "Engines" }, { key: "language", label: "Language" }, { key: "username", label: "Username" }, { key: "password", label: "Password", secret: true }],
  linkup: [{ key: "apiKey", label: "API Key", secret: true }, { key: "depth", label: "Depth" }],
  brave: [{ key: "apiKey", label: "API Key", secret: true }], metaso: [{ key: "apiKey", label: "API Key", secret: true }], ollama: [{ key: "apiKey", label: "API Key", secret: true }],
  perplexity: [{ key: "apiKey", label: "API Key", secret: true }, { key: "maxTokens", label: "Max Tokens", number: true }, { key: "maxTokensPerPage", label: "Max Tokens Per Page", number: true }],
  firecrawl: [{ key: "apiKey", label: "API Key", secret: true }],
  jina: [{ key: "apiKey", label: "API Key", secret: true }, { key: "searchUrl", label: "Search URL" }, { key: "scrapeUrl", label: "Scrape URL" }],
  bocha: [{ key: "apiKey", label: "API Key", secret: true }, { key: "summary", label: "Summary" }],
  rikkahub: [{ key: "apiKey", label: "API Key", secret: true }, { key: "depth", label: "Depth" }],
  grok: [{ key: "apiKey", label: "API Key", secret: true }, { key: "model", label: "Model" }, { key: "customUrl", label: "Custom URL" }, { key: "systemPrompt", label: "System Prompt", multiline: true }],
  tinyfish: [{ key: "apiKey", label: "API Key", secret: true }], serper: [{ key: "apiKey", label: "API Key", secret: true }],
  custom_js: [{ key: "name", label: "Name" }, { key: "searchScript", label: "Search Script", multiline: true }, { key: "scrapeScript", label: "Scrape Script", multiline: true }],
};

export default function SettingsSearchPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("page");
  const settings = useSettingsStore((state) => state.settings);
  const setSettings = useSettingsStore((state) => state.setSettings);

  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [newType, setNewType] = React.useState("tavily");
  const [newApiKey, setNewApiKey] = React.useState("");
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, SearchServiceOption>>({});

  const searchServices = settings?.searchServices ?? [];
  const searchSelected = settings?.searchServiceSelected ?? 0;
  const commonOptions = settings?.searchCommonOptions ?? { resultSize: 10 };

  const handleSave = async (partial: Partial<Settings>) => {
    try {
      const currentSettings = useSettingsStore.getState().settings;
      if (!currentSettings) return;
      const merged = { ...currentSettings, ...partial };
      await api.patch("settings", merged);
      setSettings(merged as Settings);
      toast.success("Saved");
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleAddService = async () => {
    const newService: SearchServiceOption = {
      id: crypto.randomUUID(),
      type: newType,
      apiKey: newApiKey || undefined,
    };
    const updated = [...searchServices, newService];
    await handleSave({ searchServices: updated });
    setAddDialogOpen(false);
    setNewType("tavily");
    setNewApiKey("");
  };

  const handleDeleteService = async (id: string) => {
    const updated = searchServices.filter((s) => s.id !== id);
    const newSelected = updated.length > 0
      ? Math.min(searchSelected, updated.length - 1)
      : 0;
    await handleSave({
      searchServices: updated,
      searchServiceSelected: newSelected,
    });
    setDeleteConfirmId(null);
  };

  const handleSelectService = async (index: number) => {
    await handleSave({ searchServiceSelected: index });
  };

  const getDraft = (service: SearchServiceOption) => drafts[service.id] ?? service;
  const updateDraft = (service: SearchServiceOption, key: string, value: unknown) => {
    setDrafts((current) => ({ ...current, [service.id]: { ...getDraft(service), [key]: value } }));
  };
  const saveService = async (service: SearchServiceOption) => {
    const updatedService = getDraft(service);
    await handleSave({ searchServices: searchServices.map((item) => item.id === service.id ? updatedService : item) });
    setDrafts((current) => { const next = { ...current }; delete next[service.id]; return next; });
  };

  const handleCommonOptionsChange = async (resultSize: number) => {
    await handleSave({
      searchCommonOptions: { ...commonOptions, resultSize },
    });
  };

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <ArrowLeft className="size-4" />
        </Button>
        <Globe className="size-6" />
        <h1 className="text-xl font-bold">Search Services</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Common Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Result Size</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={commonOptions.resultSize}
              onChange={(e) => handleCommonOptionsChange(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Services ({searchServices.length})</h2>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 size-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Search Service</DialogTitle>
              <DialogDescription>Configure a new web search provider.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEARCH_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="Optional API key"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddService}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {searchServices.length === 0 ? (
        <div className="rounded-md border border-dashed px-6 py-12 text-center text-sm text-muted-foreground">
          No search services configured. Add one to enable web search.
        </div>
      ) : (
        <div className="space-y-3">
          {searchServices.map((service, index) => (
            <Card
              key={service.id}
              className={`${index === searchSelected ? "ring-1 ring-primary" : ""}`}
            >
              <CardContent className="space-y-4 p-4">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant={index === searchSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSelectService(index)}
                  >
                    {index === searchSelected ? "Selected" : "Select"}
                  </Button>
                  <div>
                    <p className="text-sm font-medium">
                      {service.type || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.apiKey ? "API key configured" : "No API key"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog
                    open={deleteConfirmId === service.id}
                    onOpenChange={(open) => {
                      if (!open) setDeleteConfirmId(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteConfirmId(service.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Service</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this search service?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                </div>
                {(SEARCH_FIELDS[service.type ?? ""] ?? []).length > 0 && <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
                  {(SEARCH_FIELDS[service.type ?? ""] ?? []).map((field) => {
                    const draft = getDraft(service) as Record<string, unknown>;
                    const label = t(`settings.search_fields.${field.key}`, { defaultValue: field.label });
                    if (field.key === "summary") return <div key={field.key} className="flex items-center justify-between rounded border p-3"><Label>{label}</Label><Switch checked={draft[field.key] !== false} onCheckedChange={(value) => updateDraft(service, field.key, value)} /></div>;
                    return <div key={field.key} className={`grid gap-2 ${field.multiline ? "sm:col-span-2" : ""}`}><Label>{label}</Label>{field.multiline ? <textarea className="min-h-32 rounded-md border bg-background p-3 font-mono text-xs" value={String(draft[field.key] ?? "")} onChange={(event) => updateDraft(service, field.key, event.target.value)} /> : <Input type={field.secret ? "password" : field.number ? "number" : "text"} value={String(draft[field.key] ?? "")} onChange={(event) => updateDraft(service, field.key, field.number ? (event.target.value ? Number(event.target.value) : null) : event.target.value)} />}</div>;
                  })}
                  <div className="flex justify-end sm:col-span-2"><Button size="sm" onClick={() => saveService(service)} disabled={!drafts[service.id]}><Save className="mr-1 size-4" />Save Service</Button></div>
                </div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
