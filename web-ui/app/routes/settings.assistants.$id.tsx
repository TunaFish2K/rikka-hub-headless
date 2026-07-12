import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Bot, Save } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Separator } from "~/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { toast } from "sonner";
import { useSettingsStore } from "~/stores/app-store";
import api from "~/services/api";
import type { Settings, AssistantProfile, ProviderModel } from "~/types";

export default function SettingsAssistantEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const settings = useSettingsStore((state) => state.settings);
  const { t } = useTranslation("page");

  const assistant = settings?.assistants.find((a) => a.id === id);

  const [name, setName] = React.useState("");
  const [systemPrompt, setSystemPrompt] = React.useState("");
  const [chatModelId, setChatModelId] = React.useState("");
  const [temperature, setTemperature] = React.useState("");
  const [topP, setTopP] = React.useState("");
  const [maxTokens, setMaxTokens] = React.useState("");
  const [contextMessageSize, setContextMessageSize] = React.useState("");
  const [streamOutput, setStreamOutput] = React.useState(false);
  const [enableMemory, setEnableMemory] = React.useState(false);
  const [useGlobalMemory, setUseGlobalMemory] = React.useState(false);
  const [enableRecentChatsReference, setEnableRecentChatsReference] = React.useState(false);
  const [messageTemplate, setMessageTemplate] = React.useState("{{ message }}");
  const [enableTimeReminder, setEnableTimeReminder] = React.useState(false);
  const [allowConversationSystemPrompt, setAllowConversationSystemPrompt] = React.useState(false);
  const [allowConversationPromptInjection, setAllowConversationPromptInjection] = React.useState(false);
  const [background, setBackground] = React.useState("");
  const [backgroundOpacity, setBackgroundOpacity] = React.useState("1");
  const [useGradientBackground, setUseGradientBackground] = React.useState(false);
  const [selectedMcpServers, setSelectedMcpServers] = React.useState<string[]>([]);
  const [selectedModeInjections, setSelectedModeInjections] = React.useState<string[]>([]);
  const [selectedLorebooks, setSelectedLorebooks] = React.useState<string[]>([]);
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [enabledSkills, setEnabledSkills] = React.useState<string[]>([]);
  const [workspaces, setWorkspaces] = React.useState<{ id: string; name: string; shellStatus: string }[]>([]);
  const [skills, setSkills] = React.useState<{ name: string; description: string }[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!assistant) return;
    setName(assistant.name ?? "");
    setSystemPrompt(assistant.systemPrompt ?? "");
    setChatModelId(assistant.chatModelId ?? "");
    setTemperature(assistant.temperature != null ? String(assistant.temperature) : "");
    setTopP(assistant.topP != null ? String(assistant.topP) : "");
    setMaxTokens(assistant.maxTokens != null ? String(assistant.maxTokens) : "");
    setContextMessageSize(assistant.contextMessageSize != null ? String(assistant.contextMessageSize) : "");
    setStreamOutput(assistant.streamOutput ?? false);
    setEnableMemory(assistant.enableMemory ?? false);
    setUseGlobalMemory(assistant.useGlobalMemory ?? false);
    setEnableRecentChatsReference(assistant.enableRecentChatsReference ?? false);
    setMessageTemplate(assistant.messageTemplate ?? "{{ message }}");
    setEnableTimeReminder(assistant.enableTimeReminder ?? false);
    setAllowConversationSystemPrompt(assistant.allowConversationSystemPrompt ?? false);
    setAllowConversationPromptInjection(assistant.allowConversationPromptInjection ?? false);
    setBackground(assistant.background ?? "");
    setBackgroundOpacity(String(assistant.backgroundOpacity ?? 1));
    setUseGradientBackground(assistant.useGradientBackground ?? false);
    setSelectedMcpServers(assistant.mcpServers ?? []);
    setSelectedModeInjections(assistant.modeInjectionIds ?? []);
    setSelectedLorebooks(assistant.lorebookIds ?? []);
    setWorkspaceId(assistant.workspaceId ?? "");
    setEnabledSkills(assistant.enabledSkills ?? []);
  }, [assistant]);

  React.useEffect(() => {
    void Promise.all([
      api.get<{ id: string; name: string; shellStatus: string }[]>("workspaces"),
      api.get<{ name: string; description: string }[]>("skills"),
    ]).then(([workspaceList, skillList]) => {
      setWorkspaces(workspaceList);
      setSkills(skillList);
    });
  }, []);

  const chatModels: { label: string; value: string }[] = React.useMemo(() => {
    if (!settings) return [];
    const models: { label: string; value: string }[] = [];
    for (const provider of settings.providers ?? []) {
      for (const model of provider.models ?? []) {
        if (model.type === "CHAT") {
          models.push({
            label: `${provider.name} / ${model.displayName}`,
            value: model.id,
          });
        }
      }
    }
    return models;
  }, [settings]);

  const mcpServers = settings?.mcpServers ?? [];
  const modeInjections = settings?.modeInjections ?? [];
  const lorebooks = settings?.lorebooks ?? [];

  const handleToggleMcpServer = (serverId: string) => {
    setSelectedMcpServers((prev) =>
      prev.includes(serverId) ? prev.filter((s) => s !== serverId) : [...prev, serverId],
    );
  };

  const handleToggleModeInjection = (id: string) => {
    setSelectedModeInjections((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleToggleLorebook = (id: string) => {
    setSelectedLorebooks((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!assistant || !settings) return;
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const updated: AssistantProfile = {
        ...assistant,
        name: name.trim(),
        systemPrompt: systemPrompt.trim() || undefined,
        chatModelId: chatModelId || null,
        temperature: temperature ? parseFloat(temperature) : undefined,
        topP: topP ? parseFloat(topP) : undefined,
        maxTokens: maxTokens ? parseInt(maxTokens, 10) : undefined,
        contextMessageSize: contextMessageSize ? parseInt(contextMessageSize, 10) : undefined,
        streamOutput,
        enableMemory,
        useGlobalMemory,
        enableRecentChatsReference,
        messageTemplate,
        enableTimeReminder,
        allowConversationSystemPrompt,
        allowConversationPromptInjection,
        background: background.trim() || undefined,
        backgroundOpacity: Math.min(1, Math.max(0, parseFloat(backgroundOpacity) || 0)),
        useGradientBackground,
        mcpServers: selectedMcpServers,
        modeInjectionIds: selectedModeInjections,
        lorebookIds: selectedLorebooks,
        workspaceId: workspaceId || null,
        enabledSkills,
      };
      const updatedAssistants = settings.assistants.map((a) =>
        a.id === assistant.id ? updated : a,
      );
      await api.patch("settings", { assistants: updatedAssistants });
      useSettingsStore.getState().setSettings({ ...settings, assistants: updatedAssistants });
      toast.success("Assistant saved");
    } catch {
      toast.error("Failed to save assistant");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings/assistants")}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-bold">Edit Assistant</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!assistant) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings/assistants")}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-bold">Assistant not found</h1>
        </div>
        <p className="text-muted-foreground">The assistant you're looking for does not exist.</p>
        <Button className="mt-4" variant="outline" onClick={() => navigate("/settings/assistants")}>
          Back to Assistants
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings/assistants")}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{assistant.name}</h1>
            <p className="text-sm text-muted-foreground">Edit assistant profile</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4" />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Assistant name" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">System Prompt</label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful assistant..."
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model & Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Chat Model</label>
              <Select value={chatModelId} onValueChange={setChatModelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {chatModels.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Temperature</label>
                <Input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="0.7"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Top P</label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={topP}
                  onChange={(e) => setTopP(e.target.value)}
                  placeholder="0.9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Max Tokens</label>
                <Input
                  type="number"
                  min={0}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                  placeholder="4096"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Context Message Size</label>
                <Input
                  type="number"
                  min={0}
                  value={contextMessageSize}
                  onChange={(e) => setContextMessageSize(e.target.value)}
                  placeholder="20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Behavior Toggles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Stream Output</label>
              <Switch checked={streamOutput} onCheckedChange={setStreamOutput} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Enable Memory</label>
              <Switch checked={enableMemory} onCheckedChange={setEnableMemory} />
            </div>
            {enableMemory && <><div className="flex items-center justify-between"><label className="cursor-pointer text-sm font-medium">{t("settings.assistant_full.global_memory")}</label><Switch checked={useGlobalMemory} onCheckedChange={setUseGlobalMemory} /></div><div className="flex items-center justify-between"><label className="cursor-pointer text-sm font-medium">{t("settings.assistant_full.recent_chats")}</label><Switch checked={enableRecentChatsReference} onCheckedChange={setEnableRecentChatsReference} /></div></>}
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Enable Time Reminder</label>
              <Switch checked={enableTimeReminder} onCheckedChange={setEnableTimeReminder} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Allow Conversation System Prompt</label>
              <Switch checked={allowConversationSystemPrompt} onCheckedChange={setAllowConversationSystemPrompt} />
            </div>
            <Separator />
            <div className="flex items-center justify-between"><label className="cursor-pointer text-sm font-medium">{t("settings.assistant_full.conversation_injection")}</label><Switch checked={allowConversationPromptInjection} onCheckedChange={setAllowConversationPromptInjection} /></div>
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="text-base">{t("settings.assistant_full.message_processing")}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-2"><label className="text-sm font-medium">{t("settings.assistant_full.message_template")}</label><Textarea value={messageTemplate} onChange={(event) => setMessageTemplate(event.target.value)} rows={4} /></div></CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base">{t("settings.assistant_full.background")}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-2"><label className="text-sm font-medium">{t("settings.assistant_full.background_url")}</label><Input value={background} onChange={(event) => setBackground(event.target.value)} placeholder="https://..." /></div><div className="grid gap-2"><label className="text-sm font-medium">{t("settings.assistant_full.background_opacity")}</label><Input type="number" min={0} max={1} step={0.05} value={backgroundOpacity} onChange={(event) => setBackgroundOpacity(event.target.value)} className="w-32" /></div><div className="flex items-center justify-between"><label className="text-sm font-medium">{t("settings.assistant_full.gradient")}</label><Switch checked={useGradientBackground} onCheckedChange={setUseGradientBackground} /></div></CardContent></Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Headless Extensions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><label className="text-sm font-medium">Workspace</label><Select value={workspaceId || "none"} onValueChange={(value) => setWorkspaceId(value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="No workspace" /></SelectTrigger><SelectContent><SelectItem value="none">No workspace</SelectItem>{workspaces.map((workspace) => <SelectItem key={workspace.id} value={workspace.id} disabled={workspace.shellStatus !== "READY"}>{workspace.name} ({workspace.shellStatus})</SelectItem>)}</SelectContent></Select></div>
            <Separator />
            <div className="space-y-2"><label className="text-sm font-medium">Skills</label>{skills.length === 0 ? <p className="text-sm text-muted-foreground">No installed skills</p> : skills.map((skill) => <div key={skill.name} className="flex items-start justify-between gap-3"><div><div className="text-sm font-medium">{skill.name}</div><div className="text-xs text-muted-foreground">{skill.description}</div></div><input type="checkbox" className="mt-1 size-4 accent-primary" checked={enabledSkills.includes(skill.name)} onChange={() => setEnabledSkills((current) => current.includes(skill.name) ? current.filter((name) => name !== skill.name) : [...current, skill.name])}/></div>)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">MCP Server Bindings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mcpServers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No MCP servers configured</p>
            ) : (
              mcpServers.map((server) => (
                <div key={server.id} className="flex items-center justify-between">
                  <label className="cursor-pointer text-sm font-medium">{server.commonOptions.name}</label>
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={selectedMcpServers.includes(server.id)}
                    onChange={() => handleToggleMcpServer(server.id)}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Injection Bindings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Mode Injections</label>
              {modeInjections.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mode injections configured</p>
              ) : (
                <div className="space-y-2">
                  {modeInjections.map((injection) => (
                    <div key={injection.id} className="flex items-center justify-between">
                      <label className="cursor-pointer text-sm font-medium">{injection.name}</label>
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={selectedModeInjections.includes(injection.id)}
                        onChange={() => handleToggleModeInjection(injection.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Separator />
            <div>
              <label className="mb-2 block text-sm font-medium">Lorebooks</label>
              {lorebooks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No lorebooks configured</p>
              ) : (
                <div className="space-y-2">
                  {lorebooks.map((lorebook) => (
                    <div key={lorebook.id} className="flex items-center justify-between">
                      <label className="cursor-pointer text-sm font-medium">{lorebook.name}</label>
                      <input
                        type="checkbox"
                        className="size-4 accent-primary"
                        checked={selectedLorebooks.includes(lorebook.id)}
                        onChange={() => handleToggleLorebook(lorebook.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
