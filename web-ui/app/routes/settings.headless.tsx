import * as React from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, HardDrive, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import api from "~/services/api";
import { useSettingsStore } from "~/stores/app-store";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";

interface Workspace { id: string; name: string; shellStatus: string; createdAt: number; updatedAt: number }

export default function SettingsHeadlessPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("page");
  const settings = useSettingsStore((state) => state.settings);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const load = React.useCallback(async () => setWorkspaces(await api.get<Workspace[]>("workspaces")), []);
  React.useEffect(() => { void load(); }, [load]);
  if (!settings) return null;

  async function saveBackup() {
    setSaving(true);
    try {
      await api.patch("settings", { webDavConfig: settings!.webDavConfig, s3Config: settings!.s3Config });
      toast.success(t("settings.headless.backup_saved"));
    } catch { toast.error(t("settings.headless.backup_failed")); } finally { setSaving(false); }
  }
  function updateConfig(kind: "webDavConfig" | "s3Config", field: string, value: unknown) {
    setSettings({ ...settings!, [kind]: { ...settings![kind], [field]: value } });
  }
  async function createWorkspace() {
    if (!name.trim()) return;
    await api.post("workspaces", { name: name.trim() });
    setName(""); await load();
  }
  async function installWorkspace(id: string) {
    toast.info(t("settings.headless.install_started"));
    try { await api.post(`workspaces/${id}/install`, {}); await load(); }
    catch { toast.error(t("settings.headless.install_failed")); }
  }
  async function deleteWorkspace(id: string) { await api.delete(`workspaces/${id}`); await load(); }

  return <div className="mx-auto max-w-4xl space-y-6 p-6">
    <div className="flex items-center gap-3"><Button variant="ghost" size="icon" onClick={() => navigate("/settings")}><ArrowLeft /></Button><HardDrive /><div><h1 className="text-2xl font-bold">{t("settings.headless.title")}</h1><p className="text-sm text-muted-foreground">{t("settings.headless.description")}</p></div></div>
    <Card><CardHeader><CardTitle>{t("settings.headless.workspaces")}</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("settings.headless.workspace_name")}/><Button onClick={createWorkspace}><Plus />{t("settings.headless.create")}</Button><Button variant="outline" onClick={load}><RefreshCw /></Button></div>
      {workspaces.map((workspace) => <div key={workspace.id} className="flex items-center justify-between rounded border p-3"><div><div className="font-medium">{workspace.name}</div><div className="text-xs text-muted-foreground">{workspace.shellStatus}</div></div><div className="flex gap-2">{workspace.shellStatus !== "READY" && <Button size="sm" onClick={() => installWorkspace(workspace.id)}>{t("settings.headless.install")}</Button>}<Button size="icon" variant="destructive" onClick={() => deleteWorkspace(workspace.id)}><Trash2 /></Button></div></div>)}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>{t("settings.headless.webdav")}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
      <Input placeholder="URL" value={settings.webDavConfig.url} onChange={(e) => updateConfig("webDavConfig", "url", e.target.value)}/><Input placeholder="Path" value={settings.webDavConfig.path} onChange={(e) => updateConfig("webDavConfig", "path", e.target.value)}/><Input placeholder="Username" value={settings.webDavConfig.username} onChange={(e) => updateConfig("webDavConfig", "username", e.target.value)}/><Input type="password" placeholder="Password" value={settings.webDavConfig.password} onChange={(e) => updateConfig("webDavConfig", "password", e.target.value)}/>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>{t("settings.headless.s3")}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
      <Input placeholder="Endpoint" value={settings.s3Config.endpoint} onChange={(e) => updateConfig("s3Config", "endpoint", e.target.value)}/><Input placeholder="Bucket" value={settings.s3Config.bucket} onChange={(e) => updateConfig("s3Config", "bucket", e.target.value)}/><Input placeholder="Access key" value={settings.s3Config.accessKeyId} onChange={(e) => updateConfig("s3Config", "accessKeyId", e.target.value)}/><Input type="password" placeholder="Secret key" value={settings.s3Config.secretAccessKey} onChange={(e) => updateConfig("s3Config", "secretAccessKey", e.target.value)}/><Input placeholder="Region" value={settings.s3Config.region} onChange={(e) => updateConfig("s3Config", "region", e.target.value)}/>
    </CardContent></Card>
    <div className="flex justify-end"><Button disabled={saving} onClick={saveBackup}>{saving ? t("settings.saving") : t("settings.headless.save_backup")}</Button></div>
  </div>;
}
