// SOS24 — M7.4 · Wallet (внутренний кошелёк)
// Top-up via kiosk uses a QR that the user shows at Paynet/Click terminals.

const WALLET_HEIGHT = 1180;

function ScreenWallet() {
  return (
    <PhoneFrame height={WALLET_HEIGHT}>
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3 }}>
        <BackButton />
        <h1 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22, letterSpacing: "-0.005em", color: SOS_TOKENS.ink, lineHeight: 1 }}>
          Кошелёк
        </h1>
        <IconButton><Icon name="info" size={18} /></IconButton>
      </div>

      {/* Balance hero card */}
      <div style={{ position: "absolute", top: 120, left: 24, right: 24 }}>
        <div style={{
          position: "relative", padding: "22px 24px 24px", borderRadius: 32,
          background: "linear-gradient(135deg, #1a1a1a 0%, #2a1117 50%, #3a1a1a 100%)",
          color: "#fff", overflow: "hidden",
          boxShadow: "0 24px 48px -28px rgba(0,0,0,0.35)",
        }}>
          {/* Decorative orbs */}
          <span style={{ position: "absolute", right: -50, top: -50, width: 180, height: 180, borderRadius: 999, background: "radial-gradient(circle, rgba(230,20,40,0.25) 0%, rgba(230,20,40,0) 60%)" }} />
          <span style={{ position: "absolute", right: 40, bottom: -60, width: 140, height: 140, borderRadius: 999, background: "radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 60%)" }} />

          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Доступный баланс
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 38, letterSpacing: "-0.02em", lineHeight: 1 }}>
                  1 245 600
                </span>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: "rgba(255,255,255,0.6)" }}>сум</span>
              </div>
            </div>
            <SosMark size={28} color="#fff" />
          </div>

          <div style={{ position: "relative", display: "flex", gap: 8 }}>
            <button style={{
              appearance: "none", border: "none", cursor: "pointer", flex: 1,
              height: 48, borderRadius: 999, background: SOS_TOKENS.red, color: "#fff",
              fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: "-0.005em",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 12px 24px -10px rgba(230,20,40,0.5)",
            }}>
              <Icon name="plus" size={14} /> Пополнить
            </button>
            <button style={{
              appearance: "none", border: "none", cursor: "pointer", flex: 1,
              height: 48, borderRadius: 999, background: "rgba(255,255,255,0.12)", color: "#fff",
              fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: "-0.005em",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <Icon name="arrow-up-right" size={14} /> Оплатить
            </button>
          </div>
        </div>
      </div>

      {/* Top-up methods */}
      <div style={{ position: "absolute", top: 380, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: SOS_TOKENS.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Способы пополнения
        </span>

        {/* Kiosk row with QR preview */}
        <div style={{
          padding: "16px 18px", borderRadius: 24,
          background: SOS_TOKENS.glass,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <KioskMiniQR />
          <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>
              Киоск Paynet / Click
            </span>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted }}>
              Покажите QR на терминале · без комиссии
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.red, fontWeight: 600 }}>
              Открыть QR во весь экран
              <Icon name="chevron-right" size={11} color={SOS_TOKENS.red} />
            </span>
          </span>
        </div>

        <TopUpRow icon="credit-card" title="С карты" sub="Uzcard, Humo · 1–2 минуты" />
        <TopUpRow icon="phone-fill"  title="Мобильный платёж" sub="Со счёта оператора" />
        <TopUpRow icon="globe"       title="Перевод другому пользователю" sub="По номеру SOS24" />
      </div>

      {/* History */}
      <div style={{ position: "absolute", top: 780, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: SOS_TOKENS.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            История · сегодня
          </span>
          <TextLink color={SOS_TOKENS.inkSubtle} style={{ fontSize: 12 }}>Все ›</TextLink>
        </div>

        <WalletTxRow
          tone="in"  icon="plus"
          title="Пополнение · Paynet"
          time="14:22"
          amount="+ 500 000"
        />
        <WalletTxRow
          tone="out" icon="shield"
          title="Оплата ОСАГО · 01 A 123 BB"
          time="11:42"
          amount="− 385 600"
        />
        <WalletTxRow
          tone="in"  icon="arrow-up-right"
          title="Возврат · CLM-24-00362"
          time="вчера"
          amount="+ 1 200 000"
        />
      </div>
    </PhoneFrame>
  );
}

function KioskMiniQR() {
  return (
    <div style={{
      width: 58, height: 58, borderRadius: 12, padding: 4,
      background: "#fff",
      display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gridTemplateRows: "repeat(9, 1fr)", gap: 1,
      flex: "none",
      boxShadow: "0 0 0 1px rgba(20,20,20,0.08)",
    }}>
      {Array.from({ length: 81 }).map((_, i) => {
        const x = i % 9, y = (i / 9) | 0;
        const inFinder = (cx, cy) => Math.abs(x - cx) <= 1 && Math.abs(y - cy) <= 1;
        const isFinder = inFinder(1, 1) || inFinder(7, 1) || inFinder(1, 7);
        const fill = isFinder || ((x * 5 + y * 11 + (x ^ y * 2)) % 7 < 3);
        return <span key={i} style={{ background: fill ? "#121212" : "transparent", borderRadius: 1 }} />;
      })}
    </div>
  );
}

function TopUpRow({ icon, title, sub }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
      borderRadius: 20,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 999,
        background: "rgba(255,255,255,0.7)", color: SOS_TOKENS.inkDark,
        display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
        boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      }}>
        <Icon name={icon} size={16} />
      </span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>{title}</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted }}>{sub}</span>
      </span>
      <Icon name="chevron-right" size={14} color="rgba(20,20,20,0.32)" />
    </div>
  );
}

function WalletTxRow({ tone, icon, title, time, amount }) {
  const inflow = tone === "in";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "12px 14px",
      borderRadius: 20,
      background: "rgba(255,255,255,0.92)",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 999,
        background: inflow ? "rgba(105,228,183,0.55)" : "rgba(20,20,20,0.06)",
        color: inflow ? "#0a3a26" : SOS_TOKENS.inkDark,
        display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
      }}>
        <Icon name={icon} size={16} />
      </span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>{title}</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMuted }}>{time}</span>
      </span>
      <span style={{
        fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 15,
        color: inflow ? "#0a3a26" : SOS_TOKENS.inkDark, letterSpacing: "-0.005em", whiteSpace: "nowrap",
      }}>
        {amount}
      </span>
    </div>
  );
}

Object.assign(window, {
  ScreenWallet, WALLET_HEIGHT,
});
