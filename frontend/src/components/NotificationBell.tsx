import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Info,
  Radio,
  ExternalLink,
  ShieldAlert,
  X
} from "lucide-react";
import { notificationsAPI, NotificationItem } from "../services/api";
import { getAccessToken } from "../services/api";

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanupWebSocket = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      try {
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
          wsRef.current.close();
        }
      } catch (e) {}
      wsRef.current = null;
    }
  }, []);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.getNotifications(50, false);
      setNotifications(data.items || []);
      setUnreadCount(data.unread_count || 0);
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup WebSocket stream
  const connectWebSocket = useCallback(() => {
    const token = getAccessToken();
    if (!token) return;

    // If already connected or connecting, skip
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    cleanupWebSocket();

    // Determine WebSocket host URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.port === "5173" ? `${window.location.hostname}:8000` : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/notifications?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        try {
          ws.send("ping");
        } catch (e) {}
        // Ping heartbeat every 20 seconds
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send("ping");
            } catch (e) {}
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "new_notification" && payload.data) {
            const newNotif: NotificationItem = payload.data;
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
          } else if (payload.event === "notification_read" && payload.data) {
            const readId = payload.data.id;
            setNotifications((prev) =>
              prev.map((n) => (n.id === readId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
          } else if (payload.event === "all_notifications_read") {
            setNotifications((prev) =>
              prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
            );
            setUnreadCount(0);
          }
        } catch (e) {
          // ignore non-json ping/pong
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        // Attempt reconnect after 8 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 8000);
      };

      ws.onerror = () => {
        // Handled via onclose
      };
    } catch (err) {
      console.warn("WebSocket init error:", err);
    }
  }, [cleanupWebSocket]);

  useEffect(() => {
    fetchNotifications();
    connectWebSocket();

    return () => {
      cleanupWebSocket();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [fetchNotifications, connectWebSocket, cleanupWebSocket]);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.warn("Failed to mark all notifications read:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "risk_alert":
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case "session_reminder":
        return <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "counselor_message":
        return <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === "unread" ? !n.is_read : true
  );

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        id="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 border border-transparent hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/40"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-[11px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-card shadow-lg shadow-rose-500/30 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-card text-card-foreground backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-border flex items-center justify-between bg-secondary/50">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-foreground tracking-wide">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {/* WebSocket Live status badge */}
              <div
                className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary border border-border"
                title={isConnected ? "Real-time stream active" : "Reconnecting to notification stream..."}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span className="text-muted-foreground">{isConnected ? "Live" : "Syncing"}</span>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="flex items-center space-x-1 text-xs text-primary hover:text-primary/80 transition-colors p-1 rounded hover:bg-primary/10"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 pt-2.5 pb-1 flex items-center space-x-2 border-b border-border bg-card">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`text-xs font-medium pb-1.5 border-b-2 transition-all ${
                filter === "all"
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`text-xs font-medium pb-1.5 border-b-2 transition-all ${
                filter === "unread"
                  ? "text-primary border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                  <Bell className="w-5 h-5 opacity-60" />
                </div>
                <p className="text-xs font-medium text-foreground">All caught up!</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {filter === "unread" ? "No unread notifications." : "No notifications right now."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const isRisk = n.type === "risk_alert";
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                    className={`p-3.5 transition-colors cursor-pointer group flex items-start space-x-3 ${
                      !n.is_read
                        ? isRisk
                          ? "bg-rose-500/10 hover:bg-rose-500/15 border-l-2 border-rose-500"
                          : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary"
                        : "hover:bg-secondary/60 opacity-90 hover:opacity-100"
                    }`}
                  >
                    {/* Icon container */}
                    <div
                      className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                        isRisk
                          ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                          : "bg-secondary text-foreground border border-border"
                      }`}
                    >
                      {getNotificationIcon(n.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            !n.is_read ? "text-foreground" : "text-muted-foreground font-medium"
                          }`}
                        >
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-muted-foreground ml-2 whitespace-nowrap">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        {n.channel && n.channel !== "in_app" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary text-muted-foreground border border-border">
                            {n.channel === "both" ? "App + Email" : "Email"}
                          </span>
                        )}
                        {!n.is_read && (
                          <span className="inline-flex items-center text-[10px] text-primary font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5" />
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
