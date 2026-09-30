import { ArrowRight, CloudSun, Crosshair, Wind } from "lucide-react";
import Button from "./ui/Button";
import Surface from "./ui/Surface";

const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function PublicHome({
  venues,
  bows,
  weather,
  notice,
  onDismiss,
  onSignIn,
  onRegister,
  onBook,
}) {
  return (
    <main className="public-shell">
      <header className="public-nav">
        <a className="brand" href="#top">
          <span className="brand-mark">
            <Crosshair size={20} />
          </span>
          <span>C'ARCHERY</span>
        </a>
        <nav className="public-links">
          <a href="#ranges">The ranges</a>
          <a href="#equipment">Equipment</a>
          <a href="#conditions">Conditions</a>
        </nav>
        <div className="public-actions">
          <Button variant="quiet" onClick={onSignIn}>
            Sign in
          </Button>
          <Button onClick={onRegister}>
            Join the range <ArrowRight size={15} />
          </Button>
        </div>
      </header>
      {notice && (
        <div className={`notice ${notice.type}`}>
          <span>{notice.text}</span>
          <button onClick={onDismiss} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}
      <section className="public-hero" id="top">
        <div className="public-hero-copy">
          <p className="eyebrow">C'ARCHERY CLUB · JAKARTA</p>
          <h1>
            Find your
            <br />
            <em>line.</em>
          </h1>
          <p>
            A focused hour can change the shape of your day. Choose your lane,
            set your pace, and settle in.
          </p>
          <Button onClick={onBook}>
            Explore booking <ArrowRight size={17} />
          </Button>
        </div>
        <div
          className="public-hero-art"
          aria-label="Archery target illustration"
        >
          <div className="public-target">
            <span>30</span>
          </div>
          <span className="target-caption">AIM WITH INTENTION · EST. 2018</span>
        </div>
      </section>
      <section className="public-section" id="ranges">
        <div className="public-section-head">
          <div>
            <p className="eyebrow">TWO WAYS TO RESET</p>
            <h2>Your range, your rhythm.</h2>
          </div>
          <p>
            Ten lanes built for practice, focus, and the occasional perfect
            shot.
          </p>
        </div>
        <div className="range-grid">
          {venues.map((venue) => (
            <Surface key={venue.id} className={`range-card ${venue.id}`}>
              <div className="range-icon">
                {venue.id === "outdoor" ? <CloudSun /> : <Crosshair />}
              </div>
              <p className="eyebrow">{venue.label || venue.type}</p>
              <h3>{venue.name}</h3>
              <p>
                {venue.description} · {venue.distance}
              </p>
              <div className="range-card-bottom">
                <span>
                  {money(venue.price)} <small>/ hour</small>
                </span>
                <Button variant="quiet" onClick={onBook}>
                  Book range <ArrowRight size={14} />
                </Button>
              </div>
            </Surface>
          ))}
        </div>
      </section>
      <section className="public-section equipment-section" id="equipment">
        <div className="public-section-head">
          <div>
            <p className="eyebrow">CHOOSE YOUR DRAW</p>
            <h2>Borrow a different view.</h2>
          </div>
          <p>Three bows, three distinct feels. Pick one when you book.</p>
        </div>
        <div className="bow-preview-grid">
          {bows.map((bow) => (
            <Surface key={bow.id} className="bow-preview">
              <span className="bow-glyph">⌒</span>
              <div>
                <h3>{bow.name}</h3>
                <p>{bow.description}</p>
                <span>{money(bow.price)} / session</span>
              </div>
            </Surface>
          ))}
        </div>
      </section>
      <section className="conditions-band" id="conditions">
        <div>
          <p className="eyebrow">OUTDOOR CONDITIONS</p>
          <h2>Look up before you line up.</h2>
          <p>
            {weather?.location || "Jakarta"} ·{" "}
            {weather?.condition || "Weather updates when connected"}
          </p>
        </div>
        <div className="condition-reading">
          <CloudSun size={27} />
          <strong>{weather?.temperature ?? "--"}°C</strong>
          <span>{weather?.rainChance ?? "--"}% rain chance</span>
          <span>
            <Wind size={14} /> {weather?.wind ?? "--"} km/h
          </span>
        </div>
      </section>
      <footer className="public-footer">
        <span>© 2026 C'Archery Club</span>
        <span>Jakarta · Indonesia</span>
        <Button variant="quiet" onClick={onRegister}>
          Start your session <ArrowRight size={14} />
        </Button>
      </footer>
    </main>
  );
}
