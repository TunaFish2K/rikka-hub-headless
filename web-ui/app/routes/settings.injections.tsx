import * as React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, MessageSquareQuote, Plus, Trash2, BookOpen, MessageCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import { useSettingsStore } from "~/stores/app-store";
import api from "~/services/api";
import type { Settings, ModeInjectionProfile, LorebookProfile, QuickMessage } from "~/types";

function generateId(): string {
  return crypto.randomUUID();
}

export default function SettingsInjectionsPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore((state) => state.settings);

  const modeInjections = settings?.modeInjections ?? [];
  const lorebooks = settings?.lorebooks ?? [];
  const quickMessages = settings?.quickMessages ?? [];

  const [injectionDialogOpen, setInjectionDialogOpen] = React.useState(false);
  const [injectionName, setInjectionName] = React.useState("");
  const [injectionContent, setInjectionContent] = React.useState("");
  const [lorebookDialogOpen, setLorebookDialogOpen] = React.useState(false);
  const [lorebookName, setLorebookName] = React.useState("");
  const [lorebookDescription, setLorebookDescription] = React.useState("");
  const [quickMsgDialogOpen, setQuickMsgDialogOpen] = React.useState(false);
  const [quickMsgTitle, setQuickMsgTitle] = React.useState("");
  const [quickMsgContent, setQuickMsgContent] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<{
    type: "injection" | "lorebook" | "quickmsg";
    id: string;
    name: string;
  } | null>(null);
  const [saving, setSaving] = React.useState(false);

  const patchSettings = async (partial: Partial<Settings>) => {
    await api.patch("settings", partial);
  };

  const handleAddInjection = async () => {
    if (!injectionName.trim() || !injectionContent.trim()) {
      toast.error("Name and content are required");
      return;
    }
    setSaving(true);
    try {
      const newInjection: ModeInjectionProfile = {
        id: generateId(),
        name: injectionName.trim(),
        enabled: true,
        content: injectionContent.trim(),
      };
      const updated = [...modeInjections, newInjection];
      await patchSettings({ modeInjections: updated });
      useSettingsStore.getState().setSettings({ ...settings!, modeInjections: updated });
      toast.success("Mode injection added");
      setInjectionDialogOpen(false);
      setInjectionName("");
      setInjectionContent("");
    } catch {
      toast.error("Failed to add mode injection");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLorebook = async () => {
    if (!lorebookName.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const newLorebook: LorebookProfile = {
        id: generateId(),
        name: lorebookName.trim(),
        description: lorebookDescription.trim() || undefined,
        enabled: true,
      };
      const updated = [...lorebooks, newLorebook];
      await patchSettings({ lorebooks: updated });
      useSettingsStore.getState().setSettings({ ...settings!, lorebooks: updated });
      toast.success("Lorebook added");
      setLorebookDialogOpen(false);
      setLorebookName("");
      setLorebookDescription("");
    } catch {
      toast.error("Failed to add lorebook");
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuickMessage = async () => {
    if (!quickMsgTitle.trim() || !quickMsgContent.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);
    try {
      const newQuickMessage: QuickMessage = {
        id: generateId(),
        title: quickMsgTitle.trim(),
        content: quickMsgContent.trim(),
      };
      const updated = [...quickMessages, newQuickMessage];
      await patchSettings({ quickMessages: updated });
      useSettingsStore.getState().setSettings({ ...settings!, quickMessages: updated });
      toast.success("Quick message added");
      setQuickMsgDialogOpen(false);
      setQuickMsgTitle("");
      setQuickMsgContent("");
    } catch {
      toast.error("Failed to add quick message");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleInjection = async (id: string, enabled: boolean) => {
    try {
      const updated = modeInjections.map((i) => (i.id === id ? { ...i, enabled } : i));
      await patchSettings({ modeInjections: updated });
      useSettingsStore.getState().setSettings({ ...settings!, modeInjections: updated });
    } catch {
      toast.error("Failed to update mode injection");
    }
  };

  const handleToggleLorebook = async (id: string, enabled: boolean) => {
    try {
      const updated = lorebooks.map((l) => (l.id === id ? { ...l, enabled } : l));
      await patchSettings({ lorebooks: updated });
      useSettingsStore.getState().setSettings({ ...settings!, lorebooks: updated });
    } catch {
      toast.error("Failed to update lorebook");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      let partial: Partial<Settings> = {};
      if (deleteTarget.type === "injection") {
        const updated = modeInjections.filter((i) => i.id !== deleteTarget.id);
        partial = { modeInjections: updated };
        useSettingsStore.getState().setSettings({ ...settings!, modeInjections: updated });
      } else if (deleteTarget.type === "lorebook") {
        const updated = lorebooks.filter((l) => l.id !== deleteTarget.id);
        partial = { lorebooks: updated };
        useSettingsStore.getState().setSettings({ ...settings!, lorebooks: updated });
      } else {
        const updated = quickMessages.filter((q) => q.id !== deleteTarget.id);
        partial = { quickMessages: updated };
        useSettingsStore.getState().setSettings({ ...settings!, quickMessages: updated });
      }
      await patchSettings(partial);
      toast.success("Deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-bold">Injections</h1>
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
          <h1 className="text-xl font-bold">Injections</h1>
          <p className="text-sm text-muted-foreground">Manage mode injections, lorebooks, and quick messages</p>
        </div>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquareQuote className="size-5 text-muted-foreground" />
                Mode Injections
              </CardTitle>
              <Dialog open={injectionDialogOpen} onOpenChange={setInjectionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="size-4" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Mode Injection</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input value={injectionName} onChange={(e) => setInjectionName(e.target.value)} placeholder="Injection name" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Content</label>
                      <Textarea
                        value={injectionContent}
                        onChange={(e) => setInjectionContent(e.target.value)}
                        placeholder="Injection prompt content..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInjectionDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddInjection} disabled={saving}>
                      {saving ? "Adding..." : "Add"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {modeInjections.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No mode injections configured</p>
            ) : (
              modeInjections.map((injection) => (
                <div key={injection.id} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{injection.name}</span>
                    </div>
                    {(injection as any).content && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {(injection as any).content}
                      </p>
                    )}
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <Switch
                      checked={injection.enabled ?? true}
                      onCheckedChange={(checked) => handleToggleInjection(injection.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() =>
                        setDeleteTarget({ type: "injection", id: injection.id, name: injection.name })
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="size-5 text-muted-foreground" />
                Lorebooks
              </CardTitle>
              <Dialog open={lorebookDialogOpen} onOpenChange={setLorebookDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="size-4" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Lorebook</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input value={lorebookName} onChange={(e) => setLorebookName(e.target.value)} placeholder="Lorebook name" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={lorebookDescription}
                        onChange={(e) => setLorebookDescription(e.target.value)}
                        placeholder="Description..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setLorebookDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddLorebook} disabled={saving}>
                      {saving ? "Adding..." : "Add"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lorebooks.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No lorebooks configured</p>
            ) : (
              lorebooks.map((lorebook) => (
                <div key={lorebook.id} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{lorebook.name}</span>
                    {lorebook.description && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{lorebook.description}</p>
                    )}
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <Switch
                      checked={lorebook.enabled ?? true}
                      onCheckedChange={(checked) => handleToggleLorebook(lorebook.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={() =>
                        setDeleteTarget({ type: "lorebook", id: lorebook.id, name: lorebook.name })
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="size-5 text-muted-foreground" />
                Quick Messages
              </CardTitle>
              <Dialog open={quickMsgDialogOpen} onOpenChange={setQuickMsgDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="size-4" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Quick Message</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input value={quickMsgTitle} onChange={(e) => setQuickMsgTitle(e.target.value)} placeholder="Quick message title" />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Content</label>
                      <Textarea
                        value={quickMsgContent}
                        onChange={(e) => setQuickMsgContent(e.target.value)}
                        placeholder="Message content..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setQuickMsgDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddQuickMessage} disabled={saving}>
                      {saving ? "Adding..." : "Add"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickMessages.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No quick messages configured</p>
            ) : (
              quickMessages.map((qm) => (
                <div key={qm.id} className="flex items-start justify-between rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{qm.title}</span>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{qm.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-3 size-7 text-destructive shrink-0"
                    onClick={() => setDeleteTarget({ type: "quickmsg", id: qm.id, name: qm.title })}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
