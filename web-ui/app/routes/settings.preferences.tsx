import * as React from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { toast } from "sonner";
import { useSettingsStore } from "~/stores/app-store";
import api from "~/services/api";
import type { Settings } from "~/types";

export default function SettingsPreferencesPage() {
  const navigate = useNavigate();
  const settings = useSettingsStore((state) => state.settings);

  const [developerMode, setDeveloperMode] = React.useState(false);
  const [enableWebSearch, setEnableWebSearch] = React.useState(false);
  const [enableSuggestion, setEnableSuggestion] = React.useState(false);
  const [translateThinkingBudget, setTranslateThinkingBudget] = React.useState("");
  const [fontSizeRatio, setFontSizeRatio] = React.useState("");
  const [sendOnEnter, setSendOnEnter] = React.useState(true);
  const [showUserAvatar, setShowUserAvatar] = React.useState(true);
  const [showModelName, setShowModelName] = React.useState(true);
  const [showModelIcon, setShowModelIcon] = React.useState(true);
  const [showTokenUsage, setShowTokenUsage] = React.useState(false);
  const [showThinkingContent, setShowThinkingContent] = React.useState(true);
  const [autoCloseThinking, setAutoCloseThinking] = React.useState(false);
  const [codeBlockAutoWrap, setCodeBlockAutoWrap] = React.useState(false);
  const [codeBlockAutoCollapse, setCodeBlockAutoCollapse] = React.useState(false);
  const [showLineNumbers, setShowLineNumbers] = React.useState(false);
  const [enableAutoScroll, setEnableAutoScroll] = React.useState(true);
  const [enableLatexRendering, setEnableLatexRendering] = React.useState(true);
  const [pasteLongTextAsFile, setPasteLongTextAsFile] = React.useState(false);
  const [pasteLongTextThreshold, setPasteLongTextThreshold] = React.useState("");
  const [chatFontFamily, setChatFontFamily] = React.useState("default");
  const [savingGeneral, setSavingGeneral] = React.useState(false);
  const [savingDisplay, setSavingDisplay] = React.useState(false);

  React.useEffect(() => {
    if (!settings) return;
    setDeveloperMode(settings.developerMode ?? false);
    setEnableWebSearch(settings.enableWebSearch ?? false);
    setEnableSuggestion(settings.enableSuggestion ?? false);
    setTranslateThinkingBudget(settings.translateThinkingBudget != null ? String(settings.translateThinkingBudget) : "");
    setFontSizeRatio(settings.displaySetting?.fontSizeRatio != null ? String(settings.displaySetting.fontSizeRatio) : "");
    setSendOnEnter(settings.displaySetting?.sendOnEnter ?? true);
    setShowUserAvatar(settings.displaySetting?.showUserAvatar ?? true);
    setShowModelName(settings.displaySetting?.showModelName ?? true);
    setShowModelIcon(settings.displaySetting?.showModelIcon ?? true);
    setShowTokenUsage(settings.displaySetting?.showTokenUsage ?? false);
    setShowThinkingContent(settings.displaySetting?.showThinkingContent ?? true);
    setAutoCloseThinking(settings.displaySetting?.autoCloseThinking ?? false);
    setCodeBlockAutoWrap(settings.displaySetting?.codeBlockAutoWrap ?? false);
    setCodeBlockAutoCollapse(settings.displaySetting?.codeBlockAutoCollapse ?? false);
    setShowLineNumbers(settings.displaySetting?.showLineNumbers ?? false);
    setEnableAutoScroll(settings.displaySetting?.enableAutoScroll ?? true);
    setEnableLatexRendering(settings.displaySetting?.enableLatexRendering ?? true);
    setPasteLongTextAsFile(settings.displaySetting?.pasteLongTextAsFile ?? false);
    setPasteLongTextThreshold(
      settings.displaySetting?.pasteLongTextThreshold != null
        ? String(settings.displaySetting.pasteLongTextThreshold)
        : "",
    );
    setChatFontFamily(settings.displaySetting?.chatFontFamily ?? "default");
  }, [settings]);

  const handleSaveGeneral = async () => {
    if (!settings) return;
    setSavingGeneral(true);
    try {
      const partial: Partial<Settings> = {
        developerMode,
        enableWebSearch,
        enableSuggestion,
        translateThinkingBudget: translateThinkingBudget ? parseInt(translateThinkingBudget, 10) : 0,
      };
      await api.patch("settings", partial);
      useSettingsStore.getState().setSettings({ ...settings, ...partial });
      toast.success("General preferences saved");
    } catch {
      toast.error("Failed to save general preferences");
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveDisplay = async () => {
    if (!settings) return;
    setSavingDisplay(true);
    try {
      const displaySetting = {
        ...settings.displaySetting,
        fontSizeRatio: fontSizeRatio ? parseFloat(fontSizeRatio) : 1,
        sendOnEnter,
        showUserAvatar,
        showModelName,
        showModelIcon,
        showTokenUsage,
        showThinkingContent,
        autoCloseThinking,
        codeBlockAutoWrap,
        codeBlockAutoCollapse,
        showLineNumbers,
        enableAutoScroll,
        enableLatexRendering,
        pasteLongTextAsFile,
        pasteLongTextThreshold: pasteLongTextThreshold ? parseInt(pasteLongTextThreshold, 10) : 500,
        chatFontFamily,
      };
      await api.patch("settings", { displaySetting });
      useSettingsStore.getState().setSettings({ ...settings, displaySetting });
      toast.success("Display preferences saved");
    } catch {
      toast.error("Failed to save display preferences");
    } finally {
      setSavingDisplay(false);
    }
  };

  if (!settings) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-bold">Preferences</h1>
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
          <h1 className="text-xl font-bold">Preferences</h1>
          <p className="text-sm text-muted-foreground">General app preferences and UI display settings</p>
        </div>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">General</CardTitle>
              <Button size="sm" onClick={handleSaveGeneral} disabled={savingGeneral}>
                {savingGeneral ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Developer Mode</label>
              <Switch checked={developerMode} onCheckedChange={setDeveloperMode} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Enable Web Search</label>
              <Switch checked={enableWebSearch} onCheckedChange={setEnableWebSearch} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Enable Suggestions</label>
              <Switch checked={enableSuggestion} onCheckedChange={setEnableSuggestion} />
            </div>
            <Separator />
            <div className="grid gap-2">
              <label className="text-sm font-medium">Translate Thinking Budget</label>
              <Input
                type="number"
                min={0}
                value={translateThinkingBudget}
                onChange={(e) => setTranslateThinkingBudget(e.target.value)}
                placeholder="0"
                className="w-32"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">UI Display</CardTitle>
              <Button size="sm" onClick={handleSaveDisplay} disabled={savingDisplay}>
                {savingDisplay ? "Saving..." : "Save"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Font Size Ratio</label>
              <Input
                type="number"
                min={0.5}
                max={2}
                step={0.1}
                value={fontSizeRatio}
                onChange={(e) => setFontSizeRatio(e.target.value)}
                className="w-32"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Send on Enter</label>
              <Switch checked={sendOnEnter} onCheckedChange={setSendOnEnter} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Show User Avatar</label>
              <Switch checked={showUserAvatar} onCheckedChange={setShowUserAvatar} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Show Model Name</label>
              <Switch checked={showModelName} onCheckedChange={setShowModelName} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Show Model Icon</label>
              <Switch checked={showModelIcon} onCheckedChange={setShowModelIcon} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Show Token Usage</label>
              <Switch checked={showTokenUsage} onCheckedChange={setShowTokenUsage} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Show Thinking Content</label>
              <Switch checked={showThinkingContent} onCheckedChange={setShowThinkingContent} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Auto Close Thinking</label>
              <Switch checked={autoCloseThinking} onCheckedChange={setAutoCloseThinking} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Code Block Auto Wrap</label>
              <Switch checked={codeBlockAutoWrap} onCheckedChange={setCodeBlockAutoWrap} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Code Block Auto Collapse</label>
              <Switch checked={codeBlockAutoCollapse} onCheckedChange={setCodeBlockAutoCollapse} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Show Line Numbers</label>
              <Switch checked={showLineNumbers} onCheckedChange={setShowLineNumbers} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Enable Auto Scroll</label>
              <Switch checked={enableAutoScroll} onCheckedChange={setEnableAutoScroll} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Enable LaTeX Rendering</label>
              <Switch checked={enableLatexRendering} onCheckedChange={setEnableLatexRendering} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <label className="cursor-pointer text-sm font-medium">Paste Long Text as File</label>
              <Switch checked={pasteLongTextAsFile} onCheckedChange={setPasteLongTextAsFile} />
            </div>
            <Separator />
            <div className="grid gap-2">
              <label className="text-sm font-medium">Paste Long Text Threshold</label>
              <Input
                type="number"
                min={0}
                value={pasteLongTextThreshold}
                onChange={(e) => setPasteLongTextThreshold(e.target.value)}
                className="w-32"
              />
            </div>
            <Separator />
            <div className="grid gap-2">
              <label className="text-sm font-medium">Chat Font Family</label>
              <Select value={chatFontFamily} onValueChange={setChatFontFamily}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="serif">Serif</SelectItem>
                  <SelectItem value="monospace">Monospace</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
