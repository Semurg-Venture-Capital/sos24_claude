// SOS24 — Block 3: M4 (Catalog + Detail) + M5 (Calculator wizard, 4 steps)

// ═════════════════════════════════════════════════════════════════════════
// M4.1 — Каталог продуктов
// ═════════════════════════════════════════════════════════════════════════
const CATALOG_HEIGHT = 2120;

function ScreenCatalog() {
  return (
    <FormScreen height={CATALOG_HEIGHT}>
      <div style={{ position: "absolute", top: 124, left: 24, right: 24 }}>
        <ScreenHeading title={<>Страхование</>} subtitle="Оформите полис онлайн за пару минут" />
      </div>

      <div style={{ position: "absolute", top: 240, left: 24, right: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <ProductCard
          tone="light"
          eyebrow="Обязательное"
          name="ОСАГО"
          subtitle="Страхование гражданской ответственности"
          benefits={[
            { icon: <BenefitBolt />,    label: "Электронный полис мгновенно" },
            { icon: <BenefitMap />,     label: "Действует по всему Узбекистану" },
            { icon: <BenefitShield />,  label: "Онлайн-оформление, без офиса" },
          ]}
          price="от 285 000"
          cta="Рассчитать"
        />
        <ProductCard
          tone="dark"
          eyebrow="Полное покрытие"
          name="КАСКО"
          subtitle="Комплексное страхование автомобиля"
          benefits={[
            { icon: <BenefitCarLock />, label: "Угон и ущерб от третьих лиц" },
            { icon: <BenefitInspector />, label: "Вызов инспектора 24/7" },
            { icon: <BenefitWrench />,  label: "Сеть партнёрских СТО" },
          ]}
          price="от 4 200 000"
          cta="Рассчитать"
        />
        <ProductCard
          tone="light"
          eyebrow="Медицина"
          name="Здоровье"
          subtitle="Медицинская страховка для всей семьи"
          benefits={[
            { icon: <Icon name="stethoscope" size={18} />, label: "Сеть клиник по всей стране" },
            { icon: <Icon name="phone-fill" size={18} />, label: "Экстренная помощь 24/7" },
            { icon: <Icon name="users" size={18} />, label: "До 6 человек на одном полисе" },
          ]}
          price="от 480 000"
          cta="Рассчитать"
        />
        <ProductCard
          tone="dark"
          eyebrow="Имущество"
          name="Дом и имущество"
          subtitle="Защита квартиры, дома, дачи и имущества внутри"
          benefits={[
            { icon: <Icon name="home" size={18} />, label: "Пожар, залив, стихийные бедствия" },
            { icon: <Icon name="shield-check" size={18} />, label: "Кража и противоправные действия" },
            { icon: <Icon name="zap" size={18} />, label: "Электроника и техника" },
          ]}
          price="от 720 000"
          cta="Рассчитать"
        />
        <ProductCard
          tone="light"
          eyebrow="Финансы"
          name="Финансовая защита"
          subtitle="Страхование вкладов, переводов и онлайн-операций"
          benefits={[
            { icon: <Icon name="wallet" size={18} />, label: "Карты, переводы, e-кошельки" },
            { icon: <Icon name="lock" size={18} />, label: "Защита от мошенничества" },
            { icon: <Icon name="badge-check" size={18} />, label: "Возврат потерь до 30 млн сум" },
          ]}
          price="от 180 000"
          cta="Рассчитать"
        />
        {/* Promo banner */}
        <div style={{
          marginTop: 6, borderRadius: 28,
          padding: "18px 20px", display: "flex", alignItems: "center", gap: 14,
          background: "linear-gradient(135deg, rgba(245,200,80,0.4) 0%, rgba(245,200,80,0.18) 100%)",
          boxShadow: "0 12px 28px -20px rgba(180,140,40,0.3)",
        }}>
          <span style={{
            width: 44, height: 44, borderRadius: 999, background: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Neue Montreal',sans-serif", fontWeight: 500, fontSize: 18, color: "#503a07",
            flex: "none", boxShadow: "0 4px 12px rgba(180,140,40,0.2)",
          }}>%</span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: "#3a2a07", letterSpacing: "-0.005em" }}>Скидка 10% при оплате до 31 мая</span>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: "#5e4811" }}>Промокод применится автоматически</span>
          </span>
        </div>
      </div>
    </FormScreen>
  );
}

function ProductCard({ tone, eyebrow, name, subtitle, benefits = [], price, cta }) {
  const dark = tone === "dark";
  const bg = dark ? SOS_TOKENS.inkDark : "rgba(255,255,255,0.55)";
  const inkColor = dark ? "#fff" : SOS_TOKENS.ink;
  const mutedColor = dark ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.inkMuted;

  return (
    <div style={{
      position: "relative",
      borderRadius: 36,
      background: bg,
      backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
      boxShadow: dark ? "0 16px 32px -20px rgba(0,0,0,0.32)" : "0 1px 0 rgba(255,255,255,0.7) inset, 0 12px 32px -24px rgba(0,0,0,0.12)",
      padding: "22px 22px 22px",
      display: "flex", flexDirection: "column", gap: 16, color: inkColor,
      overflow: "hidden",
    }}>
      {/* Top — eyebrow + name */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: dark ? "rgba(255,255,255,0.5)" : SOS_TOKENS.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {eyebrow}
          </span>
          <h2 style={{
            margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 32,
            letterSpacing: "-0.02em", lineHeight: 1, color: inkColor,
          }}>{name}</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: mutedColor, letterSpacing: "-0.005em" }}>
            от
          </span>
          <span style={{
            fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 22,
            letterSpacing: "-0.01em", color: inkColor, lineHeight: 1, whiteSpace: "nowrap",
          }}>{price}</span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: mutedColor }}>сум / год</span>
        </div>
      </div>

      <p style={{ margin: 0, fontFamily: "'Manrope',sans-serif", fontSize: 13, color: mutedColor, lineHeight: 1.4 }}>
        {subtitle}
      </p>

      {/* Benefits */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 2 }}>
        {benefits.map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              width: 36, height: 36, borderRadius: 999,
              background: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)",
              color: dark ? "#fff" : SOS_TOKENS.red,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flex: "none",
            }}>{b.icon}</span>
            <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: dark ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>
              {b.label}
            </span>
          </div>
        ))}
      </div>

      {/* CTA — full width red pill, same height as RedButton elsewhere */}
      <button style={{
        appearance: "none", border: "none",
        marginTop: 8,
        height: 64, borderRadius: 999, padding: "0 28px",
        background: SOS_TOKENS.red, color: "#fff",
        fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em",
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
        cursor: "pointer",
        boxShadow: "0 16px 32px -16px rgba(230,20,40,0.5)",
      }}>
        {cta}
        <svg width="7" height="10" viewBox="0 0 7 10" fill="currentColor"><path d="M.833 0L0 .833 4.167 5 0 9.167.833 10l5-5z" /></svg>
      </button>
    </div>
  );
}

// Benefit icons — thin-line SF Symbols style
function BenefitBolt() {
  return <Icon name="zap" size={18} />;
}
function BenefitMap() {
  return <Icon name="map-pin" size={18} />;
}
function BenefitShield() {
  return <Icon name="shield-check" size={18} />;
}
function BenefitCarLock() {
  return <Icon name="car" size={18} />;
}
function BenefitInspector() {
  return <Icon name="headphones" size={18} />;
}
function BenefitWrench() {
  return <Icon name="wrench" size={18} />;
}

// ═════════════════════════════════════════════════════════════════════════
// M4.2 — Детальная страница продукта
// ═════════════════════════════════════════════════════════════════════════
function ScreenProductDetail() {
  return (
    <PhoneFrame height={1180}>
      {/* Sticky back button */}
      <div style={{ position: "absolute", top: 56, left: 24, right: 24, zIndex: 5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <BackButton />
        <Tag tone="ink">ОСАГО</Tag>
      </div>

      {/* Content */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 120, bottom: 120,
        padding: "0 24px",
        display: "flex", flexDirection: "column", gap: 24,
      }}>
        <ScreenHeading
          title={<>Обязательное<br />страхование ОТВ</>}
          subtitle="Покрывает ваш ущерб другим автомобилям и людям при ДТП."
        />

        <Section title="Что покрывает">
          <BenefitRow icon={<BenefitCarHit />} title="Ущерб транспорту" body="Ремонт автомобиля пострадавшего" />
          <BenefitRow icon={<BenefitHospital />} title="Вред здоровью" body="Лечение пострадавших в ДТП" />
          <BenefitRow icon={<BenefitProperty />} title="Имущественный ущерб" body="Ограждения, столбы, фасады" />
        </Section>

        <Section title="Что не покрывает">
          <ExceptionRow text="Ущерб собственному автомобилю" />
          <ExceptionRow text="Алкогольное и наркотическое опьянение" />
          <ExceptionRow text="ДТП вне территории Узбекистана" />
        </Section>

        <Section title="Как это работает">
          <StepRow num={1} title="Введите номер авто" body="Данные подтянутся из NAPP" />
          <StepRow num={2} title="Выберите параметры" body="Срок, водители, период" />
          <StepRow num={3} title="Оплатите онлайн" body="Карта Uzcard или Humo" />
          <StepRow num={4} title="Получите е-полис" body="Мгновенно в приложении" />
        </Section>

        <Section title="Вопросы и ответы">
          <FaqRow open question="Действует ли полис в первый день?" answer="Да, после успешной оплаты полис активируется через 1 час." />
          <FaqRow question="Что делать при ДТП?" />
          <FaqRow question="Можно ли продлить полис?" />
        </Section>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px",
        background: "linear-gradient(to top, rgba(237,237,237,0.95) 60%, rgba(237,237,237,0))",
      }}>
        <RedButton style={{ width: "100%" }}>Рассчитать стоимость</RedButton>
      </div>
    </PhoneFrame>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{
        margin: 0, fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 19,
        letterSpacing: "-0.005em", color: SOS_TOKENS.ink,
      }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

function BenefitRow({ icon, title, body }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 16px",
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      borderRadius: 20,
    }}>
      <span style={{
        width: 36, height: 36, borderRadius: 999,
        background: "rgba(255,255,255,0.9)", color: SOS_TOKENS.red,
        display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none",
      }}>{icon}</span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>{title}</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.inkMuted }}>{body}</span>
      </span>
    </div>
  );
}

function ExceptionRow({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px" }}>
      <span style={{ width: 18, height: 18, borderRadius: 999, background: "rgba(20,20,20,0.06)", color: SOS_TOKENS.inkMuted, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 700 }}>×</span>
      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: SOS_TOKENS.inkSubtle, letterSpacing: "-0.005em" }}>{text}</span>
    </div>
  );
}

function StepRow({ num, title, body }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 4px" }}>
      <span style={{
        width: 28, height: 28, borderRadius: 999, background: SOS_TOKENS.inkDark, color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Neue Montreal',sans-serif", fontWeight: 500, fontSize: 13, flex: "none",
      }}>{num}</span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>{title}</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: SOS_TOKENS.inkMuted }}>{body}</span>
      </span>
    </div>
  );
}

function FaqRow({ question, answer, open }) {
  return (
    <div style={{
      padding: "16px 18px", borderRadius: 20,
      background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
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

function BenefitCarHit() {
  return <Icon name="car" size={18} />;
}
function BenefitHospital() {
  return <Icon name="stethoscope" size={18} />;
}
function BenefitProperty() {
  return <Icon name="home" size={18} />;
}

// ═════════════════════════════════════════════════════════════════════════
// M5.1 — Calculator wizard (4 steps)
// ═════════════════════════════════════════════════════════════════════════

// Shared frame for all steps — top has back + stepper, bottom has sticky CTA
function WizardFrame({ step, total = 4, eyebrow, children, primary = "Далее", primaryEnabled = true, primaryAction }) {
  return (
    <FormScreen stepper={<StepperBar current={step} total={total} />}>
      <div style={{ position: "absolute", top: 130, left: 24, right: 24, bottom: 120, display: "flex", flexDirection: "column", gap: 20, overflow: "hidden" }}>
        {eyebrow && (
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: SOS_TOKENS.inkMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {eyebrow}
          </span>
        )}
        {children}
      </div>
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px",
        background: "linear-gradient(to top, rgba(237,237,237,0.95) 60%, rgba(237,237,237,0))",
      }}>
        <RedButton style={{ width: "100%" }} disabled={!primaryEnabled} onClick={primaryAction}>
          {primary}
        </RedButton>
      </div>
    </FormScreen>
  );
}

// — Step 1: Автомобиль
function ScreenCalcStep1() {
  return (
    <WizardFrame step={1} eyebrow="Шаг 1 из 4 · Автомобиль">
      <ScreenHeading title="Выберите автомобиль" subtitle="На какое авто оформляем полис" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <CarCard
          selected
          plate="01 A 123 BB"
          name="Chevrolet Cobalt"
          year="2021 · 1.5 л · 105 л.с."
        />
        <CarCard
          plate="10 R 555 AC"
          name="Hyundai Sonata"
          year="2019 · 2.0 л · 150 л.с."
        />
        <AddTile>Добавить новый автомобиль</AddTile>
      </div>
    </WizardFrame>
  );
}

function CarCard({ selected, plate, name, year }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: 18,
      borderRadius: 24,
      background: selected ? SOS_TOKENS.inkDark : SOS_TOKENS.glass,
      color: selected ? "#fff" : SOS_TOKENS.ink,
      backdropFilter: selected ? "none" : "blur(8px)",
      WebkitBackdropFilter: selected ? "none" : "blur(8px)",
      boxShadow: selected ? "0 12px 24px -16px rgba(0,0,0,0.32)" : `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
    }}>
      <span style={{
        width: 48, height: 36, borderRadius: 8,
        background: selected ? "rgba(255,255,255,0.12)" : "#fff",
        color: selected ? "#fff" : SOS_TOKENS.inkDark,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Neue Montreal',sans-serif", fontWeight: 500, fontSize: 13, letterSpacing: "0.04em",
      }}>{plate.split(" ")[0]}</span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 16, letterSpacing: "-0.005em" }}>{name}</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: selected ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.inkMuted }}>{year}</span>
        <span style={{ fontFamily: "'Neue Montreal',sans-serif", fontSize: 13, color: selected ? "rgba(255,255,255,0.7)" : SOS_TOKENS.inkSubtle, letterSpacing: "0.02em" }}>{plate}</span>
      </span>
      {selected ? (
        <span style={{ width: 22, height: 22, borderRadius: 999, background: SOS_TOKENS.red, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4.5l3 3 6-6.5" /></svg>
        </span>
      ) : (
        <span style={{ width: 22, height: 22, borderRadius: 999, background: "rgba(255,255,255,0.6)", boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`, flex: "none" }} />
      )}
    </div>
  );
}

// — Step 2: Водители
function ScreenCalcStep2() {
  return (
    <WizardFrame step={2} eyebrow="Шаг 2 из 4 · Водители">
      <ScreenHeading title="Кто будет управлять" subtitle="Количество водителей влияет на стоимость" />
      <Segmented options={["Ограниченный круг", "Без ограничений"]} active={0} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <DriverCard name="Каримов А. С." doc="AB 2345678 · стаж 8 лет" />
        <DriverCard name="Каримова М. Х." doc="AC 1122334 · стаж 4 года" />
        <AddTile>Добавить водителя</AddTile>
      </div>
      <div style={{
        padding: "14px 16px", borderRadius: 20,
        background: "rgba(245,200,80,0.16)",
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <span style={{ width: 22, height: 22, borderRadius: 999, background: SOS_TOKENS.yellow, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#503a07", fontWeight: 700, flex: "none" }}>!</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: "#5e4811", lineHeight: 1.4 }}>
          «Без ограничений» дороже на ~25%, но позволяет управлять любому водителю с правами.
        </span>
      </div>
    </WizardFrame>
  );
}

function DriverCard({ name, doc }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: 16,
      borderRadius: 20, background: SOS_TOKENS.glass,
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      boxShadow: `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
    }}>
      <span style={{
        width: 40, height: 40, borderRadius: 999,
        background: "linear-gradient(135deg, #d6d6d6, #f4f4f4)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Neue Montreal',sans-serif", fontWeight: 500, fontSize: 14, color: SOS_TOKENS.inkDark,
        flex: "none",
      }}>{name.split(" ").map(p => p[0]).join("").slice(0, 2)}</span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: SOS_TOKENS.ink, letterSpacing: "-0.005em" }}>{name}</span>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMuted }}>{doc}</span>
      </span>
      <button style={{ appearance: "none", border: "none", background: "transparent", cursor: "pointer", padding: 4, color: SOS_TOKENS.inkMuted }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4h12M6 4V2.5a1 1 0 011-1h2a1 1 0 011 1V4M4.5 4l1 9.5a1 1 0 001 .9h3a1 1 0 001-.9L11.5 4" />
        </svg>
      </button>
    </div>
  );
}

// — Step 3: Период
function ScreenCalcStep3() {
  return (
    <WizardFrame step={3} eyebrow="Шаг 3 из 4 · Период">
      <ScreenHeading title="Срок страхования" subtitle="Чем дольше — тем выгоднее в пересчёте на месяц" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <PeriodOption label="3 месяца" sub="−45%" />
        <PeriodOption label="6 месяцев" sub="−25%" />
        <PeriodOption label="12 месяцев" sub="лучший" selected />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <TextInput label="Дата начала" value="13 мая 2026" suffix={<CalendarIcon />} />
        <TextInput label="Дата окончания" value="12 мая 2027" suffix={<CalendarIcon />} />
      </div>
    </WizardFrame>
  );
}

function PeriodOption({ label, sub, selected }) {
  return (
    <div style={{
      padding: "16px 12px", borderRadius: 20,
      background: selected ? SOS_TOKENS.inkDark : SOS_TOKENS.glass,
      color: selected ? "#fff" : SOS_TOKENS.ink,
      backdropFilter: selected ? "none" : "blur(8px)",
      WebkitBackdropFilter: selected ? "none" : "blur(8px)",
      boxShadow: selected ? "0 12px 24px -16px rgba(0,0,0,0.3)" : `inset 0 0 0 1px ${SOS_TOKENS.hairline}`,
      display: "flex", flexDirection: "column", gap: 4, alignItems: "center", textAlign: "center",
    }}>
      <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 15, letterSpacing: "-0.005em" }}>{label}</span>
      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, color: selected ? SOS_TOKENS.green : SOS_TOKENS.inkMuted, fontWeight: 600, letterSpacing: "0.02em" }}>{sub}</span>
    </div>
  );
}

function CalendarIcon() {
  return <Icon name="calendar" size={20} color={SOS_TOKENS.inkMuted} />;
}

// — Step 4: Результат
function ScreenCalcStep4() {
  return (
    <WizardFrame step={4} eyebrow="Шаг 4 из 4 · Стоимость" primary="Оформить полис" primaryEnabled>
      <ScreenHeading title="Стоимость полиса" subtitle="Расчёт ОСАГО на 12 месяцев" />

      {/* Big total card */}
      <div style={{
        padding: "22px 22px 26px", borderRadius: 32,
        background: SOS_TOKENS.inkDark, color: "#fff",
        display: "flex", flexDirection: "column", gap: 14,
        boxShadow: "0 16px 32px -20px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, color: SOS_TOKENS.inkMutedDark, letterSpacing: "0.06em", textTransform: "uppercase" }}>Итого</span>
          <Tag tone="green">ОСАГО · 12 мес</Tag>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "'Neue Montreal','Manrope',sans-serif", fontWeight: 500, fontSize: 40, letterSpacing: "-0.02em", lineHeight: 1 }}>
            385 600
          </span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 14, color: SOS_TOKENS.inkMutedDark }}>сум</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          <CoefRow label="Базовая ставка" value="320 000" tone="dark" />
          <CoefRow label="К. территория · Ташкент" value="× 1.15" tone="dark" />
          <CoefRow label="К. стажа · 8 лет" value="× 0.95" tone="dark" />
          <CoefRow label="К. ограниченный круг" value="× 0.90" tone="dark" />
        </div>
      </div>

      {/* Payment method */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, fontWeight: 500, color: SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>
          Способ оплаты
        </span>
        <Segmented options={["Единовременно", "Рассрочка"]} active={0} />
      </div>
    </WizardFrame>
  );
}

function CoefRow({ label, value, tone }) {
  const dark = tone === "dark";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : SOS_TOKENS.hairline}` }}>
      <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: dark ? SOS_TOKENS.inkMutedDark : SOS_TOKENS.inkMuted, letterSpacing: "-0.005em" }}>{label}</span>
      <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 13, color: dark ? "#fff" : SOS_TOKENS.inkDark }}>{value}</span>
    </div>
  );
}

Object.assign(window, {
  ScreenCatalog, ScreenProductDetail,
  ScreenCalcStep1, ScreenCalcStep2, ScreenCalcStep3, ScreenCalcStep4,
  CATALOG_HEIGHT,
});
