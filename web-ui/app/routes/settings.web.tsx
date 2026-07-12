import * as React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Globe } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { useSettingsStore } from "~/stores/app-store";
import api from "~/services/api";
import type { Settings } from "~/types";

export default function SettingsWebPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore((state) => state.settings);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const [saving, setSaving] = React.useState(false);

  if (!settings) return null;

  const [form, setForm] = React.useState({
    webServerEnabled: settings.webServerEnabled,
    webServerPort: settings.webServerPort,
    webServerJwtEnabled: settings.webServerJwtEnabled,
    webServerAccessPassword: settings.webServerAccessPassword,
    webServerLocalhostOnly: settings.webServerLocalhostOnly,
  });

  const [dirty, setDirty] = React.useState(false);

  function handleField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.patch<Settings>("settings", form);
      setSettings({ ...settings!, ...form } as Settings);
      setDirty(false);
      toast.success("Web server settings saved");
    } catch {
      toast.error("Failed to save web server settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-8 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <ArrowLeft className="size-5" />
        </Button>
        <Globe className="size-8" />
        <div>
          <h1 className="text-2xl font-bold">Web Server</h1>
          <p className="text-sm text-muted-foreground">Configure the Ktor web server</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enable Web Server</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.webServerEnabled}
                onCheckedChange={(v) => handleField("webServerEnabled", v)}
                disabled={saving}
              />
              <Label>Enable Web Server</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Port</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              value={form.webServerPort}
              onChange={(e) => handleField("webServerPort", parseInt(e.target.value) || 0)}
              disabled={saving}
              min={1}
              max={65535}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enable JWT Auth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.webServerJwtEnabled}
                onCheckedChange={(v) => handleField("webServerJwtEnabled", v)}
                disabled={saving}
              />
              <Label>Enable JWT Auth</Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Access Password</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="password"
              value={form.webServerAccessPassword}
              onChange={(e) => handleField("webServerAccessPassword", e.target.value)}
              disabled={saving}
              placeholder="Enter access password"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Localhost Only</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.webServerLocalhostOnly}
                onCheckedChange={(v) => handleField("webServerLocalhostOnly", v)}
                disabled={saving}
              />
              <Label>Localhost Only</Label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={!dirty || saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
