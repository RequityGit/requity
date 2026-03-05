"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { AccountSettingsTabs } from "@/components/shared/account-settings-tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";
import { PhoneVerifyDialog } from "@/components/investor/phone-verify-dialog";
import { Save, Loader2, Building2, ShieldCheck } from "lucide-react";
import { resilientProfileUpdate } from "@/lib/supabase/resilient-profile-update";
import { ProfilePhotoUpload } from "@/components/shared/profile-photo-upload";

type ProfileData = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  avatar_url: string | null;
};

type CommitmentData = {
  id: string;
  fund_name: string;
  commitment_amount: number;
  funded_amount: number;
  unfunded_amount: number;
  commitment_date: string | null;
  status: string;
};

export default function InvestorAccountPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [commitments, setCommitments] = useState<CommitmentData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // OTP verification state
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Track original values to detect sensitive changes
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        setUserId(user.id);

        // Load profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileData) {
          const pd = profileData as any;
          setProfile({
            id: pd.id,
            full_name: pd.full_name,
            email: pd.email,
            phone: pd.phone,
            company_name: pd.company_name ?? null,
            avatar_url: pd.avatar_url ?? null,
          });
          setAvatarUrl(pd.avatar_url ?? null);
          setFullName(pd.full_name ?? "");
          setEmail(pd.email ?? "");
          setPhone(pd.phone ?? "");
          setCompany(pd.company_name ?? "");
          setOriginalEmail(pd.email ?? "");
          setOriginalPhone(pd.phone ?? "");
        }

        // Look up investor record ID from auth user
        const { data: investorRecord } = await supabase
          .from("investors")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        // Load commitments using investor record ID
        const { data: commitmentData } = investorRecord
          ? await supabase
              .from("investor_commitments")
              .select("*, funds(name)")
              .eq("investor_id", investorRecord.id)
              .order("created_at", { ascending: false })
          : { data: null };

        if (commitmentData) {
          setCommitments(
            commitmentData.map((c: any) => ({
              id: c.id,
              fund_name: c.funds?.name ?? "Unknown Investment",
              commitment_amount: c.commitment_amount,
              funded_amount: c.funded_amount,
              unfunded_amount: c.unfunded_amount,
              commitment_date: c.commitment_date,
              status: c.status,
            }))
          );
        }
      } catch (err) {
        console.error("Failed to load account data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const hasSensitiveChanges =
    email !== originalEmail || phone !== originalPhone;

  const requiresOtp = hasSensitiveChanges && !otpVerified;

  const handleSave = async () => {
    if (!profile) return;

    // If sensitive changes and OTP not verified, require verification first
    if (requiresOtp) {
      if (!originalPhone) {
        toast({
          title: "Phone number required",
          description:
            "A phone number on file is required for identity verification. Contact your administrator.",
          variant: "destructive",
        });
        return;
      }
      setShowOtpDialog(true);
      return;
    }

    setSaving(true);
    try {
      const result = await resilientProfileUpdate(supabase, profile.id, {
        full_name: fullName || null,
        email,
        phone: phone || null,
        company_name: company || null,
        updated_at: new Date().toISOString(),
      });

      if (result.error) {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update original values after successful save
      setOriginalEmail(email);
      setOriginalPhone(phone);
      setOtpVerified(false);

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (err) {
      console.error("Save failed:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOtpVerified = () => {
    setOtpVerified(true);
    toast({
      title: "Identity verified",
      description: "You can now save your profile changes.",
    });
  };

  if (!userId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Account Settings" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AccountSettingsTabs
      userId={userId}
      description="Manage your profile information and view your fund commitments."
    >
      <div className="space-y-6">
        {/* Profile Form */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start gap-5">
              <ProfilePhotoUpload
                userId={userId}
                avatarUrl={avatarUrl}
                fullName={fullName}
                onAvatarChange={setAvatarUrl}
              />
              <div className="pt-2">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Personal Information
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Update your personal details and profile photo
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address
                      {email !== originalEmail && (
                        <span className="ml-2 text-xs text-amber-600 font-normal">
                          (requires verification)
                        </span>
                      )}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number
                      {phone !== originalPhone && (
                        <span className="ml-2 text-xs text-amber-600 font-normal">
                          (requires verification)
                        </span>
                      )}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Enter your company name"
                    />
                  </div>
                </div>

                {/* Sensitive change notice */}
                {hasSensitiveChanges && !otpVerified && (
                  <div className="mt-4 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                    <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Identity verification required
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Changing your email or phone number requires SMS verification
                        for security.
                      </p>
                    </div>
                  </div>
                )}

                {hasSensitiveChanges && otpVerified && (
                  <div className="mt-4 flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-3">
                    <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Identity verified
                      </p>
                      <p className="text-xs text-green-700 mt-0.5">
                        You can now save your changes.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : requiresOtp ? (
                      <ShieldCheck className="h-4 w-4 mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {requiresOtp ? "Verify & Save" : "Save Changes"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Read-only Commitments Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-foreground" />
              <CardTitle className="text-lg font-semibold text-foreground">
                Investment Commitments
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {commitments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No investment commitments on record.
              </p>
            ) : (
              <div className="space-y-4">
                {commitments.map((commitment) => {
                  const pctFunded =
                    commitment.commitment_amount > 0
                      ? Math.round(
                          (commitment.funded_amount /
                            commitment.commitment_amount) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      key={commitment.id}
                      className="rounded-lg border p-4 bg-muted/50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-foreground">
                          {commitment.fund_name}
                        </h4>
                        <StatusBadge status={commitment.status} />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Committed</p>
                          <p className="num font-medium">
                            {formatCurrency(commitment.commitment_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Funded</p>
                          <p className="num font-medium">
                            {formatCurrency(commitment.funded_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Unfunded</p>
                          <p className="num font-medium">
                            {formatCurrency(commitment.unfunded_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Commitment Date</p>
                          <p className="num font-medium">
                            {formatDate(commitment.commitment_date)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Funding Progress</span>
                          <span className="num">{pctFunded}%</span>
                        </div>
                        <div className="w-full bg-card rounded-full h-2 border">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(pctFunded, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* OTP Verification Dialog */}
        <PhoneVerifyDialog
          open={showOtpDialog}
          onOpenChange={setShowOtpDialog}
          phone={originalPhone}
          onVerified={handleOtpVerified}
        />
      </div>
    </AccountSettingsTabs>
  );
}
