// SOS24 — Block 5: M8 Мои полисы (3 экрана)

// ═════════════════════════════════════════════════════════════════════════
// M8.1 — Список полисов
// ═════════════════════════════════════════════════════════════════════════
const POLICIES_LIST_HEIGHT = 960;

function ScreenPoliciesList() {
  return (
    <PhoneFrame height={POLICIES_LIST_HEIGHT}>
      {/* Top — title + search icon */}
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3 }}>
        <h1 style={{
          margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 28,
          letterSpacing: "-0.01em", color: SOS_TOKENS.ink, lineHeight: 1,
        }}>Мои полисы</h1>
        <IconButton>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.5-4.5" />
          </svg>
        </IconButton>
      </div>

      {/* Stats summary */}
      <div style={{ position: "absolute", top: 124, left: 24, right: 24, display: "flex", gap: 10 }}>
        <StatPill label="Активных"  value="2" tone="ink" />
        <StatPill label="Истекает"  value="1" tone="warn" />
        <StatPill label="В архиве"  value="5" tone="glass" />
      </div>

      {/* Tabs */}
      <div style={{ position: "absolute", top: 200, left: 24, right: 24 }}>
        <Segmented options={["Активные · 2", "Архив · 5"]} active={0} />
      </div>

      {/* List */}
      <div style={{ position: "absolute", top: 270, left: 24, right: 24, bottom: 120, display: "flex", flexDirection: "column", gap: 10 }}>
        <PolicyListCard
          tone="dark"
          type="КАСКО"
          car="Chevrolet Cobalt"
          plate="01 A 123 BB"
          period="11.05.2026 — 11.05.2027"
          number="№ 1224 5582 0091"
          daysLeft={365}
          status="active"
        />
        <PolicyListCard
          tone="light"
          type="ОСАГО"
          car="Hyundai Sonata"
          plate="10 R 555 AC"
          period="26.06.2025 — 26.06.2026"
          number="№ 1224 4471 0782"
          daysLeft={43}
          status="expiring"
        />

        {/* Soft separator + archive preview head */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
          <span style={{ flex: 1, height: 1, background: SOS_TOKENS.hairline }} />
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkSubtle, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Истекли
          </span>
          <span style={{ flex: 1, height: 1, background: SOS_TOKENS.hairline }} />
        </div>

        <PolicyListCardCompact
          type="ОСАГО"
          car="Chevrolet Cobalt"
          plate="01 A 123 BB"
          period="11.05.2025 — 11.05.2026"
        />
        <PolicyListCardCompact
          type="КАСКО"
          car="Hyundai Sonata"
          plate="10 R 555 AC"
          period="26.06.2024 — 26.06.2025"
        />
      </div>

      <BottomTabBar active={1} />
    </PhoneFrame>
  );
}

function StatPill({ label, value, tone }) {
  const palette = {
    ink:   { bg: SOS_TOKENS.inkDark, fg: "#fff",                muted: SOS_TOKENS.inkMutedDark },
    warn:  { bg: "rgba(245,200,80,0.85)", fg: "#3a2a07",        muted: "rgba(80,58,7,0.75)" },
    glass: { bg: SOS_TOKENS.glass, fg: SOS_TOKENS.inkDark,      muted: SOS_TOKENS.inkMuted },
  }[tone];
  return (
    <div style={{
      flex: 1, padding: "12px 14px", borderRadius: 18,
      background: palette.bg, color: palette.fg,
      backdropFilter: tone === "glass" ? "blur(8px)" : "none",
      WebkitBackdropFilter: tone === "glass" ? "blur(8px)" : "none",
      boxShadow: tone === "glass" ? `inset 0 0 0 1px ${SOS_TOKENS.hairline}` : "none",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: palette.muted, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22, letterSpacing: "-0.01em", lineHeight: 1 }}>
        {value}
      </span>
    </div>
  );
}

function PolicyListCard({ tone, type, car, plate, period, number, daysLeft, status }) {
  const dark = tone === "dark";
  const statusTone = status === "expiring" ? "yellow" : "green";
  const statusLabel = status === "expiring" ? `${daysLeft} дн.` : "Активен";
  return (
    <div style={{
      borderRadius: 28, padding: "18px 20px 18px",
      background: dark ? SOS_TOKENS.inkDark : "rgba(255,255,255,0.55)",
      color: dark ? "#fff" : SOS_TOKENS.ink,
      backdropFilter: dark ? "none" : "blur(8px)", WebkitBackdropFilter: dark ? "none" : "blur(8px)",
      boxShadow: dark
        ? "0 16px 32px -22px rgba(0,0,0,0.32)"
        : "0 1px 0 rgba(255,255,255,0.7) inset, 0 12px 24px -20px rgba(0,0,0,0.1)",
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      {/* Row 1: type + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Tag tone={dark ? "glass" : "ink"}>{type}</Tag>
        <Tag tone={statusTone}>{statusLabel}</Tag>
      </div>

      {/* Row 2: car + plate */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: dark ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.inkMuted }}>
            {car}
          </span>
          <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22, letterSpacing: "-0.005em", lineHeight: 1, whiteSpace: "nowrap" }}>
            {plate}
          </span>
        </div>
        <MiniQR small dark={dark} />
      </div>

      {/* Row 3: period + number */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, paddingTop: 12, borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : SOS_TOKENS.hairline}` }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: dark ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.inkMuted, letterSpacing: "-0.005em", whiteSpace: "nowrap" }}>
          {period}
        </span>
        <span style={{ fontFamily: "'Neue Montreal',sans-serif", fontSize: 11, color: dark ? "rgba(255,255,255,0.5)" : SOS_TOKENS.inkSubtle, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
          {number}
        </span>
      </div>
    </div>
  );
}

function PolicyListCardCompact({ type, car, plate, period }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
      borderRadius: 20,
      background: "rgba(255,255,255,0.4)",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      opacity: 0.7,
    }}>
      <span style={{
        padding: "3px 9px", borderRadius: 999,
        background: "rgba(20,20,20,0.06)", color: SOS_TOKENS.inkMuted,
        fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.02em",
        flex: "none",
      }}>{type}</span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 15, letterSpacing: "-0.005em", color: SOS_TOKENS.inkDark, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {plate}
        </span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMuted }}>
          {car} · истёк {period.split(" — ")[1]}
        </span>
      </span>
      <ChevronRight />
    </div>
  );
}

// Augment MiniQR — accept "small" + "dark" props for inline use
function MiniQRSmall() { return <MiniQR small />; }

// ═════════════════════════════════════════════════════════════════════════
// M8.2 — Детали полиса
// ═════════════════════════════════════════════════════════════════════════
const POLICY_DETAIL_HEIGHT = 1140;

function ScreenPolicyDetail() {
  return (
    <PhoneFrame height={POLICY_DETAIL_HEIGHT}>
      {/* Top — back + actions */}
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 3 }}>
        <BackButton />
        <div style={{ display: "flex", gap: 8 }}>
          <IconButton>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" />
              <path d="M16 6l-4-4-4 4M12 2v14" />
            </svg>
          </IconButton>
          <IconButton>
            <svg width="4" height="16" viewBox="0 0 4 16" fill="currentColor"><circle cx="2" cy="2" r="2" /><circle cx="2" cy="8" r="2" /><circle cx="2" cy="14" r="2" /></svg>
          </IconButton>
        </div>
      </div>

      {/* Big policy card — dark, with prominent QR */}
      <div style={{ position: "absolute", top: 130, left: 24, right: 24 }}>
        <div style={{
          padding: "22px 22px 24px", borderRadius: 36,
          background: SOS_TOKENS.inkDark, color: "#fff",
          display: "flex", flexDirection: "column", gap: 18,
          boxShadow: "0 24px 48px -28px rgba(0,0,0,0.35)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Decorative red halo */}
          <span style={{ position: "absolute", right: -60, top: -60, width: 200, height: 200, borderRadius: 999, background: "radial-gradient(circle, rgba(230,20,40,0.18), rgba(230,20,40,0))", pointerEvents: "none" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SosLogo color="#fff" />
            <Tag tone="green">Активен</Tag>
          </div>

          {/* QR big */}
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <BigQR />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMutedDark, letterSpacing: "0.08em", textTransform: "uppercase" }}>КАСКО · 12 мес</span>
              <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 26, letterSpacing: "-0.005em", lineHeight: 1 }}>01 A 123 BB</span>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMutedDark, marginTop: 4 }}>Chevrolet Cobalt · 2021</span>
            </div>
            <button style={{
              appearance: "none", border: "none", cursor: "pointer",
              padding: "10px 14px", borderRadius: 999,
              background: "rgba(255,255,255,0.12)", color: "#fff",
              fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 12, letterSpacing: "-0.005em",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
              Развернуть QR
            </button>
          </div>
        </div>
      </div>

      {/* Details list */}
      <div style={{ position: "absolute", top: 660, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <SummaryBlock
          eyebrow="Полис"
          rows={[
            { label: "Номер",         value: "1224 5582 0091" },
            { label: "Страхователь",  value: "Каримов А. С." },
            { label: "Период",        value: "11.05.2026 — 11.05.2027" },
            { label: "Страховая сумма", value: "85 000 000 сум" },
            { label: "Премия",        value: "4 250 000 сум" },
          ]}
        />
        <SummaryBlock
          eyebrow="Водители"
          rows={[
            { label: "Каримов А. С.",   value: "стаж 8 лет" },
            { label: "Каримова М. Х.",  value: "стаж 4 года" },
          ]}
        />
      </div>

      {/* Sticky actions */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px",
        display: "flex", flexDirection: "column", gap: 8,
        background: "linear-gradient(to top, rgba(237,237,237,0.95) 60%, rgba(237,237,237,0))",
      }}>
        <RedButton style={{ width: "100%" }} trailing={false}>
          <BangIcon /> Сообщить о ДТП
        </RedButton>
        <div style={{ display: "flex", gap: 8 }}>
          <OutlineButton style={{ flex: 1, height: 52 }}>
            <DownloadIcon /> PDF
          </OutlineButton>
          <OutlineButton style={{ flex: 1, height: 52 }}>Продлить</OutlineButton>
        </div>
      </div>
    </PhoneFrame>
  );
}

function BangIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11 4h2v10h-2zM12 21a1.7 1.7 0 110-3.4 1.7 1.7 0 010 3.4z" /></svg>
  );
}

function BigQR() {
  // Larger QR — 18×18 grid (visually denser than mini)
  return (
    <div style={{
      width: 200, height: 200, borderRadius: 18, padding: 10,
      background: "#fff",
      display: "grid", gridTemplateColumns: "repeat(21, 1fr)", gridTemplateRows: "repeat(21, 1fr)", gap: 1,
    }}>
      {Array.from({ length: 441 }).map((_, i) => {
        const x = i % 21, y = (i / 21) | 0;
        const inFinder = (cx, cy) => Math.abs(x - cx) <= 3 && Math.abs(y - cy) <= 3;
        const finderRing = (cx, cy) =>
          (Math.abs(x - cx) === 3 || Math.abs(y - cy) === 3) && Math.abs(x - cx) <= 3 && Math.abs(y - cy) <= 3;
        const finderCenter = (cx, cy) => Math.abs(x - cx) <= 1 && Math.abs(y - cy) <= 1;
        const f = (cx, cy) => finderRing(cx, cy) || finderCenter(cx, cy);
        const isFinder = f(3, 3) || f(17, 3) || f(3, 17);
        const isFinderQuiet = (inFinder(3, 3) && !isFinder) || (inFinder(17, 3) && !isFinder) || (inFinder(3, 17) && !isFinder);
        if (isFinderQuiet) return <span key={i} />;
        const fill = isFinder || ((x * 7 + y * 11 + ((x ^ y) * 3) + (x | 0) * (y | 0)) % 5 < 2);
        return <span key={i} style={{ background: fill ? "#121212" : "transparent", borderRadius: 0.5 }} />;
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M8.3 — Полноэкранный QR
// ═════════════════════════════════════════════════════════════════════════
function ScreenQRFullscreen() {
  return (
    <PhoneFrame bg="#121212">
      {/* Override status bar tint manually via overlay */}
      <div style={{
        position: "absolute", top: 18, left: 30, right: 30, height: 18,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "'SF Pro Display', system-ui, sans-serif", fontWeight: 600, fontSize: 15, color: "#fff",
        zIndex: 6,
      }}>
        <span>9:41</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center", color: "#fff" }}>
          <svg width="17" height="11" viewBox="0 0 17 11" fill="#fff"><rect x="0" y="7" width="3" height="4" rx="0.5" /><rect x="4.5" y="5" width="3" height="6" rx="0.5" /><rect x="9" y="2.5" width="3" height="8.5" rx="0.5" /><rect x="13.5" y="0" width="3" height="11" rx="0.5" /></svg>
          <svg width="25" height="11" viewBox="0 0 25 11" fill="none"><rect x="0.5" y="0.5" width="21" height="10" rx="2.5" stroke="#fff" strokeOpacity="0.4" /><rect x="22" y="3.5" width="1.5" height="4" rx="0.5" fill="#fff" fillOpacity="0.4" /><rect x="2" y="2" width="17" height="7" rx="1.2" fill="#fff" /></svg>
        </div>
      </div>

      {/* Top bar */}
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 5 }}>
        <button style={{
          appearance: "none", border: "none", width: 48, height: 48, borderRadius: 999,
          background: "rgba(255,255,255,0.08)", color: "#fff",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12" /></svg>
        </button>
        <SosLogo color="#fff" />
        <button style={{
          appearance: "none", border: "none", width: 48, height: 48, borderRadius: 999,
          background: "rgba(255,255,255,0.08)", color: "#fff",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7M16 6l-4-4-4 4M12 2v14" />
          </svg>
        </button>
      </div>

      {/* Hero — frame title */}
      <div style={{ position: "absolute", top: 140, left: 24, right: 24, textAlign: "center" }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Электронный полис
        </span>
        <h1 style={{
          margin: "6px 0 0", fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 28,
          letterSpacing: "-0.01em", color: "#fff", lineHeight: 1.1,
        }}>КАСКО · 01 A 123 BB</h1>
      </div>

      {/* Big QR */}
      <div style={{
        position: "absolute", top: 250, left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
      }}>
        <div style={{
          padding: 16, borderRadius: 36,
          background: "#fff",
          boxShadow: "0 30px 80px -20px rgba(255,255,255,0.18), 0 0 0 1px rgba(255,255,255,0.08)",
        }}>
          <HugeQR />
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 18, letterSpacing: "0.04em", color: "#fff" }}>
            № 1224 5582 0091
          </span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em" }}>
            SOS24 · sos24.uz
          </span>
        </div>
      </div>

      {/* Tip pill at bottom */}
      <div style={{ position: "absolute", left: 24, right: 24, bottom: 36, display: "flex", justifyContent: "center" }}>
        <div style={{
          padding: "12px 18px", borderRadius: 999,
          background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          fontFamily: "'Manrope',sans-serif", fontSize: 13, letterSpacing: "-0.005em",
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M1 12h2M21 12h2" /></svg>
          Покажите инспектору или сохраните
        </div>
      </div>
    </PhoneFrame>
  );
}

function HugeQR() {
  // Even larger — 25×25 grid
  return (
    <div style={{
      width: 280, height: 280,
      display: "grid", gridTemplateColumns: "repeat(25, 1fr)", gridTemplateRows: "repeat(25, 1fr)", gap: 1,
    }}>
      {Array.from({ length: 625 }).map((_, i) => {
        const x = i % 25, y = (i / 25) | 0;
        const inFinder = (cx, cy) => Math.abs(x - cx) <= 3 && Math.abs(y - cy) <= 3;
        const finderRing = (cx, cy) =>
          (Math.abs(x - cx) === 3 || Math.abs(y - cy) === 3) && Math.abs(x - cx) <= 3 && Math.abs(y - cy) <= 3;
        const finderCenter = (cx, cy) => Math.abs(x - cx) <= 1 && Math.abs(y - cy) <= 1;
        const f = (cx, cy) => finderRing(cx, cy) || finderCenter(cx, cy);
        const isFinder = f(3, 3) || f(21, 3) || f(3, 21);
        const isFinderQuiet = (inFinder(3, 3) && !isFinder) || (inFinder(21, 3) && !isFinder) || (inFinder(3, 21) && !isFinder);
        if (isFinderQuiet) return <span key={i} />;
        const fill = isFinder || ((x * 7 + y * 11 + ((x ^ y) * 3) + (x | 0) * (y | 0)) % 5 < 2);
        return <span key={i} style={{ background: fill ? "#121212" : "transparent", borderRadius: 0.5 }} />;
      })}
    </div>
  );
}

Object.assign(window, {
  ScreenPoliciesList, ScreenPolicyDetail, ScreenQRFullscreen,
  POLICIES_LIST_HEIGHT, POLICY_DETAIL_HEIGHT,
});
