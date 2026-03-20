import { useState } from "react";

const C = {
  bg: "#0C1C30", card: "#122842", cardHov: "#1A3456",
  gold: "#A08A4E", goldM: "#B89D5C", cream: "#F8F6F1",
  white: "#FFF", text: "#CBD5E1", dim: "#94A3B8",
  green: "#34D399", blue: "#60A5FA", purple: "#A78BFA",
  orange: "#FB923C", border: "rgba(160,138,78,0.25)",
};

const Badge = ({ children, color = C.gold }) => (
  <span style={{ display: "inline-block", background: `${color}18`, color, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, letterSpacing: ".04em", textTransform: "uppercase", border: `1px solid ${color}33` }}>
    {children}
  </span>
);

const Box = ({ children, style, glow, active }) => (
  <div style={{ background: active ? C.cardHov : C.card, border: `1px solid ${active ? C.gold : C.border}`, borderRadius: 10, padding: "16px 20px", boxShadow: glow ? `0 0 20px ${C.gold}22` : "none", ...style }}>
    {children}
  </div>
);

const Down = ({ label }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 0", gap: 2 }}>
    {label && <span style={{ fontSize: 10, color: C.dim, letterSpacing: ".05em", textTransform: "uppercase" }}>{label}</span>}
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
  </div>
);

const Code = ({ children }) => (
  <code style={{ color: C.goldM, background: `${C.gold}15`, padding: "1px 5px", borderRadius: 3, fontSize: 12 }}>{children}</code>
);

const TABS = ["Overview", "Middleware", "Folders", "Components", "Deploy"];

/* ═══════════ OVERVIEW ═══════════ */
const Overview = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <Box>
      <div style={{ color: C.gold, fontWeight: 700, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>DNS Layer</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: C.bg, borderRadius: 8, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ color: C.blue, fontWeight: 700, fontSize: 14 }}>requitygroup.com</div>
          <div style={{ color: C.dim, fontSize: 11, marginTop: 4 }}>Full corporate site</div>
          <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Badge>/</Badge><Badge>/about</Badge><Badge>/invest</Badge><Badge color={C.goldM}>/lending</Badge>
          </div>
        </div>
        <div style={{ background: C.bg, borderRadius: 8, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ color: C.orange, fontWeight: 700, fontSize: 14 }}>requitylending.com</div>
          <div style={{ color: C.dim, fontSize: 11, marginTop: 4 }}>Lending-focused experience</div>
          <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
            <Badge color={C.orange}>/</Badge><Badge color={C.orange}>/programs</Badge><Badge color={C.orange}>/apply</Badge><Badge color={C.orange}>/process</Badge>
          </div>
        </div>
      </div>
    </Box>

    <Down label="Both point to same Netlify deploy" />

    <Box glow>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ color: C.gold, fontWeight: 700, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase" }}>Next.js Middleware</span>
        <Badge color={C.green}>NEW</Badge>
      </div>
      <div style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>
        Reads <Code>request.headers.get("host")</Code> and rewrites routes based on domain. Sets <Code>x-site-domain</Code> header for layout decisions.
      </div>
    </Box>

    <Down label="Routes to correct page group" />

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <Box>
        <div style={{ color: C.blue, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>(corporate)/</div>
        <div style={{ color: C.text, fontSize: 12, lineHeight: 1.7 }}>Home, About, Invest, Team<br/>Full nav, requitygroup.com branding</div>
      </Box>
      <Box>
        <div style={{ color: C.orange, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>(lending)/</div>
        <div style={{ color: C.text, fontSize: 12, lineHeight: 1.7 }}>Lending home, Programs, Apply<br/>Lending nav, requitylending.com brand</div>
      </Box>
    </div>

    <Down label="Both use shared layout shell" />

    <Box>
      <div style={{ color: C.gold, fontWeight: 700, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Shared Foundation</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[["Nav.tsx","Domain-aware header"],["Footer.tsx","Shared footer"],["globals.css","Design tokens"],["@repo/ui","shadcn components"],["Supabase","CMS + data"],["Netlify","Single deploy"]].map(([l,d])=>(
          <div key={l} style={{ background: C.bg, borderRadius: 6, padding: "8px 10px", border: `1px solid ${C.border}` }}>
            <div style={{ color: C.cream, fontSize: 11, fontWeight: 700 }}>{l}</div>
            <div style={{ color: C.dim, fontSize: 10, marginTop: 2 }}>{d}</div>
          </div>
        ))}
      </div>
    </Box>
  </div>
);

/* ═══════════ MIDDLEWARE ═══════════ */
const Middleware = () => {
  const lines = [
    [1,"// middleware.ts  (uses NextResponse + NextRequest)",C.dim],
    [2,"",C.dim],
    [3,"",C.dim],
    [4,"const LENDING = 'requitylending.com';",C.orange],
    [5,"",C.dim],
    [6,"export function middleware(req: NextRequest) {",C.blue],
    [7,"  const host = req.headers.get('host') ?? '';",C.white],
    [8,"  const isLending = host.includes(LENDING);",C.orange],
    [9,"  const { pathname } = req.nextUrl;",C.white],
    [10,"",C.dim],
    [11,"  // Lending domain root -> rewrite to /lending",C.dim],
    [12,"  if (isLending && pathname === '/') {",C.orange],
    [13,"    const url = req.nextUrl.clone();",C.text],
    [14,"    url.pathname = '/lending';",C.orange],
    [15,"    const res = NextResponse.rewrite(url);",C.green],
    [16,"    res.headers.set('x-site-domain','lending');",C.purple],
    [17,"    return res;",C.green],
    [18,"  }",C.orange],
    [19,"",C.dim],
    [20,"  // All other requests: pass through + tag",C.dim],
    [21,"  const res = NextResponse.next();",C.blue],
    [22,"  res.headers.set('x-site-domain',",C.purple],
    [23,"    isLending ? 'lending' : 'corporate'",C.purple],
    [24,"  );",C.purple],
    [25,"  return res;",C.blue],
    [26,"}",C.blue],
    [27,"",C.dim],
    [28,"export const config = {",C.dim],
    [29,"  matcher: ['/((?!_next|api|favicon).*)'],",C.gold],
    [30,"};",C.dim],
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ color: C.white, fontSize: 16, fontWeight: 700 }}>middleware.ts</div>
        <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>Rewrites requitylending.com root to /lending route; tags all requests with domain header</div>
      </div>
      <Box style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: C.cream, fontSize: 12, fontWeight: 600 }}>apps/requity-group/middleware.ts</span>
          <Badge color={C.green}>NEW FILE</Badge>
        </div>
        <div style={{ fontFamily: "'SF Mono',monospace", fontSize: 11, lineHeight: 1.9, overflowX: "auto" }}>
          {lines.map(([n,code,color]) => (
            <div key={n} style={{ display: "flex", padding: "0 14px" }}>
              <span style={{ color: C.dim, opacity: .35, width: 28, flexShrink: 0, textAlign: "right", paddingRight: 14, userSelect: "none" }}>{n}</span>
              <span style={{ color, whiteSpace: "pre" }}>{code}</span>
            </div>
          ))}
        </div>
      </Box>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Box>
          <div style={{ color: C.orange, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>requitylending.com/</div>
          <div style={{ color: C.text, fontSize: 11 }}>Rewritten to <Code>/lending</Code> internally</div>
          <div style={{ color: C.dim, fontSize: 10, marginTop: 4 }}>URL bar still shows requitylending.com</div>
        </Box>
        <Box>
          <div style={{ color: C.blue, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>requitygroup.com/lending</div>
          <div style={{ color: C.text, fontSize: 11 }}>Serves same <Code>/lending</Code> page directly</div>
          <div style={{ color: C.dim, fontSize: 10, marginTop: 4 }}>Lending tab on corporate nav links here</div>
        </Box>
      </div>
    </div>
  );
};

/* ═══════════ FOLDERS ═══════════ */
const Folders = () => {
  const [open, setOpen] = useState({ a: true, c: true, l: true, m: true });
  const t = (k) => setOpen(p => ({ ...p, [k]: !p[k] }));

  const F = ({ name, tag, tc, kids, k, d = 0 }) => (
    <div style={{ marginLeft: d * 18 }}>
      <div onClick={k ? () => t(k) : undefined} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", cursor: k ? "pointer" : "default" }}>
        <span style={{ color: C.goldM, fontSize: 11, fontFamily: "monospace", width: 12 }}>{k ? (open[k] ? "▾" : "▸") : " "}</span>
        <span style={{ color: C.cream, fontSize: 12, fontWeight: 500 }}>{name}</span>
        {tag && <Badge color={tc}>{tag}</Badge>}
      </div>
      {(!k || open[k]) && kids}
    </div>
  );

  const Fi = ({ name, tag, tc, desc, d = 0 }) => (
    <div style={{ marginLeft: d * 18, display: "flex", alignItems: "center", gap: 6, padding: "3px 0 3px 18px" }}>
      <span style={{ color: C.dim, fontSize: 10 }}>&#9702;</span>
      <span style={{ color: C.text, fontSize: 11, fontFamily: "monospace" }}>{name}</span>
      {tag && <Badge color={tc || C.green}>{tag}</Badge>}
      {desc && <span style={{ color: C.dim, fontSize: 10 }}>{desc}</span>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ color: C.white, fontSize: 16, fontWeight: 700 }}>Folder Structure</div>
        <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>Route groups separate domains while sharing the layout shell</div>
      </div>
      <Box style={{ fontFamily: "monospace" }}>
        <Fi name="middleware.ts" tag="NEW" tc={C.green} desc="Domain routing" />
        <F name="app/" k="a" d={0} kids={<>
          <Fi name="layout.tsx" tag="MOD" tc={C.purple} desc="Domain-aware shell" d={1} />
          <Fi name="globals.css" desc="Shared tokens" d={1} />
          <F name="(corporate)/" tag="GROUP" tc={C.blue} k="c" d={1} kids={<>
            <Fi name="page.tsx" desc="Homepage (existing)" d={2} />
            <Fi name="about/page.tsx" desc="About (existing)" d={2} />
            <Fi name="invest/page.tsx" desc="Invest (existing)" d={2} />
          </>} />
          <F name="(lending)/" tag="GROUP" tc={C.orange} k="l" d={1} kids={<>
            <Fi name="page.tsx" desc="Lending homepage" d={2} />
            <Fi name="programs/page.tsx" tag="NEW" tc={C.green} d={2} />
            <Fi name="apply/page.tsx" tag="NEW" tc={C.green} d={2} />
            <Fi name="process/page.tsx" tag="NEW" tc={C.green} d={2} />
          </>} />
          <F name="components/" k="m" d={1} kids={<>
            <Fi name="Nav.tsx" tag="MOD" tc={C.purple} desc="Domain-aware" d={2} />
            <Fi name="Footer.tsx" desc="Shared" d={2} />
            <Fi name="PageHero.tsx" desc="Shared" d={2} />
            <Fi name="LendingNav.tsx" tag="NEW" tc={C.green} d={2} />
          </>} />
        </>} />
        <F name="lib/" d={0} kids={<>
          <Fi name="supabase.ts" desc="Data fetching" d={1} />
          <Fi name="domains.ts" tag="NEW" tc={C.green} desc="Domain config" d={1} />
        </>} />
      </Box>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <Box style={{ padding: "10px 14px", textAlign: "center" }}><Badge color={C.green}>NEW</Badge><div style={{ color: C.text, fontSize: 11, marginTop: 4 }}>5 files</div></Box>
        <Box style={{ padding: "10px 14px", textAlign: "center" }}><Badge color={C.purple}>MODIFIED</Badge><div style={{ color: C.text, fontSize: 11, marginTop: 4 }}>2 files</div></Box>
        <Box style={{ padding: "10px 14px", textAlign: "center" }}><Badge color={C.dim}>EXISTING</Badge><div style={{ color: C.text, fontSize: 11, marginTop: 4 }}>Untouched</div></Box>
      </div>
    </div>
  );
};

/* ═══════════ COMPONENTS ═══════════ */
const Components = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div>
      <div style={{ color: C.white, fontSize: 16, fontWeight: 700 }}>Domain-Aware Components</div>
      <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>Shared components adapt based on which domain is serving</div>
    </div>

    <Box>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ color: C.cream, fontWeight: 700, fontSize: 13 }}>Nav.tsx</span>
        <Badge color={C.purple}>MODIFIED</Badge>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ color: C.blue, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>requitygroup.com</div>
          <div style={{ background: C.bg, borderRadius: 6, padding: "10px 12px", border: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: C.cream, fontWeight: 800, fontSize: 11 }}>REQUITY</span>
            <span style={{ color: C.text, fontSize: 11 }}>About</span>
            <span style={{ color: C.text, fontSize: 11 }}>Invest</span>
            <span style={{ color: C.gold, fontSize: 11, fontWeight: 700 }}>Lending</span>
            <span style={{ color: C.goldM, fontSize: 10, border: `1px solid ${C.gold}44`, padding: "2px 8px", borderRadius: 4 }}>Login</span>
          </div>
        </div>
        <div>
          <div style={{ color: C.orange, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>requitylending.com</div>
          <div style={{ background: C.bg, borderRadius: 6, padding: "10px 12px", border: `1px solid ${C.border}`, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: C.cream, fontWeight: 800, fontSize: 11 }}>REQUITY LENDING</span>
            <span style={{ color: C.text, fontSize: 11 }}>Programs</span>
            <span style={{ color: C.text, fontSize: 11 }}>Process</span>
            <span style={{ color: C.goldM, fontSize: 10, border: `1px solid ${C.gold}44`, padding: "2px 8px", borderRadius: 4 }}>Submit Deal</span>
          </div>
        </div>
      </div>
    </Box>

    <Box>
      <div style={{ color: C.cream, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>layout.tsx logic</div>
      <div style={{ fontFamily: "monospace", fontSize: 11, color: C.text, lineHeight: 1.9, background: C.bg, borderRadius: 6, padding: 12, border: `1px solid ${C.border}` }}>
        <div><span style={{ color: C.purple }}>const</span> domain = headers().get(<span style={{ color: C.green }}>'x-site-domain'</span>);</div>
        <div><span style={{ color: C.purple }}>const</span> isLending = domain === <span style={{ color: C.green }}>'lending'</span>;</div>
        <div style={{ height: 4 }} />
        <div>{"<"}<span style={{ color: C.blue }}>Nav</span> <span style={{ color: C.orange }}>variant</span>={"{"}isLending ? <span style={{ color: C.green }}>'lending'</span> : <span style={{ color: C.green }}>'corporate'</span>{"}"} /{">"}</div>
        <div>{"{"}children{"}"}</div>
        <div>{"<"}<span style={{ color: C.blue }}>Footer</span> <span style={{ color: C.orange }}>variant</span>={"{"}isLending ? <span style={{ color: C.green }}>'lending'</span> : <span style={{ color: C.green }}>'corporate'</span>{"}"} /{">"}</div>
      </div>
    </Box>

    <Box>
      <div style={{ color: C.cream, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Cross-Domain Links</div>
      {[
        ["requitygroup.com", "Lending tab", "requitylending.com", C.orange],
        ["requitylending.com", "About link", "requitygroup.com/about", C.blue],
        ["requitylending.com", "Invest link", "requitygroup.com/invest", C.blue],
        ["requitygroup.com", "Submit Deal CTA", "requitylending.com/apply", C.orange],
      ].map(([from, action, to, color], i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: C.bg, borderRadius: 6, padding: "8px 12px", border: `1px solid ${C.border}`, marginTop: i ? 6 : 0 }}>
          <span style={{ color: C.text, fontSize: 11, minWidth: 120 }}>{from}</span>
          <span style={{ color: C.goldM, fontSize: 10, flex: 1 }}>{action}</span>
          <span style={{ color: C.goldM, fontSize: 12 }}>&#8594;</span>
          <span style={{ color, fontSize: 11, fontWeight: 700 }}>{to}</span>
        </div>
      ))}
    </Box>
  </div>
);

/* ═══════════ DEPLOY ═══════════ */
const Deploy = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div>
      <div style={{ color: C.white, fontSize: 16, fontWeight: 700 }}>Deployment and DNS</div>
      <div style={{ color: C.dim, fontSize: 12, marginTop: 2 }}>Both domains, same Netlify site, middleware handles the rest</div>
    </div>

    <Box>
      <div style={{ color: C.gold, fontWeight: 700, fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>Netlify Setup</div>
      {[
        ["1", "Add requitylending.com as domain alias", "In site settings, add as custom domain alongside requitygroup.com. Both serve the same deploy."],
        ["2", "Point DNS", "CNAME requitylending.com to same Netlify URL. Netlify provisions TLS automatically."],
        ["3", "No build changes", "Same netlify.toml, same build. Middleware handles domain logic at request time."],
      ].map(([n, title, desc]) => (
        <div key={n} style={{ display: "flex", gap: 12, background: C.bg, borderRadius: 6, padding: "12px 14px", border: `1px solid ${C.border}`, marginTop: n > 1 ? 8 : 0 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: `${C.gold}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: C.gold, fontWeight: 800, fontSize: 12 }}>{n}</span>
          </div>
          <div>
            <div style={{ color: C.cream, fontSize: 12, fontWeight: 700 }}>{title}</div>
            <div style={{ color: C.dim, fontSize: 11, marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
          </div>
        </div>
      ))}
    </Box>

    <Box>
      <div style={{ color: C.cream, fontWeight: 700, fontSize: 13, marginBottom: 10 }}>SEO Handled</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          ["Canonical URLs", "Each domain sets own canonical base"],
          ["Separate sitemaps", "sitemap-corporate.xml + sitemap-lending.xml"],
          ["Structured data", "FinancialService + LoanOrCredit schemas"],
          ["No duplicate content", "Middleware prevents double indexing"],
        ].map(([t, d]) => (
          <div key={t} style={{ background: C.bg, borderRadius: 6, padding: "10px 12px", border: `1px solid ${C.border}` }}>
            <div style={{ color: C.cream, fontSize: 11, fontWeight: 700 }}>&#10003; {t}</div>
            <div style={{ color: C.dim, fontSize: 10, marginTop: 2 }}>{d}</div>
          </div>
        ))}
      </div>
    </Box>

    <Box>
      <div style={{ color: C.cream, fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Environment Variables</div>
      <div style={{ fontFamily: "monospace", fontSize: 11, lineHeight: 1.8, background: C.bg, borderRadius: 6, padding: 12, border: `1px solid ${C.border}` }}>
        <div style={{ color: C.dim }}># New (optional)</div>
        <div><span style={{ color: C.orange }}>NEXT_PUBLIC_CORPORATE_DOMAIN</span>=<span style={{ color: C.green }}>requitygroup.com</span></div>
        <div><span style={{ color: C.orange }}>NEXT_PUBLIC_LENDING_DOMAIN</span>=<span style={{ color: C.green }}>requitylending.com</span></div>
      </div>
    </Box>
  </div>
);

/* ═══════════ MAIN ═══════════ */
const views = [Overview, Middleware, Folders, Components, Deploy];

export default function App() {
  const [tab, setTab] = useState(0);
  const View = views[tab];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "28px 20px", fontFamily: "'Inter',-apple-system,sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ color: C.gold, fontWeight: 800, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 4 }}>Architecture Map</div>
          <div style={{ color: C.white, fontSize: 24, fontWeight: 800 }}>Requity Group + Lending</div>
          <div style={{ color: C.dim, fontSize: 13, marginTop: 4 }}>
            One Next.js app in <Code>apps/requity-group</Code> serving both domains via middleware.
          </div>
        </div>

        <div style={{ display: "flex", gap: 3, marginBottom: 20, background: C.card, borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              flex: 1, padding: "9px 6px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 700, fontFamily: "inherit",
              background: tab === i ? C.cardHov : "transparent",
              color: tab === i ? C.gold : C.dim,
            }}>{t}</button>
          ))}
        </div>

        <View />

        <div style={{ marginTop: 28, padding: "14px 18px", background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 16 }}>
            {[["5",C.green,"New files"],["2",C.purple,"Modified"],["1",C.gold,"Deploy"],["2",C.blue,"Domains"]].map(([v,c,l])=>(
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ color: c, fontSize: 18, fontWeight: 800 }}>{v}</div>
                <div style={{ color: C.dim, fontSize: 9, textTransform: "uppercase", letterSpacing: ".04em" }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ color: C.dim, fontSize: 11, textAlign: "right" }}>
            Minimal changes. <span style={{ color: C.cream }}>Zero breaking.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
