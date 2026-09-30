import { ArrowLeft, ArrowRight, Crosshair } from "lucide-react";
import Button from "./ui/Button";
import Surface from "./ui/Surface";
import TextField from "./ui/TextField";

export default function AuthPage({
  mode,
  setMode,
  form,
  setForm,
  onSubmit,
  onBack,
  submitting,
  notice,
  onDismiss,
}) {
  const isLogin = mode === "login";
  const update = (field) => (event) =>
    setForm({ ...form, [field]: event.target.value });
  return (
    <main className="public-shell auth-page">
      <header className="public-nav">
        <button className="brand brand-button" onClick={onBack}>
          <span className="brand-mark">
            <Crosshair size={20} />
          </span>
          <span>C'ARCHERY</span>
        </button>
        <Button variant="quiet" onClick={onBack}>
          <ArrowLeft size={16} /> Back to range
        </Button>
      </header>
      {notice && (
        <div className={`notice ${notice.type}`}>
          <span>{notice.text}</span>
          <button onClick={onDismiss} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}
      <div className="auth-layout">
        <div className="auth-aside">
          <p className="eyebrow">A BETTER KIND OF FOCUS</p>
          <h1>
            Find your
            <br />
            <em>line.</em>
          </h1>
          <p>Book your next session at the range. Your lane is waiting.</p>
          <div className="auth-target">
            <span>30</span>
          </div>
        </div>
        <Surface className="auth-card">
          <p className="eyebrow">C'ARCHERY MEMBERSHIP</p>
          <h2>{isLogin ? "Welcome back." : "Join the range."}</h2>
          <p className="auth-description">
            {isLogin
              ? "Sign in to manage your sessions."
              : "Create an account and start finding your line."}
          </p>
          <form onSubmit={onSubmit} className="auth-form">
            {!isLogin && (
              <TextField
                id="auth-name"
                label="Name"
                autoComplete="name"
                required
                value={form.name}
                onChange={update("name")}
              />
            )}
            <TextField
              id="auth-email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={update("email")}
            />
            <TextField
              id="auth-password"
              label="Password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
              required
              value={form.password}
              onChange={update("password")}
            />
            <Button type="submit" disabled={submitting} className="full">
              {submitting
                ? "Please wait..."
                : isLogin
                  ? "Sign in"
                  : "Create account"}{" "}
              <ArrowRight size={16} />
            </Button>
          </form>
          <Button
            variant="quiet"
            className="auth-switch"
            onClick={() => setMode(isLogin ? "register" : "login")}
          >
            {isLogin
              ? "New to C’Archery? Create an account"
              : "Already a member? Sign in"}
          </Button>
        </Surface>
      </div>
      <footer className="public-footer">
        <span>© 2026 C'Archery Club</span>
        <span>Jakarta · Indonesia</span>
        <span>Made for better aim</span>
      </footer>
    </main>
  );
}
