import React, { useState } from "react";
import { FormInput } from "../FormInput";
import { RememberMeCheckbox } from "./RememberMeCheckbox";
import { SubmitButton } from "../SubmitButton";
import { SocialLoginButtons } from "./SocialLoginButtons";

interface SignInFormProps {
  onSuccess?: (formData: { email: string }) => void;
  signUpUrl?: string;
  forgotPasswordUrl?: string;
}

export const SignInForm: React.FC<SignInFormProps> = ({
  onSuccess,
  signUpUrl = "/signup",
  forgotPasswordUrl = "#",
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Simulate sign in action
    setTimeout(() => {
      setIsSubmitting(false);
      if (onSuccess) {
        onSuccess({ email });
      }
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {error && (
        <div className="bg-[#93000a]/50 border border-[#ffb4ab]/30 rounded-lg p-3 text-[#ffdad6] text-xs font-['Chivo'] flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Email Input */}
      <FormInput
        id="email"
        label="Email Address"
        iconName="mail"
        type="email"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {/* Password Input */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          <label
            htmlFor="password"
            className="font-['Chivo'] text-xs text-[#e9bcb6] uppercase tracking-wider font-medium"
          >
            Password
          </label>
          <a
            href={forgotPasswordUrl}
            className="font-['Chivo'] text-xs text-[#e50914] hover:text-white transition-colors"
          >
            Forgot Password?
          </a>
        </div>
        <FormInput
          id="password"
          label=""
          iconName="lock"
          isPassword
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {/* Remember Me */}
      <RememberMeCheckbox
        id="remember"
        checked={rememberMe}
        onChange={(e) => setRememberMe(e.target.checked)}
      />

      {/* Submit Button */}
      <SubmitButton isLoading={isSubmitting}>Sign In</SubmitButton>

      {/* Social Logins */}
      <SocialLoginButtons />

      {/* Sign Up Redirect Prompt */}
      <div className="mt-2 text-center">
        <p className="font-['Chivo'] text-sm text-[#e9bcb6]">
          New to CinemaSeat?{" "}
          <a
            href={signUpUrl}
            className="text-white hover:text-[#e50914] font-['Chivo'] font-bold transition-colors ml-1"
          >
            Create an account
          </a>
        </p>
      </div>
    </form>
  );
};
