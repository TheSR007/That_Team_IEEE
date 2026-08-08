import React, { useState } from "react";
import { FormInput } from "../FormInput";
import { TermsCheckbox } from "./TermsCheckbox";
import { SubmitButton } from "../SubmitButton";

interface SignUpFormProps {
  onSuccess?: (formData: { fullName: string; email: string }) => void;
  signInUrl?: string;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSuccess,
  signInUrl = "#",
}) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please verify your password.");
      return;
    }

    if (!formData.agreeTerms) {
      setError("You must agree to the Terms of Service to continue.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Simulate registration action
    setTimeout(() => {
      setIsSubmitting(false);
      if (onSuccess) {
        onSuccess({
          fullName: formData.fullName,
          email: formData.email,
        });
      }
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="bg-[#93000a]/50 border border-[#ffb4ab]/30 rounded-lg p-3 text-[#ffdad6] text-xs font-['Chivo'] flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Full Name */}
      <FormInput
        id="fullName"
        label="Full Name"
        iconName="person"
        placeholder="John Doe"
        value={formData.fullName}
        onChange={handleChange}
        required
      />

      {/* Email Address */}
      <FormInput
        id="email"
        label="Email Address"
        iconName="mail"
        type="email"
        placeholder="name@example.com"
        value={formData.email}
        onChange={handleChange}
        required
      />

      {/* Password */}
      <FormInput
        id="password"
        label="Password"
        iconName="lock"
        isPassword
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        required
      />

      {/* Confirm Password */}
      <FormInput
        id="confirmPassword"
        label="Confirm Password"
        iconName="lock_reset"
        isPassword
        placeholder="••••••••"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
      />

      {/* Terms Agreement */}
      <TermsCheckbox
        id="agreeTerms"
        checked={formData.agreeTerms}
        onChange={handleChange}
        required
      />

      {/* Submit Action */}
      <SubmitButton isLoading={isSubmitting}>Create Account</SubmitButton>

      {/* Sign In Link */}
      <div className="text-center mt-2 border-t border-white/5 pt-6">
        <p className="font-['Chivo'] text-sm text-[#e9bcb6]">
          Already have an account?{" "}
          <a
            href={signInUrl}
            className="text-[#e5e2e1] font-['Chivo'] font-bold hover:text-[#e50914] transition-colors ml-1"
          >
            Sign In
          </a>
        </p>
      </div>
    </form>
  );
};
