// SOS24 — Block 6: M2 Профиль + M3 Гараж (5 экранов)

// ─────────────────────────────────────────────────────────────────────────
// Shared primitives — Avatar, photo-upload tile, status badge
// ─────────────────────────────────────────────────────────────────────────
function Avatar({ size = 64, initials, tone = "light" }) {
  const dark = tone === "dark";
  return (
    <span style={{
      width: size, height: size, borderRadius: 999,
      background: dark
        ? "linear-gradient(135deg, #2a2a2a 0%, #121212 100%)"
        : "linear-gradient(135deg, #ffffff 0%, #d6d6d6 100%)",
      color: dark ? "#fff" : SOS_TOKENS.inkDark,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500,
      fontSize: size * 0.36, letterSpacing: "-0.01em",
      boxShadow: dark
        ? "0 12px 28px -16px rgba(0,0,0,0.5)"
        : "0 0 0 1px rgba(20,20,20,0.06), 0 12px 28px -20px rgba(0,0,0,0.18)",
      flex: "none",
    }}>{initials}</span>
  );
}

function PhotoUploadTile({ label, hint, filled, side = "front" }) {
  return (
    <div style={{
      position: "relative",
      borderRadius: 22,
      background: filled ? "linear-gradient(135deg, #dcdcdc 0%, #b8b8b8 100%)" : "transparent",
      border: filled ? "none" : `1.5px dashed rgba(20,20,20,0.18)`,
      padding: 16,
      height: 130,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 8,
      color: filled ? "rgba(255,255,255,0.92)" : SOS_TOKENS.inkSubtle,
      overflow: "hidden",
    }}>
      {filled && <PlaceholderBadge style={{ top: 8, left: 8, padding: "3px 8px 3px 6px", fontSize: 9 }} />}
      {filled ? (
        <>
          {/* Mock passport face */}
          <div style={{ width: 32, height: 32, borderRadius: 999, background: "rgba(255,255,255,0.5)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "70%", alignItems: "center" }}>
            <span style={{ height: 4, width: "60%", borderRadius: 999, background: "rgba(255,255,255,0.7)" }} />
            <span style={{ height: 3, width: "80%", borderRadius: 999, background: "rgba(255,255,255,0.5)" }} />
            <span style={{ height: 3, width: "40%", borderRadius: 999, background: "rgba(255,255,255,0.5)" }} />
          </div>
        </>
      ) : (
        <>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <circle cx="12" cy="12" r="3.5" />
            <path d="M7 5l1.5-2h7L17 5" />
          </svg>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 500, textAlign: "center", lineHeight: 1.3 }}>
            {label}
            <br />
            <span style={{ color: "rgba(20,20,20,0.45)", fontWeight: 400 }}>{hint}</span>
          </span>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  // status: pending | verified | rejected
  const conf = {
    pending:  { bg: "rgba(245,200,80,0.85)", fg: "#503a07", label: "На проверке",  dot: "#f5c850" },
    verified: { bg: "rgba(105,228,183,0.85)", fg: "#0a3a26", label: "Подтверждён", dot: SOS_TOKENS.green },
    rejected: { bg: "rgba(230,20,40,0.12)",   fg: SOS_TOKENS.red, label: "Отклонён",     dot: SOS_TOKENS.red },
  }[status] || { bg: "rgba(20,20,20,0.06)", fg: SOS_TOKENS.inkSubtle, label: "Не добавлен", dot: "rgba(20,20,20,0.32)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 10px 5px 8px", borderRadius: 999,
      background: conf.bg, color: conf.fg,
      fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: "0.02em",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: conf.dot }} />
      {conf.label}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M2.1 — Профиль (главный)
// ═════════════════════════════════════════════════════════════════════════
const PROFILE_HEIGHT = 1280;

function ScreenProfile() {
  return (
    <PhoneFrame height={PROFILE_HEIGHT}>
      {/* Top — title + edit (text link) */}
      <div style={{
        position: "absolute", top: 56, left: 24, right: 24, zIndex: 3,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <h1 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 26, letterSpacing: "-0.01em", color: SOS_TOKENS.ink, lineHeight: 1 }}>
          Профиль
        </h1>
        <GlassPill style={{ height: 40, padding: "0 14px", gap: 6, fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkDark, cursor: "pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
          </svg>
          <span style={{ fontFamily: "'Manrope',sans-serif" }}>Редактировать</span>
        </GlassPill>
      </div>

      {/* User header card */}
      <div style={{ position: "absolute", top: 120, left: 24, right: 24 }}>
        <div style={{
          padding: "22px 22px 24px", borderRadius: 32,
          background: SOS_TOKENS.inkDark, color: "#fff",
          display: "flex", alignItems: "center", gap: 16,
          boxShadow: "0 24px 48px -28px rgba(0,0,0,0.35)",
        }}>
          <Avatar size={64} initials="АК" tone="light" />
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 20, letterSpacing: "-0.005em", lineHeight: 1.1 }}>
              Азиз Каримов
            </span>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.inkMutedDark, letterSpacing: "-0.005em" }}>
              +998 90 123-45-67
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6 }}>
              <Tag tone="green">Верифицирован</Tag>
            </span>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div style={{ position: "absolute", top: 290, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 22 }}>
        <ProfileSection title="Мои документы">
          <ProfileRow
            icon={<DocIcon />}
            title="Паспорт"
            meta="AB 1234567"
            trailing={<StatusBadge status="verified" />}
          />
          <ProfileRow
            icon={<LicenseIcon />}
            title="Водительское удостоверение"
            meta="AC 2345678 · стаж 8 лет"
            trailing={<StatusBadge status="pending" />}
          />
        </ProfileSection>

        <ProfileSection title="Настройки">
          <ProfileRow
            icon={<GlobeIcon />}
            title="Язык интерфейса"
            value="Русский"
          />
          <ProfileRow
            icon={<ThemeIcon />}
            title="Тема"
            value="Системная"
          />
          <ProfileRow
            icon={<BellIcon />}
            title="Уведомления"
            trailing={<Toggle on />}
          />
          <ProfileRow
            icon={<LockIcon />}
            title="Безопасность"
            meta="Face ID, PIN"
          />
        </ProfileSection>

        <ProfileSection title="Помощь">
          <ProfileRow icon={<ChatIcon />} title="Поддержка" meta="Ответим за 5 минут" />
          <ProfileRow icon={<QuestionIcon />} title="Частые вопросы" />
          <ProfileRow icon={<InfoIcon />} title="О приложении" value="v 1.2.4" />
          <ProfileRow icon={<DocsIcon />} title="Оферта и политика" />
        </ProfileSection>

        {/* Logout — destructive */}
        <button style={{
          appearance: "none", border: "none", cursor: "pointer",
          height: 56, borderRadius: 999,
          background: "rgba(230,20,40,0.08)", color: SOS_TOKENS.red,
          fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: "-0.005em",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
          marginTop: 4,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          </svg>
          Выйти из аккаунта
        </button>
      </div>

      <BottomTabBar active={3} />
    </PhoneFrame>
  );
}

function ProfileSection({ title, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{
        fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600,
        color: SOS_TOKENS.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase",
        paddingLeft: 4,
      }}>{title}</span>
      <div style={{
        borderRadius: 22, overflow: "hidden",
        background: SOS_TOKENS.glass,
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
        display: "flex", flexDirection: "column",
      }}>
        {children}
      </div>
    </div>
  );
}

function ProfileRow({ icon, title, meta, value, trailing }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 18px",
      borderBottom: `1px solid ${SOS_TOKENS.hairline}`,
    }}>
      {icon && (
        <span style={{
          width: 36, height: 36, borderRadius: 999,
          background: "rgba(255,255,255,0.7)", color: SOS_TOKENS.inkDark,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flex: "none",
          boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
        }}>{icon}</span>
      )}
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{
          fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 15, color: SOS_TOKENS.inkDark,
          letterSpacing: "-0.005em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{title}</span>
        {meta && (
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {meta}
          </span>
        )}
      </span>
      {value && (
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: SOS_TOKENS.inkMuted, whiteSpace: "nowrap" }}>
          {value}
        </span>
      )}
      {trailing ?? <ChevronRight />}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M2.2 — Редактирование профиля
// ═════════════════════════════════════════════════════════════════════════
const PROFILE_EDIT_HEIGHT = 960;

function ScreenProfileEdit() {
  return (
    <FormScreen height={PROFILE_EDIT_HEIGHT}>
      <div style={{ position: "absolute", top: 56, right: 24, zIndex: 3 }}>
        <TextLink color={SOS_TOKENS.red} style={{ fontWeight: 600 }}>Сохранить</TextLink>
      </div>

      <div style={{ position: "absolute", top: 124, left: 24, right: 24 }}>
        <ScreenHeading title={<>Редактировать<br />профиль</>} />
      </div>

      {/* Avatar with change button */}
      <div style={{
        position: "absolute", top: 250, left: 0, right: 0,
        display: "flex", justifyContent: "center",
      }}>
        <div style={{ position: "relative" }}>
          <Avatar size={88} initials="АК" tone="light" />
          <button style={{
            appearance: "none", border: "none", cursor: "pointer",
            position: "absolute", right: -4, bottom: -4,
            width: 32, height: 32, borderRadius: 999,
            background: SOS_TOKENS.inkDark, color: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 16px -6px rgba(0,0,0,0.4)",
          }}>
            <Icon name="camera" size={14} color="#fff" />
          </button>
        </div>
      </div>

      {/* Form */}
      <div style={{ position: "absolute", top: 380, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 14, bottom: 32 }}>
        <TextInput label="Имя"     value="Азиз" />
        <TextInput label="Фамилия" value="Каримов" />
        <TextInput label="Отчество (необязательно)" placeholder="Не указано" />
        <TextInput label="Дата рождения" value="14.05.1995" suffix={<CalendarIconRow />} />
        <TextInput label="Адрес" value="Ташкент, Юнусабадский р-н" />
      </div>
    </FormScreen>
  );
}

// Profile-row icons (SF Symbols style, thin)
function DocIcon()      { return <Icon name="file-text" size={18} />; }
function LicenseIcon()  { return <Icon name="credit-card" size={18} />; }
function GlobeIcon()    { return <Icon name="globe" size={18} />; }
function ThemeIcon()    { return <Icon name="moon-sun" size={18} />; }
function BellIcon()     { return <Icon name="bell" size={18} />; }
function LockIcon()     { return <Icon name="lock" size={18} />; }
function ChatIcon()     { return <Icon name="message-circle" size={18} />; }
function QuestionIcon() { return <Icon name="help-circle" size={18} />; }
function InfoIcon()     { return <Icon name="info" size={18} />; }
function DocsIcon()     { return <Icon name="files" size={18} />; }

function CalendarIconRow() {
  return <Icon name="calendar" size={20} color={SOS_TOKENS.inkMuted} />;
}

// ═════════════════════════════════════════════════════════════════════════
// M2.3 — Паспорт / ВУ
// ═════════════════════════════════════════════════════════════════════════
const DOC_ADD_HEIGHT = 1100;

function ScreenDocumentAdd() {
  return (
    <FormScreen height={DOC_ADD_HEIGHT}>
      <div style={{ position: "absolute", top: 124, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <ScreenHeading title={<>Паспортные<br />данные</>} subtitle="Нужны для оформления полисов" />

        {/* Status block */}
        <div style={{
          padding: "14px 16px", borderRadius: 20,
          background: "rgba(86,140,255,0.12)",
          display: "flex", alignItems: "flex-start", gap: 12,
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 999, background: SOS_TOKENS.blue, color: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v6M12 7h.01" />
            </svg>
          </span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: "#1a3577", lineHeight: 1.45, letterSpacing: "-0.005em" }}>
            Документы шифруются и используются только для оформления полисов и страховых случаев.
          </span>
        </div>
      </div>

      {/* Form */}
      <div style={{ position: "absolute", top: 380, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 14, bottom: 36 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <TextInput label="Серия" value="AB" />
          </div>
          <div style={{ flex: 2 }}>
            <TextInput label="Номер" value="1234567" />
          </div>
        </div>
        <TextInput label="Дата выдачи" value="22.03.2018" suffix={<CalendarIconRow />} />
        <TextInput label="Кем выдан" value="МВД Юнусабадского р-на" />
        <TextInput label="ПИНФЛ" value="3 1405 9504 5 0123 4" />

        {/* Photo uploads */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
            Фото документа
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <PhotoUploadTile filled label="Передняя сторона" hint="до 5 МБ" />
            <PhotoUploadTile label="Обратная сторона" hint="до 5 МБ" />
          </div>
        </div>

        <RedButton style={{ width: "100%", marginTop: 6 }} trailing={false}>Отправить на проверку</RedButton>
      </div>
    </FormScreen>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M3.1 — Гараж (список)
// ═════════════════════════════════════════════════════════════════════════
const GARAGE_HEIGHT = 1020;

function ScreenGarage() {
  return (
    <PhoneFrame height={GARAGE_HEIGHT}>
      {/* Top */}
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3 }}>
        <h1 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 26, letterSpacing: "-0.01em", color: SOS_TOKENS.ink, lineHeight: 1 }}>
          Гараж
        </h1>
        <IconButton>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 4v12M4 10h12" />
          </svg>
        </IconButton>
      </div>

      <div style={{ position: "absolute", top: 120, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Summary card — total cars, active policies */}
        <div style={{
          padding: "18px 20px", borderRadius: 28,
          background: SOS_TOKENS.inkDark, color: "#fff",
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16,
          boxShadow: "0 16px 32px -20px rgba(0,0,0,0.3)",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMutedDark, letterSpacing: "0.08em", textTransform: "uppercase" }}>В гараже</span>
            <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 28, letterSpacing: "-0.01em", lineHeight: 1 }}>
              2 авто
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMutedDark, letterSpacing: "0.08em", textTransform: "uppercase" }}>Активных полисов</span>
            <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 28, letterSpacing: "-0.01em", lineHeight: 1 }}>
              3
            </span>
          </div>
        </div>

        {/* Car cards */}
        <GarageCarCard
          plate="01 A 123 BB"
          name="Chevrolet Cobalt"
          year="2021 · 1.5 л · Белый"
          policies={[
            { type: "ОСАГО", days: 365, tone: "green" },
            { type: "КАСКО", days: 365, tone: "green" },
          ]}
        />
        <GarageCarCard
          plate="10 R 555 AC"
          name="Hyundai Sonata"
          year="2019 · 2.0 л · Серый"
          policies={[
            { type: "ОСАГО", days: 43, tone: "yellow" },
          ]}
        />
        <AddTile height={88}>Добавить автомобиль</AddTile>
      </div>

      <BottomTabBar active={2} />
    </PhoneFrame>
  );
}

function GarageCarCard({ plate, name, year, policies = [] }) {
  return (
    <div style={{
      position: "relative", padding: "18px 20px", borderRadius: 28,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}, 0 1px 0 rgba(255,255,255,0.7) inset`,
      display: "flex", flexDirection: "column", gap: 14,
    }}>
      {/* Top row: car silhouette + name + plate, kebab right */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <span style={{
          width: 48, height: 48, borderRadius: 16,
          background: "linear-gradient(135deg, #ffffff 0%, #d8d8d8 100%)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          flex: "none", color: SOS_TOKENS.inkDark,
          boxShadow: "0 0 0 1px rgba(20,20,20,0.05)",
        }}>
          <svg width="26" height="22" viewBox="0 0 28 22" fill="currentColor">
            <path d="M2 14v-2l3-1 2-5c.4-.9 1.3-1.5 2.3-1.5h9.4c1 0 1.9.6 2.3 1.5l2 5 3 1v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2z" />
            <circle cx="8" cy="16" r="2.5" fill="#fff" />
            <circle cx="20" cy="16" r="2.5" fill="#fff" />
          </svg>
        </span>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>{name}</span>
          <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 20, letterSpacing: "-0.005em", color: SOS_TOKENS.inkDark, lineHeight: 1.1 }}>{plate}</span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkSubtle, marginTop: 2 }}>{year}</span>
        </div>
        <button style={{
          appearance: "none", border: "none", background: "transparent", cursor: "pointer",
          padding: 4, color: SOS_TOKENS.inkMuted,
        }}>
          <svg width="20" height="6" viewBox="0 0 20 6" fill="currentColor">
            <circle cx="3" cy="3" r="1.5" />
            <circle cx="10" cy="3" r="1.5" />
            <circle cx="17" cy="3" r="1.5" />
          </svg>
        </button>
      </div>

      {/* Policy chips */}
      {policies.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {policies.map((p, i) => (
            <Tag key={i} tone={p.tone === "yellow" ? "yellow" : "green"}>
              {p.type} · {p.days} дн.
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M3.2 — Добавление авто
// ═════════════════════════════════════════════════════════════════════════
const CAR_ADD_HEIGHT = 1140;

function ScreenCarAdd() {
  return (
    <FormScreen height={CAR_ADD_HEIGHT}>
      <div style={{ position: "absolute", top: 124, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 18 }}>
        <ScreenHeading title={<>Добавить<br />автомобиль</>} subtitle="Введите гос. номер — данные подтянутся из NAPP" />

        {/* Big plate input */}
        <div style={{
          padding: "20px 22px", borderRadius: 28,
          background: SOS_TOKENS.glass,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
          display: "flex", flexDirection: "column", gap: 10,
        }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: SOS_TOKENS.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Гос. номер
          </span>
          <span style={{
            fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 36,
            letterSpacing: "0.06em", color: SOS_TOKENS.inkDark, lineHeight: 1,
          }}>
            01 A 123 BB
          </span>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.green, fontWeight: 600,
            marginTop: 2,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" />
            </svg>
            Найден в базе NAPP
          </div>
        </div>
      </div>

      {/* Data block */}
      <div style={{ position: "absolute", top: 460, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 14, bottom: 130 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
          Данные автомобиля
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <TextInput label="Марка" value="Chevrolet" />
          <TextInput label="Модель" value="Cobalt" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <TextInput label="Год" value="2021" />
          <TextInput label="Цвет" value="Белый" />
        </div>
        <TextInput label="VIN / номер кузова" value="KL1JD5GE9LB123456" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <TextInput label="Объём, л" value="1.5" />
          <TextInput label="Мощность, л.с." value="105" />
        </div>
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px",
        background: "linear-gradient(to top, rgba(237,237,237,0.95) 60%, rgba(237,237,237,0))",
      }}>
        <RedButton style={{ width: "100%" }}>Сохранить в гараж</RedButton>
      </div>
    </FormScreen>
  );
}

Object.assign(window, {
  Avatar, PhotoUploadTile, StatusBadge,
  ScreenProfile, ScreenProfileEdit, ScreenDocumentAdd,
  ScreenGarage, ScreenCarAdd,
  PROFILE_HEIGHT, PROFILE_EDIT_HEIGHT, DOC_ADD_HEIGHT,
  GARAGE_HEIGHT, CAR_ADD_HEIGHT,
});
