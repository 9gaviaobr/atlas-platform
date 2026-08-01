const navigation = [
  { label: "Visão geral", symbol: "◫", active: true },
  { label: "Inteligência", symbol: "◎" },
  { label: "Pessoas", symbol: "♙" },
  { label: "Veículos", symbol: "◇" },
  { label: "Ocorrências", symbol: "△" },
  { label: "Mapa operacional", symbol: "⌖" },
  { label: "Análises", symbol: "▥" },
  { label: "Relatórios", symbol: "▤" },
];

const indicators = [
  {
    label: "Registros analisados",
    value: "1.284",
    detail: "+12,4% no período",
  },
  {
    label: "Alertas ativos",
    value: "18",
    detail: "5 de alta prioridade",
  },
  {
    label: "Entidades monitoradas",
    value: "342",
    detail: "Pessoas, veículos e locais",
  },
  {
    label: "Vínculos identificados",
    value: "897",
    detail: "+43 nas últimas 24h",
  },
];

const activities = [
  {
    title: "Novo vínculo identificado",
    description: "Correlação entre pessoa, veículo e ocorrência.",
    time: "Há 8 minutos",
    priority: "Alta",
  },
  {
    title: "Registro georreferenciado",
    description: "Nova localização incorporada ao mapa operacional.",
    time: "Há 23 minutos",
    priority: "Média",
  },
  {
    title: "Documento processado",
    description: "Extração e estruturação de informações concluídas.",
    time: "Há 41 minutos",
    priority: "Normal",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050814] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-slate-800/80 bg-[#080d1b] lg:flex lg:flex-col">
          <div className="flex h-20 items-center border-b border-slate-800/80 px-7">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 font-black text-slate-950">
              A
            </div>

            <div className="ml-3">
              <p className="text-base font-bold tracking-[0.16em] text-white">
                ATLAS
              </p>
              <p className="text-xs text-slate-500">Intelligence Platform</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Operações
            </p>

            {navigation.map((item) => (
              <button
                key={item.label}
                className={[
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition",
                  item.active
                    ? "bg-cyan-400/10 text-cyan-300"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white",
                ].join(" ")}
                type="button"
              >
                <span
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-lg border text-base",
                    item.active
                      ? "border-cyan-400/30 bg-cyan-400/10"
                      : "border-slate-800 bg-slate-900",
                  ].join(" ")}
                >
                  {item.symbol}
                </span>

                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="border-t border-slate-800/80 p-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ambiente
              </p>

              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Sistemas operacionais
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Serviços essenciais disponíveis.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-20 items-center justify-between border-b border-slate-800/80 bg-[#070b17]/90 px-5 backdrop-blur md:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">
                Centro de comando
              </p>
              <h1 className="mt-1 text-xl font-semibold text-white">
                Visão geral operacional
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="hidden h-10 min-w-72 items-center rounded-xl border border-slate-800 bg-slate-900/70 px-4 text-left text-sm text-slate-500 transition hover:border-slate-700 md:flex"
                type="button"
              >
                Pesquisar pessoas, veículos ou ocorrências...
              </button>

              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:text-white"
                type="button"
                aria-label="Notificações"
              >
                ◉
              </button>

              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400 font-bold text-slate-950">
                  AA
                </div>

                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-white">Operador</p>
                  <p className="text-xs text-slate-500">Administrador</p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-5 md:p-8">
            <section className="overflow-hidden rounded-3xl border border-cyan-400/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_35%),linear-gradient(135deg,#0b1326,#080d1b)] p-6 md:p-8">
              <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-300" />
                    Atualização em tempo real
                  </div>

                  <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    Consciência situacional em uma única plataforma
                  </h2>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
                    Centralize informações, identifique vínculos relevantes e
                    acompanhe indicadores operacionais com rastreabilidade.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                    type="button"
                  >
                    Nova análise
                  </button>

                  <button
                    className="rounded-xl border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-600"
                    type="button"
                  >
                    Importar dados
                  </button>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {indicators.map((indicator) => (
                <article
                  key={indicator.label}
                  className="rounded-2xl border border-slate-800 bg-[#0a1020] p-5 transition hover:border-slate-700"
                >
                  <p className="text-sm text-slate-500">{indicator.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">
                    {indicator.value}
                  </p>
                  <p className="mt-3 text-xs text-cyan-300">
                    {indicator.detail}
                  </p>
                </article>
              ))}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <article className="min-h-[430px] overflow-hidden rounded-2xl border border-slate-800 bg-[#0a1020]">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                  <div>
                    <h3 className="font-semibold text-white">
                      Mapa operacional
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Distribuição espacial dos registros monitorados
                    </p>
                  </div>

                  <button
                    className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300"
                    type="button"
                  >
                    Expandir
                  </button>
                </div>

                <div className="relative flex min-h-[350px] items-center justify-center overflow-hidden bg-[linear-gradient(rgba(15,23,42,0.75),rgba(15,23,42,0.75)),radial-gradient(circle_at_center,rgba(34,211,238,0.14),transparent_55%)]">
                  <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px)] [background-size:32px_32px]" />

                  <div className="relative text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-3xl text-cyan-300">
                      ⌖
                    </div>

                    <p className="mt-4 font-medium text-white">
                      Camada cartográfica
                    </p>

                    <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                      O mapa interativo será conectado ao módulo geoespacial nas
                      próximas etapas.
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-800 bg-[#0a1020]">
                <div className="border-b border-slate-800 px-5 py-4">
                  <h3 className="font-semibold text-white">Atividade recente</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Eventos relevantes processados pelo Atlas
                  </p>
                </div>

                <div className="divide-y divide-slate-800">
                  {activities.map((activity) => (
                    <div key={activity.title} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-semibold text-white">
                            {activity.title}
                          </h4>
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {activity.description}
                          </p>
                        </div>

                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] font-semibold text-cyan-300">
                          {activity.priority}
                        </span>
                      </div>

                      <p className="mt-3 text-[11px] text-slate-600">
                        {activity.time}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-4">
                  <button
                    className="w-full rounded-xl border border-slate-700 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
                    type="button"
                  >
                    Ver toda a atividade
                  </button>
                </div>
              </article>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}