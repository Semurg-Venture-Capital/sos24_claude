// SOS24 — SOS AI Chat screen (entry from SOS button on Home / Quick action)
// User taps SOS → opens AI chat that triages the situation, suggests next step,
// or hands off to a human via call.

const SOS_CHAT_HEIGHT = 1100;

function ScreenSosChat() {
  return (
    <PhoneFrame height={SOS_CHAT_HEIGHT}>
      {/* Top — minimal: close + title + connection status */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 108,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(14px) saturate(160%)", WebkitBackdropFilter: "blur(14px) saturate(160%)",
        borderBottom: `1px solid ${SOS_TOKENS.hairline}`,
        padding: "52px 20px 0",
        display: "flex", alignItems: "center", gap: 10, zIndex: 3,
      }}>
        <BackButton />
        <div style={{ position: "relative", width: 40, height: 40, flex: "none" }}>
          <span style={{
            position: "absolute", inset: 0, borderRadius: 999,
            background: "linear-gradient(135deg, #E61428 0%, #3A1117 100%)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            color: "#fff",
            boxShadow: "0 10px 20px -8px rgba(230,20,40,0.45)",
          }}>
            <SosMark size={18} color="#fff" />
          </span>
          <span style={{
            position: "absolute", right: -2, bottom: -2,
            width: 14, height: 14, borderRadius: 999, background: SOS_TOKENS.green,
            boxShadow: "0 0 0 3px #fff",
          }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
          <span style={{
            fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink,
            letterSpacing: "-0.005em", lineHeight: 1.1,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            SOS24 · ИИ-помощник
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.green,
            fontWeight: 600, letterSpacing: "0.02em",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: SOS_TOKENS.green }} />
            на связи · среднее ожидание 8 сек
          </span>
        </div>
        <IconButton>
          <Icon name="phone-fill" size={16} />
        </IconButton>
      </div>

      {/* Conversation */}
      <div style={{
        position: "absolute", top: 108, left: 0, right: 0, bottom: 200,
        padding: "16px 16px 12px",
        display: "flex", flexDirection: "column", gap: 10,
        overflowY: "auto",
      }}>
        <SosSystemNote text="Соединение защищено · 11:42" />

        {/* Greeting card from AI */}
        <SosAiCard>
          <p style={{ margin: 0, fontFamily: "'Manrope',sans-serif", fontSize: 14, lineHeight: 1.5, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>
            <b>Здравствуйте, Азиз!</b> Это SOS24-помощник. Я помогу разобраться в любой ситуации — выберите ниже или опишите словами.
          </p>
        </SosAiCard>

        {/* Quick category chips — primary triage */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          <SosCategoryRow
            icon="car"            tone="red"
            title="ДТП"            sub="столкновение, наезд, повреждение"
          />
          <SosCategoryRow
            icon="stethoscope"    tone="green"
            title="Мед. помощь"    sub="травма, плохое самочувствие"
          />
          <SosCategoryRow
            icon="key"            tone="yellow"
            title="Угон / кража"   sub="нет авто на месте"
          />
          <SosCategoryRow
            icon="alert-triangle" tone="blue"
            title="Имущество"      sub="пожар, залив, стихия"
          />
          <SosCategoryRow
            icon="help-circle"    tone="ink"
            title="Другое"         sub="опишите ситуацию"
          />
        </div>

        {/* Sample user reply */}
        <SosUserBubble text="Я попал в ДТП, второй водитель согласен" time="11:43" />

        {/* AI follow-up with action suggestions */}
        <SosAiCard>
          <p style={{ margin: 0, fontFamily: "'Manrope',sans-serif", fontSize: 14, lineHeight: 1.5, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>
            Понял — это попадает под <b>электронный европротокол</b>, если нет пострадавших. Что предпочитаете?
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
            <SosAiAction label="Оформить европротокол" hint="самостоятельно · 5 мин" primary />
            <SosAiAction label="Вызвать инспектора" hint="приедет на место · ~12 мин" />
            <SosAiAction label="Связать со специалистом" hint="звонок через 8 сек" icon="phone-fill" />
          </div>
        </SosAiCard>
      </div>

      {/* Composer */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "12px 16px 32px",
        background: "rgba(237,237,237,0.95)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderTop: `1px solid ${SOS_TOKENS.hairline}`,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {/* Quick call CTA */}
        <button style={{
          appearance: "none", border: "none", cursor: "pointer",
          height: 44, borderRadius: 999, padding: "0 16px",
          background: "rgba(20,20,20,0.06)", color: SOS_TOKENS.inkDark,
          fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 13, letterSpacing: "-0.005em",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <Icon name="phone-fill" size={14} color={SOS_TOKENS.red} />
          Заказать звонок — ответим за 30 сек
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={{
            appearance: "none", border: "none", cursor: "pointer",
            width: 44, height: 44, borderRadius: 999,
            background: SOS_TOKENS.glass, color: SOS_TOKENS.inkDark,
            display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
          }}>
            <Icon name="camera" size={18} />
          </button>
          <div style={{
            flex: 1, height: 44, padding: "0 18px", borderRadius: 999,
            background: "#fff",
            boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
            display: "flex", alignItems: "center",
            fontFamily: "'Manrope',sans-serif", fontSize: 15, color: SOS_TOKENS.inkMuted,
          }}>
            Опишите ситуацию…
          </div>
          <button style={{
            appearance: "none", border: "none", cursor: "pointer",
            width: 44, height: 44, borderRadius: 999,
            background: SOS_TOKENS.red, color: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
            boxShadow: "0 8px 16px -6px rgba(230,20,40,0.5)",
          }}>
            <Icon name="send-arrow" size={16} />
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// AI message card — wider than a chat bubble, holds rich content
function SosAiCard({ children }) {
  return (
    <div style={{
      alignSelf: "flex-start", maxWidth: "92%",
      padding: "14px 16px", borderRadius: "22px 22px 22px 8px",
      background: "#fff",
      boxShadow: "0 4px 12px -6px rgba(0,0,0,0.08), inset 0 0 0 1px " + SOS_TOKENS.hairline,
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      {children}
    </div>
  );
}

function SosUserBubble({ text, time }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, alignSelf: "flex-end", maxWidth: "82%" }}>
      <div style={{
        padding: "10px 14px",
        background: SOS_TOKENS.red, color: "#fff",
        borderRadius: "20px 20px 6px 20px",
        boxShadow: "0 12px 24px -16px rgba(230,20,40,0.4)",
        fontFamily: "'Manrope',sans-serif", fontSize: 14, lineHeight: 1.45, letterSpacing: "-0.005em",
      }}>{text}</div>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: SOS_TOKENS.inkSubtle, paddingRight: 12 }}>{time}</span>
    </div>
  );
}

function SosSystemNote({ text }) {
  return (
    <div style={{
      alignSelf: "center", padding: "4px 12px", borderRadius: 999,
      background: "rgba(20,20,20,0.05)",
      fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMuted,
    }}>{text}</div>
  );
}

// Tappable category row inside an AI message
function SosCategoryRow({ icon, tone, title, sub }) {
  const tonePalette = {
    red:    { bg: "rgba(230,20,40,0.12)",    fg: SOS_TOKENS.red },
    green:  { bg: "rgba(105,228,183,0.55)",  fg: "#0a3a26" },
    yellow: { bg: "rgba(245,200,80,0.55)",   fg: "#503a07" },
    blue:   { bg: "rgba(86,140,255,0.18)",   fg: "#1a3577" },
    ink:    { bg: "rgba(20,20,20,0.08)",     fg: SOS_TOKENS.inkDark },
  }[tone];
  return (
    <button style={{
      appearance: "none", border: "none", cursor: "pointer",
      alignSelf: "stretch", maxWidth: "92%", textAlign: "left",
      padding: "12px 14px", borderRadius: 18,
      background: "#fff",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 999,
        background: tonePalette.bg, color: tonePalette.fg,
        display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
      }}>
        <Icon name={icon} size={18} />
      </span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>{title}</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted }}>{sub}</span>
      </span>
      <Icon name="chevron-right" size={14} color="rgba(20,20,20,0.32)" />
    </button>
  );
}

// AI suggestion button inside a message bubble
function SosAiAction({ label, hint, primary, icon }) {
  return (
    <button style={{
      appearance: "none", border: "none", cursor: "pointer",
      width: "100%", textAlign: "left",
      padding: "10px 14px", borderRadius: 14,
      background: primary ? SOS_TOKENS.inkDark : "rgba(20,20,20,0.04)",
      color: primary ? "#fff" : SOS_TOKENS.inkDark,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      {icon && (
        <span style={{ flex: "none", color: primary ? "#fff" : SOS_TOKENS.red }}>
          <Icon name={icon} size={14} />
        </span>
      )}
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "-0.005em" }}>{label}</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: primary ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.inkMuted }}>{hint}</span>
      </span>
      <Icon name="chevron-right" size={14} color={primary ? "rgba(255,255,255,0.5)" : "rgba(20,20,20,0.32)"} />
    </button>
  );
}

Object.assign(window, {
  ScreenSosChat,
  SOS_CHAT_HEIGHT,
});
