import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CloudSun,
  Crosshair,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
  UserRound,
  Users,
  Wind,
  X,
} from "lucide-react";
import AdminPanel from "./components/AdminPanel";
import AuthPage from "./components/AuthPage";
import PublicHome from "./components/PublicHome";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const today = new Date().toISOString().slice(0, 10);
const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
const formatDate = (value) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    ...options,
  });
  const contentType = response.headers.get("content-type") || "";
  const body =
    response.status === 204
      ? null
      : contentType.includes("application/json")
        ? await response.json()
        : null;
  if (!response.ok) throw new Error(body?.message || "Something went wrong");
  return body;
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    () => localStorage.getItem("carchery-token") || "",
  );
  const [venues, setVenues] = useState([]);
  const [bows, setBows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("overview");
  const [venueId, setVenueId] = useState("outdoor");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("16:00");
  const [laneId, setLaneId] = useState("O2");
  const [duration, setDuration] = useState(2);
  const [bowId, setBowId] = useState("recurve");
  const [bringOwnBow, setBringOwnBow] = useState(false);
  const [reserved, setReserved] = useState([]);
  const [notice, setNotice] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [authPage, setAuthPage] = useState(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const venue = venues.find((item) => item.id === venueId);
  const selectedBow = bows.find((item) => item.id === bowId);
  const total =
    (venue?.price || 0) * duration +
    (!bringOwnBow ? selectedBow?.price || 0 : 0);
  const availableTimes = ["08:00", "10:00", "13:00", "16:00"];

  useEffect(() => {
    Promise.all([request("/venues"), request("/bows"), request("/weather")])
      .then(([v, b, w]) => {
        setVenues(v);
        setBows(b);
        setWeather(w);
      })
      .catch((error) => setNotice({ type: "error", text: error.message }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (venueId && date)
      request(`/availability?venueId=${venueId}&date=${date}`)
        .then((data) => {
          setReserved(data.reserved);
          if (data.reserved.includes(laneId))
            setLaneId(
              data.lanes.find((lane) => !data.reserved.includes(lane.id))?.id ||
                data.lanes[0].id,
            );
        })
        .catch((error) => setNotice({ type: "error", text: error.message }));
  }, [venueId, date]);
  useEffect(() => {
    if (!token) {
      setBookings([]);
      setUser(null);
      localStorage.removeItem("carchery-user");
      return;
    }
    let current = true;
    request("/me", { token })
      .then((currentUser) => {
        if (!current) return null;
        setUser(currentUser);
        localStorage.setItem("carchery-user", JSON.stringify(currentUser));
        return request("/bookings", { token });
      })
      .then((items) => {
        if (current && items) setBookings(items);
      })
      .catch((error) => {
        if (!current) return;
        setUser(null);
        setToken("");
        localStorage.removeItem("carchery-user");
        localStorage.removeItem("carchery-token");
        setNotice({
          type: "error",
          text: `Please sign in again. ${error.message}`,
        });
      });
    return () => {
      current = false;
    };
  }, [token]);
  const filteredBookings = useMemo(
    () =>
      bookings.filter(
        (item) =>
          `${item.id} ${item.venue?.name || ""} ${item.status}`
            .toLowerCase()
            .includes(search.toLowerCase()) &&
          (statusFilter === "all" || item.status === statusFilter),
      ),
    [bookings, search, statusFilter],
  );

  function setSession(nextUser, nextToken) {
    setUser(nextUser);
    setToken(nextToken);
    localStorage.setItem("carchery-user", JSON.stringify(nextUser));
    localStorage.setItem("carchery-token", nextToken);
  }
  async function createBooking(event) {
    event.preventDefault();
    try {
      const activeToken = token;
      if (!activeToken) {
        setNotice({
          type: "info",
          text: "Please sign in before creating a booking.",
        });
        setAuthMode("login");
        setAuthPage("login");
        return;
      }
      await request("/bookings", {
        method: "POST",
        token: activeToken,
        body: JSON.stringify({
          venueId,
          laneId,
          date,
          time,
          duration,
          bowId,
          bringOwnBow,
        }),
      });
      setBookings(await request("/bookings", { token: activeToken }));
      setActive("bookings");
      setNotice({
        type: "success",
        text: "Your lane is confirmed. See you at the range.",
      });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    }
  }
  async function cancelBooking(id) {
    try {
      await request(`/bookings/${id}/cancel`, { method: "PATCH", token });
      setBookings(await request("/bookings", { token }));
      setNotice({ type: "success", text: "Booking cancelled successfully." });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    }
  }
  async function login() {
    const result = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: authForm.email,
        password: authForm.password,
      }),
    });
    setSession(result.user, result.token);
    setAuthPage(null);
    setNotice({ type: "success", text: `Welcome back, ${result.user.name}.` });
  }
  async function submitAuth(event) {
    event.preventDefault();
    setAuthSubmitting(true);
    try {
      if (authMode === "login") await login();
      else {
        const result = await request("/auth/register", {
          method: "POST",
          body: JSON.stringify(authForm),
        });
        setSession(result.user, result.token);
        setAuthPage(null);
        setNotice({
          type: "success",
          text: "Account created. Your range is ready.",
        });
      }
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally {
      setAuthSubmitting(false);
    }
  }

  if (!user) {
    if (loading)
      return (
        <div className="public-loading">
          <div className="loader" />
          <p>Preparing the range</p>
        </div>
      );
    if (authPage)
      return (
        <AuthPage
          mode={authMode}
          setMode={setAuthMode}
          form={authForm}
          setForm={setAuthForm}
          onSubmit={submitAuth}
          onBack={() => {
            setAuthPage(null);
            setNotice(null);
          }}
          submitting={authSubmitting}
          notice={notice}
          onDismiss={() => setNotice(null)}
        />
      );
    return (
      <PublicHome
        venues={venues}
        bows={bows}
        weather={weather}
        notice={notice}
        onDismiss={() => setNotice(null)}
        onSignIn={() => {
          setAuthMode("login");
          setAuthPage("login");
        }}
        onRegister={() => {
          setAuthMode("register");
          setAuthPage("register");
        }}
        onBook={() => {
          setNotice({
            type: "info",
            text: "Sign in or create an account to reserve a lane.",
          });
          setAuthMode("login");
          setAuthPage("login");
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className={mobileMenu ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <span className="brand-mark">
            <Crosshair size={20} />
          </span>
          <span>C'ARCHERY</span>
        </div>
        <div className="side-label">Workspace</div>
        <nav>
          {[
            ["overview", LayoutDashboard, "Overview"],
            ["book", Plus, "New booking"],
            ["bookings", Ticket, "My bookings"],
            ...(user?.role === "admin"
              ? [["admin", ShieldCheck, "Admin desk"]]
              : []),
          ].map(([id, Icon, label]) => (
            <button
              className={active === id ? "nav-item active" : "nav-item"}
              onClick={() => {
                setActive(id);
                setMobileMenu(false);
              }}
              key={id}
            >
              <Icon size={18} />
              {label}
              {id === "bookings" && bookings.length > 0 && (
                <span className="nav-count">{bookings.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="member-card">
            <div className="avatar">
              {user?.name?.slice(0, 2).toUpperCase() || "AR"}
            </div>
            <div>
              <strong>{user?.name || "Guest Archer"}</strong>
              <small>
                {user?.role === "admin"
                  ? "Administrator"
                  : user
                    ? "Member since 2024"
                    : "Sign in to book"}
              </small>
            </div>
            <ChevronDown size={15} />
          </div>
          {user && (
            <button
              className="logout"
              onClick={() => {
                setToken("");
                setUser(null);
                localStorage.removeItem("carchery-user");
                localStorage.removeItem("carchery-token");
              }}
            >
              <LogOut size={16} />
              Sign out
            </button>
          )}
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-toggle"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumbs">
            Workspace <span>/</span>{" "}
            <strong>
              {active === "book"
                ? "New booking"
                : active === "bookings"
                  ? "My bookings"
                  : active === "admin"
                    ? "Admin desk"
                    : "Overview"}
            </strong>
          </div>
          <div className="top-actions">
            <button className="icon-button">
              <Search size={18} />
            </button>
            <div className="top-avatar">
              {user?.name?.slice(0, 2).toUpperCase() || "AP"}
            </div>
          </div>
        </header>
        {notice && (
          <div className={`notice ${notice.type}`}>
            <span>
              {notice.type === "success" ? (
                <Check size={17} />
              ) : (
                <Sparkles size={17} />
              )}
              {notice.text}
            </span>
            <button onClick={() => setNotice(null)}>
              <X size={16} />
            </button>
          </div>
        )}
        <div className="page-wrap">
          {loading ? (
            <div className="loading-state">
              <div className="loader" />
              <h2>Preparing your range</h2>
              <p>Loading lanes, equipment, and weather.</p>
            </div>
          ) : (
            <>
              {active === "overview" && (
                <Overview
                  user={user}
                  bookings={bookings}
                  weather={weather}
                  onNew={() => setActive("book")}
                  onBookings={() => setActive("bookings")}
                />
              )}
              {active === "book" && (
                <BookingForm
                  venue={venue}
                  venues={venues}
                  bows={bows}
                  venueId={venueId}
                  setVenueId={setVenueId}
                  date={date}
                  setDate={setDate}
                  time={time}
                  setTime={setTime}
                  laneId={laneId}
                  setLaneId={setLaneId}
                  duration={duration}
                  setDuration={setDuration}
                  bowId={bowId}
                  setBowId={setBowId}
                  bringOwnBow={bringOwnBow}
                  setBringOwnBow={setBringOwnBow}
                  reserved={reserved}
                  availableTimes={availableTimes}
                  selectedBow={selectedBow}
                  total={total}
                  weather={weather}
                  onSubmit={createBooking}
                />
              )}
              {active === "bookings" && (
                <Bookings
                  bookings={filteredBookings}
                  search={search}
                  setSearch={setSearch}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  onCancel={cancelBooking}
                />
              )}
              {active === "admin" && (
                <Admin
                  bookings={bookings}
                  bows={bows}
                  search={search}
                  setSearch={setSearch}
                  onCancel={cancelBooking}
                  onBowsChange={setBows}
                  token={token}
                  onNotice={setNotice}
                />
              )}
            </>
          )}
        </div>
        <footer>
          <span>© 2026 C'Archery Club</span>
          <span>Jakarta · Indonesia</span>
          <span>
            Made for better aim <Crosshair size={13} />
          </span>
        </footer>
      </main>
    </div>
  );
}

function Overview({ user, bookings, weather, onNew, onBookings }) {
  const upcoming = bookings.find((item) => item.status === "confirmed");
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">
            {user?.role === "admin"
              ? "CONTROL CENTER"
              : `GOOD AFTERNOON, ${user?.name?.split(" ")[0]?.toUpperCase() || "ARCHER"}`}
          </p>
          <h1>
            Make time for
            <br />
            <em>your best shot.</em>
          </h1>
          <p className="hero-copy">
            Reserve your lane, choose your bow,
            <br />
            and let the rest find its rhythm.
          </p>
          <button className="primary-button" onClick={onNew}>
            Book a lane <ArrowRight size={17} />
          </button>
        </div>
        <div className="hero-art">
          <div className="target-rings">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <i></i>
            <span>30</span>
          </div>
          <span className="art-note">
            FIND YOUR LINE
            <br />
            <b>EST. 2018</b>
          </span>
        </div>
      </section>
      <section className="section-heading">
        <div>
          <p className="eyebrow">YOUR RANGE</p>
          <h2>Everything in one view</h2>
        </div>
        <button className="text-button" onClick={onBookings}>
          View all bookings <ArrowRight size={15} />
        </button>
      </section>
      <div className="overview-grid">
        <div className="upcoming-card">
          <div className="card-head">
            <span className="tag green">UPCOMING</span>
            <span>{upcoming ? upcoming.id : "NO ACTIVE BOOKING"}</span>
          </div>
          {upcoming ? (
            <>
              <div className="upcoming-main">
                <div>
                  <h3>{upcoming.venue?.name || "Outdoor range"}</h3>
                  <p>
                    <CalendarDays size={15} /> {formatDate(upcoming.date)} ·{" "}
                    {upcoming.time}
                  </p>
                </div>
                <div className="booking-date">
                  <strong>
                    {new Date(`${upcoming.date}T12:00:00`).getDate()}
                  </strong>
                  <span>SEP</span>
                </div>
              </div>
              <div className="line-meta">
                <span>
                  <Crosshair size={14} /> {upcoming.laneId}
                </span>
                <span>
                  <UserRound size={14} />{" "}
                  {upcoming.bow?.name || "Own equipment"}
                </span>
                <span>{upcoming.duration}h session</span>
              </div>
            </>
          ) : (
            <div className="empty-mini">
              <p>Your next session belongs here.</p>
              <button className="text-button" onClick={onNew}>
                Create booking <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
        <div className="weather-card">
          <div className="card-head">
            <span className="tag yellow">OUTDOOR TODAY</span>
            <CloudSun size={20} />
          </div>
          <div className="weather-temp">
            {weather?.temperature || 24}°<span>C</span>
          </div>
          <p>
            {weather?.condition || "Partly cloudy"} · Great conditions for a
            session
          </p>
          <div className="weather-meta">
            <span>
              <Wind size={14} /> {weather?.wind || 12} km/h
            </span>
            <span>Rain {weather?.rainChance || 18}%</span>
          </div>
        </div>
      </div>
    </>
  );
}

function BookingForm({
  venue,
  venues,
  bows,
  venueId,
  setVenueId,
  date,
  setDate,
  time,
  setTime,
  laneId,
  setLaneId,
  duration,
  setDuration,
  bowId,
  setBowId,
  bringOwnBow,
  setBringOwnBow,
  reserved,
  availableTimes,
  total,
  selectedBow,
  weather,
  onSubmit,
}) {
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">RESERVE YOUR SESSION</p>
          <h1>Book a lane</h1>
          <p>Pick a range, find your rhythm, and make it count.</p>
        </div>
        <span className="step-count">
          01 <i>/</i> 03
        </span>
      </div>
      <form className="booking-layout" onSubmit={onSubmit}>
        <div className="booking-main">
          <div className="form-block">
            <div className="block-title">
              <span>01</span>
              <div>
                <h2>Choose your range</h2>
                <p>Both ranges have 5 dedicated lanes.</p>
              </div>
            </div>
            <div className="venue-options">
              {venues.map((item) => (
                <button
                  type="button"
                  className={
                    venueId === item.id
                      ? "venue-option selected"
                      : "venue-option"
                  }
                  onClick={() => {
                    setVenueId(item.id);
                    setLaneId(item.lanes[0].id);
                  }}
                  key={item.id}
                >
                  <div className={`venue-icon ${item.accent}`}>
                    {item.id === "outdoor" ? (
                      <CloudSun size={22} />
                    ) : (
                      <Crosshair size={22} />
                    )}
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.description}</small>
                  </div>
                  <span className="venue-price">
                    {money(item.price)}
                    <small>/ hour</small>
                  </span>
                  <span className="radio-dot">
                    {venueId === item.id && <i />}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="form-block">
            <div className="block-title">
              <span>02</span>
              <div>
                <h2>Set the details</h2>
                <p>Choose a date and time that works for you.</p>
              </div>
            </div>
            <div className="field-grid">
              <label>
                Date
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  min={today}
                />
              </label>
              <label>
                Duration
                <select
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                >
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="3">3 hours</option>
                </select>
              </label>
            </div>
            <div className="field-label">Time slot</div>
            <div className="time-options">
              {availableTimes.map((item) => (
                <button
                  type="button"
                  className={time === item ? "time-chip selected" : "time-chip"}
                  onClick={() => setTime(item)}
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="field-label">Choose your lane</div>
            <div className="lane-options">
              {venue?.lanes.map((lane) => (
                <button
                  type="button"
                  disabled={reserved.includes(lane.id)}
                  className={
                    laneId === lane.id ? "lane-chip selected" : "lane-chip"
                  }
                  onClick={() => setLaneId(lane.id)}
                  key={lane.id}
                >
                  <Crosshair size={15} />
                  {lane.name.replace("Lane ", "")}
                  {reserved.includes(lane.id) && <small>FULL</small>}
                </button>
              ))}
            </div>
          </div>
          <div className="form-block">
            <div className="block-title">
              <span>03</span>
              <div>
                <h2>Equipment</h2>
                <p>Bring your own, or try something new.</p>
              </div>
            </div>
            <label
              className={
                bringOwnBow ? "equipment-toggle selected" : "equipment-toggle"
              }
            >
              <input
                type="checkbox"
                checked={bringOwnBow}
                onChange={(event) => setBringOwnBow(event.target.checked)}
              />
              <span className="check-box">
                {bringOwnBow && <Check size={14} />}
              </span>
              <span>
                <strong>I’m bringing my own bow</strong>
                <small>No rental fee added</small>
              </span>
            </label>
            {!bringOwnBow && (
              <div className="bow-grid">
                {bows.map((bow) => (
                  <button
                    type="button"
                    className={
                      bowId === bow.id ? "bow-option selected" : "bow-option"
                    }
                    onClick={() => setBowId(bow.id)}
                    key={bow.id}
                  >
                    <div className="bow-shape">⌒</div>
                    <strong>{bow.name}</strong>
                    <p>{bow.description}</p>
                    <span>{money(bow.price)} / session</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <aside className="booking-summary">
          <div className="summary-sticky">
            <p className="eyebrow">YOUR SESSION</p>
            <h2>{venue?.name || "Select a range"}</h2>
            <div className="summary-line">
              <span>
                <CalendarDays size={15} /> {formatDate(date)}
              </span>
              <strong>{time}</strong>
            </div>
            <div className="summary-line">
              <span>
                <Crosshair size={15} /> Lane {laneId?.slice(1)}
              </span>
              <strong>
                {duration} hour{duration > 1 ? "s" : ""}
              </strong>
            </div>
            <hr />
            <div className="summary-price">
              <span>Estimated total</span>
              <strong>{money(total)}</strong>
            </div>
            <button className="primary-button full" type="submit">
              Continue to checkout <ArrowRight size={17} />
            </button>
            <small className="secure-note">
              <ShieldCheck size={14} /> Free cancellation up to 24 hours before
            </small>
            {venueId === "outdoor" && (
              <div className="summary-weather">
                <CloudSun size={17} />
                <span>
                  <strong>
                    {weather?.temperature || 24}°C and{" "}
                    {weather?.condition?.toLowerCase() || "partly cloudy"}
                  </strong>
                  <small>Weather forecast updates automatically</small>
                </span>
              </div>
            )}
          </div>
        </aside>
      </form>
    </>
  );
}

function Bookings({
  bookings,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onCancel,
}) {
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">YOUR ACTIVITY</p>
          <h1>My bookings</h1>
          <p>Keep an eye on every session, past and future.</p>
        </div>
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search bookings"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <select
          className="status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="table-wrap">
        <div className="table-head">
          <span>Booking</span>
          <span>Session</span>
          <span>Lane</span>
          <span>Status</span>
          <span>Total</span>
          <span></span>
        </div>
        {bookings.length ? (
          bookings.map((item) => (
            <div className="table-row" key={item.id}>
              <div>
                <strong>{item.id}</strong>
                <small>{formatDate(item.date)}</small>
              </div>
              <div>
                <strong>{item.venue?.name}</strong>
                <small>
                  {item.time} · {item.duration}h
                </small>
              </div>
              <span>{item.laneId}</span>
              <span
                className={`tag ${item.status === "confirmed" ? "green" : item.status === "cancelled" ? "red" : "neutral"}`}
              >
                {item.status}
              </span>
              <strong>{money(item.total)}</strong>
              {item.status === "confirmed" && (
                <button
                  className="row-action"
                  onClick={() => onCancel(item.id)}
                >
                  Cancel
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Ticket size={28} />
            <h3>No bookings found</h3>
            <p>Try a different search or create your next session.</p>
          </div>
        )}
      </div>
    </>
  );
}

function Admin({
  bookings,
  bows,
  search,
  setSearch,
  onCancel,
  onBowsChange,
  token,
  onNotice,
}) {
  const isEmpty = !bookings.length;
  return (
    <>
      <div className="page-title">
        <div>
          <p className="eyebrow">OPERATIONS</p>
          <h1>Admin desk</h1>
          <p>Keep the range moving with a clear view of every booking.</p>
        </div>
        <span className="tag green">
          <ShieldCheck size={14} /> Admin access
        </span>
      </div>
      <div className="admin-stats">
        <div>
          <small>Today’s bookings</small>
          <strong>
            {bookings.filter((item) => item.date === "2026-09-24").length || 1}
          </strong>
          <span className="positive">+12% vs last week</span>
        </div>
        <div>
          <small>Active members</small>
          <strong>248</strong>
          <span className="positive">+18 this month</span>
        </div>
        <div>
          <small>Occupancy rate</small>
          <strong>68%</strong>
          <span>Across 10 lanes</span>
        </div>
      </div>
      <AdminPanel
        bows={bows}
        token={token}
        onBowsChange={onBowsChange}
        onNotice={onNotice}
      />
      <div className="table-wrap">
        <div className="list-toolbar">
          <h2>All bookings</h2>
          <div className="search-box">
            <Search size={16} />
            <input
              placeholder="Search by ID or range"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        {isEmpty ? (
          <div className="empty-state">
            <Users size={28} />
            <h3>Admin view requires a session</h3>
            <p>
              Use the button above to sign in with the seeded admin account.
            </p>
          </div>
        ) : (
          bookings
            .filter((item) =>
              `${item.id} ${item.venue?.name}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((item) => (
              <div className="admin-row" key={item.id}>
                <div className="avatar soft">
                  {item.user?.slice(0, 2).toUpperCase() || "AR"}
                </div>
                <div>
                  <strong>{item.user || "Member"}</strong>
                  <small>
                    {item.id} · {formatDate(item.date)}
                  </small>
                </div>
                <span>
                  {item.venue?.name} · {item.laneId}
                </span>
                <span
                  className={`tag ${item.status === "confirmed" ? "green" : "neutral"}`}
                >
                  {item.status}
                </span>
                <strong>{money(item.total)}</strong>
                <button
                  className="icon-button danger"
                  onClick={() => onCancel(item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
        )}
      </div>
    </>
  );
}
export default App;
