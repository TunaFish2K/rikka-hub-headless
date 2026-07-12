import * as React from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Puzzle, Save, Trash2 } from "lucide-react";
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

  const [name, setName] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");
  const [baseUrl, setBaseUrl] = React.useState("");
  const [enabled, setEnabled] = React.useState(true);
  const [models, setModels] = React.useState<ProviderModel[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [deleteModelTarget, setDeleteModelTarget] = React.useState<ProviderModel | null>(null);

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Models ({models.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <p className="text-sm text-muted-foreground">No models configured for this provider.</p>
          ) : (
            <div className="space-y-2">
              {models.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between rounded-lg border p-4"
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
                    onClick={() => setDeleteModelTarget(model)}
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
    </div>
  );
}
