"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { addBorrowerAction } from "@/app/(authenticated)/admin/borrowers/new/actions";
import { Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { US_STATES } from "@/lib/constants";
// Borrower contact fields (first_name, email, etc.) now live on crm_contacts.
// Use `any` for the borrower prop until the form is refactored.

interface AddBorrowerFormProps {
  borrower?: any;
}

const STEPS = [
  { title: "Personal Information", description: "Basic contact details" },
  { title: "Address", description: "Mailing address" },
  { title: "Credit & Experience", description: "Financial background" },
  { title: "Notes", description: "Additional information" },
];

export function AddBorrowerForm({ borrower }: AddBorrowerFormProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Step 1: Personal Information
  const [firstName, setFirstName] = useState(borrower?.first_name ?? "");
  const [lastName, setLastName] = useState(borrower?.last_name ?? "");
  const [email, setEmail] = useState(borrower?.email ?? "");
  const [phone, setPhone] = useState(borrower?.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(borrower?.date_of_birth ?? "");
  const [ssnLastFour, setSsnLastFour] = useState(
    borrower?.ssn_last_four ?? ""
  );
  const [isUsCitizen, setIsUsCitizen] = useState(
    borrower?.is_us_citizen ?? true
  );

  // Step 2: Address
  const [addressLine1, setAddressLine1] = useState(
    borrower?.address_line1 ?? ""
  );
  const [addressLine2, setAddressLine2] = useState(
    borrower?.address_line2 ?? ""
  );
  const [city, setCity] = useState(borrower?.city ?? "");
  const [state, setState] = useState(borrower?.state ?? "");
  const [zip, setZip] = useState(borrower?.zip ?? "");
  const [country, setCountry] = useState(borrower?.country ?? "US");

  // Step 3: Credit & Experience
  const [creditScore, setCreditScore] = useState(
    borrower?.credit_score?.toString() ?? ""
  );
  const [creditReportDate, setCreditReportDate] = useState(
    borrower?.credit_report_date ?? ""
  );
  const [experienceCount, setExperienceCount] = useState(
    borrower?.experience_count?.toString() ?? "0"
  );

  // Step 4: Notes
  const [notes, setNotes] = useState(borrower?.notes ?? "");

  function canProceed(): boolean {
    if (step === 0) {
      return firstName.trim() !== "" && lastName.trim() !== "";
    }
    return true;
  }

  async function handleSubmit() {
    if (!firstName.trim() || !lastName.trim()) return;

    setLoading(true);
    try {
      const result = await addBorrowerAction({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        date_of_birth: dateOfBirth || undefined,
        ssn_last_four: ssnLastFour.trim() || undefined,
        is_us_citizen: isUsCitizen,
        address_line1: addressLine1.trim() || undefined,
        address_line2: addressLine2.trim() || undefined,
        city: city.trim() || undefined,
        state: state || undefined,
        zip: zip.trim() || undefined,
        country: country || "US",
        credit_score: creditScore ? parseInt(creditScore) : undefined,
        credit_report_date: creditReportDate || undefined,
        experience_count: experienceCount
          ? parseInt(experienceCount)
          : undefined,
        notes: notes.trim() || undefined,
      });

      if (result.error) {
        toast({
          title: "Error adding borrower",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Borrower added successfully" });
      router.push(`/admin/borrowers/${result.borrowerId}`);
    } catch (err: any) {
      toast({
        title: "Error adding borrower",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Step Indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => {
                if (i < step || canProceed()) setStep(i);
              }}
              className={`flex items-center gap-2 ${
                i <= step ? "text-[#1a2b4a]" : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                  i < step
                    ? "bg-[#1a2b4a] text-white border-[#1a2b4a]"
                    : i === step
                    ? "border-[#1a2b4a] text-[#1a2b4a]"
                    : "border-gray-300 text-gray-400"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                {s.title}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-0.5 mx-2 ${
                  i < step ? "bg-[#1a2b4a]" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step].title}</CardTitle>
          <CardDescription>{STEPS[step].description}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Personal Information */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ssn">SSN Last 4</Label>
                  <Input
                    id="ssn"
                    value={ssnLastFour}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setSsnLastFour(val);
                    }}
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>US Citizen</Label>
                <Select
                  value={isUsCitizen ? "yes" : "no"}
                  onValueChange={(v) => setIsUsCitizen(v === "yes")}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address1">Address Line 1</Label>
                <Input
                  id="address1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address2">Address Line 2</Label>
                <Input
                  id="address2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Suite 100"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder="10001"
                    maxLength={10}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="US"
                />
              </div>
            </div>
          )}

          {/* Step 3: Credit & Experience */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creditScore">Credit Score</Label>
                  <Input
                    id="creditScore"
                    type="number"
                    value={creditScore}
                    onChange={(e) => setCreditScore(e.target.value)}
                    placeholder="720"
                    min={300}
                    max={850}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creditReportDate">Credit Report Date</Label>
                  <Input
                    id="creditReportDate"
                    type="date"
                    value={creditReportDate}
                    onChange={(e) => setCreditReportDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experienceCount">
                  Experience Count (# of completed deals)
                </Label>
                <Input
                  id="experienceCount"
                  type="number"
                  value={experienceCount}
                  onChange={(e) => setExperienceCount(e.target.value)}
                  placeholder="0"
                  min={0}
                />
              </div>
            </div>
          )}

          {/* Step 4: Notes */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes about this borrower..."
                  rows={6}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <div>
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/borrowers")}
              >
                Cancel
              </Button>
              {step < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                >
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {loading ? "Adding Borrower..." : "Add Borrower"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
