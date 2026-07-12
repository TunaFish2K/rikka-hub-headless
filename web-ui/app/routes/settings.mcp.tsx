import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { ArrowLeft, Server, Plus, Save, Trash2, Upload } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { toast } from "sonner";
import { useSettingsStore } from "~/stores/app-store";
import api from "~/services/api";
import type { Settings, McpServerConfig, McpToolOption } from "~/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";

function generateId(): string {
  return crypto.randomUUID();
}

export default function SettingsMcpPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("page");
  const settings = useSettingsStore((state) => state.settings);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const [saving, setSaving] = React.useState(false);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [newServerName, setNewServerName] = React.useState("");
  const [newServerType, setNewServerType] = React.useState("");
  const [newServerUrl, setNewServerUrl] = React.useState("");
  const [importOpen, setImportOpen] = React.useState(false);
  const [importJson, setImportJson] = React.useState("");
  const [servers, setServers] = React.useState<McpServerConfig[]>([]);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (!settings || dirty) return;
    setServers(settings.mcpServers);
  }, [settings, dirty]);

  if (!settings) return null;
  const s = settings!;

  async function saveMcpServers(nextServers: McpServerConfig[] = servers) {
    setSaving(true);
    const prev = s.mcpServers;
    try {
      await api.patch<Settings>("settings", { mcpServers: nextServers });
      setSettings({ ...s, mcpServers: nextServers } as Settings);
      setServers(nextServers);
      setDirty(false);
      toast.success("MCP servers updated");
    } catch {
      setSettings({ ...s, mcpServers: prev } as Settings);
      setServers(prev);
      toast.error("Failed to update MCP servers");
    } finally {
      setSaving(false);
    }
  }

  function handleToggleServer(serverId: string, enabled: boolean) {
    setServers(servers.map((srv) =>
      srv.id === serverId ? { ...srv, commonOptions: { ...srv.commonOptions, enable: enabled } } : srv
    ));
    setDirty(true);
  }

  function handleToggleTool(serverId: string, toolName: string, field: "enable" | "needsApproval", value: boolean) {
    setServers(servers.map((srv) =>
      srv.id === serverId
        ? {
            ...srv,
            commonOptions: {
              ...srv.commonOptions,
              tools: srv.commonOptions.tools.map((t) =>
                t.name === toolName ? { ...t, [field]: value } : t
              ),
            },
          }
        : srv
    ));
    setDirty(true);
  }

  function handleDeleteServer(serverId: string) {
    setServers(servers.filter((srv) => srv.id !== serverId));
    setDirty(true);
  }

  function handleUpdateServerName(serverId: string, name: string) {
    setServers(servers.map((srv) =>
      srv.id === serverId ? { ...srv, commonOptions: { ...srv.commonOptions, name } } : srv
    ));
    setDirty(true);
  }

  function handleUpdateServer(serverId: string, patch: Partial<McpServerConfig>) {
    setServers(servers.map((server) => server.id === serverId ? { ...server, ...patch } : server));
    setDirty(true);
  }

  function handleUpdateHeaders(serverId: string, headers: Array<[string, string]>) {
    setServers(servers.map((server) => server.id === serverId
      ? { ...server, commonOptions: { ...server.commonOptions, headers } }
      : server));
    setDirty(true);
  }

  async function handleAddServer() {
    if (!newServerName.trim()) {
      toast.error("Server name is required");
      return;
    }
    const newServer: McpServerConfig = {
      id: generateId(),
      type: (newServerType || "streamable_http") as McpServerConfig["type"],
      url: newServerUrl.trim(),
      commonOptions: {
        enable: true,
        name: newServerName.trim(),
        headers: [],
        tools: [],
      },
    };
    const nextServers = [...servers, newServer];
    setNewServerName("");
    setNewServerType("");
    setNewServerUrl("");
    setAddDialogOpen(false);
    setServers(nextServers);
    setDirty(true);
  }


  async function handleImport() {
    try {
      const parsed = JSON.parse(importJson) as unknown;
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      const imported = candidates.map((value) => {
        if (!value || typeof value !== "object") throw new Error("Invalid MCP configuration");
        const raw = value as Record<string, unknown>;
        const common = (raw.commonOptions ?? {}) as Record<string, unknown>;
        const type = raw.type === "sse" ? "sse" : "streamable_http";
        return {
          ...raw,
          id: typeof raw.id === "string" ? raw.id : generateId(),
          type,
          url: typeof raw.url === "string" ? raw.url : "",
          commonOptions: {
            ...common,
            enable: common.enable !== false,
            name: typeof common.name === "string" ? common.name : "Imported MCP Server",
            headers: Array.isArray(common.headers) ? common.headers : [],
            tools: Array.isArray(common.tools) ? common.tools : [],
          },
        } as McpServerConfig;
      });
      setServers([...servers, ...imported]);
      setDirty(true);
      setImportJson("");
      setImportOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid MCP configuration");
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-8 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <ArrowLeft className="size-5" />
        </Button>
        <Server className="size-8" />
        <div>
          <h1 className="text-2xl font-bold">MCP Servers</h1>
          <p className="text-sm text-muted-foreground">Manage Model Context Protocol server connections</p>
        </div>
      </div>

      <div className="mb-6 flex justify-end gap-2">
        <Button onClick={() => saveMcpServers()} disabled={!dirty || saving}><Save className="mr-2 size-4" />{saving ? t("settings.saving") : t("settings.save")}</Button>
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogTrigger asChild><Button variant="outline"><Upload className="mr-2 size-4" />{t("settings.mcp_full.import")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("settings.mcp_full.import_title")}</DialogTitle><DialogDescription>{t("settings.mcp_full.import_desc")}</DialogDescription></DialogHeader>
            <Textarea value={importJson} onChange={(event) => setImportJson(event.target.value)} className="min-h-56 font-mono text-xs" />
            <DialogFooter><Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button><Button onClick={handleImport}>Import</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Add Server
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add MCP Server</DialogTitle>
              <DialogDescription>Enter the name and type for the new MCP server.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="server-name">Name</Label>
                <Input
                  id="server-name"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="My Server"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="server-type">Type</Label>
                <Select value={newServerType || "streamable_http"} onValueChange={setNewServerType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="streamable_http">Streamable HTTP</SelectItem><SelectItem value="sse">SSE</SelectItem></SelectContent></Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="server-url">URL</Label>
                <Input id="server-url" value={newServerUrl} onChange={(e) => setNewServerUrl(e.target.value)} placeholder="https://example.com/mcp" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddServer}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {servers.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Server className="size-8" />
              <p className="text-sm">No MCP servers configured</p>
              <p className="text-xs">Add a server to get started</p>
            </CardContent>
          </Card>
        )}
        {servers.map((server) => (
          <Card key={server.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={server.commonOptions.enable}
                    onCheckedChange={(v) => handleToggleServer(server.id, v)}
                    disabled={saving}
                  />
                  <div>
                    <CardTitle className="text-base">{server.commonOptions.name}</CardTitle>
                    {server.type && (
                      <p className="text-xs text-muted-foreground">{server.type}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    className="h-8 w-48 text-sm"
                    value={server.commonOptions.name}
                    onChange={(e) => handleUpdateServerName(server.id, e.target.value)}
                    disabled={saving}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteServer(server.id)}
                    disabled={saving}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {server.commonOptions.tools.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Tools</p>
                  {server.commonOptions.tools.map((tool) => (
                    <div
                      key={tool.name}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tool.name}</p>
                        {tool.description && (
                          <p className="text-xs text-muted-foreground">{tool.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`tool-${server.id}-${tool.name}-enable`}
                            checked={tool.enable}
                            onCheckedChange={(v) => handleToggleTool(server.id, tool.name, "enable", v)}
                            disabled={saving}
                          />
                          <Label htmlFor={`tool-${server.id}-${tool.name}-enable`} className="text-xs">Enable</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`tool-${server.id}-${tool.name}-approval`}
                            checked={tool.needsApproval ?? false}
                            onCheckedChange={(v) => handleToggleTool(server.id, tool.name, "needsApproval", v)}
                            disabled={saving}
                          />
                          <Label htmlFor={`tool-${server.id}-${tool.name}-approval`} className="text-xs">Approval</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
            <CardContent className="space-y-4 border-t pt-4">
              <div className="grid gap-2"><Label>{t("settings.mcp_full.transport")}</Label><Select value={server.type} onValueChange={(type) => handleUpdateServer(server.id, { type: type as McpServerConfig["type"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="streamable_http">Streamable HTTP</SelectItem><SelectItem value="sse">SSE</SelectItem></SelectContent></Select></div>
              <div className="grid gap-2"><Label>{t("settings.mcp_full.url")}</Label><Input value={server.url ?? ""} onChange={(event) => handleUpdateServer(server.id, { url: event.target.value })} /></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label>{t("settings.mcp_full.headers")}</Label><Button size="sm" variant="outline" onClick={() => handleUpdateHeaders(server.id, [...(server.commonOptions.headers ?? []), ["", ""]])}><Plus className="mr-1 size-3" />{t("settings.mcp_full.add_header")}</Button></div>
                {(server.commonOptions.headers ?? []).map((header, index) => <div key={index} className="flex gap-2"><Input placeholder={t("settings.mcp_full.header_name")} value={header[0]} onChange={(event) => { const headers = [...(server.commonOptions.headers ?? [])]; headers[index] = [event.target.value, header[1]]; handleUpdateHeaders(server.id, headers); }} /><Input placeholder={t("settings.mcp_full.header_value")} value={header[1]} onChange={(event) => { const headers = [...(server.commonOptions.headers ?? [])]; headers[index] = [header[0], event.target.value]; handleUpdateHeaders(server.id, headers); }} /><Button size="icon" variant="ghost" onClick={() => handleUpdateHeaders(server.id, (server.commonOptions.headers ?? []).filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" /></Button></div>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
