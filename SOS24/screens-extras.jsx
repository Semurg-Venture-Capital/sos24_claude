// SOS24 — Block 8: M11 Уведомления + M12 Документы + M13 Поддержка + M16 Партнёры (7 экранов)

// ═════════════════════════════════════════════════════════════════════════
// M11.1 — Уведомления
// ═════════════════════════════════════════════════════════════════════════
const NOTIFICATIONS_HEIGHT = 1180;

function ScreenNotifications() {
  return (
    <PhoneFrame height={NOTIFICATIONS_HEIGHT}>
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3 }}>
        <BackButton />
        <h1 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22, letterSpacing: "-0.005em", color: SOS_TOKENS.ink, lineHeight: 1 }}>
          Уведомления
        </h1>
        <TextLink color={SOS_TOKENS.inkSubtle} style={{ fontSize: 13 }}>Прочитать все</TextLink>
      </div>

      <div style={{ position: "absolute", top: 124, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 22 }}>
        <NotifGroup label="Сегодня">
          <NotifRow
            icon={<NotifTickIcon />} tone="green" unread
            title="Полис ОСАГО оформлен"
            body="ОСАГО для Chevrolet Cobalt активирован"
            time="11:42"
          />
          <NotifRow
            icon={<NotifAlertIcon />} tone="red" unread
            title="Срок полиса истекает"
            body="ОСАГО для Hyundai Sonata · через 43 дня"
            time="09:18"
          />
        </NotifGroup>

        <NotifGroup label="Вчера">
          <NotifRow
            icon={<NotifChatIcon />} tone="blue"
            title="Ответ от поддержки"
            body="Здравствуйте, по вашему вопросу..."
            time="18:24"
          />
          <NotifRow
            icon={<NotifDocIcon />} tone="ink"
            title="Требуется информация"
            body="Заявление CLM-24-00385 · загрузите фото повреждений"
            time="14:08"
          />
        </NotifGroup>

        <NotifGroup label="Раньше">
          <NotifRow
            icon={<NotifDiscountIcon />} tone="yellow"
            title="Скидка 10% на КАСКО"
            body="Действует до 31 мая"
            time="08.05"
          />
          <NotifRow
            icon={<NotifCarIcon />} tone="ink"
            title="ТО Chevrolet Cobalt"
            body="Запись завтра в 14:00 · AutoFix СТО"
            time="03.05"
          />
        </NotifGroup>
      </div>
    </PhoneFrame>
  );
}

function NotifGroup({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span style={{
        fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600,
        color: SOS_TOKENS.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase",
        paddingLeft: 4,
      }}>{label}</span>
      <div style={{
        borderRadius: 22, overflow: "hidden",
        background: SOS_TOKENS.glass,
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      }}>
        {children}
      </div>
    </div>
  );
}

function NotifRow({ icon, tone = "ink", title, body, time, unread }) {
  const tonePalette = {
    ink:    { bg: SOS_TOKENS.inkDark,           fg: "#fff" },
    green:  { bg: "rgba(105,228,183,0.85)",     fg: "#0a3a26" },
    red:    { bg: "rgba(230,20,40,0.15)",       fg: SOS_TOKENS.red },
    blue:   { bg: "rgba(86,140,255,0.18)",      fg: "#1a3577" },
    yellow: { bg: "rgba(245,200,80,0.5)",       fg: "#503a07" },
  }[tone];
  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "14px 16px",
      borderBottom: `1px solid ${SOS_TOKENS.hairline}`,
      // Unread — solid white tile; read — translucent
      background: unread ? "rgba(255,255,255,0.92)" : "transparent",
    }}>
      <span style={{
        width: 40, height: 40, borderRadius: 999,
        background: tonePalette.bg, color: tonePalette.fg,
        display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
      }}>{icon}</span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        <span style={{
          fontFamily: "'Manrope',sans-serif",
          fontWeight: unread ? 600 : 500, fontSize: 14,
          color: unread ? SOS_TOKENS.ink : SOS_TOKENS.inkSubtle,
          letterSpacing: "-0.005em",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{title}</span>
        <span style={{
          fontFamily: "'Manrope',sans-serif", fontSize: 12,
          color: unread ? SOS_TOKENS.inkMuted : "rgba(20,20,20,0.4)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{body}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flex: "none", marginTop: 2 }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: unread ? SOS_TOKENS.inkDark : SOS_TOKENS.inkSubtle, fontWeight: unread ? 600 : 400 }}>
          {time}
        </span>
        {unread
          ? <span style={{ width: 8, height: 8, borderRadius: 999, background: SOS_TOKENS.red, boxShadow: `0 0 8px ${SOS_TOKENS.redSoft}` }} />
          : <span style={{ width: 8, height: 8 }} />}
      </div>
    </div>
  );
}

function NotifTickIcon()     {
  return <Icon name="check" size={16} />;
}
function NotifAlertIcon()    { return <Icon name="alert-triangle" size={16} />; }
function NotifChatIcon()     { return <Icon name="message-circle" size={16} />; }
function NotifDocIcon()      { return <Icon name="file-text" size={16} />; }
function NotifDiscountIcon() { return <Icon name="percent" size={16} />; }
function NotifCarIcon()      { return <Icon name="car" size={18} />; }

// ═════════════════════════════════════════════════════════════════════════
// M12.1 — Документы
// ═════════════════════════════════════════════════════════════════════════
const DOCS_HEIGHT = 1100;

function ScreenDocuments() {
  return (
    <PhoneFrame height={DOCS_HEIGHT}>
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3 }}>
        <BackButton />
        <h1 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22, letterSpacing: "-0.005em", color: SOS_TOKENS.ink, lineHeight: 1 }}>
          Документы
        </h1>
        <span style={{ width: 48 }} />
      </div>

      {/* Search */}
      <div style={{ position: "absolute", top: 120, left: 24, right: 24 }}>
        <div style={{
          height: 52, padding: "0 18px", borderRadius: 999,
          background: SOS_TOKENS.glass,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Icon name="search" size={18} color={SOS_TOKENS.inkMuted} />
          <span style={{ flex: 1, fontFamily: "'Manrope',sans-serif", fontSize: 15, color: SOS_TOKENS.inkMuted }}>Найти документ</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ position: "absolute", top: 188, left: 24, right: 24 }}>
        <Segmented options={["Все", "Полисы", "Чеки", "Заявления"]} active={0} />
      </div>

      {/* List */}
      <div style={{ position: "absolute", top: 252, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <DocRow ext="pdf" tone="red"  title="Полис ОСАГО № 12 245 582" meta="14.05.2026 · 245 КБ" />
        <DocRow ext="pdf" tone="ink"  title="Чек об оплате · 385 600 сум" meta="14.05.2026 · 84 КБ" />
        <DocRow ext="pdf" tone="red"  title="Полис КАСКО № 12 245 491" meta="11.05.2025 · 312 КБ" />
        <DocRow ext="pdf" tone="blue" title="Заявление CLM-24-00412" meta="14.05.2026 · 156 КБ" />
        <DocRow ext="jpg" tone="ink"  title="Фото повреждений · ДТП" meta="14.05.2026 · 1.8 МБ" />
        <DocRow ext="pdf" tone="red"  title="Полис ОСАГО · архив" meta="11.05.2024 · 232 КБ" />
      </div>
    </PhoneFrame>
  );
}

function DocRow({ ext, tone = "red", title, meta }) {
  const palette = {
    red:  { bg: SOS_TOKENS.red, fg: "#fff" },
    ink:  { bg: SOS_TOKENS.inkDark, fg: "#fff" },
    blue: { bg: SOS_TOKENS.blue, fg: "#fff" },
  }[tone];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
      borderRadius: 22,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
    }}>
      <span style={{
        width: 44, height: 52, borderRadius: 8,
        background: palette.bg, color: palette.fg,
        display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
        flex: "none", position: "relative",
        boxShadow: "0 8px 16px -8px rgba(0,0,0,0.18)",
      }}>
        <svg width="22" height="26" viewBox="0 0 22 26" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, position: "absolute" }}>
          <path d="M5 1h10l5 5v18a1 1 0 01-1 1H5a1 1 0 01-1-1V2a1 1 0 011-1z" />
          <path d="M15 1v5h5" />
        </svg>
        <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.04em", zIndex: 1 }}>
          {ext.toUpperCase()}
        </span>
      </span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{
          fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{title}</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted }}>{meta}</span>
      </div>
      <button style={{
        appearance: "none", border: "none", cursor: "pointer",
        width: 36, height: 36, borderRadius: 999, background: "rgba(20,20,20,0.05)",
        color: SOS_TOKENS.inkDark,
        display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v12M6 11l6 6 6-6M4 20h16" />
        </svg>
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M13.1 — Поддержка (hub)
// ═════════════════════════════════════════════════════════════════════════
const SUPPORT_HEIGHT = 1100;

function ScreenSupportHub() {
  return (
    <FormScreen height={SUPPORT_HEIGHT}>
      <div style={{ position: "absolute", top: 124, left: 24, right: 24 }}>
        <ScreenHeading title="Поддержка" subtitle="Ответим в среднем за 5 минут · 24/7" />
      </div>

      {/* Hero — primary action gets the weight */}
      <div style={{ position: "absolute", top: 240, left: 24, right: 24 }}>
        <div style={{
          padding: "22px 22px", borderRadius: 32,
          background: SOS_TOKENS.inkDark, color: "#fff",
          display: "flex", alignItems: "center", gap: 16,
          boxShadow: "0 24px 48px -28px rgba(0,0,0,0.35)",
        }}>
          <span style={{
            width: 56, height: 56, borderRadius: 999,
            background: SOS_TOKENS.red, color: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            flex: "none",
            boxShadow: "0 12px 24px -8px rgba(230,20,40,0.5)",
          }}>
            <NotifChatIcon />
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}>
            <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 20, letterSpacing: "-0.005em", lineHeight: 1.1 }}>
              Написать в чат
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.green, fontWeight: 600, letterSpacing: "0.02em" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: SOS_TOKENS.green, boxShadow: `0 0 8px ${SOS_TOKENS.green}` }} />
              онлайн · Дилнура и 4 оператора
            </span>
          </div>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round"><path d="M2 2l6 6-6 6" /></svg>
        </div>
      </div>

      {/* Secondary actions — rows, not cards */}
      <div style={{ position: "absolute", top: 390, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 8 }}>
        <SupportRow icon={<PhoneIcon />} title="Позвонить в SOS24" meta="+998 71 200-24-24 · бесплатно" />
        <SupportRow icon={<InfoIcon />}  title="Как работает приложение" meta="видео-гид · 4 минуты" />
      </div>

      {/* FAQ — single bordered list */}
      <div style={{ position: "absolute", top: 560, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 18, letterSpacing: "-0.005em", color: SOS_TOKENS.ink }}>
            Частые вопросы
          </h3>
          <TextLink color={SOS_TOKENS.inkSubtle} style={{ fontSize: 13 }}>Все 36 ›</TextLink>
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          <CategoryChip active>Все</CategoryChip>
          <CategoryChip>Полисы</CategoryChip>
          <CategoryChip>Оплата</CategoryChip>
          <CategoryChip>ДТП</CategoryChip>
          <CategoryChip>Аккаунт</CategoryChip>
        </div>

        <div style={{
          background: SOS_TOKENS.glass,
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          borderRadius: 22, overflow: "hidden",
          boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
        }}>
          <FaqInlineRow open question="Как оформить полис ОСАГО онлайн?" answer="Введите номер авто, выберите параметры, оплатите картой Uzcard или Humo. Электронный полис придёт мгновенно." />
          <FaqInlineRow question="Что делать при ДТП?" />
          <FaqInlineRow question="Можно ли вернуть деньги за полис?" />
          <FaqInlineRow question="Как добавить ещё одного водителя?" last />
        </div>
      </div>
    </FormScreen>
  );
}

// Single-line support row (compact alternative to a tile)
function SupportRow({ icon, title, meta }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 18px", borderRadius: 20,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 999,
        background: "rgba(255,255,255,0.9)", color: SOS_TOKENS.red,
        display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
        boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      }}>{icon}</span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>{title}</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted }}>{meta}</span>
      </span>
      <ChevronRight />
    </div>
  );
}

// Inline FAQ row — lives inside one bordered list container
function FaqInlineRow({ question, answer, open, last }) {
  return (
    <div style={{
      padding: "14px 18px",
      borderBottom: last ? "none" : `1px solid ${SOS_TOKENS.hairline}`,
      display: "flex", flexDirection: "column", gap: open ? 8 : 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>
          {question}
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={SOS_TOKENS.inkMuted} strokeWidth="1.8" strokeLinecap="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s ease", flex: "none" }}>
          <path d="M3 5l4 4 4-4" />
        </svg>
      </div>
      {open && answer && (
        <p style={{ margin: 0, fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.inkMuted, lineHeight: 1.5 }}>
          {answer}
        </p>
      )}
    </div>
  );
}

function SupportTile({ icon, title, meta, dark }) {
  return (
    <div style={{
      padding: "18px 20px", borderRadius: 28, height: 110,
      background: dark ? SOS_TOKENS.inkDark : "rgba(255,255,255,0.55)",
      backdropFilter: dark ? "none" : "blur(8px)", WebkitBackdropFilter: dark ? "none" : "blur(8px)",
      color: dark ? "#fff" : SOS_TOKENS.ink,
      boxShadow: dark ? "0 4px 12px rgba(0,0,0,0.12)" : "0 1px 0 rgba(255,255,255,0.6) inset",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 999,
        background: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)",
        color: dark ? "#fff" : SOS_TOKENS.red,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>{icon}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: "-0.005em" }}>{title}</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: dark ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>{meta}</span>
      </div>
    </div>
  );
}

function CategoryChip({ children, active }) {
  return (
    <span style={{
      flex: "none", padding: "8px 14px", borderRadius: 999,
      background: active ? SOS_TOKENS.inkDark : SOS_TOKENS.glass,
      color: active ? "#fff" : SOS_TOKENS.inkDark,
      backdropFilter: active ? "none" : "blur(8px)", WebkitBackdropFilter: active ? "none" : "blur(8px)",
      boxShadow: active ? "none" : `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 12, letterSpacing: "-0.005em",
      cursor: "pointer", whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function PhoneIcon() {
  return <Icon name="phone-fill" size={16} />;
}

// ═════════════════════════════════════════════════════════════════════════
// M13.2 — Чат с оператором
// ═════════════════════════════════════════════════════════════════════════
function ScreenChat() {
  return (
    <PhoneFrame>
      {/* Top — compact operator header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 108,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(14px) saturate(160%)", WebkitBackdropFilter: "blur(14px) saturate(160%)",
        borderBottom: `1px solid ${SOS_TOKENS.hairline}`,
        padding: "52px 20px 0",
        display: "flex", alignItems: "center", gap: 10, zIndex: 3,
      }}>
        <BackButton />
        <Avatar size={40} initials="ДС" tone="dark" />
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
          <span style={{
            fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink,
            letterSpacing: "-0.005em", lineHeight: 1.1,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            Дилнура · SOS24
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.green, fontWeight: 600, letterSpacing: "0.02em" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: SOS_TOKENS.green }} />
            онлайн · ~2 мин
          </span>
        </div>
        <IconButton>
          <PhoneIcon />
        </IconButton>
      </div>

      {/* Messages */}
      <div style={{
        position: "absolute", top: 108, left: 0, right: 0, bottom: 100,
        padding: "16px 16px 8px",
        display: "flex", flexDirection: "column", gap: 8,
        overflowY: "auto",
      }}>
        <ChatSystem text="Чат начат · 11:42" />
        <ChatBubble side="them" name="Дилнура" text="Здравствуйте, Азиз! Я Дилнура, оператор поддержки. Чем могу помочь?" time="11:42" />
        <ChatBubble side="me" text="Здравствуйте! Вопрос по заявлению CLM-24-00412 — какие фото ещё нужны?" time="11:43" />
        <ChatBubble side="them" name="Дилнура" text="Сейчас посмотрю. Один момент 🙂" time="11:43" />
        <ChatTyping />
        <ChatBubble side="them" name="Дилнура" text="По вашему заявлению нужно прикрепить фото второго ТС крупным планом — VIN и номерной знак." time="11:44" />
        <ChatBubble side="me" attach text="Сейчас сделаю. Можно так?" time="11:45" />
      </div>

      {/* Input */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        padding: "12px 16px 32px",
        background: "rgba(237,237,237,0.95)",
        backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        borderTop: `1px solid ${SOS_TOKENS.hairline}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <button style={{
          appearance: "none", border: "none", cursor: "pointer",
          width: 44, height: 44, borderRadius: 999,
          background: SOS_TOKENS.glass, color: SOS_TOKENS.inkDark,
          display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.4 11.05L12.5 19.95a5.5 5.5 0 11-7.78-7.78L13.62 3.27a3.66 3.66 0 015.17 5.17L9.88 17.33a1.83 1.83 0 11-2.59-2.59L15.83 6.2" />
          </svg>
        </button>
        <div style={{
          flex: 1, height: 44, padding: "0 18px", borderRadius: 999,
          background: "#fff",
          boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
          display: "flex", alignItems: "center",
          fontFamily: "'Manrope',sans-serif", fontSize: 15, color: SOS_TOKENS.inkMuted,
        }}>
          Сообщение…
        </div>
        <button style={{
          appearance: "none", border: "none", cursor: "pointer",
          width: 44, height: 44, borderRadius: 999,
          background: SOS_TOKENS.red, color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
          boxShadow: "0 8px 16px -6px rgba(230,20,40,0.5)",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11l18-8-8 18-2-7-8-3z" /></svg>
        </button>
      </div>
    </PhoneFrame>
  );
}

function ChatBubble({ side, name, text, time, attach }) {
  const me = side === "me";
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: me ? "flex-end" : "flex-start",
      gap: 2, maxWidth: "82%", alignSelf: me ? "flex-end" : "flex-start",
    }}>
      {name && !me && (
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMuted, paddingLeft: 14 }}>{name}</span>
      )}
      <div style={{
        padding: "10px 14px",
        background: me ? SOS_TOKENS.red : "#fff",
        color: me ? "#fff" : SOS_TOKENS.ink,
        borderRadius: me ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
        boxShadow: me ? "0 12px 24px -16px rgba(230,20,40,0.4)" : "0 4px 12px -6px rgba(0,0,0,0.08), inset 0 0 0 1px " + SOS_TOKENS.hairline,
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        {attach && (
          <div style={{
            height: 110, borderRadius: 12,
            background: "linear-gradient(135deg, #2a2a2a 0%, #555 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em",
          }}>
            ФОТО · ДОКАЗАТЕЛЬСТВО
          </div>
        )}
        <span style={{
          fontFamily: "'Manrope',sans-serif", fontSize: 14, lineHeight: 1.45, letterSpacing: "-0.005em",
        }}>{text}</span>
      </div>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: SOS_TOKENS.inkSubtle, paddingLeft: me ? 0 : 14, paddingRight: me ? 14 : 0 }}>{time}</span>
    </div>
  );
}

function ChatSystem({ text }) {
  return (
    <div style={{ alignSelf: "center", padding: "4px 12px", borderRadius: 999, background: "rgba(20,20,20,0.05)", fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMuted }}>
      {text}
    </div>
  );
}

function ChatTyping() {
  return (
    <div style={{
      alignSelf: "flex-start", padding: "10px 14px", borderRadius: "20px 20px 20px 6px",
      background: "#fff", boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      display: "inline-flex", gap: 4,
    }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: 999, background: SOS_TOKENS.inkMuted,
          animation: "sosPulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.18}s`,
        }} />
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M16.1 — Партнёры (список)
// ═════════════════════════════════════════════════════════════════════════
const PARTNERS_HEIGHT = 1200;

function ScreenPartners() {
  return (
    <PhoneFrame height={PARTNERS_HEIGHT}>
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 3 }}>
        <BackButton />
        <h1 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22, letterSpacing: "-0.005em", color: SOS_TOKENS.ink, lineHeight: 1 }}>
          Партнёры
        </h1>
        <IconButton>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M6 12h12M9 18h6" />
          </svg>
        </IconButton>
      </div>

      {/* Search + view toggle */}
      <div style={{ position: "absolute", top: 120, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{
            flex: 1, height: 52, padding: "0 18px", borderRadius: 999,
            background: SOS_TOKENS.glass,
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SOS_TOKENS.inkMuted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <span style={{ flex: 1, fontFamily: "'Manrope',sans-serif", fontSize: 15, color: SOS_TOKENS.inkMuted }}>СТО, клиника, услуга</span>
          </div>
          <button style={{
            appearance: "none", border: "none", cursor: "pointer",
            width: 52, height: 52, borderRadius: 999,
            background: SOS_TOKENS.inkDark, color: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 22V8l7-3 6 3 7-3v14l-7 3-6-3-7 3zM9 5v17M15 8v14" />
            </svg>
          </button>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          <CategoryChip active>Все · 124</CategoryChip>
          <CategoryChip>СТО</CategoryChip>
          <CategoryChip>Клиники</CategoryChip>
          <CategoryChip>Эвакуатор</CategoryChip>
          <CategoryChip>В радиусе 5 км</CategoryChip>
        </div>
      </div>

      {/* List */}
      <div style={{ position: "absolute", top: 256, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <PartnerRow
          name="AutoFix СТО" type="СТО"
          rating="4.8" reviews="124" distance="0.4 км"
          tags={["Кузовной ремонт", "Покраска", "Электрика"]} open
        />
        <PartnerRow
          name="Медсервис" type="Клиника"
          rating="4.6" reviews="58" distance="1.2 км"
          tags={["Экстренная помощь", "Травматология"]} open
        />
        <PartnerRow
          name="АвтоЦентр Премиум" type="СТО"
          rating="4.5" reviews="212" distance="2.1 км"
          tags={["Двигатель", "ТО", "Диагностика"]}
        />
        <PartnerRow
          name="Эвак-24" type="Эвакуатор"
          rating="4.9" reviews="31" distance="3.0 км"
          tags={["24/7", "Любой класс"]} open
        />
      </div>
    </PhoneFrame>
  );
}

function PartnerRow({ name, type, rating, reviews, distance, tags = [], open }) {
  return (
    <div style={{
      padding: 14, borderRadius: 24,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      display: "flex", gap: 14,
    }}>
      <div style={{
        width: 70, height: 70, borderRadius: 18, flex: "none",
        background: "linear-gradient(135deg, #e8e8e8 0%, #c4c4c4 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", color: SOS_TOKENS.inkSubtle,
        position: "relative", overflow: "hidden",
        boxShadow: "0 0 0 1px rgba(20,20,20,0.06)",
      }}>
        <PlaceholderBadge style={{ top: 4, left: 4, padding: "2px 6px 2px 4px", fontSize: 8 }} />
        <span style={{ fontFamily: "'Neue Montreal',sans-serif", fontWeight: 500, fontSize: 22 }}>{name[0]}</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name}
          </span>
          {open && <Tag tone="green">открыто</Tag>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#f5c850"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" /></svg>
            <span style={{ color: SOS_TOKENS.inkDark, fontWeight: 600 }}>{rating}</span>
            <span>({reviews})</span>
          </span>
          <span>·</span>
          <span style={{ color: SOS_TOKENS.inkDark, fontWeight: 500 }}>{distance}</span>
          <span>·</span>
          <span>{type}</span>
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {tags.map((t, i) => (
            <span key={i} style={{
              padding: "3px 8px", borderRadius: 999,
              background: "rgba(20,20,20,0.06)", color: SOS_TOKENS.inkSubtle,
              fontFamily: "'Manrope',sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: "-0.005em",
            }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M16.2 — Карточка партнёра
// ═════════════════════════════════════════════════════════════════════════
const PARTNER_DETAIL_HEIGHT = 1320;

function ScreenPartnerDetail() {
  return (
    <PhoneFrame height={PARTNER_DETAIL_HEIGHT}>
      {/* Hero image */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 0, height: 260,
        background: "linear-gradient(135deg, #3a3a3a 0%, #5e5e5e 50%, #828282 100%)",
        overflow: "hidden",
      }}>
        <PlaceholderBadge style={{ top: 64, left: 24 }} />
        {/* Decorative grid pattern */}
        <svg width="100%" height="100%" viewBox="0 0 390 260" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
          <defs>
            <pattern id="hatchPart" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M0 24 L24 0" stroke="#fff" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hatchPart)" />
        </svg>
      </div>

      {/* Sticky top buttons */}
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, display: "flex", justifyContent: "space-between", zIndex: 3 }}>
        <BackButton />
        <IconButton>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.5 0 3 1 3 3v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3c0-2 1.5-3 3-3" />
            <path d="M12 2v14M8 10l4 4 4-4" />
          </svg>
        </IconButton>
      </div>

      {/* Title block */}
      <div style={{ position: "absolute", top: 220, left: 24, right: 24, padding: "20px 22px 22px", borderRadius: 32,
        background: "#fff", boxShadow: "0 24px 48px -28px rgba(0,0,0,0.18), inset 0 0 0 1px " + SOS_TOKENS.hairline,
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Tag tone="ink">СТО · партнёр SOS24</Tag>
            <h2 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 26, letterSpacing: "-0.01em", color: SOS_TOKENS.ink, lineHeight: 1.1 }}>
              AutoFix СТО
            </h2>
          </div>
          <Tag tone="green">открыто</Tag>
        </div>

        {/* Rating + distance */}
        <div style={{ display: "flex", gap: 18, alignItems: "center", fontFamily: "'Manrope',sans-serif", fontSize: 13 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f5c850"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" /></svg>
            <span style={{ fontWeight: 600, color: SOS_TOKENS.inkDark }}>4.8</span>
            <span style={{ color: SOS_TOKENS.inkMuted }}>· 124 отзыва</span>
          </span>
          <span style={{ color: SOS_TOKENS.inkMuted }}>·</span>
          <span style={{ color: SOS_TOKENS.inkDark, fontWeight: 500 }}>0.4 км</span>
        </div>

        {/* Address + phone */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto", gap: 10,
          padding: "12px 14px", borderRadius: 16, background: "rgba(20,20,20,0.04)",
        }}>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkMuted, letterSpacing: "0.04em", textTransform: "uppercase" }}>Адрес</span>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkDark }}>ул. Амира Темура, 84</span>
          </span>
          <button style={{
            appearance: "none", border: "none", cursor: "pointer",
            padding: "8px 14px", borderRadius: 999, background: SOS_TOKENS.inkDark, color: "#fff",
            fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "-0.005em",
            alignSelf: "center",
          }}>Маршрут</button>
        </div>
      </div>

      {/* Services */}
      <div style={{ position: "absolute", top: 530, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <h3 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 18, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>
          Услуги
        </h3>
        <ServiceRow name="Кузовной ремонт" desc="Восстановление после ДТП" price="от 450 000" />
        <ServiceRow name="Покраска" desc="Покраска элемента кузова" price="от 380 000" />
        <ServiceRow name="Замена стекла" desc="Лобовое или боковое" price="от 220 000" />
      </div>

      {/* Reviews */}
      <div style={{ position: "absolute", top: 860, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={{ margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 18, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>
            Отзывы
          </h3>
          <TextLink color={SOS_TOKENS.inkSubtle} style={{ fontSize: 13 }}>Все 124 ›</TextLink>
        </div>
        <ReviewRow name="Дмитрий А." rating={5} text="Отличный сервис, всё быстро и профессионально. Рекомендую!" date="2 дня назад" />
        <ReviewRow name="Гульнара Х." rating={4} text="Понравилось обслуживание, цены адекватные." date="неделю назад" />
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px",
        background: "linear-gradient(to top, rgba(237,237,237,0.95) 60%, rgba(237,237,237,0))",
      }}>
        <RedButton style={{ width: "100%" }}>Записаться</RedButton>
      </div>
    </PhoneFrame>
  );
}

function ServiceRow({ name, desc, price }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 18,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
    }}>
      <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>{name}</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted }}>{desc}</span>
      </span>
      <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 14, color: SOS_TOKENS.inkDark, letterSpacing: "-0.005em", whiteSpace: "nowrap" }}>
        {price}
      </span>
    </div>
  );
}

function ReviewRow({ name, rating, text, date }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 18,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar size={28} initials={name.split(" ").map(p => p[0]).join("").slice(0, 2)} />
          <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>{name}</span>
        </span>
        <span style={{ display: "inline-flex", gap: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i < rating ? "#f5c850" : "rgba(20,20,20,0.12)"}>
              <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
            </svg>
          ))}
        </span>
      </div>
      <p style={{ margin: 0, fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.inkMuted, lineHeight: 1.45, letterSpacing: "-0.005em" }}>
        {text}
      </p>
      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: SOS_TOKENS.inkSubtle }}>{date}</span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// M16.3 — Запись на услугу
// ═════════════════════════════════════════════════════════════════════════
const BOOKING_HEIGHT = 1240;

function ScreenBooking() {
  return (
    <FormScreen height={BOOKING_HEIGHT}>
      <div style={{ position: "absolute", top: 124, left: 24, right: 24 }}>
        <ScreenHeading title={<>Запись в<br />AutoFix СТО</>} />
      </div>

      <div style={{ position: "absolute", top: 260, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 22, bottom: 130 }}>
        {/* Service selection */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
            Услуга
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <ServicePick name="Кузовной ремонт" price="от 450 000 сум" selected />
            <ServicePick name="Покраска" price="от 380 000 сум" />
          </div>
        </div>

        {/* Date picker (mini calendar row) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
              Дата
            </span>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.inkDark, fontWeight: 500 }}>Май 2026</span>
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            <DayCell wd="ср" d={14} disabled />
            <DayCell wd="чт" d={15} />
            <DayCell wd="пт" d={16} selected />
            <DayCell wd="сб" d={17} disabled />
            <DayCell wd="вс" d={18} disabled />
            <DayCell wd="пн" d={19} />
            <DayCell wd="вт" d={20} />
            <DayCell wd="ср" d={21} />
          </div>
        </div>

        {/* Time slots */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
            Время · пятница, 16 мая
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            <TimeSlot time="09:00" disabled />
            <TimeSlot time="10:30" />
            <TimeSlot time="11:00" />
            <TimeSlot time="12:30" />
            <TimeSlot time="14:00" selected />
            <TimeSlot time="15:30" />
            <TimeSlot time="16:00" disabled />
            <TimeSlot time="17:30" />
          </div>
        </div>

        {/* Policy + comment */}
        <SummaryBlock
          eyebrow="Связано с полисом"
          editable
          rows={[
            { label: "КАСКО · 01 A 123 BB", value: "Chevrolet Cobalt" },
          ]}
        />
      </div>

      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px",
        background: "linear-gradient(to top, rgba(237,237,237,0.95) 60%, rgba(237,237,237,0))",
      }}>
        <RedButton style={{ width: "100%" }}>Подтвердить запись</RedButton>
      </div>
    </FormScreen>
  );
}

function ServicePick({ name, price, selected }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
      borderRadius: 18,
      background: selected ? SOS_TOKENS.inkDark : SOS_TOKENS.glass,
      color: selected ? "#fff" : SOS_TOKENS.ink,
      backdropFilter: selected ? "none" : "blur(8px)", WebkitBackdropFilter: selected ? "none" : "blur(8px)",
      boxShadow: selected ? "0 12px 24px -16px rgba(0,0,0,0.3)" : `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
    }}>
      <Checkbox checked={selected} />
      <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 14, letterSpacing: "-0.005em", flex: 1 }}>{name}</span>
      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: selected ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.inkMuted, whiteSpace: "nowrap" }}>{price}</span>
    </div>
  );
}

function DayCell({ wd, d, selected, disabled }) {
  return (
    <div style={{
      flex: "none", width: 52, height: 64, borderRadius: 16,
      background: selected ? SOS_TOKENS.red : disabled ? "transparent" : SOS_TOKENS.glass,
      color: selected ? "#fff" : disabled ? SOS_TOKENS.inkSubtle : SOS_TOKENS.inkDark,
      backdropFilter: selected || disabled ? "none" : "blur(8px)", WebkitBackdropFilter: selected || disabled ? "none" : "blur(8px)",
      boxShadow: selected ? "0 12px 24px -16px rgba(230,20,40,0.5)" : disabled ? "none" : `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      opacity: disabled ? 0.4 : 1,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
    }}>
      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 10, fontWeight: 500, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.04em" }}>{wd}</span>
      <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 20, letterSpacing: "-0.005em", lineHeight: 1 }}>{d}</span>
    </div>
  );
}

function TimeSlot({ time, selected, disabled }) {
  return (
    <div style={{
      height: 40, borderRadius: 12,
      background: selected ? SOS_TOKENS.inkDark : disabled ? "transparent" : SOS_TOKENS.glass,
      color: selected ? "#fff" : disabled ? SOS_TOKENS.inkSubtle : SOS_TOKENS.inkDark,
      backdropFilter: selected || disabled ? "none" : "blur(8px)", WebkitBackdropFilter: selected || disabled ? "none" : "blur(8px)",
      boxShadow: selected ? "none" : disabled ? "none" : `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      opacity: disabled ? 0.4 : 1,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 13, letterSpacing: "-0.005em",
      textDecoration: disabled ? "line-through" : "none",
    }}>
      {time}
    </div>
  );
}

Object.assign(window, {
  ScreenNotifications, ScreenDocuments,
  ScreenSupportHub, ScreenChat,
  ScreenPartners, ScreenPartnerDetail, ScreenBooking,
  NOTIFICATIONS_HEIGHT, DOCS_HEIGHT, SUPPORT_HEIGHT,
  PARTNERS_HEIGHT, PARTNER_DETAIL_HEIGHT, BOOKING_HEIGHT,
});
