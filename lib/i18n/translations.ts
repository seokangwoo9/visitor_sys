export type Language = "en" | "ms" | "zh";

export const languages = [
  { code: "en" as const, name: "English", nativeName: "English" },
  { code: "ms" as const, name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "zh" as const, name: "Chinese", nativeName: "简体中文" },
] as const;

export const translations = {
  en: {
    // Language selector
    selectLanguage: "Select Language",

    // Page header
    pageTitle: "Visitor Registration",
    pageSubtitle: "Please complete the form below to check in",

    // Form sections
    personalInformation: "Personal Information",
    vehicle: "Vehicle",
    company: "Company",
    safetyAcknowledgment: "Safety Acknowledgment",
    pdpaConsent: "Personal Data Protection",

    // Field labels
    fullName: "Full Name",
    identificationNumber: "IC / Passport",
    contactNumber: "Phone Number",
    email: "Email",
    noVehicle: "No Vehicle",
    vehiclePlateNumber: "Vehicle Plate Number",
    companyName: "Company Name",
    purposeOfVisit: "Purpose of Visit",
    hostName: "Person to Meet",

    // Placeholders
    enterFullName: "Enter your full name",
    enterIcPassport: "IC or passport number",
    enterPhone: "0123456789",
    enterEmail: "you@company.com",
    enterPlateNumber: "ABC1234",
    enterCompanyName: "Company name",
    enterPurpose: "Briefly describe your visit purpose",
    enterHostName: "Host or PIC name",

    // Safety acknowledgment
    safetyAcknowledgmentCheckbox:
      "I acknowledge that I have read and agree to the Visitor Safety Acknowledgment and Indemnity Form.",

    // PDPA consent
    pdpaConsentCheckbox:
      "I have read and agree to the collection, use, and retention of my personal data in accordance with the Personal Data Protection Act (PDPA).",

    // Buttons
    submitCheckIn: "Submit Check In",
    submitting: "Submitting",

    // Error messages
    defaultError: "Unable to register visitor. Please try again.",
  },
  ms: {
    // Language selector
    selectLanguage: "Pilih Bahasa",

    // Page header
    pageTitle: "Pendaftaran Pelawat",
    pageSubtitle: "Sila lengkapkan borang di bawah untuk daftar masuk",

    // Form sections
    personalInformation: "Maklumat Peribadi",
    vehicle: "Kenderaan",
    company: "Syarikat",
    safetyAcknowledgment: "Pengakuan Keselamatan",
    pdpaConsent: "Perlindungan Data Peribadi",

    // Field labels
    fullName: "Nama Penuh",
    identificationNumber: "IC / Pasport",
    contactNumber: "Nombor Telefon",
    email: "E-mel",
    noVehicle: "Tiada Kenderaan",
    vehiclePlateNumber: "Nombor Plat Kenderaan",
    companyName: "Nama Syarikat",
    purposeOfVisit: "Tujuan Lawatan",
    hostName: "Orang Yang Akan Ditemui",

    // Placeholders
    enterFullName: "Masukkan nama penuh anda",
    enterIcPassport: "Nombor IC atau pasport",
    enterPhone: "0123456789",
    enterEmail: "anda@syarikat.com",
    enterPlateNumber: "ABC1234",
    enterCompanyName: "Nama syarikat",
    enterPurpose: "Terangkan secara ringkas tujuan lawatan anda",
    enterHostName: "Nama tuan rumah atau PIC",

    // Safety acknowledgment
    safetyAcknowledgmentCheckbox:
      "Saya mengakui bahawa saya telah membaca dan bersetuju dengan Borang Pengakuan dan Indemniti Keselamatan Pelawat.",

    // PDPA consent
    pdpaConsentCheckbox:
      "Saya telah membaca dan bersetuju dengan pengumpulan, penggunaan, dan penyimpanan data peribadi saya mengikut Akta Perlindungan Data Peribadi (PDPA).",

    // Buttons
    submitCheckIn: "Hantar Daftar Masuk",
    submitting: "Menghantar",

    // Error messages
    defaultError: "Tidak dapat mendaftar pelawat. Sila cuba lagi.",
  },
  zh: {
    // Language selector
    selectLanguage: "选择语言",

    // Page header
    pageTitle: "访客登记",
    pageSubtitle: "请填写以下表格进行登记",

    // Form sections
    personalInformation: "个人信息",
    vehicle: "车辆",
    company: "公司",
    safetyAcknowledgment: "安全确认",
    pdpaConsent: "个人资料保护",

    // Field labels
    fullName: "全名",
    identificationNumber: "身份证 / 护照",
    contactNumber: "电话号码",
    email: "电子邮箱",
    noVehicle: "无车辆",
    vehiclePlateNumber: "车牌号码",
    companyName: "公司名称",
    purposeOfVisit: "访问目的",
    hostName: "接待人",

    // Placeholders
    enterFullName: "请输入您的全名",
    enterIcPassport: "身份证或护照号码",
    enterPhone: "0123456789",
    enterEmail: "您的邮箱@公司.com",
    enterPlateNumber: "ABC1234",
    enterCompanyName: "公司名称",
    enterPurpose: "简要说明您的访问目的",
    enterHostName: "接待人或负责人姓名",

    // Safety acknowledgment
    safetyAcknowledgmentCheckbox: "我确认已阅读并同意访客安全确认与赔偿表格。",

    // PDPA consent
    pdpaConsentCheckbox:
      "我已阅读并同意根据《个人资料保护法》(PDPA) 收集、使用和保留我的个人资料。",

    // Buttons
    submitCheckIn: "提交登记",
    submitting: "提交中",

    // Error messages
    defaultError: "无法登记访客。请重试。",
  },
} as const;

export type TranslationKeys = keyof (typeof translations)["en"];
