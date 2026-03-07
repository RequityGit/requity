"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { updateBorrowerAction } from "@/app/(authenticated)/admin/borrowers/new/actions";
import { Loader2, Pencil } from "lucide-react";
import { US_STATES } from "@/lib/constants";
// Borrower contact fields now live on crm_contacts; use `any` until refactored.

interface BorrowerEditDialogProps {
  borrower: any;
}

export function BorrowerEditDialog({ borrower }: BorrowerEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(borrower.first_name || "");
  const [lastName, setLastName] = useState(borrower.last_name || "");
  const [email, setEmail] = useState(borrower.email || "");
  const [phone, setPhone] = useState(borrower.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    borrower.date_of_birth || ""
  );
  const [ssnLastFour, setSsnLastFour] = useState(
    borrower.ssn_last_four || ""
  );
  const [isUsCitizen, setIsUsCitizen] = useState(borrower.is_us_citizen);
  const [addressLine1, setAddressLine1] = useState(
    borrower.address_line1 || ""
  );
  const [addressLine2, setAddressLine2] = useState(
    borrower.address_line2 || ""
  );
  const [city, setCity] = useState(borrower.city || "");
  const [state, setState] = useState(borrower.state || "");
  const [zip, setZip] = useState(borrower.zip || "");
  const [country, setCountry] = useState(borrower.country || "US");
  const [creditScore, setCreditScore] = useState(
    borrower.credit_score?.toString() || ""
  );
  const [creditReportDate, setCreditReportDate] = useState(
    borrower.credit_report_date || ""
  );
  const [experienceCount, setExperienceCount] = useState(
    borrower.experience_count?.toString() || "0"
  );
  const [notes, setNotes] = useState(borrower.notes || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    setLoading(true);
    try {
      const result = await updateBorrowerAction({
        id: borrower.id,
        crm_contact_id: borrower.crm_contact_id ?? undefined,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        date_of_birth: dateOfBirth || undefined,
        ssn_last_four: ssnLastFour.trim() || undefined,
        is_us_citizen: isUsCitizen ?? undefined,
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
          title: "Error updating borrower",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Borrower updated successfully" });
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast({
        title: "Error updating borrower",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit Borrower
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Borrower</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editFirstName">First Name *</Label>
              <Input
                id="editFirstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLastName">Last Name *</Label>
              <Input
                id="editLastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone</Label>
              <Input
                id="editPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="editDob">Date of Birth</Label>
              <Input
                id="editDob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editSsn">SSN Last 4</Label>
              <Input
                id="editSsn"
                value={ssnLastFour}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setSsnLastFour(val);
                }}
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

          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold mb-3">Address</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editAddr1">Address Line 1</Label>
                <Input
                  id="editAddr1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAddr2">Address Line 2</Label>
                <Input
                  id="editAddr2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCity">City</Label>
                  <Input
                    id="editCity"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editState">State</Label>
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
                  <Label htmlFor="editZip">ZIP Code</Label>
                  <Input
                    id="editZip"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-semibold mb-3">Credit & Experience</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCreditScore">Credit Score</Label>
                <Input
                  id="editCreditScore"
                  type="number"
                  value={creditScore}
                  onChange={(e) => setCreditScore(e.target.value)}
                  min={300}
                  max={850}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCreditDate">Credit Report Date</Label>
                <Input
                  id="editCreditDate"
                  type="date"
                  value={creditReportDate}
                  onChange={(e) => setCreditReportDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editExp">Experience Count</Label>
                <Input
                  id="editExp"
                  type="number"
                  value={experienceCount}
                  onChange={(e) => setExperienceCount(e.target.value)}
                  min={0}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editNotes">Notes</Label>
            <Textarea
              id="editNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !firstName.trim() || !lastName.trim()}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
