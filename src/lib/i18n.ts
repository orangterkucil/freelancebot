/**
 * i18n — top 6 world languages (by combined native + second-language speakers).
 *
 *   EN · English
 *   ZH · 中文 (Simplified Chinese)
 *   ES · Español
 *   HI · हिन्दी
 *   AR · العربية (RTL)
 *   ID · Bahasa Indonesia (creator's home market)
 *
 * Storage: localStorage key `fb_locale`. Applied on <html lang="..." dir="...">
 * via a boot script in layout.tsx so no flash of English on Arabic first paint.
 *
 * v0.12.0
 */

export type Locale = "en" | "zh" | "es" | "hi" | "ar" | "id";

export const LOCALES: { code: Locale; label: string; native: string; flag: string; rtl?: boolean }[] = [
  { code: "en", label: "English",     native: "English",           flag: "🇬🇧" },
  { code: "zh", label: "Chinese",     native: "中文",              flag: "🇨🇳" },
  { code: "es", label: "Spanish",     native: "Español",           flag: "🇪🇸" },
  { code: "hi", label: "Hindi",       native: "हिन्दी",             flag: "🇮🇳" },
  { code: "ar", label: "Arabic",      native: "العربية",           flag: "🇸🇦", rtl: true },
  { code: "id", label: "Indonesian",  native: "Bahasa Indonesia",  flag: "🇮🇩" },
];

export const DEFAULT_LOCALE: Locale = "en";

/** Translation dictionary. Keys are dot-namespaced. */
const dict: Record<Locale, Record<string, string>> = {
  en: {
    "nav.howItWorks":   "How it works",
    "nav.about":        "About",
    "nav.demo":         "Demo",
    "nav.marketplace":  "Marketplace",
    "nav.docs":         "Docs",
    "nav.github":       "GitHub",
    "nav.client":       "Client",
    "nav.freelancer":   "Freelancer",
    "nav.applications": "Applications",
    "nav.settings":     "Settings",
    "nav.resources":    "Resources",
    "nav.contract":     "Contract on Arc",

    "hero.line1":       "Get paid the",
    "hero.line2":       "moment",
    "hero.line3":       "you",
    "hero.line4":       "deliver.",
    "hero.subtitle1":   "USDC escrow on Arc. AI agent verifies deliverables.",
    "hero.subtitle2":   "Sub-second settlement. Open source. MIT licensed.",
    "hero.script":      "agentic payouts",
    "hero.cta.demo":    "Open live demo",
    "hero.cta.docs":    "Read the docs",

    "stats.arcFinality":     "Arc finality",
    "stats.platformFee":     "Platform fee",
    "stats.asiaFreelancers": "Asia freelancers",
    "stats.vcRaised":        "VC raised",

    "settings.title":         "Settings",
    "settings.subtitle":      "Basic preferences · profile · privacy",
    "settings.profile":       "Profile defaults",
    "settings.profile.desc":  "Shown on every order you post. Local to your browser — never sent to any server unless you attach them.",
    "settings.theme":         "Theme",
    "settings.theme.desc":    "Applies instantly across the whole app. Stored in your browser only.",
    "settings.theme.light":   "Light",
    "settings.theme.dark":    "Dark",
    "settings.theme.system":  "System",
    "settings.language":      "Language",
    "settings.language.desc": "Choose the language for the whole interface. Right-to-left is supported for Arabic.",
    "settings.notif":         "Email notifications",
    "settings.privacy":       "Privacy & security",
    "settings.save":          "Save all settings",
    "settings.saved":         "Saved ✓",

    "action.save":     "Save",
    "action.cancel":   "Cancel",
    "action.close":    "Close",
    "action.continue": "Continue",
    "action.back":     "Back",
    "action.signOut":  "Sign out",

    "footer.mit":     "MIT licensed",
    "footer.opensource": "Open source",
  },
  zh: {
    "nav.howItWorks":   "工作原理",
    "nav.about":        "关于",
    "nav.demo":         "演示",
    "nav.marketplace":  "任务市场",
    "nav.docs":         "文档",
    "nav.github":       "GitHub",
    "nav.client":       "雇主",
    "nav.freelancer":   "自由职业者",
    "nav.applications": "申请",
    "nav.settings":     "设置",
    "nav.resources":    "资源",
    "nav.contract":     "Arc 上的合约",

    "hero.line1":       "交付即",
    "hero.line2":       "刻收",
    "hero.line3":       "你",
    "hero.line4":       "款。",
    "hero.subtitle1":   "Arc 上的 USDC 托管。AI 代理验证交付物。",
    "hero.subtitle2":   "亚秒结算。开源。MIT 许可。",
    "hero.script":      "代理式支付",
    "hero.cta.demo":    "打开演示",
    "hero.cta.docs":    "阅读文档",

    "stats.arcFinality":     "Arc 终局性",
    "stats.platformFee":     "平台费用",
    "stats.asiaFreelancers": "亚洲自由职业者",
    "stats.vcRaised":        "融资金额",

    "settings.title":         "设置",
    "settings.subtitle":      "基本偏好 · 个人资料 · 隐私",
    "settings.profile":       "个人资料默认值",
    "settings.profile.desc":  "显示在你发布的每个任务上。仅本地存储 — 除非你附加,否则永不发送到服务器。",
    "settings.theme":         "主题",
    "settings.theme.desc":    "整个应用即时应用。仅存储在你的浏览器中。",
    "settings.theme.light":   "浅色",
    "settings.theme.dark":    "深色",
    "settings.theme.system":  "跟随系统",
    "settings.language":      "语言",
    "settings.language.desc": "选择整个界面的语言。支持阿拉伯语的从右到左布局。",
    "settings.notif":         "邮件通知",
    "settings.privacy":       "隐私与安全",
    "settings.save":          "保存所有设置",
    "settings.saved":         "已保存 ✓",

    "action.save":     "保存",
    "action.cancel":   "取消",
    "action.close":    "关闭",
    "action.continue": "继续",
    "action.back":     "返回",
    "action.signOut":  "退出",

    "footer.mit":     "MIT 许可",
    "footer.opensource": "开源",
  },
  es: {
    "nav.howItWorks":   "Cómo funciona",
    "nav.about":        "Acerca",
    "nav.demo":         "Demo",
    "nav.marketplace":  "Mercado",
    "nav.docs":         "Documentos",
    "nav.github":       "GitHub",
    "nav.client":       "Cliente",
    "nav.freelancer":   "Freelancer",
    "nav.applications": "Solicitudes",
    "nav.settings":     "Ajustes",
    "nav.resources":    "Recursos",
    "nav.contract":     "Contrato en Arc",

    "hero.line1":       "Cobra en el",
    "hero.line2":       "momento",
    "hero.line3":       "que",
    "hero.line4":       "entregas.",
    "hero.subtitle1":   "Custodia USDC en Arc. El agente de IA verifica entregas.",
    "hero.subtitle2":   "Liquidación en menos de un segundo. Código abierto. Licencia MIT.",
    "hero.script":      "pagos con agentes",
    "hero.cta.demo":    "Abrir demo en vivo",
    "hero.cta.docs":    "Leer documentación",

    "stats.arcFinality":     "Finalidad Arc",
    "stats.platformFee":     "Comisión",
    "stats.asiaFreelancers": "Freelancers Asia",
    "stats.vcRaised":        "Capital VC",

    "settings.title":         "Ajustes",
    "settings.subtitle":      "Preferencias · perfil · privacidad",
    "settings.profile":       "Perfil por defecto",
    "settings.profile.desc":  "Se muestra en cada pedido. Solo en tu navegador — nunca se envía a ningún servidor a menos que lo adjuntes.",
    "settings.theme":         "Tema",
    "settings.theme.desc":    "Se aplica al instante en toda la aplicación. Almacenado solo en tu navegador.",
    "settings.theme.light":   "Claro",
    "settings.theme.dark":    "Oscuro",
    "settings.theme.system":  "Sistema",
    "settings.language":      "Idioma",
    "settings.language.desc": "Elige el idioma de toda la interfaz. Se soporta escritura de derecha a izquierda para árabe.",
    "settings.notif":         "Notificaciones por correo",
    "settings.privacy":       "Privacidad y seguridad",
    "settings.save":          "Guardar todos los ajustes",
    "settings.saved":         "Guardado ✓",

    "action.save":     "Guardar",
    "action.cancel":   "Cancelar",
    "action.close":    "Cerrar",
    "action.continue": "Continuar",
    "action.back":     "Atrás",
    "action.signOut":  "Cerrar sesión",

    "footer.mit":     "Licencia MIT",
    "footer.opensource": "Código abierto",
  },
  hi: {
    "nav.howItWorks":   "यह कैसे काम करता है",
    "nav.about":        "परिचय",
    "nav.demo":         "डेमो",
    "nav.marketplace":  "मार्केटप्लेस",
    "nav.docs":         "दस्तावेज़",
    "nav.github":       "GitHub",
    "nav.client":       "ग्राहक",
    "nav.freelancer":   "फ्रीलांसर",
    "nav.applications": "आवेदन",
    "nav.settings":     "सेटिंग्स",
    "nav.resources":    "संसाधन",
    "nav.contract":     "Arc पर कॉन्ट्रैक्ट",

    "hero.line1":       "जिस पल",
    "hero.line2":       "आप",
    "hero.line3":       "डिलीवर",
    "hero.line4":       "करें, तुरंत भुगतान।",
    "hero.subtitle1":   "Arc पर USDC एस्क्रो। AI एजेंट डिलीवरेबल्स की पुष्टि करता है।",
    "hero.subtitle2":   "उप-सेकंड सेटलमेंट। ओपन सोर्स। MIT लाइसेंस।",
    "hero.script":      "एजेंटिक पेआउट्स",
    "hero.cta.demo":    "लाइव डेमो खोलें",
    "hero.cta.docs":    "दस्तावेज़ पढ़ें",

    "stats.arcFinality":     "Arc अंतिमता",
    "stats.platformFee":     "प्लेटफ़ॉर्म शुल्क",
    "stats.asiaFreelancers": "एशियाई फ्रीलांसर",
    "stats.vcRaised":        "VC फंडिंग",

    "settings.title":         "सेटिंग्स",
    "settings.subtitle":      "प्राथमिकताएं · प्रोफ़ाइल · गोपनीयता",
    "settings.profile":       "प्रोफ़ाइल डिफ़ॉल्ट",
    "settings.profile.desc":  "आपके हर ऑर्डर पर दिखाई देती हैं। केवल आपके ब्राउज़र में — जब तक आप इन्हें संलग्न न करें तब तक कहीं नहीं भेजी जातीं।",
    "settings.theme":         "थीम",
    "settings.theme.desc":    "पूरे ऐप में तुरंत लागू। केवल आपके ब्राउज़र में सहेजी जाती है।",
    "settings.theme.light":   "लाइट",
    "settings.theme.dark":    "डार्क",
    "settings.theme.system":  "सिस्टम",
    "settings.language":      "भाषा",
    "settings.language.desc": "पूरे इंटरफ़ेस के लिए भाषा चुनें। अरबी के लिए दाएँ-से-बाएँ समर्थित है।",
    "settings.notif":         "ईमेल सूचनाएँ",
    "settings.privacy":       "गोपनीयता और सुरक्षा",
    "settings.save":          "सभी सेटिंग्स सहेजें",
    "settings.saved":         "सहेजा गया ✓",

    "action.save":     "सहेजें",
    "action.cancel":   "रद्द",
    "action.close":    "बंद करें",
    "action.continue": "जारी रखें",
    "action.back":     "वापस",
    "action.signOut":  "साइन आउट",

    "footer.mit":     "MIT लाइसेंस",
    "footer.opensource": "ओपन सोर्स",
  },
  ar: {
    "nav.howItWorks":   "كيف يعمل",
    "nav.about":        "حول",
    "nav.demo":         "تجربة",
    "nav.marketplace":  "السوق",
    "nav.docs":         "الوثائق",
    "nav.github":       "GitHub",
    "nav.client":       "العميل",
    "nav.freelancer":   "المستقل",
    "nav.applications": "الطلبات",
    "nav.settings":     "الإعدادات",
    "nav.resources":    "الموارد",
    "nav.contract":     "العقد على Arc",

    "hero.line1":       "احصل على أجرك",
    "hero.line2":       "في اللحظة",
    "hero.line3":       "التي",
    "hero.line4":       "تُسلِّم فيها.",
    "hero.subtitle1":   "ضمان USDC على Arc. وكيل ذكاء اصطناعي يتحقق من التسليم.",
    "hero.subtitle2":   "تسوية أقل من ثانية. مفتوح المصدر. رخصة MIT.",
    "hero.script":      "مدفوعات وكيلية",
    "hero.cta.demo":    "افتح العرض المباشر",
    "hero.cta.docs":    "اقرأ الوثائق",

    "stats.arcFinality":     "نهائية Arc",
    "stats.platformFee":     "رسوم المنصة",
    "stats.asiaFreelancers": "مستقلو آسيا",
    "stats.vcRaised":        "تمويل VC",

    "settings.title":         "الإعدادات",
    "settings.subtitle":      "التفضيلات الأساسية · الملف الشخصي · الخصوصية",
    "settings.profile":       "الافتراضيات",
    "settings.profile.desc":  "تظهر في كل طلب تنشره. محلية في متصفحك — لا تُرسل إلى أي خادم إلا إذا أرفقتها.",
    "settings.theme":         "المظهر",
    "settings.theme.desc":    "يُطبَّق فوراً في التطبيق بأكمله. يُخزَّن في متصفحك فقط.",
    "settings.theme.light":   "فاتح",
    "settings.theme.dark":    "داكن",
    "settings.theme.system":  "النظام",
    "settings.language":      "اللغة",
    "settings.language.desc": "اختر لغة الواجهة بأكملها. مدعوم للعربية من اليمين إلى اليسار.",
    "settings.notif":         "إشعارات البريد",
    "settings.privacy":       "الخصوصية والأمان",
    "settings.save":          "حفظ كل الإعدادات",
    "settings.saved":         "تم الحفظ ✓",

    "action.save":     "حفظ",
    "action.cancel":   "إلغاء",
    "action.close":    "إغلاق",
    "action.continue": "متابعة",
    "action.back":     "رجوع",
    "action.signOut":  "تسجيل الخروج",

    "footer.mit":     "رخصة MIT",
    "footer.opensource": "مفتوح المصدر",
  },
  id: {
    "nav.howItWorks":   "Cara kerja",
    "nav.about":        "Tentang",
    "nav.demo":         "Demo",
    "nav.marketplace":  "Marketplace",
    "nav.docs":         "Dokumen",
    "nav.github":       "GitHub",
    "nav.client":       "Klien",
    "nav.freelancer":   "Freelancer",
    "nav.applications": "Lamaran",
    "nav.settings":     "Pengaturan",
    "nav.resources":    "Sumber",
    "nav.contract":     "Kontrak di Arc",

    "hero.line1":       "Dibayar",
    "hero.line2":       "detik",
    "hero.line3":       "kamu",
    "hero.line4":       "kelarin.",
    "hero.subtitle1":   "Escrow USDC di Arc. AI agent verifikasi hasil kerja.",
    "hero.subtitle2":   "Settlement sub-detik. Open source. Lisensi MIT.",
    "hero.script":      "pembayaran agentic",
    "hero.cta.demo":    "Buka demo langsung",
    "hero.cta.docs":    "Baca dokumen",

    "stats.arcFinality":     "Finalitas Arc",
    "stats.platformFee":     "Biaya platform",
    "stats.asiaFreelancers": "Freelancer Asia",
    "stats.vcRaised":        "Modal VC",

    "settings.title":         "Pengaturan",
    "settings.subtitle":      "Preferensi dasar · profil · privasi",
    "settings.profile":       "Default profil",
    "settings.profile.desc":  "Muncul di setiap order yang kamu posting. Lokal di browser kamu — tidak dikirim ke server manapun kecuali kamu lampirkan.",
    "settings.theme":         "Tema",
    "settings.theme.desc":    "Diterapkan instan di seluruh aplikasi. Disimpan hanya di browser kamu.",
    "settings.theme.light":   "Terang",
    "settings.theme.dark":    "Gelap",
    "settings.theme.system":  "Ikuti sistem",
    "settings.language":      "Bahasa",
    "settings.language.desc": "Pilih bahasa untuk seluruh antarmuka. Bahasa Arab kanan-ke-kiri didukung.",
    "settings.notif":         "Notifikasi email",
    "settings.privacy":       "Privasi & keamanan",
    "settings.save":          "Simpan semua pengaturan",
    "settings.saved":         "Tersimpan ✓",

    "action.save":     "Simpan",
    "action.cancel":   "Batal",
    "action.close":    "Tutup",
    "action.continue": "Lanjut",
    "action.back":     "Kembali",
    "action.signOut":  "Keluar",

    "footer.mit":     "Lisensi MIT",
    "footer.opensource": "Open source",
  },
};

/** Read current locale from localStorage (client-only). */
export function readLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const l = window.localStorage.getItem("fb_locale") as Locale | null;
    if (l && LOCALES.some((x) => x.code === l)) return l;
  } catch {}
  return DEFAULT_LOCALE;
}

/** Write locale, update <html lang/dir>, then reload for full re-render. */
export function setLocale(l: Locale) {
  try { window.localStorage.setItem("fb_locale", l); } catch {}
  const rtl = LOCALES.find((x) => x.code === l)?.rtl;
  if (typeof document !== "undefined") {
    document.documentElement.lang = l;
    document.documentElement.dir  = rtl ? "rtl" : "ltr";
  }
  // full reload keeps every mounted component in sync without a Context ladder
  if (typeof window !== "undefined") window.location.reload();
}

/** Translate a key. Falls back to EN, then to the key itself. */
export function t(key: string, locale?: Locale): string {
  const l = locale ?? readLocale();
  return dict[l]?.[key] ?? dict.en[key] ?? key;
}

/** React hook — reads locale from localStorage on mount and returns t/locale. */
export function useT() {
  const l = typeof window === "undefined" ? DEFAULT_LOCALE : readLocale();
  return {
    locale: l,
    t: (k: string) => t(k, l),
    isRTL: LOCALES.find((x) => x.code === l)?.rtl ?? false,
  };
}
