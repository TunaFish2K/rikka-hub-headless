import * as React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Server, Plus, Trash2 } from "lucide-react";
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

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function SettingsMcpPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore((state) => state.settings);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const [saving, setSaving] = React.useState(false);
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [newServerName, setNewServerName] = React.useState("");
  const [newServerType, setNewServerType] = React.useState("");

  if (!settings) return null;
  const s = settings!;

  async function patchMcpServers(servers: McpServerConfig[]) {
    setSaving(true);
    const prev = s.mcpServers;
    setSettings({ ...s, mcpServers: servers } as Settings);
    try {
      await api.patch<Settings>("settings", { mcpServers: servers });
      toast.success("MCP servers updated");
    } catch {
      setSettings({ ...s, mcpServers: prev } as Settings);
      toast.error("Failed to update MCP servers");
    } finally {
      setSaving(false);
    }
  }

  function handleToggleServer(serverId: string, enabled: boolean) {
    const servers = s.mcpServers.map((srv) =>
      srv.id === serverId ? { ...srv, commonOptions: { ...srv.commonOptions, enable: enabled } } : srv
    );
    patchMcpServers(servers);
  }

  function handleToggleTool(serverId: string, toolName: string, field: "enable" | "needsApproval", value: boolean) {
    const servers = s.mcpServers.map((srv) =>
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
    );
    patchMcpServers(servers);
  }

  function handleDeleteServer(serverId: string) {
    const servers = s.mcpServers.filter((srv) => srv.id !== serverId);
    patchMcpServers(servers);
  }

  function handleUpdateServerName(serverId: string, name: string) {
    const servers = s.mcpServers.map((srv) =>
      srv.id === serverId ? { ...srv, commonOptions: { ...srv.commonOptions, name } } : srv
    );
    patchMcpServers(servers);
  }

  async function handleAddServer() {
    if (!newServerName.trim()) {
      toast.error("Server name is required");
      return;
    }
    const newServer: McpServerConfig = {
      id: generateId(),
      type: newServerType.trim() || undefined,
      commonOptions: {
        enable: true,
        name: newServerName.trim(),
        tools: [],
      },
    };
    const servers = [...s.mcpServers, newServer];
    setNewServerName("");
    setNewServerType("");
    setAddDialogOpen(false);
    await patchMcpServers(servers);
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

      <div className="mb-6 flex justify-end">
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
                <Input
                  id="server-type"
                  value={newServerType}
                  onChange={(e) => setNewServerType(e.target.value)}
                  placeholder="(optional)"
                />
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
        {settings.mcpServers.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Server className="size-8" />
              <p className="text-sm">No MCP servers configured</p>
              <p className="text-xs">Add a server to get started</p>
            </CardContent>
          </Card>
        )}
        {settings.mcpServers.map((server) => (
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
          </Card>
        ))}
      </div>
    </div>
  );
}
