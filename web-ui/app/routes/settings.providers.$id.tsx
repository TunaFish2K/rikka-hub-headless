import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Plus, Puzzle, Save, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "sonner";
import { useSettingsStore } from "~/stores/app-store";
import api from "~/services/api";
import type { ProviderModel, ProviderProfile, Settings } from "~/types";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  google: "Google",
  claude: "Claude",
};

const MODEL_TYPE_LABELS: Record<string, string> = {
  CHAT: "Chat",
  IMAGE: "Image",
  EMBEDDING: "Embedding",
};

const MODEL_TYPE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  CHAT: "default",
  IMAGE: "secondary",
  EMBEDDING: "outline",
};

const ABILITY_COLORS: Record<string, string> = {
  TOOL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  REASONING: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export default function SettingsProviderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const settings = useSettingsStore((state) => state.settings);
  const { t } = useTranslation("page");

  const [name, setName] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");
  const [baseUrl, setBaseUrl] = React.useState("");
  const [enabled, setEnabled] = React.useState(true);
  const [advanced, setAdvanced] = React.useState<Record<string, unknown>>({});
  const [models, setModels] = React.useState<ProviderModel[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [deleteModelTarget, setDeleteModelTarget] = React.useState<ProviderModel | null>(null);
  const [editModelTarget, setEditModelTarget] = React.useState<ProviderModel | null>(null);
  const [modelDialogOpen, setModelDialogOpen] = React.useState(false);
  const [modelDraft, setModelDraft] = React.useState<ProviderModel>({ id: "", modelId: "", displayName: "", type: "CHAT", inputModalities: ["TEXT"], outputModalities: ["TEXT"], abilities: [], tools: [] });

  const provider = React.useMemo(() => {
    return settings?.providers.find((p) => p.id === id) ?? null;
  }, [settings, id]);

  React.useEffect(() => {
    if (provider) {
      setName(provider.name);
      setApiKey(provider.apiKey ?? "");
      setBaseUrl(provider.baseUrl ?? "");
      setEnabled(provider.enabled);
      setModels(provider.models);
      setAdvanced({
        chatCompletionsPath: provider.chatCompletionsPath ?? "/chat/completions", useResponseApi: provider.useResponseApi ?? false, includeHistoryReasoning: provider.includeHistoryReasoning ?? true,
        vertexAI: provider.vertexAI ?? false, useServiceAccount: provider.useServiceAccount ?? false, privateKey: provider.privateKey ?? "", serviceAccountEmail: provider.serviceAccountEmail ?? "", location: provider.location ?? "us-central1", projectId: provider.projectId ?? "",
        promptCaching: provider.promptCaching ?? false, promptCacheTtl: provider.promptCacheTtl ?? "5m",
        balanceOption: provider.balanceOption ?? { enabled: false, apiPath: "/credits", resultPath: "data.total_usage" },
      });
    }
  }, [provider]);

  const patchSettings = async (partial: Partial<Settings>) => {
    await api.patch("settings", partial);
  };

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings/providers")}>
            <ArrowLeft className="size-4" />
          </Button>
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings/providers")}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-bold">Provider not found</h1>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Puzzle className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              The provider you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/settings/providers")}>
              Back to Providers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const updatedProvider: ProviderProfile = {
        ...provider,
        name: name.trim(),
        apiKey: apiKey.trim() || provider.apiKey,
        baseUrl: baseUrl.trim() || provider.baseUrl,
        enabled,
        models,
        ...advanced,
      };
      const updatedProviders = settings.providers.map((p) =>
        p.id === provider.id ? updatedProvider : p,
      );
      await patchSettings({ providers: updatedProviders });
      useSettingsStore.getState().setSettings({ ...settings, providers: updatedProviders });
      toast.success("Provider saved");
    } catch {
      toast.error("Failed to save provider");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModel = async () => {
    if (!deleteModelTarget) return;
    const updatedModels = models.filter((m) => m.id !== deleteModelTarget.id);
    setModels(updatedModels);
    try {
      const updatedProvider: ProviderProfile = {
        ...provider,
        apiKey: apiKey.trim() || provider.apiKey,
        baseUrl: baseUrl.trim() || provider.baseUrl,
        enabled,
        models: updatedModels,
      };
      const updatedProviders = settings.providers.map((p) =>
        p.id === provider.id ? updatedProvider : p,
      );
      await patchSettings({ providers: updatedProviders });
      useSettingsStore.getState().setSettings({ ...settings, providers: updatedProviders });
      toast.success("Model deleted");
      setDeleteModelTarget(null);
    } catch {
      toast.error("Failed to delete model");
      setModels(provider.models);
    }
  };

  const openModelEditor = (model?: ProviderModel) => {
    setEditModelTarget(model ?? null);
    setModelDraft(model ? structuredClone(model) : { id: crypto.randomUUID(), modelId: "", displayName: "", type: "CHAT", inputModalities: ["TEXT"], outputModalities: ["TEXT"], abilities: [], tools: [] });
    setModelDialogOpen(true);
  };

  const saveModelDraft = () => {
    if (!modelDraft.modelId.trim() || !modelDraft.displayName.trim()) {
      toast.error(t("settings.provider_detail.model_required"));
      return;
    }
    setModels((current) => editModelTarget ? current.map((model) => model.id === editModelTarget.id ? modelDraft : model) : [...current, modelDraft]);
    setModelDialogOpen(false);
  };

  const toggleModelListValue = (field: "inputModalities" | "outputModalities" | "abilities", value: string) => {
    setModelDraft((current) => {
      const values = (current[field] ?? []) as string[];
      return { ...current, [field]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] };
    });
  };

  const toggleBuiltInTool = (type: string) => {
    setModelDraft((current) => {
      const tools = current.tools ?? [];
      return { ...current, tools: tools.some((tool) => tool.type === type) ? tools.filter((tool) => tool.type !== type) : [...tools, { type }] };
    });
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings/providers")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{provider.name}</h1>
            <p className="text-sm text-muted-foreground">Provider configuration</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Type</label>
            <Input value={PROVIDER_LABELS[provider.type] ?? provider.type} readOnly className="bg-muted" />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">API Key</label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider.apiKey ? "••••••••" : "Enter API key"}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Base URL</label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Enabled</label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">{t("settings.provider_detail.advanced")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          {provider.type === "openai" && <>
            <div className="grid gap-2"><label className="text-sm font-medium">{t("settings.provider_detail.chat_path")}</label><Input value={String(advanced.chatCompletionsPath ?? "")} onChange={(e) => setAdvanced((v) => ({ ...v, chatCompletionsPath: e.target.value }))} /></div>
            <div className="flex items-center justify-between"><label className="text-sm font-medium">{t("settings.provider_detail.responses_api")}</label><Switch checked={Boolean(advanced.useResponseApi)} onCheckedChange={(value) => setAdvanced((v) => ({ ...v, useResponseApi: value }))} /></div>
            <div className="flex items-center justify-between"><label className="text-sm font-medium">{t("settings.provider_detail.history_reasoning")}</label><Switch checked={Boolean(advanced.includeHistoryReasoning)} onCheckedChange={(value) => setAdvanced((v) => ({ ...v, includeHistoryReasoning: value }))} /></div>
          </>}
          {provider.type === "google" && <>
            <div className="flex items-center justify-between"><label className="text-sm font-medium">{t("settings.provider_detail.vertex")}</label><Switch checked={Boolean(advanced.vertexAI)} onCheckedChange={(value) => setAdvanced((v) => ({ ...v, vertexAI: value }))} /></div>
            <div className="flex items-center justify-between"><label className="text-sm font-medium">{t("settings.provider_detail.service_account")}</label><Switch checked={Boolean(advanced.useServiceAccount)} onCheckedChange={(value) => setAdvanced((v) => ({ ...v, useServiceAccount: value }))} /></div>
            {Boolean(advanced.useServiceAccount) && <><div className="grid gap-2"><label className="text-sm font-medium">Project ID</label><Input value={String(advanced.projectId ?? "")} onChange={(e) => setAdvanced((v) => ({ ...v, projectId: e.target.value }))} /></div><div className="grid gap-2"><label className="text-sm font-medium">Location</label><Input value={String(advanced.location ?? "")} onChange={(e) => setAdvanced((v) => ({ ...v, location: e.target.value }))} /></div><div className="grid gap-2"><label className="text-sm font-medium">Service Account Email</label><Input value={String(advanced.serviceAccountEmail ?? "")} onChange={(e) => setAdvanced((v) => ({ ...v, serviceAccountEmail: e.target.value }))} /></div><div className="grid gap-2"><label className="text-sm font-medium">Private Key</label><textarea className="min-h-32 rounded-md border bg-background p-3 font-mono text-xs" value={String(advanced.privateKey ?? "")} onChange={(e) => setAdvanced((v) => ({ ...v, privateKey: e.target.value }))} /></div></>}
          </>}
          {provider.type === "claude" && <>
            <div className="flex items-center justify-between"><label className="text-sm font-medium">{t("settings.provider_detail.prompt_cache")}</label><Switch checked={Boolean(advanced.promptCaching)} onCheckedChange={(value) => setAdvanced((v) => ({ ...v, promptCaching: value }))} /></div>
            <div className="grid gap-2"><label className="text-sm font-medium">{t("settings.provider_detail.cache_ttl")}</label><select className="h-9 rounded-md border bg-background px-3" value={String(advanced.promptCacheTtl ?? "5m")} onChange={(e) => setAdvanced((v) => ({ ...v, promptCacheTtl: e.target.value }))}><option value="5m">{t("settings.provider_detail.five_minutes")}</option><option value="1h">{t("settings.provider_detail.one_hour")}</option></select></div>
          </>}
          <div className="flex items-center justify-between"><label className="text-sm font-medium">{t("settings.provider_detail.balance")}</label><Switch checked={Boolean((advanced.balanceOption as { enabled?: boolean } | undefined)?.enabled)} onCheckedChange={(value) => setAdvanced((v) => ({ ...v, balanceOption: { ...(v.balanceOption as object), enabled: value } }))} /></div>
          {Boolean((advanced.balanceOption as { enabled?: boolean } | undefined)?.enabled) && <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-medium">Balance API Path</label><Input value={String((advanced.balanceOption as { apiPath?: string }).apiPath ?? "")} onChange={(e) => setAdvanced((v) => ({ ...v, balanceOption: { ...(v.balanceOption as object), apiPath: e.target.value } }))} /></div><div className="grid gap-2"><label className="text-sm font-medium">Result JSON Path</label><Input value={String((advanced.balanceOption as { resultPath?: string }).resultPath ?? "")} onChange={(e) => setAdvanced((v) => ({ ...v, balanceOption: { ...(v.balanceOption as object), resultPath: e.target.value } }))} /></div></div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between"><CardTitle className="text-base">Models ({models.length})</CardTitle><Button size="sm" variant="outline" onClick={() => openModelEditor()}><Plus className="mr-1 size-4" />{t("settings.provider_detail.add_model")}</Button></div>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <p className="text-sm text-muted-foreground">No models configured for this provider.</p>
          ) : (
            <div className="space-y-2">
              {models.map((model) => (
                <div
                  key={model.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-accent"
                  onClick={() => openModelEditor(model)}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.displayName}</span>
                      <Badge variant={MODEL_TYPE_VARIANTS[model.type] ?? "outline"}>
                        {MODEL_TYPE_LABELS[model.type] ?? model.type}
                      </Badge>
                    </div>
                    <code className="text-xs text-muted-foreground">{model.modelId}</code>
                    <div className="flex flex-wrap gap-1.5">
                      {model.abilities?.map((ability) => (
                        <span
                          key={ability}
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ABILITY_COLORS[ability] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"}`}
                        >
                          {ability === "TOOL" ? "Tool Use" : ability}
                        </span>
                      ))}
                      {model.tools?.map((tool) => (
                        <span
                          key={tool.type ?? "unknown"}
                          className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium"
                        >
                          {tool.type ?? "tool"}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-destructive"
                    onClick={(event) => { event.stopPropagation(); setDeleteModelTarget(model); }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!deleteModelTarget}
        onOpenChange={(open) => !open && setDeleteModelTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Model</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteModelTarget?.displayName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModelTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteModel}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{t(editModelTarget ? "settings.provider_detail.edit_model" : "settings.provider_detail.add_model")}</DialogTitle><DialogDescription>{t("settings.provider_detail.model_desc")}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2 sm:grid-cols-2"><div className="grid gap-2"><label className="text-sm font-medium">{t("settings.provider_detail.model_id")}</label><Input value={modelDraft.modelId} onChange={(e) => setModelDraft((v) => ({ ...v, modelId: e.target.value }))} /></div><div className="grid gap-2"><label className="text-sm font-medium">{t("settings.provider_detail.display_name")}</label><Input value={modelDraft.displayName} onChange={(e) => setModelDraft((v) => ({ ...v, displayName: e.target.value }))} /></div></div>
            <div className="grid gap-2"><label className="text-sm font-medium">Model Type</label><select className="h-9 rounded-md border bg-background px-3" value={modelDraft.type} onChange={(e) => setModelDraft((v) => ({ ...v, type: e.target.value as ProviderModel["type"] }))}><option value="CHAT">Chat</option><option value="IMAGE">Image</option><option value="EMBEDDING">Embedding</option></select></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label className="text-sm font-medium">Input Modalities</label>{["TEXT", "IMAGE"].map((value) => <label key={value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={modelDraft.inputModalities?.includes(value as "TEXT" | "IMAGE")} onChange={() => toggleModelListValue("inputModalities", value)} />{value}</label>)}</div><div className="space-y-2"><label className="text-sm font-medium">Output Modalities</label>{["TEXT", "IMAGE"].map((value) => <label key={value} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={modelDraft.outputModalities?.includes(value as "TEXT" | "IMAGE")} onChange={() => toggleModelListValue("outputModalities", value)} />{value}</label>)}</div></div>
            <div className="space-y-2"><label className="text-sm font-medium">Abilities</label>{["TOOL", "REASONING"].map((value) => <label key={value} className="mr-6 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={modelDraft.abilities?.includes(value as "TOOL" | "REASONING")} onChange={() => toggleModelListValue("abilities", value)} />{value}</label>)}</div>
            <div className="space-y-2"><label className="text-sm font-medium">Built-in Tools</label>{["search", "url_context", "image_generation"].map((value) => <label key={value} className="mr-6 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={modelDraft.tools?.some((tool) => tool.type === value)} onChange={() => toggleBuiltInTool(value)} />{value}</label>)}</div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModelDialogOpen(false)}>Cancel</Button><Button onClick={saveModelDraft}>{t("settings.provider_detail.apply")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
