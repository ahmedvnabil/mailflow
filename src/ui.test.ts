import { describe, expect, it } from "vitest";
import {
  aiPage,
  analyticsPage,
  attachmentsPage,
  contactsPage,
  dashboardPage,
  deliverabilityPage,
  emailsPage,
  inboxesPage,
  loginPage,
  logsPage,
  outboundLogsPage,
  outboundPage,
  outboundTemplatesPage,
  outboundTestPage,
  rulesPage,
  settingsPage,
  testPage,
  ticketsPage,
  workflowsPage
} from "./ui";
import { ar } from "./locales/ar";

describe("MailFlow Studio UI", () => {
  it("shows a what happened activity table on operational pages", () => {
    const pages = [
      dashboardPage(),
      inboxesPage(),
      rulesPage(),
      workflowsPage(),
      ticketsPage(),
      contactsPage(),
      emailsPage(),
      attachmentsPage(),
      aiPage(),
      analyticsPage(),
      logsPage(),
      testPage(),
      settingsPage(),
      outboundPage({ defaultFromEmail: "noreply@example.com" }, true),
      deliverabilityPage(),
      outboundTemplatesPage(),
      outboundLogsPage(),
      outboundTestPage({ defaultFromEmail: "noreply@example.com" }, true)
    ].join("\n");

    expect(pages).toContain("ماذا حدث");
    expect(pages).toContain("آخر نشاط في MailFlow");
    expect(pages).toContain("فتح كل السجلات");
  });

  it("keeps empty states hidden until page data has loaded", () => {
    const page = inboxesPage() + contactsPage() + outboundTemplatesPage() + deliverabilityPage();

    expect(page).toContain("loaded:false");
    expect(page).toContain("loaded && !rows.length");
    expect(page).toContain("loaded && !templates.length");
  });

  it("offers the single-user starter pack from the dashboard", () => {
    const page = dashboardPage();

    expect(page).toContain("حزمة البداية للمستخدم الواحد");
    expect(page).toContain("تطبيق حزمة البداية");
    expect(page).toContain("/api/v1/starter-pack/apply");
  });

  it("shows quick reply controls on the emails page", () => {
    const page = emailsPage();

    expect(page).toContain("رد سريع");
    expect(page).toContain("/api/v1/emails/");
    expect(page).toContain("الرد بقالب");
  });

  it("shows a beginner-friendly readiness center on the dashboard", () => {
    const page = dashboardPage();

    expect(page).toContain("مركز جاهزية البريد");
    expect(page).toContain("استقبال البريد");
    expect(page).toContain("إرسال البريد");
    expect(page).toContain("قوالب الرد");
    expect(page).toContain("افتح الوارد");
    expect(page).toContain("اختبار الإرسال");
    expect(page).toContain("افتح الإعدادات");
  });

  it("turns the inbox into a searchable command center", () => {
    const page = emailsPage();

    expect(page).toContain("مركز إدارة الوارد");
    expect(page).toContain("بحث بالمرسل أو الموضوع");
    expect(page).toContain("كل الحالات");
    expect(page).toContain("تحتاج رد");
    expect(page).toContain("تم الرد");
    expect(page).toContain("معاينة الرسالة");
    expect(page).toContain("المسار الزمني");
    expect(page).toContain("filteredRows");
    expect(page).toContain('x-model="statusFilter"');
    expect(page).not.toContain("statusتصفية");
    expect(dashboardPage()).toContain("fromEmail");
    expect(dashboardPage()).not.toContain("fromالبريد");
  });

  it("adds beginner page guides and quick actions after the dashboard", () => {
    const pages = [
      inboxesPage(),
      rulesPage(),
      workflowsPage(),
      ticketsPage(),
      contactsPage(),
      attachmentsPage(),
      aiPage(),
      analyticsPage(),
      logsPage(),
      testPage(),
      settingsPage(),
      outboundPage({ defaultFromEmail: "support@yourdomain.com" }, true),
      deliverabilityPage(),
      outboundTemplatesPage(),
      outboundLogsPage(),
      outboundTestPage({ defaultFromEmail: "support@yourdomain.com" }, true)
    ].join("\n");

    expect(pages).toContain("دليل الصفحة");
    expect(pages).toContain("خطوات سريعة");
    expect(pages).toContain("روابط مفيدة");
    expect(pages).toContain("متى تستخدمها؟");
    expect(pages).toContain("افتح الوارد");
    expect(pages).toContain("اختبار البريد");
  });

  it("presents workflows as a polished automation center", () => {
    const page = workflowsPage();

    expect(page).toContain("كل سير العمل");
    expect(page).toContain("إنشاء سير عمل");
    expect(page).toContain("سير العمل المحفوظة");
    expect(page).toContain("آخر تشغيلات الأتمتة");
    expect(page).toContain("/workflow-runs");
    expect(page).toContain("activeCount()");
    expect(page).toContain("conditionsLabel(row)");
    expect(page).toContain("data-smart-table");
  });

  it("exposes the inbox as a first-class navigation page", () => {
    const page = emailsPage();

    expect(page).toContain('href="/emails"');
    expect(page).toContain("الإيميلات");
    expect(page).toContain("bg-slate-950 text-white");
  });

  it("uses the Arabic locale file for application text", () => {
    expect(ar("Dashboard")).toBe("لوحة التحكم");
    expect(ar("Send reply")).toBe("إرسال الرد");
    expect(dashboardPage()).toContain("لوحة التحكم");
  });

  it("uses bundled CSS instead of the Tailwind CDN", () => {
    const pages = dashboardPage() + loginPage();

    expect(pages).not.toContain("cdn.tailwindcss.com");
    expect(pages).toContain("<style>");
    expect(pages).toContain(".bg-slate-950");
  });

  it("wires local JS enhancements for charts, editors, and smart tables", () => {
    const pages = analyticsPage() + outboundTemplatesPage() + deliverabilityPage();

    expect(pages).toContain('/assets/mailflow-enhance.js');
    expect(pages).toContain('data-chart-title');
    expect(pages).toContain('data-codemirror="html"');
    expect(pages).toContain('data-smart-table');
  });

  it("refreshes code editors when an outbound template is edited or reset", () => {
    const page = outboundTemplatesPage();

    expect(page).toContain("refreshEditors()");
    expect(page).toContain("MailFlowEnhance?.scheduleEnhance");
    expect(page).toContain("edit(t){this.form={...t}");
    expect(page).toContain("reset(){this.variables=''");
  });

  it("explains inbound, outbound, and external app setup in settings", () => {
    const page = settingsPage();

    expect(page).toContain("استقبال الإيميلات من أي خدمة");
    expect(page).toContain("إرسال الإيميلات من MailFlow");
    expect(page).toContain("توصيل مواقعك أو تطبيقاتك");
    expect(page).toContain("POST /api/v1/send-email");
    expect(page).toContain("لا تضع");
    expect(page).toContain("ADMIN_API_KEY");
  });

  it("documents Cloudflare SMTP and Listmonk connection options in settings", () => {
    const page = settingsPage();

    expect(page).toContain("لو هتستخدم Cloudflare كـ SMTP");
    expect(page).toContain("E&#109;ail Routing للاستقبال");
    expect(page).toContain("smtp.mx.cloudflare.net");
    expect(page).toContain("E&#109;ail Send&#105;ng: Ed&#105;t");
    expect(page).toContain("أفضل طريقة لربط Listmonk");
    expect(page).toContain("Listmonk يرسل عبر Cloudflare SMTP");
    expect(page).toContain("Listmonk يرسل عبر MailFlow API");
  });

  it("shows multi-domain deliverability and suppression controls", () => {
    const page = deliverabilityPage();

    expect(page).toContain("جاهزية الدومينات والعناوين");
    expect(page).toContain("الدومينات والمرسلون");
    expect(page).toContain("جاهزية الدومينات");
    expect(page).toContain("إدارة المرسلين");
    expect(page).toContain("قائمة المنع");
    expect(page).toContain("senderList");
    expect(page).toContain("/settings");
    expect(page).toContain("/solo/deliverability");
    expect(page).toContain("/outbound/suppressions");
    expect(page).toContain('href="/deliverability"');
  });
});
