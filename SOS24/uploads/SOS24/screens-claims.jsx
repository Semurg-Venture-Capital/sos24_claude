// SOS24 — Block 7: M9 Урегулирование + M10 Трекер выплат (6 экранов)

// ═════════════════════════════════════════════════════════════════════════
// M9.1 — Старт: произошло ДТП?
// ═════════════════════════════════════════════════════════════════════════
const DTP_START_HEIGHT = 1020;

function ScreenDtpStart() {
  return (
    <FormScreen height={DTP_START_HEIGHT}>
      <div style={{ position: "absolute", top: 124, left: 24, right: 24 }}>
        <ScreenHeading title={<>Произошло ДТП?</>} subtitle="Мы поможем — оформим всё прямо в приложении" />
      </div>

      {/* Steps instruction */}
      <div style={{ position: "absolute", top: 240, left: 24, right: 24, padding: "16px 18px", borderRadius: 24,
        background: SOS_TOKENS.glass, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: SOS_TOKENS.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Что сделать прямо сейчас
        </span>
        <Step num="1" text="Убедитесь, что все в безопасности" />
        <Step num="2" text="Зафиксируйте обстоятельства, не уезжая" />
        <Step num="3" text="Выберите формат оформления ниже" />
      </div>

      {/* Two big cards */}
      <div style={{ position: "absolute", top: 470, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <DtpChoiceCard
          tone="light"
          eyebrow="без пострадавших"
          name="Электронный европротокол"
          desc="Если оба водителя согласны и нет пострадавших"
          cta="Оформить"
          icon={<EProtokolIcon />}
        />
        <DtpChoiceCard
          tone="dark"
          eyebrow="онлайн · ~20 мин"
          name="Вызвать инспектора"
          desc="Наш специалист приедет на место и поможет"
          cta="Вызвать"
          status="Доступен сейчас"
          icon={<InspectorIcon />}
        />

        <TextLink color={SOS_TOKENS.inkSubtle} style={{ alignSelf: "center", marginTop: 4 }}>
          Подать обычное заявление
        </TextLink>
      </div>
    </FormScreen>
  );
}

function Step({ num, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{
        width: 24, height: 24, borderRadius: 999, background: SOS_TOKENS.inkDark, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Neue Montreal',sans-serif", fontWeight: 500, fontSize: 12, flex: "none",
      }}>{num}</span>
      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>{text}</span>
    </div>
  );
}

function DtpChoiceCard({ tone, eyebrow, name, desc, cta, status, icon }) {
  const dark = tone === "dark";
  return (
    <div style={{
      padding: "20px 22px", borderRadius: 32,
      background: dark ? SOS_TOKENS.inkDark : "rgba(255,255,255,0.6)",
      backdropFilter: dark ? "none" : "blur(8px)", WebkitBackdropFilter: dark ? "none" : "blur(8px)",
      color: dark ? "#fff" : SOS_TOKENS.ink,
      display: "flex", flexDirection: "column", gap: 16,
      boxShadow: dark ? "0 16px 32px -20px rgba(0,0,0,0.32)" : "0 1px 0 rgba(255,255,255,0.7) inset",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: dark ? "rgba(255,255,255,0.55)" : SOS_TOKENS.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {eyebrow}
          </span>
          <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
            {name}
          </span>
        </div>
        <span style={{
          width: 56, height: 56, borderRadius: 999,
          background: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)",
          color: dark ? "#fff" : SOS_TOKENS.red,
          display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
        }}>{icon}</span>
      </div>
      <p style={{ margin: 0, fontFamily: "'Manrope',sans-serif", fontSize: 14, color: dark ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.inkMuted, lineHeight: 1.45 }}>
        {desc}
      </p>
      {status && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: SOS_TOKENS.green, boxShadow: `0 0 8px ${SOS_TOKENS.greenSoft}` }} />
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: dark ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.inkMuted, fontWeight: 500 }}>
            {status}
          </span>
        </div>
      )}
      <button style={{
        appearance: "none", border: "none", cursor: "pointer",
        height: 56, borderRadius: 999, padding: "0 22px",
        background: SOS_TOKENS.red, color: "#fff",
        fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "-0.005em",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
        marginTop: "auto", boxShadow: "0 16px 32px -16px rgba(230,20,40,0.5)",
      }}>
        {cta}
        <svg width="7" height="10" viewBox="0 0 7 10" fill="currentColor"><path d="M.833 0L0 .833 4.167 5 0 9.167.833 10l5-5z" /></svg>
      </button>
    </div>
  );
}

function EProtokolIcon() {
  return <Icon name="file-check" size={28} />;
}

function InspectorIcon() {
  return <Icon name="headphones" size={28} />;
}

// ═════════════════════════════════════════════════════════════════════════
// M9.2 — Вызов инспектора (карта + ожидание)
// ═════════════════════════════════════════════════════════════════════════
function ScreenInspectorWait() {
  return (
    <PhoneFrame>
      {/* Full-bleed map */}
      <FakeMap />

      {/* Top: close button */}
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", justifyContent: "space-between", zIndex: 5 }}>
        <BackButton />
        <IconButton>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="23" />
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12l3 3 5-6" />
          </svg>
        </IconButton>
      </div>

      {/* Center pulsating marker */}
      <div style={{ position: "absolute", top: 280, left: "50%", transform: "translateX(-50%)", zIndex: 4 }}>
        <PulsingMarker />
      </div>

      {/* Bottom sheet — inspector info */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderRadius: "32px 32px 0 0",
        padding: "20px 24px 32px",
        display: "flex", flexDirection: "column", gap: 16,
        boxShadow: "0 -16px 40px -20px rgba(0,0,0,0.18)",
      }}>
        {/* Handle */}
        <span style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 999, background: "rgba(20,20,20,0.18)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: SOS_TOKENS.green, boxShadow: `0 0 10px ${SOS_TOKENS.green}` }} />
          <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, color: SOS_TOKENS.green, letterSpacing: "0.02em" }}>КОМИССАР В ПУТИ</span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 38, letterSpacing: "-0.02em", lineHeight: 1, color: SOS_TOKENS.ink }}>
            ~12
          </span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 16, color: SOS_TOKENS.inkMuted }}>минут</span>
        </div>

        {/* Inspector card */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
          borderRadius: 22, background: SOS_TOKENS.inkDark, color: "#fff",
        }}>
          <Avatar size={48} initials="РМ" tone="light" />
          <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: "-0.005em" }}>
              Рустам Мирзаев
            </span>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMutedDark }}>
              Аварийный инспектор · № A-0421
            </span>
          </span>
          <button style={{
            appearance: "none", border: "none", cursor: "pointer",
            width: 40, height: 40, borderRadius: 999,
            background: SOS_TOKENS.green, color: "#0a3a26",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 20px -8px rgba(105,228,183,0.6)",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 18.3c-1.4 1.4-3.6 1.6-5.2.4l-2-1.5c-.6-.5-1.5-.5-2 0l-3.7 3-3.7-3c-.5-.5-.6-1.3-.2-1.9l1.5-2c1.2-1.6 1-3.8-.4-5.2L4 6c-1.2-1.2-1.2-3.1 0-4.3.4-.5 1.1-.7 1.7-.7H8c.7 0 1.4.4 1.7 1l1.1 2c.5.9.4 2-.4 2.7L9 8.1c1 2 2.6 3.6 4.6 4.6l1.4-1.4c.7-.7 1.8-.9 2.7-.4l2 1.1c.6.3 1 1 1 1.7v2.3c0 .6-.2 1.3-.7 1.7l-.4.6z" /></svg>
          </button>
        </div>

        {/* Order info row */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMuted, letterSpacing: "0.04em", textTransform: "uppercase" }}>№ заявки</span>
            <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontSize: 14, color: SOS_TOKENS.inkDark, fontWeight: 500 }}>SOS-24-08412</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMuted, letterSpacing: "0.04em", textTransform: "uppercase" }}>Адрес</span>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.inkDark, fontWeight: 500 }}>ул. Амира Темура, 14</span>
          </div>
        </div>

        <OutlineButton style={{ width: "100%", height: 52 }} tone="red">Отменить вызов</OutlineButton>
      </div>
    </PhoneFrame>
  );
}

function FakeMap() {
  return (
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #e2e5e1 0%, #dcdfdb 100%)" }}>
      {/* Roads */}
      <svg width="100%" height="100%" viewBox="0 0 390 844" style={{ position: "absolute", inset: 0 }} preserveAspectRatio="none">
        {/* Horizontal main road */}
        <path d="M-20 320 Q160 280 200 340 T420 360" stroke="rgba(20,20,20,0.1)" strokeWidth="32" fill="none" strokeLinecap="round" />
        <path d="M-20 320 Q160 280 200 340 T420 360" stroke="#f4f4f4" strokeWidth="24" fill="none" strokeLinecap="round" />
        {/* Vertical road */}
        <path d="M120 -20 L160 240 L140 480 L180 720 L200 900" stroke="rgba(20,20,20,0.08)" strokeWidth="22" fill="none" strokeLinecap="round" />
        <path d="M120 -20 L160 240 L140 480 L180 720 L200 900" stroke="#ececec" strokeWidth="16" fill="none" strokeLinecap="round" />
        {/* Side branch */}
        <path d="M260 60 Q280 200 320 280 L380 380" stroke="rgba(20,20,20,0.06)" strokeWidth="16" fill="none" strokeLinecap="round" />
        <path d="M260 60 Q280 200 320 280 L380 380" stroke="#ececec" strokeWidth="11" fill="none" strokeLinecap="round" />
        {/* Building blocks */}
        <rect x="30" y="120" width="60" height="80" rx="6" fill="rgba(20,20,20,0.04)" />
        <rect x="240" y="120" width="40" height="50" rx="4" fill="rgba(20,20,20,0.04)" />
        <rect x="30" y="500" width="80" height="50" rx="6" fill="rgba(20,20,20,0.04)" />
        <rect x="250" y="500" width="60" height="100" rx="6" fill="rgba(20,20,20,0.04)" />
        <rect x="20" y="700" width="50" height="60" rx="5" fill="rgba(20,20,20,0.04)" />
      </svg>
      {/* Path from inspector to user */}
      <svg width="100%" height="100%" viewBox="0 0 390 844" style={{ position: "absolute", inset: 0 }} preserveAspectRatio="none">
        <path d="M60 130 Q120 240 160 320" stroke={SOS_TOKENS.red} strokeWidth="3" strokeDasharray="6 6" fill="none" strokeLinecap="round" />
      </svg>
      {/* Inspector marker */}
      <div style={{ position: "absolute", left: 50, top: 110 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 999, background: "#fff",
          boxShadow: "0 8px 20px -6px rgba(0,0,0,0.25), 0 0 0 3px rgba(230,20,40,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: SOS_TOKENS.red,
        }}>
          <svg width="18" height="18" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12c2-3 5.5-4 10-4s8 1 10 4" />
            <path d="M6 13h24" />
            <circle cx="18" cy="19" r="3" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function PulsingMarker() {
  return (
    <div style={{ position: "relative", width: 64, height: 64 }}>
      <span style={{
        position: "absolute", inset: 0, borderRadius: 999, background: SOS_TOKENS.red,
        animation: "sosRing 1.8s ease-out infinite", opacity: 0.4,
      }} />
      <span style={{
        position: "absolute", inset: 10, borderRadius: 999, background: SOS_TOKENS.red,
        animation: "sosRing 1.8s ease-out infinite", animationDelay: "0.4s", opacity: 0.5,
      }} />
      <div style={{
        position: "absolute", inset: 18, borderRadius: 999, background: SOS_TOKENS.red,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 10px 24px -8px rgba(230,20,40,0.55)",
      }}>
        <SosMark size={14} color="#fff" />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M9.3a — Европротокол · Шаг 1 (обстоятельства)
// ═════════════════════════════════════════════════════════════════════════
const EP_STEP_HEIGHT = 1080;

function ScreenEpStep1() {
  return (
    <FormScreen height={EP_STEP_HEIGHT} stepper={<StepperBar current={1} total={5} />}>
      <div style={{ position: "absolute", top: 130, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 20, bottom: 130 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: SOS_TOKENS.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Шаг 1 из 5 · Обстоятельства
        </span>
        <ScreenHeading title="Когда и где" subtitle="Зафиксируем место и время происшествия" />

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <TextInput label="Дата" value="14.05.2026" />
            <TextInput label="Время" value="11:42" />
          </div>
          <TextInput label="Место ДТП" value="ул. Амира Темура, 14" suffix={<MapPinIcon />} />
          <TextInput label="Кол-во ТС" value="2" suffix={<Tag tone="green" style={{ fontSize: 10 }}>европротокол</Tag>} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
            Есть пострадавшие?
          </span>
          <Segmented options={["Нет, только машины", "Есть пострадавшие"]} active={0} />
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkSubtle, lineHeight: 1.45, paddingLeft: 4 }}>
            Если есть пострадавшие — необходимо вызвать инспектора
          </span>
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px",
        background: "linear-gradient(to top, rgba(237,237,237,0.95) 60%, rgba(237,237,237,0))",
      }}>
        <RedButton style={{ width: "100%" }}>Далее</RedButton>
      </div>
    </FormScreen>
  );
}

function MapPinIcon() {
  return <Icon name="map-pin" size={18} color={SOS_TOKENS.inkMuted} />;
}

// ═════════════════════════════════════════════════════════════════════════
// M9.3b — Европротокол · Шаг 4 (схема + фото)
// ═════════════════════════════════════════════════════════════════════════
function ScreenEpStep4() {
  return (
    <FormScreen height={EP_STEP_HEIGHT} stepper={<StepperBar current={4} total={5} />}>
      <div style={{ position: "absolute", top: 130, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 20, bottom: 130 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: SOS_TOKENS.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Шаг 4 из 5 · Фотофиксация
        </span>
        <ScreenHeading title="Сфотографируйте место" subtitle="Минимум 3 ракурса для оформления" />

        {/* Live camera capture — anti-fraud, no gallery */}
        <div style={{
          padding: "12px 14px", borderRadius: 16,
          background: "rgba(230,20,40,0.08)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ width: 24, height: 24, borderRadius: 999, background: SOS_TOKENS.red, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <Icon name="alert-triangle" size={12} />
          </span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.red, fontWeight: 600, lineHeight: 1.4 }}>
            Только съёмка с камеры. Загрузка из галереи отключена.
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <CaptureTile filled label="Общий план" required />
          <CaptureTile filled label="Моё авто" required />
          <CaptureTile label="Второе авто" required />
          <CaptureTile label="Видео места" video />
        </div>

        {/* Scheme picker */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
            Схема столкновения
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <SchemeOption selected>
              <SchemeRear />
            </SchemeOption>
            <SchemeOption>
              <SchemeFront />
            </SchemeOption>
            <SchemeOption>
              <SchemeSide />
            </SchemeOption>
          </div>
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px",
        background: "linear-gradient(to top, rgba(237,237,237,0.95) 60%, rgba(237,237,237,0))",
      }}>
        <RedButton style={{ width: "100%" }}>К подписанию</RedButton>
      </div>
    </FormScreen>
  );
}

function CaptureTile({ label, filled, required, video }) {
  return (
    <div style={{
      position: "relative",
      borderRadius: 22, overflow: "hidden",
      background: filled
        ? "linear-gradient(135deg, #2a2a2a 0%, #555 100%)"
        : "transparent",
      border: filled ? "none" : "1.5px dashed rgba(20,20,20,0.18)",
      padding: 14, height: 130,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 8, color: filled ? "rgba(255,255,255,0.92)" : SOS_TOKENS.inkSubtle,
    }}>
      {filled && (
        <>
          <span style={{
            position: "absolute", top: 8, left: 8,
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px 3px 6px", borderRadius: 999,
            background: "rgba(20,20,20,0.6)", color: "#fff",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 500, letterSpacing: "0.04em",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: SOS_TOKENS.red }} />
            ЗАСНЯТО
          </span>
          {/* Tiny clock badge */}
          <span style={{
            position: "absolute", top: 8, right: 8,
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 999,
            background: "rgba(20,20,20,0.6)", color: "#fff",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 500,
          }}>11:42</span>
        </>
      )}
      {!filled && (
        <>
          <span style={{
            width: 42, height: 42, borderRadius: 999,
            background: "rgba(230,20,40,0.1)", color: SOS_TOKENS.red,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={video ? "image" : "camera"} size={20} />
          </span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 600, textAlign: "center", color: SOS_TOKENS.inkDark, letterSpacing: "-0.005em" }}>
            {video ? "Снять видео" : "Сфотографировать"}
          </span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 10, color: SOS_TOKENS.inkMuted }}>
            {label} {required && "· обязательно"}
          </span>
        </>
      )}
    </div>
  );
}

function SchemeOption({ selected, children }) {
  return (
    <div style={{
      aspectRatio: "1 / 1", borderRadius: 16, padding: 10,
      background: selected ? SOS_TOKENS.inkDark : SOS_TOKENS.glass,
      backdropFilter: selected ? "none" : "blur(8px)", WebkitBackdropFilter: selected ? "none" : "blur(8px)",
      boxShadow: selected ? "0 12px 24px -16px rgba(0,0,0,0.3)" : `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: selected ? "#fff" : SOS_TOKENS.inkDark,
    }}>
      {children}
    </div>
  );
}

// Mini scheme illustrations
function SchemeRear() {
  // Two cars, one rear-ending the other
  return (
    <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="14" width="22" height="14" rx="3" />
      <rect x="32" y="14" width="22" height="14" rx="3" />
      <path d="M28 21l4 0M30 18l-2 3 2 3" stroke={SOS_TOKENS.red} strokeWidth="2" />
    </svg>
  );
}
function SchemeFront() {
  return (
    <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="14" width="22" height="14" rx="3" />
      <rect x="32" y="14" width="22" height="14" rx="3" />
      <path d="M28 21l4 0" stroke={SOS_TOKENS.red} strokeWidth="2.5" />
    </svg>
  );
}
function SchemeSide() {
  return (
    <svg width="60" height="40" viewBox="0 0 60 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="20" y="2" width="20" height="14" rx="3" />
      <rect x="20" y="24" width="20" height="14" rx="3" />
      <path d="M30 18l0 4" stroke={SOS_TOKENS.red} strokeWidth="2.5" />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M10.1 — Список заявлений
// ═════════════════════════════════════════════════════════════════════════
const CLAIMS_LIST_HEIGHT = 960;

function ScreenClaimsList() {
  return (
    <PhoneFrame height={CLAIMS_LIST_HEIGHT}>
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3 }}>
        <h1 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 26, letterSpacing: "-0.01em", color: SOS_TOKENS.ink, lineHeight: 1 }}>
          Заявления
        </h1>
        <IconButton>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
        </IconButton>
      </div>

      {/* Tabs */}
      <div style={{ position: "absolute", top: 120, left: 24, right: 24 }}>
        <Segmented options={["Активные · 3", "Архив"]} active={0} />
      </div>

      {/* List */}
      <div style={{ position: "absolute", top: 184, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <ClaimCard
          id="CLM-24-00412"
          type="ДТП"
          car="Chevrolet Cobalt"
          plate="01 A 123 BB"
          date="14.05.2026"
          status="review"
          progress={2}
        />
        <ClaimCard
          id="CLM-24-00385"
          type="Угон"
          car="Hyundai Sonata"
          plate="10 R 555 AC"
          date="08.05.2026"
          status="needInfo"
          progress={2}
        />
        <ClaimCard
          id="CLM-24-00362"
          type="ДТП"
          car="Chevrolet Cobalt"
          plate="01 A 123 BB"
          date="22.04.2026"
          status="approved"
          progress={4}
        />
      </div>
    </PhoneFrame>
  );
}

function ClaimCard({ id, type, car, plate, date, status, progress }) {
  const conf = {
    submitted: { tone: "ink",    label: "Подано" },
    review:    { tone: "blue",   label: "На рассмотрении" },
    needInfo:  { tone: "yellow", label: "Требуется информация" },
    approved:  { tone: "green",  label: "Одобрено" },
    rejected:  { tone: "red",    label: "Отклонено" },
    paid:      { tone: "green",  label: "Выплачено" },
  }[status];
  const tonePalette = {
    ink:    { bg: SOS_TOKENS.inkDark, fg: "#fff" },
    blue:   { bg: "rgba(86,140,255,0.85)", fg: "#1a3577" },
    yellow: { bg: "rgba(245,200,80,0.85)", fg: "#503a07" },
    green:  { bg: "rgba(105,228,183,0.85)", fg: "#0a3a26" },
    red:    { bg: "rgba(230,20,40,0.15)", fg: SOS_TOKENS.red },
  }[conf.tone];

  return (
    <div style={{
      padding: "16px 18px", borderRadius: 24,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Tag tone="ink">{type}</Tag>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: SOS_TOKENS.inkMuted }}>{id}</span>
          </div>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>{car}</span>
          <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted, letterSpacing: "0.04em" }}>{plate} · {date}</span>
        </div>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 10px", borderRadius: 999,
          background: tonePalette.bg, color: tonePalette.fg,
          fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}>{conf.label}</span>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", gap: 4 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{
            flex: 1, height: 3, borderRadius: 999,
            background: i < progress ? SOS_TOKENS.inkDark : "rgba(20,20,20,0.1)",
          }} />
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M10.2 — Трекер выплаты (детали заявления)
// ═════════════════════════════════════════════════════════════════════════
const CLAIM_DETAIL_HEIGHT = 1380;

function ScreenClaimDetail() {
  return (
    <PhoneFrame height={CLAIM_DETAIL_HEIGHT}>
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 3 }}>
        <BackButton />
        <Tag tone="ink">CLM-24-00412</Tag>
        <IconButton>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M12 17h.01" />
          </svg>
        </IconButton>
      </div>

      <div style={{ position: "absolute", top: 120, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Status hero card */}
        <div style={{
          padding: "22px 22px 24px", borderRadius: 32,
          background: SOS_TOKENS.inkDark, color: "#fff",
          boxShadow: "0 24px 48px -28px rgba(0,0,0,0.35)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Tag tone="glass" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>ДТП · Европротокол</Tag>
            <Tag tone="green">На рассмотрении</Tag>
          </div>
          <h2 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 24, letterSpacing: "-0.01em", lineHeight: 1.15 }}>
            Решение ожидается<br />до 20 мая 2026
          </h2>
          <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 16, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: SOS_TOKENS.green, boxShadow: `0 0 8px ${SOS_TOKENS.green}` }} />
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.inkMutedDark }}>
              SLA: 5 рабочих дней с момента подачи
            </span>
          </div>
        </div>

        {/* Vertical tracker */}
        <div style={{
          padding: "20px 22px", borderRadius: 28,
          background: SOS_TOKENS.glass,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
          display: "flex", flexDirection: "column", gap: 0,
        }}>
          <TrackerStep status="done"    title="Заявление подано"   date="14.05.2026 · 12:14" />
          <TrackerStep status="done"    title="Принято в работу"   date="14.05.2026 · 13:02" />
          <TrackerStep status="active"  title="На рассмотрении"    date="оценка ущерба" />
          <TrackerStep status="pending" title="Решение принято"    date="ожидается" />
          <TrackerStep status="pending" title="Выплата произведена" date="ожидается" last />
        </div>

        {/* Case details */}
        <SummaryBlock
          eyebrow="Детали случая"
          rows={[
            { label: "Тип",        value: "ДТП · европротокол" },
            { label: "Дата",       value: "14.05.2026 · 11:42" },
            { label: "Автомобиль", value: "Chevrolet Cobalt" },
            { label: "Полис",      value: "ОСАГО · 12 245 582" },
          ]}
        />

        {/* Action button */}
        <OutlineButton style={{ width: "100%", height: 56 }}>
          <ChatIcon /> Связаться с оператором
        </OutlineButton>
      </div>
    </PhoneFrame>
  );
}

function TrackerStep({ status, title, date, last }) {
  // status: done / active / pending
  const dotColor = status === "done"
    ? SOS_TOKENS.inkDark
    : status === "active"
      ? SOS_TOKENS.red
      : "rgba(20,20,20,0.18)";
  const titleColor = status === "pending" ? SOS_TOKENS.inkMuted : SOS_TOKENS.inkDark;
  return (
    <div style={{ display: "flex", gap: 14, paddingBottom: last ? 0 : 14 }}>
      {/* Dot + line */}
      <div style={{ position: "relative", width: 14, flex: "none", display: "flex", justifyContent: "center" }}>
        <span style={{
          width: 14, height: 14, borderRadius: 999, background: dotColor,
          marginTop: 4, zIndex: 1,
          boxShadow: status === "active" ? `0 0 0 4px rgba(230,20,40,0.18)` : "none",
        }}>
          {status === "done" && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
              <path d="M3 7l3 3 5-6" />
            </svg>
          )}
        </span>
        {!last && (
          <span style={{
            position: "absolute", top: 22, bottom: -4, left: "50%", transform: "translateX(-50%)",
            width: 2, background: status === "done" ? SOS_TOKENS.inkDark : "rgba(20,20,20,0.12)",
          }} />
        )}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: titleColor, letterSpacing: "-0.005em" }}>
          {title}
        </span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
          {date}
        </span>
      </div>
    </div>
  );
}

Object.assign(window, {
  ScreenDtpStart, ScreenInspectorWait,
  ScreenEpStep1, ScreenEpStep4,
  ScreenClaimsList, ScreenClaimDetail,
  DTP_START_HEIGHT, EP_STEP_HEIGHT, CLAIMS_LIST_HEIGHT, CLAIM_DETAIL_HEIGHT,
});
