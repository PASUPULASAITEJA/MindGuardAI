import React, { useState, useEffect } from "react";
import {
  Laptop,
  Smartphone,
  Globe,
  Trash2,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Terminal,
  Cpu,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { devicesAPI, DeviceItem } from "@/services/api";

export const DeviceManagementView: React.FC = () => {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setRefreshing(true);
      const data = await devicesAPI.listDevices();
      setDevices(data || []);
    } catch (err) {
      console.error("Failed to fetch devices:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleTogglePause = async (device: DeviceItem) => {
    try {
      setActionInProgress(device.id);
      await devicesAPI.updateDevice(device.id, {
        is_monitoring_paused: !device.is_monitoring_paused,
      });
      await fetchDevices();
    } catch (err) {
      console.error("Error toggling pause:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!window.confirm("Are you sure you want to unlink and remove this device?")) return;
    try {
      setActionInProgress(deviceId);
      await devicesAPI.deleteDevice(deviceId, false);
      await fetchDevices();
    } catch (err) {
      console.error("Error deleting device:", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "browser_extension":
        return <Globe className="w-5 h-5 text-sky-500" />;
      case "macos":
        return <Laptop className="w-5 h-5 text-indigo-500" />;
      case "linux":
        return <Cpu className="w-5 h-5 text-amber-500" />;
      default:
        return <Laptop className="w-5 h-5 text-blue-500" />;
    }
  };

  const isOnline = (lastSync?: string) => {
    if (!lastSync) return false;
    const diffMins = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60);
    return diffMins < 5;
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-500" />
            Connected Devices & Hardware Clients
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage authorized desktop monitors and browser extensions tracking your digital wellness.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDevices}
            disabled={refreshing}
            className="rounded-xl border-border/80"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connected Devices Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse bg-muted/20 border-border/60 h-44 rounded-2xl" />
          ))}
        </div>
      ) : devices.length === 0 ? (
        <Card className="border-dashed border-2 border-border/80 bg-card/40 rounded-2xl p-8 text-center">
          <CardContent className="space-y-3 p-0 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
              <Laptop className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-foreground">No Devices Connected Yet</h3>
            <p className="text-sm text-muted-foreground">
              Run the desktop agent or load the browser extension to link your first computer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => {
            const online = isOnline(device.last_sync_at);
            return (
              <Card
                key={device.id}
                className="bg-card/70 border-border/70 backdrop-blur-sm rounded-2xl shadow-xs transition-all hover:border-blue-500/30"
              >
                <CardHeader className="pb-3 flex flex-row items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center border border-border/50">
                      {getPlatformIcon(device.platform)}
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">{device.device_name}</CardTitle>
                      <CardDescription className="text-xs">
                        {device.os_version || device.platform.toUpperCase()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      online
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs"
                        : "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30 text-xs"
                    }
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${online ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                    {online ? "Online" : "Offline"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Last Synced:{" "}
                      {device.last_sync_at
                        ? new Date(device.last_sync_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Never"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePause(device)}
                      disabled={actionInProgress === device.id}
                      className="text-xs h-8 px-2.5 rounded-lg"
                    >
                      {device.is_monitoring_paused ? (
                        <>
                          <PlayCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                          Resume
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                          Pause
                        </>
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDevice(device.id)}
                      disabled={actionInProgress === device.id}
                      className="text-xs h-8 px-2.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-500" />
                      Unlink
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Setup Guide */}
      <Card className="bg-muted/30 border-border/70 rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-500" />
            Connect a New Device (Windows, macOS, Linux)
          </CardTitle>
          <CardDescription className="text-xs">
            Follow these instructions to start tracking on another workstation or laptop.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <div className="p-3 rounded-xl bg-card border border-border/60 font-mono text-[11px] text-foreground space-y-1">
            <p className="text-slate-400"># 1. In your workstation terminal, navigate to your MindGuard directory:</p>
            <p className="text-blue-500">cd desktop_agent</p>
            <p className="text-slate-400 pt-1"># 2. Authenticate and register this device with your student account:</p>
            <p className="text-blue-500">python mindguard_pc_agent.py --login</p>
            <p className="text-slate-400 pt-1"># 3. Start background monitoring (runs silently with zero popups):</p>
            <p className="text-blue-500">python mindguard_pc_agent.py</p>
          </div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 pt-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Each device receives a unique cryptographic token for isolated synchronization.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceManagementView;

