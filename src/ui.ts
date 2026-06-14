import { localizeHtml } from "./locales/ar";
import { APP_CSS } from "./styles.generated";

const ENHANCE_ASSET_VERSION = "20260614-editor-sync";

function appStyles(): string {
  return `<style>
    ${APP_CSS}
    @font-face{font-family:"Zad";font-style:normal;font-weight:400;font-display:swap;src:url("https://zadfont.zad.tools/fonts/Zad-Regular.woff2") format("woff2")}
    @font-face{font-family:"Zad";font-style:normal;font-weight:500;font-display:swap;src:url("https://zadfont.zad.tools/fonts/Zad-Medium.woff2") format("woff2")}
    @font-face{font-family:"Zad";font-style:normal;font-weight:600;font-display:swap;src:url("https://zadfont.zad.tools/fonts/Zad-SemiBold.woff2") format("woff2")}
    @font-face{font-family:"Zad";font-style:normal;font-weight:700;font-display:swap;src:url("https://zadfont.zad.tools/fonts/Zad-Bold.woff2") format("woff2")}
    [x-cloak]{display:none!important}
    html,body{overflow-x:hidden}
    body{font-feature-settings:"tnum";font-family:"Zad",Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .ltr, code, pre{direction:ltr;text-align:left;unicode-bidi:plaintext}
    input, textarea, select{direction:ltr;text-align:left}
    th,td{text-align:right}
    .technical-table th,.technical-table td{text-align:left;direction:ltr}
    button,a{cursor:pointer}
    a,button,input,textarea,select{transition:background-color .18s ease,border-color .18s ease,color .18s ease,box-shadow .18s ease}
    a:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid #2563eb;outline-offset:2px}
    .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0}
    .surface{border:1px solid rgb(226 232 240);background:white;box-shadow:0 1px 2px rgb(15 23 42 / .04)}
    .metric{border:1px solid rgb(226 232 240);background:linear-gradient(180deg,#fff,#f8fafc)}
    .mailflow-codemirror{margin-top:.5rem;overflow:hidden;border-radius:.375rem;border:1px solid rgb(203 213 225);background:#fff;text-align:left;direction:ltr}
    .mailflow-smart-toolbar{display:flex;flex-direction:column;gap:.5rem;border-bottom:1px solid rgb(226 232 240);background:#fff;padding:.75rem 1rem}
    .mailflow-smart-label{font-size:.875rem;line-height:1.25rem;font-weight:500;color:rgb(51 65 85)}
    .mailflow-smart-input{margin-top:.25rem;height:2.5rem;width:100%;border-radius:.375rem;border:1px solid rgb(203 213 225);padding:0 .75rem;font-size:.875rem;line-height:1.25rem}
    .mailflow-smart-count{border-radius:9999px;background:rgb(241 245 249);padding:.25rem .75rem;font-size:.75rem;line-height:1rem;font-weight:600;color:rgb(71 85 105)}
    @media (min-width:640px){.mailflow-smart-toolbar{flex-direction:row;align-items:center;justify-content:space-between}.mailflow-smart-input{width:18rem}}
    /* Page guides are written for Arabic readers; hide them in English mode. */
    html[lang="en"] [data-guide]{display:none}
  </style>`;
}

function activityPanel(): string {
  return `<section x-data="activityLog()" x-init="load()" class="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div class="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="font-semibold">What happened</h2>
            <p class="mt-1 text-xs text-slate-500">Latest MailFlow activity and Runtime history from audit logs.</p>
          </div>
          <a href="/logs" class="text-sm font-medium text-blue-700">Open full logs</a>
        </div>
        <table data-smart-table class="min-w-full text-sm">
          <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Time</th><th class="px-4 py-3">Event</th><th class="px-4 py-3">Entity</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Message</th></tr></thead>
          <tbody class="divide-y divide-slate-100">
            <template x-for="log in logs" :key="log.id"><tr><td class="px-4 py-3" x-text="fmt(log.created_at)"></td><td class="px-4 py-3" x-text="log.event_type"></td><td class="px-4 py-3" x-text="log.entity_type + (log.entity_id ? '#'+log.entity_id : '')"></td><td class="px-4 py-3"><span class="rounded px-2 py-1 text-xs" :class="log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'" x-text="log.status"></span></td><td class="px-4 py-3" x-text="log.message"></td></tr></template>
            <tr x-show="loaded && !logs.length"><td colspan="5" class="px-4 py-8 text-center text-slate-500">No activity logged yet.</td></tr>
          </tbody>
        </table>
      </section>`;
}

function pageGuide(
  title: string,
  when: string,
  steps: string[],
  links: Array<[string, string]> = [
    ["/emails", "افتح الوارد"],
    ["/test", "اختبار البريد"],
    ["/settings", "افتح الإعدادات"]
  ]
): string {
  return `<section data-guide class="mb-6 rounded-lg border border-slate-200 bg-white p-4">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">دليل الصفحة</div>
        <h2 class="mt-1 text-lg font-semibold">${title}</h2>
        <p class="mt-1 text-sm leading-6 text-slate-600"><strong>متى تستخدمها؟</strong> ${when}</p>
      </div>
      <div class="flex flex-wrap gap-2">${links.map(([href, label]) => `<a href="${href}" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">${label}</a>`).join("")}</div>
    </div>
    <div class="mt-4 rounded-md bg-slate-50 p-3">
      <div class="text-sm font-semibold">خطوات سريعة</div>
      <ol class="mt-2 list-decimal space-y-1 pe-5 text-sm leading-6 text-slate-600">${steps.map((step) => `<li>${step}</li>`).join("")}</ol>
    </div>
    <div class="mt-3 text-xs font-semibold text-slate-500">روابط مفيدة</div>
  </section>`;
}

function moduleGuide(title: string): string {
  if (title === "Contacts") {
    return pageGuide("جهات الاتصال", "راجع الأشخاص والشركات الذين راسلوك وتابع آخر تواصل معهم.", [
      "ابحث عن المرسل أو الشركة عند متابعة عميل.",
      "راجع عدد الرسائل لمعرفة أهم العلاقات.",
      "افتح الوارد للرد أو تحويل الرسالة لتذكرة."
    ]);
  }
  if (title === "Attachments") {
    return pageGuide("المرفقات", "استخدمها لمراجعة الملفات التي وصلت مع الإيميلات ومتابعة التخزين والفحص.", [
      "راجع نوع وحجم الملف قبل استخدامه.",
      "تأكد من حالة فحص الفيروسات إن وجدت.",
      "ارجع للإيميل الأصلي من عمود الموضوع."
    ]);
  }
  return "";
}

function shell(title: string, active: string, body: string, script = ""): string {
  const nav = [
    ["/", "Dashboard"],
    ["/emails", "Emails"],
    ["/search", "Search"],
    ["/inboxes", "Inboxes"],
    ["/rules", "Rules"],
    ["/workflows", "Workflows"],
    ["/tickets", "Tickets"],
    ["/contacts", "Contacts"],
    ["/attachments", "Attachments"],
    ["/outbound", "Outbound Emails"],
    ["/deliverability", "Deliverability"],
    ["/ai", "AI Automation"],
    ["/logs", "Logs"],
    ["/analytics", "Analytics"],
    ["/test", "Test Email"],
    ["/settings", "Settings"]
  ];
  return localizeHtml(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - MailFlow Studio</title>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script defer src="/assets/mailflow-enhance.js?v=${ENHANCE_ASSET_VERSION}"></script>
  ${appStyles()}
</head>
<body class="min-h-screen bg-slate-50 text-slate-950">
  <div class="flex min-h-screen">
    <aside class="hidden w-64 border-r border-slate-200 bg-white lg:block">
      <div class="border-b border-slate-200 px-6 py-5">
        <div class="text-lg font-semibold">MailFlow Studio</div>
        <div class="text-xs text-slate-500">Email operations platform</div>
      </div>
      <nav class="space-y-1 p-3">${nav
        .map(
          ([href, label]) =>
            `<a class="block rounded-md px-3 py-2 text-sm font-medium ${active === label ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"}" href="${href}">${label}</a>`
        )
        .join("")}</nav>
    </aside>
    <main class="min-w-0 flex-1">
      <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div class="flex items-center justify-between px-4 py-3 lg:px-8">
          <div>
            <div class="text-xs font-medium uppercase tracking-wide text-slate-500">MailFlow Studio</div>
            <h1 class="text-xl font-semibold">${title}</h1>
          </div>
          <div class="flex items-center gap-2">
            <a href="/lang/toggle" title="العربية / English" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">ع / EN</a>
            <a href="/rules/new" class="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Add Rule</a>
            <a href="/logout" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Logout</a>
          </div>
        </div>
        <nav class="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">${nav
          .map(
            ([href, label]) =>
              `<a class="whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${active === label ? "bg-slate-950 text-white" : "text-slate-700"}" href="${href}">${label}</a>`
          )
          .join("")}</nav>
      </header>
      <section class="mx-auto max-w-7xl px-4 py-6 lg:px-8">${body}${activityPanel()}</section>
    </main>
  </div>
  <script>
    function copyText(value) { navigator.clipboard?.writeText(value); }
    async function api(path, options = {}) {
      const response = await fetch('/api/v1' + path, {
        ...options,
        headers: { 'content-type': 'application/json', ...(options.headers || {}) }
      });
      if (response.status === 401) location.href = '/login';
      const text = await response.text();
      const data = text ? JSON.parse(text) : null;
      if (!response.ok) throw new Error(data?.error || 'Request failed');
      setTimeout(() => window.MailFlowEnhance?.scheduleEnhance?.(), 0);
      return data;
    }
    function fmt(value) { return value ? new Date(value).toLocaleString() : 'Never'; }
    function actionSummary(actions) { return (actions || []).map((a) => a.type || a.actionType).join(', ') || '-'; }
    function conditionSummary(c) {
      if (!c) return '-';
      return Object.entries(c).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length)).map(([k, v]) => k + ': ' + (Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : v)).join(' | ') || 'Always';
    }
    function activityLog(){return{loaded:false,logs:[],async load(){this.loaded=false;try{this.logs=(await api('/audit-logs')).logs.slice(0,8)}finally{this.loaded=true}}}}
  </script>
  ${script}
</body>
</html>`);
}

export function loginPage(error = ""): string {
  return localizeHtml(`<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Login - MailFlow Studio</title>${appStyles()}</head>
<body class="min-h-screen bg-slate-950 text-white">
  <main class="mx-auto flex min-h-screen max-w-md items-center px-6">
    <form method="post" action="/login" class="w-full rounded-lg bg-white p-6 text-slate-950 shadow-xl">
      <div class="flex justify-end"><a href="/lang/toggle" class="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">ع / EN</a></div>
      <h1 class="text-2xl font-semibold">MailFlow Studio</h1>
      <p class="mt-1 text-sm text-slate-600">Enter your access token to manage email routing rules.</p>
      ${error ? `<div class="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">${error}</div>` : ""}
      <label class="mt-5 block text-sm font-medium">Access token</label>
      <input name="token" type="password" autocomplete="current-password" required autofocus class="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-slate-950">
      <button class="mt-5 w-full rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Login</button>
      <p class="mt-4 text-xs text-slate-500">Local default token is <code>dev-admin-key</code> unless a token is set in Settings or ADMIN_API_KEY.</p>
    </form>
  </main>
</body></html>`);
}

export function dashboardPage(): string {
  return shell(
    "Dashboard",
    "Dashboard",
    `<div x-data="dashboard()" x-init="load()" class="space-y-6">
      <div class="grid gap-3 md:grid-cols-4">
        <template x-for="card in cards" :key="card.label">
          <div class="rounded-lg border border-slate-200 bg-white p-4">
            <div class="text-sm text-slate-500" x-text="card.label"></div>
            <div class="mt-2 text-3xl font-semibold" x-text="card.value"></div>
          </div>
        </template>
      </div>
      <div class="flex flex-wrap gap-2">
        <a href="/rules/new" class="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white">Add Rule</a>
        <a href="/emails" class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium">Open inbox</a>
        <a href="/test" class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium">Test Email</a>
        <a href="/outbound/test" class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium">Test sending</a>
        <a href="/logs" class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium">View Logs</a>
        <a href="/outbound/templates" class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium">Templates</a>
        <a href="/settings" class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium">Open settings</a>
        <button @click="copyText(location.origin + '/api/v1/test-email')" class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium">Copy Test API</button>
      </div>
      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 class="font-semibold">Email readiness center</h2>
            <p class="mt-1 text-sm text-slate-500">A simple checklist for receiving, replying, and sending from MailFlow without hunting through settings.</p>
          </div>
          <button @click="load()" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100">Refresh readiness</button>
        </div>
        <div class="mt-4 grid gap-3 md:grid-cols-3">
          <div class="rounded-lg border border-slate-200 p-3">
            <div class="text-xs font-semibold uppercase text-slate-500">Receiving Ready</div>
            <div class="mt-2 text-lg font-semibold" :class="stats.activeRules ? 'text-emerald-700' : 'text-amber-700'" x-text="stats.activeRules ? 'YES' : 'NEEDS RULE'"></div>
            <p class="mt-1 text-xs text-slate-500">Email Routing should send support mail to this Worker, then an active rule saves or tickets it.</p>
          </div>
          <div class="rounded-lg border border-slate-200 p-3">
            <div class="text-xs font-semibold uppercase text-slate-500">Sending Ready</div>
            <div class="mt-2 text-lg font-semibold" :class="stats.failedActions ? 'text-amber-700' : 'text-emerald-700'" x-text="stats.failedActions ? 'CHECK LOGS' : 'READY'"></div>
            <p class="mt-1 text-xs text-slate-500">Use Outbound Test once, then reply from the inbox with a saved template.</p>
          </div>
          <div class="rounded-lg border border-slate-200 p-3">
            <div class="text-xs font-semibold uppercase text-slate-500">Reply Templates</div>
            <div class="mt-2 text-lg font-semibold text-slate-900">Starter pack</div>
            <p class="mt-1 text-xs text-slate-500">Support received, follow up, quote reply, ticket update, and welcome templates.</p>
          </div>
        </div>
        <div class="mt-4 grid gap-2 text-sm md:grid-cols-4">
          <a href="/emails" class="rounded-md border border-slate-200 px-3 py-2 font-medium hover:bg-slate-50">Open inbox</a>
          <a href="/outbound/test" class="rounded-md border border-slate-200 px-3 py-2 font-medium hover:bg-slate-50">Test sending</a>
          <a href="/outbound/templates" class="rounded-md border border-slate-200 px-3 py-2 font-medium hover:bg-slate-50">Edit templates</a>
          <a href="/settings" class="rounded-md border border-slate-200 px-3 py-2 font-medium hover:bg-slate-50">Open settings</a>
        </div>
      </section>
      <section class="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="font-semibold text-emerald-950">Single-user starter pack</h2>
            <p class="mt-1 text-sm text-emerald-800">Create support inbox, support intake rule, and five starter email templates for MailFlow.</p>
          </div>
          <button data-endpoint="/api/v1/starter-pack/apply" @click="applyStarterPack()" class="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800" x-text="starterPackLoading?'Applying...':'Apply starter pack'">Apply starter pack</button>
        </div>
        <div x-show="starterPackMessage" class="mt-3 rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm text-emerald-900" x-text="starterPackMessage"></div>
      </section>
      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div class="border-b border-slate-200 px-4 py-3 font-semibold">Recent email events</div>
        <table data-smart-table class="min-w-full text-sm">
          <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Time</th><th class="px-4 py-3">From</th><th class="px-4 py-3">To</th><th class="px-4 py-3">Subject</th><th class="px-4 py-3">Status</th></tr></thead>
          <tbody class="divide-y divide-slate-100">
            <template x-for="event in events" :key="event.id"><tr><td class="px-4 py-3" x-text="fmt(event.receivedAt)"></td><td class="px-4 py-3" x-text="event.fromEmail"></td><td class="px-4 py-3" x-text="event.toEmail"></td><td class="px-4 py-3" x-text="event.subject"></td><td class="px-4 py-3"><span class="rounded bg-slate-100 px-2 py-1 text-xs" x-text="event.status"></span></td></tr></template>
            <tr x-show="events.length===0"><td colspan="5" class="px-4 py-8 text-center text-slate-500">No email events yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>`,
    `<script>
      function dashboard(){return{stats:{},events:[],starterPackLoading:false,starterPackMessage:'',get cards(){return[
        {label:'Emails today',value:this.stats.emailsToday||0},
        {label:'Emails this week',value:this.stats.emailsThisWeek||0},
        {label:'Needs reply',value:this.stats.openTickets||0},
        {label:'Open tickets',value:this.stats.openTickets||0},
        {label:'Failed automations',value:this.stats.failedActions||0},
        {label:'Active rules',value:this.stats.activeRules||0},
        {label:'Active workflows',value:this.stats.activeWorkflows||0},
        {label:'Storage usage',value:(this.stats.storageUsage||0)+' B'}
      ]},async load(){this.stats=await api('/stats');this.events=(await api('/logs?limit=8')).events},async applyStarterPack(){this.starterPackLoading=true;this.starterPackMessage='';try{const result=(await api('/starter-pack/apply',{method:'POST'})).starterPack;this.starterPackMessage='Created '+result.createdInboxes+' inbox, '+result.createdRules+' rule, and '+result.createdTemplates+' templates. Default sender: '+result.defaultFromEmail;await this.load()}catch(e){this.starterPackMessage=e.message}finally{this.starterPackLoading=false}}}}
    </script>`
  );
}

function modulePage(title: string, active: string, endpoint: string, columns: Array<[string, string]>): string {
  return shell(
    title,
    active,
    `${moduleGuide(title)}
    <div x-data="moduleTable('${endpoint}')" x-init="load()" class="space-y-4">
      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table data-smart-table class="min-w-full text-sm">
          <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr>${columns.map(([label]) => `<th class="px-4 py-3">${label}</th>`).join("")}</tr></thead>
          <tbody class="divide-y divide-slate-100">
            <template x-for="row in rows" :key="row.id || row.message_id || row.email">
              <tr>${columns.map(([, key]) => `<td class="px-4 py-3" x-text="display(row, '${key}')"></td>`).join("")}</tr>
            </template>
            <tr x-show="loaded && !rows.length"><td colspan="${columns.length}" class="px-4 py-8 text-center text-slate-500">No records yet.</td></tr>
          </tbody>
        </table>
      </div>
    </div>`,
    `<script>function moduleTable(endpoint){return{loaded:false,rows:[],async load(){this.loaded=false;try{const data=await api(endpoint);this.rows=data.items||data.emails||data.contacts||data.tickets||data.workflows||data.attachments||data.providers||data.logs||[]}finally{this.loaded=true}},display(row,key){const value=key.split('.').reduce((acc,k)=>acc&&acc[k],row);if(key.endsWith('_json')){try{return JSON.parse(value||'[]').join(', ')}catch{return value||''}}return value??''}}}</script>`
  );
}

export function inboxesPage(): string {
  return shell(
    "Inboxes",
    "Inboxes",
    `${pageGuide("صناديق البريد", "استخدمها لتجميع عناوين مثل support@yourdomain.com وربطها بفريق أو غرض واضح.", [
      "أضف اسم الصندوق مثل Support أو Sales.",
      "ضع العناوين المرتبطة بالصندوق مفصولة بفواصل.",
      "استخدم القواعد لتوجيه رسائل هذا الصندوق تلقائيا."
    ], [["/rules/new", "إضافة قاعدة"], ["/emails", "افتح الوارد"], ["/settings", "افتح الإعدادات"]])}
    <div x-data="inboxesPage()" x-init="load()" class="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form @submit.prevent="create()" class="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <h2 class="font-semibold">Create inbox</h2>
        <label class="mt-4 block font-medium">Name<input x-model="form.name" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
        <label class="mt-4 block font-medium">Email addresses<input x-model="form.email_addresses" placeholder="support@example.com, help@example.com" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
        <label class="mt-4 block font-medium">Assigned team<input x-model="form.assigned_team" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
        <button class="mt-4 rounded-md bg-slate-950 px-3 py-2 text-white">Create inbox</button>
      </form>
      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white"><table data-smart-table class="min-w-full text-sm"><thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Name</th><th class="px-4 py-3">Addresses</th><th class="px-4 py-3">Team</th><th class="px-4 py-3">Status</th></tr></thead><tbody class="divide-y divide-slate-100"><template x-for="row in rows" :key="row.id"><tr><td class="px-4 py-3 font-medium" x-text="row.name"></td><td class="px-4 py-3" x-text="JSON.parse(row.email_addresses_json||'[]').join(', ')"></td><td class="px-4 py-3" x-text="row.assigned_team"></td><td class="px-4 py-3"><span class="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-700" x-text="row.status"></span></td></tr></template><tr x-show="loaded && !rows.length"><td colspan="4" class="px-4 py-8 text-center text-slate-500">Create your first inbox to start routing mail.</td></tr></tbody></table></div>
    </div>`,
    `<script>function inboxesPage(){return{loaded:false,rows:[],form:{name:'Support',email_addresses:'support@example.com',assigned_team:'Support'},async load(){this.loaded=false;try{this.rows=(await api('/inboxes')).items}finally{this.loaded=true}},async create(){await api('/inboxes',{method:'POST',body:JSON.stringify(this.form)});this.form={name:'',email_addresses:'',assigned_team:''};await this.load()}}}</script>`
  );
}

export function contactsPage(): string {
  return modulePage("Contacts", "Contacts", "/contacts", [["Name", "name"], ["Email", "email"], ["Company", "company"], ["Tags", "tags_json"], ["Total Emails", "total_emails"], ["First Seen", "first_seen"], ["Last Seen", "last_seen"]]);
}

export function emailsPage(): string {
  return shell(
    "Emails",
    "Emails",
    `<div x-data="emailsPage()" x-init="load()" class="space-y-4">
      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 class="font-semibold">Inbox command center</h2>
            <p class="mt-1 text-sm text-slate-500">Filter, preview, and reply to inbound messages from one focused screen.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <a href="/outbound/templates" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium">Reply with template</a>
            <a href="/test" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium">Send test email</a>
          </div>
        </div>
        <div class="mt-4 grid gap-3 md:grid-cols-4">
          <button type="button" @click="statusFilter=''" class="rounded-lg border border-slate-200 p-3 text-right hover:bg-slate-50"><div class="text-xs text-slate-500">All statuses</div><div class="mt-1 text-2xl font-semibold" x-text="rows.length"></div></button>
          <button type="button" @click="statusFilter='received'" class="rounded-lg border border-slate-200 p-3 text-right hover:bg-slate-50"><div class="text-xs text-slate-500">Needs reply</div><div class="mt-1 text-2xl font-semibold" x-text="countStatus('received')"></div></button>
          <button type="button" @click="statusFilter='processed'" class="rounded-lg border border-slate-200 p-3 text-right hover:bg-slate-50"><div class="text-xs text-slate-500">Processed</div><div class="mt-1 text-2xl font-semibold" x-text="countStatus('processed')"></div></button>
          <button type="button" @click="statusFilter='replied'" class="rounded-lg border border-slate-200 p-3 text-right hover:bg-slate-50"><div class="text-xs text-slate-500">Replied</div><div class="mt-1 text-2xl font-semibold" x-text="countStatus('replied')"></div></button>
        </div>
        <div class="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <label class="text-sm font-medium">Search sender or subject<input x-model="query" placeholder="support, invoice, quote" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
          <label class="text-sm font-medium">Status<select x-model="statusFilter" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="">All statuses</option><option value="received">Needs reply</option><option value="processed">Processed</option><option value="replied">Replied</option><option value="failed">Failed</option></select></label>
        </div>
      </section>
      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div class="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 class="font-semibold">Inbound emails</h2>
            <p class="mt-1 text-xs text-slate-500">Review received mail and send a Quick reply without leaving the inbox.</p>
          </div>
          <a href="/outbound/templates" class="text-sm font-medium text-blue-700">Reply with template</a>
        </div>
        <table data-smart-table class="min-w-full text-sm">
          <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Time</th><th class="px-4 py-3">From</th><th class="px-4 py-3">To</th><th class="px-4 py-3">Subject</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Action</th></tr></thead>
          <tbody class="divide-y divide-slate-100">
            <template x-for="row in filteredRows" :key="row.id">
              <tr>
                <td class="px-4 py-3" x-text="fmt(row.received_at)"></td>
                <td class="px-4 py-3" x-text="row.from_email"></td>
                <td class="px-4 py-3" x-text="row.to_email"></td>
                <td class="px-4 py-3" x-text="row.subject"></td>
                <td class="px-4 py-3"><span class="rounded bg-slate-100 px-2 py-1 text-xs" x-text="row.status"></span></td>
                <td class="px-4 py-3"><div class="flex flex-wrap gap-2"><button @click="selected=row" class="rounded border border-slate-300 px-2 py-1 text-xs font-medium">Preview</button><button @click="openReply(row)" class="rounded border border-slate-300 px-2 py-1 text-xs font-medium">Quick reply</button></div></td>
              </tr>
            </template>
            <tr x-show="loaded && !filteredRows.length"><td colspan="6" class="px-4 py-8 text-center text-slate-500">No emails match this view.</td></tr>
          </tbody>
        </table>
      </div>
      <section x-show="selected" class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="font-semibold">Message preview</h2>
            <p class="mt-1 text-sm text-slate-500" x-text="selected?.subject || ''"></p>
          </div>
          <button @click="selected=null" class="text-sm text-slate-500">Close</button>
        </div>
        <div class="mt-3 grid gap-3 text-sm md:grid-cols-3">
          <div><span class="text-slate-500">From</span><div class="ltr font-medium" x-text="selected?.from_email || ''"></div></div>
          <div><span class="text-slate-500">To</span><div class="ltr font-medium" x-text="selected?.to_email || ''"></div></div>
          <div><span class="text-slate-500">Status</span><div class="font-medium" x-text="selected?.status || ''"></div></div>
        </div>
        <div class="mt-4 rounded-md bg-slate-50 p-3 text-sm leading-6" x-text="selected?.body_preview || selected?.text_body || 'No preview available.'"></div>
        <div class="mt-4 border-t border-slate-200 pt-3 text-sm">
          <h3 class="font-semibold">Timeline</h3>
          <ol class="mt-2 space-y-2 text-slate-600">
            <li>Received: <span class="ltr inline-block" x-text="fmt(selected?.received_at)"></span></li>
            <li>Current status: <span x-text="selected?.status || '-'"></span></li>
            <li>Next step: reply, create ticket, or adjust routing rule.</li>
          </ol>
        </div>
      </section>
      <section x-show="reply.email" class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Quick reply</h2>
          <button @click="reply.email=null" class="text-sm text-slate-500">Close</button>
        </div>
        <div class="mt-3 grid gap-3 md:grid-cols-2">
          <label class="text-sm font-medium">To<input x-model="reply.to" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
          <label class="text-sm font-medium">Subject<input x-model="reply.subject" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
          <label class="text-sm font-medium md:col-span-2">Template<select x-model="reply.template_id" @change="useTemplate()" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="">No template</option><template x-for="template in templates" :key="template.id"><option :value="template.id" x-text="template.name"></option></template></select></label>
          <label class="text-sm font-medium md:col-span-2">Message<textarea x-model="reply.text" rows="6" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></textarea></label>
        </div>
        <div class="mt-3 flex items-center gap-2">
          <button data-endpoint="/api/v1/emails/:id/reply" @click="sendReply()" class="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white" x-text="reply.sending?'Sending...':'Send reply'"></button>
          <span class="text-sm" :class="reply.message.includes('failed') ? 'text-red-700' : 'text-emerald-700'" x-text="reply.message"></span>
        </div>
      </section>
    </div>`,
    `<script>
      function emailAddress(value){const match=String(value||'').match(/<([^>]+)>/);return match?match[1]:String(value||'').trim()}
      function emailsPage(){return{loaded:false,rows:[],templates:[],query:'',statusFilter:'',selected:null,reply:{email:null,to:'',subject:'',text:'',template_id:'',sending:false,message:''},get filteredRows(){const q=this.query.trim().toLowerCase();return this.rows.filter((row)=>{const matchesStatus=!this.statusFilter||row.status===this.statusFilter;const haystack=[row.from_email,row.to_email,row.subject,row.body_preview].join(' ').toLowerCase();return matchesStatus&&(!q||haystack.includes(q));})},countStatus(status){return this.rows.filter((row)=>row.status===status).length},async load(){this.loaded=false;try{const data=await api('/emails?limit=100');this.rows=data.emails||[];this.templates=(await api('/outbound/templates')).templates||[];if(!this.selected&&this.rows.length)this.selected=this.rows[0]}finally{this.loaded=true}},openReply(row){this.selected=row;this.reply={email:row,to:emailAddress(row.reply_to||row.from_email),subject:'Re: '+(row.subject||'Your message'),text:'Hi,\\n\\nThanks for your message. I am checking this now.\\n\\nBest,\\nMailFlow Support',template_id:'',sending:false,message:''}},useTemplate(){const template=this.templates.find(t=>String(t.id)===String(this.reply.template_id));if(!template)return;this.reply.subject=template.subject;this.reply.text=template.text_body},async sendReply(){this.reply.sending=true;this.reply.message='';try{const path='/emails/'+this.reply.email.id+'/reply';const body={to:this.reply.to,subject:this.reply.subject,text:this.reply.text,template_id:this.reply.template_id||null,data:{name:'there',subject:this.reply.email.subject,ticket:'EMAIL-'+this.reply.email.id,topic:this.reply.email.subject,update:this.reply.text,project:'MailFlow'}};await api(path,{method:'POST',body:JSON.stringify(body)});this.reply.message='Reply sent';await this.load()}catch(e){this.reply.message='Reply failed: '+e.message}finally{this.reply.sending=false}}}}
    </script>`
  );
}

export function ticketsPage(): string {
  return shell(
    "Tickets",
    "Tickets",
    `${pageGuide("التذاكر", "استخدمها لمتابعة الرسائل التي تحتاج شغل أو ردود متعددة بدل ما تضيع داخل الوارد.", [
      "افتح التذكرة لمراجعة الرسائل المرتبطة بها.",
      "رتب حسب الحالة والأولوية عند المتابعة اليومية.",
      "استخدم الرد السريع من الوارد للرد على صاحب الرسالة."
    ], [["/emails", "افتح الوارد"], ["/rules/new", "قاعدة إنشاء تذكرة"], ["/logs", "افتح السجلات"]])}
    <div x-data="moduleTable('/tickets')" x-init="load()" class="overflow-hidden rounded-lg border border-slate-200 bg-white"><table data-smart-table class="min-w-full text-sm"><thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Ticket</th><th class="px-4 py-3">Subject</th><th class="px-4 py-3">Contact</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Priority</th><th class="px-4 py-3">Updated</th></tr></thead><tbody class="divide-y divide-slate-100"><template x-for="row in rows" :key="row.id"><tr><td class="px-4 py-3"><a class="font-medium text-blue-700" :href="'/tickets/'+row.id" x-text="row.ticket_number"></a></td><td class="px-4 py-3" x-text="row.subject"></td><td class="px-4 py-3" x-text="row.contact_email||''"></td><td class="px-4 py-3" x-text="row.status"></td><td class="px-4 py-3" x-text="row.priority"></td><td class="px-4 py-3" x-text="fmt(row.updated_at)"></td></tr></template></tbody></table></div>`,
    `<script>function moduleTable(endpoint){return{rows:[],async load(){this.rows=(await api(endpoint)).tickets}}}</script>`
  );
}

export function ticketDetailPage(id: number): string {
  return shell(
    "Ticket",
    "Tickets",
    `<div x-data="ticketDetail(${id})" x-init="load()" class="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section class="space-y-4">
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="text-lg font-semibold" x-text="ticket.subject"></h2>
          <div class="mt-1 text-sm text-slate-500" x-text="ticket.ticket_number"></div>
          <div class="mt-6 space-y-3">
            <template x-for="msg in ticket.messages||[]" :key="msg.id">
              <div class="rounded-md border p-3" :class="Number(msg.internal_note)===1 ? 'border-amber-200 bg-amber-50' : (msg.author_type==='agent' ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white')">
                <div class="flex items-center justify-between text-xs uppercase text-slate-500">
                  <span x-text="Number(msg.internal_note)===1 ? 'Internal note' : (msg.author_type==='agent' ? 'Agent reply' : 'Customer')"></span>
                  <span class="ltr" x-text="fmt(msg.created_at)"></span>
                </div>
                <div class="mt-1 whitespace-pre-line" x-text="msg.body"></div>
              </div>
            </template>
            <div x-show="loaded && !(ticket.messages||[]).length" class="rounded-md border border-slate-200 p-3 text-sm text-slate-500">No messages on this ticket yet.</div>
          </div>
        </div>

        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="flex gap-2 border-b border-slate-200 pb-3">
            <button type="button" @click="tab='reply'" class="rounded-md px-3 py-1.5 text-sm font-medium" :class="tab==='reply' ? 'bg-slate-950 text-white' : 'border border-slate-300'">Reply to customer</button>
            <button type="button" @click="tab='note'" class="rounded-md px-3 py-1.5 text-sm font-medium" :class="tab==='note' ? 'bg-slate-950 text-white' : 'border border-slate-300'">Internal note</button>
          </div>

          <div x-show="tab==='reply'" class="mt-3 space-y-3">
            <label class="block text-sm font-medium">To<input x-model="reply.to" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
            <label class="block text-sm font-medium">Subject<input x-model="reply.subject" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
            <label class="block text-sm font-medium">Canned response<select x-model="reply.template_id" @change="useTemplate()" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="">No template</option><template x-for="t in templates" :key="t.id"><option :value="t.id" x-text="t.name"></option></template></select></label>
            <label class="block text-sm font-medium">Message<textarea x-model="reply.text" rows="6" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></textarea></label>
            <div class="flex items-center gap-3">
              <button data-endpoint="/api/v1/tickets/:id/reply" @click="sendReply()" class="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white" x-text="reply.sending?'Sending...':'Send reply'"></button>
              <span class="text-sm" :class="reply.message.includes('failed') ? 'text-red-700' : 'text-emerald-700'" x-text="reply.message"></span>
            </div>
          </div>

          <div x-show="tab==='note'" class="mt-3 space-y-3">
            <label class="block text-sm font-medium">Internal note (not sent to customer)<textarea x-model="note.body" rows="4" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></textarea></label>
            <div class="flex items-center gap-3">
              <button @click="addNote()" class="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white" x-text="note.saving?'Saving...':'Add note'"></button>
              <span class="text-sm text-emerald-700" x-text="note.message"></span>
            </div>
          </div>
        </div>
      </section>

      <aside class="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <h3 class="font-semibold">Ticket controls</h3>
        <label class="mt-3 block font-medium">Status<select x-model="fields.status" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="open">open</option><option value="pending">pending</option><option value="waiting">waiting</option><option value="resolved">resolved</option><option value="closed">closed</option></select></label>
        <label class="mt-3 block font-medium">Priority<select x-model="fields.priority" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="low">low</option><option value="normal">normal</option><option value="high">high</option><option value="urgent">urgent</option></select></label>
        <label class="mt-3 block font-medium">Assigned to<input x-model="fields.assigned_user" placeholder="agent email or name" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
        <button @click="saveFields()" class="mt-4 w-full rounded-md bg-slate-950 px-3 py-2 text-white" x-text="savingFields?'Saving...':'Save changes'"></button>
        <span class="mt-2 block text-emerald-700" x-text="fieldsMessage"></span>
        <div class="mt-4 border-t border-slate-200 pt-3 text-slate-600">
          <div>Contact: <strong x-text="ticket.contact_email||''"></strong></div>
        </div>
      </aside>
    </div>`,
    `<script>
      function emailAddressTd(value){const m=String(value||'').match(/<([^>]+)>/);return m?m[1]:String(value||'').trim()}
      function ticketDetail(id){return{ticket:{},templates:[],loaded:false,tab:'reply',savingFields:false,fieldsMessage:'',fields:{status:'open',priority:'normal',assigned_user:''},reply:{to:'',subject:'',text:'',template_id:'',sending:false,message:''},note:{body:'',saving:false,message:''},
        async load(){this.loaded=false;try{this.ticket=(await api('/tickets/'+id)).ticket||{};this.templates=(await api('/outbound/templates')).templates||[];this.fields={status:this.ticket.status||'open',priority:this.ticket.priority||'normal',assigned_user:this.ticket.assigned_user||''};this.reply.to=emailAddressTd(this.ticket.contact_email||'');this.reply.subject='Re: '+(this.ticket.subject||'your ticket')}finally{this.loaded=true}},
        useTemplate(){const t=this.templates.find(x=>String(x.id)===String(this.reply.template_id));if(!t)return;this.reply.subject=t.subject;this.reply.text=t.text_body},
        async sendReply(){this.reply.sending=true;this.reply.message='';try{const body={to:this.reply.to,subject:this.reply.subject,text:this.reply.text,template_id:this.reply.template_id||null};await api('/tickets/'+id+'/reply',{method:'POST',body:JSON.stringify(body)});this.reply.message='Reply sent';this.reply.text='';this.reply.template_id='';await this.load()}catch(e){this.reply.message='Reply failed: '+e.message}finally{this.reply.sending=false}},
        async addNote(){if(!this.note.body.trim())return;this.note.saving=true;this.note.message='';try{await api('/tickets/'+id+'/note',{method:'POST',body:JSON.stringify({body:this.note.body})});this.note.body='';this.note.message='Note added';await this.load()}catch(e){this.note.message='Failed: '+e.message}finally{this.note.saving=false}},
        async saveFields(){this.savingFields=true;this.fieldsMessage='';try{await api('/tickets/'+id,{method:'PUT',body:JSON.stringify(this.fields)});this.fieldsMessage='Saved';await this.load()}catch(e){this.fieldsMessage='Failed: '+e.message}finally{this.savingFields=false}}}}
    </script>`
  );
}

export function searchPage(): string {
  return shell(
    "Search",
    "Search",
    `<div x-data="searchPage()" x-init="boot()" class="space-y-4">
      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="font-semibold">Unified search</h2>
        <p class="mt-1 text-sm text-slate-500">Search across inbound emails, tickets, and contacts in one place.</p>
        <form @submit.prevent="run()" class="mt-3 flex gap-2">
          <input x-model="q" placeholder="invoice, client@example.com, MFS-..., quote" class="w-full rounded-md border border-slate-300 px-3 py-2" autofocus>
          <button class="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white" x-text="loading?'Searching...':'Search'"></button>
        </form>
      </section>

      <div x-show="searched" class="space-y-4">
        <section class="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div class="border-b border-slate-200 px-4 py-3 font-semibold">Emails (<span x-text="results.emails.length"></span>)</div>
          <table class="min-w-full text-sm"><thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Time</th><th class="px-4 py-3">From</th><th class="px-4 py-3">Subject</th><th class="px-4 py-3">Status</th></tr></thead>
          <tbody class="divide-y divide-slate-100"><template x-for="row in results.emails" :key="row.id"><tr><td class="px-4 py-3" x-text="fmt(row.received_at)"></td><td class="px-4 py-3" x-text="row.from_email"></td><td class="px-4 py-3" x-text="row.subject"></td><td class="px-4 py-3"><span class="rounded bg-slate-100 px-2 py-1 text-xs" x-text="row.status"></span></td></tr></template>
          <tr x-show="!results.emails.length"><td colspan="4" class="px-4 py-6 text-center text-slate-500">No matching emails.</td></tr></tbody></table>
        </section>

        <section class="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div class="border-b border-slate-200 px-4 py-3 font-semibold">Tickets (<span x-text="results.tickets.length"></span>)</div>
          <table class="min-w-full text-sm"><thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Ticket</th><th class="px-4 py-3">Subject</th><th class="px-4 py-3">Contact</th><th class="px-4 py-3">Status</th></tr></thead>
          <tbody class="divide-y divide-slate-100"><template x-for="row in results.tickets" :key="row.id"><tr><td class="px-4 py-3"><a class="font-medium text-blue-700" :href="'/tickets/'+row.id" x-text="row.ticket_number"></a></td><td class="px-4 py-3" x-text="row.subject"></td><td class="px-4 py-3" x-text="row.contact_email||''"></td><td class="px-4 py-3" x-text="row.status"></td></tr></template>
          <tr x-show="!results.tickets.length"><td colspan="4" class="px-4 py-6 text-center text-slate-500">No matching tickets.</td></tr></tbody></table>
        </section>

        <section class="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div class="border-b border-slate-200 px-4 py-3 font-semibold">Contacts (<span x-text="results.contacts.length"></span>)</div>
          <table class="min-w-full text-sm"><thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Name</th><th class="px-4 py-3">Email</th><th class="px-4 py-3">Company</th><th class="px-4 py-3">Total emails</th></tr></thead>
          <tbody class="divide-y divide-slate-100"><template x-for="row in results.contacts" :key="row.id"><tr><td class="px-4 py-3" x-text="row.name||'-'"></td><td class="px-4 py-3 ltr" x-text="row.email"></td><td class="px-4 py-3" x-text="row.company||''"></td><td class="px-4 py-3" x-text="row.total_emails"></td></tr></template>
          <tr x-show="!results.contacts.length"><td colspan="4" class="px-4 py-6 text-center text-slate-500">No matching contacts.</td></tr></tbody></table>
        </section>
      </div>
    </div>`,
    `<script>function searchPage(){return{q:'',loading:false,searched:false,results:{emails:[],tickets:[],contacts:[]},boot(){const u=new URL(location.href).searchParams.get('q');if(u){this.q=u;this.run()}},async run(){const term=this.q.trim();if(!term){this.searched=false;return}this.loading=true;try{this.results=await api('/search?q='+encodeURIComponent(term));this.searched=true}catch(e){this.results={emails:[],tickets:[],contacts:[]};this.searched=true}finally{this.loading=false}}}}</script>`
  );
}

export function workflowsPage(): string {
  return shell(
    "Workflows",
    "Workflows",
    `${pageGuide("سير العمل", "استخدمها لتشغيل إجراءات تلقائية عند وصول رسالة جديدة أو مرفق أو كلمة مهمة.", [
      "اختر trigger واضح مثل New Email أو Keyword Match.",
      "اكتب الكلمات المفتاحية التي تعني أن الرسالة مهمة.",
      "راجع السجلات بعد أول تشغيل للتأكد من النتيجة."
    ], [["/test", "اختبار البريد"], ["/logs", "افتح السجلات"], ["/settings", "افتح الإعدادات"]])}
    <div x-data="workflowsPage()" x-init="load()" class="space-y-6">
      <section class="grid gap-3 md:grid-cols-4">
        <div class="metric rounded-lg p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">كل سير العمل</div>
          <div class="mt-2 text-3xl font-semibold" x-text="rows.length"></div>
          <div class="mt-1 text-xs text-slate-500">إجمالي الأتمتة المحفوظة</div>
        </div>
        <div class="metric rounded-lg p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">نشط</div>
          <div class="mt-2 text-3xl font-semibold text-emerald-700" x-text="activeCount()"></div>
          <div class="mt-1 text-xs text-slate-500">جاهز للتشغيل عند وصول البريد</div>
        </div>
        <div class="metric rounded-lg p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">كلمات مفتاحية</div>
          <div class="mt-2 text-3xl font-semibold" x-text="keywordCount()"></div>
          <div class="mt-1 text-xs text-slate-500">يعتمد على شروط نصية</div>
        </div>
        <div class="metric rounded-lg p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">آخر تشغيل</div>
          <div class="mt-2 text-lg font-semibold" x-text="lastRunLabel()"></div>
          <div class="mt-1 text-xs text-slate-500">من سجل التشغيل</div>
        </div>
      </section>

      <section class="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form @submit.prevent="create()" class="surface rounded-lg p-4 text-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow builder</div>
              <h2 class="mt-1 text-lg font-semibold">إنشاء سير عمل</h2>
              <p class="mt-1 text-xs leading-5 text-slate-500">ابدأ بسيطًا: trigger واحد، كلمات اختيارية، وإجراء حفظ آمن يمكن مراجعته من السجلات.</p>
            </div>
            <span class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">آمن</span>
          </div>
          <label class="mt-4 block font-medium">اسم سير العمل<input x-model="form.name" required class="mt-1 h-10 w-full rounded-md border border-slate-300 px-3"></label>
          <label class="mt-4 block font-medium">المشغل<select x-model="form.trigger_type" class="mt-1 h-10 w-full rounded-md border border-slate-300 px-3"><option value="new_email">New Email</option><option value="attachment_received">Attachment Received</option><option value="keyword_match">Keyword Match</option></select></label>
          <label class="mt-4 block font-medium">الكلمات المفتاحية<input x-model="keywords" placeholder="invoice, urgent, quote" class="ltr mt-1 h-10 w-full rounded-md border border-slate-300 px-3"></label>
          <p class="mt-2 text-xs leading-5 text-slate-500">افصل الكلمات بفواصل. اتركها فارغة لو المشغل New Email عام.</p>
          <label class="mt-4 flex items-center gap-2"><input type="checkbox" x-model="form.active" class="h-4 w-4"> تفعيل فور الإنشاء</label>
          <button class="mt-4 w-full rounded-md bg-slate-950 px-3 py-2 font-medium text-white hover:bg-slate-800" :disabled="saving" x-text="saving ? 'جاري الإنشاء...' : 'إنشاء سير عمل'"></button>
          <div class="mt-3 text-sm text-emerald-700" x-text="message"></div>
          <div class="mt-1 text-sm text-red-700" x-text="error"></div>
        </form>

        <div class="surface overflow-hidden rounded-lg">
          <div class="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="font-semibold">سير العمل المحفوظة</h2>
              <p class="mt-1 text-xs text-slate-500">راجع المشغلات، الحالة، آخر تشغيل، والشروط بدون فتح السجلات.</p>
            </div>
            <button @click="load()" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">تحديث</button>
          </div>
          <div class="overflow-x-auto">
            <table data-smart-table class="min-w-[920px] text-sm">
              <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">الاسم</th><th class="px-4 py-3">المشغل</th><th class="px-4 py-3">الحالة</th><th class="px-4 py-3">الشروط</th><th class="px-4 py-3">الإجراءات</th><th class="px-4 py-3">آخر تشغيل</th></tr></thead>
              <tbody class="divide-y divide-slate-100">
                <template x-for="row in rows" :key="row.id"><tr class="hover:bg-slate-50">
                  <td class="px-4 py-3 font-medium" x-text="row.name"></td>
                  <td class="px-4 py-3"><span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200" x-text="triggerLabel(row.trigger_type)"></span></td>
                  <td class="px-4 py-3"><span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="Number(row.active) ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'" x-text="Number(row.active) ? 'نشط' : 'متوقف'"></span></td>
                  <td class="max-w-xs px-4 py-3 text-slate-600" x-text="conditionsLabel(row)"></td>
                  <td class="px-4 py-3 text-slate-600" x-text="actionsLabel(row)"></td>
                  <td class="px-4 py-3" x-text="fmt(row.last_run_at)"></td>
                </tr></template>
                <tr x-show="loaded && !rows.length"><td colspan="6" class="px-4 py-8 text-center text-slate-500">لا توجد Workflows بعد. أنشئ أول سير عمل من النموذج.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="surface overflow-hidden rounded-lg">
        <div class="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="font-semibold">آخر تشغيلات الأتمتة</h2>
            <p class="mt-1 text-xs text-slate-500">آخر نتائج التنفيذ، مفيدة لمعرفة هل السير اشتغل فعلا أم لا.</p>
          </div>
          <a href="/logs" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">فتح السجلات</a>
        </div>
        <div class="overflow-x-auto">
          <table data-smart-table class="min-w-[760px] text-sm">
            <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">الوقت</th><th class="px-4 py-3">سير العمل</th><th class="px-4 py-3">الحالة</th><th class="px-4 py-3">الإجراءات</th><th class="px-4 py-3">الخطأ</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <template x-for="run in runs" :key="run.id"><tr class="hover:bg-slate-50">
                <td class="px-4 py-3" x-text="fmt(run.created_at)"></td>
                <td class="px-4 py-3 font-medium" x-text="run.workflow_name"></td>
                <td class="px-4 py-3"><span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="run.status === 'success' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'" x-text="run.status"></span></td>
                <td class="px-4 py-3 text-slate-600" x-text="runActionsLabel(run)"></td>
                <td class="px-4 py-3 text-red-700" x-text="run.error || '-'"></td>
              </tr></template>
              <tr x-show="loaded && !runs.length"><td colspan="5" class="px-4 py-8 text-center text-slate-500">لم يتم تشغيل أي Workflow بعد.</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>`,
    `<script>function workflowsPage(){return{loaded:false,saving:false,message:'',error:'',rows:[],runs:[],keywords:'',form:{name:'Notify new email',trigger_type:'new_email',active:true},parseJson(value,fallback){try{return JSON.parse(value||'')}catch{return fallback}},keywordsFrom(row){return this.parseJson(row.conditions_json,{}).keywords||[]},activeCount(){return this.rows.filter(row=>Number(row.active)).length},keywordCount(){return this.rows.filter(row=>this.keywordsFrom(row).length).length},lastRunLabel(){const dates=this.rows.map(row=>row.last_run_at).filter(Boolean).sort().reverse();return dates[0]?fmt(dates[0]):'لم يعمل بعد'},triggerLabel(value){return {new_email:'بريد جديد',attachment_received:'مرفق جديد',keyword_match:'كلمات مفتاحية'}[value]||value},conditionsLabel(row){const keywords=this.keywordsFrom(row);return keywords.length?'Keywords: '+keywords.join(', '):'بدون شروط إضافية'},actionsLabel(row){const actions=this.parseJson(row.actions_json,[]);return actions.length?actions.map(action=>action.type||action.actionType||'action').join(', '):'-'},runActionsLabel(run){const actions=this.parseJson(run.actions_json,[]);return actions.length?actions.map(action=>action.type||action.status||'action').join(', '):'-'},async load(){this.loaded=false;try{const [workflows,runs]=await Promise.all([api('/workflows'),api('/workflow-runs')]);this.rows=workflows.workflows||[];this.runs=(runs.runs||[]).slice(0,25)}finally{this.loaded=true}},async create(){this.saving=true;this.message='';this.error='';try{await api('/workflows',{method:'POST',body:JSON.stringify({...this.form,conditions:{keywords:this.keywords.split(',').map(s=>s.trim()).filter(Boolean)},actions:[{type:'save'}]})});this.message='تم إنشاء سير العمل';this.keywords='';this.form={name:'Notify new email',trigger_type:'new_email',active:true};await this.load()}catch(e){this.error=e.message}finally{this.saving=false}}}}</script>`
  );
}

export function attachmentsPage(): string {
  return modulePage("Attachments", "Attachments", "/attachments", [["File", "filename"], ["Type", "mime_type"], ["Size", "size"], ["Email", "email_subject"], ["Virus Scan", "virus_scan_status"], ["Stored", "created_at"]]);
}

export function aiPage(): string {
  return shell(
    "AI Automation",
    "AI Automation",
    `${pageGuide("الذكاء الاصطناعي", "استخدمها فقط عندما تريد تلخيص الرسائل أو تصنيفها أو اقتراح ردود، مع إبقاء المفاتيح مخفية.", [
      "أضف اسم المزود والموديل فقط بعد التأكد من المفتاح.",
      "جرّب التصنيف على بريد تجريبي قبل تفعيل قاعدة حقيقية.",
      "راجع السجلات لأي فشل أو تكلفة غير متوقعة."
    ], [["/rules/new", "قاعدة AI"], ["/test", "اختبار البريد"], ["/logs", "افتح السجلات"]])}
    <div x-data="aiPage()" x-init="load()" class="grid gap-6 lg:grid-cols-[360px_1fr]"><form @submit.prevent="create()" class="rounded-lg border border-slate-200 bg-white p-4 text-sm"><h2 class="font-semibold">Add provider</h2><label class="mt-4 block font-medium">Provider<input x-model="form.provider" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label><label class="mt-4 block font-medium">Label<input x-model="form.label" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label><label class="mt-4 block font-medium">Model<input x-model="form.model" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label><label class="mt-4 block font-medium">API key<input type="password" x-model="form.api_key" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label><button class="mt-4 rounded-md bg-slate-950 px-3 py-2 text-white">Save provider</button></form><div class="rounded-lg border border-slate-200 bg-white p-4"><h2 class="font-semibold">Configured providers</h2><template x-for="p in providers" :key="p.id"><div class="mt-3 rounded border border-slate-200 p-3"><div class="font-medium" x-text="p.label"></div><div class="text-sm text-slate-500" x-text="p.provider+' / '+p.model"></div></div></template></div></div>`,
    `<script>function aiPage(){return{providers:[],form:{provider:'openai',label:'OpenAI',model:'gpt-4.1-mini',api_key:''},async load(){this.providers=(await api('/ai/providers')).providers},async create(){await api('/ai/providers',{method:'POST',body:JSON.stringify(this.form)});this.form.api_key='';await this.load()}}}</script>`
  );
}

export function analyticsPage(): string {
  return shell(
    "Analytics",
    "Analytics",
    `${pageGuide("التحليلات", "استخدمها لمعرفة حجم الرسائل، أكثر الصناديق نشاطا، والدومينات التي تراسلك أكثر.", [
      "راجع اتجاه الرسائل اليومي قبل تعديل القواعد.",
      "راقب الصناديق الأكثر استخداما لتحديد الأولويات.",
      "افتح السجلات إذا رأيت ارتفاعا مفاجئا أو أخطاء."
    ], [["/emails", "افتح الوارد"], ["/logs", "افتح السجلات"], ["/settings", "افتح الإعدادات"]])}
    <div x-data="analyticsPage()" x-init="load()" class="grid gap-4 lg:grid-cols-2"><template x-for="chart in charts" :key="chart.title"><section class="rounded-lg border border-slate-200 bg-white p-4"><h2 class="font-semibold" x-text="chart.title"></h2><div class="mt-4 h-52"><canvas :data-chart-title="chart.title"></canvas></div><div class="mt-4 space-y-2"><template x-for="row in chart.rows" :key="row.label"><div><div class="flex justify-between text-sm"><span x-text="row.label||'None'"></span><span x-text="row.value"></span></div><div class="mt-1 h-2 rounded bg-slate-100"><div class="h-2 rounded bg-blue-600" :style="'width:'+Math.min(100,(row.value/(chart.max||1))*100)+'%'"></div></div></div></template></div></section></template></div>`,
    `<script>function analyticsPage(){return{charts:[],async load(){const a=await api('/analytics');this.charts=[['Emails Per Day',a.emailsPerDay],['Emails By Inbox',a.emailsByInbox],['Workflow Activity',a.workflowActivity],['Ticket Creation Trend',a.ticketTrend],['Top Domains',a.topDomains],['Attachment Types',a.attachmentTypes]].map(([title,rows])=>({title,rows,max:Math.max(1,...(rows||[]).map(r=>r.value||0))}));setTimeout(()=>window.MailFlowEnhance?.renderAnalyticsCharts(this.charts),50)}}}</script>`
  );
}

export function rulesPage(): string {
  return shell(
    "Rules",
    "Rules",
    `${pageGuide("القواعد", "استخدمها لتحديد ماذا يحدث تلقائيا عند وصول رسالة: حفظ، إنشاء تذكرة، تحويل، رد تلقائي، أو webhook.", [
      "ابدأ بشرط بسيط مثل recipient أو subject.",
      "اختر إجراء واحدا واضحا ثم اختبره من صفحة اختبار البريد.",
      "راجع آخر تطابق والسجلات بعد كل تعديل."
    ], [["/rules/new", "إضافة قاعدة"], ["/test", "اختبار البريد"], ["/logs", "افتح السجلات"]])}
    <div x-data="rulesPage()" x-init="load()" class="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table data-smart-table class="min-w-full text-sm">
        <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Name</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Priority</th><th class="px-4 py-3">Conditions</th><th class="px-4 py-3">Actions</th><th class="px-4 py-3">Last matched</th><th class="px-4 py-3"></th></tr></thead>
        <tbody class="divide-y divide-slate-100">
          <template x-for="rule in rules" :key="rule.id"><tr>
            <td class="px-4 py-3 font-medium" x-text="rule.name"></td>
            <td class="px-4 py-3"><span class="rounded px-2 py-1 text-xs" :class="rule.active?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-600'" x-text="rule.active?'active':'inactive'"></span></td>
            <td class="px-4 py-3" x-text="rule.priority"></td>
            <td class="max-w-md px-4 py-3 text-slate-600" x-text="conditionSummary(rule.conditions)"></td>
            <td class="px-4 py-3 text-slate-600" x-text="actionSummary(rule.actions)"></td>
            <td class="px-4 py-3" x-text="fmt(rule.lastMatchedAt)"></td>
            <td class="whitespace-nowrap px-4 py-3 text-right"><a class="mr-2 rounded border border-slate-300 px-2 py-1" :href="'/rules/'+rule.id+'/edit'">Edit</a><button class="rounded border border-red-200 px-2 py-1 text-red-700" @click="remove(rule.id)">Delete</button></td>
          </tr></template>
        </tbody>
      </table>
    </div>`,
    `<script>function rulesPage(){return{rules:[],async load(){this.rules=(await api('/rules')).rules},async remove(id){if(confirm('Delete this rule?')){await api('/rules/'+id,{method:'DELETE'});await this.load()}}}}</script>`
  );
}

export function ruleFormPage(id?: number): string {
  const title = id ? "Edit Rule" : "New Rule";
  return shell(
    title,
    "Rules",
    `<form x-data="ruleForm(${id || "null"})" x-init="load()" @submit.prevent="save()" class="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div class="space-y-6">
        <section class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="font-semibold">Rule</h2>
          <div class="mt-4 grid gap-4 md:grid-cols-4">
            <label class="md:col-span-2 text-sm font-medium">Rule name<input x-model="form.name" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
            <label class="text-sm font-medium">Priority<input x-model.number="form.priority" type="number" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
            <label class="text-sm font-medium">Match mode<select x-model="form.matchMode" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="all">All</option><option value="any">Any</option></select></label>
          </div>
          <label class="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" x-model="form.active" class="h-4 w-4"> Active</label>
        </section>
        <section class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="font-semibold">Conditions</h2>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <template x-for="field in conditionFields" :key="field.key"><label class="text-sm font-medium"><span x-text="field.label"></span><input x-model="conditions[field.key]" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label></template>
            <label class="text-sm font-medium">Has attachment<select x-model="conditions.has_attachment" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="">Any</option><option value="true">True</option><option value="false">False</option></select></label>
            <label class="text-sm font-medium">Header name<input x-model="header.name" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
            <label class="text-sm font-medium">Header contains<input x-model="header.value" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
            <label class="md:col-span-2 text-sm font-medium">Keyword list<input x-model="keywordList" placeholder="quote, proposal" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
          </div>
        </section>
      </div>
      <aside class="space-y-6">
        <section class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="font-semibold">Actions</h2>
          <div class="mt-4 space-y-4 text-sm">
            <label class="flex items-center gap-2"><input type="checkbox" x-model="actions.forward.enabled"> Forward to email</label><input x-model="actions.forward.to" placeholder="me@example.com" class="w-full rounded-md border border-slate-300 px-3 py-2">
            <label class="flex items-center gap-2"><input type="checkbox" x-model="actions.telegram.enabled"> Send Telegram message</label><textarea x-model="actions.telegram.template" class="w-full rounded-md border border-slate-300 px-3 py-2" rows="2"></textarea>
            <label class="flex items-center gap-2"><input type="checkbox" x-model="actions.webhook.enabled"> Call webhook URL</label><input x-model="actions.webhook.url" placeholder="https://app.example.com/inbound" class="w-full rounded-md border border-slate-300 px-3 py-2">
            <label class="flex items-center gap-2"><input type="checkbox" x-model="actions.slack.enabled"> Send Slack message</label><input x-model="actions.slack.webhookUrl" placeholder="https://hooks.slack.com/..." class="w-full rounded-md border border-slate-300 px-3 py-2">
            <label class="flex items-center gap-2"><input type="checkbox" x-model="actions.createTicket.enabled"> Create ticket</label><select x-model="actions.createTicket.priority" class="w-full rounded-md border border-slate-300 px-3 py-2"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select>
            <label class="flex items-center gap-2"><input type="checkbox" x-model="actions.storeAttachment"> Store attachments</label>
            <label class="flex items-center gap-2"><input type="checkbox" x-model="actions.markSpam"> Mark spam</label>
            <label class="flex items-center gap-2"><input type="checkbox" x-model="actions.aiClassify"> AI classify</label>
            <label class="flex items-center gap-2"><input type="checkbox" x-model="actions.aiSummarize"> AI summarize</label>
            <label class="flex items-center gap-2"><input type="checkbox" x-model="actions.save"> Save to database</label>
            <label class="flex items-center gap-2"><input type="checkbox" x-model="actions.autoReply.enabled"> Auto reply with template</label><textarea x-model="actions.autoReply.template" class="w-full rounded-md border border-slate-300 px-3 py-2" rows="2"></textarea>
            <label class="flex items-center gap-2"><input type="checkbox" x-model="actions.ignore"> Ignore</label>
          </div>
        </section>
        <button class="w-full rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white" x-text="saving?'Saving...':'Save rule'"></button>
        <p class="text-sm text-red-700" x-text="error"></p>
      </aside>
    </form>`,
    `<script>
      function ruleForm(id){return{saving:false,error:'',conditionFields:[
        {key:'recipient_equals',label:'Recipient equals'},{key:'recipient_contains',label:'Recipient contains'},{key:'sender_equals',label:'Sender equals'},{key:'sender_contains',label:'Sender contains'},{key:'subject_contains',label:'Subject contains'},{key:'body_contains',label:'Body contains'}
      ],form:{name:'',active:true,priority:100,matchMode:'all'},conditions:{has_attachment:''},header:{name:'',value:''},keywordList:'',actions:{forward:{enabled:false,to:''},telegram:{enabled:false,template:'New email from {{from}}: {{subject}}'},webhook:{enabled:false,url:''},slack:{enabled:false,webhookUrl:''},createTicket:{enabled:false,priority:'normal'},storeAttachment:false,markSpam:false,aiClassify:false,aiSummarize:false,save:true,autoReply:{enabled:false,template:'Thanks for your email. We received it.'},ignore:false},
      async load(){if(!id)return;const r=(await api('/rules/'+id)).rule;this.form={name:r.name,active:r.active,priority:r.priority,matchMode:r.matchMode};this.conditions={...r.conditions,has_attachment:r.conditions.has_attachment===undefined?'':String(r.conditions.has_attachment)};this.header=r.conditions.header_contains||{name:'',value:''};this.keywordList=(r.conditions.keywords||[]).join(', ');this.actions={forward:{enabled:false,to:''},telegram:{enabled:false,template:'New email from {{from}}: {{subject}}'},webhook:{enabled:false,url:''},slack:{enabled:false,webhookUrl:''},createTicket:{enabled:false,priority:'normal'},storeAttachment:false,markSpam:false,aiClassify:false,aiSummarize:false,save:false,autoReply:{enabled:false,template:''},ignore:false};for(const a of r.actions){if(a.type==='forward')this.actions.forward={enabled:true,to:a.to||''};if(a.type==='telegram')this.actions.telegram={enabled:true,template:a.template||''};if(a.type==='webhook')this.actions.webhook={enabled:true,url:a.url||''};if(a.type==='slack')this.actions.slack={enabled:true,webhookUrl:a.webhookUrl||''};if(a.type==='create_ticket')this.actions.createTicket={enabled:true,priority:a.priority||'normal'};if(a.type==='store_attachment')this.actions.storeAttachment=true;if(a.type==='mark_spam')this.actions.markSpam=true;if(a.type==='ai_classify')this.actions.aiClassify=true;if(a.type==='ai_summarize')this.actions.aiSummarize=true;if(a.type==='save')this.actions.save=true;if(a.type==='auto_reply')this.actions.autoReply={enabled:true,template:a.template||''};if(a.type==='ignore')this.actions.ignore=true;}},
      payload(){const c={...this.conditions};if(c.has_attachment==='')delete c.has_attachment;else c.has_attachment=c.has_attachment==='true';if(this.header.name&&this.header.value)c.header_contains=this.header;for(const k of Object.keys(c)){if(c[k]==='')delete c[k]}const kws=this.keywordList.split(',').map(s=>s.trim()).filter(Boolean);if(kws.length)c.keywords=kws;const a=[];if(this.actions.forward.enabled)a.push({type:'forward',to:this.actions.forward.to});if(this.actions.telegram.enabled)a.push({type:'telegram',template:this.actions.telegram.template});if(this.actions.webhook.enabled)a.push({type:'webhook',url:this.actions.webhook.url,method:'POST'});if(this.actions.slack.enabled)a.push({type:'slack',webhookUrl:this.actions.slack.webhookUrl});if(this.actions.createTicket.enabled)a.push({type:'create_ticket',priority:this.actions.createTicket.priority});if(this.actions.storeAttachment)a.push({type:'store_attachment'});if(this.actions.markSpam)a.push({type:'mark_spam'});if(this.actions.aiClassify)a.push({type:'ai_classify'});if(this.actions.aiSummarize)a.push({type:'ai_summarize'});if(this.actions.save)a.push({type:'save'});if(this.actions.autoReply.enabled)a.push({type:'auto_reply',template:this.actions.autoReply.template});if(this.actions.ignore)a.push({type:'ignore'});return{...this.form,conditions:c,actions:a}},
      async save(){this.saving=true;this.error='';try{const method=id?'PUT':'POST';const path=id?'/rules/'+id:'/rules';const r=await api(path,{method,body:JSON.stringify(this.payload())});location.href='/rules'}catch(e){this.error=e.message}finally{this.saving=false}}}}</script>`
  );
}

export function logsPage(): string {
  return shell(
    "Logs",
    "Logs",
    `${pageGuide("السجلات", "استخدمها لفهم ما حدث فعلا: رسالة وصلت، قاعدة اشتغلت، إرسال فشل، أو إجراء نجح.", [
      "استخدم البحث للعثور على بريد أو webhook أو خطأ محدد.",
      "فلتر failed عند تشخيص مشكلة إرسال أو أتمتة.",
      "ارجع للصفحة المرتبطة بعد معرفة سبب الخطأ."
    ], [["/emails", "افتح الوارد"], ["/outbound/logs", "سجلات الإرسال"], ["/test", "اختبار البريد"]])}
    <div x-data="logsPage()" x-init="load()" class="space-y-4">
      <div class="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <input x-model="keyword" placeholder="Search keyword" class="rounded-md border border-slate-300 px-3 py-2 text-sm">
        <select x-model="status" class="rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="">All statuses</option><option value="success">Success</option><option value="failed">Failed</option></select>
        <button @click="load()" class="rounded-md bg-slate-950 px-3 py-2 text-sm text-white">Filter</button>
      </div>
      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table data-smart-table class="min-w-full text-sm">
          <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Time</th><th class="px-4 py-3">Event</th><th class="px-4 py-3">Entity</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Message</th></tr></thead>
          <tbody class="divide-y divide-slate-100"><template x-for="log in logs" :key="log.id"><tr><td class="px-4 py-3" x-text="fmt(log.created_at)"></td><td class="px-4 py-3" x-text="log.event_type"></td><td class="px-4 py-3" x-text="log.entity_type + (log.entity_id ? '#'+log.entity_id : '')"></td><td class="px-4 py-3" x-text="log.status"></td><td class="px-4 py-3" x-text="log.message"></td></tr></template></tbody>
        </table>
      </div>
    </div>`,
    `<script>function logsPage(){return{logs:[],keyword:'',status:'',async load(){const q=new URLSearchParams();if(this.keyword)q.set('keyword',this.keyword);if(this.status)q.set('status',this.status);this.logs=(await api('/audit-logs?'+q.toString())).logs}}}</script>`
  );
}

export function testPage(): string {
  return shell(
    "Test Email",
    "Test Email",
    `${pageGuide("اختبار البريد", "استخدمها قبل تعديل الإنتاج: اكتب رسالة وهمية وشاهد أي قواعد وإجراءات ستعمل.", [
      "غيّر From و To والموضوع مثل الرسالة الحقيقية.",
      "ضع كلمات مفتاحية لاختبار القواعد.",
      "راجع النتيجة قبل إرسال بريد حقيقي."
    ], [["/rules", "افتح القواعد"], ["/emails", "افتح الوارد"], ["/logs", "افتح السجلات"]])}
    <div x-data="testEmail()" class="grid gap-6 lg:grid-cols-[420px_1fr]">
      <form @submit.prevent="submit()" class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="space-y-4 text-sm">
          <label class="block font-medium">From<input x-model="form.from" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
          <label class="block font-medium">To<input x-model="form.to" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
          <label class="block font-medium">Subject<input x-model="form.subject" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
          <label class="block font-medium">Body<textarea x-model="form.body" rows="8" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></textarea></label>
          <label class="flex items-center gap-2"><input type="checkbox" x-model="form.hasAttachments"> Has attachment</label>
          <button class="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white">Run simulation</button>
        </div>
      </form>
      <section class="rounded-lg border border-slate-200 bg-white p-4">
        <h2 class="font-semibold">Result</h2>
        <template x-if="result"><div class="mt-4 space-y-4">
          <div><span class="text-sm text-slate-500">Status</span><div class="text-lg font-semibold" x-text="result.event.status"></div></div>
          <div><span class="text-sm text-slate-500">Matched rules</span><div x-text="result.matchedRules.map(r=>r.name).join(', ') || 'No rules matched'"></div></div>
          <div><span class="text-sm text-slate-500">Actions</span><pre class="mt-2 overflow-auto rounded bg-slate-950 p-3 text-xs text-white" x-text="JSON.stringify(result.actionResults,null,2)"></pre></div>
        </div></template>
      </section>
    </div>`,
    `<script>function testEmail(){return{form:{from:'buyer@example.com',to:'support@example.com',subject:'Invoice question',body:'Can you send a quote?',hasAttachments:false},result:null,async submit(){this.result=await api('/test-email',{method:'POST',body:JSON.stringify(this.form)})}}}</script>`
  );
}

export function outboundPage(settings: { defaultFromEmail: string }, emailBindingConfigured: boolean): string {
  return shell(
    "Outbound Emails",
    "Outbound Emails",
    `${pageGuide("إرسال البريد", "استخدمها لإرسال رسالة يدوية أو تجربة قالب من عناوين MailFlow المسموح بها.", [
      "تأكد أن From من العناوين المسموح بها.",
      "اختر قالبا أو اكتب الرسالة يدويا.",
      "راجع Recent outbound attempts بعد الإرسال."
    ], [["/outbound/templates", "تعديل القوالب"], ["/outbound/test", "اختبار الإرسال"], ["/outbound/logs", "سجلات الإرسال"]])}
    <div x-data="outboundSend()" x-init="load()" class="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form @submit.prevent="submit()" class="rounded-lg border border-slate-200 bg-white p-4">
        ${emailBindingConfigured ? "" : `<div class="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Cloudflare EMAIL binding is not configured. Sends will be logged as failed with email_binding_not_configured.</div>`}
        <div class="space-y-4 text-sm">
          <label class="block font-medium">From<input x-model="form.from" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
          <label class="block font-medium">To<input x-model="form.to" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
          <label class="block font-medium">Template<select x-model="form.template_id" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"><option value="">None</option><template x-for="template in templates" :key="template.id"><option :value="template.id" x-text="template.name"></option></template></select></label>
          <label class="block font-medium">Subject<input x-model="form.subject" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
          <label class="block font-medium">Text body<textarea data-codemirror="text" x-model="form.text" rows="5" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></textarea></label>
          <label class="block font-medium">HTML body<textarea data-codemirror="html" x-model="form.html" rows="5" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></textarea></label>
          <label class="block font-medium">Template data JSON<textarea data-codemirror="json" x-model="dataJson" rows="3" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></textarea></label>
          <button class="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white" x-text="sending?'Sending...':'Send email'"></button>
        </div>
      </form>
      <section class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <a href="/outbound/templates" class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium">Templates</a>
          <a href="/outbound/logs" class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium">Logs</a>
          <a href="/outbound/test" class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium">Test</a>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <h2 class="font-semibold">Result</h2>
          <pre class="mt-3 overflow-auto rounded bg-slate-950 p-3 text-xs text-white" x-text="result ? JSON.stringify(result,null,2) : 'No send attempt yet.'"></pre>
        </div>
        <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div class="border-b border-slate-200 px-4 py-3 font-semibold">Recent outbound attempts</div>
          <table data-smart-table class="min-w-full text-sm"><thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Time</th><th class="px-4 py-3">To</th><th class="px-4 py-3">Subject</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Error</th></tr></thead><tbody class="divide-y divide-slate-100"><template x-for="log in logs" :key="log.id"><tr><td class="px-4 py-3" x-text="fmt(log.created_at)"></td><td class="px-4 py-3" x-text="log.to_email"></td><td class="px-4 py-3" x-text="log.subject"></td><td class="px-4 py-3" x-text="log.status"></td><td class="px-4 py-3 text-red-700" x-text="log.error||''"></td></tr></template><tr x-show="logs.length===0"><td colspan="5" class="px-4 py-8 text-center text-slate-500">No outbound attempts yet.</td></tr></tbody></table>
        </div>
      </section>
    </div>`,
    `<script>function outboundSend(){return{sending:false,templates:[],logs:[],result:null,dataJson:'{}',form:{from:${JSON.stringify(settings.defaultFromEmail)},to:'user@example.com',subject:'Welcome',text:'Hello',html:'<p>Hello</p>',template_id:''},async load(){this.templates=(await api('/outbound/templates')).templates;this.logs=(await api('/outbound/logs?limit=8')).logs},async submit(){this.sending=true;try{const payload={...this.form,template_id:this.form.template_id?Number(this.form.template_id):null,data:JSON.parse(this.dataJson||'{}')};this.result=await api('/send-email',{method:'POST',body:JSON.stringify(payload)});await this.load()}catch(e){this.result={ok:false,error:e.message}}finally{this.sending=false}}}}</script>`
  );
}

export function outboundTemplatesPage(): string {
  return shell(
    "Outbound Templates",
    "Outbound Emails",
    `${pageGuide("قوالب الإرسال", "استخدمها لتجهيز ردود متكررة مثل استلام الدعم، المتابعة، عرض السعر، والترحيب.", [
      "اكتب Subject واضحا ويمكنه استخدام متغيرات مثل {{name}}.",
      "املأ Text body حتى لو استخدمت HTML.",
      "جرّب القالب من صفحة الإرسال قبل استخدامه في رد سريع."
    ], [["/outbound", "إرسال البريد"], ["/emails", "افتح الوارد"], ["/outbound/test", "اختبار الإرسال"]])}
    <div x-data="outboundTemplates()" x-init="load()" class="grid gap-6 xl:grid-cols-[420px_1fr]">
      <form @submit.prevent="save()" class="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <h2 class="font-semibold" x-text="form.id?'Edit template':'Create template'"></h2>
        <label class="mt-4 block font-medium">Name<input x-model="form.name" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
        <label class="mt-4 block font-medium">Subject<input x-model="form.subject" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
        <label class="mt-4 block font-medium">Text body<textarea data-codemirror="text" x-model="form.text_body" rows="5" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></textarea></label>
        <label class="mt-4 block font-medium">HTML body<textarea data-codemirror="html" x-model="form.html_body" rows="5" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></textarea></label>
        <label class="mt-4 block font-medium">Variables<input x-model="variables" placeholder="name, code" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
        <label class="mt-4 flex items-center gap-2"><input type="checkbox" x-model="form.active"> Active</label>
        <div class="mt-4 flex gap-2"><button class="rounded-md bg-slate-950 px-3 py-2 text-white">Save</button><button type="button" @click="reset()" class="rounded-md border border-slate-300 px-3 py-2">New</button></div>
      </form>
      <div class="overflow-hidden rounded-lg border border-slate-200 bg-white"><table data-smart-table class="min-w-full text-sm"><thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Name</th><th class="px-4 py-3">Subject</th><th class="px-4 py-3">Active</th><th class="px-4 py-3"></th></tr></thead><tbody class="divide-y divide-slate-100"><template x-for="template in templates" :key="template.id"><tr><td class="px-4 py-3 font-medium" x-text="template.name"></td><td class="px-4 py-3" x-text="template.subject"></td><td class="px-4 py-3" x-text="template.active?'yes':'no'"></td><td class="px-4 py-3 text-right"><button @click="edit(template)" class="rounded border border-slate-300 px-2 py-1">Edit</button><button @click="remove(template.id)" class="ml-2 rounded border border-red-200 px-2 py-1 text-red-700">Delete</button></td></tr></template><tr x-show="loaded && !templates.length"><td colspan="4" class="px-4 py-8 text-center text-slate-500">No templates yet.</td></tr></tbody></table></div>
    </div>`,
    `<script>function outboundTemplates(){return{loaded:false,templates:[],variables:'',form:{name:'Welcome email',subject:'Welcome, {{name}}',text_body:'Hello {{name}}',html_body:'<p>Hello {{name}}</p>',active:true},refreshEditors(){setTimeout(()=>window.MailFlowEnhance?.scheduleEnhance?.(),0)},async load(){this.loaded=false;try{this.templates=(await api('/outbound/templates')).templates}finally{this.loaded=true;this.refreshEditors()}},reset(){this.variables='';this.form={name:'',subject:'',text_body:'',html_body:'',active:true};this.refreshEditors()},edit(t){this.form={...t};this.variables=JSON.parse(t.variables_json||'[]').join(', ');this.refreshEditors()},payload(){return{...this.form,variables_json:this.variables.split(',').map(v=>v.trim()).filter(Boolean)}},async save(){const method=this.form.id?'PUT':'POST';const path=this.form.id?'/outbound/templates/'+this.form.id:'/outbound/templates';await api(path,{method,body:JSON.stringify(this.payload())});this.reset();await this.load()},async remove(id){if(confirm('Delete this template?')){await api('/outbound/templates/'+id,{method:'DELETE'});await this.load()}}}}</script>`
  );
}

export function outboundLogsPage(): string {
  return shell(
    "Outbound Logs",
    "Outbound Emails",
    `${pageGuide("سجلات الإرسال", "استخدمها للتأكد أن الردود خرجت بنجاح ومعرفة سبب أي فشل بدون إظهار أسرار.", [
      "راجع Status لكل محاولة إرسال.",
      "افتح Error عند فشل الإرسال لمعرفة السبب.",
      "استخدم اختبار الإرسال بعد تعديل الإعدادات."
    ], [["/outbound", "إرسال البريد"], ["/outbound/test", "اختبار الإرسال"], ["/settings", "افتح الإعدادات"]])}
    <div x-data="outboundLogs()" x-init="load()" class="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <table data-smart-table class="min-w-full text-sm"><thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Time</th><th class="px-4 py-3">From</th><th class="px-4 py-3">To</th><th class="px-4 py-3">Subject</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Provider</th><th class="px-4 py-3">Error</th></tr></thead><tbody class="divide-y divide-slate-100"><template x-for="log in logs" :key="log.id"><tr><td class="px-4 py-3" x-text="fmt(log.created_at)"></td><td class="px-4 py-3" x-text="log.from_email"></td><td class="px-4 py-3" x-text="log.to_email"></td><td class="px-4 py-3" x-text="log.subject"></td><td class="px-4 py-3" x-text="log.status"></td><td class="px-4 py-3" x-text="log.provider"></td><td class="px-4 py-3 text-red-700" x-text="log.error||''"></td></tr></template><tr x-show="logs.length===0"><td colspan="7" class="px-4 py-8 text-center text-slate-500">No outbound logs yet.</td></tr></tbody></table>
    </div>`,
    `<script>function outboundLogs(){return{logs:[],async load(){this.logs=(await api('/outbound/logs?limit=100')).logs}}}</script>`
  );
}

export function outboundTestPage(settings: { defaultFromEmail: string }, emailBindingConfigured: boolean): string {
  return shell(
    "Outbound Test",
    "Outbound Emails",
    `${pageGuide("اختبار الإرسال", "استخدمها كاختبار آمن بعد تغيير Email Sending أو العناوين المسموح بها.", [
      "استخدم From من support@yourdomain.com أو noreply@yourdomain.com.",
      "أرسل إلى بريدك الشخصي للتأكد من الوصول.",
      "راجع سجلات الإرسال إذا ظهر فشل."
    ], [["/outbound/logs", "سجلات الإرسال"], ["/outbound/templates", "تعديل القوالب"], ["/settings", "افتح الإعدادات"]])}
    <div x-data="outboundSend()" x-init="load()" class="max-w-3xl space-y-4">
      ${emailBindingConfigured ? "" : `<div class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Cloudflare EMAIL binding is not configured. This test will verify safe failure logging.</div>`}
      <form @submit.prevent="submit()" class="rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <label class="block font-medium">From<input x-model="form.from" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
        <label class="mt-4 block font-medium">To<input x-model="form.to" required class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
        <label class="mt-4 block font-medium">Subject<input x-model="form.subject" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label>
        <label class="mt-4 block font-medium">Text body<textarea x-model="form.text" rows="6" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></textarea></label>
        <button class="mt-4 rounded-md bg-slate-950 px-3 py-2 text-white">Run outbound test</button>
      </form>
      <pre class="overflow-auto rounded bg-slate-950 p-3 text-xs text-white" x-text="result ? JSON.stringify(result,null,2) : 'No test run yet.'"></pre>
    </div>`,
    `<script>function outboundSend(){return{result:null,logs:[],templates:[],dataJson:'{}',form:{from:${JSON.stringify(settings.defaultFromEmail)},to:'user@example.com',subject:'MailFlow outbound test',text:'This is a MailFlow Studio outbound test.',html:'',template_id:''},async load(){},async submit(){try{this.result=await api('/send-email',{method:'POST',body:JSON.stringify({...this.form,template_id:null,data:{}})})}catch(e){this.result={ok:false,error:e.message}}}}}</script>`
  );
}

export function deliverabilityPage(): string {
  return shell(
    "Deliverability",
    "Deliverability",
    `${pageGuide("جاهزية الدومينات والعناوين", "استخدمها لما تضيف دومين أو إيميل جديد وتتأكد أنه جاهز للاستقبال والإرسال بأمان.", [
      "راجع كل دومين: هل له عنوان استقبال وهل له عنوان إرسال مسموح.",
      "أضف عناوين الإرسال المسموح بها وحدد العنوان الافتراضي.",
      "أضف أي مستلم لا تريد مراسلته إلى قائمة المنع."
    ], [["/inboxes", "إدارة الاستقبال"], ["/outbound", "إرسال البريد"], ["/settings", "إعدادات العناوين"]])}
    <div x-data="deliverabilityPage()" x-init="load()" class="space-y-6">
      <section class="surface rounded-lg p-4">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Email operations center</div>
            <h2 class="mt-1 text-xl font-semibold">Domains & Senders</h2>
            <p class="mt-1 max-w-3xl text-sm leading-6 text-slate-600">Manage receiving addresses, allowed outbound senders, send limits, and blocked recipients from one focused screen.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full px-3 py-1 text-xs font-semibold" :class="summary.emailBindingConfigured ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'" x-text="summary.emailBindingConfigured ? 'ربط EMAIL فعال' : 'ربط EMAIL غير موجود'"></span>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Last checked <span x-text="summary.checkedAt ? fmt(summary.checkedAt) : '-'"></span></span>
            <button @click="load()" class="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Refresh</button>
          </div>
        </div>
      </section>

      <div class="grid gap-4 lg:grid-cols-4">
        <div class="metric rounded-lg p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Domains</div>
          <div class="mt-2 text-3xl font-semibold" x-text="summary.domains.length"></div>
          <div class="mt-1 text-xs text-slate-500">configured for mail flow</div>
        </div>
        <div class="metric rounded-lg p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Inbound addresses</div>
          <div class="mt-2 text-3xl font-semibold" x-text="summary.inboundAddresses.length"></div>
          <div class="mt-1 text-xs text-slate-500">from inbox routing</div>
        </div>
        <div class="metric rounded-lg p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Outbound senders</div>
          <div class="mt-2 text-3xl font-semibold" x-text="summary.allowedSenderAddresses.length"></div>
          <div class="mt-1 text-xs text-slate-500">allowed to send</div>
        </div>
        <div class="metric rounded-lg p-4">
          <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Daily limit</div>
          <div class="mt-2 text-3xl font-semibold" x-text="summary.dailySendLimit"></div>
          <div class="mt-1 text-xs text-slate-500">per admin/API key</div>
        </div>
      </div>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div class="surface overflow-hidden rounded-lg">
          <div class="border-b border-slate-200 px-4 py-3">
            <h2 class="font-semibold">Domain readiness</h2>
            <p class="mt-1 text-xs text-slate-500">Receiving and sending state for every configured email domain.</p>
          </div>
          <div class="overflow-x-auto">
          <table data-smart-table class="min-w-[920px] text-sm">
            <thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Domain</th><th class="px-4 py-3">Receiving</th><th class="px-4 py-3">Sending</th><th class="px-4 py-3">Inbound addresses</th><th class="px-4 py-3">Outbound senders</th><th class="px-4 py-3">Warnings</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
              <template x-for="domain in summary.domains" :key="domain.domain"><tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium ltr" x-text="domain.domain"></td>
                <td class="px-4 py-3"><span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="domain.receivingReady ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'" x-text="domain.receivingReady ? 'جاهز' : 'ناقص'"></span></td>
                <td class="px-4 py-3"><span class="rounded-full px-2.5 py-1 text-xs font-semibold" :class="domain.sendingReady ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'" x-text="domain.sendingReady ? 'جاهز' : 'ناقص'"></span></td>
                <td class="px-4 py-3 ltr" x-text="domain.inboundAddresses.join(', ') || '-'"></td>
                <td class="px-4 py-3 ltr" x-text="domain.outboundAddresses.join(', ') || '-'"></td>
                <td class="px-4 py-3 text-amber-700" x-text="domain.warnings.join(', ')"></td>
              </tr></template>
              <tr x-show="loaded && summary.domains.length===0"><td colspan="6" class="px-4 py-8 text-center text-slate-500">No configured email domains yet.</td></tr>
            </tbody>
          </table>
          </div>
        </div>

        <form @submit.prevent="saveSenders()" class="surface rounded-lg p-4 text-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold">Sender manager</h2>
              <p class="mt-1 text-xs leading-5 text-slate-500">These settings control which addresses MailFlow can send from.</p>
            </div>
            <span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">Saved setting</span>
          </div>
          <label class="mt-4 block font-medium">Default from<input x-model="settingsForm.default_from_email" class="mt-1 h-10 w-full rounded-md border border-slate-300 px-3"></label>
          <label class="mt-4 block font-medium">Add allowed sender
            <div class="mt-1 flex gap-2">
              <input x-model="senderDraft" placeholder="support@example.com" class="h-10 min-w-0 flex-1 rounded-md border border-slate-300 px-3">
              <button type="button" @click="addSender()" class="rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-50">إضافة</button>
            </div>
          </label>
          <div class="mt-3 flex flex-wrap gap-2">
            <template x-for="sender in senderList()" :key="sender"><span class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"><span class="ltr" x-text="sender"></span><button type="button" @click="removeSender(sender)" class="text-slate-500 hover:text-red-700">x</button></span></template>
          </div>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <label class="block font-medium">Daily send limit<input type="number" min="1" x-model="settingsForm.daily_send_limit" class="mt-1 h-10 w-full rounded-md border border-slate-300 px-3"></label>
            <label class="block font-medium">Recipients/request<input type="number" min="1" x-model="settingsForm.max_recipients_per_request" class="mt-1 h-10 w-full rounded-md border border-slate-300 px-3"></label>
          </div>
          <button class="mt-4 rounded-md bg-slate-950 px-3 py-2 font-medium text-white hover:bg-slate-800" x-text="savingSettings ? 'جاري الحفظ...' : 'حفظ المرسلين'"></button>
          <span class="ms-2 text-sm text-emerald-700" x-text="settingsMessage"></span>
        </form>
      </section>

      <section class="surface overflow-hidden rounded-lg">
        <div class="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="font-semibold">Suppression list</h2>
            <p class="mt-1 text-xs text-slate-500">Blocked recipients are rejected before any send attempt.</p>
          </div>
          <form @submit.prevent="addSuppression()" class="flex flex-col gap-2 sm:flex-row">
            <input x-model="form.email" required placeholder="blocked@example.com" class="h-10 rounded-md border border-slate-300 px-3 text-sm">
            <input x-model="form.reason" placeholder="manual block" class="h-10 rounded-md border border-slate-300 px-3 text-sm">
            <button class="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">Add suppression</button>
          </form>
        </div>
        <div class="px-4 py-2 text-sm text-emerald-700" x-text="message"></div>
        <div class="overflow-x-auto">
        <table data-smart-table class="min-w-[760px] text-sm"><thead class="bg-slate-100 text-left text-xs uppercase text-slate-500"><tr><th class="px-4 py-3">Email</th><th class="px-4 py-3">Reason</th><th class="px-4 py-3">Source</th><th class="px-4 py-3">Updated</th><th class="px-4 py-3"></th></tr></thead>
          <tbody class="divide-y divide-slate-100"><template x-for="item in suppressions" :key="item.id"><tr class="hover:bg-slate-50"><td class="px-4 py-3 ltr" x-text="item.email"></td><td class="px-4 py-3" x-text="item.reason"></td><td class="px-4 py-3" x-text="item.source"></td><td class="px-4 py-3" x-text="fmt(item.updated_at)"></td><td class="px-4 py-3 text-right"><button @click="removeSuppression(item.id)" class="rounded border border-red-200 px-2 py-1 text-red-700 hover:bg-red-50">Remove</button></td></tr></template><tr x-show="loaded && !suppressions.length"><td colspan="5" class="px-4 py-8 text-center text-slate-500">No suppressed recipients.</td></tr></tbody></table>
        </div>
      </section>
    </div>`,
    `<script>function deliverabilityPage(){return{loaded:false,message:'',settingsMessage:'',savingSettings:false,senderDraft:'',summary:{domains:[],inboundAddresses:[],allowedSenderAddresses:[],dailySendLimit:0,checkedAt:''},suppressions:[],settingsForm:{default_from_email:'',allowed_sender_addresses:'',daily_send_limit:500,max_recipients_per_request:10},form:{email:'',reason:'manual block'},senderList(){return String(this.settingsForm.allowed_sender_addresses||'').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean)},setSenderList(list){this.settingsForm.allowed_sender_addresses=[...new Set(list.map(v=>v.trim().toLowerCase()).filter(Boolean))].join(',')},addSender(){const value=this.senderDraft.trim().toLowerCase();if(!value)return;this.setSenderList([...this.senderList(),value]);if(!this.settingsForm.default_from_email)this.settingsForm.default_from_email=value;this.senderDraft=''},removeSender(sender){this.setSenderList(this.senderList().filter(v=>v!==sender));if(this.settingsForm.default_from_email===sender)this.settingsForm.default_from_email=this.senderList()[0]||''},async load(){this.loaded=false;try{const [summary,suppressionData,settingsData]=await Promise.all([api('/solo/deliverability'),api('/outbound/suppressions'),api('/settings')]);this.summary=summary;this.suppressions=suppressionData.suppressions||[];for(const item of settingsData.settings||[]){if(item.key in this.settingsForm)this.settingsForm[item.key]=item.value||''}this.settingsForm.allowed_sender_addresses=this.settingsForm.allowed_sender_addresses||summary.allowedSenderAddresses.join(',');this.settingsForm.default_from_email=this.settingsForm.default_from_email||summary.defaultFromEmail;this.settingsForm.daily_send_limit=this.settingsForm.daily_send_limit||summary.dailySendLimit;this.settingsForm.max_recipients_per_request=this.settingsForm.max_recipients_per_request||summary.maxRecipientsPerRequest}finally{this.loaded=true}},async saveSenders(){this.savingSettings=true;this.settingsMessage='';try{await api('/settings',{method:'PUT',body:JSON.stringify(this.settingsForm)});this.settingsMessage='تم الحفظ';await this.load()}finally{this.savingSettings=false}},async addSuppression(){this.message='';await api('/outbound/suppressions',{method:'POST',body:JSON.stringify({...this.form,source:'manual'})});this.form={email:'',reason:'manual block'};this.message='تم الحفظ';await this.load()},async removeSuppression(id){if(confirm('Remove this suppression?')){await api('/outbound/suppressions/'+id,{method:'DELETE'});await this.load()}}}}</script>`
  );
}

export function settingsPage(): string {
  return shell(
    "Settings",
    "Settings",
    `${pageGuide("الإعدادات", "استخدمها لضبط مفاتيح الإدارة، عناوين الإرسال، حدود الإرسال، وسلوك إنشاء التذاكر.", [
      "لا تدخل أسرارا إلا عند الحاجة؛ القيم المحفوظة تظهر مخفية.",
      "اضبط Default outbound from email على عنوان من yourdomain.com.",
      "بعد أي تعديل في الإرسال شغل اختبار الإرسال."
    ], [["/outbound/test", "اختبار الإرسال"], ["/emails", "افتح الوارد"], ["/logs", "افتح السجلات"]])}
    <section class="mb-6 grid gap-4 xl:grid-cols-3">
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Inbound setup</div>
        <h2 class="mt-1 text-lg font-semibold">استقبال الإيميلات من أي خدمة</h2>
        <ol class="mt-3 list-decimal space-y-2 pe-5 text-sm leading-6 text-slate-600">
          <li>في Cloudflare افتح Email Routing للدومين المطلوب.</li>
          <li>أضف Custom address مثل <span class="ltr font-medium">support@yourdomain.com</span> أو <span class="ltr font-medium">orders@your-domain.com</span>.</li>
          <li>اختار Action: Send to a Worker ثم Worker: <span class="ltr font-medium">mailflow-studio</span>.</li>
          <li>داخل MailFlow افتح Inboxes وأضف نفس العنوان للصندوق المناسب.</li>
          <li>أي خدمة خارجية تستخدم نفس العنوان كـ support/contact/notifications email.</li>
        </ol>
        <div class="mt-4 flex flex-wrap gap-2">
          <a href="/inboxes" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">إدارة Inboxes</a>
          <a href="/test" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">اختبار الاستقبال</a>
        </div>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Outbound setup</div>
        <h2 class="mt-1 text-lg font-semibold">إرسال الإيميلات من MailFlow</h2>
        <ol class="mt-3 list-decimal space-y-2 pe-5 text-sm leading-6 text-slate-600">
          <li>في Cloudflare Email Sending تأكد أن العناوين المرسلة مفعلة ومتحقق منها.</li>
          <li>في هذه الصفحة اضبط <span class="ltr font-medium">default_from_email</span> على عنوان موثوق.</li>
          <li>اكتب العناوين المسموح بها في <span class="ltr font-medium">allowed_sender_addresses</span> مفصولة بفواصل.</li>
          <li>اضبط حدود الإرسال اليومية وعدد المستلمين لكل طلب.</li>
          <li>اختبر من Outbound Test قبل استخدامه في خدمة حقيقية.</li>
        </ol>
        <div class="mt-4 flex flex-wrap gap-2">
          <a href="/deliverability" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">جاهزية الإرسال</a>
          <a href="/outbound/test" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">اختبار الإرسال</a>
        </div>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">External apps</div>
        <h2 class="mt-1 text-lg font-semibold">توصيل مواقعك أو تطبيقاتك</h2>
        <div class="mt-3 space-y-3 text-sm leading-6 text-slate-600">
          <p>للاستقبال: ضع عنوان MailFlow في إعدادات contact/support داخل الخدمة الخارجية.</p>
          <p>للإرسال: نادِ MailFlow من backend فقط، وليس من المتصفح.</p>
          <pre class="ltr mt-2 overflow-auto rounded bg-slate-950 p-3 text-xs text-white">POST /api/v1/send-email
x-api-key: ADMIN_API_KEY
{
  "from": "support@yourdomain.com",
  "to": "customer@example.com",
  "subject": "Hello",
  "text": "Message body"
}</pre>
          <p class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800">لا تضع <span class="ltr font-semibold">ADMIN_API_KEY</span> داخل frontend. لو التطبيق frontend فقط، مرره عبر Gateway/App Backend أو سيرفر وسيط.</p>
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" onclick="copyText(location.origin + '/api/v1/send-email')" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">Copy send API</button>
          <a href="/outbound/templates" class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">قوالب الإرسال</a>
        </div>
      </div>
    </section>
    <section class="mb-6 grid gap-4 xl:grid-cols-2">
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Cloudflare SMTP</div>
        <h2 class="mt-1 text-lg font-semibold">لو هتستخدم Cloudflare كـ SMTP</h2>
        <div class="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-900">
          التصحيح: E&#109;ail Routing للاستقبال. الإرسال عبر SMTP يحتاج Cloudflare E&#109;ail Service / E&#109;ail Send&#105;ng مفعّل للدومين.
        </div>
        <ol class="mt-3 list-decimal space-y-2 pe-5 text-sm leading-6 text-slate-600">
          <li>الدومين لازم يكون على Cloudflare DNS.</li>
          <li>من Cloudflare افتح Compute ثم E&#109;ail Service ثم E&#109;ail Send&#105;ng واعمل Onboard للدومين.</li>
          <li>تأكد أن SPF وDKIM وDMARC التي يضيفها Cloudflare موجودة وصحيحة.</li>
          <li>اعمل API token بصلاحية <span class="ltr font-medium">E&#109;ail Send&#105;ng: Ed&#105;t</span>.</li>
          <li>استخدم بيانات SMTP التالية في أي أداة تدعم SMTP.</li>
        </ol>
        <div class="mt-4 overflow-hidden rounded-md border border-slate-200">
          <table class="min-w-full text-sm">
            <tbody class="divide-y divide-slate-100">
              <tr><th class="w-40 bg-slate-50 px-3 py-2 text-right text-slate-500">Host</th><td class="ltr px-3 py-2">smtp.mx.cloudflare.net</td></tr>
              <tr><th class="bg-slate-50 px-3 py-2 text-right text-slate-500">Port</th><td class="ltr px-3 py-2">465</td></tr>
              <tr><th class="bg-slate-50 px-3 py-2 text-right text-slate-500">Security</th><td class="ltr px-3 py-2">SSL / SMTPS</td></tr>
              <tr><th class="bg-slate-50 px-3 py-2 text-right text-slate-500">Username</th><td class="ltr px-3 py-2">api_token</td></tr>
              <tr><th class="bg-slate-50 px-3 py-2 text-right text-slate-500">Password</th><td class="px-3 py-2">Cloudflare API token، لا تحفظه في الواجهة</td></tr>
              <tr><th class="bg-slate-50 px-3 py-2 text-right text-slate-500">Fr&#111;m</th><td class="ltr px-3 py-2">support@yourdomain.com أو أي عنوان من دومين تم Onboard له</td></tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-sm leading-6 text-slate-600">MailFlow حاليا يستخدم Workers E&#109;ail binding للإرسال المباشر. SMTP مفيد لما الأداة الخارجية نفسها لا تعرف تستدعي API وتحتاج SMTP تقليدي.</p>
      </div>
      <div class="rounded-lg border border-slate-200 bg-white p-4">
        <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Listmonk</div>
        <h2 class="mt-1 text-lg font-semibold">أفضل طريقة لربط Listmonk</h2>
        <div class="mt-3 grid gap-3 md:grid-cols-2">
          <div class="rounded-md border border-slate-200 p-3">
            <div class="text-sm font-semibold">الطريقة الأسهل: Listmonk يرسل عبر Cloudflare SMTP</div>
            <ol class="mt-2 list-decimal space-y-1 pe-5 text-sm leading-6 text-slate-600">
              <li>في Listmonk افتح Settings ثم SMTP.</li>
              <li>اكتب Host وPort وUsername وPassword من كارت Cloudflare SMTP.</li>
              <li>اجعل Default Fr&#111;m من عنوان موثق مثل <span class="ltr">newsletter@yourdomain.com</span>.</li>
              <li>اجعل Reply-T&#111; عنوانا يدخل MailFlow مثل <span class="ltr">support@yourdomain.com</span>.</li>
            </ol>
          </div>
          <div class="rounded-md border border-slate-200 p-3">
            <div class="text-sm font-semibold">الطريقة المنظمة: Listmonk يرسل عبر MailFlow API</div>
            <ol class="mt-2 list-decimal space-y-1 pe-5 text-sm leading-6 text-slate-600">
              <li>استخدمها لو عايز كل الإرسال يظهر في MailFlow logs وحدود الإرسال.</li>
              <li>اربط Listmonk كـ custom messenger أو webhook يرسل إلى MailFlow backend.</li>
              <li>لا تستخدم هذه الطريقة من browser أو frontend؛ لازم backend أو messenger آمن.</li>
            </ol>
          </div>
        </div>
        <pre class="ltr mt-4 overflow-auto rounded bg-slate-950 p-3 text-xs text-white">POST https://mailflow.yourdomain.com/api/v1/send-email
x-api-key: ADMIN_API_KEY
{
  "from": "newsletter@yourdomain.com",
  "to": "subscriber@example.com",
  "subject": "Campaign subject",
  "html": "&lt;p&gt;Campaign body&lt;/p&gt;",
  "text": "Campaign body"
}</pre>
        <p class="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">لأنك مستخدم وحيد: ابدأ بالطريقة الأسهل، Listmonk + Cloudflare SMTP، وخلي MailFlow للاستقبال والردود والسجلات التشغيلية. انقل الإرسال إلى MailFlow API فقط لو محتاج تحكم مركزي كامل.</p>
      </div>
    </section>
    <form x-data="settingsPage()" x-init="load()" @submit.prevent="save()" class="max-w-5xl rounded-lg border border-slate-200 bg-white p-4">
      <div class="grid gap-4 md:grid-cols-2">
        <template x-for="field in fields" :key="field.key"><label class="text-sm font-medium"><span x-text="field.label"></span><input :type="field.secret?'password':(field.type||'text')" :placeholder="field.secret?'Saved values are masked':''" x-model="form[field.key]" class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"></label></template>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" x-model="form.auto_reply_enabled"> Enable auto-reply globally</label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" x-model="form.ai_enabled"> Enable AI automation globally</label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" x-model="form.auto_ticket_enabled"> Enable auto-ticket creation</label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" x-model="form.outbound_enabled"> Enable outbound email</label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" x-model="form.require_verified_sender_warning"> Warn when senders are not verified</label>
      </div>
      <button class="mt-5 rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white">Save settings</button>
      <span class="ml-3 text-sm text-emerald-700" x-text="message"></span>
    </form>`,
    `<script>function settingsPage(){return{message:'',fields:[
      {key:'admin_api_key',label:'Admin API key',secret:true},{key:'telegram_bot_token',label:'Telegram bot token',secret:true},{key:'telegram_chat_id',label:'Telegram chat ID',secret:true},{key:'openai_api_key',label:'OpenAI API key',secret:true},{key:'openrouter_api_key',label:'OpenRouter API key',secret:true},{key:'default_forward_email',label:'Default forward email'},{key:'default_webhook_url',label:'Default webhook URL'},{key:'default_inbox',label:'Default inbox'},{key:'default_ticket_status',label:'Default ticket status'},{key:'default_ticket_priority',label:'Default ticket priority'},{key:'default_from_email',label:'Default outbound from email'},{key:'allowed_sender_addresses',label:'Allowed outbound senders'},{key:'log_retention_days',label:'Log retention days',type:'number'},{key:'attachment_retention_days',label:'Attachment retention days',type:'number'},{key:'workflow_retries_count',label:'Workflow/webhook retries',type:'number'},{key:'max_stored_body_preview_length',label:'Max body preview length',type:'number'},{key:'max_request_body_bytes',label:'Max request body bytes',type:'number'},{key:'max_attachment_bytes',label:'Max attachment bytes',type:'number'},{key:'max_recipients_per_request',label:'Max outbound recipients/request',type:'number'},{key:'daily_send_limit',label:'Outbound daily send limit',type:'number'},{key:'ollama_base_url',label:'Ollama base URL'}
    ],form:{auto_reply_enabled:false,ai_enabled:false,auto_ticket_enabled:true,outbound_enabled:true,require_verified_sender_warning:true},async load(){const data=await api('/settings');for(const s of data.settings){this.form[s.key]=s.value||''}this.form.auto_reply_enabled=this.form.auto_reply_enabled==='true';this.form.ai_enabled=this.form.ai_enabled==='true';this.form.auto_ticket_enabled=this.form.auto_ticket_enabled!=='false';this.form.outbound_enabled=this.form.outbound_enabled!=='false';this.form.require_verified_sender_warning=this.form.require_verified_sender_warning!=='false'},async save(){const payload={...this.form,auto_reply_enabled:String(Boolean(this.form.auto_reply_enabled)),ai_enabled:String(Boolean(this.form.ai_enabled)),auto_ticket_enabled:String(Boolean(this.form.auto_ticket_enabled)),outbound_enabled:String(Boolean(this.form.outbound_enabled)),require_verified_sender_warning:String(Boolean(this.form.require_verified_sender_warning))};await api('/settings',{method:'PUT',body:JSON.stringify(payload)});this.message='Saved'}}}</script>`
  );
}
