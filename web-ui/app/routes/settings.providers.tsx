import * as React from "react";
import { useNavigate } from "react-router";
import { Plus, Puzzle, Trash2, ArrowLeft } from "lucide-react";
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
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty";
import { toast } from "sonner";
import { useSettingsStore } from "~/stores/app-store";
import api from "~/services/api";
import type { ProviderProfile, Settings } from "~/types";

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  google: "Google",
  claude: "Claude",
};

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  google: "https://generativelanguage.googleapis.com",
  claude: "https://api.anthropic.com",
};

function generateId(): string {
  return crypto.randomUUID();
}

export default function SettingsProvidersPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore((state) => state.settings);
  const providers = settings?.providers ?? [];

  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [addType, setAddType] = React.useState("openai");
  const [addName, setAddName] = React.useState("");
  const [addApiKey, setAddApiKey] = React.useState("");
  const [addBaseUrl, setAddBaseUrl] = React.useState(DEFAULT_BASE_URLS["openai"]);
  const [deleteTarget, setDeleteTarget] = React.useState<ProviderProfile | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setAddBaseUrl(DEFAULT_BASE_URLS[addType] ?? "");
  }, [addType]);

  const patchSettings = async (partial: Partial<Settings>) => {
    await api.patch("settings", partial);
  };

  const handleAddProvider = async () => {
    if (!addName.trim() || !addApiKey.trim()) {
      toast.error("Name and API Key are required");
      return;
    }
    setSaving(true);
    try {
      const newProvider: ProviderProfile = {
        id: generateId(),
        type: addType,
        name: addName.trim(),
        apiKey: addApiKey.trim(),
        baseUrl: addBaseUrl.trim() || DEFAULT_BASE_URLS[addType] || "",
        enabled: true,
        models: [],
      };
      const updatedProviders = [...providers, newProvider];
      await patchSettings({ providers: updatedProviders });
      useSettingsStore.getState().setSettings({ ...settings!, providers: updatedProviders });
      toast.success("Provider added");
      setAddDialogOpen(false);
      setAddName("");
      setAddApiKey("");
      setAddBaseUrl(DEFAULT_BASE_URLS[addType] ?? "");
    } catch {
      toast.error("Failed to add provider");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProvider = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const updatedProviders = providers.filter((p) => p.id !== deleteTarget.id);
      await patchSettings({ providers: updatedProviders });
      useSettingsStore.getState().setSettings({ ...settings!, providers: updatedProviders });
      toast.success("Provider deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete provider");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (provider: ProviderProfile, enabled: boolean) => {
    try {
      const updatedProviders = providers.map((p) =>
        p.id === provider.id ? { ...p, enabled } : p,
      );
      await patchSettings({ providers: updatedProviders });
      useSettingsStore.getState().setSettings({ ...settings!, providers: updatedProviders });
    } catch {
      toast.error("Failed to update provider");
    }
  };

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-bold">AI Providers</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">AI Providers</h1>
            <p className="text-sm text-muted-foreground">Manage your AI API provider configurations</p>
          </div>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Provider</DialogTitle>
              <DialogDescription>Configure a new AI API provider</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={addType} onValueChange={setAddType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="My Provider" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="password"
                  value={addApiKey}
                  onChange={(e) => setAddApiKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Base URL</label>
                <Input
                  value={addBaseUrl}
                  onChange={(e) => setAddBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProvider} disabled={saving}>
                {saving ? "Adding..." : "Add Provider"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {providers.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Puzzle className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No providers configured</EmptyTitle>
            <EmptyDescription>
              Add your first AI provider to start using models in conversations.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="size-4" />
              Add Provider
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {providers.map((provider) => (
            <Card
              key={provider.id}
              className="cursor-pointer transition-colors hover:bg-accent"
              onClick={() => navigate(`/settings/providers/${provider.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Puzzle className="size-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{provider.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {PROVIDER_LABELS[provider.type] ?? provider.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{provider.models.length} models</Badge>
                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={(checked) => {
                      handleToggleEnabled(provider, checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(provider);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProvider} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
