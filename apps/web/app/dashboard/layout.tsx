"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Columns3,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  LucideCommand,
  ChevronLeft,
  Home,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore, useNotificationStore } from "@/lib/store";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { ThemeToggle } from "@/components/theme-toggle";
import { RoleSwitcher } from "@/components/role-switcher";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/pipelines", label: "Pipelines", icon: Columns3 },
  { href: "/dashboard/members", label: "Members", icon: Users },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/ai", label: "AI Assistant", icon: Bot },
];



function SidebarContent({ collapsed, onToggle }: { collapsed: boolean; onToggle?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filteredNavItems = navItems.filter(item => {
    if (item.label === "Members") {
      return ["MASTER", "LEADERSHIP"].includes(user?.role?.tier || "");
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="w-9 h-9 bg-indigo-600/20 rounded-lg flex items-center justify-center border border-indigo-500/30 shrink-0">
          <LucideCommand className="w-5 h-5 text-indigo-400" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">ECOS</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Control Panel</p>
          </div>
        )}
        {onToggle && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            onClick={onToggle}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator className="bg-zinc-800/50" />

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <TooltipProvider key={item.href} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                        isActive
                          ? "bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(79,70,229,0.1)]"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                      {!collapsed && <span>{item.label}</span>}
                      {!collapsed && item.label === "Notifications" && <NotificationBadge />}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-700">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator className="bg-zinc-800/50" />

      {/* Footer */}
      {!collapsed && (
        <div className="p-3">
          <div className="rounded-lg bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/10 p-3">
            <p className="text-[11px] text-zinc-400">IEEE Student Branch</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">VITB 2025-2026</p>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationBadge() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  if (!unreadCount) return null;
  return (
    <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] text-[10px] px-1.5 bg-red-600 hover:bg-red-600">
      {unreadCount > 9 ? "9+" : unreadCount}
    </Badge>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { user, loading, fetchUser, logout } = useAuthStore();
  const { fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    fetchUser();
    fetchUnreadCount();
  }, [fetchUser, fetchUnreadCount]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      const socket = connectSocket(user.id, user.committeeId);
      socket.on("notification:new", () => fetchUnreadCount());
      return () => {
        disconnectSocket();
      };
    }
  }, [user, fetchUnreadCount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-zinc-500">Loading ECOS...</p>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-zinc-200 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-[240px]"
        }`}
      >
        <SidebarContent collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-14 border-b border-zinc-200 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 text-zinc-400">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] p-0 bg-zinc-950 border-zinc-800">
                <SidebarContent collapsed={false} />
              </SheetContent>
            </Sheet>

            {/* Collapse toggle for desktop */}
            {collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex h-8 w-8 text-zinc-400 hover:text-white"
                onClick={() => setCollapsed(false)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
            {/* Home button */}
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                      <Home className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-zinc-800 text-white border-zinc-700">
                  Homepage
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center gap-2">
            {/* Role Switcher (MASTER only) */}
            <RoleSwitcher />

            {/* Notification bell */}
            <Link href="/dashboard/notifications">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white relative">
                <Bell className="h-4 w-4" />
                <NotificationDot />
              </Button>
            </Link>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 gap-2 px-2 text-zinc-400 hover:text-white">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-indigo-600/20 text-indigo-400 text-[10px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {user?.name && <span className="hidden sm:inline text-xs font-medium">{user.name}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800">
                <DropdownMenuLabel className="text-zinc-300">
                  <div className="flex flex-col">
                    <span className="text-sm">{user?.name}</span>
                    <span className="text-xs text-zinc-500 font-normal">{user?.email}</span>
                    {user?.role && (
                      <Badge variant="outline" className="mt-1 w-fit text-[10px] border-indigo-500/30 text-indigo-400">
                        {user.role.name}
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="text-zinc-400 hover:text-white cursor-pointer" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NotificationDot() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  if (!unreadCount) return null;
  return (
    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
  );
}
