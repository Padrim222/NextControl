/**
 * NEXT CONTROL — E2E Test Script (Playwright)
 * Testa login, redirect e fluxos principais para cada role.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const PASS = 'NextControl2026!';

const USERS = [
  { role: 'admin',  email: 'admin@nextbase.com',  expectedPath: '/admin',  label: 'Rafa (admin)' },
  { role: 'cs',     email: 'cs@nextbase.com',      expectedPath: '/cs',     label: 'Jô (CS)' },
  { role: 'seller', email: 'seller@nextbase.com',  expectedPath: '/seller', label: 'Ronaldo (seller)' },
  { role: 'closer', email: 'closer@nextbase.com',  expectedPath: '/closer', label: 'Ana (closer)' },
  { role: 'client', email: 'client@nextbase.com',  expectedPath: '/agent',  label: 'João (client)' },
];

const results = [];

function log(msg) { console.log(msg); }
function pass(label, msg) { log(`  ✅ ${label}: ${msg}`); results.push({ label, status: 'pass', msg }); }
function fail(label, msg) { log(`  ❌ ${label}: ${msg}`); results.push({ label, status: 'fail', msg }); }
function warn(label, msg) { log(`  ⚠️  ${label}: ${msg}`); results.push({ label, status: 'warn', msg }); }

async function testUser(browser, user) {
  log(`\n${'─'.repeat(50)}`);
  log(`👤 ${user.label} (${user.email})`);
  log('─'.repeat(50));

  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  try {
    // 1. Landing page loads
    await page.goto(BASE, { waitUntil: 'networkidle' });
    if (page.url().includes(BASE)) pass(user.label, 'Landing page carregou');

    // 2. Navigate to login
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passInput  = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible()) {
      pass(user.label, 'Tela de login visível');
    } else {
      fail(user.label, 'Tela de login NÃO encontrada');
      await context.close();
      return;
    }

    // 3. Login
    await emailInput.fill(user.email);
    await passInput.fill(PASS);
    await page.keyboard.press('Enter');

    // Wait for redirect
    try {
      await page.waitForURL(url => !url.includes('/login'), { timeout: 10000 });
      const currentPath = new URL(page.url()).pathname;
      if (currentPath.startsWith(user.expectedPath)) {
        pass(user.label, `Login OK → redirect correto para ${currentPath}`);
      } else {
        warn(user.label, `Login OK mas redirect inesperado: ${currentPath} (esperado: ${user.expectedPath})`);
      }
    } catch {
      // Check for error message
      const errMsg = await page.locator('[class*="error"], [class*="toast"], [role="alert"]').first().textContent().catch(() => '');
      fail(user.label, `Login falhou ou não redirecionou. Msg: ${errMsg || 'sem mensagem'}`);
      await context.close();
      return;
    }

    // 4. Dashboard carregou (sem tela branca)
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').textContent();
    if (bodyText && bodyText.length > 100) {
      pass(user.label, 'Dashboard carregou com conteúdo');
    } else {
      fail(user.label, 'Dashboard possivelmente em branco');
    }

    // 5. Role-specific flows
    if (user.role === 'admin') {
      await testAdmin(page, user.label);
    } else if (user.role === 'seller') {
      await testSeller(page, user.label);
    } else if (user.role === 'closer') {
      await testCloser(page, user.label);
    } else if (user.role === 'client') {
      await testClient(page, user.label);
    } else if (user.role === 'cs') {
      await testCS(page, user.label);
    }

    // 6. RoleGuard: tenta acessar rota de outro role
    const forbidden = user.role === 'client' ? '/admin' : '/agent';
    await page.goto(`${BASE}${forbidden}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const afterForbidden = new URL(page.url()).pathname;
    if (!afterForbidden.startsWith(forbidden) || afterForbidden === '/login' || afterForbidden === user.expectedPath) {
      pass(user.label, `RoleGuard OK — bloqueou acesso a ${forbidden} (→ ${afterForbidden})`);
    } else {
      fail(user.label, `RoleGuard FALHOU — acessou ${forbidden} sem permissão`);
    }

    // 7. Console errors
    const appErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('hot-update') && !e.includes('net::ERR')
    );
    if (appErrors.length === 0) {
      pass(user.label, 'Zero erros no console');
    } else {
      warn(user.label, `${appErrors.length} erro(s) no console:\n    ${appErrors.slice(0, 3).join('\n    ')}`);
    }

  } catch (err) {
    fail(user.label, `Erro inesperado: ${err.message}`);
  } finally {
    await context.close();
  }
}

async function testAdmin(page, label) {
  // AdminManage — criar usuário
  await page.goto(`${BASE}/admin/manage`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const adminContent = await page.locator('body').textContent();
  if (adminContent.includes('Usuário') || adminContent.includes('Cliente') || adminContent.includes('Manage')) {
    pass(label, 'AdminManage carregou');
  } else {
    warn(label, 'AdminManage — conteúdo inesperado');
  }

  // CallsPipeline
  await page.goto(`${BASE}/admin/calls-pipeline`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const callsContent = await page.locator('body').textContent();
  if (callsContent.includes('Call') || callsContent.includes('Upload') || callsContent.includes('Pipeline')) {
    pass(label, 'CallsPipeline carregou');
  } else {
    warn(label, 'CallsPipeline — conteúdo inesperado');
  }

  // RagManager
  await page.goto(`${BASE}/admin/rag`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const ragContent = await page.locator('body').textContent();
  if (ragContent.includes('RAG') || ragContent.includes('Conhecimento') || ragContent.includes('Document')) {
    pass(label, 'RagManager carregou');
  } else {
    warn(label, 'RagManager — conteúdo inesperado');
  }
}

async function testSeller(page, label) {
  // DailyReport
  await page.goto(`${BASE}/seller/report`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const content = await page.locator('body').textContent();
  if (content.includes('Check') || content.includes('Diário') || content.includes('Métrica')) {
    pass(label, 'DailyReport carregou');
  } else {
    warn(label, 'DailyReport — conteúdo inesperado');
  }

  // WeeklyEvolution
  await page.goto(`${BASE}/seller/evolution`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const evo = await page.locator('body').textContent();
  if (evo.includes('Evolução') || evo.includes('Semana') || evo.includes('Gráfico') || evo.length > 200) {
    pass(label, 'WeeklyEvolution carregou');
  } else {
    warn(label, 'WeeklyEvolution — conteúdo inesperado');
  }

  // Training
  await page.goto(`${BASE}/training/coach`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const coach = await page.locator('body').textContent();
  if (coach.includes('Treinador') || coach.includes('Coach') || coach.includes('Pergunta') || coach.length > 200) {
    pass(label, 'CoachChat carregou');
  } else {
    warn(label, 'CoachChat — conteúdo inesperado');
  }
}

async function testCloser(page, label) {
  // CallAnalysis
  await page.goto(`${BASE}/closer/call-analysis`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const content = await page.locator('body').textContent();
  if (content.includes('Call') || content.includes('Análise') || content.includes('Upload') || content.length > 200) {
    pass(label, 'CallAnalysis carregou');
  } else {
    warn(label, 'CallAnalysis — conteúdo inesperado');
  }
}

async function testClient(page, label) {
  // AgentPage — página principal do cliente
  await page.goto(`${BASE}/agent`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const content = await page.locator('body').textContent();
  if (content.includes('Agente') || content.includes('Consultoria') || content.includes('Olá') || content.length > 200) {
    pass(label, 'AgentPage carregou');
  } else {
    warn(label, 'AgentPage — conteúdo inesperado');
  }

  // Onboarding
  await page.goto(`${BASE}/client/onboarding`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const onboarding = await page.locator('body').textContent();
  if (onboarding.includes('Empresa') || onboarding.includes('Briefing') || onboarding.includes('Fundador')) {
    pass(label, 'OnboardingForm carregou');
  } else {
    warn(label, 'OnboardingForm — conteúdo inesperado');
  }
}

async function testCS(page, label) {
  // CSInbox
  await page.goto(`${BASE}/cs`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const content = await page.locator('body').textContent();
  if (content.includes('Inbox') || content.includes('Submissão') || content.includes('CS') || content.length > 200) {
    pass(label, 'CSInbox carregou');
  } else {
    warn(label, 'CSInbox — conteúdo inesperado');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true });

log('\n🚀 NEXT CONTROL — E2E Test Suite');
log(`📅 ${new Date().toLocaleString('pt-BR')}`);
log(`🌐 ${BASE}\n`);

for (const user of USERS) {
  await testUser(browser, user);
}

await browser.close();

// ── Summary ───────────────────────────────────────────────────────────────────
log(`\n${'═'.repeat(50)}`);
log('📊 RESUMO FINAL');
log('═'.repeat(50));
const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
const warned = results.filter(r => r.status === 'warn').length;
log(`✅ Passou:   ${passed}`);
log(`❌ Falhou:   ${failed}`);
log(`⚠️  Atenção:  ${warned}`);
log(`📋 Total:    ${results.length}`);

if (failed > 0) {
  log('\n❌ FALHAS:');
  results.filter(r => r.status === 'fail').forEach(r => log(`  • ${r.label}: ${r.msg}`));
}
if (warned > 0) {
  log('\n⚠️  AVISOS:');
  results.filter(r => r.status === 'warn').forEach(r => log(`  • ${r.label}: ${r.msg}`));
}

log('\n' + (failed === 0 ? '🎉 Todos os fluxos críticos passaram!' : '🔧 Corrija as falhas antes do deploy.'));
process.exit(failed > 0 ? 1 : 0);
