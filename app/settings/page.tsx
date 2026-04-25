"use client";

import React from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  LogOut,
  Settings as SettingsIcon
} from "lucide-react";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const Settings = () => {
  const { data: session, isPending } = authClient.useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && (!session || session.user.isAnonymous)) {
      router.push("/");
    }
  }, [session, isPending, router]);

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans overflow-y-auto">
      <div className="container max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-2 mb-10">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Profile Section */}
          <section className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 border-b">
              <h3 className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2 text-foreground">
                <User className="h-5 w-5" /> Profile
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage your public profile and account information.
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0">
                   {session?.user?.image ? (
                     <img 
                        src={session.user.image} 
                        alt="Avatar" 
                        className="h-full w-full object-cover"
                      />
                   ) : (
                     <User className="h-10 w-10 text-muted-foreground" />
                   )}
                </div>
                <div className="space-y-1">
                   <p className="text-sm font-medium">Profile Picture</p>
                   <p className="text-xs text-muted-foreground mb-2">JPG, GIF or PNG. Max size of 800K</p>
                   <Button variant="outline" size="sm">Change Avatar</Button>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                    Full Name
                  </label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    {session?.user?.name || "Not set"}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                    Email Address
                  </label>
                  <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    {session?.user?.email || "Not set"}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center p-6 pt-0 border-t mt-0 pt-6">
               <Button className="ml-auto" size="sm">Save Changes</Button>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 border-b">
              <h3 className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2 text-foreground">
                <Bell className="h-5 w-5" /> Preferences
              </h3>
              <p className="text-sm text-muted-foreground">
                Customize your application experience.
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Appearance</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark mode.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="relative"
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 border-b">
              <h3 className="text-xl font-semibold leading-none tracking-tight flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5" /> Security
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage your account security and sessions.
              </p>
            </div>
            <div className="p-6 space-y-6">
               <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="rounded-lg border border-destructive/50 bg-destructive/5 shadow-sm overflow-hidden">
            <div className="flex flex-col space-y-1.5 p-6 bg-destructive/10 border-b border-destructive/20">
              <h3 className="text-xl font-semibold leading-none tracking-tight text-destructive">Danger Zone</h3>
              <p className="text-sm text-destructive opacity-80 font-medium">
                Irreversible and destructive actions.
              </p>
            </div>
            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div>
                  <p className="text-sm font-bold text-foreground">Sign Out</p>
                  <p className="text-xs text-muted-foreground">Log out of your current session on this device.</p>
               </div>
               <Button variant="destructive" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
               </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;