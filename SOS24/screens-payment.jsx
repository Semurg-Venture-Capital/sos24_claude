// SOS24 — Block 4: M6 Оформление + M7 Платежи (4 экрана)

// ═════════════════════════════════════════════════════════════════════════
// M6.1 — Оформление (Чекаут)
// ═════════════════════════════════════════════════════════════════════════
const CHECKOUT_HEIGHT = 1180;

function ScreenCheckout() {
  return (
    <FormScreen height={CHECKOUT_HEIGHT}>
      <div style={{ position: "absolute", top: 124, left: 24, right: 24 }}>
        <ScreenHeading title={<>Оформление полиса</>} subtitle="Проверьте данные перед оплатой" />
      </div>

      <div style={{ position: "absolute", top: 230, left: 24, right: 24, bottom: 130, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Auto block */}
        <SummaryBlock
          eyebrow="Автомобиль"
          editable
          rows={[
            { label: "Марка / модель",       value: "Chevrolet Cobalt" },
            { label: "Гос. номер",           value: "01 A 123 BB" },
            { label: "Год · Двигатель",      value: "2021 · 1.5 л" },
          ]}
        />
        {/* Drivers */}
        <SummaryBlock
          eyebrow="Водители"
          editable
          rows={[
            { label: "Каримов А. С.",  value: "стаж 8 лет" },
            { label: "Каримова М. Х.", value: "стаж 4 года" },
          ]}
        />
        {/* Period */}
        <SummaryBlock
          eyebrow="Период"
          editable
          rows={[
            { label: "Срок",              value: "12 месяцев" },
            { label: "Начало",            value: "13 мая 2026" },
            { label: "Окончание",         value: "12 мая 2027" },
          ]}
        />

        {/* Total dark card */}
        <div style={{
          background: SOS_TOKENS.inkDark, color: "#fff",
          borderRadius: 32, padding: "20px 22px 22px",
          display: "flex", flexDirection: "column", gap: 14,
          boxShadow: "0 16px 32px -20px rgba(0,0,0,0.32)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMutedDark, letterSpacing: "0.08em", textTransform: "uppercase" }}>Стоимость</span>
            <Tag tone="green">ОСАГО · 12 мес</Tag>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 38, letterSpacing: "-0.02em", lineHeight: 1 }}>385 600</span>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: SOS_TOKENS.inkMutedDark }}>сум</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.inkMutedDark }}>Способ оплаты</span>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 13 }}>Единовременно</span>
          </div>
        </div>

        {/* Agreement */}
        <label style={{
          display: "flex", alignItems: "flex-start", gap: 12,
          padding: "16px 18px", borderRadius: 20,
          background: SOS_TOKENS.glass,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          cursor: "pointer",
        }}>
          <Checkbox checked />
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.ink, lineHeight: 1.45, letterSpacing: "-0.005em" }}>
            Я ознакомился с <span style={{ color: SOS_TOKENS.inkDark, textDecoration: "underline" }}>условиями оферты</span> и согласен на обработку персональных данных
          </span>
        </label>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px",
        background: "linear-gradient(to top, rgba(237,237,237,0.95) 60%, rgba(237,237,237,0))",
      }}>
        <RedButton style={{ width: "100%" }}>Перейти к оплате · 385 600 сум</RedButton>
      </div>
    </FormScreen>
  );
}

function SummaryBlock({ eyebrow, rows = [], editable }) {
  return (
    <div style={{
      padding: "16px 18px", borderRadius: 24,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: SOS_TOKENS.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {eyebrow}
        </span>
        {editable && (
          <button style={{
            appearance: "none", border: "none", background: "transparent", cursor: "pointer",
            color: SOS_TOKENS.inkSubtle, fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: "-0.005em",
            display: "inline-flex", alignItems: "center", gap: 4, padding: 0,
          }}>
            Изменить
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1 1l4 4-4 4" /></svg>
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <span style={{
              flex: "1 1 auto", minWidth: 0,
              fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {r.label}
            </span>
            <span style={{
              flex: "0 0 auto",
              fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 14, color: SOS_TOKENS.inkDark, letterSpacing: "-0.005em",
              textAlign: "right", whiteSpace: "nowrap",
            }}>
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M7.1 — Оплата
// ═════════════════════════════════════════════════════════════════════════
function ScreenPayment() {
  return (
    <FormScreen>
      <div style={{ position: "absolute", top: 124, left: 24, right: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: SOS_TOKENS.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          К оплате
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 44, letterSpacing: "-0.02em", lineHeight: 1, color: SOS_TOKENS.ink }}>
            385 600
          </span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 16, color: SOS_TOKENS.inkMuted }}>сум</span>
        </div>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
          ОСАГО · Chevrolet Cobalt · 12 мес
        </span>
      </div>

      <div style={{ position: "absolute", top: 290, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 14, bottom: 130 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
          Способ оплаты
        </span>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <CardOption
            selected
            type="uzcard"
            last4="4582"
            expiry="08/27"
          />
          <CardOption
            type="humo"
            last4="1190"
            expiry="03/28"
          />
          <NewCardOption />
        </div>

        <div style={{
          marginTop: 4, padding: "14px 16px", borderRadius: 20,
          background: "rgba(105,228,183,0.15)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ width: 28, height: 28, borderRadius: 999, background: SOS_TOKENS.green, color: "#0a3a26", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          </span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: "#0a3a26", lineHeight: 1.4, letterSpacing: "-0.005em" }}>
            Платёж защищён. Данные карты не сохраняются на нашем сервере.
          </span>
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px",
        background: "linear-gradient(to top, rgba(237,237,237,0.95) 60%, rgba(237,237,237,0))",
      }}>
        <RedButton style={{ width: "100%" }} trailing={false}>
          <PayLockIcon /> Оплатить 385 600 сум
        </RedButton>
      </div>
    </FormScreen>
  );
}

function CardOption({ selected, type, last4, expiry }) {
  const brandColor = type === "uzcard" ? "#0099d8" : "#0a8a3a";
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
      borderRadius: 22, cursor: "pointer",
      background: selected ? SOS_TOKENS.inkDark : SOS_TOKENS.glass,
      color: selected ? "#fff" : SOS_TOKENS.ink,
      backdropFilter: selected ? "none" : "blur(8px)",
      WebkitBackdropFilter: selected ? "none" : "blur(8px)",
      boxShadow: selected ? "0 12px 24px -16px rgba(0,0,0,0.32)" : `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
    }}>
      <CardBrand type={type} brandColor={brandColor} dark={selected} />
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 15, letterSpacing: "0.04em" }}>
          •••• {last4}
        </span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: selected ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.inkMuted }}>
          {type === "uzcard" ? "Uzcard" : "Humo"} · до {expiry}
        </span>
      </span>
      <span style={{
        width: 22, height: 22, borderRadius: 999,
        background: selected ? SOS_TOKENS.red : "rgba(255,255,255,0.6)",
        boxShadow: selected ? "none" : `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4.5l3 3 6-6.5" />
          </svg>
        )}
      </span>
    </label>
  );
}

function CardBrand({ type, brandColor, dark }) {
  return (
    <span style={{
      width: 44, height: 30, borderRadius: 7,
      background: dark ? "rgba(255,255,255,0.08)" : "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flex: "none",
      boxShadow: dark ? "none" : "0 1px 0 rgba(0,0,0,0.04)",
    }}>
      <span style={{
        fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 700, fontSize: 11,
        color: brandColor, letterSpacing: "0.02em",
      }}>
        {type === "uzcard" ? "Uzcard" : "Humo"}
      </span>
    </span>
  );
}

function NewCardOption() {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
      borderRadius: 22, cursor: "pointer",
      background: "transparent",
      border: `1.5px dashed rgba(20,20,20,0.16)`,
    }}>
      <span style={{
        width: 44, height: 30, borderRadius: 7,
        background: "rgba(20,20,20,0.04)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flex: "none", color: SOS_TOKENS.inkSubtle,
      }}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M10 4v12M4 10h12" />
        </svg>
      </span>
      <span style={{ flex: 1, fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 15, color: SOS_TOKENS.inkDark, letterSpacing: "-0.005em" }}>
        Новая карта
      </span>
      <ChevronRight />
    </label>
  );
}

function PayLockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="11" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M7.2 — Успешная оплата
// ═════════════════════════════════════════════════════════════════════════
function ScreenSuccess() {
  return (
    <PhoneFrame>
      {/* Top — back/close button + skip */}
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 3 }}>
        <span style={{ width: 48, height: 48 }} />
        <button style={{
          appearance: "none", border: "none", width: 48, height: 48, borderRadius: 999,
          background: SOS_TOKENS.glass,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          boxShadow: SOS_TOKENS.shadowSoft,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: SOS_TOKENS.inkDark,
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12" /></svg>
        </button>
      </div>

      {/* Hero success */}
      <div style={{ position: "absolute", top: 130, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <SuccessTick />
        <div style={{ textAlign: "center", padding: "0 32px" }}>
          <h1 style={{
            margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 30,
            letterSpacing: "-0.01em", color: SOS_TOKENS.ink, lineHeight: 1.1,
          }}>Полис оформлен!</h1>
          <p style={{
            margin: "10px 0 0", fontFamily: "'Manrope',sans-serif", fontSize: 16,
            color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em",
          }}>
            ОСАГО действует с <span style={{ color: SOS_TOKENS.inkDark, fontWeight: 600 }}>13.05.2026</span> по <span style={{ color: SOS_TOKENS.inkDark, fontWeight: 600 }}>12.05.2027</span>
          </p>
        </div>
      </div>

      {/* Policy mini card */}
      <div style={{ position: "absolute", left: 24, right: 24, top: 440 }}>
        <div style={{
          padding: "20px 22px", borderRadius: 32,
          background: SOS_TOKENS.inkDark, color: "#fff",
          display: "flex", flexDirection: "column", gap: 14,
          boxShadow: "0 24px 48px -28px rgba(0,0,0,0.35)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <SosLogo color="#fff" />
            <Tag tone="glass">№ 1224 5582 0091</Tag>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMutedDark, letterSpacing: "0.08em", textTransform: "uppercase" }}>ОСАГО · 12 мес</span>
              <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22, letterSpacing: "-0.005em", lineHeight: 1 }}>01 A 123 BB</span>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMutedDark, marginTop: 4 }}>Chevrolet Cobalt</span>
            </div>
            <MiniQR />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ position: "absolute", left: 24, right: 24, bottom: 36, display: "flex", flexDirection: "column", gap: 10 }}>
        <RedButton style={{ width: "100%" }}>Мои полисы</RedButton>
        <OutlineButton style={{ width: "100%" }}>
          <DownloadIcon /> Скачать PDF
        </OutlineButton>
        <TextLink color={SOS_TOKENS.inkSubtle} style={{ alignSelf: "center", marginTop: 8 }}>На главную</TextLink>
      </div>
    </PhoneFrame>
  );
}

function SuccessTick() {
  return (
    <div style={{
      position: "relative",
      width: 140, height: 140, borderRadius: 999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(circle, rgba(105,228,183,0.2) 0%, rgba(105,228,183,0) 70%)",
    }}>
      {/* Rings */}
      <span style={{
        position: "absolute", inset: 0, borderRadius: 999,
        border: "1px solid rgba(105,228,183,0.35)",
        animation: "sosRing 2.4s ease-out infinite",
      }} />
      <span style={{
        position: "absolute", inset: 20, borderRadius: 999,
        border: "1px solid rgba(105,228,183,0.5)",
      }} />
      {/* Big tick */}
      <div style={{
        width: 88, height: 88, borderRadius: 999,
        background: "linear-gradient(135deg, #69E4B7 0%, #34D399 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 16px 40px -10px rgba(52,211,153,0.5)",
      }}>
        <svg width="40" height="32" viewBox="0 0 40 32" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17l11 11L37 4" />
        </svg>
      </div>
    </div>
  );
}

function MiniQR() {
  // Stylized fake QR — pattern of dots, large finder squares in 3 corners.
  return (
    <div style={{
      width: 78, height: 78, borderRadius: 12, padding: 6,
      background: "#fff",
      display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gridTemplateRows: "repeat(9, 1fr)", gap: 1,
      flex: "none",
    }}>
      {Array.from({ length: 81 }).map((_, i) => {
        const x = i % 9, y = (i / 9) | 0;
        const inFinder = (cx, cy) => Math.abs(x - cx) <= 1 && Math.abs(y - cy) <= 1;
        const isFinder = inFinder(1, 1) || inFinder(7, 1) || inFinder(1, 7);
        const fill = isFinder || ((x * 3 + y * 7 + (x ^ y)) % 5 < 2);
        return <span key={i} style={{ background: fill ? "#121212" : "transparent", borderRadius: 1 }} />;
      })}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12M6 11l6 6 6-6" />
      <path d="M4 20h16" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M7.3 — Мои карты
// ═════════════════════════════════════════════════════════════════════════
function ScreenMyCards() {
  return (
    <FormScreen>
      <div style={{ position: "absolute", top: 124, left: 24, right: 24 }}>
        <ScreenHeading title={<>Мои карты</>} subtitle="Управление сохранёнными способами оплаты" />
      </div>

      <div style={{ position: "absolute", top: 230, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <SavedCardBig type="uzcard" last4="4582" expiry="08/27" holder="A. KARIMOV" primary />
        <SavedCardBig type="humo"   last4="1190" expiry="03/28" holder="A. KARIMOV" />

        <AddTile style={{ marginTop: 6 }}>Добавить карту</AddTile>

        <div style={{
          marginTop: 6, padding: "14px 16px", borderRadius: 20,
          background: SOS_TOKENS.glass,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ width: 28, height: 28, borderRadius: 999, background: "rgba(20,20,20,0.06)", color: SOS_TOKENS.inkDark, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
          </span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.inkMuted, lineHeight: 1.4 }}>
            Поддерживаются карты Uzcard и Humo. Visa и Mastercard скоро.
          </span>
        </div>
      </div>
    </FormScreen>
  );
}

function SavedCardBig({ type, last4, expiry, holder, primary }) {
  const dark = type === "uzcard";
  const grad = dark
    ? "linear-gradient(135deg, #121212 0%, #1f2a37 100%)"
    : "linear-gradient(135deg, #0a8a3a 0%, #34d399 100%)";
  const brand = type === "uzcard" ? "Uzcard" : "Humo";
  return (
    <div style={{
      position: "relative", height: 200, borderRadius: 28, padding: "22px 24px",
      background: grad, color: "#fff", overflow: "hidden",
      boxShadow: "0 24px 48px -28px rgba(0,0,0,0.32)",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      {/* Decorative orbs */}
      <span style={{ position: "absolute", right: -40, top: -40, width: 160, height: 160, borderRadius: 999, background: "rgba(255,255,255,0.06)" }} />
      <span style={{ position: "absolute", right: 30, bottom: -60, width: 120, height: 120, borderRadius: 999, background: "rgba(255,255,255,0.05)" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {primary && <Tag tone="glass" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>Основная</Tag>}
        </div>
        <span style={{
          padding: "4px 12px", borderRadius: 8,
          background: "rgba(255,255,255,0.9)", color: dark ? "#0099d8" : "#0a6a2a",
          fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.02em",
        }}>{brand}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative" }}>
        <span style={{
          fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22,
          letterSpacing: "0.18em",
        }}>
          •••• •••• •••• {last4}
        </span>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Владелец</span>
            <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 13, letterSpacing: "0.06em" }}>{holder}</span>
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Срок</span>
            <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 13, letterSpacing: "0.06em" }}>{expiry}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ScreenCheckout, ScreenPayment, ScreenSuccess, ScreenMyCards,
  CHECKOUT_HEIGHT,
});
