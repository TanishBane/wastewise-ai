import React, { useState } from "react";
import {
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MetalButton from "../MetalButton";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  initialMode = "signin",
}) => {
  const {
    isConfigured,
    recoveryMode,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    resendVerificationEmail,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot" | "reset">(
    recoveryMode ? "reset" : initialMode,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [canteenName, setCanteenName] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [verificationPendingEmail, setVerificationPendingEmail] = useState<
    string | null
  >(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) {
          setErrorMessage(error.message);
        } else {
          onClose();
        }
      } else if (mode === "signup") {
        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match.");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }

        const { error, needsEmailVerification } = await signUp(
          email,
          password,
          fullName,
          canteenName || "Central Canteen",
        );

        if (error) {
          setErrorMessage(error.message);
        } else if (needsEmailVerification) {
          setVerificationPendingEmail(email);
          setSuccessMessage(
            "Account created! Please check your email inbox to verify your account before signing in.",
          );
        } else {
          setSuccessMessage("Account created successfully!");
          setTimeout(() => onClose(), 1200);
        }
      } else if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) {
          setErrorMessage(error.message);
        } else {
          setSuccessMessage(
            "Password recovery email dispatched. Please check your inbox for the reset link.",
          );
        }
      } else if (mode === "reset") {
        if (password !== confirmPassword) {
          setErrorMessage("Passwords do not match.");
          setLoading(false);
          return;
        }
        const { error } = await updatePassword(password);
        if (error) {
          setErrorMessage(error.message);
        } else {
          setSuccessMessage("Your password has been securely updated!");
          setTimeout(() => {
            setMode("signin");
            onClose();
          }, 1500);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verificationPendingEmail) return;
    setLoading(true);
    setErrorMessage("");
    const { error } = await resendVerificationEmail(verificationPendingEmail);
    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage("Verification email resent. Check your inbox.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-[var(--surface,#fcfaf5)] rounded-2xl border border-[var(--border,#d4cdbf)] shadow-2xl overflow-hidden p-6 text-[var(--ink,#1f2923)]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-[var(--ink-light,#666)] hover:bg-[var(--surface-muted,#eee9de)] transition"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-[var(--primary,#1e4638)] text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif leading-tight">
              {mode === "signin" && "Sign In to WasteWise"}
              {mode === "signup" && "Create Canteen Account"}
              {mode === "forgot" && "Recover Account"}
              {mode === "reset" && "Set New Password"}
            </h2>
            <p className="text-xs text-[var(--ink-light,#666)]">
              Secure multi-tenant canteen operational intelligence
            </p>
          </div>
        </div>

        {/* Supabase Missing Notice (if unconfigured) */}
        {!isConfigured && (
          <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 mb-1 text-amber-800">
              <KeyRound className="w-4 h-4" /> Supabase Connection Pending
            </p>
            Add{" "}
            <code className="bg-amber-100 px-1 py-0.5 rounded">
              VITE_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="bg-amber-100 px-1 py-0.5 rounded">
              VITE_SUPABASE_PUBLISHABLE_KEY
            </code>{" "}
            to your frontend environment to enable live Supabase Auth.
          </div>
        )}

        {/* Notification alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p>{successMessage}</p>
              {verificationPendingEmail && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="mt-2 text-xs font-semibold text-emerald-900 underline hover:no-underline"
                >
                  Resend verification email
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab switcher */}
        {mode !== "reset" && !verificationPendingEmail && (
          <div className="flex border-b border-[var(--border,#d4cdbf)] mb-5 text-sm font-medium">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMessage("");
              }}
              className={`pb-2.5 px-3 border-b-2 transition ${
                mode === "signin"
                  ? "border-[var(--primary,#1e4638)] text-[var(--primary,#1e4638)] font-semibold"
                  : "border-transparent text-[var(--ink-light,#666)] hover:text-black"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMessage("");
              }}
              className={`pb-2.5 px-3 border-b-2 transition ${
                mode === "signup"
                  ? "border-[var(--primary,#1e4638)] text-[var(--primary,#1e4638)] font-semibold"
                  : "border-transparent text-[var(--ink-light,#666)] hover:text-black"
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-[var(--ink-light,#666)]" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Chef Anita Rao"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border,#d4cdbf)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary,#1e4638)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Canteen / Dining Hall Name
                </label>
                <div className="relative">
                  <UtensilsCrossed className="w-4 h-4 absolute left-3 top-2.5 text-[var(--ink-light,#666)]" />
                  <input
                    type="text"
                    required
                    value={canteenName}
                    onChange={(e) => setCanteenName(e.target.value)}
                    placeholder="e.g. North Campus Dining"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border,#d4cdbf)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary,#1e4638)]"
                  />
                </div>
              </div>
            </>
          )}

          {mode !== "reset" && (
            <div>
              <label className="block text-xs font-semibold mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[var(--ink-light,#666)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chef@canteen.edu"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border,#d4cdbf)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary,#1e4638)]"
                />
              </div>
            </div>
          )}

          {mode !== "forgot" && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold">
                  {mode === "reset" ? "New Password" : "Password"}
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    className="text-xs text-[var(--primary,#1e4638)] hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[var(--ink-light,#666)]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border,#d4cdbf)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary,#1e4638)]"
                />
              </div>
            </div>
          )}

          {(mode === "signup" || mode === "reset") && (
            <div>
              <label className="block text-xs font-semibold mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[var(--ink-light,#666)]" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border,#d4cdbf)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary,#1e4638)]"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <MetalButton
              type="submit"
              disabled={loading}
              className="button primary w-full justify-center text-sm font-semibold py-2.5"
            >
              {loading
                ? "Processing..."
                : mode === "signin"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : mode === "forgot"
                      ? "Send Reset Link"
                      : "Update Password"}
            </MetalButton>
          </div>

          {mode === "forgot" && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMessage("");
                }}
                className="text-xs text-[var(--ink-light,#666)] hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
