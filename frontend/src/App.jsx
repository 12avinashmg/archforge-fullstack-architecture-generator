import { useState, useCallback, useEffect } from "react";
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState, MarkerType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import axios from "axios";

const API = "http://localhost:8000/api/architecture";

/* ─── Demo Accounts (Login Only — No Registration) ─────────────────────── */
const DEMO_USERS = [
  { email: "rahul@foundryai.com",  password: "Rahul@123",  name: "Rahul Sharma",  phone: "9876543210" },
  { email: "priya@fintech.com",    password: "Priya@123",  name: "Priya Patel",   phone: "9123456780" },
  { email: "admin@foundryai.com",  password: "Admin@123",  name: "Admin User",    phone: "9000000001" },
];

/* ─── Node Registry ────────────────────────────────────────────────────── */
const NODE_REGISTRY = {
  "Auth Vault":                  { color:"#3b82f6", tech:"Spring Security + BCrypt + JWT", why:"BCrypt hashes passwords. JWT issues stateless tokens.", tools:"Java, Spring Boot, jjwt, BCrypt, Redis", protocols:"HTTPS, JWT HS256, OAuth 2.0", rbi:"RBI mandates 2FA. 15-min session timeout." },
  "OTP Service":                 { color:"#2563eb", tech:"Twilio SMS + Redis TTL 300s", why:"6-digit OTP in Redis. Auto-expires 5 min. Single use.", tools:"Java, Twilio SMS API, Redis, SecureRandom", protocols:"TOTP, SMS SMPP, Redis TTL", rbi:"RBI mandates OTP for every transaction above ₹5000." },
  "JWT Token Service":           { color:"#1d4ed8", tech:"jjwt 0.12 + Redis blacklist + HS256", why:"Signs JWT with HS256. Logout adds token to Redis blacklist.", tools:"Java, jjwt, Spring Security, Redis", protocols:"JWT HS256, Bearer Token, Redis blacklist", rbi:"15-min expiry per RBI digital banking circular." },
  "API Gateway":                 { color:"#475569", tech:"Spring Cloud Gateway + Redis Rate Limiter", why:"Single entry point. Blocks DDoS at 100 req/min/IP.", tools:"Java, Spring Cloud Gateway, Redis, Nginx", protocols:"HTTPS, Rate Limiting 100 req/min, SSL/TLS", rbi:"RBI requires IP blacklisting and rate limiting on all payment APIs." },
  "UPI Payment Service":         { color:"#059669", tech:"Spring Boot + NPCI UPI API + VPA Validator", why:"Validates UPI VPA, initiates IMPS settlement via NPCI.", tools:"Java, NPCI UPI SDK, Spring Boot, MySQL", protocols:"UPI 2.0, IMPS settlement, ISO 20022", rbi:"NPCI UPI Guidelines. RBI Payment System Regulation." },
  "QR Code Service":             { color:"#0e7490", tech:"ZXing Library + UPI Deep Link + Spring Boot", why:"ZXing encodes VPA+amount into Bharat QR. Decodes on scan.", tools:"Java, ZXing, Spring Boot, UPI deep link spec", protocols:"UPI QR 2.0, Bharat QR, ZXing Base64", rbi:"NPCI mandates Bharat QR for all QR-based payments." },
  "Fraud Engine":                { color:"#dc2626", tech:"Python Random Forest + FastAPI + Feature Store", why:"15 features: amount, time, location, velocity, device.", tools:"Python, scikit-learn, FastAPI, Redis", protocols:"ML Inference < 200ms, REST API, JSON", rbi:"RBI circular on fraud monitoring for digital payments." },
  "Wallet Service":              { color:"#7c3aed", tech:"Spring Boot REST + PostgreSQL ACID", why:"ACID ensures debit+credit always happen together.", tools:"Java, Spring Boot, PostgreSQL 15, Hibernate JPA", protocols:"REST API, ACID Transactions, @Transactional", rbi:"RBI PPI Master Directions 2021. Max ₹2,00,000." },
  "Redis Balance Cache":         { color:"#b91c1c", tech:"Redis 7.0 + Cache-Aside Pattern", why:"Balance read 1000x/sec. Redis 0.1ms vs MySQL 50ms.", tools:"Redis 7.0, Spring Data Redis, Lettuce", protocols:"Cache-Aside, TTL eviction, Pub/Sub", rbi:"Required for performance SLA compliance." },
  "PostgreSQL Immutable Ledger": { color:"#047857", tech:"PostgreSQL + Append-Only + Write-Ahead Log", why:"Only INSERT. No UPDATE/DELETE. Every rupee permanent.", tools:"PostgreSQL 15, WAL, Spring Data JPA", protocols:"Append-Only, ACID, Write-Ahead Logging", rbi:"RBI requires immutable audit trail for all financial transactions." },
  "Kafka Event Bus":             { color:"#d97706", tech:"Apache Kafka 3.x + Spring Kafka + Zookeeper", why:"Decouples services. Payment events queued independently.", tools:"Apache Kafka 3.x, Spring Kafka, Zookeeper", protocols:"Event-Driven, Pub/Sub, at-least-once delivery", rbi:"Ensures reliability required by RBI standards." },
  "Notification Service":        { color:"#b45309", tech:"Spring Boot + Twilio SMS + Firebase FCM", why:"SMS + push notification within 30s of every transaction.", tools:"Java, Twilio API, Firebase FCM, RabbitMQ", protocols:"FCM Push, SMS SMPP, WebSocket", rbi:"RBI mandates transaction alert within 30 seconds via SMS." },
  "Loan Application Service":    { color:"#92400e", tech:"Spring Boot + MySQL + Spring State Machine", why:"4-step form. Stores partial applications. Resumes on dropout.", tools:"Java, Spring Boot, MySQL, Spring State Machine", protocols:"REST API, multi-step state, HTTPS", rbi:"RBI Fair Practice Code. Loan terms shown before approval." },
  "EMI Calculator Service":      { color:"#78350f", tech:"Spring Boot REST + BigDecimal precision", why:"EMI = P*r*(1+r)^n / ((1+r)^n-1). Server-side precision.", tools:"Java, BigDecimal, Spring Boot REST", protocols:"REST API, JSON, BigDecimal", rbi:"RBI mandates showing full amortization schedule to borrower." },
  "Credit Scoring ML":           { color:"#d97706", tech:"Python XGBoost + Feature Store + FastAPI", why:"Predicts default from CIBIL, income, debt ratio, employment.", tools:"Python, XGBoost, scikit-learn, FastAPI, joblib", protocols:"Inference Pipeline, REST API, JSON", rbi:"RBI Fair Practice Code. Explainable AI required." },
  "KYC Verification":            { color:"#6d28d9", tech:"DigiLocker API + AWS S3 + AES-256", why:"DigiLocker gives verified Aadhaar/PAN directly.", tools:"Java, DigiLocker OAuth API, AWS S3, AES-256", protocols:"DigiLocker OAuth, AES-256, S3 pre-signed URLs", rbi:"RBI KYC Master Directions 2016. Mandatory above ₹50,000." },
  "BBPS Adapter":                { color:"#0e7490", tech:"Spring Boot + NPCI BBPS API", why:"One integration covers all billers: Jio, BESCOM, Airtel.", tools:"Java, NPCI BBPS SDK, Spring Boot, MySQL", protocols:"BBPS API, HTTPS, OAuth 2.0", rbi:"RBI mandated BBPS for standardised bill payments." },
  "NACH Scheduler":              { color:"#164e63", tech:"Spring @Scheduled + NPCI NACH API + Cron", why:"Auto-debit mandate. User authorises once. Bank debits on schedule.", tools:"Java, Spring Scheduler, NPCI NACH API, MySQL", protocols:"NACH Debit Mandate, Cron, Batch", rbi:"RBI requires 3-day pre-debit notification before each NACH debit." },
  "Price Feed Service":          { color:"#9f1239", tech:"NSE WebSocket API + Redis + Spring Boot", why:"NSE pushes ticks every second. Redis caches latest.", tools:"Java, WebSocket client, Redis, Spring Boot", protocols:"WebSocket, NSE FIX Protocol, Redis Pub/Sub", rbi:"SEBI mandates real-time data from registered exchanges only." },
  "WebSocket Server":            { color:"#4c1d95", tech:"Spring WebSocket + STOMP + SockJS", why:"Pushes live prices to React clients. Zero polling overhead.", tools:"Java, Spring WebSocket, STOMP, SockJS", protocols:"WebSocket, STOMP, SockJS fallback", rbi:"Not directly regulated." },
  "Portfolio Tracker":           { color:"#5b21b6", tech:"Spring Boot + PostgreSQL + Redis cache", why:"Tracks holdings, P&L, XIRR. Redis caches for fast loads.", tools:"Java, Spring Boot, PostgreSQL, Redis", protocols:"REST API, XIRR calculation, Cache-Aside", rbi:"SEBI requires portfolio risk categorization per investor." },
  "NLP Categorizer":             { color:"#701a75", tech:"Python Naive Bayes + TF-IDF + FastAPI", why:"ZOMATO→Food, UBER→Transport. Auto-tags every transaction.", tools:"Python, scikit-learn, NLTK, FastAPI, joblib", protocols:"NLP text classification, REST API, JSON", rbi:"Privacy policy must disclose ML categorization." },
  "D3.js Visualization":         { color:"#86198f", tech:"React + D3.js v7 + recharts + WebSocket", why:"Candlestick charts need SVG control — D3 provides it.", tools:"JavaScript, D3.js v7, React, recharts, SVG", protocols:"WebSocket live updates, SVG DOM, Canvas", rbi:"SEBI requires risk warnings on all investment charts." },
};

/* ─── Per-App Architecture Definitions ────────────────────────────────── */
const APP_ARCHITECTURES = {
  // Modules
  auth:         { name:"Login & Auth Module",    pattern:"JWT + BCrypt + OTP",               database:"Redis + MySQL",                  security:"JWT HS256 + BCrypt + OTP",                complexity:"Low",       modules:["Auth Vault","OTP Service","JWT Token Service","API Gateway"] },
  send_money:   { name:"UPI Transfer",           pattern:"NPCI UPI + Kafka Event Bus",        database:"MySQL + Redis",                  security:"JWT + OTP + Fraud ML",                    complexity:"Medium",    modules:["API Gateway","UPI Payment Service","Fraud Engine","Kafka Event Bus","Notification Service","PostgreSQL Immutable Ledger"] },
  qr_payment:   { name:"QR Code Payment",        pattern:"ZXing + Bharat QR 2.0",            database:"MySQL",                          security:"JWT + NPCI Bharat QR",                    complexity:"Medium",    modules:["API Gateway","QR Code Service","UPI Payment Service","Kafka Event Bus","Notification Service"] },
  wallet:       { name:"Wallet Service",         pattern:"ACID + Cache-Aside Pattern",       database:"PostgreSQL + Redis",             security:"JWT + BCrypt",                            complexity:"Medium",    modules:["API Gateway","Wallet Service","Redis Balance Cache","PostgreSQL Immutable Ledger","Kafka Event Bus","Notification Service"] },
  loan:         { name:"Loan Application",       pattern:"ML Scoring + DigiLocker KYC",      database:"MySQL + PostgreSQL",             security:"KYC + DigiLocker OAuth",                  complexity:"High",      modules:["API Gateway","Loan Application Service","EMI Calculator Service","Credit Scoring ML","KYC Verification","PostgreSQL Immutable Ledger"] },
  bbps:         { name:"Bill Payment (BBPS)",    pattern:"BBPS + NACH Batch Processing",     database:"MySQL + Redis",                  security:"NACH mandate + bank verification",        complexity:"Medium",    modules:["API Gateway","BBPS Adapter","NACH Scheduler","Notification Service","PostgreSQL Immutable Ledger"] },
  price_feed:   { name:"Live NSE Price Feed",    pattern:"WebSocket + Redis Pub/Sub",        database:"Redis TimeSeries + PostgreSQL",   security:"SEBI compliant + JWT",                    complexity:"Medium",    modules:["Price Feed Service","Redis Balance Cache","WebSocket Server","Portfolio Tracker","D3.js Visualization"] },
  // 5 Full Applications
  digital_wallet:    { name:"Digital Wallet App",                pattern:"Event-Driven Microservices",              database:"PostgreSQL 15 + Redis 7",             security:"JWT HS256 + BCrypt + OTP",              complexity:"High",      modules:["Auth Vault","API Gateway","Wallet Service","Redis Balance Cache","UPI Payment Service","Kafka Event Bus","Notification Service","PostgreSQL Immutable Ledger"] },
  p2p_payment:       { name:"P2P Payment Gateway",               pattern:"NPCI UPI + Fraud ML + Kafka",             database:"MySQL + Redis",                        security:"JWT + BCrypt + OTP + Fraud ML",         complexity:"High",      modules:["Auth Vault","API Gateway","UPI Payment Service","QR Code Service","Fraud Engine","Kafka Event Bus","Notification Service","PostgreSQL Immutable Ledger"] },
  ai_lending:        { name:"AI Lending Platform",               pattern:"ML Scoring + DigiLocker Pipeline",       database:"MySQL + PostgreSQL + Redis",           security:"JWT + KYC + DigiLocker OAuth",          complexity:"High",      modules:["Auth Vault","API Gateway","Loan Application Service","Credit Scoring ML","KYC Verification","EMI Calculator Service","Kafka Event Bus","PostgreSQL Immutable Ledger"] },
  bill_manager:      { name:"Bill & Subscription Manager",       pattern:"BBPS + NACH Batch Processing",           database:"MySQL + Redis",                        security:"NACH mandate + bank verification",      complexity:"Medium",    modules:["Auth Vault","API Gateway","BBPS Adapter","NACH Scheduler","Notification Service","PostgreSQL Immutable Ledger"] },
  finance_analytics: { name:"Financial Analytics Dashboard",    pattern:"WebSocket + ML + D3.js Pipeline",        database:"PostgreSQL + Redis TimeSeries",        security:"SEBI compliant + JWT",                  complexity:"High",      modules:["Auth Vault","API Gateway","Price Feed Service","WebSocket Server","Portfolio Tracker","NLP Categorizer","D3.js Visualization","PostgreSQL Immutable Ledger"] },
  // Combos
  wallet_payment:    { name:"Wallet + Payments Platform",        pattern:"Event-Driven + ACID + Fraud ML",         database:"PostgreSQL 15 + MySQL + Redis 7",      security:"JWT HS256 + BCrypt + OTP + Fraud ML",   complexity:"High",      modules:["Auth Vault","API Gateway","Wallet Service","Redis Balance Cache","UPI Payment Service","QR Code Service","Fraud Engine","Kafka Event Bus","Notification Service","PostgreSQL Immutable Ledger"] },
  payment_lending:   { name:"Payments + Lending Platform",       pattern:"Microservices + ML Scoring",             database:"MySQL + PostgreSQL + Redis",           security:"JWT + KYC + Fraud ML",                  complexity:"High",      modules:["Auth Vault","API Gateway","UPI Payment Service","Fraud Engine","Loan Application Service","Credit Scoring ML","KYC Verification","Kafka Event Bus","Notification Service","PostgreSQL Immutable Ledger"] },
  full_platform:     { name:"Complete Fintech Platform",         pattern:"Full-Stack Microservices",               database:"PostgreSQL + MySQL + Redis + Kafka",   security:"JWT + BCrypt + OTP + Fraud ML + KYC",   complexity:"Very High", modules:["Auth Vault","API Gateway","Wallet Service","UPI Payment Service","QR Code Service","Fraud Engine","Loan Application Service","Credit Scoring ML","KYC Verification","BBPS Adapter","NACH Scheduler","Price Feed Service","WebSocket Server","Portfolio Tracker","NLP Categorizer","Kafka Event Bus","Notification Service","PostgreSQL Immutable Ledger"] },
};

/* ─── Dropdown Options ─────────────────────────────────────────────────── */
const DROPDOWN = {
  modules: [
    { id:"auth",       name:"Login & Registration",       type:"auth" },
    { id:"send_money", name:"Send Money (UPI Transfer)",  type:"send_money" },
    { id:"qr_payment", name:"QR Code Payment",            type:"qr_payment" },
    { id:"wallet",     name:"Wallet Balance & Top Up",    type:"wallet" },
    { id:"loan",       name:"Loan Application Form",      type:"loan" },
    { id:"bbps",       name:"Bill Payment (BBPS)",        type:"bbps" },
    { id:"price_feed", name:"Live NSE Price Feed",        type:"price_feed" },
  ],
  full_apps: [
    { id:"digital_wallet",    name:"Digital Wallet App",                type:"digital_wallet" },
    { id:"p2p_payment",       name:"P2P Payment Gateway",               type:"p2p_payment" },
    { id:"ai_lending",        name:"AI Lending Platform",               type:"ai_lending" },
    { id:"bill_manager",      name:"Bill & Subscription Manager",       type:"bill_manager" },
    { id:"finance_analytics", name:"Financial Analytics Dashboard",     type:"finance_analytics" },
  ],
  combinations: [
    { id:"wallet_payment",  name:"Wallet + Payments",          type:"wallet_payment" },
    { id:"payment_lending", name:"Payments + Lending",         type:"payment_lending" },
    { id:"full_platform",   name:"Complete Fintech Platform",  type:"full_platform" },
  ],
};

/* ─── Helper: getNodeInfo ──────────────────────────────────────────────── */
function getNodeInfo(label) {
  if (NODE_REGISTRY[label]) return NODE_REGISTRY[label];
  const key = Object.keys(NODE_REGISTRY).find(k =>
    label.toLowerCase().includes(k.toLowerCase().split(" ")[0]) ||
    k.toLowerCase().includes(label.toLowerCase().split(" ")[0])
  );
  return key ? NODE_REGISTRY[key] : { color:"#3b82f6", tech:"Spring Boot", why:"Core component.", tools:"Java, Spring Boot", protocols:"REST API, HTTPS", rbi:"Subject to applicable RBI/SEBI regulations." };
}

/* ─── Helper: buildNodes (fixed grid layout, all nodes visible) ───────── */
function buildNodes(modules) {
  if (!modules || modules.length === 0) return { nodes: [], edges: [] };
  const COLS = 3, W = 195, H = 58, XG = 48, YG = 60, XO = 36, YO = 40;
  const nodes = modules.map((label, i) => {
    const info = getNodeInfo(label);
    const col = i % COLS, row = Math.floor(i / COLS);
    return {
      id: `n${i}`,
      position: { x: XO + col * (W + XG), y: YO + row * (H + YG) },
      data: { label, color: info.color, tech: info.tech, why: info.why, tools: info.tools, protocols: info.protocols, rbi: info.rbi },
      style: {
        background: info.color,
        color: "#fff",
        border: "1.5px solid rgba(255,255,255,0.18)",
        borderRadius: 10,
        padding: "11px 14px",
        fontWeight: 700,
        fontSize: 13,
        width: W,
        minHeight: H,
        boxShadow: `0 4px 18px ${info.color}55`,
        cursor: "pointer",
      },
    };
  });
  const edges = nodes.slice(0, -1).map((_, i) => ({
    id: `e${i}`,
    source: `n${i}`,
    target: `n${i + 1}`,
    animated: true,
    type: "smoothstep",
    style: { stroke: "#38bdf8", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#38bdf8", width: 16, height: 16 },
  }));
  return { nodes, edges };
}

/* ─── Helper: detectType ───────────────────────────────────────────────── */
function detectType(q) {
  if (!q) return null;
  q = q.toLowerCase();
  const has = (...w) => w.some(x => q.includes(x));
  if (has("complete","full platform","all modules","everything","banking suite","full fintech","entire platform")) return "full_platform";
  if (has("digital wallet","wallet app","complete wallet")) return "digital_wallet";
  if (has("p2p","payment gateway","upi app","upi payment app")) return "p2p_payment";
  if (has("lending platform","loan platform","credit platform","ai lending","loan app","lending app")) return "ai_lending";
  if (has("bill manager","bill management","subscription manager","bill app")) return "bill_manager";
  if (has("finance analytics","financial analytics","analytics dashboard","investment dashboard","financial dashboard")) return "finance_analytics";
  const wWallet = has("wallet","balance","top up","topup","add money");
  const wPay    = has("send money","transfer","upi","payment","pay","transaction");
  const wQR     = has("qr","scan","bharat qr");
  const wLoan   = has("loan","emi","borrow","lend","credit score","lending","credit");
  const wBill   = has("bill","electricity","recharge","bbps","auto pay","subscription","utility");
  const wAnalyt = has("analytics","portfolio","invest","stock","nse","live price","chart","market","wealth");
  const wAuth   = has("login","register","signup","auth","otp","sign in","user management");
  if (wWallet && (wPay || wQR)) return "wallet_payment";
  if ((wPay || wWallet) && wLoan) return "payment_lending";
  if (wLoan)   return "ai_lending";
  if (wWallet) return "digital_wallet";
  if (wQR)     return "qr_payment";
  if (wPay)    return "p2p_payment";
  if (wBill)   return "bill_manager";
  if (wAnalyt) return "finance_analytics";
  if (wAuth)   return "auth";
  return null;
}

/* ─── Page → Node Map ──────────────────────────────────────────────────── */
const PAGE_NODE_MAP = {
  login:         ["Auth Vault", "JWT Token Service"],
  register:      ["Auth Vault", "OTP Service"],
  dashboard:     ["API Gateway"],
  send_money:    ["UPI Payment Service", "Fraud Engine", "Kafka Event Bus"],
  qr_pay:        ["QR Code Service", "UPI Payment Service"],
  top_up:        ["Wallet Service", "Redis Balance Cache"],
  wallet:        ["Wallet Service", "Redis Balance Cache"],
  transactions:  ["PostgreSQL Immutable Ledger"],
  ledger:        ["PostgreSQL Immutable Ledger"],
  loan_apply:    ["Loan Application Service", "Credit Scoring ML"],
  credit_score:  ["Credit Scoring ML"],
  kyc:           ["KYC Verification"],
  my_loans:      ["Loan Application Service", "EMI Calculator Service"],
  pay_bill:      ["BBPS Adapter"],
  add_bill:      ["BBPS Adapter"],
  auto_pay:      ["NACH Scheduler"],
  live_prices:   ["Price Feed Service", "WebSocket Server"],
  portfolio:     ["Portfolio Tracker"],
  analytics:     ["NLP Categorizer", "D3.js Visualization"],
  notifications: ["Notification Service"],
};

/* ─── Base Styles ──────────────────────────────────────────────────────── */
const S = {
  page:  { padding:"26px 30px", maxWidth:540, margin:"0 auto" },
  card:  { background:"#0d1b2e", borderRadius:14, padding:"20px 24px", marginBottom:16, border:"1px solid #1e3a5f" },
  input: { width:"100%", background:"#070e1a", border:"1px solid #1e3a5f", borderRadius:10, padding:"12px 16px", color:"#f1f5f9", fontSize:15, outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
  label: { display:"block", fontSize:11, color:"#64748b", fontWeight:700, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.08em" },
  row:   { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:"1px solid #0d1b2e", fontSize:14 },
  h1:    { fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:22, marginTop:0 },
  h3:    { fontSize:17, fontWeight:700, color:"#f1f5f9", marginBottom:16, marginTop:0 },
  badge: (c) => ({ background:`${c}22`, border:`1px solid ${c}55`, color:c, padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 }),
};
const btn = (bg, extra={}) => ({
  padding:"13px 22px", borderRadius:10, border:"none", color:"#fff",
  fontWeight:700, fontSize:15, cursor:"pointer", background:bg, width:"100%", fontFamily:"inherit", ...extra,
});

/* ─── AppShell ─────────────────────────────────────────────────────────── */
function AppShell({ nav, accent, appName, logo, activePage, children }) {
  return (
    <div style={{ display:"flex", height:"100%", overflow:"hidden" }}>
      <div style={{ width:200, minWidth:200, background:"#05090f", borderRight:"1px solid #1e2d3d", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"18px 16px", borderBottom:"1px solid #1e2d3d", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontSize:26, filter:`drop-shadow(0 0 8px ${accent})` }}>{logo}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:"#f1f5f9" }}>{appName}</div>
            <div style={{ fontSize:11, color:"#475569" }}>● Live</div>
          </div>
        </div>
        <nav style={{ flex:1, padding:"10px 8px", overflowY:"auto" }}>
          {nav.map(n => (
            <button key={n.key} onClick={n.onClick} style={{
              width:"100%", display:"flex", alignItems:"center", gap:10,
              padding:"11px 14px", borderRadius:10, border:"none", cursor:"pointer", marginBottom:3,
              background: activePage === n.key ? `${accent}28` : "transparent",
              color: activePage === n.key ? accent : "#94a3b8",
              fontWeight: activePage === n.key ? 700 : 400,
              fontSize:14, textAlign:"left", fontFamily:"inherit",
            }}>
              <span style={{ fontSize:18 }}>{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding:"12px 16px", borderTop:"1px solid #1e2d3d", fontSize:11, color:"#1e3a5f" }}>⬡ Arch tracing on</div>
      </div>
      <div style={{ flex:1, overflowY:"auto", background:"#080f1c" }}>{children}</div>
    </div>
  );
}

/* ─── LoginScreen (Login Only — No Register) ───────────────────────────── */
function LoginScreen({ accent, appName, logo, tagline, onLogin }) {
  const [f, setF] = useState({ email:"", password:"" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = () => {
    setErr("");
    if (!f.email || !f.password) { setErr("Please enter your email and password"); return; }
    const user = DEMO_USERS.find(u => u.email === f.email && u.password === f.password);
    if (!user) { setErr("Invalid credentials. Click a demo account below to fill in."); return; }
    setBusy(true);
    setTimeout(() => { setBusy(false); onLogin(user.name); }, 700);
  };

  const glow = { boxShadow:`0 0 0 2px ${accent}55, inset 0 0 0 1px ${accent}22` };

  return (
    <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#020912 0%,#04101e 60%,#020912 100%)", padding:24 }}>
      <div style={{ ...S.card, maxWidth:420, width:"100%", padding:36, border:`1px solid ${accent}33` }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:52, marginBottom:10, filter:`drop-shadow(0 0 16px ${accent})` }}>{logo}</div>
          <h1 style={{ color:"#f1f5f9", fontSize:26, fontWeight:900, margin:"0 0 6px" }}>{appName}</h1>
          <p style={{ color:"#64748b", fontSize:15, margin:0 }}>{tagline}</p>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={S.label}>Email Address</label>
          <input
            placeholder="Enter your email"
            value={f.email}
            onChange={e => setF({ ...f, email: e.target.value })}
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{ ...S.input, ...(f.email ? glow : {}) }}
          />
        </div>
        <div style={{ marginBottom:18 }}>
          <label style={S.label}>Password</label>
          <input
            type="password"
            placeholder="Enter password"
            value={f.password}
            onChange={e => setF({ ...f, password: e.target.value })}
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{ ...S.input, ...(f.password ? glow : {}) }}
          />
        </div>

        {err && (
          <div style={{ color:"#f87171", fontSize:13, background:"#dc262618", border:"1px solid #dc262640", padding:"10px 14px", borderRadius:8, marginBottom:16, textAlign:"center" }}>
            {err}
          </div>
        )}

        <button onClick={submit} disabled={busy} style={{ ...btn(`linear-gradient(135deg,${accent},${accent}cc)`), boxShadow:`0 4px 20px ${accent}44`, opacity: busy ? 0.75 : 1 }}>
          {busy ? "Signing in…" : "Sign In →"}
        </button>

        <div style={{ marginTop:20, background:"#070e1a", borderRadius:10, padding:16, border:"1px solid #1e3a5f" }}>
          <p style={{ color:"#475569", fontSize:11, fontWeight:700, marginBottom:12, marginTop:0, textTransform:"uppercase", letterSpacing:"0.07em" }}>Demo Accounts — Click to fill</p>
          {DEMO_USERS.map(u => (
            <div key={u.email} onClick={() => setF({ email: u.email, password: u.password })} style={{ padding:"9px 0", borderBottom:"1px solid #0d1b2e", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ color:accent, fontWeight:700, fontSize:14 }}>{u.name}</span>
              <span style={{ color:"#475569", fontSize:12 }}>{u.email}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   INDIVIDUAL MODULES
═══════════════════════════════════════════════════════════════════════ */

function ModuleAuth({ onPage }) {
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  if (done) return (
    <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:"#080f1c" }}>
      <div style={{ ...S.card, maxWidth:380, width:"100%", padding:40, textAlign:"center" }}>
        <div style={{ fontSize:60, marginBottom:16 }}>🎉</div>
        <h2 style={{ color:"#f1f5f9", fontWeight:900, fontSize:22, marginBottom:10 }}>Welcome, {name}!</h2>
        <p style={{ color:"#64748b", fontSize:15, marginBottom:24 }}>Authentication successful</p>
        <div style={{ background:"#070e1a", borderRadius:10, padding:16, marginBottom:22, border:"1px solid #1e3a5f" }}>
          {[["JWT Token","Issued ✓"],["BCrypt Hash","Secured ✓"],["Session","Active (15 min)"],["OTP","Verified ✓"]].map(([k,v]) => (
            <div key={k} style={S.row}><span style={{ color:"#64748b" }}>{k}</span><span style={{ color:"#22c55e", fontWeight:700 }}>{v}</span></div>
          ))}
        </div>
        <button onClick={() => { setDone(false); setName(""); }} style={btn("#1e3a5f")}>Sign Out</button>
      </div>
    </div>
  );
  return <LoginScreen accent="#3b82f6" appName="FoundryAuth" logo="🔐" tagline="Secure authentication module" onLogin={n => { setDone(true); setName(n); onPage("dashboard"); }} />;
}

function ModuleSendMoney({ onPage }) {
  const [f, setF] = useState({ upi:"", amount:"", note:"" });
  const [step, setStep] = useState("form");
  const [txnId, setTxnId] = useState("");
  useEffect(() => { onPage("send_money"); }, []);
  const send = () => {
    if (!f.upi || !f.amount || +f.amount <= 0) return;
    setStep("sending"); onPage("send_money");
    setTimeout(() => { setTxnId("UPI" + Date.now().toString().slice(-8)); setStep("done"); }, 2000);
  };
  return (
    <div style={S.page}>
      {step === "form" && <>
        <h1 style={S.h1}>💸 Send Money via UPI</h1>
        <div style={S.card}>
          <div style={{ marginBottom:14 }}><label style={S.label}>Recipient UPI ID</label><input placeholder="e.g. name@okicici" value={f.upi} onChange={e => setF({ ...f, upi: e.target.value })} style={S.input} /></div>
          <div style={{ marginBottom:14 }}><label style={S.label}>Amount (₹)</label><input type="number" min="1" placeholder="0.00" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} style={{ ...S.input, fontSize:28, fontWeight:800 }} /></div>
          <div style={{ marginBottom:22 }}><label style={S.label}>Remarks (optional)</label><input placeholder="Rent, Groceries…" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} style={S.input} /></div>
          {f.upi && f.amount && +f.amount > 0 && (
            <div style={{ background:"#070e1a", borderRadius:10, padding:14, marginBottom:18, border:"1px solid #1e3a5f" }}>
              <div style={S.row}><span style={{ color:"#64748b" }}>To</span><span style={{ color:"#f1f5f9", fontWeight:700 }}>{f.upi}</span></div>
              <div style={S.row}><span style={{ color:"#64748b" }}>Amount</span><span style={{ color:"#22c55e", fontWeight:800, fontSize:20 }}>₹{(+f.amount).toLocaleString("en-IN")}</span></div>
              {f.note && <div style={S.row}><span style={{ color:"#64748b" }}>Note</span><span style={{ color:"#f1f5f9" }}>{f.note}</span></div>}
            </div>
          )}
          <button onClick={send} disabled={!f.upi || !f.amount} style={{ ...btn("#059669"), opacity:(!f.upi || !f.amount) ? 0.45 : 1 }}>Pay ₹{f.amount || "0"} →</button>
        </div>
      </>}
      {step === "sending" && (
        <div style={{ ...S.card, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:52, marginBottom:16 }}>⚡</div>
          <h3 style={{ color:"#f8fafc", fontSize:20, fontWeight:700 }}>Processing Payment…</h3>
          <p style={{ color:"#64748b", fontSize:14 }}>NPCI UPI rails processing your transfer</p>
        </div>
      )}
      {step === "done" && (
        <div style={{ ...S.card, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
          <h3 style={{ color:"#22c55e", fontSize:24, fontWeight:900, marginBottom:10 }}>Payment Successful!</h3>
          <p style={{ color:"#94a3b8", marginBottom:6, fontSize:15 }}>₹{(+f.amount).toLocaleString("en-IN")} sent to {f.upi}</p>
          <p style={{ color:"#475569", fontSize:13, marginBottom:28 }}>Txn ID: {txnId}</p>
          <button onClick={() => { setStep("form"); setF({ upi:"", amount:"", note:"" }); setTxnId(""); }} style={btn("#1e3a5f")}>Make Another Payment</button>
        </div>
      )}
    </div>
  );
}

function ModuleQRPayment({ onPage }) {
  const [tab, setTab] = useState("scan");
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [paid, setPaid] = useState(false);
  const [txnId, setTxnId] = useState("");
  useEffect(() => { onPage("qr_pay"); }, []);
  const confirmPay = () => {
    if (!amount || +amount <= 0) return;
    setTimeout(() => { setTxnId("QR" + Date.now().toString().slice(-8)); setPaid(true); }, 1500);
  };
  return (
    <div style={S.page}>
      <h1 style={S.h1}>📷 QR Code Payment</h1>
      <div style={{ display:"flex", background:"#070e1a", borderRadius:10, padding:4, marginBottom:20, border:"1px solid #1e3a5f" }}>
        {[["scan","📷 Scan & Pay"],["receive","🖨️ My QR"]].map(([k,l]) => (
          <button key={k} onClick={() => { setTab(k); setPaid(false); setAmount(""); }} style={{ flex:1, padding:"10px 0", borderRadius:8, border:"none", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit", background: tab===k ? "#0e7490" : "transparent", color: tab===k ? "#fff" : "#64748b" }}>{l}</button>
        ))}
      </div>
      {tab === "scan" && !paid && (
        <div style={S.card}>
          <div style={{ background:"#070e1a", borderRadius:12, padding:36, textAlign:"center", marginBottom:20, border:"2px dashed #1e3a5f" }}>
            <div style={{ fontSize:72, marginBottom:10 }}>📷</div>
            <p style={{ color:"#64748b", fontSize:14 }}>Point camera at any Bharat QR / UPI QR</p>
            <div style={{ marginTop:14, background:"#04080f", borderRadius:10, padding:12, textAlign:"left" }}>
              {[["Merchant","Demo Store"],["UPI ID","merchant@oksbi"],["Verified","✓ NPCI Bharat QR"]].map(([k,v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"5px 0" }}><span style={{ color:"#64748b" }}>{k}</span><span style={{ color:k==="Verified"?"#22c55e":"#f1f5f9", fontWeight:700 }}>{v}</span></div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:20 }}><label style={S.label}>Enter Amount (₹)</label><input type="number" min="1" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...S.input, fontSize:26, fontWeight:800 }} /></div>
          <button onClick={confirmPay} disabled={!amount || +amount <= 0} style={{ ...btn("#0e7490"), opacity:(!amount || +amount <= 0) ? 0.45 : 1 }}>Pay ₹{amount || "0"} via QR</button>
        </div>
      )}
      {tab === "scan" && paid && (
        <div style={{ ...S.card, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
          <h3 style={{ color:"#22c55e", fontSize:22, fontWeight:900 }}>QR Payment Done!</h3>
          <p style={{ color:"#94a3b8", marginTop:10, marginBottom:6, fontSize:15 }}>₹{(+amount).toLocaleString("en-IN")} paid to Demo Store</p>
          <p style={{ color:"#475569", fontSize:13, marginBottom:28 }}>Txn: {txnId} • ZXing decoded • NPCI settled</p>
          <button onClick={() => { setPaid(false); setAmount(""); }} style={btn("#1e3a5f")}>Pay Another QR</button>
        </div>
      )}
      {tab === "receive" && (
        <div style={S.card}>
          <div style={{ marginBottom:14 }}><label style={S.label}>Your UPI ID</label><input placeholder="yourname@okicici" value={upiId} onChange={e => setUpiId(e.target.value)} style={S.input} /></div>
          <div style={{ marginBottom:20 }}><label style={S.label}>Amount to Receive (₹) — optional</label><input type="number" min="0" placeholder="Leave blank for any amount" value={amount} onChange={e => setAmount(e.target.value)} style={S.input} /></div>
          {upiId ? (
            <div style={{ background:"#070e1a", borderRadius:14, padding:28, textAlign:"center", border:"1px solid #1e3a5f" }}>
              <div style={{ width:140, height:140, background:"#1e2d3d", borderRadius:12, margin:"0 auto 14px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:64, border:"2px solid #1e3a5f" }}>▦</div>
              <p style={{ color:"#f8fafc", fontWeight:800, fontSize:15 }}>{upiId}</p>
              {amount && +amount > 0 && <p style={{ color:"#22c55e", fontWeight:700, marginTop:6, fontSize:16 }}>₹{(+amount).toLocaleString("en-IN")}</p>}
              <p style={{ color:"#475569", fontSize:12, marginTop:8 }}>ZXing-encoded UPI QR • Bharat QR 2.0 compliant</p>
            </div>
          ) : <div style={{ textAlign:"center", padding:"20px 0", color:"#334155", fontSize:14 }}>Enter your UPI ID to generate QR</div>}
        </div>
      )}
    </div>
  );
}

function ModuleWallet({ onPage }) {
  const [balance, setBalance] = useState(0);
  const [method, setMethod] = useState("");
  const [topupAmt, setTopupAmt] = useState("");
  const [history, setHistory] = useState([]);
  const [flash, setFlash] = useState("");
  useEffect(() => { onPage("wallet"); }, []);
  const topup = () => {
    if (!topupAmt || !method || +topupAmt <= 0) return;
    onPage("top_up");
    setTimeout(() => {
      const amt = +topupAmt;
      setBalance(b => +(b + amt).toFixed(2));
      setHistory(h => [{ id:Date.now(), method, amount:amt, time:new Date().toLocaleTimeString() }, ...h]);
      setFlash(`✅ ₹${amt.toLocaleString("en-IN")} added via ${method}!`);
      setTopupAmt(""); setMethod("");
      setTimeout(() => setFlash(""), 3000);
    }, 1500);
  };
  return (
    <div style={S.page}>
      <h1 style={S.h1}>💳 Wallet Balance & Top Up</h1>
      {flash && <div style={{ background:"#05966920", border:"1px solid #059669", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"#22c55e", fontSize:14, fontWeight:700 }}>{flash}</div>}
      <div style={{ background:"linear-gradient(135deg,#7c3aed,#1d4ed8)", borderRadius:20, padding:30, marginBottom:20, textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:-20, top:-20, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />
        <p style={{ color:"rgba(255,255,255,0.65)", fontSize:14, marginBottom:6 }}>Available Balance</p>
        <p style={{ fontSize:46, fontWeight:900, color:"#fff", margin:"6px 0" }}>₹{balance.toLocaleString("en-IN", { minimumFractionDigits:2 })}</p>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:12, marginTop:8 }}>RBI PPI • Max ₹2,00,000 • Full KYC</p>
      </div>
      <div style={S.card}>
        <h3 style={S.h3}>Add Money to Wallet</h3>
        <label style={S.label}>Quick Amounts</label>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
          {[100,500,1000,2000,5000].map(a => (
            <button key={a} onClick={() => setTopupAmt(String(a))} style={{ padding:"9px 18px", borderRadius:8, border:`1px solid ${topupAmt == a ? "#7c3aed":"#1e3a5f"}`, background: topupAmt == a ? "#7c3aed25":"transparent", color: topupAmt == a ? "#a78bfa":"#94a3b8", cursor:"pointer", fontWeight:700, fontSize:14, fontFamily:"inherit" }}>₹{a}</button>
          ))}
        </div>
        <div style={{ marginBottom:16 }}><label style={S.label}>Or Enter Amount</label><input type="number" min="1" placeholder="Enter amount" value={topupAmt} onChange={e => setTopupAmt(e.target.value)} style={{ ...S.input, fontSize:22, fontWeight:700 }} /></div>
        <div style={{ marginBottom:20 }}>
          <label style={S.label}>Payment Method</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {["UPI","Net Banking","Debit Card","Credit Card"].map(m => (
              <button key={m} onClick={() => setMethod(m)} style={{ padding:"13px", borderRadius:10, border:`1px solid ${method===m?"#7c3aed":"#1e3a5f"}`, background: method===m ? "#7c3aed25":"#070e1a", color: method===m ? "#a78bfa":"#94a3b8", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"inherit" }}>{m}</button>
            ))}
          </div>
        </div>
        <button onClick={topup} disabled={!topupAmt||!method||+topupAmt<=0} style={{ ...btn("#7c3aed"), opacity:(!topupAmt||!method||+topupAmt<=0)?0.45:1 }}>Add ₹{topupAmt||"0"} to Wallet</button>
      </div>
      {history.length > 0 && (
        <div style={S.card}>
          <h3 style={S.h3}>Top Up History</h3>
          {history.map(h => (
            <div key={h.id} style={S.row}>
              <div><p style={{ color:"#f1f5f9", fontWeight:600, fontSize:14, margin:0 }}>Added via {h.method}</p><p style={{ color:"#475569", fontSize:12, margin:0 }}>{h.time}</p></div>
              <span style={{ color:"#22c55e", fontWeight:800, fontSize:15 }}>+₹{h.amount.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModuleLoan({ onPage }) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ name:"", income:"", employment:"Salaried", company:"", amount:"", tenure:12, purpose:"Personal" });
  const [result, setResult] = useState(null);
  const [scoring, setScoring] = useState(false);
  useEffect(() => { onPage("loan_apply"); }, []);
  const emi = f.amount && f.tenure ? Math.round((+f.amount * 0.01 * Math.pow(1.01, +f.tenure)) / (Math.pow(1.01, +f.tenure) - 1)) : 0;
  const apply = () => {
    setScoring(true); onPage("loan_apply");
    setTimeout(() => {
      const score = Math.floor(Math.random() * 300 + 550);
      const approved = score > 650 && +f.income > 20000;
      setResult({ score, approved, emi, rate: approved ? +(10 + Math.random() * 4).toFixed(1) : null });
      setStep(4); setScoring(false);
    }, 2800);
  };
  const STEPS = ["Personal","Loan","Review","Decision"];
  const accent = "#d97706";
  return (
    <div style={S.page}>
      <h1 style={S.h1}>📝 Loan Application</h1>
      <div style={{ display:"flex", gap:6, marginBottom:24 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex:1 }}>
            <div style={{ height:4, borderRadius:2, background: step > i+1 ? accent : step === i+1 ? accent : "#1e3a5f", marginBottom:5 }} />
            <span style={{ fontSize:11, color: step >= i+1 ? accent : "#475569", fontWeight:600 }}>{s}</span>
          </div>
        ))}
      </div>
      {step === 1 && (
        <div style={S.card}>
          <div style={{ marginBottom:14 }}><label style={S.label}>Full Name</label><input placeholder="As on PAN card" value={f.name} onChange={e => setF({ ...f, name:e.target.value })} style={S.input} /></div>
          <div style={{ marginBottom:14 }}><label style={S.label}>Monthly Income (₹)</label><input type="number" min="0" placeholder="50000" value={f.income} onChange={e => setF({ ...f, income:e.target.value })} style={S.input} /></div>
          <div style={{ marginBottom:14 }}>
            <label style={S.label}>Employment Type</label>
            <div style={{ display:"flex", gap:8 }}>
              {["Salaried","Self-Employed","Business"].map(e => (
                <button key={e} onClick={() => setF({ ...f, employment:e })} style={{ flex:1, padding:"10px 0", borderRadius:8, border:`1px solid ${f.employment===e?accent:"#1e3a5f"}`, background: f.employment===e?`${accent}25`:"#070e1a", color: f.employment===e?"#fbbf24":"#94a3b8", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit" }}>{e}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:20 }}><label style={S.label}>Company / Employer</label><input placeholder="Employer name" value={f.company} onChange={e => setF({ ...f, company:e.target.value })} style={S.input} /></div>
          <button onClick={() => setStep(2)} disabled={!f.name||!f.income||!f.company} style={{ ...btn(accent), opacity:(!f.name||!f.income||!f.company)?0.45:1 }}>Next →</button>
        </div>
      )}
      {step === 2 && (
        <div style={S.card}>
          <div style={{ marginBottom:14 }}><label style={S.label}>Loan Amount (₹)</label><input type="number" min="10000" placeholder="100000" value={f.amount} onChange={e => setF({ ...f, amount:e.target.value })} style={S.input} /></div>
          <div style={{ marginBottom:14 }}>
            <label style={S.label}>Tenure</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[6,12,18,24,36,48].map(t => (
                <button key={t} onClick={() => setF({ ...f, tenure:t })} style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${f.tenure===t?accent:"#1e3a5f"}`, background: f.tenure===t?`${accent}25`:"transparent", color: f.tenure===t?"#fbbf24":"#94a3b8", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"inherit" }}>{t}M</button>
              ))}
            </div>
          </div>
          {emi > 0 && <div style={{ background:`${accent}20`, border:`1px solid ${accent}55`, borderRadius:10, padding:14, textAlign:"center", marginBottom:16 }}><p style={{ color:"#94a3b8", fontSize:13, margin:"0 0 4px" }}>Indicative EMI @ ~12% p.a.</p><p style={{ color:"#fbbf24", fontSize:26, fontWeight:900, margin:0 }}>₹{emi.toLocaleString("en-IN")}/month</p></div>}
          <div style={{ display:"flex", gap:10 }}><button onClick={() => setStep(1)} style={{ ...btn("#1e3a5f"), flex:1 }}>← Back</button><button onClick={() => setStep(3)} disabled={!f.amount} style={{ ...btn(accent), flex:2, opacity:!f.amount?0.45:1 }}>Review →</button></div>
        </div>
      )}
      {step === 3 && (
        <div style={S.card}>
          <h3 style={S.h3}>Review Application</h3>
          <div style={{ background:"#070e1a", borderRadius:12, padding:16, marginBottom:18, border:"1px solid #1e3a5f" }}>
            {[["Name",f.name],["Monthly Income","₹"+Number(f.income).toLocaleString("en-IN")],["Loan Amount","₹"+Number(f.amount).toLocaleString("en-IN")],["Tenure",f.tenure+" months"],["EMI","₹"+emi.toLocaleString("en-IN")+"/month"]].map(([k,v]) => (
              <div key={k} style={S.row}><span style={{ color:"#64748b" }}>{k}</span><span style={{ color:"#f1f5f9", fontWeight:600 }}>{v}</span></div>
            ))}
          </div>
          <p style={{ color:"#475569", fontSize:12, marginBottom:16 }}>By submitting you consent to CIBIL credit pull and DigiLocker KYC.</p>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => setStep(2)} style={{ ...btn("#1e3a5f"), flex:1 }}>← Back</button>
            <button onClick={apply} disabled={scoring} style={{ ...btn(accent), flex:2 }}>{scoring ? "🤖 AI Scoring…" : "Submit Application"}</button>
          </div>
        </div>
      )}
      {step === 4 && result && (
        <div style={S.card}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:60, marginBottom:10 }}>{result.approved ? "🎉" : "😔"}</div>
            <h3 style={{ color:result.approved?"#22c55e":"#f87171", fontSize:24, fontWeight:900 }}>{result.approved ? "Loan Approved!" : "Not Approved"}</h3>
          </div>
          <div style={{ background:"#070e1a", borderRadius:12, padding:20, marginBottom:16, textAlign:"center", border:"1px solid #1e3a5f" }}>
            <p style={{ color:"#64748b", fontSize:13, margin:"0 0 6px" }}>ML-Predicted CIBIL Score</p>
            <p style={{ fontSize:56, fontWeight:900, color: result.score>750?"#22c55e":result.score>650?"#f59e0b":"#f87171", margin:0 }}>{result.score}</p>
          </div>
          <button onClick={() => { setStep(1); setResult(null); setF({ name:"", income:"", employment:"Salaried", company:"", amount:"", tenure:12, purpose:"Personal" }); }} style={btn("#1e3a5f")}>New Application</button>
        </div>
      )}
    </div>
  );
}

function ModuleBillPayment({ onPage }) {
  const CATS = ["Electricity","Internet","Mobile","DTH/Cable","Water","Gas","Insurance","Credit Card"];
  const [cat, setCat] = useState("");
  const [billerName, setBillerName] = useState("");
  const [consumerNo, setConsumerNo] = useState("");
  const [fetched, setFetched] = useState(null);
  const [paid, setPaid] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [paying, setPaying] = useState(false);
  useEffect(() => { onPage("pay_bill"); }, []);
  const fetchBill = () => {
    if (!cat || !billerName || !consumerNo) return;
    setFetching(true);
    setTimeout(() => { setFetched({ amount:Math.floor(Math.random()*2000+200), dueDate:"15 Mar 2026", billerName, cat, consumerNo }); setFetching(false); }, 1800);
  };
  const payBill = () => {
    setPaying(true);
    setTimeout(() => { setPaid(true); setPaying(false); }, 2000);
  };
  return (
    <div style={S.page}>
      <h1 style={S.h1}>💡 Bill Payment (BBPS)</h1>
      {!paid ? <>
        <div style={S.card}>
          <h3 style={S.h3}>Pay a Bill</h3>
          <div style={{ marginBottom:14 }}>
            <label style={S.label}>Bill Category</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {CATS.map(c => (
                <button key={c} onClick={() => { setCat(c); setBillerName(""); setFetched(null); }} style={{ padding:"11px 8px", borderRadius:9, border:`1px solid ${cat===c?"#0e7490":"#1e3a5f"}`, background: cat===c?"#0e749025":"#070e1a", color: cat===c?"#22d3ee":"#94a3b8", cursor:"pointer", fontSize:13, fontWeight: cat===c ? 700 : 400, fontFamily:"inherit" }}>{c}</button>
              ))}
            </div>
          </div>
          {cat && <>
            <div style={{ marginBottom:14 }}><label style={S.label}>Biller Name</label><input placeholder={`e.g. ${cat==="Electricity"?"BESCOM":cat==="Internet"?"Jio Fiber":"Enter biller"}`} value={billerName} onChange={e => { setBillerName(e.target.value); setFetched(null); }} style={S.input} /></div>
            <div style={{ marginBottom:16 }}><label style={S.label}>Consumer / Account Number</label><input placeholder="Your consumer number" value={consumerNo} onChange={e => { setConsumerNo(e.target.value); setFetched(null); }} style={S.input} /></div>
            <button onClick={fetchBill} disabled={!billerName||!consumerNo||fetching} style={{ ...btn("#0e7490"), opacity:(!billerName||!consumerNo||fetching)?0.45:1 }}>{fetching?"Fetching from BBPS…":"Fetch Bill →"}</button>
          </>}
        </div>
        {fetched && (
          <div style={S.card}>
            <h3 style={S.h3}>Bill Summary</h3>
            <div style={{ background:"#070e1a", borderRadius:10, padding:14, marginBottom:16, border:"1px solid #1e3a5f" }}>
              {[["Biller",fetched.billerName],["Consumer No.",fetched.consumerNo],["Due Date",fetched.dueDate],["Amount Due","₹"+fetched.amount.toLocaleString("en-IN")]].map(([k,v]) => (
                <div key={k} style={S.row}><span style={{ color:"#64748b" }}>{k}</span><span style={{ color:k==="Amount Due"?"#f8fafc":"#f1f5f9", fontWeight:k==="Amount Due"?900:600, fontSize:k==="Amount Due"?20:14 }}>{v}</span></div>
              ))}
            </div>
            <button onClick={payBill} disabled={paying} style={btn("#059669")}>{paying?"Processing via BBPS…":"Pay ₹"+fetched.amount.toLocaleString("en-IN")+" Now"}</button>
          </div>
        )}
      </> : (
        <div style={{ ...S.card, textAlign:"center", padding:48 }}>
          <div style={{ fontSize:60, marginBottom:16 }}>✅</div>
          <h3 style={{ color:"#22c55e", fontSize:22, fontWeight:900 }}>Bill Paid Successfully!</h3>
          <p style={{ color:"#94a3b8", marginTop:10, fontSize:15 }}>₹{fetched?.amount.toLocaleString("en-IN")} paid to {fetched?.billerName}</p>
          <p style={{ color:"#475569", fontSize:13, marginBottom:28 }}>BBPS Ref: BBP{Date.now().toString().slice(-10)}</p>
          <button onClick={() => { setPaid(false); setFetched(null); setBillerName(""); setConsumerNo(""); setCat(""); }} style={btn("#1e3a5f")}>Pay Another Bill</button>
        </div>
      )}
    </div>
  );
}

function ModulePriceFeed({ onPage }) {
  const [prices, setPrices] = useState({
    RELIANCE:{p:2847.50,c:+1.2}, TCS:{p:3921.00,c:-0.8}, INFY:{p:1823.75,c:+0.4},
    HDFC:{p:1654.20,c:+2.1}, WIPRO:{p:456.30,c:-1.5}, ICICI:{p:1120.80,c:+0.9},
    BAJAJ:{p:7234.00,c:+1.7}, MARUTI:{p:12450.00,c:-0.3}, LT:{p:3672.50,c:+0.6}, TITAN:{p:3245.00,c:-0.2}
  });
  const [search, setSearch] = useState("");
  const [watchlist, setWatchlist] = useState(["RELIANCE","TCS","HDFC"]);
  useEffect(() => {
    onPage("live_prices");
    const t = setInterval(() => setPrices(prev => {
      const u = {};
      Object.entries(prev).forEach(([sym,d]) => { const delta=(Math.random()-.5)*(d.p*0.008); u[sym]={p:Math.max(1,+(d.p+delta).toFixed(2)),c:+((delta/d.p)*100).toFixed(2)}; });
      return u;
    }), 1200);
    return () => clearInterval(t);
  }, []);
  const filtered = Object.entries(prices).filter(([s]) => !search || s.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ padding:22 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h1 style={S.h1}>📈 Live NSE Prices</h1>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:9, height:9, borderRadius:"50%", background:"#ef4444" }} /><span style={{ fontSize:12, color:"#f87171", fontWeight:700 }}>LIVE NSE</span></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20 }}>
        {Object.entries(prices).filter(([s]) => watchlist.includes(s)).map(([sym,d]) => (
          <div key={sym} style={{ ...S.card, textAlign:"center", padding:16 }}>
            <p style={{ color:"#f1f5f9", fontWeight:800, fontFamily:"monospace", fontSize:15, margin:"0 0 4px" }}>{sym}</p>
            <p style={{ color:"#f8fafc", fontWeight:900, fontSize:20, margin:"4px 0" }}>₹{d.p.toFixed(2)}</p>
            <p style={{ color:d.c>=0?"#22c55e":"#f87171", fontWeight:700, fontSize:13, margin:0 }}>{d.c>=0?"▲":"▼"} {Math.abs(d.c).toFixed(2)}%</p>
          </div>
        ))}
      </div>
      <div style={{ marginBottom:14 }}><input placeholder="Search symbol…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...S.input, fontSize:14 }} /></div>
      <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", padding:"11px 18px", fontSize:12, color:"#475569", fontWeight:700, borderBottom:"1px solid #070e1a" }}><span>SYMBOL</span><span style={{ textAlign:"right" }}>PRICE</span><span style={{ textAlign:"right" }}>CHANGE</span></div>
        {filtered.map(([sym,d]) => (
          <div key={sym} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", padding:"14px 18px", borderBottom:"1px solid #070e1a", alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontFamily:"monospace", fontWeight:800, color:"#f1f5f9", fontSize:15 }}>{sym}</span>
              <button onClick={() => setWatchlist(w => w.includes(sym) ? w.filter(s=>s!==sym) : [...w,sym])} style={{ background:"none", border:"none", cursor:"pointer", color: watchlist.includes(sym)?"#fbbf24":"#334155", fontSize:16 }}>{watchlist.includes(sym)?"★":"☆"}</button>
            </div>
            <span style={{ textAlign:"right", fontWeight:800, color:"#f8fafc", fontSize:15 }}>₹{d.p.toFixed(2)}</span>
            <span style={{ textAlign:"right", fontWeight:700, fontSize:13, color:d.c>=0?"#22c55e":"#f87171" }}>{d.c>=0?"▲":"▼"} {Math.abs(d.c).toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FULL APPLICATION 1 — DIGITAL WALLET
   Architecture: Auth Vault → API Gateway → Wallet Service → Redis Balance Cache →
                 UPI Payment Service → Kafka Event Bus → Notification Service → PostgreSQL Immutable Ledger
═══════════════════════════════════════════════════════════════════════ */
function App_DigitalWallet({ onPage, customName }) {
  const [authed, setAuthed] = useState(false);
  const [userName, setUserName] = useState("User");
  const [page, setPage] = useState("dashboard");
  const [balance, setBalance] = useState(0);
  const [ledger, setLedger] = useState([]);
  const [sendF, setSendF] = useState({ upi:"", amount:"", note:"" });
  const [topupAmt, setTopupAmt] = useState("");
  const [topupMethod, setTopupMethod] = useState("");
  const [flash, setFlash] = useState("");
  const accent = "#7c3aed";
  useEffect(() => { onPage(page); }, [page]);
  const showFlash = m => { setFlash(m); setTimeout(() => setFlash(""), 3500); };
  const doSend = () => {
    const amt = +sendF.amount;
    if (!sendF.upi || !amt || amt <= 0 || amt > balance) { showFlash("❌ Invalid UPI or insufficient balance"); return; }
    onPage("send_money");
    setTimeout(() => {
      setBalance(b => +(b - amt).toFixed(2));
      setLedger(l => [{ id:"TXN"+String(l.length+1).padStart(4,"0"), label:"Sent to "+sendF.upi, amount:-amt, time:new Date().toLocaleTimeString(), hash:"0x"+Math.random().toString(16).slice(2,8) }, ...l]);
      setSendF({ upi:"", amount:"", note:"" });
      showFlash("✅ ₹"+amt.toLocaleString("en-IN")+" sent to "+sendF.upi);
    }, 1800);
  };
  const doTopup = () => {
    const amt = +topupAmt;
    if (!amt || !topupMethod) return;
    onPage("top_up");
    setTimeout(() => {
      setBalance(b => +(b + amt).toFixed(2));
      setLedger(l => [{ id:"TXN"+String(l.length+1).padStart(4,"0"), label:"Top Up via "+topupMethod, amount:+amt, time:new Date().toLocaleTimeString(), hash:"0x"+Math.random().toString(16).slice(2,8) }, ...l]);
      setTopupAmt(""); setTopupMethod("");
      showFlash("✅ ₹"+amt.toLocaleString("en-IN")+" added!");
    }, 1500);
  };
  if (!authed) return <LoginScreen accent={accent} appName={customName||"PayVault"} logo="💜" tagline="Your secure digital wallet" onLogin={n => { setAuthed(true); setUserName(n); setPage("dashboard"); }} />;
  const nav = [
    { key:"dashboard",   icon:"🏠", label:"Dashboard",   onClick:()=>setPage("dashboard") },
    { key:"send_money",  icon:"💸", label:"Send Money",  onClick:()=>setPage("send_money") },
    { key:"top_up",      icon:"➕", label:"Add Money",   onClick:()=>setPage("top_up") },
    { key:"ledger",      icon:"📒", label:"Ledger",      onClick:()=>setPage("ledger") },
    { key:"profile",     icon:"👤", label:"Profile",     onClick:()=>setPage("profile") },
  ];
  return (
    <AppShell nav={nav} accent={accent} appName={customName||"PayVault"} logo="💜" activePage={page}>
      {flash && <div style={{ padding:"11px 22px", background:flash.includes("✅")?"#05966920":"#dc262620", borderBottom:"1px solid #1e3a5f", fontSize:14, fontWeight:700, color:flash.includes("✅")?"#22c55e":"#f87171" }}>{flash}</div>}
      {page === "dashboard" && (
        <div style={{ padding:26 }}>
          <div style={{ background:`linear-gradient(135deg,${accent},#1d4ed8)`, borderRadius:20, padding:30, marginBottom:22, position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", right:-20, top:-20, width:150, height:150, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }} />
            <p style={{ color:"rgba(255,255,255,0.65)", fontSize:14 }}>Wallet Balance</p>
            <p style={{ fontSize:46, fontWeight:900, color:"#fff", margin:"6px 0" }}>₹{balance.toLocaleString("en-IN",{minimumFractionDigits:2})}</p>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:12 }}>Hello {userName} • RBI PPI Licensed • Max ₹2,00,000</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:22 }}>
            {[["💸","Send Money","send_money"],["➕","Add Money","top_up"],["📒","Ledger","ledger"]].map(([ic,lb,pg]) => (
              <button key={pg} onClick={() => setPage(pg)} style={{ ...S.card, border:"1px solid #1e3a5f", cursor:"pointer", textAlign:"center", padding:20, marginBottom:0 }}>
                <div style={{ fontSize:28, marginBottom:6 }}>{ic}</div><div style={{ fontSize:13, color:"#94a3b8", fontWeight:700 }}>{lb}</div>
              </button>
            ))}
          </div>
          {ledger.length > 0 && (
            <div style={S.card}>
              <h3 style={S.h3}>Recent Transactions</h3>
              {ledger.slice(0,4).map(t => (
                <div key={t.id} style={S.row}>
                  <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                    <div style={{ width:38, height:38, borderRadius:"50%", background:t.amount>0?"#05966920":"#dc262620", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{t.amount>0?"📥":"📤"}</div>
                    <div><p style={{ color:"#f1f5f9", fontWeight:600, fontSize:14, margin:0 }}>{t.label}</p><p style={{ color:"#475569", fontSize:12, margin:0 }}>{t.time}</p></div>
                  </div>
                  <span style={{ fontWeight:800, color:t.amount>0?"#22c55e":"#f87171", fontSize:15 }}>{t.amount>0?"+":""}₹{Math.abs(t.amount).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {page === "send_money" && (
        <div style={{ padding:26, maxWidth:500 }}>
          <h1 style={S.h1}>💸 Send Money</h1>
          <div style={{ ...S.card, fontSize:14, color:"#94a3b8", marginBottom:14 }}>Available: <span style={{ color:accent, fontWeight:800, fontSize:16 }}>₹{balance.toLocaleString("en-IN")}</span></div>
          <div style={S.card}>
            <div style={{ marginBottom:14 }}><label style={S.label}>UPI ID / Phone</label><input placeholder="name@okicici" value={sendF.upi} onChange={e => setSendF({ ...sendF, upi:e.target.value })} style={S.input} /></div>
            <div style={{ marginBottom:14 }}><label style={S.label}>Amount (₹)</label><input type="number" min="1" placeholder="0.00" value={sendF.amount} onChange={e => setSendF({ ...sendF, amount:e.target.value })} style={{ ...S.input, fontSize:26, fontWeight:800 }} /></div>
            <div style={{ marginBottom:20 }}><label style={S.label}>Note (optional)</label><input placeholder="Rent, Groceries…" value={sendF.note} onChange={e => setSendF({ ...sendF, note:e.target.value })} style={S.input} /></div>
            <button onClick={doSend} disabled={!sendF.upi||!sendF.amount} style={{ ...btn(accent), opacity:(!sendF.upi||!sendF.amount)?0.45:1 }}>Send Money →</button>
          </div>
        </div>
      )}
      {page === "top_up" && (
        <div style={{ padding:26, maxWidth:500 }}>
          <h1 style={S.h1}>➕ Add Money</h1>
          <div style={S.card}>
            <label style={S.label}>Quick Amounts</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
              {[500,1000,2000,5000].map(a => (<button key={a} onClick={() => setTopupAmt(String(a))} style={{ padding:"9px 18px", borderRadius:8, border:`1px solid ${topupAmt==a?accent:"#1e3a5f"}`, background:topupAmt==a?`${accent}25`:"transparent", color:topupAmt==a?"#a78bfa":"#94a3b8", cursor:"pointer", fontWeight:700, fontSize:14, fontFamily:"inherit" }}>₹{a}</button>))}
            </div>
            <div style={{ marginBottom:16 }}><label style={S.label}>Or Enter Amount</label><input type="number" min="1" placeholder="Enter amount" value={topupAmt} onChange={e => setTopupAmt(e.target.value)} style={{ ...S.input, fontSize:22, fontWeight:700 }} /></div>
            <div style={{ marginBottom:20 }}>
              <label style={S.label}>Payment Method</label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {["UPI","Net Banking","Debit Card","Credit Card"].map(m => (<button key={m} onClick={() => setTopupMethod(m)} style={{ padding:"13px", borderRadius:10, border:`1px solid ${topupMethod===m?accent:"#1e3a5f"}`, background:topupMethod===m?`${accent}25`:"#070e1a", color:topupMethod===m?"#a78bfa":"#94a3b8", cursor:"pointer", fontSize:14, fontWeight:600, fontFamily:"inherit" }}>{m}</button>))}
              </div>
            </div>
            <button onClick={doTopup} disabled={!topupAmt||!topupMethod} style={{ ...btn(accent), opacity:(!topupAmt||!topupMethod)?0.45:1 }}>Add ₹{topupAmt||"0"} →</button>
          </div>
        </div>
      )}
      {page === "ledger" && (
        <div style={{ padding:26 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
            <h1 style={{ ...S.h1, marginBottom:0 }}>📒 Immutable Ledger</h1>
            <span style={S.badge("#059669")}>🔒 Append-Only</span>
          </div>
          <div style={S.card}>
            {ledger.length === 0 ? <p style={{ color:"#334155", textAlign:"center", padding:"30px 0", fontSize:15 }}>No transactions yet</p> :
              ledger.map(t => (
                <div key={t.id} style={{ ...S.row, gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:t.amount>0?"#05966920":"#dc262620", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{t.amount>0?"📥":"📤"}</div>
                  <div style={{ flex:1 }}><p style={{ color:"#f1f5f9", fontWeight:600, fontSize:14, margin:0 }}>{t.label}</p><p style={{ color:"#475569", fontSize:12, margin:0 }}>{t.time} • {t.hash}</p></div>
                  <span style={{ fontWeight:800, color:t.amount>0?"#22c55e":"#f87171", fontSize:15 }}>{t.amount>0?"+":""}₹{Math.abs(t.amount).toLocaleString("en-IN")}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}
      {page === "profile" && (
        <div style={{ padding:26, maxWidth:420 }}>
          <h1 style={S.h1}>👤 Profile</h1>
          <div style={S.card}>
            <div style={{ textAlign:"center", marginBottom:22 }}><div style={{ width:80, height:80, borderRadius:"50%", background:`linear-gradient(135deg,${accent},#1d4ed8)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 10px" }}>👤</div><p style={{ color:"#f8fafc", fontWeight:800, fontSize:16, margin:0 }}>{userName}</p></div>
            {[["KYC Status","✅ Full KYC Verified"],["Wallet Limit","₹2,00,000"],["Current Balance","₹"+balance.toLocaleString("en-IN")]].map(([k,v]) => (
              <div key={k} style={S.row}><span style={{ color:"#64748b" }}>{k}</span><span style={{ color:"#f1f5f9", fontWeight:700 }}>{v}</span></div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FULL APPLICATION 2 — P2P PAYMENT GATEWAY
   Architecture: Auth Vault → API Gateway → UPI Payment → QR Code → Fraud Engine →
                 Kafka → Notification → PostgreSQL Ledger
═══════════════════════════════════════════════════════════════════════ */
function App_P2PPayment({ onPage, customName }) {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [txns, setTxns] = useState([]);
  const [upiF, setUpiF] = useState({ upi:"", amount:"", note:"" });
  const [fraudRes, setFraudRes] = useState(null);
  const [payStep, setPayStep] = useState("form");
  const [qrAmt, setQrAmt] = useState("");
  const [qrPaid, setQrPaid] = useState(false);
  const accent = "#059669";
  useEffect(() => { onPage(page); }, [page]);
  const checkFraud = () => {
    if (!upiF.upi || !upiF.amount) return;
    setPayStep("checking"); onPage("send_money");
    setTimeout(() => { setFraudRes(Math.random() > 0.15 ? "SAFE" : "BLOCKED"); setPayStep("result"); }, 2000);
  };
  const confirmPay = () => {
    setTxns(t => [{ id:Date.now(), upi:upiF.upi, amount:+upiF.amount, note:upiF.note, time:new Date().toLocaleTimeString(), type:"UPI" }, ...t]);
    setUpiF({ upi:"", amount:"", note:"" }); setPayStep("done");
  };
  const payQR = () => {
    if (!qrAmt || +qrAmt <= 0) return; onPage("qr_pay");
    setTimeout(() => { setTxns(t => [{ id:Date.now(), upi:"merchant@oksbi", amount:+qrAmt, note:"QR Payment", time:new Date().toLocaleTimeString(), type:"QR" }, ...t]); setQrPaid(true); }, 1800);
  };
  if (!authed) return <LoginScreen accent={accent} appName={customName||"SwiftPay"} logo="💚" tagline="Fast & secure P2P payments" onLogin={() => { setAuthed(true); setPage("dashboard"); }} />;
  const nav = [
    { key:"dashboard",    icon:"🏠", label:"Home",        onClick:()=>setPage("dashboard") },
    { key:"send_money",   icon:"💸", label:"UPI Pay",     onClick:()=>{ setPage("send_money"); setPayStep("form"); setFraudRes(null); } },
    { key:"qr_pay",       icon:"📷", label:"QR Pay",      onClick:()=>{ setPage("qr_pay"); setQrPaid(false); setQrAmt(""); } },
    { key:"transactions", icon:"📋", label:"History",     onClick:()=>setPage("transactions") },
    { key:"notifications",icon:"🔔", label:"Alerts",      onClick:()=>setPage("notifications") },
    { key:"profile",      icon:"👤", label:"Profile",     onClick:()=>setPage("profile") },
  ];
  return (
    <AppShell nav={nav} accent={accent} appName={customName||"SwiftPay"} logo="💚" activePage={page}>
      {page === "dashboard" && (
        <div style={{ padding:26 }}>
          <div style={{ background:`linear-gradient(135deg,${accent},#0e7490)`, borderRadius:20, padding:28, marginBottom:22 }}>
            <p style={{ color:"rgba(255,255,255,0.65)", fontSize:14 }}>Linked Bank Account • IMPS Active</p>
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"12px 0" }}><span style={{ fontSize:30 }}>🏦</span><span style={{ color:"#ecfdf5", fontWeight:800, fontSize:17 }}>UPI Payments Ready</span></div>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:12 }}>Fraud ML ● NPCI Verified ● Daily Limit ₹1,00,000</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:22 }}>
            {[["💸","UPI Pay","send_money"],["📷","Scan QR","qr_pay"],["📋","History","transactions"],["🔔","Alerts","notifications"]].map(([ic,lb,pg]) => (
              <button key={pg} onClick={() => setPage(pg)} style={{ ...S.card, border:"1px solid #1e3a5f", cursor:"pointer", textAlign:"center", padding:20, marginBottom:0 }}>
                <div style={{ fontSize:28, marginBottom:6 }}>{ic}</div><div style={{ fontSize:13, color:"#94a3b8", fontWeight:700 }}>{lb}</div>
              </button>
            ))}
          </div>
          {txns.length > 0 && <div style={S.card}><h3 style={S.h3}>Recent</h3>{txns.slice(0,3).map(t => (<div key={t.id} style={S.row}><div><p style={{ color:"#f1f5f9", fontWeight:600, fontSize:14, margin:0 }}>{t.type==="QR"?"QR → ":"Sent → "}{t.upi}</p><p style={{ color:"#475569", fontSize:12, margin:0 }}>{t.time}</p></div><span style={{ color:"#f87171", fontWeight:800, fontSize:15 }}>-₹{t.amount.toLocaleString("en-IN")}</span></div>))}</div>}
        </div>
      )}
      {page === "send_money" && (
        <div style={{ padding:26, maxWidth:500 }}>
          <h1 style={S.h1}>💸 UPI Pay</h1>
          {payStep === "form" && <div style={S.card}>
            <div style={{ marginBottom:14 }}><label style={S.label}>Recipient UPI ID</label><input placeholder="name@okaxis" value={upiF.upi} onChange={e => setUpiF({ ...upiF, upi:e.target.value })} style={S.input} /></div>
            <div style={{ marginBottom:14 }}><label style={S.label}>Amount (₹)</label><input type="number" min="1" placeholder="0.00" value={upiF.amount} onChange={e => setUpiF({ ...upiF, amount:e.target.value })} style={{ ...S.input, fontSize:26, fontWeight:800 }} /></div>
            <div style={{ marginBottom:20 }}><label style={S.label}>Remarks</label><input placeholder="optional" value={upiF.note} onChange={e => setUpiF({ ...upiF, note:e.target.value })} style={S.input} /></div>
            <button onClick={checkFraud} disabled={!upiF.upi||!upiF.amount} style={{ ...btn(accent), opacity:(!upiF.upi||!upiF.amount)?0.45:1 }}>🛡️ Check Fraud & Pay →</button>
          </div>}
          {payStep === "checking" && <div style={{ ...S.card, textAlign:"center", padding:48 }}><div style={{ fontSize:52, marginBottom:16 }}>🤖</div><h3 style={{ color:"#f8fafc", fontWeight:700, fontSize:20 }}>Fraud Engine Running…</h3><p style={{ color:"#64748b", fontSize:14 }}>Random Forest ML checking 15 features</p></div>}
          {payStep === "result" && <div style={S.card}>
            <div style={{ background:fraudRes==="SAFE"?"#05966920":"#dc262620", border:`1px solid ${fraudRes==="SAFE"?"#059669":"#dc2626"}`, borderRadius:12, padding:22, textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:40, marginBottom:8 }}>{fraudRes==="SAFE"?"✅":"⛔"}</div>
              <p style={{ fontWeight:800, fontSize:17, color:fraudRes==="SAFE"?"#22c55e":"#f87171", margin:0 }}>Fraud Check: {fraudRes}</p>
            </div>
            {fraudRes === "SAFE" && <><div style={{ background:"#070e1a", borderRadius:10, padding:14, marginBottom:16, border:"1px solid #1e3a5f" }}>{[["To",upiF.upi],["Amount","₹"+Number(upiF.amount).toLocaleString("en-IN")]].map(([k,v]) => (<div key={k} style={S.row}><span style={{ color:"#64748b" }}>{k}</span><span style={{ color:"#f1f5f9", fontWeight:700 }}>{v}</span></div>))}</div><button onClick={confirmPay} style={btn(accent)}>Confirm Payment</button></>}
            {fraudRes === "BLOCKED" && <button onClick={() => { setPayStep("form"); setFraudRes(null); }} style={btn("#1e3a5f")}>Try Again</button>}
          </div>}
          {payStep === "done" && <div style={{ ...S.card, textAlign:"center", padding:48 }}><div style={{ fontSize:60, marginBottom:16 }}>🎉</div><h3 style={{ color:"#22c55e", fontSize:22, fontWeight:900 }}>Payment Sent!</h3><p style={{ color:"#94a3b8", marginTop:10, marginBottom:28, fontSize:15 }}>Ledger entry sealed • SMS sent</p><button onClick={() => { setPayStep("form"); setPage("dashboard"); }} style={btn(accent)}>Done</button></div>}
        </div>
      )}
      {page === "qr_pay" && (
        <div style={{ padding:26, maxWidth:480 }}>
          <h1 style={S.h1}>📷 QR Pay</h1>
          {!qrPaid ? <div style={S.card}>
            <div style={{ background:"#070e1a", borderRadius:14, padding:40, textAlign:"center", marginBottom:22, border:"2px dashed #1e3a5f" }}>
              <div style={{ fontSize:72, marginBottom:10 }}>📷</div>
              <p style={{ color:"#64748b", fontSize:14 }}>Camera opens here — scan any Bharat QR</p>
            </div>
            <div style={{ marginBottom:20 }}><label style={S.label}>Enter Amount (₹)</label><input type="number" min="1" placeholder="0.00" value={qrAmt} onChange={e => setQrAmt(e.target.value)} style={{ ...S.input, fontSize:28, fontWeight:800 }} /></div>
            <button onClick={payQR} disabled={!qrAmt||+qrAmt<=0} style={{ ...btn(accent), opacity:(!qrAmt||+qrAmt<=0)?0.45:1 }}>Pay ₹{qrAmt||"0"} via QR</button>
          </div> : <div style={{ ...S.card, textAlign:"center", padding:48 }}><div style={{ fontSize:60, marginBottom:16 }}>✅</div><h3 style={{ color:"#22c55e", fontSize:22, fontWeight:900 }}>QR Payment Done!</h3><p style={{ color:"#94a3b8", marginTop:10, marginBottom:28, fontSize:15 }}>₹{(+qrAmt).toLocaleString("en-IN")} paid to Demo Store</p><button onClick={() => { setQrPaid(false); setQrAmt(""); setPage("dashboard"); }} style={btn(accent)}>Done</button></div>}
        </div>
      )}
      {page === "transactions" && <div style={{ padding:26 }}><h1 style={S.h1}>📋 Payment History</h1><div style={S.card}>{txns.length===0?<p style={{ color:"#334155", textAlign:"center", padding:"30px 0", fontSize:15 }}>No payments yet</p>:txns.map(t=>(<div key={t.id} style={S.row}><div style={{ display:"flex", gap:10, alignItems:"center" }}><div style={{ width:38, height:38, borderRadius:"50%", background:"#dc262620", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{t.type==="QR"?"📷":"💸"}</div><div><p style={{ color:"#f1f5f9", fontWeight:600, fontSize:14, margin:0 }}>{t.type==="QR"?"QR → ":"UPI → "}{t.upi}</p><p style={{ color:"#475569", fontSize:12, margin:0 }}>{t.time}</p></div></div><div style={{ textAlign:"right" }}><p style={{ color:"#f87171", fontWeight:800, fontSize:15, margin:0 }}>-₹{t.amount.toLocaleString("en-IN")}</p><p style={{ color:"#22c55e", fontSize:11, margin:0 }}>✓ Settled</p></div></div>))}</div></div>}
      {page === "notifications" && <div style={{ padding:26 }}><h1 style={S.h1}>🔔 Alerts</h1>{txns.length===0?<div style={{ ...S.card, textAlign:"center", padding:48, color:"#334155" }}><div style={{ fontSize:48, marginBottom:12 }}>🔔</div><p style={{ fontSize:15 }}>No alerts yet</p></div>:txns.map(t=>(<div key={t.id} style={{ ...S.card, display:"flex", gap:14, alignItems:"center" }}><div style={{ width:42, height:42, borderRadius:"50%", background:accent+"20", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>💸</div><div><p style={{ color:"#f1f5f9", fontWeight:700, fontSize:14, margin:"0 0 4px" }}>₹{t.amount} {t.type==="QR"?"QR payment":"UPI sent"} to {t.upi}</p><p style={{ color:"#475569", fontSize:13, margin:0 }}>Fraud check passed • {t.type} settled • {t.time}</p></div></div>))}</div>}
      {page === "profile" && <div style={{ padding:26, maxWidth:420 }}><h1 style={S.h1}>👤 Profile</h1><div style={S.card}><div style={{ textAlign:"center", marginBottom:22 }}><div style={{ width:80, height:80, borderRadius:"50%", background:`linear-gradient(135deg,${accent},#0e7490)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 10px" }}>👤</div></div>{[["UPI ID","yourname@okaxis"],["Daily Limit","₹1,00,000"],["Fraud Protection","🛡️ ML Active"],["Status","NPCI Verified ✓"]].map(([k,v])=>(<div key={k} style={S.row}><span style={{ color:"#64748b" }}>{k}</span><span style={{ color:"#f1f5f9", fontWeight:700 }}>{v}</span></div>))}</div></div>}
    </AppShell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FULL APPLICATION 3 — AI LENDING PLATFORM
   Architecture: Auth Vault → API Gateway → Loan Application → Credit Scoring ML →
                 KYC Verification → EMI Calculator → Kafka → PostgreSQL Ledger
═══════════════════════════════════════════════════════════════════════ */
function App_AILending({ onPage, customName }) {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [loans, setLoans] = useState([]);
  const [kycDone, setKycDone] = useState(false);
  const accent = "#d97706";
  useEffect(() => { onPage(page); }, [page]);
  if (!authed) return <LoginScreen accent={accent} appName={customName||"CreditFlow"} logo="🟡" tagline="AI-powered lending platform" onLogin={() => { setAuthed(true); setPage("dashboard"); }} />;
  const nav = [
    { key:"dashboard",    icon:"🏠", label:"Dashboard",    onClick:()=>setPage("dashboard") },
    { key:"loan_apply",   icon:"📝", label:"Apply Loan",   onClick:()=>setPage("loan_apply") },
    { key:"credit_score", icon:"📊", label:"Credit Score", onClick:()=>setPage("credit_score") },
    { key:"kyc",          icon:"🪪", label:"KYC Docs",    onClick:()=>setPage("kyc") },
    { key:"my_loans",     icon:"💰", label:"My Loans",     onClick:()=>setPage("my_loans") },
    { key:"profile",      icon:"👤", label:"Profile",      onClick:()=>setPage("profile") },
  ];
  return (
    <AppShell nav={nav} accent={accent} appName={customName||"CreditFlow"} logo="🟡" activePage={page}>
      {page === "dashboard" && (
        <div style={{ padding:26 }}>
          <div style={{ background:`linear-gradient(135deg,${accent},#92400e)`, borderRadius:20, padding:28, marginBottom:22 }}>
            <p style={{ color:"rgba(255,255,255,0.65)", fontSize:14 }}>Pre-approved Credit Limit</p>
            <p style={{ fontSize:42, fontWeight:900, color:"#fff", margin:"6px 0" }}>₹5,00,000</p>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:12 }}>AI-scored in &lt;3 sec • Rate from 10.5% p.a.{kycDone ? " • KYC ✓" : ""}</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:22 }}>
            {[["📝","Apply Loan","loan_apply"],["📊","Credit Score","credit_score"],["🪪","KYC Docs","kyc"]].map(([ic,lb,pg]) => (
              <button key={pg} onClick={() => setPage(pg)} style={{ ...S.card, border:"1px solid #1e3a5f", cursor:"pointer", textAlign:"center", padding:20, marginBottom:0 }}>
                <div style={{ fontSize:28, marginBottom:6 }}>{ic}</div><div style={{ fontSize:13, color:"#94a3b8", fontWeight:700 }}>{lb}</div>
              </button>
            ))}
          </div>
          {loans.length > 0 && <div style={S.card}><h3 style={S.h3}>Active Loans</h3>{loans.map((l,i) => (<div key={i} style={{ background:"#070e1a", borderRadius:10, padding:16, marginBottom:8, border:"1px solid #1e3a5f" }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><span style={{ color:"#f8fafc", fontWeight:900, fontSize:18 }}>₹{Number(l.amount).toLocaleString("en-IN")}</span><span style={S.badge(l.approved?"#059669":"#dc2626")}>{l.approved?"✅ Approved":"❌ Rejected"}</span></div>{l.approved && <p style={{ color:"#64748b", fontSize:13, margin:0 }}>EMI ₹{l.emi}/mo • {l.tenure} months • Score {l.score}</p>}</div>))}</div>}
        </div>
      )}
      {page === "loan_apply" && <LoanApplyPage accent={accent} setLoans={setLoans} onDone={() => setPage("my_loans")} onPage={onPage} />}
      {page === "credit_score" && <CreditScorePage accent={accent} />}
      {page === "kyc" && <KYCPage accent={accent} kycDone={kycDone} onComplete={() => setKycDone(true)} />}
      {page === "my_loans" && <div style={{ padding:26 }}><h1 style={S.h1}>💰 My Loans</h1>{loans.length===0?<div style={{ ...S.card, textAlign:"center", padding:48, color:"#334155" }}><div style={{ fontSize:48, marginBottom:12 }}>📭</div><p style={{ fontSize:15 }}>No applications yet</p></div>:loans.map((l,i)=>(<div key={i} style={{ ...S.card, marginBottom:12 }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}><span style={{ color:"#f8fafc", fontWeight:900, fontSize:22 }}>₹{Number(l.amount).toLocaleString("en-IN")}</span><span style={S.badge(l.approved?"#059669":"#dc2626")}>{l.approved?"✅ Approved":"❌ Rejected"}</span></div>{l.approved&&<p style={{ color:"#64748b", fontSize:14, margin:0 }}>EMI ₹{l.emi}/mo • {l.tenure} months • CIBIL {l.score} • {l.rate}% p.a.</p>}</div>))}</div>}
      {page === "profile" && <div style={{ padding:26, maxWidth:420 }}><h1 style={S.h1}>👤 Profile</h1><div style={S.card}>{[["KYC",kycDone?"✅ Verified":"⏳ Pending"],["Credit Limit","₹5,00,000"],["Applications",String(loans.length)],["ML Model","XGBoost + Feature Store"]].map(([k,v])=>(<div key={k} style={S.row}><span style={{ color:"#64748b" }}>{k}</span><span style={{ color:"#f1f5f9", fontWeight:700 }}>{v}</span></div>))}</div></div>}
    </AppShell>
  );
}

function LoanApplyPage({ accent, setLoans, onDone, onPage }) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ name:"", income:"", employment:"Salaried", company:"", amount:"", tenure:12, purpose:"Personal" });
  const [result, setResult] = useState(null);
  const [scoring, setScoring] = useState(false);
  const emi = f.amount && f.tenure ? Math.round((+f.amount * 0.01 * Math.pow(1.01, +f.tenure)) / (Math.pow(1.01, +f.tenure) - 1)) : 0;
  const apply = () => {
    setScoring(true); onPage("loan_apply");
    setTimeout(() => {
      const score = Math.floor(Math.random() * 300 + 550);
      const approved = score > 650 && +f.income > 20000;
      const rate = approved ? +(10 + Math.random() * 4).toFixed(1) : null;
      const r = { score, approved, emi, amount:f.amount, tenure:f.tenure, rate };
      setResult(r); if (approved) setLoans(l => [...l, r]);
      setStep(4); setScoring(false);
    }, 2800);
  };
  return (
    <div style={{ padding:26, maxWidth:520 }}>
      <h1 style={S.h1}>📝 Loan Application</h1>
      <div style={{ display:"flex", gap:6, marginBottom:24 }}>
        {["Personal","Loan","Review","Decision"].map((s,i) => (
          <div key={i} style={{ flex:1 }}><div style={{ height:4, borderRadius:2, background:step>i+1?accent:step===i+1?accent:"#1e3a5f", marginBottom:5 }} /><span style={{ fontSize:11, color:step>=i+1?accent:"#475569", fontWeight:600 }}>{s}</span></div>
        ))}
      </div>
      {step === 1 && <div style={S.card}>
        <div style={{ marginBottom:14 }}><label style={S.label}>Full Name</label><input placeholder="As on PAN card" value={f.name} onChange={e=>setF({...f,name:e.target.value})} style={S.input}/></div>
        <div style={{ marginBottom:14 }}><label style={S.label}>Monthly Income (₹)</label><input type="number" min="0" placeholder="50000" value={f.income} onChange={e=>setF({...f,income:e.target.value})} style={S.input}/></div>
        <div style={{ marginBottom:14 }}><label style={S.label}>Employment</label><div style={{ display:"flex", gap:8 }}>{["Salaried","Self-Employed","Business"].map(e=>(<button key={e} onClick={()=>setF({...f,employment:e})} style={{ flex:1, padding:"10px 0", borderRadius:8, border:`1px solid ${f.employment===e?accent:"#1e3a5f"}`, background:f.employment===e?`${accent}25`:"#070e1a", color:f.employment===e?"#fbbf24":"#94a3b8", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"inherit" }}>{e}</button>))}</div></div>
        <div style={{ marginBottom:20 }}><label style={S.label}>Company</label><input placeholder="Employer name" value={f.company} onChange={e=>setF({...f,company:e.target.value})} style={S.input}/></div>
        <button onClick={()=>setStep(2)} disabled={!f.name||!f.income||!f.company} style={{...btn(accent),opacity:(!f.name||!f.income||!f.company)?0.45:1}}>Next →</button>
      </div>}
      {step === 2 && <div style={S.card}>
        <div style={{ marginBottom:14 }}><label style={S.label}>Loan Amount (₹)</label><input type="number" min="10000" placeholder="100000" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} style={S.input}/></div>
        <div style={{ marginBottom:14 }}><label style={S.label}>Tenure</label><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{[6,12,18,24,36,48].map(t=>(<button key={t} onClick={()=>setF({...f,tenure:t})} style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${f.tenure===t?accent:"#1e3a5f"}`, background:f.tenure===t?`${accent}25`:"transparent", color:f.tenure===t?"#fbbf24":"#94a3b8", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"inherit" }}>{t}M</button>))}</div></div>
        {emi>0&&<div style={{ background:`${accent}20`, border:`1px solid ${accent}55`, borderRadius:10, padding:14, textAlign:"center", marginBottom:16 }}><p style={{ color:"#94a3b8", fontSize:13, margin:"0 0 4px" }}>Indicative EMI</p><p style={{ color:"#fbbf24", fontSize:26, fontWeight:900, margin:0 }}>₹{emi.toLocaleString("en-IN")}/month</p></div>}
        <div style={{ display:"flex", gap:10 }}><button onClick={()=>setStep(1)} style={{...btn("#1e3a5f"),flex:1}}>← Back</button><button onClick={()=>setStep(3)} disabled={!f.amount} style={{...btn(accent),flex:2,opacity:!f.amount?0.45:1}}>Review →</button></div>
      </div>}
      {step === 3 && <div style={S.card}>
        <h3 style={S.h3}>Review</h3>
        <div style={{ background:"#070e1a", borderRadius:12, padding:16, marginBottom:16, border:"1px solid #1e3a5f" }}>{[["Name",f.name],["Income","₹"+Number(f.income).toLocaleString("en-IN")+"/mo"],["Amount","₹"+Number(f.amount).toLocaleString("en-IN")],["Tenure",f.tenure+" months"],["EMI","₹"+emi.toLocaleString("en-IN")+"/mo"]].map(([k,v])=>(<div key={k} style={S.row}><span style={{ color:"#64748b" }}>{k}</span><span style={{ color:"#f1f5f9", fontWeight:600 }}>{v}</span></div>))}</div>
        <div style={{ display:"flex", gap:10 }}><button onClick={()=>setStep(2)} style={{...btn("#1e3a5f"),flex:1}}>← Back</button><button onClick={apply} disabled={scoring} style={{...btn(accent),flex:2}}>{scoring?"🤖 AI Scoring…":"Submit"}</button></div>
      </div>}
      {step === 4 && result && <div style={S.card}>
        <div style={{ textAlign:"center", marginBottom:20 }}><div style={{ fontSize:60, marginBottom:10 }}>{result.approved?"🎉":"😔"}</div><h3 style={{ color:result.approved?"#22c55e":"#f87171", fontSize:24, fontWeight:900 }}>{result.approved?"Loan Approved!":"Not Approved"}</h3></div>
        <div style={{ background:"#070e1a", borderRadius:12, padding:20, marginBottom:16, textAlign:"center", border:"1px solid #1e3a5f" }}><p style={{ color:"#64748b", fontSize:13, margin:"0 0 6px" }}>CIBIL Score (ML)</p><p style={{ fontSize:56, fontWeight:900, color:result.score>750?"#22c55e":result.score>650?"#f59e0b":"#f87171", margin:0 }}>{result.score}</p></div>
        <button onClick={()=>{setStep(1);setResult(null);setF({name:"",income:"",employment:"Salaried",company:"",amount:"",tenure:12,purpose:"Personal"});onDone();}} style={btn("#1e3a5f")}>View My Loans</button>
      </div>}
    </div>
  );
}

function CreditScorePage({ accent }) {
  const [score] = useState(() => Math.floor(Math.random() * 200 + 600));
  const factors = [
    { label:"Payment History", value:95, desc:"No missed EMIs or defaults" },
    { label:"Credit Utilization", value:32, desc:"Below 30% — within healthy range" },
    { label:"Credit Age", value:68, desc:"3 years 2 months credit history" },
    { label:"Credit Mix", value:80, desc:"Credit card + personal loan active" },
    { label:"New Inquiries", value:90, desc:"Only 1 inquiry in last 6 months" },
  ];
  return (
    <div style={{ padding:26 }}>
      <h1 style={S.h1}>📊 Credit Score</h1>
      <div style={{ ...S.card, textAlign:"center", marginBottom:20 }}>
        <p style={{ color:"#64748b", fontSize:14, marginBottom:12 }}>ML-Predicted CIBIL Score</p>
        <div style={{ position:"relative", display:"inline-block" }}>
          <svg width="200" height="110" viewBox="0 0 200 110">
            <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#1e2d3d" strokeWidth="14" strokeLinecap="round"/>
            <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke={score>750?"#22c55e":score>650?"#f59e0b":"#ef4444"} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${((score-300)/550)*252} 252`}/>
          </svg>
          <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", textAlign:"center" }}>
            <div style={{ fontSize:42, fontWeight:900, color:score>750?"#22c55e":score>650?"#f59e0b":"#f87171" }}>{score}</div>
            <div style={{ fontSize:13, color:"#64748b" }}>{score>750?"Excellent":score>650?"Good":score>550?"Fair":"Poor"}</div>
          </div>
        </div>
      </div>
      <div style={S.card}>
        <h3 style={S.h3}>Score Factors</h3>
        {factors.map(f => (
          <div key={f.label} style={{ marginBottom:18 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ color:"#f1f5f9", fontSize:14, fontWeight:700 }}>{f.label}</span>
              <span style={{ color:f.value>70?"#22c55e":"#f59e0b", fontSize:14, fontWeight:700 }}>{f.value}%</span>
            </div>
            <div style={{ height:7, background:"#070e1a", borderRadius:4 }}><div style={{ height:7, borderRadius:4, background:f.value>70?"#22c55e":"#f59e0b", width:`${f.value}%` }} /></div>
            <p style={{ color:"#475569", fontSize:12, marginTop:4, margin:"4px 0 0" }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function KYCPage({ accent, kycDone, onComplete }) {
  const [docs, setDocs] = useState({ aadhaar:"", pan:"", income:"" });
  const [submitted, setSubmitted] = useState(kycDone);
  const submit = () => { if (!docs.aadhaar||!docs.pan||!docs.income) return; setSubmitted(true); onComplete(); };
  return (
    <div style={{ padding:26, maxWidth:480 }}>
      <h1 style={S.h1}>🪪 KYC Verification</h1>
      {submitted ? (
        <div style={{ ...S.card, textAlign:"center", padding:48 }}><div style={{ fontSize:52, marginBottom:16 }}>⏳</div><h3 style={{ color:"#f59e0b", fontSize:20, fontWeight:800 }}>KYC Under Review</h3><p style={{ color:"#94a3b8", fontSize:14, marginTop:10 }}>Verification takes 2–4 hours via DigiLocker.</p></div>
      ) : (
        <div style={S.card}>
          <div style={{ background:`${accent}15`, border:`1px solid ${accent}44`, borderRadius:10, padding:14, marginBottom:20 }}><p style={{ color:accent, fontWeight:700, fontSize:14, margin:"0 0 4px" }}>🔗 DigiLocker Integration Active</p><p style={{ color:"#94a3b8", fontSize:13, margin:0 }}>Verified documents pulled directly from Government DigiLocker</p></div>
          {[["Aadhaar Number","aadhaar","XXXX XXXX XXXX"],["PAN Number","pan","ABCDE1234F"],["Annual Income (₹)","income","600000"]].map(([lb,k,ph]) => (
            <div key={k} style={{ marginBottom:14 }}><label style={S.label}>{lb}</label><input placeholder={ph} value={docs[k]} onChange={e=>setDocs({...docs,[k]:e.target.value})} style={S.input}/></div>
          ))}
          <button onClick={submit} disabled={!docs.aadhaar||!docs.pan||!docs.income} style={{...btn(accent),opacity:(!docs.aadhaar||!docs.pan||!docs.income)?0.45:1}}>Submit via DigiLocker</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FULL APPLICATION 4 — BILL & SUBSCRIPTION MANAGER
   Architecture: Auth Vault → API Gateway → BBPS Adapter → NACH Scheduler →
                 Notification Service → PostgreSQL Immutable Ledger
═══════════════════════════════════════════════════════════════════════ */
const CAT_ICONS  = { "Electricity":"⚡","Internet":"📡","Mobile":"📱","DTH/TV":"📺","Water":"🚿","Gas":"🔥","Insurance":"🛡️","Credit Card":"💳","Other":"📄" };
const CAT_COLORS = { "Electricity":"#f59e0b","Internet":"#3b82f6","Mobile":"#059669","DTH/TV":"#8b5cf6","Water":"#0ea5e9","Gas":"#ef4444","Insurance":"#22c55e","Credit Card":"#dc2626","Other":"#64748b" };

function App_BillManager({ onPage, customName }) {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [bills, setBills] = useState([]);
  const [history, setHistory] = useState([]);
  const [mandates, setMandates] = useState([]);
  const accent = "#0e7490";
  useEffect(() => { onPage(page); }, [page]);
  if (!authed) return <LoginScreen accent={accent} appName={customName||"BillEase"} logo="🔵" tagline="Bill & subscription manager" onLogin={() => { setAuthed(true); setPage("dashboard"); }} />;
  const unpaid = bills.filter(b => !b.paid);
  const totalDue = unpaid.reduce((s, b) => s + (+b.amount || 0), 0);
  const nav = [
    { key:"dashboard", icon:"🏠", label:"Dashboard", onClick:()=>setPage("dashboard") },
    { key:"add_bill",  icon:"➕", label:"Add Bill",  onClick:()=>setPage("add_bill") },
    { key:"pay_bill",  icon:"💳", label:"Pay Bill",  onClick:()=>setPage("pay_bill") },
    { key:"auto_pay",  icon:"🔄", label:"Auto Pay",  onClick:()=>setPage("auto_pay") },
    { key:"history",   icon:"📋", label:"History",   onClick:()=>setPage("history") },
    { key:"profile",   icon:"👤", label:"Profile",   onClick:()=>setPage("profile") },
  ];
  return (
    <AppShell nav={nav} accent={accent} appName={customName||"BillEase"} logo="🔵" activePage={page}>
      {page === "dashboard" && (
        <div style={{ padding:26 }}>
          <div style={{ background:`linear-gradient(135deg,${accent},#164e63)`, borderRadius:20, padding:28, marginBottom:22 }}>
            <p style={{ color:"rgba(255,255,255,0.65)", fontSize:14 }}>Total Due This Month</p>
            <p style={{ fontSize:42, fontWeight:900, color:"#fff", margin:"6px 0" }}>₹{totalDue.toLocaleString("en-IN")}</p>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:12 }}>{unpaid.length} pending • {bills.length-unpaid.length} paid • {mandates.length} auto-pay active</p>
          </div>
          {bills.length === 0 ? (
            <div style={{ ...S.card, textAlign:"center", padding:48 }}>
              <div style={{ fontSize:52, marginBottom:12 }}>📭</div>
              <p style={{ color:"#64748b", marginBottom:18, fontSize:15 }}>No bills added yet</p>
              <button onClick={() => setPage("add_bill")} style={btn(accent)}>+ Add Your First Bill</button>
            </div>
          ) : (
            <>
              <h3 style={S.h3}>Upcoming Bills</h3>
              {bills.map(b => (
                <div key={b.id} style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"center", opacity:b.paid?0.5:1 }}>
                  <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                    <div style={{ width:44, height:44, borderRadius:10, background:`${CAT_COLORS[b.cat]||"#64748b"}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{CAT_ICONS[b.cat]||"📄"}</div>
                    <div><p style={{ color:"#f1f5f9", fontWeight:700, fontSize:15, margin:"0 0 2px" }}>{b.name}</p><p style={{ color:"#64748b", fontSize:13, margin:0 }}>{b.cat} • Due {b.due}</p></div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ fontWeight:900, fontSize:16, color:"#f8fafc", margin:"0 0 4px" }}>₹{Number(b.amount).toLocaleString("en-IN")}</p>
                    {b.paid ? <span style={{ color:"#22c55e", fontSize:13 }}>✅ Paid</span> : <button onClick={() => setPage("pay_bill")} style={{ background:accent, border:"none", color:"#fff", padding:"5px 14px", borderRadius:7, fontSize:13, cursor:"pointer", fontWeight:700, fontFamily:"inherit" }}>Pay →</button>}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
      {page === "add_bill" && <AddBillPage accent={accent} onAdd={b => { setBills(bs => [...bs, { ...b, id:Date.now(), paid:false }]); setPage("dashboard"); }} />}
      {page === "pay_bill" && <PayBillPage accent={accent} bills={bills} setBills={setBills} history={history} setHistory={setHistory} onDone={() => setPage("dashboard")} onPage={onPage} />}
      {page === "auto_pay" && <AutoPayPage accent={accent} mandates={mandates} setMandates={setMandates} />}
      {page === "history" && <div style={{ padding:26 }}><h1 style={S.h1}>📋 Payment History</h1>{history.length===0?<div style={{ ...S.card, textAlign:"center", padding:48, color:"#334155" }}><div style={{ fontSize:48, marginBottom:12 }}>📭</div><p style={{ fontSize:15 }}>No payments yet</p></div>:history.map(h=>(<div key={h.id} style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"center" }}><div style={{ display:"flex", gap:12 }}><div style={{ width:42, height:42, borderRadius:10, background:`${CAT_COLORS[h.cat]||"#64748b"}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{CAT_ICONS[h.cat]||"📄"}</div><div><p style={{ color:"#f1f5f9", fontWeight:700, fontSize:14, margin:"0 0 2px" }}>{h.name}</p><p style={{ color:"#64748b", fontSize:12, margin:0 }}>Paid via BBPS • {h.time}</p></div></div><div style={{ textAlign:"right" }}><p style={{ color:"#f87171", fontWeight:800, fontSize:15, margin:"0 0 2px" }}>-₹{Number(h.amount).toLocaleString("en-IN")}</p><p style={{ color:"#22c55e", fontSize:11, margin:0 }}>✓ Confirmed</p></div></div>))}</div>}
      {page === "profile" && <div style={{ padding:26, maxWidth:420 }}><h1 style={S.h1}>👤 Profile</h1><div style={S.card}>{[["Bills Added",String(bills.length)],["Auto Pay",`${mandates.length} mandates`],["Platform","BBPS + NACH"],["Paid This Month",history.length+" bills"]].map(([k,v])=>(<div key={k} style={S.row}><span style={{ color:"#64748b" }}>{k}</span><span style={{ color:"#f1f5f9", fontWeight:700 }}>{v}</span></div>))}</div></div>}
    </AppShell>
  );
}

function AddBillPage({ accent, onAdd }) {
  const [f, setF] = useState({ name:"", cat:"Electricity", amount:"", due:"" });
  return (
    <div style={{ padding:26, maxWidth:480 }}>
      <h1 style={S.h1}>➕ Add New Bill</h1>
      <div style={S.card}>
        <div style={{ marginBottom:14 }}><label style={S.label}>Bill Name</label><input placeholder="e.g. Jio Fiber, BESCOM" value={f.name} onChange={e=>setF({...f,name:e.target.value})} style={S.input}/></div>
        <div style={{ marginBottom:14 }}>
          <label style={S.label}>Category</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {Object.keys(CAT_ICONS).map(c => (
              <button key={c} onClick={()=>setF({...f,cat:c})} style={{ padding:"10px 6px", borderRadius:8, border:`1px solid ${f.cat===c?CAT_COLORS[c]||"#1e3a5f":"#1e3a5f"}`, background:f.cat===c?`${CAT_COLORS[c]||"#0e7490"}25`:"#070e1a", color:f.cat===c?CAT_COLORS[c]||"#22d3ee":"#94a3b8", cursor:"pointer", fontSize:12, fontWeight:f.cat===c?700:400, fontFamily:"inherit" }}>{CAT_ICONS[c]} {c}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:14 }}><label style={S.label}>Amount (₹)</label><input type="number" min="1" placeholder="Enter bill amount" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} style={S.input}/></div>
        <div style={{ marginBottom:20 }}><label style={S.label}>Due Date</label><input placeholder="e.g. 15 Mar, 28 Mar" value={f.due} onChange={e=>setF({...f,due:e.target.value})} style={S.input}/></div>
        <button onClick={()=>f.name&&f.amount&&f.due&&onAdd(f)} disabled={!f.name||!f.amount||!f.due} style={{...btn(accent),opacity:(!f.name||!f.amount||!f.due)?0.45:1}}>Add Bill</button>
      </div>
    </div>
  );
}

function PayBillPage({ accent, bills, setBills, history, setHistory, onDone, onPage }) {
  const [sel, setSel] = useState(null);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const unpaid = bills.filter(b => !b.paid);
  const pay = () => {
    setPaying(true); onPage("pay_bill");
    setTimeout(() => {
      setBills(bs => bs.map(b => b.id===sel.id ? {...b,paid:true} : b));
      setHistory(h => [{ id:Date.now(), name:sel.name, cat:sel.cat, amount:sel.amount, time:new Date().toLocaleTimeString() }, ...h]);
      setPaying(false); setDone(true);
    }, 2000);
  };
  if (done) return <div style={{ padding:26, maxWidth:440 }}><div style={{ ...S.card, textAlign:"center", padding:48 }}><div style={{ fontSize:60, marginBottom:16 }}>✅</div><h3 style={{ color:"#22c55e", fontSize:22, fontWeight:900 }}>Bill Paid!</h3><p style={{ color:"#94a3b8", marginTop:10, fontSize:15 }}>₹{Number(sel.amount).toLocaleString("en-IN")} paid to {sel.name} via BBPS</p><button onClick={()=>{setDone(false);setSel(null);onDone();}} style={{ ...btn(accent), marginTop:24 }}>Back to Dashboard</button></div></div>;
  return (
    <div style={{ padding:26, maxWidth:480 }}>
      <h1 style={S.h1}>💳 Pay Bill</h1>
      {!sel ? (
        unpaid.length===0 ? <div style={{ ...S.card, textAlign:"center", padding:48 }}>🎉 All bills paid!</div> :
        unpaid.map(b => (
          <button key={b.id} onClick={() => setSel(b)} style={{ ...S.card, width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", border:"1px solid #1e3a5f", textAlign:"left", marginBottom:12 }}>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}><div style={{ width:44, height:44, borderRadius:10, background:`${CAT_COLORS[b.cat]||"#64748b"}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{CAT_ICONS[b.cat]||"📄"}</div><div><p style={{ color:"#f1f5f9", fontWeight:700, fontSize:15, margin:"0 0 2px" }}>{b.name}</p><p style={{ color:"#64748b", fontSize:13, margin:0 }}>Due {b.due}</p></div></div>
            <span style={{ color:"#f8fafc", fontWeight:900, fontSize:16 }}>₹{Number(b.amount).toLocaleString("en-IN")}</span>
          </button>
        ))
      ) : (
        <div style={S.card}>
          <div style={{ background:"#070e1a", borderRadius:12, padding:16, marginBottom:20, border:"1px solid #1e3a5f" }}>
            <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}><div style={{ width:46, height:46, borderRadius:10, background:`${CAT_COLORS[sel.cat]||"#64748b"}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>{CAT_ICONS[sel.cat]||"📄"}</div><div><p style={{ color:"#f8fafc", fontWeight:800, fontSize:16, margin:0 }}>{sel.name}</p><p style={{ color:"#64748b", fontSize:13, margin:0 }}>{sel.cat}</p></div></div>
            {[["Amount","₹"+Number(sel.amount).toLocaleString("en-IN")],["Due",sel.due],["Via","BBPS (Bharat Bill Payment System)"]].map(([k,v])=>(<div key={k} style={S.row}><span style={{ color:"#64748b" }}>{k}</span><span style={{ color:"#f1f5f9", fontWeight:600 }}>{v}</span></div>))}
          </div>
          <div style={{ display:"flex", gap:10 }}><button onClick={()=>setSel(null)} style={{...btn("#1e3a5f"),flex:1}}>← Back</button><button onClick={pay} disabled={paying} style={{...btn(accent),flex:2}}>{paying?"Processing via BBPS…":"Pay ₹"+Number(sel.amount).toLocaleString("en-IN")}</button></div>
        </div>
      )}
    </div>
  );
}

function AutoPayPage({ accent, mandates, setMandates }) {
  const [f, setF] = useState({ biller:"", amount:"", date:"" });
  const [flash, setFlash] = useState(false);
  const add = () => {
    if (!f.biller||!f.amount||!f.date) return;
    setMandates(m => [...m, { ...f, id:Date.now() }]);
    setF({ biller:"", amount:"", date:"" }); setFlash(true); setTimeout(() => setFlash(false), 3000);
  };
  return (
    <div style={{ padding:26 }}>
      <h1 style={S.h1}>🔄 Auto Pay (NACH)</h1>
      <div style={S.card}>
        <h3 style={S.h3}>New Mandate</h3>
        <div style={{ marginBottom:14 }}><label style={S.label}>Biller Name</label><input placeholder="e.g. Jio Fiber, BESCOM" value={f.biller} onChange={e=>setF({...f,biller:e.target.value})} style={S.input}/></div>
        <div style={{ marginBottom:14 }}><label style={S.label}>Monthly Amount (₹)</label><input type="number" min="1" placeholder="999" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} style={S.input}/></div>
        <div style={{ marginBottom:20 }}><label style={S.label}>Auto-Debit Day</label><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{[1,5,7,10,15,20,25,28].map(d=>(<button key={d} onClick={()=>setF({...f,date:String(d)})} style={{ padding:"9px 14px", borderRadius:8, border:`1px solid ${f.date==d?accent:"#1e3a5f"}`, background:f.date==d?`${accent}25`:"transparent", color:f.date==d?"#22d3ee":"#94a3b8", cursor:"pointer", fontSize:14, fontWeight:700, fontFamily:"inherit" }}>{d}th</button>))}</div></div>
        {flash && <div style={{ background:"#05966920", border:"1px solid #059669", borderRadius:8, padding:10, marginBottom:12, color:"#22c55e", fontSize:14, fontWeight:700 }}>✅ NACH mandate created!</div>}
        <button onClick={add} disabled={!f.biller||!f.amount||!f.date} style={{...btn(accent),opacity:(!f.biller||!f.amount||!f.date)?0.45:1}}>Create Auto Pay</button>
      </div>
      {mandates.length > 0 && <div style={S.card}><h3 style={S.h3}>Active Mandates</h3>{mandates.map(m=>(<div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:"1px solid #070e1a" }}><div><p style={{ color:"#f1f5f9", fontWeight:700, fontSize:15, margin:"0 0 2px" }}>{m.biller}</p><p style={{ color:"#64748b", fontSize:13, margin:0 }}>₹{m.amount}/month • {m.date}th</p></div><span style={S.badge("#059669")}>ACTIVE</span></div>))}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FULL APPLICATION 5 — FINANCIAL ANALYTICS DASHBOARD
   Architecture: Auth Vault → API Gateway → Price Feed Service → WebSocket Server →
                 Portfolio Tracker → NLP Categorizer → D3.js Visualization → PostgreSQL Ledger
═══════════════════════════════════════════════════════════════════════ */
function App_FinanceAnalytics({ onPage, customName }) {
  const [authed, setAuthed] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [holdings, setHoldings] = useState([]);
  const accent = "#7c3aed";
  useEffect(() => { onPage(page); }, [page]);
  if (!authed) return <LoginScreen accent={accent} appName={customName||"WealthLens"} logo="🔮" tagline="Financial analytics dashboard" onLogin={() => { setAuthed(true); setPage("dashboard"); }} />;
  const nav = [
    { key:"dashboard",   icon:"🏠", label:"Dashboard",   onClick:()=>setPage("dashboard") },
    { key:"portfolio",   icon:"📈", label:"Portfolio",   onClick:()=>setPage("portfolio") },
    { key:"live_prices", icon:"💹", label:"Live Prices", onClick:()=>setPage("live_prices") },
    { key:"analytics",   icon:"📊", label:"Spending",    onClick:()=>setPage("analytics") },
    { key:"profile",     icon:"👤", label:"Profile",     onClick:()=>setPage("profile") },
  ];
  return (
    <AppShell nav={nav} accent={accent} appName={customName||"WealthLens"} logo="🔮" activePage={page}>
      {page === "dashboard" && <AnalyticsDash accent={accent} onNavigate={setPage} holdings={holdings} />}
      {page === "portfolio" && <PortfolioPage accent={accent} holdings={holdings} setHoldings={setHoldings} />}
      {page === "live_prices" && <LivePricesWidget accent={accent} onPage={onPage} />}
      {page === "analytics" && <SpendingPage accent={accent} />}
      {page === "profile" && <div style={{ padding:26, maxWidth:420 }}><h1 style={S.h1}>👤 Profile</h1><div style={S.card}>{[["DEMAT","CDSL Active"],["Risk Profile","Moderate"],["Holdings",String(holdings.length)+" stocks"],["ML Models","NLP Categorizer + D3.js"]].map(([k,v])=>(<div key={k} style={S.row}><span style={{ color:"#64748b" }}>{k}</span><span style={{ color:"#f1f5f9", fontWeight:700 }}>{v}</span></div>))}</div></div>}
    </AppShell>
  );
}

function AnalyticsDash({ accent, onNavigate, holdings }) {
  const [prices, setPrices] = useState({ RELIANCE:2847, TCS:3921, INFY:1823 });
  useEffect(() => {
    const t = setInterval(() => setPrices(p => ({ RELIANCE:+(p.RELIANCE+(Math.random()-.5)*15).toFixed(2), TCS:+(p.TCS+(Math.random()-.5)*20).toFixed(2), INFY:+(p.INFY+(Math.random()-.5)*12).toFixed(2) })), 2000);
    return () => clearInterval(t);
  }, []);
  const totalVal = holdings.reduce((s,h) => s+h.qty*h.ltp, 0);
  return (
    <div style={{ padding:26 }}>
      <div style={{ background:`linear-gradient(135deg,${accent},#1d4ed8)`, borderRadius:20, padding:28, marginBottom:22 }}>
        <p style={{ color:"rgba(255,255,255,0.65)", fontSize:14 }}>Portfolio Value</p>
        {holdings.length===0?<p style={{ color:"rgba(255,255,255,0.5)", fontSize:17, margin:"10px 0", fontWeight:700 }}>Add holdings to see portfolio value</p>:<p style={{ fontSize:44, fontWeight:900, color:"#fff", margin:"6px 0" }}>₹{totalVal.toLocaleString("en-IN")}</p>}
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:12 }}>{holdings.length} stocks tracked • NSE WebSocket Live</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:22 }}>
        {[["📈","Portfolio","portfolio"],["💹","Live Prices","live_prices"],["📊","Spending","analytics"],["👤","Profile","profile"]].map(([ic,lb,pg]) => (
          <button key={pg} onClick={() => onNavigate(pg)} style={{ ...S.card, border:"1px solid #1e3a5f", cursor:"pointer", textAlign:"center", padding:20, marginBottom:0 }}>
            <div style={{ fontSize:28, marginBottom:6 }}>{ic}</div><div style={{ fontSize:13, color:"#94a3b8", fontWeight:700 }}>{lb}</div>
          </button>
        ))}
      </div>
      <div style={S.card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <h3 style={{ ...S.h3, marginBottom:0 }}>Live Prices 🔴</h3>
          <button onClick={() => onNavigate("live_prices")} style={{ background:"none", border:"none", color:accent, cursor:"pointer", fontSize:13, fontFamily:"inherit" }}>View all →</button>
        </div>
        {Object.entries(prices).map(([sym,p]) => (
          <div key={sym} style={S.row}><span style={{ color:"#f1f5f9", fontWeight:700, fontFamily:"monospace", fontSize:15 }}>{sym}</span><span style={{ color:"#22c55e", fontWeight:900, fontSize:15 }}>₹{p.toFixed(2)}</span></div>
        ))}
      </div>
    </div>
  );
}

function PortfolioPage({ accent, holdings, setHoldings }) {
  const [f, setF] = useState({ symbol:"", qty:"", avg:"", ltp:"" });
  const [adding, setAdding] = useState(false);
  const COLORS = ["#3b82f6","#7c3aed","#059669","#dc2626","#f59e0b","#0e7490","#e11d48","#16a34a"];
  const add = () => {
    if (!f.symbol||!f.qty||!f.avg||!f.ltp) return;
    setHoldings(h => [...h, { name:f.symbol.toUpperCase(), qty:+f.qty, avg:+f.avg, ltp:+f.ltp, color:COLORS[h.length%COLORS.length] }]);
    setF({ symbol:"", qty:"", avg:"", ltp:"" }); setAdding(false);
  };
  const tv = holdings.reduce((s,h) => s+h.qty*h.ltp, 0);
  const tp = holdings.reduce((s,h) => s+h.qty*(h.ltp-h.avg), 0);
  return (
    <div style={{ padding:26 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
        <h1 style={{ ...S.h1, marginBottom:0 }}>📈 Portfolio</h1>
        <button onClick={() => setAdding(a=>!a)} style={{ ...btn(accent||"#7c3aed"), width:"auto", padding:"10px 20px", fontSize:14 }}>{adding?"Cancel":"+ Add Stock"}</button>
      </div>
      {adding && <div style={S.card}>
        <h3 style={S.h3}>Add Holding</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div><label style={S.label}>Symbol</label><input placeholder="RELIANCE" value={f.symbol} onChange={e=>setF({...f,symbol:e.target.value})} style={S.input}/></div>
          <div><label style={S.label}>Quantity</label><input type="number" min="1" placeholder="10" value={f.qty} onChange={e=>setF({...f,qty:e.target.value})} style={S.input}/></div>
          <div><label style={S.label}>Avg Buy Price (₹)</label><input type="number" min="1" placeholder="2700" value={f.avg} onChange={e=>setF({...f,avg:e.target.value})} style={S.input}/></div>
          <div><label style={S.label}>Current Price (₹)</label><input type="number" min="1" placeholder="2847" value={f.ltp} onChange={e=>setF({...f,ltp:e.target.value})} style={S.input}/></div>
        </div>
        <button onClick={add} disabled={!f.symbol||!f.qty||!f.avg||!f.ltp} style={{...btn(accent||"#7c3aed"),opacity:(!f.symbol||!f.qty||!f.avg||!f.ltp)?0.45:1}}>Add to Portfolio</button>
      </div>}
      {holdings.length===0 ? <div style={{ ...S.card, textAlign:"center", padding:48, color:"#334155" }}><div style={{ fontSize:48, marginBottom:12 }}>📊</div><p style={{ fontSize:15 }}>No holdings yet. Add your first stock above.</p></div> : (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
            {[["Current Value","₹"+tv.toLocaleString("en-IN"),"#f8fafc"],["Total P&L",(tp>=0?"+":"")+"₹"+Math.abs(Math.round(tp)).toLocaleString("en-IN"),tp>=0?"#22c55e":"#f87171"]].map(([k,v,c]) => (
              <div key={k} style={S.card}><p style={{ color:"#64748b", fontSize:13, marginBottom:6, marginTop:0 }}>{k}</p><p style={{ color:c, fontWeight:900, fontSize:22, margin:0 }}>{v}</p></div>
            ))}
          </div>
          <div style={S.card}>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", fontSize:12, color:"#475569", fontWeight:700, padding:"6px 0", borderBottom:"1px solid #070e1a" }}><span>STOCK</span><span style={{ textAlign:"right" }}>LTP</span><span style={{ textAlign:"right" }}>QTY</span><span style={{ textAlign:"right" }}>P&L</span></div>
            {holdings.map(h => { const pnl=(h.ltp-h.avg)*h.qty; return (<div key={h.name} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", padding:"13px 0", borderBottom:"1px solid #070e1a", alignItems:"center" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:9, height:9, borderRadius:"50%", background:h.color }} /><span style={{ color:"#f1f5f9", fontWeight:700, fontSize:14 }}>{h.name}</span></div><span style={{ textAlign:"right", color:"#f1f5f9", fontWeight:700, fontSize:14 }}>₹{h.ltp}</span><span style={{ textAlign:"right", color:"#94a3b8", fontSize:14 }}>{h.qty}</span><span style={{ textAlign:"right", fontWeight:800, fontSize:14, color:pnl>=0?"#22c55e":"#f87171" }}>{pnl>=0?"+":""}₹{Math.abs(Math.round(pnl))}</span></div>); })}
          </div>
        </>
      )}
    </div>
  );
}

function LivePricesWidget({ accent, onPage }) {
  const [prices, setPrices] = useState({ RELIANCE:{p:2847,c:+1.2}, TCS:{p:3921,c:-0.8}, INFY:{p:1823,c:+0.4}, HDFC:{p:1654,c:+2.1}, WIPRO:{p:456,c:-1.5}, ICICI:{p:1120,c:+0.9}, BAJAJ:{p:7234,c:+1.7}, MARUTI:{p:12450,c:-0.3} });
  useEffect(() => {
    onPage && onPage("live_prices");
    const t = setInterval(() => setPrices(prev => { const u={}; Object.entries(prev).forEach(([s,d])=>{ const delta=(Math.random()-.5)*25; u[s]={p:+(d.p+delta).toFixed(2),c:+((delta/d.p)*100).toFixed(2)}; }); return u; }), 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ padding:26 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h1 style={S.h1}>💹 NSE Live</h1>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:9, height:9, borderRadius:"50%", background:"#ef4444" }} /><span style={{ fontSize:12, color:"#f87171", fontWeight:700 }}>LIVE WebSocket</span></div>
      </div>
      <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", padding:"11px 18px", fontSize:12, color:"#475569", fontWeight:700, borderBottom:"1px solid #070e1a" }}><span>SYMBOL</span><span style={{ textAlign:"right" }}>PRICE</span><span style={{ textAlign:"right" }}>CHANGE</span></div>
        {Object.entries(prices).map(([sym,d]) => (
          <div key={sym} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", padding:"14px 18px", borderBottom:"1px solid #070e1a", alignItems:"center" }}>
            <span style={{ fontFamily:"monospace", fontWeight:800, color:"#f1f5f9", fontSize:15 }}>{sym}</span>
            <span style={{ textAlign:"right", fontWeight:900, color:"#f8fafc", fontSize:15 }}>₹{d.p.toFixed(2)}</span>
            <span style={{ textAlign:"right", fontWeight:700, fontSize:13, color:d.c>=0?"#22c55e":"#f87171" }}>{d.c>=0?"▲":"▼"} {Math.abs(d.c).toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpendingPage() {
  const [txns, setTxns] = useState([]);
  const [f, setF] = useState({ desc:"", amount:"", cat:"Food" });
  const SCATS = ["Food","Shopping","Transport","Bills","Entertainment","Other"];
  const SCOLORS = { Food:"#ef4444", Shopping:"#3b82f6", Transport:"#f59e0b", Bills:"#059669", Entertainment:"#8b5cf6", Other:"#64748b" };
  const addTxn = () => {
    if (!f.desc||!f.amount||+f.amount<=0) return;
    setTxns(t => [{ id:Date.now(), desc:f.desc, amount:+f.amount, cat:f.cat, time:new Date().toLocaleTimeString() }, ...t]);
    setF({ desc:"", amount:"", cat:"Food" });
  };
  const total = txns.reduce((s,t) => s+t.amount, 0);
  const bycat = SCATS.map(c => ({ cat:c, total:txns.filter(t=>t.cat===c).reduce((s,t)=>s+t.amount,0), color:SCOLORS[c] })).filter(c=>c.total>0);
  return (
    <div style={{ padding:26 }}>
      <h1 style={S.h1}>📊 Spending Analytics</h1>
      <div style={S.card}>
        <h3 style={S.h3}>Add Transaction</h3>
        <div style={{ marginBottom:12 }}><label style={S.label}>Description</label><input placeholder="e.g. Zomato, Uber, Amazon" value={f.desc} onChange={e=>setF({...f,desc:e.target.value})} style={S.input}/></div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div><label style={S.label}>Amount (₹)</label><input type="number" min="1" placeholder="500" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} style={S.input}/></div>
          <div><label style={S.label}>Category</label><select value={f.cat} onChange={e=>setF({...f,cat:e.target.value})} style={{...S.input,background:"#070e1a"}}>{SCATS.map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
        <button onClick={addTxn} disabled={!f.desc||!f.amount} style={{...btn("#7c3aed"),opacity:(!f.desc||!f.amount)?0.45:1}}>Add (NLP auto-tags)</button>
      </div>
      {txns.length === 0 ? <div style={{ ...S.card, textAlign:"center", padding:48, color:"#334155" }}><div style={{ fontSize:48, marginBottom:12 }}>📊</div><p style={{ fontSize:15 }}>Add transactions to see spending analytics</p></div> : (
        <>
          <div style={{ ...S.card, marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:14 }}><div><p style={{ color:"#64748b", fontSize:13, margin:0 }}>Total Spent</p><p style={{ color:"#f8fafc", fontWeight:900, fontSize:24, margin:"4px 0 0" }}>₹{total.toLocaleString("en-IN")}</p></div><div style={{ textAlign:"right" }}><p style={{ color:"#64748b", fontSize:13, margin:0 }}>{txns.length} transactions</p></div></div>
            {bycat.length>0 && <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:80, marginBottom:8 }}>{bycat.map(c=>(<div key={c.cat} style={{ flex:1, height:`${Math.max(10,(c.total/total)*70)}px`, background:c.color, borderRadius:"4px 4px 0 0", minWidth:20 }}/>))}</div>}
          </div>
          {bycat.map(c => (
            <div key={c.cat} style={{ ...S.card, display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:13, height:13, borderRadius:"50%", background:c.color, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><span style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>{c.cat}</span><span style={{ fontSize:14, fontWeight:900, color:"#f8fafc" }}>₹{c.total.toLocaleString("en-IN")}</span></div>
                <div style={{ height:6, background:"#070e1a", borderRadius:3 }}><div style={{ height:6, borderRadius:3, background:c.color, width:`${(c.total/total)*100}%` }}/></div>
              </div>
              <span style={{ fontSize:13, color:"#64748b", fontWeight:700 }}>{Math.round((c.total/total)*100)}%</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   WEBSITE PREVIEW ROUTER
═══════════════════════════════════════════════════════════════════════ */
function WebsitePreview({ appType, onPage, customName }) {
  if (!appType) return (
    <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <div style={{ fontSize:64, opacity:0.3 }}>🏗️</div>
      <p style={{ color:"#1e3a5f", fontSize:16 }}>Select an architecture to preview the live app</p>
    </div>
  );
  // Individual modules
  if (appType === "auth")       return <ModuleAuth        onPage={onPage} />;
  if (appType === "send_money") return <ModuleSendMoney   onPage={onPage} />;
  if (appType === "qr_payment") return <ModuleQRPayment   onPage={onPage} />;
  if (appType === "wallet")     return <ModuleWallet      onPage={onPage} />;
  if (appType === "loan")       return <ModuleLoan        onPage={onPage} />;
  if (appType === "bbps")       return <ModuleBillPayment onPage={onPage} />;
  if (appType === "price_feed") return <ModulePriceFeed   onPage={onPage} />;
  // Full applications
  if (appType === "digital_wallet")    return <App_DigitalWallet    onPage={onPage} customName={customName} />;
  if (appType === "p2p_payment")       return <App_P2PPayment       onPage={onPage} customName={customName} />;
  if (appType === "ai_lending")        return <App_AILending        onPage={onPage} customName={customName} />;
  if (appType === "bill_manager")      return <App_BillManager      onPage={onPage} customName={customName} />;
  if (appType === "finance_analytics") return <App_FinanceAnalytics  onPage={onPage} customName={customName} />;
  // Combos — use nearest app
  if (appType === "wallet_payment")    return <App_DigitalWallet    onPage={onPage} customName={customName} />;
  if (appType === "payment_lending")   return <App_P2PPayment       onPage={onPage} customName={customName} />;
  if (appType === "full_platform")     return <App_DigitalWallet    onPage={onPage} customName={customName} />;
  return <div style={{ padding:32, color:"#64748b", textAlign:"center", fontSize:15 }}><div style={{ fontSize:48, marginBottom:16 }}>🔍</div><p>App type <strong style={{ color:"#f8fafc" }}>"{appType}"</strong> not mapped yet.</p></div>;
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [query,       setQuery]       = useState("");
  const [selectedType,setSelectedType]= useState("");
  const [appType,     setAppType]     = useState(null);
  const [arch,        setArch]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [activePage,  setActivePage]  = useState("login");
  const [nodeInfo,    setNodeInfo]    = useState(null);
  const [customName,  setCustomName]  = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  /* Live page tracing */
  const handlePage = useCallback((p) => {
    setActivePage(p);
    const labels = PAGE_NODE_MAP[p] || [];
    if (labels.length === 0) return;
    setNodes(nds => nds.map(n => {
      const col = n.data.color || "#3b82f6";
      const hit = labels.some(l => n.data.label.toLowerCase() === l.toLowerCase() || n.data.label.toLowerCase().includes(l.toLowerCase().split(" ")[0]));
      return hit
        ? { ...n, style:{ ...n.style, border:"2.5px solid #fff", boxShadow:`0 0 0 3px ${col}, 0 0 28px 10px ${col}`, zIndex:999 } }
        : { ...n, style:{ ...n.style, border:"1.5px solid rgba(255,255,255,0.18)", boxShadow:`0 4px 18px ${col}55`, opacity:0.55, zIndex:1 } };
    }));
    setTimeout(() => {
      setNodes(nds => nds.map(n => { const col = n.data.color||"#3b82f6"; return { ...n, style:{ ...n.style, border:"1.5px solid rgba(255,255,255,0.18)", boxShadow:`0 4px 18px ${col}55`, opacity:1, zIndex:1 } }; }));
    }, 2400);
  }, []);

  const generate = () => {
    const type = selectedType || detectType(query);
    if (!type && !query.trim()) return;
    const resolvedType = type || "full_platform";
    const archData = APP_ARCHITECTURES[resolvedType];
    if (!archData) return;
    setLoading(true);
    setNodeInfo(null);
    setActivePage("login");
    setTimeout(() => {
      setArch({ ...archData, app_type: resolvedType });
      setAppType(resolvedType);
      const { nodes: n, edges: e } = buildNodes(archData.modules);
      setNodes(n);
      setEdges(e);
      setLoading(false);
    }, 300);
  };

  const APP_TABS = [
    { type:"digital_wallet",    label:"Digital Wallet",  icon:"💜" },
    { type:"p2p_payment",       label:"P2P Payment",     icon:"💚" },
    { type:"ai_lending",        label:"AI Lending",      icon:"🟡" },
    { type:"bill_manager",      label:"Bill Manager",    icon:"🔵" },
    { type:"finance_analytics", label:"Analytics",       icon:"🔮" },
  ];

  const selectTab = (type) => {
    setSelectedType(type);
    const archData = APP_ARCHITECTURES[type];
    if (!archData) return;
    setLoading(true);
    setNodeInfo(null);
    setActivePage("login");
    setTimeout(() => {
      setArch({ ...archData, app_type: type });
      setAppType(type);
      const { nodes: n, edges: e } = buildNodes(archData.modules);
      setNodes(n); setEdges(e);
      setLoading(false);
    }, 200);
  };

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:"#030810", color:"#fff", fontFamily:"'Inter', 'SF Pro Display', system-ui, sans-serif", overflow:"hidden" }}>

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div style={{ flexShrink:0, background:"rgba(5,10,22,0.97)", borderBottom:"1px solid #0f1e35", backdropFilter:"blur(8px)", zIndex:20 }}>
        {/* Top row */}
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 18px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, flexShrink:0 }}>
            <div style={{ width:34, height:34, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:16, boxShadow:"0 0 16px #3b82f655" }}>F</div>
            <div>
              <div style={{ fontWeight:900, fontSize:16, background:"linear-gradient(90deg,#60a5fa,#a78bfa)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>FoundryAI</div>
              <div style={{ fontSize:10, color:"#475569", marginTop:-2 }}>Fintech Architecture Platform</div>
            </div>
          </div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && generate()}
            placeholder='Describe your fintech app… e.g. "I want a UPI payment app with fraud detection"'
            style={{ flex:1, background:"#0a1220", border:"1px solid #1e3a5f", borderRadius:9, padding:"10px 16px", color:"#f1f5f9", fontSize:14, outline:"none", fontFamily:"inherit" }}
          />
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            style={{ background:"#0a1220", border:"1px solid #1e3a5f", borderRadius:9, padding:"10px 12px", color:"#f1f5f9", fontSize:13, minWidth:220, outline:"none", fontFamily:"inherit" }}
          >
            <option value="">— Select Architecture —</option>
            <optgroup label="── Individual Modules ──">
              {DROPDOWN.modules.map(m => <option key={m.id} value={m.type}>{m.name}</option>)}
            </optgroup>
            <optgroup label="── Full Applications ──">
              {DROPDOWN.full_apps.map(m => <option key={m.id} value={m.type}>{m.name}</option>)}
            </optgroup>
            <optgroup label="── Combinations ──">
              {DROPDOWN.combinations.map(m => <option key={m.id} value={m.type}>{m.name}</option>)}
            </optgroup>
          </select>
          <input
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            placeholder="App name (optional)"
            style={{ width:160, background:"#0a1220", border:"1px solid #1e3a5f", borderRadius:9, padding:"10px 12px", color:"#f1f5f9", fontSize:13, outline:"none", fontFamily:"inherit" }}
          />
          <button
            onClick={generate}
            disabled={loading}
            style={{ background: loading?"#1e3a5f":"linear-gradient(135deg,#3b82f6,#8b5cf6)", border:"none", borderRadius:9, padding:"10px 22px", color:"#fff", fontWeight:700, cursor: loading?"not-allowed":"pointer", fontSize:14, flexShrink:0, boxShadow: loading?"none":"0 4px 20px #3b82f655", fontFamily:"inherit" }}
          >
            {loading ? "⏳ …" : "⚡ Generate"}
          </button>
        </div>
        {/* App tabs */}
        <div style={{ display:"flex", gap:4, padding:"0 18px 10px", overflowX:"auto" }}>
          {APP_TABS.map(t => (
            <button
              key={t.type}
              onClick={() => selectTab(t.type)}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 16px", borderRadius:8, border:`1px solid ${appType===t.type?"#3b82f6":"#0f1e35"}`, background: appType===t.type?"#3b82f618":"transparent", color: appType===t.type?"#60a5fa":"#64748b", fontWeight: appType===t.type?700:400, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit", flexShrink:0, transition:"all 0.2s" }}
            >
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SPLIT SCREEN ─────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* LEFT — Website Preview */}
        <div style={{ width:"50%", borderRight:"1px solid #0f1e35", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"7px 16px", borderBottom:"1px solid #0f1e35", display:"flex", alignItems:"center", gap:8, background:"rgba(5,10,22,0.9)", flexShrink:0 }}>
            <div style={{ width:11, height:11, borderRadius:"50%", background:"#ef4444" }} />
            <div style={{ width:11, height:11, borderRadius:"50%", background:"#f59e0b" }} />
            <div style={{ width:11, height:11, borderRadius:"50%", background:"#22c55e" }} />
            <span style={{ marginLeft:10, fontSize:12, color:"#475569" }}>{customName || arch?.name || "Live Preview"}</span>
            {appType && <span style={{ marginLeft:"auto", fontSize:11, color:"#22c55e", fontWeight:700 }}>● {activePage.replace(/_/g," ")}</span>}
          </div>
          <div style={{ flex:1, overflow:"hidden" }}>
            <WebsitePreview appType={appType} onPage={handlePage} customName={customName} />
          </div>
        </div>

        {/* RIGHT — Architecture Diagram */}
        <div style={{ width:"50%", display:"flex", flexDirection:"column", background:"#040b18" }}>
          <div style={{ padding:"7px 16px", borderBottom:"1px solid #0f1e35", fontSize:12, color:"#475569", display:"flex", justifyContent:"space-between", flexShrink:0, background:"rgba(5,10,22,0.9)" }}>
            <span>🏗️ Architecture {arch ? "— "+arch.pattern : ""}</span>
            <span style={{ color:"#22c55e", fontWeight:700 }}>⚡ {activePage.replace(/_/g," ")}</span>
          </div>
          <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
            {nodes.length > 0 ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={(_, n) => setNodeInfo(n.data)}
                fitView
                fitViewOptions={{ padding:0.22, maxZoom:1.1 }}
                minZoom={0.2}
                maxZoom={2.5}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#0d1b2e" gap={26} size={1} />
                <Controls style={{ bottom:16, right:16, left:"auto" }} />
              </ReactFlow>
            ) : (
              <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}>
                <div style={{ fontSize:52, opacity:0.2 }}>🏗️</div>
                <p style={{ color:"#0f1e35", fontSize:14 }}>Architecture diagram appears here</p>
              </div>
            )}
          </div>
          {/* Node info panel */}
          {nodeInfo && (
            <div style={{ borderTop:"1px solid #0f1e35", background:"rgba(4,11,24,0.98)", padding:"14px 18px", flexShrink:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ color:"#60a5fa", fontWeight:800, fontSize:14 }}>📦 {nodeInfo.label}</span>
                <button onClick={() => setNodeInfo(null)} style={{ background:"none", border:"none", color:"#475569", cursor:"pointer", fontSize:18, lineHeight:1, padding:0 }}>✕</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 18px", fontSize:13 }}>
                {nodeInfo.tech && <p style={{ margin:"0 0 4px" }}><strong style={{ color:"#60a5fa" }}>Tech: </strong><span style={{ color:"#cbd5e1" }}>{nodeInfo.tech}</span></p>}
                {nodeInfo.tools && <p style={{ margin:"0 0 4px" }}><strong style={{ color:"#a78bfa" }}>Tools: </strong><span style={{ color:"#cbd5e1" }}>{nodeInfo.tools}</span></p>}
                {nodeInfo.why && <p style={{ gridColumn:"1/-1", margin:"0 0 4px" }}><strong style={{ color:"#34d399" }}>Why: </strong><span style={{ color:"#cbd5e1" }}>{nodeInfo.why}</span></p>}
                {nodeInfo.protocols && <p style={{ margin:"0 0 4px" }}><strong style={{ color:"#f87171" }}>Protocols: </strong><span style={{ color:"#cbd5e1" }}>{nodeInfo.protocols}</span></p>}
                {nodeInfo.rbi && <p style={{ margin:"0 0 4px" }}><strong style={{ color:"#fbbf24" }}>RBI/SEBI: </strong><span style={{ color:"#fcd34d" }}>{nodeInfo.rbi}</span></p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── STATUS BAR ───────────────────────────────────────────────── */}
      {arch && (
        <div style={{ padding:"5px 20px", background:"rgba(4,11,24,0.97)", borderTop:"1px solid #0f1e35", display:"flex", gap:18, fontSize:12, color:"#475569", flexShrink:0, flexWrap:"wrap", alignItems:"center" }}>
          <span>📦 <strong style={{ color:"#e2e8f0" }}>{customName||arch.name}</strong></span>
          <span>⚙️ <strong style={{ color:"#60a5fa" }}>{arch.pattern}</strong></span>
          <span>🗄️ <strong style={{ color:"#34d399" }}>{arch.database}</strong></span>
          <span>🔒 <strong style={{ color:"#f87171" }}>{arch.security}</strong></span>
          <span>📊 <strong style={{ color:"#fbbf24" }}>{arch.complexity}</strong></span>
          <span style={{ marginLeft:"auto", color:"#22c55e", fontWeight:700 }}>● Arch tracing ON • {nodes.length} nodes</span>
        </div>
      )}
    </div>
  );
}