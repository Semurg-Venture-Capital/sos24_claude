// lucide-icons.jsx — unified icon system for SOS24
// Lucide-style thin-line icons, 24×24 viewBox, stroke 1.7.
// Inline SVG paths — no network dependency.
//
// Use:  <Icon name="bell" size={20} />
//       <Icon name="home" size={26} fill />     // filled (for active tab state)
//       <Icon name="bell" stroke={1.5} color="red" />

function Icon({ name, size = 20, stroke = 1.7, fill = false, color = "currentColor", style }) {
  const def = ICON_REGISTRY[name];
  if (!def) {
    // Visible warning so missing icons are easy to spot
    return (
      <span style={{ display: "inline-flex", width: size, height: size, alignItems: "center", justifyContent: "center", fontSize: 9, color: "#f00", border: "1px solid #f00", borderRadius: 4, fontFamily: "monospace" }}>
        ?{name}
      </span>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ flex: "none", display: "block", ...style }}>
      {def}
    </svg>
  );
}

const ICON_REGISTRY = {
  // ── Navigation
  "chevron-left":   <path d="M15 18l-6-6 6-6" />,
  "chevron-right":  <path d="M9 18l6-6-6-6" />,
  "chevron-down":   <path d="M6 9l6 6 6-6" />,
  "chevron-up":     <path d="M6 15l6-6 6 6" />,
  "arrow-left":     <><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></>,
  "arrow-right":    <><path d="M5 12h14" /><path d="M12 5l7 7-7 7" /></>,
  "arrow-up-right": <><path d="M7 17L17 7" /><path d="M7 7h10v10" /></>,

  // ── UI primitives
  "x":               <><path d="M18 6L6 18" /><path d="M6 6l12 12" /></>,
  "plus":            <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  "minus":           <path d="M5 12h14" />,
  "check":           <path d="M20 6L9 17l-5-5" />,
  "more-horizontal": <><circle cx="5" cy="12" r="0.5" fill="currentColor" /><circle cx="12" cy="12" r="0.5" fill="currentColor" /><circle cx="19" cy="12" r="0.5" fill="currentColor" /></>,
  "menu":            <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>,
  "search":          <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  "sliders":         <><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" /><path d="M1 14h6M9 8h6M17 16h6" /></>,
  "filter":          <path d="M22 3H2l8 9.5V19l4 2v-8.5L22 3z" />,
  "send-arrow":      <><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></>,

  // ── Files & docs
  "file-text":  <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></>,
  "file-check": <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><path d="M9 15l2 2 4-4" /></>,
  "file-image": <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><circle cx="10" cy="13" r="2" /><path d="M20 17l-3-3-7 7" /></>,
  "files":      <><path d="M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7z" /><path d="M15 2v5h5" /><path d="M9 2v2" /></>,
  "folder":     <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />,
  "download":   <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></>,
  "upload":     <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></>,
  "share":      <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51l6.83 3.98" /><path d="M15.41 6.51l-6.82 3.98" /></>,
  "paperclip":  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />,
  "camera":     <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></>,
  "image":      <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>,
  "edit":       <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  "trash":      <><path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /></>,

  // ── Communication
  "message-circle": <path d="M21 11.5a8.4 8.4 0 01-1 4 8.5 8.5 0 01-7.5 4.5L3 22l1.5-4.5A8.5 8.5 0 0112 3a8.5 8.5 0 019 8.5z" />,
  "phone":          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />,
  "phone-fill":     <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />,
  "headphones":     <><path d="M3 18v-6a9 9 0 0118 0v6" /><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" /></>,

  // ── Bell
  "bell":     <><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
  "bell-dot": <><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /><circle cx="19" cy="5" r="3" fill="currentColor" stroke="none" /></>,

  // ── Status / feedback
  "alert-triangle": <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  "alert-circle":   <><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></>,
  "info":           <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  "check-circle":   <><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></>,
  "help-circle":    <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>,
  "x-circle":       <><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></>,

  // ── Profile / settings
  "user":         <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  "user-fill":    <><circle cx="12" cy="8" r="4" fill="currentColor" /><path d="M4 21a8 8 0 0116 0z" fill="currentColor" /></>,
  "users":        <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>,
  "user-check":   <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M16 11l2 2 4-4" /></>,
  "log-out":      <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
  "lock":         <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>,
  "shield-lock":  <><path d="M12 22s-8-4-8-12V5l8-3 8 3v5c0 8-8 12-8 12z" /><circle cx="12" cy="11" r="1.5" /><path d="M12 12.5v2" /></>,
  "globe":        <><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 010 20" /><path d="M12 2a15.3 15.3 0 000 20" /></>,
  "moon-sun":     <><circle cx="12" cy="12" r="4" /><path d="M12 8a4 4 0 010 8" fill="currentColor" stroke="none" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
  "fingerprint":  <><path d="M6.5 6.5a8 8 0 0111 0" /><path d="M5 12c0-4 3-7 7-7s7 3 7 7" /><path d="M3 18c2-3 3-6 3-9M9 22c0-3 1-6 1-9a3 3 0 016 0c0 4 .5 6 1.5 9" /></>,
  "settings":     <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
  "badge-check":  <><path d="M3.85 8.62a4 4 0 014.78-4.77 4 4 0 016.74 0 4 4 0 014.78 4.78 4 4 0 010 6.74 4 4 0 01-4.77 4.78 4 4 0 01-6.75 0 4 4 0 01-4.78-4.77 4 4 0 010-6.76z" /><path d="M9 12l2 2 4-4" /></>,

  // ── Car / insurance
  "car":          <><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2" /><circle cx="6.5" cy="16.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></>,
  "car-fill":     <><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2" fill="currentColor" stroke="currentColor" /><circle cx="6.5" cy="16.5" r="2" fill="#fff" stroke="none" /><circle cx="16.5" cy="16.5" r="2" fill="#fff" stroke="none" /></>,
  "shield":       <path d="M12 22s-8-4-8-12V5l8-3 8 3v5c0 8-8 12-8 12z" />,
  "shield-check": <><path d="M12 22s-8-4-8-12V5l8-3 8 3v5c0 8-8 12-8 12z" /><path d="M9 12l2 2 4-4" /></>,
  "shield-alert": <><path d="M12 22s-8-4-8-12V5l8-3 8 3v5c0 8-8 12-8 12z" /><path d="M12 8v4" /><path d="M12 16h.01" /></>,
  "key":          <><circle cx="7.5" cy="15.5" r="5.5" /><path d="M11 11l10-10" /><path d="M17 5l2 2" /></>,
  "credit-card":  <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></>,
  "wallet":       <><path d="M19 7H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2z" /><path d="M16 14h2" /><path d="M3 9V5a2 2 0 012-2h12" /></>,
  "calendar":     <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  "clock":        <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  "history":      <><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.66L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></>,
  "map-pin":      <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>,
  "map":          <><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" /><path d="M9 3v15M15 6v15" /></>,
  "qr-code":      <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="6" y="6" width="1" height="1" fill="currentColor" /><rect x="17" y="6" width="1" height="1" fill="currentColor" /><rect x="6" y="17" width="1" height="1" fill="currentColor" /><path d="M14 14h3v3M21 14v3M14 18v3h3M19 19v2M21 21h-1" /></>,
  "route":        <><circle cx="6" cy="19" r="3" /><circle cx="18" cy="5" r="3" /><path d="M9 19h6.5A3.5 3.5 0 0019 15.5v0a3.5 3.5 0 00-3.5-3.5h-7A3.5 3.5 0 015 8.5v0A3.5 3.5 0 018.5 5H15" /></>,

  // ── Home / nav-bar
  "home":      <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 22V12h6v10" /></>,
  "home-fill": <path d="M3 10v10a2 2 0 002 2h4v-8h6v8h4a2 2 0 002-2V10L12 2z" fill="currentColor" stroke="currentColor" />,

  // ── Misc functional
  "zap":      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  "wrench":   <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />,
  "percent":  <><path d="M19 5L5 19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></>,
  "tag":      <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><path d="M7 7h.01" /></>,
  "star":     <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />,
  "heart":    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />,
  "stethoscope": <><path d="M11 2v2M5 2v2M5 4h6v6a3 3 0 11-6 0z" /><path d="M8 13v2a4 4 0 008 0v-3" /><circle cx="16" cy="11" r="2" /></>,
  "home-building": <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01" /></>,
};
window.Icon = Icon;
window.ICON_REGISTRY = ICON_REGISTRY;
