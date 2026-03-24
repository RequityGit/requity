"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { AccountSettingsTabs } from "@/components/shared/account-settings-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/lib/toast";
import { Loader2, Save, Check } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";

type Profile = Tables<"profiles">;
import { resilientProfileUpdate } from "@/lib/supabase/resilient-profile-update";
import { ProfilePhotoUpload } from "@/components/shared/profile-photo-upload";
import { formatPhoneInput } from "@/lib/format";
import { ACCENT_COLOR_PRESETS } from "@/lib/user-colors";
import { cn } from "@/lib/utils";

export default function AdminAccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setFullName(data.full_name ?? "");
        setEmail(data.email ?? "");
        setPhone(formatPhoneInput(data.phone ?? ""));
        setCompany(data.company_name ?? "");
        setAvatarUrl(data.avatar_url ?? null);
        setAccentColor((data as any).accent_color ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showError("You must be logged in to update your profile");
        return;
      }

      const result = await resilientProfileUpdate(supabase, user.id, {
        full_name: fullName || null,
        email,
        phone: phone || null,
        company_name: company || null,
        accent_color: accentColor,
        updated_at: new Date().toISOString(),
      });

      if (result.error) {
        showError("Could not update profile", result.error);
        return;
      }

      showSuccess("Profile updated");
    } catch {
      showError("An unexpected error occurred", "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!userId) {
    return (
      <div>
        <PageHeader title="Account Settings" description="Manage your profile" />
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AccountSettingsTabs userId={userId}>
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-start gap-5">
            <ProfilePhotoUpload
              userId={userId}
              avatarUrl={avatarUrl}
              fullName={fullName}
              onAvatarChange={setAvatarUrl}
            />
            <div className="pt-2">
              <CardTitle className="text-base">Profile Information</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update your personal details and profile photo
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Your company name"
                  />
                </div>
              </div>

              {/* Accent Color Picker */}
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <p className="text-xs text-muted-foreground">
                  Choose your display color for notes and activity feeds
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {ACCENT_COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAccentColor(color)}
                      className={cn(
                        "h-8 w-8 rounded-full transition-all flex items-center justify-center",
                        accentColor === color
                          ? "ring-2 ring-offset-2 ring-offset-background"
                          : "hover:scale-110"
                      )}
                      style={{
                        backgroundColor: color,
                        ...(accentColor === color ? { ringColor: color } : {}),
                      }}
                      title={color}
                    >
                      {accentColor === color && (
                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>

                {profile && (
                  <p className="text-xs text-muted-foreground">
                    Role: <span className="capitalize font-medium">{profile.role}</span>
                  </p>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </AccountSettingsTabs>
  );
}
