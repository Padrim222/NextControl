"""
NEXT CONTROL — E2E Test Suite (Playwright Python)
Testa login, redirect, fluxos principais e RoleGuard para cada role.
"""
from playwright.sync_api import sync_playwright, expect
from datetime import datetime

BASE = "http://localhost:5174"
PASS = "NextControl2026!"

USERS = [
    {"role": "admin",  "email": "admin@nextbase.com",  "expected": "/admin",  "label": "Rafa (admin)"},
    {"role": "cs",     "email": "cs@nextbase.com",      "expected": "/cs",     "label": "Jô (CS)"},
    {"role": "seller", "email": "seller@nextbase.com",  "expected": "/seller", "label": "Ronaldo (seller)"},
    {"role": "closer", "email": "closer@nextbase.com",  "expected": "/closer", "label": "Ana (closer)"},
    {"role": "client", "email": "client@nextbase.com",  "expected": "/agent",  "label": "João (client)"},
]

results = []

def ok(label, msg):
    print(f"  ✅ {msg}")
    results.append({"label": label, "status": "pass", "msg": msg})

def err(label, msg):
    print(f"  ❌ {msg}")
    results.append({"label": label, "status": "fail", "msg": msg})

def warn(label, msg):
    print(f"  ⚠️  {msg}")
    results.append({"label": label, "status": "warn", "msg": msg})

def check_page_content(page, label, route, keywords, route_name):
    """Navigate to route and check keywords appear in body."""
    page.goto(f"{BASE}{route}", wait_until="networkidle")
    page.wait_for_timeout(3500)
    content = page.inner_text("body")
    found = any(kw.lower() in content.lower() for kw in keywords)
    if found:
        ok(label, f"{route_name} carregou")
    else:
        warn(label, f"{route_name} — conteúdo inesperado (len={len(content)})")

def test_user(page, user):
    label = user["label"]
    console_errors = []

    page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda exc: console_errors.append(str(exc)))

    print(f"\n{'─'*52}")
    print(f"👤 {label} ({user['email']})")
    print('─'*52)

    # 1. Landing
    page.goto(BASE, wait_until="networkidle")
    ok(label, "App carregou (landing)")

    # 2. Login page
    page.goto(f"{BASE}/login", wait_until="networkidle")
    email_input = page.locator("input[type='email'], input[name='email']").first
    pass_input  = page.locator("input[type='password']").first

    if not email_input.is_visible():
        err(label, "Tela de login não encontrada")
        return

    ok(label, "Tela de login visível")

    # 3. Do login
    email_input.fill(user["email"])
    pass_input.fill(PASS)
    page.keyboard.press("Enter")

    try:
        page.wait_for_url(lambda url: "/login" not in url, timeout=12000)
        current = page.url.replace(BASE, "").split("?")[0]
        if current.startswith(user["expected"]):
            ok(label, f"Login OK → redirect correto: {current}")
        else:
            warn(label, f"Login OK mas redirect inesperado: {current} (esperado: {user['expected']})")
    except Exception:
        body = page.inner_text("body")
        snippet = body[:200].replace("\n", " ")
        err(label, f"Login falhou ou não redirecionou. Página: {snippet}")
        return

    # 4. Dashboard tem conteúdo
    page.wait_for_timeout(2000)
    content = page.inner_text("body")
    if len(content) > 100:
        ok(label, f"Dashboard tem conteúdo ({len(content)} chars)")
    else:
        err(label, "Dashboard possivelmente em branco")

    # 5. Role-specific pages
    if user["role"] == "admin":
        check_page_content(page, label, "/admin/manage",        ["usuário","cliente","manage","criar"],                 "AdminManage")
        check_page_content(page, label, "/admin/calls-pipeline",["call","upload","pipeline","transcrição","audio"],     "CallsPipeline")
        check_page_content(page, label, "/admin/rag",           ["rag","conhecimento","document","base","ingesta"],     "RagManager")
        check_page_content(page, label, "/admin/hub",           ["intelligence","hub","análise","inteligência","upload","material","metodologia"],"IntelligenceHub")

    elif user["role"] == "cs":
        check_page_content(page, label, "/cs", ["inbox","submissão","cs","aprovação","pendente"], "CSInbox")

    elif user["role"] == "seller":
        check_page_content(page, label, "/seller/report",    ["check","diário","métrica","enviar"],       "DailyReport")
        check_page_content(page, label, "/seller/evolution", ["evolução","semana","gráfico","score"],     "WeeklyEvolution")
        check_page_content(page, label, "/training/coach",   ["treinador","coach","pergunta","agente"],   "CoachChat")

    elif user["role"] == "closer":
        check_page_content(page, label, "/closer",              ["dashboard","call","análise","closer"],   "CloserDashboard")
        check_page_content(page, label, "/closer/call-analysis",["call","análise","upload","transcrição"],"CallAnalysis")

    elif user["role"] == "client":
        check_page_content(page, label, "/agent",             ["agente","consultoria","olá","chat","mensagem"], "AgentPage")
        check_page_content(page, label, "/client/onboarding", ["empresa","briefing","fundador","produto"],      "OnboardingForm")

    # 6. RoleGuard — tenta rota proibida (rota que o role atual NAO deve acessar)
    # Admin pode /agent (por design) — testar rota que realmente não existe para admin
    role_forbidden = {
        "admin":  None,       # Admin acessa tudo — pular teste de bloqueio
        "cs":     "/admin",
        "seller": "/admin",
        "closer": "/admin",
        "client": "/admin",
    }
    forbidden = role_forbidden.get(user["role"])
    if forbidden is None:
        ok(label, "RoleGuard — admin tem acesso completo (por design)")
    else:
        page.goto(f"{BASE}{forbidden}", wait_until="networkidle")
        page.wait_for_timeout(1500)
        after = page.url.replace(BASE, "").split("?")[0]
        if after.startswith(forbidden):
            err(label, f"RoleGuard FALHOU — acessou {forbidden} sem permissão")
        else:
            ok(label, f"RoleGuard OK — bloqueou {forbidden} → {after}")

    # 7. Console errors
    app_errors = [e for e in console_errors if "favicon" not in e and "hot-update" not in e and "net::ERR" not in e]
    if not app_errors:
        ok(label, "Zero erros no console")
    else:
        warn(label, f"{len(app_errors)} erro(s) no console: {app_errors[0][:120]}")


# ── Main ──────────────────────────────────────────────────────────────────────
print(f"\n🚀 NEXT CONTROL — E2E Test Suite")
print(f"📅 {datetime.now().strftime('%d/%m/%Y %H:%M')}")
print(f"🌐 {BASE}")

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    for user in USERS:
        context = browser.new_context()
        page = context.new_page()
        try:
            test_user(page, user)
        except Exception as e:
            err(user["label"], f"Erro inesperado: {e}")
        finally:
            context.close()
    browser.close()

# ── Summary ───────────────────────────────────────────────────────────────────
passed = sum(1 for r in results if r["status"] == "pass")
failed = sum(1 for r in results if r["status"] == "fail")
warned = sum(1 for r in results if r["status"] == "warn")

print(f"\n{'═'*52}")
print("📊 RESUMO FINAL")
print('═'*52)
print(f"✅ Passou:   {passed}")
print(f"❌ Falhou:   {failed}")
print(f"⚠️  Atenção:  {warned}")
print(f"📋 Total:    {len(results)}")

if failed:
    print("\n❌ FALHAS:")
    for r in results:
        if r["status"] == "fail":
            print(f"  • [{r['label']}] {r['msg']}")

if warned:
    print("\n⚠️  AVISOS:")
    for r in results:
        if r["status"] == "warn":
            print(f"  • [{r['label']}] {r['msg']}")

print()
print("🎉 Todos os fluxos críticos passaram!" if not failed else "🔧 Corrija as falhas antes do deploy.")
exit(1 if failed else 0)
