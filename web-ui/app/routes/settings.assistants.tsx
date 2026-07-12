import * as React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Bot, Plus, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { useSettingsStore } from "~/stores/app-store";
import api from "~/services/api";
import type { Settings, AssistantProfile } from "~/types";

function generateId(): string {
  return crypto.randomUUID();
}

export default function SettingsAssistantsPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore((state) => state.settings);
  const assistants = settings?.assistants ?? [];

  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [addName, setAddName] = React.useState("");
  const [addSystemPrompt, setAddSystemPrompt] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<AssistantProfile | null>(null);
  const [saving, setSaving] = React.useState(false);

  const patchSettings = async (partial: Partial<Settings>) => {
    await api.patch("settings", partial);
  };

  const handleAddAssistant = async () => {
    if (!addName.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const newAssistant: AssistantProfile = {
        id: generateId(),
        name: addName.trim(),
        systemPrompt: addSystemPrompt.trim() || undefined,
        tags: [],
        chatModelId: null,
        mcpServers: [],
        modeInjectionIds: [],
        lorebookIds: [],
        quickMessageIds: [],
        allowConversationSystemPrompt: false,
      };
      const updatedAssistants = [...assistants, newAssistant];
      await patchSettings({ assistants: updatedAssistants });
      useSettingsStore.getState().setSettings({ ...settings!, assistants: updatedAssistants });
      toast.success("Assistant added");
      setAddDialogOpen(false);
      setAddName("");
      setAddSystemPrompt("");
    } catch {
      toast.error("Failed to add assistant");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAssistant = async (assistant: AssistantProfile) => {
    try {
      await patchSettings({ assistantId: assistant.id });
      useSettingsStore.getState().setSettings({ ...settings!, assistantId: assistant.id });
      toast.success(`Selected "${assistant.name}"`);
    } catch {
      toast.error("Failed to select assistant");
    }
  };

  const handleDeleteAssistant = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const updatedAssistants = assistants.filter((a) => a.id !== deleteTarget.id);
      const updatedSettings: Partial<Settings> = { assistants: updatedAssistants };
      if (settings?.assistantId === deleteTarget.id) {
        updatedSettings.assistantId = "";
      }
      await patchSettings(updatedSettings);
      useSettingsStore.getState().setSettings({
        ...settings!,
        assistants: updatedAssistants,
        assistantId: settings?.assistantId === deleteTarget.id ? "" : settings!.assistantId,
      });
      toast.success("Assistant deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete assistant");
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
          <h1 className="text-xl font-bold">Assistants</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const currentAssistantId = settings.assistantId;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Assistants</h1>
            <p className="text-sm text-muted-foreground">Manage assistant profiles, system prompts, and parameters</p>
          </div>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" />
              Add Assistant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Assistant</DialogTitle>
              <DialogDescription>Create a new assistant profile</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="My Assistant" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">System Prompt</label>
                <Textarea
                  value={addSystemPrompt}
                  onChange={(e) => setAddSystemPrompt(e.target.value)}
                  placeholder="You are a helpful assistant..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddAssistant} disabled={saving}>
                {saving ? "Adding..." : "Add Assistant"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {assistants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bot className="mb-4 size-12 text-muted-foreground" />
          <p className="text-lg font-medium">No assistants configured</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first assistant to get started.</p>
          <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
            <Plus className="size-4" />
            Add Assistant
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {assistants.map((assistant) => {
            const isCurrent = assistant.id === currentAssistantId;
            return (
              <Card
                key={assistant.id}
                className={isCurrent ? "border-primary" : ""}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Bot className="mt-0.5 size-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{assistant.name}</CardTitle>
                          {isCurrent && <Badge variant="default">Current</Badge>}
                        </div>
                        {assistant.systemPrompt && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {assistant.systemPrompt}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectAssistant(assistant)}
                        >
                          Select
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/settings/assistants/${assistant.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive"
                        onClick={() => setDeleteTarget(assistant)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 pt-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {assistant.chatModelId && (
                      <span>Model: {assistant.chatModelId}</span>
                    )}
                    {assistant.tags && assistant.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {assistant.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assistant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAssistant} disabled={saving}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
