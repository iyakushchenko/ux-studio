import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { ProtoCloseIcon } from "@/app/chrome/ProtoCloseIcon";

type Props = {
  open: boolean;
  initialTab?: "signin" | "create";
  onClose: () => void;
  onSignIn: () => void;
};

type Tab = "signin" | "create" | "forgot";

export default function LoginPopup({ open, initialTab, onClose, onSignIn }: Props) {
  const [tab, setTab] = useState<Tab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createError, setCreateError] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef<number>(0);

  const captureHeight = () => {
    if (cardRef.current) {
      prevHeightRef.current = cardRef.current.getBoundingClientRect().height;
    }
  };

  // Animate card height on content change (useLayoutEffect to prevent flash)
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !open) return;
    const prevHeight = prevHeightRef.current;
    if (!prevHeight) return;

    // Measure new content height
    card.style.transition = "none";
    card.style.height = "auto";
    const newHeight = card.scrollHeight;

    if (Math.abs(prevHeight - newHeight) > 2) {
      // Set to old height without transition
      card.style.height = `${prevHeight}px`;
      void card.offsetHeight;
      // Now animate to new height
      card.style.transition = "height 0.35s ease";
      card.style.height = `${newHeight}px`;
      const onEnd = () => {
        card.style.height = "auto";
        card.removeEventListener("transitionend", onEnd);
      };
      card.addEventListener("transitionend", onEnd);
    }
  }, [tab, createError, forgotSent]);

  const switchTab = (newTab: Tab) => {
    captureHeight();
    setTab(newTab);
  };

  useEffect(() => {
    if (open) {
      prevHeightRef.current = 0;
      if (cardRef.current) cardRef.current.style.height = "auto";
      setTab(initialTab || "signin");
      setEmail("sarah.jenkins@example.com");
      setPassword("S@rah_Jnk!ns2024");
      setShowPassword(false);
      setRemember(true);
      setCreateEmail("");
      setCreatePassword("");
      setShowCreatePassword(false);
      setCreateError(false);
      setForgotEmail("");
      setForgotSent(false);
    }
  }, [open]);

  if (!open) return null;

  const onScrim = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSignIn = () => {
    onSignIn();
    onClose();
  };

  return (
    <div className="proto-avail-scrim" role="presentation" onClick={onScrim}>
      <div
        className="proto-avail-card proto-login-card"
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="proto-login-title"
      >
        <div className="proto-avail-header">
          <h2 id="proto-login-title" className="proto-avail-title">
            Account
          </h2>
          <button
            type="button"
            className="proto-popup-close"
            aria-label="Close login"
            onClick={onClose}
          >
            <ProtoCloseIcon />
          </button>
        </div>

        <div className="proto-avail-body proto-avail-body--stack">
          {/* Avatar icon */}
          <div className="proto-login-avatar">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="40" fill="none" />
              <circle cx="40" cy="30" r="11" stroke="#012169" strokeWidth="2.5" fill="none" />
              <path d="M16 68c0-11 10-18 24-18s24 7 24 18" stroke="#012169" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>

          {tab === "forgot" ? (
            <>
              <p className="proto-login-subtitle" style={{ fontSize: "18px", fontWeight: 600, color: "#012169" }}>Reset your password</p>
              <div className="proto-avail-panel proto-login-panel">
              <div className="proto-login-form" key="forgot">
                {forgotSent ? (
                  <div className="proto-login-success">
                    If an account exists for this email, you will receive a password reset link shortly.
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 13, color: "#5c5c5c", textAlign: "center", lineHeight: "1.5" }}>
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                    <label className="proto-login-label">
                      <span className="proto-login-label-text">
                        <span className="proto-login-required">*</span> Email
                      </span>
                      <div className="proto-avail-field proto-avail-field--flex proto-login-input-wrap">
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          autoComplete="email"
                        />
                      </div>
                    </label>
                    <button
                      type="button"
                      className="proto-avail-btn-primary proto-login-cta"
                      onClick={() => setForgotSent(true)}
                    >
                      Send reset link
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="proto-avail-link"
                  style={{ alignSelf: "center", marginTop: 8 }}
                  onClick={() => switchTab("signin")}
                >
                  Back to Sign in
                </button>
              </div>
              </div>
            </>
          ) : (
            <>
              <p className="proto-login-subtitle">Sign in or create an account</p>

              <div className="proto-avail-panel proto-login-panel">
              {/* Tabs */}
              <div className="proto-avail-toggle" role="tablist" aria-label="Account">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "signin"}
                  className={
                    tab === "signin"
                      ? "proto-avail-toggle__tab proto-avail-toggle__tab--active"
                      : "proto-avail-toggle__tab"
                  }
                  onClick={() => switchTab("signin")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "create"}
                  className={
                    tab === "create"
                      ? "proto-avail-toggle__tab proto-avail-toggle__tab--active"
                      : "proto-avail-toggle__tab"
                  }
                  onClick={() => switchTab("create")}
                >
                  Create account
                </button>
              </div>

              {/* Sign in form */}
              {tab === "signin" && (
                <div className="proto-login-form" key="signin">
                  <label className="proto-login-label">
                    <span className="proto-login-label-text">
                      <span className="proto-login-required">*</span> Email
                    </span>
                    <div className="proto-avail-field proto-avail-field--flex proto-login-input-wrap">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  </label>

                  <label className="proto-login-label">
                    <span className="proto-login-label-text">
                      <span className="proto-login-required">*</span> Password
                      <span className="proto-avail-link proto-login-forgot" onClick={(e) => { e.preventDefault(); switchTab("forgot"); }}>Forgot Password?</span>
                    </span>
                    <div className="proto-avail-field proto-avail-field--flex proto-login-input-wrap">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <PasswordToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                    </div>
                  </label>

                  <label className="proto-login-remember">
                    <span
                      className={`proto-login-checkbox ${remember ? "proto-login-checkbox--checked" : ""}`}
                      onClick={(e) => { e.preventDefault(); setRemember(!remember); }}
                    >
                      {remember && <CheckMark />}
                    </span>
                    Remember me
                  </label>

                  <button
                    type="button"
                    className="proto-avail-btn-primary proto-login-cta"
                    onClick={handleSignIn}
                  >
                    Sign in
                  </button>

                  <p className="proto-login-or">Or sign in with</p>
                  <SocialRow />
                </div>
              )}

          {/* Create account form */}
          {tab === "create" && (
            <div className="proto-login-form" key="create">
              {createError && (
                <div className="proto-login-error">
                  Sorry, we are unable to create your account. Please try again. If the issue continues, please contact our{" "}
                  <span className="proto-avail-link">Customer Service</span>
                </div>
              )}

              <label className="proto-login-label">
                <span className="proto-login-label-text">
                  <span className="proto-login-required">*</span> Email
                </span>
                <div className="proto-avail-field proto-avail-field--flex proto-login-input-wrap">
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="proto-login-label">
                <span className="proto-login-label-text">
                  <span className="proto-login-required">*</span> Password
                </span>
                <div className="proto-avail-field proto-avail-field--flex proto-login-input-wrap">
                  <input
                    type={showCreatePassword ? "text" : "password"}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <PasswordToggle show={showCreatePassword} onToggle={() => setShowCreatePassword(!showCreatePassword)} />
                </div>
              </label>

              <button
                type="button"
                className="proto-avail-btn-primary proto-login-cta"
                onClick={() => {
                  setCreateEmail("sarah.jenkins@example.com");
                  setCreatePassword("S@rah_Jnk!ns2024");
                  setCreateError(true);
                }}
              >
                Create account
              </button>

              <p className="proto-login-or">Or sign up with</p>
              <SocialRow />
            </div>
          )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className="proto-login-toggle-pw"
      onClick={onToggle}
      aria-label={show ? "Hide password" : "Show password"}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        {show ? (
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="#afccca" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 01-4.24-4.24" stroke="#afccca" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="1" y1="1" x2="23" y2="23" stroke="#afccca" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
      </svg>
    </button>
  );
}

function CheckMark() {
  return (
    <svg width="14" height="10" viewBox="0 0 13.4079 10.1151" fill="none">
      <path clipRule="evenodd" d="M0 5.49077L1.40162 4.06407L4.69457 7.29914L11.9937 0L13.4079 1.41421L4.70705 10.1151L0 5.49077Z" fill="#305854" fillRule="evenodd"/>
    </svg>
  );
}

function SocialRow() {
  return (
    <div className="proto-login-socials">
      <SocialIcon provider="facebook" label="Sign in with Facebook" />
      <SocialIcon provider="apple" label="Sign in with Apple" />
      <SocialIcon provider="x" label="Sign in with X" />
      <SocialIcon provider="google" label="Sign in with Google" />
    </div>
  );
}

type SocialProvider = "facebook" | "apple" | "x" | "google";

function SocialIcon({
  provider,
  label,
}: {
  provider: SocialProvider;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`proto-login-social-icon proto-login-social-icon--${provider}`}
      aria-label={label}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        {provider === "facebook" && (
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
        )}
        {provider === "apple" && (
          <path d="M18.71 19.5c-1.008 1.056-2.124.888-3.192.396-1.128-.504-2.16-.528-3.36 0-1.5.672-2.292.48-3.192-.396C4.326 14.736 5.046 8.352 10.062 8.088c1.38.072 2.34.756 3.144.816.9-.18 1.764-.696 2.724-.624 1.152.096 2.016.456 2.592 1.152-2.376 1.416-1.812 4.536.72 5.4-.576 1.5-1.32 2.988-2.652 4.668zM12.912 8.04C12.768 6.18 14.28 4.656 16.02 4.5c.252 2.16-1.968 3.78-3.108 3.54z" />
        )}
        {provider === "x" && (
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        )}
        {provider === "google" && (
          <>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </>
        )}
      </svg>
    </button>
  );
}
