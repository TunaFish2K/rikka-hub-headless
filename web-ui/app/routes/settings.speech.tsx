import * as React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Mic, Plus, Speech, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { toast } from "sonner";
import { useSettingsStore } from "~/stores/app-store";
import api from "~/services/api";
import type { Settings, TTSProviderProfile, ASRProviderProfile } from "~/types";

function generateId(): string {
  return crypto.randomUUID();
}

const TTS_TYPES = ["openai", "elevenlabs", "edge", "microsoft"];
const ASR_TYPES = ["openai", "whisper", "deepgram", "google"];

export default function SettingsSpeechPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore((state) => state.settings);

  const ttsProviders = settings?.ttsProviders ?? [];
  const selectedTTSProviderId = settings?.selectedTTSProviderId ?? "";
  const asrProviders = settings?.asrProviders ?? [];
  const selectedASRProviderId = settings?.selectedASRProviderId ?? "";

  const [ttsDialogOpen, setTtsDialogOpen] = React.useState(false);
  const [ttsAddType, setTtsAddType] = React.useState("openai");
  const [ttsAddName, setTtsAddName] = React.useState("");
  const [ttsAddApiKey, setTtsAddApiKey] = React.useState("");
  const [ttsAddBaseUrl, setTtsAddBaseUrl] = React.useState("");
  const [asrDialogOpen, setAsrDialogOpen] = React.useState(false);
  const [asrAddType, setAsrAddType] = React.useState("openai");
  const [asrAddName, setAsrAddName] = React.useState("");
  const [asrAddApiKey, setAsrAddApiKey] = React.useState("");
  const [asrAddWebsocketUrl, setAsrAddWebsocketUrl] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const patchSettings = async (partial: Partial<Settings>) => {
    await api.patch("settings", partial);
  };

  const handleAddTTSProvider = async () => {
    if (!ttsAddName.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const newProvider: TTSProviderProfile = {
        id: generateId(),
        type: ttsAddType,
        name: ttsAddName.trim(),
        apiKey: ttsAddApiKey.trim() || undefined,
        baseUrl: ttsAddBaseUrl.trim() || undefined,
      };
      const updated = [...ttsProviders, newProvider];
      await patchSettings({ ttsProviders: updated });
      useSettingsStore.getState().setSettings({ ...settings!, ttsProviders: updated });
      toast.success("TTS provider added");
      setTtsDialogOpen(false);
      setTtsAddName("");
      setTtsAddApiKey("");
      setTtsAddBaseUrl("");
    } catch {
      toast.error("Failed to add TTS provider");
    } finally {
      setSaving(false);
    }
  };

  const handleAddASRProvider = async () => {
    if (!asrAddName.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const newProvider: ASRProviderProfile = {
        id: generateId(),
        type: asrAddType,
        name: asrAddName.trim(),
        apiKey: asrAddApiKey.trim() || undefined,
        websocketUrl: asrAddWebsocketUrl.trim() || undefined,
      };
      const updated = [...asrProviders, newProvider];
      await patchSettings({ asrProviders: updated });
      useSettingsStore.getState().setSettings({ ...settings!, asrProviders: updated });
      toast.success("ASR provider added");
      setAsrDialogOpen(false);
      setAsrAddName("");
      setAsrAddApiKey("");
      setAsrAddWebsocketUrl("");
    } catch {
      toast.error("Failed to add ASR provider");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTTS = async (id: string) => {
    setSaving(true);
    try {
      const updated = ttsProviders.filter((p) => p.id !== id);
      const partial: Partial<Settings> = { ttsProviders: updated };
      if (selectedTTSProviderId === id) {
        partial.selectedTTSProviderId = "";
      }
      await patchSettings(partial);
      useSettingsStore.getState().setSettings({
        ...settings!,
        ttsProviders: updated,
        selectedTTSProviderId: selectedTTSProviderId === id ? "" : selectedTTSProviderId,
      });
      toast.success("TTS provider deleted");
    } catch {
      toast.error("Failed to delete TTS provider");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteASR = async (id: string) => {
    setSaving(true);
    try {
      const updated = asrProviders.filter((p) => p.id !== id);
      const partial: Partial<Settings> = { asrProviders: updated };
      if (selectedASRProviderId === id) {
        partial.selectedASRProviderId = null;
      }
      await patchSettings(partial);
      useSettingsStore.getState().setSettings({
        ...settings!,
        asrProviders: updated,
        selectedASRProviderId: selectedASRProviderId === id ? null : selectedASRProviderId,
      });
      toast.success("ASR provider deleted");
    } catch {
      toast.error("Failed to delete ASR provider");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTTS = async (id: string, partial: Partial<TTSProviderProfile>) => {
    try {
      const updated = ttsProviders.map((p) => (p.id === id ? { ...p, ...partial } : p));
      await patchSettings({ ttsProviders: updated });
      useSettingsStore.getState().setSettings({ ...settings!, ttsProviders: updated });
    } catch {
      toast.error("Failed to update TTS provider");
    }
  };

  const handleUpdateASR = async (id: string, partial: Partial<ASRProviderProfile>) => {
    try {
      const updated = asrProviders.map((p) => (p.id === id ? { ...p, ...partial } : p));
      await patchSettings({ asrProviders: updated });
      useSettingsStore.getState().setSettings({ ...settings!, asrProviders: updated });
    } catch {
      toast.error("Failed to update ASR provider");
    }
  };

  const handleSelectTTS = async (id: string) => {
    try {
      await patchSettings({ selectedTTSProviderId: id });
      useSettingsStore.getState().setSettings({ ...settings!, selectedTTSProviderId: id });
    } catch {
      toast.error("Failed to select TTS provider");
    }
  };

  const handleSelectASR = async (id: string) => {
    try {
      await patchSettings({ selectedASRProviderId: id });
      useSettingsStore.getState().setSettings({ ...settings!, selectedASRProviderId: id });
    } catch {
      toast.error("Failed to select ASR provider");
    }
  };

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-bold">Speech</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Speech</h1>
          <p className="text-sm text-muted-foreground">Configure TTS and ASR providers</p>
        </div>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Speech className="size-5 text-muted-foreground" />
                <CardTitle className="text-base">Text-to-Speech (TTS)</CardTitle>
              </div>
              <Dialog open={ttsDialogOpen} onOpenChange={setTtsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="size-4" />
                    Add TTS
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add TTS Provider</DialogTitle>
                    <DialogDescription>Configure a new text-to-speech provider</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Type</label>
                      <Select value={ttsAddType} onValueChange={setTtsAddType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TTS_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input value={ttsAddName} onChange={(e) => setTtsAddName(e.target.value)} placeholder="My TTS" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">API Key</label>
                      <Input
                        type="password"
                        value={ttsAddApiKey}
                        onChange={(e) => setTtsAddApiKey(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Base URL</label>
                      <Input
                        value={ttsAddBaseUrl}
                        onChange={(e) => setTtsAddBaseUrl(e.target.value)}
                        placeholder="https://api.openai.com/v1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTtsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddTTSProvider} disabled={saving}>
                      {saving ? "Adding..." : "Add"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Selected TTS Provider</label>
              <Select value={selectedTTSProviderId} onValueChange={handleSelectTTS}>
                <SelectTrigger>
                  <SelectValue placeholder="None selected" />
                </SelectTrigger>
                <SelectContent>
                  {ttsProviders.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            {ttsProviders.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No TTS providers configured</p>
            ) : (
              <div className="space-y-3">
                {ttsProviders.map((provider) => (
                  <div key={provider.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{provider.name}</span>
                        <span className="text-xs text-muted-foreground">({provider.type})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={(provider as any).enabled ?? true}
                          onCheckedChange={(checked: boolean) => handleUpdateTTS(provider.id, { enabled: checked })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={() => handleDeleteTTS(provider.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <label className="text-xs">API Key</label>
                        <Input
                          size={1}
                          type="password"
                          value={provider.apiKey ?? ""}
                          onChange={(e) => handleUpdateTTS(provider.id, { apiKey: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-xs">Base URL</label>
                        <Input
                          size={1}
                          value={provider.baseUrl ?? ""}
                          onChange={(e) => handleUpdateTTS(provider.id, { baseUrl: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-xs">Model</label>
                        <Input
                          size={1}
                          value={provider.model ?? ""}
                          onChange={(e) => handleUpdateTTS(provider.id, { model: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-xs">Voice</label>
                        <Input
                          size={1}
                          value={provider.voice ?? ""}
                          onChange={(e) => handleUpdateTTS(provider.id, { voice: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="size-5 text-muted-foreground" />
                <CardTitle className="text-base">Automatic Speech Recognition (ASR)</CardTitle>
              </div>
              <Dialog open={asrDialogOpen} onOpenChange={setAsrDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="size-4" />
                    Add ASR
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add ASR Provider</DialogTitle>
                    <DialogDescription>Configure a new speech recognition provider</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Type</label>
                      <Select value={asrAddType} onValueChange={setAsrAddType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASR_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input value={asrAddName} onChange={(e) => setAsrAddName(e.target.value)} placeholder="My ASR" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">API Key</label>
                      <Input
                        type="password"
                        value={asrAddApiKey}
                        onChange={(e) => setAsrAddApiKey(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">WebSocket URL</label>
                      <Input
                        value={asrAddWebsocketUrl}
                        onChange={(e) => setAsrAddWebsocketUrl(e.target.value)}
                        placeholder="wss://api.deepgram.com/v1/listen"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAsrDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddASRProvider} disabled={saving}>
                      {saving ? "Adding..." : "Add"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Selected ASR Provider</label>
              <Select value={selectedASRProviderId ?? ""} onValueChange={handleSelectASR}>
                <SelectTrigger>
                  <SelectValue placeholder="None selected" />
                </SelectTrigger>
                <SelectContent>
                  {asrProviders.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            {asrProviders.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No ASR providers configured</p>
            ) : (
              <div className="space-y-3">
                {asrProviders.map((provider) => (
                  <div key={provider.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{provider.name}</span>
                        <span className="text-xs text-muted-foreground">({provider.type})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={(provider as any).enabled ?? true}
                          onCheckedChange={(checked: boolean) => handleUpdateASR(provider.id, { enabled: checked })}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={() => handleDeleteASR(provider.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1">
                        <label className="text-xs">API Key</label>
                        <Input
                          size={1}
                          type="password"
                          value={provider.apiKey ?? ""}
                          onChange={(e) => handleUpdateASR(provider.id, { apiKey: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-xs">WebSocket URL</label>
                        <Input
                          size={1}
                          value={provider.websocketUrl ?? ""}
                          onChange={(e) => handleUpdateASR(provider.id, { websocketUrl: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-xs">Model</label>
                        <Input
                          size={1}
                          value={provider.model ?? ""}
                          onChange={(e) => handleUpdateASR(provider.id, { model: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-xs">Language</label>
                        <Input
                          size={1}
                          value={provider.language ?? ""}
                          onChange={(e) => handleUpdateASR(provider.id, { language: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-xs">Sample Rate</label>
                        <Input
                          size={1}
                          type="number"
                          value={provider.sampleRate != null ? String(provider.sampleRate) : ""}
                          onChange={(e) =>
                            handleUpdateASR(provider.id, {
                              sampleRate: e.target.value ? parseInt(e.target.value, 10) : undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
