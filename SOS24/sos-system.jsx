// SOS24 — shared design-system primitives
// Tokens, frame, status bar, logo, buttons, inputs, navigation chrome.
// Style: liquid glassmorphism + accent red, on warm-light-gray bg.

const SOS_TOKENS = {
  // Surfaces
  pageBg: "rgb(228,228,228)",
  inkDark: "rgb(18,18,18)",          // dark card bg
  ink: "rgb(21,21,21)",              // text primary
  inkMuted: "rgb(95,94,94)",         // text secondary on light
  inkMutedDark: "rgb(224,224,224)",  // text secondary on dark
  inkSubtle: "rgb(77,77,77)",        // chrome text
  // Brand
  red: "rgb(230,20,40)",
  redSoft: "rgba(230,20,40,0.6)",
  // Status
  green: "rgb(105,228,183)",
  greenSoft: "rgba(52,211,153,0.6)",
  yellow: "rgb(245,200,80)",
  blue:  "rgb(86,140,255)",
  // Glass
  glass: "rgba(255,255,255,0.5)",
  glassStrong: "rgba(255,255,255,0.9)",
  glassThin: "rgba(255,255,255,0.04)",
  // Hairline
  hairline: "rgba(20,20,20,0.08)",
  // Shadows
  shadowSoft: "0px 4px 6px 0px rgba(201,201,201,0.1)",
  shadowCard: "0 10px 24px -16px rgba(0,0,0,0.18)",
  shadowGlassLift: "0 0 0 1px rgba(255,255,255,0.5) inset, 0 1px 0 rgba(255,255,255,0.6) inset, 0 24px 40px -16px rgba(201,201,201,0.55), 0 8px 20px -8px rgba(0,0,0,0.08)",
};
window.SOS_TOKENS = SOS_TOKENS;

// ─────────────────────────────────────────────────────────────────────────
// Phone frame — 390 × 844 clean artboard (no rounding, per Figma)
function PhoneFrame({ children, bg, height = 844 }) {
  return (
    <div
      style={{
        width: 390,
        height,
        background: bg || SOS_TOKENS.pageBg,
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Neue Montreal', 'Manrope', system-ui, sans-serif",
        color: SOS_TOKENS.ink,
      }}
    >
      <StatusBar />
      {children}
    </div>
  );
}

function StatusBar({ tint = "dark" }) {
  const c = tint === "dark" ? "rgba(20,20,20,0.95)" : "rgba(255,255,255,0.95)";
  return (
    <div
      style={{
        position: "absolute", inset: "0 0 auto 0", height: 54,
        padding: "18px 30px 0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "'SF Pro Display', system-ui, sans-serif",
        fontWeight: 600, fontSize: 15, color: c,
        zIndex: 5, pointerEvents: "none",
      }}
    >
      <span>9:41</span>
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill={c}>
          <rect x="0" y="7" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
          <rect x="9" y="2.5" width="3" height="8.5" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round">
          <path d="M1.5 4.2c3.6-2.9 8.4-2.9 12 0" />
          <path d="M4 6.5c2.1-1.7 4.9-1.7 7 0" />
          <circle cx="7.5" cy="9" r="1" fill={c} stroke="none" />
        </svg>
        <svg width="25" height="11" viewBox="0 0 25 11" fill="none">
          <rect x="0.5" y="0.5" width="21" height="10" rx="2.5" stroke={c} strokeOpacity="0.4" />
          <rect x="22" y="3.5" width="1.5" height="4" rx="0.5" fill={c} fillOpacity="0.4" />
          <rect x="2" y="2" width="17" height="7" rx="1.2" fill={c} />
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Brand mark + wordmark
function SosLogo({ scale = 1, color = SOS_TOKENS.ink }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4 * scale, transform: `scale(${scale})`, transformOrigin: "left center" }}>
      <SosMark size={20} />
      <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 700, fontSize: 18, color, letterSpacing: "-0.02em", lineHeight: 1 }}>SOS</span>
      <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 600, fontSize: 10, color, letterSpacing: 0, lineHeight: 1, alignSelf: "flex-end", paddingBottom: 1 }}>24</span>
    </div>
  );
}

function SosMark({ size = 20, color = SOS_TOKENS.red }) {
  return (
    <svg width={size} height={size} viewBox="0 0 19.25 20" style={{ color, flex: "none" }}>
      <path fill="currentColor" d="M19.18 8.246c-.09-1.171-.298-2.313-.717-3.41C17.676 2.775 16.248 1.376 14.182.655 12.704.138 11.168 0 9.411 0 8.241-.006 6.883.118 5.557.497 3.472 1.093 1.907 2.325.983 4.328.354 5.692.131 7.152.042 8.637c-.063 1.053-.056 2.105.03 3.157.103 1.255.316 2.485.788 3.659.636 1.576 1.712 2.741 3.229 3.478 1.342.652 2.779.923 4.253 1.027.977.069 1.953.049 2.929-.035 1.004-.087 1.992-.256 2.949-.576 1.096-.366 2.075-.925 2.863-1.797.973-1.078 1.526-2.365 1.808-3.771.366-1.827.432-3.675.289-5.533zm-2.589 3.751c-.486 1.286-1.299 2.343-2.259 3.298-.834.829-1.752 1.541-2.827 2.03-.657.299-1.343.485-2.064.52-.317.015-.633-.028-.938-.122-.121-.038-.234-.094-.33-.179-.18-.156-.179-.322.012-.464.23-.169.47-.323.701-.489.676-.485 1.233-1.086 1.699-1.775.077-.115.142-.24.201-.367.053-.115.058-.234-.047-.33-.106-.096-.226-.111-.349-.046-.135.07-.265.15-.398.225-1.248.708-2.577 1.006-3.99.696-1.979-.435-3.136-1.734-3.642-3.671-.096-.368-.14-.746-.127-1.057.004-1.198.345-2.231.908-3.182 1.06-1.79 2.493-3.201 4.334-4.169.619-.325 1.28-.537 1.977-.619.385-.046.765-.025 1.142.059.058.013.118.027.172.051.181.08.391.152.421.381s-.179.308-.334.4c-.906.543-1.669 1.239-2.251 2.129-.07.106-.137.213-.173.336-.041.143-.043.282.082.385.118.099.248.074.371.004.379-.217.753-.444 1.158-.611 1.306-.541 2.634-.635 3.959-.105 1.517.607 2.424 1.78 2.85 3.341.311 1.135.152 2.246-.258 3.331z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Glass capsule
function GlassPill({ children, style }) {
  return (
    <div
      style={{
        background: SOS_TOKENS.glass,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderRadius: 999,
        boxShadow: SOS_TOKENS.shadowSoft,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Buttons
function RedButton({ children, style, onClick, trailing = true, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        appearance: "none", border: "none",
        background: disabled ? "rgba(230,20,40,0.35)" : SOS_TOKENS.red,
        color: "#fff", borderRadius: 999, height: 64, padding: "0 28px",
        fontFamily: "'Manrope', system-ui, sans-serif",
        fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
        cursor: disabled ? "default" : "pointer",
        boxShadow: disabled ? "none" : "0 10px 30px -10px rgba(230,20,40,0.45)",
        ...style,
      }}
    >
      {children}
      {trailing && (
        <svg width="7" height="10" viewBox="0 0 7 10" fill="currentColor" style={{ marginLeft: 4 }}>
          <path d="M.833 0L0 .833 4.167 5 0 9.167.833 10l5-5z" />
        </svg>
      )}
    </button>
  );
}

function WhiteButton({ children, style, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none", border: "none",
        background: "#fff", color: SOS_TOKENS.inkDark, borderRadius: 999,
        height: 52, padding: "0 22px",
        fontFamily: "'Manrope', sans-serif", fontWeight: 500, fontSize: 16, letterSpacing: "-0.01em",
        display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
        ...style,
      }}
    >
      {icon}{children}
    </button>
  );
}

// Outline (transparent w/ red hairline + red text). Used for "Зарегистрироваться".
function OutlineButton({ children, style, onClick, tone = "dark" }) {
  const color = tone === "red" ? SOS_TOKENS.red : SOS_TOKENS.inkDark;
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none", background: "transparent",
        color, borderRadius: 999, height: 64, padding: "0 28px",
        border: `1.5px solid ${tone === "red" ? "rgba(230,20,40,0.5)" : "rgba(20,20,20,0.16)"}`,
        fontFamily: "'Manrope', sans-serif", fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, style, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: "none", border: "none",
        background: "rgba(255,255,255,0.06)", color: SOS_TOKENS.inkMutedDark, borderRadius: 999,
        height: 52, padding: "0 22px",
        fontFamily: "'Manrope', sans-serif", fontWeight: 500, fontSize: 16, letterSpacing: "-0.01em",
        display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Inline text link (e.g. "Пропустить", "Изменить номер")
function TextLink({ children, color = SOS_TOKENS.inkSubtle, style, onClick }) {
  return (
    <button onClick={onClick} style={{
      appearance: "none", border: "none", background: "transparent",
      padding: 0, cursor: "pointer", color,
      fontFamily: "'Manrope', sans-serif", fontWeight: 500, fontSize: 14, letterSpacing: "-0.005em",
      ...style,
    }}>
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Top bar — used on Home / inner screens
function TopBar({ leading, trailing, center }) {
  return (
    <div style={{
      position: "absolute", top: 56, left: 24, right: 24, height: 48,
      display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3,
    }}>
      <div style={{ width: 48, height: 48 }}>{leading}</div>
      <div>{center}</div>
      <div style={{ width: 48, height: 48 }}>{trailing}</div>
    </div>
  );
}

// Back button — used on inner screens
function BackButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      appearance: "none", border: "none", width: 48, height: 48, borderRadius: 999,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: SOS_TOKENS.shadowSoft,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", color: SOS_TOKENS.inkDark,
    }}>
      <svg width="9" height="16" viewBox="0 0 9 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1L1 8l7 7" />
      </svg>
    </button>
  );
}

function IconButton({ children, badge, onClick }) {
  return (
    <button onClick={onClick} style={{
      appearance: "none", border: "none", width: 48, height: 48, borderRadius: 999,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: SOS_TOKENS.shadowSoft,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", position: "relative", color: SOS_TOKENS.inkDark,
    }}>
      {children}
      {badge && (
        <span style={{
          position: "absolute", top: 10, right: 12, width: 10, height: 10, borderRadius: 999,
          background: SOS_TOKENS.red, border: "2px solid rgba(255,255,255,0.9)",
        }} />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SF Symbols-style icons (thin lines, 1.6–1.8 stroke).
function IconBurger({ size = 20 }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="0 0 20 18" fill="none">
      <rect x="0" y="0" width="20" height="2" rx="1" fill="currentColor" />
      <rect x="0" y="8" width="20" height="2" rx="1" fill="currentColor" />
      <rect x="0" y="16" width="20" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function IconBell({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 00-6 6v4l-1.5 3a1 1 0 00.9 1.5h13.2a1 1 0 00.9-1.5L18 13V9a6 6 0 00-6-6z" />
      <path d="M10 20a2 2 0 004 0" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Bottom tab bar — 4 tabs per app spec
function BottomTabBar({ active = 0 }) {
  const tabs = [
    { id: "home",     icon: TabIconHome },
    { id: "policies", icon: TabIconShield },
    { id: "garage",   icon: TabIconCar },
    { id: "profile",  icon: TabIconUser },
  ];
  return (
    <div style={{
      position: "absolute", bottom: 22, left: 22, right: 22, height: 68, borderRadius: 999,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: 6, zIndex: 4,
      boxShadow: SOS_TOKENS.shadowGlassLift,
    }}>
      {tabs.map((t, i) => {
        const Icon = t.icon;
        return (
          <div key={t.id} style={{
            flex: 1, height: 56, borderRadius: 999,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: i === active ? "rgba(255,255,255,0.92)" : "transparent",
            color: i === active ? SOS_TOKENS.inkDark : "rgba(20,20,20,0.32)",
          }}>
            <Icon active={i === active} />
          </div>
        );
      })}
    </div>
  );
}

function TabIconHome({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-9.5z" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}
function TabIconShield({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
    </svg>
  );
}
function TabIconCar({ active }) {
  // Side-view car silhouette (SF Symbols "car.fill")
  return (
    <svg width="26" height="22" viewBox="0 0 28 22" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 14v-2l3-1 2-5c.4-.9 1.3-1.5 2.3-1.5h9.4c1 0 1.9.6 2.3 1.5l2 5 3 1v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2z" />
      <circle cx="8" cy="16" r="2.5" fill={active ? "#fff" : "none"} stroke={active ? "currentColor" : "currentColor"} strokeWidth="1.6" />
      <circle cx="20" cy="16" r="2.5" fill={active ? "#fff" : "none"} stroke={active ? "currentColor" : "currentColor"} strokeWidth="1.6" />
    </svg>
  );
}
function TabIconUser({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Pagination dots (used in onboarding)
function PageDots({ count = 3, active = 0, color = SOS_TOKENS.inkDark }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} style={{
          width: i === active ? 28 : 8, height: 8, borderRadius: 999,
          background: i === active ? color : "rgba(20,20,20,0.18)",
          transition: "width .2s ease",
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Inputs

// Text input with floating label + optional prefix/suffix
function TextInput({ label, value, placeholder, prefix, suffix, type = "text", state, hint }) {
  const focused = state === "focus";
  const error = state === "error";
  const filled = !!value;
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
          {label}
        </span>
      )}
      <div style={{
        height: 60, borderRadius: 20, padding: "0 18px",
        background: SOS_TOKENS.glass,
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        boxShadow: error
          ? `inset 0 0 0 1.5px ${SOS_TOKENS.red}`
          : focused
            ? `inset 0 0 0 1.5px rgba(20,20,20,0.32)`
            : `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {prefix && <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 17, color: SOS_TOKENS.inkDark, fontWeight: 500 }}>{prefix}</span>}
        <span style={{
          flex: 1, fontFamily: "'Manrope',sans-serif", fontSize: 17, letterSpacing: "-0.005em",
          color: filled ? SOS_TOKENS.inkDark : "rgba(20,20,20,0.4)",
          fontWeight: filled ? 500 : 400,
        }}>
          {filled ? value : placeholder}
        </span>
        {suffix && <span style={{ display: "flex", alignItems: "center" }}>{suffix}</span>}
      </div>
      {hint && (
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: error ? SOS_TOKENS.red : SOS_TOKENS.inkMuted, paddingLeft: 4 }}>
          {hint}
        </span>
      )}
    </label>
  );
}

// 6-cell OTP input
function OTPBoxes({ value = "", focusIndex = 0, error = false }) {
  const cells = Array.from({ length: 6 }).map((_, i) => value[i] || "");
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {cells.map((c, i) => {
        const active = i === focusIndex;
        return (
          <div key={i} style={{
            width: 48, height: 60, borderRadius: 16,
            background: SOS_TOKENS.glass,
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            boxShadow: error
              ? `inset 0 0 0 1.5px ${SOS_TOKENS.red}`
              : active
                ? `inset 0 0 0 2px ${SOS_TOKENS.red}`
                : c
                  ? `inset 0 0 0 1px rgba(20,20,20,0.16)`
                  : `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 24,
            color: error ? SOS_TOKENS.red : SOS_TOKENS.inkDark,
            position: "relative",
          }}>
            {c}
            {active && !c && (
              <span style={{ position: "absolute", width: 2, height: 24, background: SOS_TOKENS.red, borderRadius: 1, animation: "sosCaret 1s infinite" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Segmented control — pill that hosts N options; one selected (red pill inside)
function Segmented({ options = [], active = 0, style }) {
  return (
    <div style={{
      display: "flex", gap: 4, padding: 4, borderRadius: 999,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      ...style,
    }}>
      {options.map((label, i) => (
        <div key={i} style={{
          flex: 1, height: 40, borderRadius: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: i === active ? SOS_TOKENS.inkDark : "transparent",
          color: i === active ? "#fff" : "rgba(20,20,20,0.6)",
          fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "-0.005em",
          transition: "all .15s ease",
        }}>{label}</div>
      ))}
    </div>
  );
}

// Stepper progress bar — current of total
function StepperBar({ current = 1, total = 4 }) {
  return (
    <div style={{ display: "flex", gap: 4, width: "100%" }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{
          flex: 1, height: 3, borderRadius: 999,
          background: i < current ? SOS_TOKENS.inkDark : "rgba(20,20,20,0.12)",
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Section heading used inside design canvas pages (annotation block over a screen)
function ScreenCaption({ title, meta }) {
  return (
    <div style={{
      position: "absolute", left: 0, top: -52,
      display: "flex", alignItems: "baseline", gap: 12,
      fontFamily: "'Manrope', system-ui, sans-serif",
    }}>
      <span style={{ fontWeight: 600, fontSize: 16, color: "#0f0f0f" }}>{title}</span>
      {meta && <span style={{ fontWeight: 400, fontSize: 13, color: "rgba(20,20,20,0.5)" }}>{meta}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Global keyframes (caret blink etc.)
if (typeof document !== "undefined" && !document.getElementById("sos-keyframes")) {
  const s = document.createElement("style");
  s.id = "sos-keyframes";
  s.textContent = `
    @keyframes sosCaret { 0%,40% { opacity: 1 } 50%,90% { opacity: 0 } 100% { opacity: 1 } }
    @keyframes sosPulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.06); opacity: 0.85 } }
    @keyframes sosRing  { 0% { transform: scale(0.6); opacity: 0.6 } 100% { transform: scale(1.6); opacity: 0 } }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────
// Row list — used on profile, settings, history. Tap target ~56–64h.
function ListRow({ icon, title, meta, value, trailing = "chevron", style }) {
  const trail = trailing === "chevron"
    ? <ChevronRight />
    : trailing === "none"
      ? null
      : trailing;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      height: 64, padding: "0 18px",
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      borderRadius: 20,
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      ...style,
    }}>
      {icon && <span style={{ width: 28, height: 28, display: "inline-flex", alignItems: "center", justifyContent: "center", color: SOS_TOKENS.inkDark }}>{icon}</span>}
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 15, color: SOS_TOKENS.inkDark, letterSpacing: "-0.005em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
        {meta && <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted }}>{meta}</span>}
      </span>
      {value && <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: SOS_TOKENS.inkMuted }}>{value}</span>}
      {trail}
    </div>
  );
}

function ChevronRight() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="rgba(20,20,20,0.32)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 1l6 6-6 6" />
    </svg>
  );
}

// Round "+ Add" tile button (e.g. add driver, add car)
function AddTile({ children, onClick, height = 64, style }) {
  return (
    <button onClick={onClick} style={{
      appearance: "none", border: `1.5px dashed rgba(20,20,20,0.18)`,
      background: "transparent",
      borderRadius: 20, height, padding: "0 18px", width: "100%",
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
      color: SOS_TOKENS.inkSubtle,
      fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 15, letterSpacing: "-0.005em",
      cursor: "pointer",
      ...style,
    }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M10 4v12M4 10h12" />
      </svg>
      {children}
    </button>
  );
}

// Checkbox — square, ink-on-active
function Checkbox({ checked }) {
  return (
    <span style={{
      width: 22, height: 22, borderRadius: 7,
      background: checked ? SOS_TOKENS.inkDark : "rgba(255,255,255,0.6)",
      boxShadow: checked ? "none" : `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flex: "none",
    }}>
      {checked && (
        <svg width="13" height="10" viewBox="0 0 13 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 5l4 4 7-8" />
        </svg>
      )}
    </span>
  );
}

// Toggle switch
function Toggle({ on }) {
  return (
    <span style={{
      width: 44, height: 26, borderRadius: 999, padding: 2,
      background: on ? SOS_TOKENS.inkDark : "rgba(20,20,20,0.16)",
      display: "inline-flex", alignItems: "center",
      transition: "background .2s ease",
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 999, background: "#fff",
        transform: on ? "translateX(18px)" : "translateX(0)",
        transition: "transform .2s ease",
        boxShadow: "0 2px 4px rgba(0,0,0,0.18)",
      }} />
    </span>
  );
}

// Tag/bedge
function Tag({ children, tone = "ink", style }) {
  const palette = {
    ink:    { bg: SOS_TOKENS.inkDark, fg: "#fff" },
    red:    { bg: SOS_TOKENS.red,     fg: "#fff" },
    green:  { bg: "rgba(105,228,183,0.85)", fg: "#0a3a26" },
    glass:  { bg: SOS_TOKENS.glass,   fg: SOS_TOKENS.inkDark },
    yellow: { bg: "rgba(245,200,80,0.85)",  fg: "#503a07" },
  }[tone] || { bg: SOS_TOKENS.inkDark, fg: "#fff" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 10px", borderRadius: 999,
      background: palette.bg, color: palette.fg,
      fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.02em",
      ...style,
    }}>
      {children}
    </span>
  );
}

// Screen page heading (used on inner stack screens)
function ScreenHeading({ title, subtitle, style }) {
  return (
    <div style={style}>
      <h1 style={{
        margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 28,
        letterSpacing: "-0.01em", color: SOS_TOKENS.ink, lineHeight: 1.15,
      }}>{title}</h1>
      {subtitle && (
        <p style={{
          margin: "10px 0 0", fontFamily: "'Manrope',sans-serif", fontSize: 16,
          color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em", textWrap: "pretty",
        }}>{subtitle}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
Object.assign(window, {
  PhoneFrame, StatusBar,
  SosLogo, SosMark,
  GlassPill,
  RedButton, WhiteButton, OutlineButton, GhostButton, TextLink,
  TopBar, BackButton, IconButton,
  IconBurger, IconBell,
  BottomTabBar,
  TabIconHome, TabIconShield, TabIconCar, TabIconUser,
  PageDots,
  TextInput, OTPBoxes, Segmented, StepperBar,
  ListRow, ChevronRight, AddTile, Checkbox, Toggle, Tag,
  ScreenHeading, ScreenCaption,
});
