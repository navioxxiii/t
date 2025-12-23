/**
 * KYC Wizard Component
 * Multi-step verification flow
 * Step 1: Tier Selection
 * Step 2: Personal Information
 * Step 3: Document Upload (if Tier 2)
 * Step 4: Review & Submit
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DocumentUploader } from "./DocumentUploader";
import { LivenessCheck } from "./LivenessCheck";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { branding } from "@/config/branding";

type KYCTierType = "tier_1_basic" | "tier_2_advanced";
type IDDocumentType = "passport" | "drivers_license" | "national_id";

interface KYCTier {
  tier: KYCTierType;
  daily_limit_usd: string;
  monthly_limit_usd: string;
  single_transaction_limit_usd: string;
  can_deposit: boolean;
  can_withdraw: boolean;
  can_swap: boolean;
  can_send: boolean;
  can_earn: boolean;
  can_copy_trade: boolean;
}

interface FormData {
  // Tier
  tier: KYCTierType | null;
  limit?: string;

  // Personal Info
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  phoneNumber: string;

  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;

  // Documents (Tier 2)
  idDocumentType: IDDocumentType | null;
  idDocumentFront: File | null;
  idDocumentBack: File | null;
  selfie: File | null;
}

interface ValidationErrors {
  [key: string]: string;
}

export function KYCWizard() {
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycTiers, setKycTiers] = useState<KYCTier[]>([]);
  const [loadingTiers, setLoadingTiers] = useState(true);

  useEffect(() => {
    // Fetch KYC limits from API
    const fetchKycTiers = async () => {
      try {
        const response = await fetch("/api/kyc");
        const data = await response.json();
        if (response.ok) {
          setKycTiers(data.data);
          setLoadingTiers(false);
        }
      } catch (error) {
        console.error("Failed to fetch KYC limits:", error);
        setLoadingTiers(false);
      }
    };
    fetchKycTiers();
  }, []);
  const [formData, setFormData] = useState<FormData>({
    tier: null,
    fullName: profile?.full_name || "",
    dateOfBirth: "",
    nationality: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    country: "",
    idDocumentType: null,
    idDocumentFront: null,
    idDocumentBack: null,
    selfie: null,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});

  const totalSteps = 4;

  // Update form field
  const updateField = (
    field: keyof FormData,
    value: string | File | IDDocumentType | KYCTierType | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate Step 1: Tier Selection
  const validateStep1 = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.tier) {
      newErrors.tier = "Please select a verification tier";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 2: Personal Info
  const validateStep2 = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      // Check age (must be 18+)
      const dob = new Date(formData.dateOfBirth);
      const age = Math.floor(
        (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      if (age < 18) {
        newErrors.dateOfBirth = "You must be at least 18 years old";
      }
    }

    if (!formData.nationality.trim()) {
      newErrors.nationality = "Nationality is required";
    }

    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Postal code is required";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 3: Documents (Tier 2 only)
  const validateStep3 = (): boolean => {
    if (formData.tier !== "tier_1_basic") return true;

    const newErrors: ValidationErrors = {};

    if (!formData.idDocumentType) {
      newErrors.idDocumentType = "Please select an ID document type";
    }

    if (!formData.idDocumentFront) {
      newErrors.idDocumentFront = "ID document front is required";
    }

    if (
      formData.idDocumentType === "drivers_license" ||
      formData.idDocumentType === "national_id"
    ) {
      if (!formData.idDocumentBack) {
        newErrors.idDocumentBack = "ID document back is required";
      }
    }

    if (!formData.selfie) {
      newErrors.selfie = "Selfie is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Next
  const handleNext = () => {
    let isValid = false;

    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    } else if (currentStep === 3 && formData.tier === "tier_1_basic") {
      isValid = validateStep3();
    } else {
      isValid = true;
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    } else {
      toast.error("Please fill all required fields correctly");
    }
  };

  // Handle Back
  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Handle Submit
  const handleSubmit = async () => {
    // Final validation
    if (!validateStep1() || !validateStep2()) {
      toast.error("Please complete all required fields");
      return;
    }

    if (formData.tier === "tier_1_basic" && !validateStep3()) {
      toast.error("Please upload all required documents");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload documents first (if Tier 2)
      const documentUrls: { [key: string]: string } = {};

      if (formData.tier === "tier_1_basic") {
        const uploadPromises = [];

        if (formData.idDocumentFront) {
          uploadPromises.push(
            uploadDocument(formData.idDocumentFront, "id_front").then((url) => {
              documentUrls.id_document_front_url = url;
            })
          );
        }

        if (formData.idDocumentBack) {
          uploadPromises.push(
            uploadDocument(formData.idDocumentBack, "id_back").then((url) => {
              documentUrls.id_document_back_url = url;
            })
          );
        }

        if (formData.selfie) {
          uploadPromises.push(
            uploadDocument(formData.selfie, "selfie").then((url) => {
              documentUrls.selfie_url = url;
            })
          );
        }

        await Promise.all(uploadPromises);
      }

      // Submit KYC application
      const response = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requested_tier: formData.tier,
          full_name: formData.fullName.trim(),
          date_of_birth: formData.dateOfBirth,
          nationality: formData.nationality.trim(),
          phone_number: formData.phoneNumber.trim() || null,
          address_line_1: formData.addressLine1.trim(),
          address_line_2: formData.addressLine2.trim() || null,
          city: formData.city.trim(),
          state_province: formData.stateProvince.trim() || null,
          postal_code: formData.postalCode.trim(),
          country: formData.country.trim(),
          id_document_type: formData.idDocumentType,
          ...documentUrls,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit KYC application");
      }

      toast.success("KYC application submitted successfully!");

      // Refresh profile to update KYC status
      await refreshProfile();

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("KYC submission error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit KYC application";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload document to Supabase storage
  const uploadDocument = async (file: File, type: string): Promise<string> => {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    uploadFormData.append("type", type);

    const response = await fetch("/api/kyc/documents/upload", {
      method: "POST",
      body: uploadFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to upload document");
    }

    return data.publicUrl;
  };

  return (
    <div className="min-h-screen bg-bg-primary pb-8 px-4 pt-nav">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8 sticky w-full top-16 sm:top-24 z-100 border-b rounded-full border-bg-tertiary bg-bg-secondary/95 backdrop-blur supports-backdrop-filter:bg-bg-secondary/80 px-4 py-4">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNumber = index + 1;
              const isActive = currentStep === stepNumber;
              const isCompleted = currentStep > stepNumber;

              return (
                <div key={stepNumber} className="flex items-center flex-1">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                      isCompleted && "bg-brand-primary border-brand-primary",
                      isActive && "border-brand-primary text-brand-primary",
                      !isActive &&
                        !isCompleted &&
                        "border-bg-tertiary text-text-tertiary"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-bg-primary" />
                    ) : (
                      <span className="text-sm font-semibold">
                        {stepNumber}
                      </span>
                    )}
                  </div>

                  {stepNumber < totalSteps && (
                    <div
                      className={cn(
                        "flex-1 h-0.5 mx-2",
                        isCompleted ? "bg-brand-primary" : "bg-bg-tertiary"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg p-6 space-y-6">
          {/* Step 1: Tier Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-2">
                  Choose Verification Level
                </h2>
                <p className="text-sm text-text-secondary">
                  Select the verification tier that matches your needs
                </p>
              </div>

              {loadingTiers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {/* === BASIC TIER — Active & Selectable === */}
                  {kycTiers
                    .filter((t) => t.tier === "tier_1_basic")
                    .map((tier) => (
                      <button
                        key={tier.tier}
                        type="button"
                        disabled={profile?.kyc_status === "pending" || profile?.kyc_status === "under_review" ||  profile?.kyc_status === "approved" || isSubmitting }
                        onClick={() => { updateField("tier", "tier_1_basic"); updateField("limit", tier.daily_limit_usd); }}
                        className={cn(
                          "text-left p-6 rounded-xl border-2 transition-all duration-300 relative",
                          formData.tier === "tier_1_basic"
                            ? "border-brand-primary bg-brand-primary/5 shadow-lg"
                            : "border-bg-tertiary bg-bg-secondary hover:border-brand-primary/40",
                          (profile?.kyc_status === "pending" || profile?.kyc_status === "under_review" || profile?.kyc_status === "approved" || isSubmitting) && "opacity-60 cursor-not-allowed"
                        )}
                      >
                        { /* Verified badge if already verified */ }
                        {(profile?.kyc_status === "approved" && profile?.kyc_tier === "tier_1_basic") && (
                          <div className="absolute top-4 right-4 flex items-center gap-1 bg-action-green/20 text-action-green text-xs font-medium px-2 py-1 rounded-full">
                            <Check className="w-4 h-4" />
                            Verified
                          </div>
                        )}
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-text-primary">
                            Basic Verification
                          </h3>
                          {formData.tier === "tier_1_basic" && (
                            <Check className="w-7 h-7 text-brand-primary" />
                          )}
                        </div>

                        <p className="text-2xl font-bold text-brand-primary mb-5">
                          ${Number(tier.daily_limit_usd).toLocaleString()}/day
                        </p>

                        <p className="text-sm text-text-secondary mb-5">
                          Perfect for most users
                        </p>

                        <div className="space-y-2 text-sm">
                          {tier.can_deposit && (
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-action-green" />
                              <span className="text-text-secondary">
                                Deposit & Withdraw
                              </span>
                            </div>
                          )}
                          {tier.can_swap && (
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-action-green" />
                              <span className="text-text-secondary">
                                Swap & Send
                              </span>
                            </div>
                          )}
                          {tier.can_earn && (
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-action-green" />
                              <span className="text-text-secondary">
                                Earn Rewards
                              </span>
                            </div>
                          )}
                          {tier.can_copy_trade && (
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-action-green" />
                              <span className="font-medium text-text-secondary">
                                Copy Trading
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}

                  {/* === ELITE TIER — Muted, Disabled, Professional === */}
                  {kycTiers
                    .filter((t) => t.tier === "tier_2_advanced")
                    .map((tier) => (
                      <div
                        key={tier.tier}
                        className="relative rounded-xl border-2 border-dashed border-text-tertiary/30 bg-bg-secondary/50 p-6 opacity-75"
                      >
                        {/* Subtle "Locked" overlay */}
                        <div className="absolute inset-0 rounded-xl bg-bg-secondary/60 backdrop-blur-[2px]" />

                        <div className="relative">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-text-tertiary">
                                Elite Membership
                              </h3>
                              <p className="text-xs text-text-tertiary font-medium mt-1 uppercase tracking-wider">
                                • Invite-Only •
                              </p>
                            </div>
                            <div className="bg-text-tertiary/20 text-text-tertiary text-xs font-bold px-3 py-1.5 rounded-full">
                              ELITE
                            </div>
                          </div>

                          <p className="text-2xl font-bold text-text-tertiary">
                            Unlimited Limits
                          </p>
                          <p className="text-xs text-text-tertiary mt-1 mb-5">
                            Institutional-grade access
                          </p>

                          {/* Same check icons as Basic — consistent style */}
                          <div className="space-y-2.5 text-sm">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-text-tertiary/60 flex-shrink-0" />
                              <span className="text-text-tertiary">
                                All Basic features
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-text-tertiary/60 flex-shrink-0" />
                              <span className="text-text-tertiary">
                                OTC Trading & Fiat Rails
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-text-tertiary/60 flex-shrink-0" />
                              <span className="text-text-tertiary">
                                Premium Earn & Loans
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-text-tertiary/60 flex-shrink-0" />
                              <span className="text-text-tertiary">
                                Dedicated Manager + Events
                              </span>
                            </div>
                          </div>

                          <div className="mt-6 pt-5 border-t border-text-tertiary/20">
                            <p className="text-center text-xs text-text-tertiary">
                              Available by invitation only
                            </p>
                            <p className="text-center text-xs mt-2">
                              <a
                                href={branding.company.email ? `mailto:${branding.company.email}` : 'mailto:vip@support.com'}
                                className="text-brand-primary/70 underline hover:text-brand-primary"
                              >
                                {branding.company.email ? branding.company.email : 'vip@support.com'}
                              </a>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              {errors.tier && (
                <p className="text-xs text-action-red">{errors.tier}</p>
              )}
            </div>
          )}

          {/* Step 2: Personal Information - will continue in next message due to length */}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-2">
                  Personal Information
                </h2>
                <p className="text-sm text-text-secondary">
                  Enter your personal details as they appear on your ID
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="fullName">
                    Full Legal Name <span className="text-action-red">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                    placeholder="John Doe"
                    className={errors.fullName ? "border-action-red" : ""}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-action-red mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="dateOfBirth">
                    Date of Birth <span className="text-action-red">*</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    className={cn('w-full',errors.dateOfBirth ? "border-action-red" : "")}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-xs text-action-red mt-1">
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                {/* Nationality */}
                <div className=' space-y-1'>
                  <Label htmlFor="nationality">
                    Nationality <span className="text-action-red">*</span>
                  </Label>
                  <Input
                    id="nationality"
                    type="text"
                    value={formData.nationality}
                    onChange={(e) => updateField("nationality", e.target.value)}
                    placeholder="United States"
                    className={errors.nationality ? "border-action-red" : ""}
                  />
                  {errors.nationality && (
                    <p className="text-xs text-action-red mt-1">
                      {errors.nationality}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => updateField("phoneNumber", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                {/* Address Line 1 */}
                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="addressLine1">
                    Address Line 1 <span className="text-action-red">*</span>
                  </Label>
                  <Input
                    id="addressLine1"
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) =>
                      updateField("addressLine1", e.target.value)
                    }
                    placeholder="123 Main Street"
                    className={errors.addressLine1 ? "border-action-red" : ""}
                  />
                  {errors.addressLine1 && (
                    <p className="text-xs text-action-red mt-1">
                      {errors.addressLine1}
                    </p>
                  )}
                </div>

                {/* Address Line 2 */}
                <div className="md:col-span-2 space-y-1">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    type="text"
                    value={formData.addressLine2}
                    onChange={(e) =>
                      updateField("addressLine2", e.target.value)
                    }
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </div>

                {/* City */}
                <div className=' space-y-1'>
                  <Label htmlFor="city">
                    City <span className="text-action-red">*</span>
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="New York"
                    className={errors.city ? "border-action-red" : ""}
                  />
                  {errors.city && (
                    <p className="text-xs text-action-red mt-1">
                      {errors.city}
                    </p>
                  )}
                </div>

                {/* State/Province */}
                <div className=' space-y-1'>
                  <Label htmlFor="stateProvince">State/Province</Label>
                  <Input
                    id="stateProvince"
                    type="text"
                    value={formData.stateProvince}
                    onChange={(e) =>
                      updateField("stateProvince", e.target.value)
                    }
                    placeholder="NY"
                  />
                </div>

                {/* Postal Code */}
                <div className=' space-y-1'>
                  <Label htmlFor="postalCode">
                    Postal Code <span className="text-action-red">*</span>
                  </Label>
                  <Input
                    id="postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => updateField("postalCode", e.target.value)}
                    placeholder="10001"
                    className={errors.postalCode ? "border-action-red" : ""}
                  />
                  {errors.postalCode && (
                    <p className="text-xs text-action-red mt-1">
                      {errors.postalCode}
                    </p>
                  )}
                </div>

                {/* Country */}
                <div className=' space-y-1'>
                  <Label htmlFor="country">
                    Country <span className="text-action-red">*</span>
                  </Label>
                  <Input
                    id="country"
                    type="text"
                    value={formData.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    placeholder="United States"
                    className={errors.country ? "border-action-red" : ""}
                  />
                  {errors.country && (
                    <p className="text-xs text-action-red mt-1">
                      {errors.country}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Documents (Tier 2 only) */}
          {currentStep === 3 && formData.tier === "tier_1_basic" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-2">
                  Identity Documents
                </h2>
                <p className="text-sm text-text-secondary">
                  Upload clear photos of your ID document and a selfie
                </p>
              </div>

              {/* ID Document Type */}
              <div>
                <Label>
                  ID Document Type <span className="text-action-red">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(
                    [
                      "passport",
                      "drivers_license",
                      "national_id",
                    ] as IDDocumentType[]
                  ).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField("idDocumentType", type)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-xs transition-all",
                        formData.idDocumentType === type
                          ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                          : "border-bg-tertiary text-text-secondary"
                      )}
                    >
                      {type === "passport" && "Passport"}
                      {type === "drivers_license" && "Driver's License"}
                      {type === "national_id" && "National ID"}
                    </button>
                  ))}
                </div>
                {errors.idDocumentType && (
                  <p className="text-xs text-action-red mt-1">
                    {errors.idDocumentType}
                  </p>
                )}
              </div>

              {/* ID Document Front */}
              <DocumentUploader
                label="ID Document (Front)"
                description="Take a clear photo of the front of your ID"
                value={formData.idDocumentFront}
                onChange={(file) => updateField("idDocumentFront", file)}
                error={errors.idDocumentFront}
                required
              />

              {/* ID Document Back (if not passport) */}
              {formData.idDocumentType &&
                formData.idDocumentType !== "passport" && (
                  <DocumentUploader
                    label="ID Document (Back)"
                    description="Take a clear photo of the back of your ID"
                    value={formData.idDocumentBack}
                    onChange={(file) => updateField("idDocumentBack", file)}
                    error={errors.idDocumentBack}
                    required
                  />
                )}

              {/* Selfie */}
              <LivenessCheck
                label="Selfie Verification"
                description="Take a selfie to verify your identity"
                value={formData.selfie}
                onChange={(file) => updateField("selfie", file)}
                error={errors.selfie}
                required
              />
            </div>
          )}

          {/* Step 4 (or 3 for Tier 1): Review */}
          {((currentStep === 3 && formData.tier === "tier_2_advanced") || currentStep === 4) && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-text-primary mb-2">
                  Review & Submit
                </h2>
                <p className="text-sm text-text-secondary">
                  Please review your information before submitting
                </p>
              </div>

              {/* Tier */}
              <div className="bg-bg-tertiary/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  Verification Tier
                </h3>
                <p className="text-sm text-text-secondary">
                  {formData.tier === "tier_1_basic"
                    ? "Basic (Tier 1)"
                    : "Advanced (Tier 2)"}{" "}
                  — ${formData.limit}/day
                  limit
                </p>
              </div>

              {/* Personal Info */}
              <div className="bg-bg-tertiary/30 rounded-lg p-4 space-y-2">
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  Personal Information
                </h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-text-tertiary">Full Name:</span>
                    <p className="text-text-primary font-medium">
                      {formData.fullName}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Date of Birth:</span>
                    <p className="text-text-primary font-medium">
                      {formData.dateOfBirth}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Nationality:</span>
                    <p className="text-text-primary font-medium">
                      {formData.nationality}
                    </p>
                  </div>
                  {formData.phoneNumber && (
                    <div>
                      <span className="text-text-tertiary">Phone:</span>
                      <p className="text-text-primary font-medium">
                        {formData.phoneNumber}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="bg-bg-tertiary/30 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-text-primary mb-3">
                  Address
                </h3>
                <p className="text-sm text-text-primary">
                  {formData.addressLine1}
                  {formData.addressLine2 && `, ${formData.addressLine2}`}
                  <br />
                  {formData.city}
                  {formData.stateProvince && `, ${formData.stateProvince}`}{" "}
                  {formData.postalCode}
                  <br />
                  {formData.country}
                </p>
              </div>

              {/* Documents (if Tier 2) */}
              {formData.tier === "tier_1_basic" && (
                <div className="bg-bg-tertiary/30 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">
                    Documents
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-action-green" />
                      <span className="text-text-secondary">
                        ID Document (
                        {formData.idDocumentType?.replace("_", " ")})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-action-green" />
                      <span className="text-text-secondary">
                        Selfie Verification
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-lg p-4">
                <p className="text-xs text-text-secondary">
                  By submitting this application, you confirm that all
                  information provided is accurate and truthful. False
                  information may result in account suspension.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4 mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="min-w-[100px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
