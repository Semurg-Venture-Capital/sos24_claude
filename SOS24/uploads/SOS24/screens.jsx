// SOS24 — screens. M1 onboarding + auth + home (Figma originals).
// All screens render at 390 × 844 inside <PhoneFrame>.

// ═════════════════════════════════════════════════════════════════════════
// SHARED — illustration placeholder block. User will swap with real assets.
// ═════════════════════════════════════════════════════════════════════════
function IllusPlaceholder({ children, width = 280, height = 220, label = "иллюстрация", note }) {
  return (
    <div style={{
      width, height, borderRadius: 32,
      background: "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.35))",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset, 0 20px 40px -20px rgba(0,0,0,0.08)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 10, color: SOS_TOKENS.inkMuted, position: "relative", overflow: "hidden",
    }}>
      {children}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 14, gap: 4, pointerEvents: "none" }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(20,20,20,0.35)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {label}
        </span>
        {note && (
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: "rgba(20,20,20,0.45)" }}>{note}</span>
        )}
      </div>
    </div>
  );
}

// Small badge stamped on placeholder visuals so the user can easily spot what to replace.
function PlaceholderBadge({ style }) {
  return (
    <div style={{
      position: "absolute", top: 10, left: 10, zIndex: 5,
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 10px 5px 8px", borderRadius: 999,
      background: "rgba(20,20,20,0.78)", color: "#fff",
      fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: "0.04em",
      boxShadow: "0 6px 16px -8px rgba(0,0,0,0.5)",
      ...style,
    }}>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round">
        <rect x="2" y="2" width="8" height="8" rx="1.5" />
        <path d="M2 2l8 8M10 2l-8 8" />
      </svg>
      ЗАГЛУШКА
    </div>
  );
}

// ============================================================================
// M1.1 — Splash
// ═════════════════════════════════════════════════════════════════════════
function ScreenSplash() {
  return (
    <PhoneFrame>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 18,
      }}>
        {/* Soft radial halo behind logo */}
        <div style={{
          position: "absolute", width: 360, height: 360, borderRadius: 999,
          background: "radial-gradient(circle, rgba(230,20,40,0.10) 0%, rgba(230,20,40,0) 60%)",
          pointerEvents: "none",
        }} />
        {/* Logo lockup, larger version of SosLogo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, zIndex: 1, animation: "sosPulse 2.4s ease-in-out infinite" }}>
          <SosMark size={56} />
          <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 700, fontSize: 52, color: SOS_TOKENS.ink, letterSpacing: "-0.03em", lineHeight: 1 }}>SOS</span>
          <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 600, fontSize: 24, color: SOS_TOKENS.ink, letterSpacing: 0, lineHeight: 1, alignSelf: "flex-end", paddingBottom: 4 }}>24</span>
        </div>
        <div style={{
          fontFamily: "'Manrope',sans-serif", fontSize: 16, color: SOS_TOKENS.inkMuted,
          letterSpacing: "-0.005em", zIndex: 1,
        }}>
          Помощник на дороге 24/7
        </div>
      </div>

      {/* Loading indicator — thin red bar at bottom */}
      <div style={{
        position: "absolute", left: 24, right: 24, bottom: 80,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 140, height: 3, borderRadius: 999, background: "rgba(20,20,20,0.08)", overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: "55%", borderRadius: 999,
            background: SOS_TOKENS.red,
            boxShadow: `0 0 12px ${SOS_TOKENS.redSoft}`,
          }} />
        </div>
      </div>
    </PhoneFrame>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M1.2 — Onboarding slides (3 total)
// ═════════════════════════════════════════════════════════════════════════

// Shared frame: skip link top-right + hero illustration + bottom glass sheet
function OnboardingFrame({ slide, illus, title, body, primary = "Далее", showSkip = true }) {
  return (
    <PhoneFrame>
      {/* Top-right Skip link */}
      {showSkip && (
        <div style={{ position: "absolute", top: 64, right: 24, zIndex: 4 }}>
          <TextLink color={SOS_TOKENS.inkSubtle}>Пропустить</TextLink>
        </div>
      )}

      {/* Hero illustration */}
      <div style={{
        position: "absolute", top: 130, left: 0, right: 0, height: 320,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {illus}
      </div>

      {/* Bottom content sheet — top corners rounded, bottom flush */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 320,
        background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderRadius: "48px 48px 0 0",
        padding: "32px 24px 32px",
        display: "flex", flexDirection: "column", alignItems: "stretch", gap: 24,
      }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <PageDots count={3} active={slide} />
        </div>
        <div>
          <h1 style={{
            margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 26,
            lineHeight: 1.2, letterSpacing: "-0.01em", color: SOS_TOKENS.ink, textWrap: "pretty",
          }}>{title}</h1>
          <p style={{
            margin: "10px 0 0 0", fontFamily: "'Manrope',sans-serif", fontSize: 16,
            lineHeight: 1.45, letterSpacing: "-0.01em", color: SOS_TOKENS.inkMuted, textWrap: "pretty",
          }}>{body}</p>
        </div>
        <RedButton style={{ width: "100%" }}>{primary}</RedButton>
      </div>
    </PhoneFrame>
  );
}

// Slide 1 — keeps Figma original (car image)
function ScreenOnboarding1() {
  return (
    <OnboardingFrame
      slide={0}
      illus={
        <div style={{ position: "relative", width: 360, height: 260 }}>
          <PlaceholderBadge />
          <div style={{
            position: "absolute", inset: 0,
            background: `url(assets/hero-image.png) center / contain no-repeat`,
          }} />
        </div>
      }
      title={<>Полис ОСАГО или<br />КАСКО — за&nbsp;2&nbsp;минуты</>}
      body="Введите номер авто — данные подтянутся автоматически. Оплата картой Uzcard или Humo."
    />
  );
}

// Slide 2 — Помощь на дороге
function ScreenOnboarding2() {
  return (
    <OnboardingFrame
      slide={1}
      illus={
        <div style={{ position: "relative" }}>
          <PlaceholderBadge />
          <IllusOnboardingHelp />
        </div>
      }
      title={<>Помощь на дороге<br />в любое время</>}
      body="Вызовите аварийного инспектора или оформите электронный европротокол прямо с телефона."
    />
  );
}

// Slide 3 — Сеть партнёров
function ScreenOnboarding3() {
  return (
    <OnboardingFrame
      slide={2}
      illus={
        <div style={{ position: "relative" }}>
          <PlaceholderBadge />
          <IllusOnboardingPartners />
        </div>
      }
      title={<>Сеть партнёров<br />рядом с вами</>}
      body="СТО и медклиники по всему Узбекистану. Запись и оплата через приложение."
      primary="Начать"
      showSkip={false}
    />
  );
}

// — Illustrations (placeholders; user will replace)
function IllusOnboardingHelp() {
  return (
    <div style={{ position: "relative", width: 320, height: 280 }}>
      {/* Phone shell */}
      <div style={{
        position: "absolute", left: 60, top: 20, width: 180, height: 240, borderRadius: 32,
        background: "rgba(255,255,255,0.85)",
        boxShadow: "0 30px 60px -30px rgba(0,0,0,0.2), 0 0 0 1px rgba(20,20,20,0.06)",
        overflow: "hidden",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      }}>
        {/* Mini map */}
        <div style={{
          position: "absolute", inset: 14, borderRadius: 22, overflow: "hidden",
          background: "linear-gradient(180deg, #eef0ef 0%, #e3e6e4 100%)",
        }}>
          {/* roads */}
          <svg width="100%" height="100%" viewBox="0 0 160 200" style={{ position: "absolute", inset: 0 }}>
            <path d="M-10 70 Q60 50 90 90 T180 110" stroke="rgba(20,20,20,0.12)" strokeWidth="14" fill="none" strokeLinecap="round" />
            <path d="M-10 70 Q60 50 90 90 T180 110" stroke="rgba(255,255,255,0.95)" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M20 -10 L70 80 L60 220" stroke="rgba(20,20,20,0.1)" strokeWidth="12" fill="none" strokeLinecap="round" />
            <path d="M20 -10 L70 80 L60 220" stroke="rgba(255,255,255,0.9)" strokeWidth="8" fill="none" strokeLinecap="round" />
          </svg>
          {/* Pin */}
          <div style={{ position: "absolute", left: 70, top: 80 }}>
            <div style={{ width: 36, height: 36, borderRadius: 999, background: SOS_TOKENS.red, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px -8px rgba(230,20,40,0.55)" }}>
              <SosMark size={16} color="#fff" />
            </div>
            <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: SOS_TOKENS.red, animation: "sosRing 1.8s ease-out infinite", zIndex: -1 }} />
          </div>
        </div>
      </div>
      {/* Floating inspector status pill */}
      <div style={{
        position: "absolute", left: 12, top: 178, padding: "10px 14px 10px 12px",
        borderRadius: 999, background: "#fff", display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 16px 32px -12px rgba(0,0,0,0.18)",
      }}>
        <span style={{ width: 28, height: 28, borderRadius: 999, background: SOS_TOKENS.green, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#0a3a26", fontSize: 12, fontWeight: 700 }}>✓</span>
        <span style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted }}>Инспектор в пути</span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, color: SOS_TOKENS.inkDark }}>~ 12 минут</span>
        </span>
      </div>
    </div>
  );
}

function IllusOnboardingPartners() {
  const items = [
    { label: "СТО", sub: "0.4 км" },
    { label: "Клиника", sub: "1.2 км" },
    { label: "СТО", sub: "2.1 км" },
    { label: "Эвакуатор", sub: "3.0 км" },
  ];
  return (
    <div style={{ position: "relative", width: 320, height: 280 }}>
      {/* Central marker — user */}
      <div style={{
        position: "absolute", left: 140, top: 116, width: 40, height: 40, borderRadius: 999,
        background: SOS_TOKENS.red, boxShadow: "0 12px 24px -8px rgba(230,20,40,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <SosMark size={18} color="#fff" />
      </div>
      {/* Concentric rings */}
      {[60, 110, 160].map((r) => (
        <div key={r} style={{
          position: "absolute", left: 160 - r, top: 136 - r, width: r * 2, height: r * 2, borderRadius: 999,
          border: "1px dashed rgba(20,20,20,0.12)", pointerEvents: "none",
        }} />
      ))}
      {/* Partner pills positioned around */}
      {[
        { top: 30,  left: 30  },
        { top: 60,  left: 220 },
        { top: 200, left: 24  },
        { top: 220, left: 200 },
      ].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", top: pos.top, left: pos.left,
          background: "#fff", borderRadius: 999, padding: "8px 12px 8px 8px",
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 12px 24px -12px rgba(0,0,0,0.18)",
        }}>
          <span style={{
            width: 26, height: 26, borderRadius: 999,
            background: "linear-gradient(135deg, #f4f4f4, #e8e8e8)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 700, color: SOS_TOKENS.inkDark,
          }}>{items[i].label[0]}</span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: SOS_TOKENS.inkDark }}>{items[i].label}</span>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 10, color: SOS_TOKENS.inkMuted }}>{items[i].sub}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M1.3 — Auth Choose (Войти / Зарегистрироваться)
// ═════════════════════════════════════════════════════════════════════════
function ScreenAuthChoose() {
  return (
    <PhoneFrame>
      {/* Logo, top of safe area */}
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SosMark size={36} />
          <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 700, fontSize: 34, color: SOS_TOKENS.ink, letterSpacing: "-0.03em", lineHeight: 1 }}>SOS</span>
          <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 600, fontSize: 18, color: SOS_TOKENS.ink, lineHeight: 1, alignSelf: "flex-end", paddingBottom: 3 }}>24</span>
        </div>
      </div>

      {/* Heading block */}
      <div style={{ position: "absolute", top: 220, left: 24, right: 24, textAlign: "center" }}>
        <h1 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 30, letterSpacing: "-0.01em", color: SOS_TOKENS.ink }}>
          Добро пожаловать
        </h1>
        <p style={{ margin: "10px 0 0", fontFamily: "'Manrope',sans-serif", fontSize: 16, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
          Войдите или создайте аккаунт
        </p>
      </div>

      {/* Decorative glass illustration mid-screen */}
      <div style={{ position: "absolute", top: 340, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative" }}>
          <PlaceholderBadge style={{ top: 0, left: 0 }} />
          <IllusAuthHand />
        </div>
      </div>

      {/* Buttons stacked at bottom */}
      <div style={{ position: "absolute", left: 24, right: 24, bottom: 64, display: "flex", flexDirection: "column", gap: 10 }}>
        <RedButton style={{ width: "100%" }}>Войти</RedButton>
        <OutlineButton style={{ width: "100%" }}>Зарегистрироваться</OutlineButton>
        <p style={{
          margin: "12px 4px 0", fontFamily: "'Manrope',sans-serif", fontSize: 12,
          color: SOS_TOKENS.inkMuted, lineHeight: 1.45, textAlign: "center", textWrap: "pretty",
        }}>
          Продолжая, вы соглашаетесь с <span style={{ color: SOS_TOKENS.inkDark, textDecoration: "underline" }}>условиями оферты</span> и <span style={{ color: SOS_TOKENS.inkDark, textDecoration: "underline" }}>политикой конфиденциальности</span>
        </p>
      </div>
    </PhoneFrame>
  );
}

function IllusAuthHand() {
  // Glass card with sample policy info — visual flourish
  return (
    <div style={{ position: "relative", width: 280, height: 160 }}>
      <div style={{
        position: "absolute", left: 28, top: 12, width: 224, height: 136, borderRadius: 28,
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        boxShadow: "0 24px 48px -24px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.7) inset",
        padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between",
        transform: "rotate(-3deg)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SosLogo />
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 10, color: SOS_TOKENS.inkMuted, letterSpacing: "0.1em" }}>ОСАГО</span>
        </div>
        <div style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 18, letterSpacing: "-0.005em", color: SOS_TOKENS.inkDark }}>
          01 A 123 BB
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMuted }}>
          <span>Активен до</span><span style={{ color: SOS_TOKENS.inkDark, fontWeight: 600 }}>11.05.2027</span>
        </div>
      </div>
      <div style={{
        position: "absolute", left: 8, top: 36, width: 224, height: 136, borderRadius: 28,
        background: "rgba(230,20,40,0.85)",
        boxShadow: "0 24px 48px -24px rgba(230,20,40,0.45)",
        padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between",
        transform: "rotate(4deg)", zIndex: -1, color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SosMark size={16} color="#fff" />
          <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 700, fontSize: 14 }}>SOS24</span>
        </div>
        <div style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 18, lineHeight: 1.2 }}>
          Заявить ДТП<br />за&nbsp;2&nbsp;минуты
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Form screens — back button + heading scaffold
// ═════════════════════════════════════════════════════════════════════════
function FormScreen({ children, stepper, onBack, height }) {
  return (
    <PhoneFrame height={height}>
      {/* Top: back button on left, optional stepper */}
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", alignItems: "center", gap: 16, zIndex: 3 }}>
        <BackButton onClick={onBack} />
        {stepper && <div style={{ flex: 1 }}>{stepper}</div>}
      </div>
      {children}
    </PhoneFrame>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M1.4 — Phone Input
// ═════════════════════════════════════════════════════════════════════════
function ScreenPhone() {
  return (
    <FormScreen>
      <div style={{ position: "absolute", top: 140, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 28, letterSpacing: "-0.01em", color: SOS_TOKENS.ink, lineHeight: 1.15 }}>
            Введите номер<br />телефона
          </h1>
          <p style={{ margin: "10px 0 0", fontFamily: "'Manrope',sans-serif", fontSize: 16, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
            Отправим SMS с кодом подтверждения
          </p>
        </div>
        <TextInput
          label="Номер телефона"
          prefix={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <UzFlag />
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 17, color: SOS_TOKENS.inkDark, fontWeight: 500 }}>+998</span>
              <span style={{ width: 1, height: 22, background: SOS_TOKENS.hairline, marginLeft: 4, marginRight: 4 }} />
            </span>
          }
          value="(90) 123-45-67"
          state="filled"
        />
      </div>

      <div style={{ position: "absolute", left: 24, right: 24, bottom: 64 }}>
        <RedButton style={{ width: "100%" }}>Получить код</RedButton>
      </div>
    </FormScreen>
  );
}

function UzFlag() {
  // Флаг Узбекистана: голубой / белый / красный (тонкий) / белый / зелёный
  return (
    <span style={{
      width: 28, height: 20, borderRadius: 4, overflow: "hidden",
      display: "inline-flex", flexDirection: "column",
      boxShadow: "0 0 0 1px rgba(20,20,20,0.06)",
    }}>
      <span style={{ flex: 5, background: "#0099b5" }} />
      <span style={{ flex: 1, background: "#ffffff" }} />
      <span style={{ flex: 0.6, background: "#ce1126" }} />
      <span style={{ flex: 1, background: "#ffffff" }} />
      <span style={{ flex: 5, background: "#1eb53a" }} />
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M1.5 — OTP
// ═════════════════════════════════════════════════════════════════════════
function ScreenOTP() {
  return (
    <FormScreen>
      <div style={{ position: "absolute", top: 140, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 28, letterSpacing: "-0.01em", color: SOS_TOKENS.ink, lineHeight: 1.15 }}>
            Введите код<br />из SMS
          </h1>
          <p style={{ margin: "10px 0 0", fontFamily: "'Manrope',sans-serif", fontSize: 16, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
            Код отправлен на <span style={{ color: SOS_TOKENS.inkDark, fontWeight: 500 }}>+998&nbsp;90&nbsp;123-45-67</span>
          </p>
        </div>

        <OTPBoxes value="421" focusIndex={3} />

        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: SOS_TOKENS.inkMuted }}>
            Отправить код повторно через <span style={{ color: SOS_TOKENS.inkDark, fontWeight: 600 }}>01:24</span>
          </span>
          <TextLink color={SOS_TOKENS.inkSubtle}>Изменить номер</TextLink>
        </div>
      </div>
    </FormScreen>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M1.6 — Profile Setup
// ═════════════════════════════════════════════════════════════════════════
function ScreenProfileSetup() {
  return (
    <FormScreen stepper={<StepperBar current={1} total={1} />}>
      <div style={{ position: "absolute", top: 140, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 28, letterSpacing: "-0.01em", color: SOS_TOKENS.ink, lineHeight: 1.15 }}>
            Расскажите<br />о себе
          </h1>
          <p style={{ margin: "10px 0 0", fontFamily: "'Manrope',sans-serif", fontSize: 16, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
            Нужно для оформления полисов
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <TextInput label="Имя" value="Азиз" />
          <TextInput label="Фамилия" value="Каримов" />
          <TextInput label="Отчество (необязательно)" placeholder="Не указано" />
          <TextInput
            label="Дата рождения"
            value="14.05.1995"
            suffix={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={SOS_TOKENS.inkMuted} strokeWidth="1.6" strokeLinecap="round">
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M3 10h18M8 3v4M16 3v4" />
              </svg>
            }
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
              Язык интерфейса
            </span>
            <Segmented options={["O'zbek", "Ўзбек", "Русский", "English"]} active={2} />
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 24, right: 24, bottom: 36 }}>
        <RedButton style={{ width: "100%" }}>Продолжить</RedButton>
      </div>
    </FormScreen>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// HOME v2 — по спецификации (greeting + полисы + быстрые действия + партнёры + акции)
// ═════════════════════════════════════════════════════════════════════════
const HOME_HEIGHT = 1480;

function ScreenHomeV2() {
  return (
    <PhoneFrame height={HOME_HEIGHT}>
      {/* Top bar: burger / logo / bell */}
      <TopBar
        leading={<IconButton><IconBurger /></IconButton>}
        center={<GlassPill style={{ height: 48, padding: "0 18px", gap: 8 }}><SosLogo /></GlassPill>}
        trailing={<IconButton badge><IconBell /></IconButton>}
      />

      {/* Content stack */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 130, bottom: 120, display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Greeting */}
        <div style={{ padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>Доброе утро</span>
            <h1 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 26, letterSpacing: "-0.01em", color: SOS_TOKENS.ink, lineHeight: 1 }}>
              Азиз
            </h1>
          </div>
          <GlassPill style={{ height: 34, padding: "0 12px", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SOS_TOKENS.inkDark} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 500, color: SOS_TOKENS.inkDark }}>+22° Ташкент</span>
          </GlassPill>
        </div>

        {/* My active policies — horizontal scroll */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SectionRow title="Мои полисы" linkLabel="Все" />
          <HScroll>
            <PolicyCardActive
              tone="dark"
              type="КАСКО"
              car="Chevrolet Cobalt"
              plate="01 A 123 BB"
              daysLeft={365}
              expiry="11.05.2027"
            />
            <PolicyCardActive
              tone="light"
              type="ОСАГО"
              car="Hyundai Sonata"
              plate="10 R 555 AC"
              daysLeft={43}
              expiry="26.06.2026"
              warn
            />
            {/* Empty / add card hint */}
            <div style={{
              flex: "none", width: 200, height: 200, borderRadius: 32,
              border: `1.5px dashed rgba(20,20,20,0.16)`, background: "transparent",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 18,
              color: SOS_TOKENS.inkSubtle, textAlign: "center",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, letterSpacing: "-0.005em" }}>Оформить<br />новый полис</span>
            </div>
          </HScroll>
        </div>

        {/* SOS banner */}
        <div style={{ padding: "0 24px" }}>
          <button style={{
            appearance: "none", border: "none", cursor: "pointer", width: "100%",
            background: SOS_TOKENS.red, borderRadius: 999, padding: "20px 24px",
            display: "flex", alignItems: "center", gap: 12, textAlign: "left",
            color: "#fff", boxShadow: "0 16px 32px -16px rgba(230,20,40,0.55)",
          }}>
            <span style={{
              width: 48, height: 48, borderRadius: 999, background: "#fff", color: SOS_TOKENS.red,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 26, flex: "none",
              boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
            }}>!</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
              <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 20, letterSpacing: "-0.01em" }}>SOS — экстренная помощь</span>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: SOS_TOKENS.inkMutedDark, letterSpacing: "-0.005em" }}>ДТП, мед. помощь, угон — поможем разобраться</span>
            </span>
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1l6 6-6 6" /></svg>
          </button>
        </div>

        {/* Quick actions 2×2 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SectionRow title="Быстрые действия" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 24px" }}>
            <ActionTileV2 dark icon={<Icon name="file-check" size={32} stroke={1.8} />} label={"Страховой\nполис"} />
            <ActionTileV2 icon={<Icon name="badge-check" size={32} stroke={1.8} color={SOS_TOKENS.red} />} label="Аджастер" />
            <ActionTileV2 icon={<Icon name="users" size={32} stroke={1.8} color={SOS_TOKENS.red} />} label="Партнёры" />
            <ActionTileV2 icon={<Icon name="file-text" size={32} stroke={1.8} color={SOS_TOKENS.red} />} label="Европротокол" />
          </div>
        </div>

        {/* Partners nearby */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SectionRow title="Партнёры рядом" linkLabel="Все" />
          <HScroll>
            <PartnerCard name="AutoFix СТО" type="СТО" rating="4.8" reviews="124" distance="0.4 км" open />
            <PartnerCard name="Медсервис" type="Клиника" rating="4.6" reviews="58" distance="1.2 км" open />
            <PartnerCard name="АвтоЦентр" type="СТО" rating="4.5" reviews="212" distance="2.1 км" />
            <PartnerCard name="Эвак-24" type="Эвак." rating="4.9" reviews="31" distance="3.0 км" open />
          </HScroll>
        </div>

        {/* News / promo */}
        <div style={{ paddingBottom: 8 }}>
          <SectionRow title="Акции" linkLabel="Все" />
          <div style={{ margin: "12px 24px 0", position: "relative", height: 140, borderRadius: 28, overflow: "hidden", color: "#fff" }}>
            <PlaceholderBadge style={{ top: 10, right: 10, left: "auto" }} />
            <div style={{ position: "absolute", inset: 0,
              background: "linear-gradient(135deg, #2a1a2f 0%, #4a1830 50%, #6a1828 100%)" }} />
            <div style={{ position: "absolute", inset: 0,
              background: "radial-gradient(circle at 80% 100%, rgba(230,20,40,0.4) 0%, rgba(230,20,40,0) 60%)" }} />
            <div style={{ position: "relative", padding: "22px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.65)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Спецпредложение</span>
                <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
                  КАСКО со скидкой 15%<br />при продлении
                </span>
              </div>
              <span style={{ display: "inline-flex", alignSelf: "flex-start", padding: "7px 14px", borderRadius: 999, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "-0.005em" }}>
                До 31 мая
              </span>
            </div>
          </div>
        </div>
      </div>

      <BottomTabBar active={0} />
    </PhoneFrame>
  );
}

// — Section header with optional "Все >" link
function SectionRow({ title, linkLabel }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 24px" }}>
      <h3 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 18, letterSpacing: "-0.005em", color: SOS_TOKENS.ink }}>
        {title}
      </h3>
      {linkLabel && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkSubtle, cursor: "pointer" }}>
          {linkLabel}
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M1 1l4 4-4 4" /></svg>
        </span>
      )}
    </div>
  );
}

// Horizontal scroll — cards have symmetric 24px breathing room left/right
function HScroll({ children }) {
  return (
    <div style={{
      display: "flex", gap: 12, padding: "0 24px",
      overflowX: "auto", overflowY: "hidden", scrollSnapType: "x mandatory",
      scrollPaddingLeft: 24, scrollPaddingRight: 24,
    }}>
      {children}
      {/* trailing spacer so last card has 24px right gutter */}
      <span style={{ flex: "none", width: 1 }} />
    </div>
  );
}

// Active policy card (in horizontal scroll)
function PolicyCardActive({ tone, type, car, plate, daysLeft, expiry, warn }) {
  const dark = tone === "dark";
  return (
    <div style={{
      flex: "none", width: 260, scrollSnapAlign: "start",
      borderRadius: 32,
      background: dark ? SOS_TOKENS.inkDark : "rgba(255,255,255,0.6)",
      backdropFilter: dark ? "none" : "blur(8px)", WebkitBackdropFilter: dark ? "none" : "blur(8px)",
      boxShadow: dark
        ? "0 16px 32px -20px rgba(0,0,0,0.32)"
        : "0 1px 0 rgba(255,255,255,0.7) inset, 0 12px 24px -16px rgba(0,0,0,0.1)",
      padding: 18,
      color: dark ? "#fff" : SOS_TOKENS.ink,
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Tag tone={dark ? "glass" : "ink"}>{type}</Tag>
        {warn
          ? <Tag tone="yellow">{daysLeft} дн.</Tag>
          : <Tag tone="green">{daysLeft} дн.</Tag>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: "auto" }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: dark ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.inkMuted }}>{car}</span>
        <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22, letterSpacing: "-0.005em", lineHeight: 1 }}>{plate}</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: dark ? "rgba(255,255,255,0.5)" : SOS_TOKENS.inkMuted, marginTop: 4 }}>
          до {expiry}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{
          appearance: "none", border: "none", cursor: "pointer", flex: 1,
          height: 38, borderRadius: 999, background: dark ? "#fff" : SOS_TOKENS.inkDark, color: dark ? SOS_TOKENS.inkDark : "#fff",
          fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, letterSpacing: "-0.005em",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm9-2h3v3h-3v-3zm5 0h2v2h-2v-2zm-5 5h2v2h-2v-2zm3 0h2v2h-2v-2zm2 2h2v2h-2v-2z" /></svg>
          QR
        </button>
        <button style={{
          appearance: "none", border: "none", cursor: "pointer",
          height: 38, padding: "0 14px", borderRadius: 999,
          background: dark ? "rgba(255,255,255,0.06)" : "rgba(20,20,20,0.05)",
          color: dark ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.inkDark,
          fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 13, letterSpacing: "-0.005em",
        }}>···</button>
      </div>
    </div>
  );
}

function PartnerCard({ name, type, rating, reviews, distance, open }) {
  return (
    <div style={{
      flex: "none", width: 168, scrollSnapAlign: "start",
      borderRadius: 28,
      background: "rgba(255,255,255,0.55)",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: "0 1px 0 rgba(255,255,255,0.7) inset",
      padding: 14,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{
        height: 80, borderRadius: 18,
        background: "linear-gradient(135deg, #e8e8e8 0%, #d0d0d0 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", color: SOS_TOKENS.inkSubtle,
        position: "relative", overflow: "hidden",
      }}>
        <PlaceholderBadge style={{ top: 6, left: 6, padding: "3px 8px 3px 6px", fontSize: 9 }} />
        <span style={{ fontFamily: "'Neue Montreal',sans-serif", fontWeight: 500, fontSize: 18 }}>{name[0]}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
          {open && <span style={{ width: 6, height: 6, borderRadius: 999, background: SOS_TOKENS.green, flex: "none" }} />}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMuted }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#f5c850"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" /></svg>
            {rating}
          </span>
          <span>·</span>
          <span>{distance}</span>
        </div>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkSubtle, letterSpacing: "-0.005em" }}>{type}</span>
      </div>
    </div>
  );
}

function ActionTileV2({ icon, label, dark }) {
  return (
    <div style={{
      position: "relative", height: 142, borderRadius: 32,
      background: dark ? SOS_TOKENS.inkDark : "rgba(255,255,255,0.55)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 8,
      boxShadow: dark ? "0 4px 12px rgba(0,0,0,0.12)" : "0 1px 0 rgba(255,255,255,0.6) inset",
      color: dark ? "#fff" : SOS_TOKENS.ink,
    }}>
      <div style={{ width: 40, height: 40, display: "flex", alignItems: "center" }}>{icon}</div>
      <div style={{
        fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 16, lineHeight: 1.18,
        letterSpacing: "-0.01em", whiteSpace: "pre-line", marginTop: "auto",
      }}>{label}</div>
    </div>
  );
}

function QuickIconOSAGO() {
  return <Icon name="file-check" size={32} stroke={1.8} />;
}
function QuickIconKASKO() {
  return <Icon name="shield-check" size={32} stroke={1.8} color={SOS_TOKENS.red} />;
}
function QuickIconInspector() {
  return <Icon name="badge-check" size={32} stroke={1.8} color={SOS_TOKENS.red} />;
}
function QuickIconHistory() {
  return <Icon name="history" size={32} stroke={1.8} color={SOS_TOKENS.red} />;
}

// ═════════════════════════════════════════════════════════════════════════
// HOME (Figma original) — оставлен для сравнения
// ═════════════════════════════════════════════════════════════════════════
function ScreenHome() {
  return (
    <PhoneFrame>
      <TopBar
        leading={<IconButton><IconBurger /></IconButton>}
        center={<GlassPill style={{ height: 48, padding: "0 18px", gap: 8 }}><SosLogo /></GlassPill>}
        trailing={<IconButton badge><IconBell /></IconButton>}
      />

      <div style={{ position: "absolute", left: 40, top: 130, right: 40, height: 220,
        background: `url(assets/hero-image.png) center / contain no-repeat` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, height: 200,
        background: "linear-gradient(to bottom, rgba(237,237,237,0) 0%, rgba(237,237,237,0.7) 35%, rgba(237,237,237,1) 60%)",
        pointerEvents: "none" }} />

      <div style={{ position: "absolute", left: 24, right: 24, top: 360, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: SOS_TOKENS.inkDark, borderRadius: 36, padding: "20px 24px 24px", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 16, color: SOS_TOKENS.inkMutedDark }}>Chevrolet Cobalt</span>
            <StatusChip tone="green" label="КАСКО Активен" meta="до 11.05.2027" />
          </div>
          <div style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22, letterSpacing: "-0.01em", color: SOS_TOKENS.inkMutedDark }}>
            AB 1234567 · 01 A 123 BB
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <WhiteButton icon={<IconQR />} style={{ flex: 1, justifyContent: "center" }}>Показать QR</WhiteButton>
            <GhostButton>Подробнее</GhostButton>
          </div>
        </div>

        <button style={{
          appearance: "none", border: "none", cursor: "pointer",
          background: SOS_TOKENS.red, borderRadius: 999, padding: "20px 24px",
          display: "flex", alignItems: "center", gap: 12, textAlign: "left",
          color: "#fff", boxShadow: "0 16px 32px -16px rgba(230,20,40,0.55)",
        }}>
          <span style={{
            width: 48, height: 48, borderRadius: 999, background: "#fff", color: SOS_TOKENS.red,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 26, flex: "none",
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          }}>!</span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 20, letterSpacing: "-0.01em" }}>SOS — экстренная помощь</span>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: SOS_TOKENS.inkMutedDark, letterSpacing: "-0.005em" }}>ДТП, мед. помощь, угон — поможем разобраться</span>
          </span>
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <ActionTile dark icon={<IconFingerprintRed />} label={"Вызвать\nинспектора"} />
          <ActionTile icon={<IconFolderRed />} label={"Купить\nполис"} />
          <ActionTile icon={<IconHistory />} label={"История\nполисов"} />
          <ActionTile icon={<IconClaim />} label={"Мои\nзаявки"} />
        </div>
      </div>

      <BottomTabBar active={0} />
    </PhoneFrame>
  );
}

function StatusChip({ label, meta, tone = "green" }) {
  const bg = tone === "green"
    ? "linear-gradient(90deg, rgba(52,211,153,0.6) 0%, rgb(105,228,183) 100%)"
    : "linear-gradient(90deg, rgba(255,255,255,0.6) 0%, #fff 100%)";
  return (
    <div style={{
      borderRadius: 100, background: bg, padding: "6px 14px",
      display: "inline-flex", gap: 6, alignItems: "center",
      fontFamily: "'Manrope',sans-serif", fontSize: 11,
    }}>
      <span style={{ color: "#fff", letterSpacing: "-0.005em" }}>{label}</span>
      <span style={{ color: SOS_TOKENS.inkDark, letterSpacing: "-0.005em" }}>{meta}</span>
    </div>
  );
}

function IconQR({ size = 16 }) {
  return <Icon name="qr-code" size={size} />;
}

function ActionTile({ icon, label, dark }) {
  return (
    <div style={{
      position: "relative", height: 142, borderRadius: 36,
      background: dark ? SOS_TOKENS.inkDark : "rgba(255,255,255,0.55)",
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8,
      boxShadow: dark ? "0 4px 12px rgba(0,0,0,0.12)" : "0 1px 0 rgba(255,255,255,0.6) inset",
      color: dark ? "#fff" : SOS_TOKENS.ink,
    }}>
      <div style={{ width: 44, height: 44, display: "flex", alignItems: "center" }}>{icon}</div>
      <div style={{
        fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 17, lineHeight: 1.18,
        letterSpacing: "-0.01em", whiteSpace: "pre-line", marginTop: "auto",
      }}>{label}</div>
    </div>
  );
}

function IconFingerprintRed() {
  return <Icon name="fingerprint" size={36} stroke={1.8} color={SOS_TOKENS.red} />;
}
function IconFolderRed() {
  return <Icon name="folder" size={36} stroke={1.8} color={SOS_TOKENS.red} />;
}
function IconHistory() {
  return <Icon name="history" size={36} stroke={1.8} />;
}
function IconClaim() {
  return <Icon name="file-text" size={36} stroke={1.8} />;
}

// ═════════════════════════════════════════════════════════════════════════
// Placeholder — awaiting design
// ═════════════════════════════════════════════════════════════════════════
function ScreenPlaceholder({ label, hint, module }) {
  return (
    <PhoneFrame>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 14, padding: 40, textAlign: "center",
      }}>
        {module && (
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "rgba(20,20,20,0.4)", letterSpacing: "0.06em" }}>
            {module}
          </span>
        )}
        <div style={{
          width: 56, height: 56, borderRadius: 999, background: "rgba(20,20,20,0.04)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Neue Montreal',sans-serif", fontSize: 22, color: "rgba(20,20,20,0.45)",
        }}>•</div>
        <div style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22, color: SOS_TOKENS.ink, letterSpacing: "-0.01em" }}>
          {label}
        </div>
        {hint && (
          <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, lineHeight: 1.5, color: SOS_TOKENS.inkMuted, maxWidth: 280, textWrap: "pretty" }}>
            {hint}
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, {
  IllusPlaceholder, PlaceholderBadge,
  ScreenSplash,
  ScreenOnboarding1, ScreenOnboarding2, ScreenOnboarding3,
  ScreenAuthChoose,
  ScreenPhone, ScreenOTP, ScreenProfileSetup,
  ScreenHome, ScreenHomeV2, HOME_HEIGHT,
  ScreenPlaceholder,
});
