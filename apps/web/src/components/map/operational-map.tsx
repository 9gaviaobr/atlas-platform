"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  DEMO_OPERATIONAL_ENTITIES,
  MANAUS_CENTER,
  OPERATIONAL_ENTITY_CONFIG,
  OPERATIONAL_PRIORITY_CONFIG,
} from "@/features/operational-map/operational-map.data";

import {
  filterOperationalEntities,
  getOperationalStatuses,
  INITIAL_OPERATIONAL_SEARCH_FILTERS,
} from "@/features/operational-map/operational-map.search";

import type { OperationalSearchFilters } from "@/features/operational-map/operational-map.search";

import type {
  OperationalEntity,
  OperationalEntityType,
  OperationalLayerVisibility,
  OperationalPriority,
} from "@/features/operational-map/operational-map.types";

type MapStatus = "loading" | "ready" | "error";

const INITIAL_LAYER_VISIBILITY: OperationalLayerVisibility = {
  occurrence: true,
  person: true,
  vehicle: true,
  alert: true,
};

export function OperationalMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<import("maplibre-gl").Marker[]>([]);

  const [status, setStatus] = useState<MapStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const [layers, setLayers] = useState<OperationalLayerVisibility>(
    INITIAL_LAYER_VISIBILITY,
  );

  const [selectedEntity, setSelectedEntity] =
    useState<OperationalEntity | null>(null);

  const [searchFilters, setSearchFilters] =
    useState<OperationalSearchFilters>(
      INITIAL_OPERATIONAL_SEARCH_FILTERS,
    );

  const [searchExpanded, setSearchExpanded] = useState(true);

  const availableStatuses = useMemo(
    () => getOperationalStatuses(DEMO_OPERATIONAL_ENTITIES),
    [],
  );

  const filteredEntities = useMemo(
    () =>
      filterOperationalEntities(
        DEMO_OPERATIONAL_ENTITIES,
        searchFilters,
      ),
    [searchFilters],
  );

  const visibleEntities = useMemo(
    () =>
      filteredEntities.filter(
        (entity) => layers[entity.type],
      ),
    [filteredEntities, layers],
  );

  const hasActiveFilters =
    searchFilters.query.trim().length > 0 ||
    searchFilters.type !== "all" ||
    searchFilters.priority !== "all" ||
    searchFilters.status !== "all";

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!containerRef.current || mapRef.current) {
        return;
      }

      try {
        setStatus("loading");
        setErrorMessage("");

        const {
          Map,
          NavigationControl,
          FullscreenControl,
          ScaleControl,
        } = await import("maplibre-gl");

        if (cancelled || !containerRef.current) {
          return;
        }

        const map = new Map({
          container: containerRef.current,
          style: {
            version: 8,
            sources: {
              openStreetMap: {
                type: "raster",
                tiles: [
                  "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                ],
                tileSize: 256,
                attribution: "© OpenStreetMap contributors",
              },
            },
            layers: [
              {
                id: "openStreetMap",
                type: "raster",
                source: "openStreetMap",
              },
            ],
          },
          center: MANAUS_CENTER,
          zoom: 10,
          attributionControl: {},
        });

        map.addControl(
          new NavigationControl({
            showCompass: true,
            showZoom: true,
          }),
          "top-right",
        );

        map.addControl(
          new FullscreenControl(),
          "top-right",
        );

        map.addControl(
          new ScaleControl({
            maxWidth: 120,
            unit: "metric",
          }),
          "bottom-left",
        );

        map.on("load", () => {
          map.resize();

          if (!cancelled) {
            setStatus("ready");
          }
        });

        map.on("error", (event) => {
          console.error("Erro do MapLibre:", event.error);

          if (!cancelled) {
            setErrorMessage(
              event.error?.message ??
                "Falha ao carregar a base cartográfica.",
            );

            setStatus("error");
          }
        });

        mapRef.current = map;
      } catch (error) {
        console.error(
          "Falha ao inicializar o mapa:",
          error,
        );

        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível inicializar o mapa.",
          );

          setStatus("error");
        }
      }
    }

    void initializeMap();

    return () => {
      cancelled = true;

      markersRef.current.forEach((marker) =>
        marker.remove(),
      );

      markersRef.current = [];

      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function renderMarkers() {
      const map = mapRef.current;

      if (!map || status !== "ready") {
        return;
      }

      markersRef.current.forEach((marker) =>
        marker.remove(),
      );

      markersRef.current = [];

      const { Marker } = await import("maplibre-gl");

      if (cancelled) {
        return;
      }

      markersRef.current = visibleEntities.map(
        (entity) => {
          const config =
            OPERATIONAL_ENTITY_CONFIG[entity.type];

          const isSelected =
            selectedEntity?.id === entity.id;

          const markerElement =
            document.createElement("button");

          markerElement.type = "button";

          markerElement.setAttribute(
            "aria-label",
            `Selecionar ${config.singularLabel.toLowerCase()}: ${entity.title}`,
          );

          markerElement.style.width = isSelected
            ? "42px"
            : "34px";

          markerElement.style.height = isSelected
            ? "42px"
            : "34px";

          markerElement.style.borderRadius = "999px";

          markerElement.style.border = isSelected
            ? "4px solid #ffffff"
            : "3px solid rgba(255, 255, 255, 0.95)";

          markerElement.style.backgroundColor =
            config.color;

          markerElement.style.boxShadow = isSelected
            ? `0 0 0 6px ${config.color}55, 0 10px 25px rgba(15, 23, 42, 0.45)`
            : "0 8px 18px rgba(15, 23, 42, 0.35)";

          markerElement.style.cursor = "pointer";

          markerElement.style.transition =
            "width 160ms ease, height 160ms ease, box-shadow 160ms ease";

          markerElement.style.position = "relative";

          const centerDot =
            document.createElement("span");

          centerDot.style.position = "absolute";
          centerDot.style.left = "50%";
          centerDot.style.top = "50%";

          centerDot.style.width = isSelected
            ? "10px"
            : "8px";

          centerDot.style.height = isSelected
            ? "10px"
            : "8px";

          centerDot.style.borderRadius = "999px";
          centerDot.style.backgroundColor = "#ffffff";

          centerDot.style.transform =
            "translate(-50%, -50%)";

          markerElement.appendChild(centerDot);

          markerElement.addEventListener(
            "click",
            (event) => {
              event.stopPropagation();
              selectEntity(entity);
            },
          );

          return new Marker({
            element: markerElement,
            anchor: "center",
          })
            .setLngLat(entity.coordinates)
            .addTo(map);
        },
      );
    }

    void renderMarkers();

    return () => {
      cancelled = true;
    };
  }, [selectedEntity, status, visibleEntities]);

  function selectEntity(entity: OperationalEntity) {
    const map = mapRef.current;

    setLayers((current) => ({
      ...current,
      [entity.type]: true,
    }));

    setSelectedEntity(entity);

    if (!map) {
      return;
    }

    map.flyTo({
      center: entity.coordinates,
      zoom: Math.max(map.getZoom(), 13),
      duration: 900,
      essential: true,
    });
  }

  function toggleLayer(type: OperationalEntityType) {
    const layerWillBeHidden = layers[type];

    if (
      layerWillBeHidden &&
      selectedEntity?.type === type
    ) {
      setSelectedEntity(null);
    }

    setLayers((current) => ({
      ...current,
      [type]: !current[type],
    }));
  }

  function showAllLayers() {
    setLayers({
      occurrence: true,
      person: true,
      vehicle: true,
      alert: true,
    });
  }

  function hideAllLayers() {
    setLayers({
      occurrence: false,
      person: false,
      vehicle: false,
      alert: false,
    });

    setSelectedEntity(null);
  }

  function updateSearchFilter<
    Key extends keyof OperationalSearchFilters,
  >(
    key: Key,
    value: OperationalSearchFilters[Key],
  ) {
    setSearchFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function clearSearchFilters() {
    setSearchFilters(
      INITIAL_OPERATIONAL_SEARCH_FILTERS,
    );
  }

  function closeDetails() {
    setSelectedEntity(null);
  }

  function centerSelectedEntity() {
    const map = mapRef.current;

    if (!map || !selectedEntity) {
      return;
    }

    map.flyTo({
      center: selectedEntity.coordinates,
      zoom: 15,
      duration: 900,
      essential: true,
    });
  }

  function returnToManaus() {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    setSelectedEntity(null);

    map.flyTo({
      center: MANAUS_CENTER,
      zoom: 10,
      duration: 900,
      essential: true,
    });
  }

  function reloadPage() {
    window.location.reload();
  }

  const activeLayerCount =
    Object.values(layers).filter(Boolean).length;

  const selectedEntityConfiguration = selectedEntity
    ? OPERATIONAL_ENTITY_CONFIG[selectedEntity.type]
    : null;

  const selectedPriority =
    selectedEntity?.priority ?? "normal";

  const selectedPriorityConfiguration =
    selectedEntity
      ? OPERATIONAL_PRIORITY_CONFIG[
          selectedPriority
        ]
      : null;

  const formattedSelectedDate = selectedEntity
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(selectedEntity.createdAt))
    : "";

  return (
    <div className="relative h-[620px] w-full overflow-hidden bg-[#020617]">
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Mapa operacional de Manaus"
      />

      <aside className="absolute bottom-4 left-4 top-4 z-20 flex w-[310px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/95 shadow-2xl backdrop-blur">
        <div className="border-b border-slate-800 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                Busca global
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Pessoas, veículos, alertas e
                ocorrências
              </p>
            </div>

            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
              onClick={() =>
                setSearchExpanded((current) => !current)
              }
              aria-label={
                searchExpanded
                  ? "Recolher busca"
                  : "Expandir busca"
              }
            >
              {searchExpanded ? "−" : "+"}
            </button>
          </div>

          {searchExpanded && (
            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="operational-search"
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                >
                  Termo de busca
                </label>

                <input
                  id="operational-search"
                  type="search"
                  value={searchFilters.query}
                  placeholder="Nome, referência, local..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
                  onChange={(event) =>
                    updateSearchFilter(
                      "query",
                      event.target.value,
                    )
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="entity-type-filter"
                    className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                  >
                    Tipo
                  </label>

                  <select
                    id="entity-type-filter"
                    value={searchFilters.type}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-[11px] text-slate-200 outline-none focus:border-cyan-400/60"
                    onChange={(event) =>
                      updateSearchFilter(
                        "type",
                        event.target.value as
                          | OperationalEntityType
                          | "all",
                      )
                    }
                  >
                    <option value="all">
                      Todos
                    </option>

                    {(
                      Object.keys(
                        OPERATIONAL_ENTITY_CONFIG,
                      ) as OperationalEntityType[]
                    ).map((type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {
                          OPERATIONAL_ENTITY_CONFIG[
                            type
                          ].label
                        }
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="priority-filter"
                    className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                  >
                    Prioridade
                  </label>

                  <select
                    id="priority-filter"
                    value={searchFilters.priority}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-[11px] text-slate-200 outline-none focus:border-cyan-400/60"
                    onChange={(event) =>
                      updateSearchFilter(
                        "priority",
                        event.target.value as
                          | OperationalPriority
                          | "all",
                      )
                    }
                  >
                    <option value="all">
                      Todas
                    </option>

                    {(
                      Object.keys(
                        OPERATIONAL_PRIORITY_CONFIG,
                      ) as OperationalPriority[]
                    ).map((priority) => (
                      <option
                        key={priority}
                        value={priority}
                      >
                        {
                          OPERATIONAL_PRIORITY_CONFIG[
                            priority
                          ].label
                        }
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="status-filter"
                  className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"
                >
                  Status
                </label>

                <select
                  id="status-filter"
                  value={searchFilters.status}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-[11px] text-slate-200 outline-none focus:border-cyan-400/60"
                  onChange={(event) =>
                    updateSearchFilter(
                      "status",
                      event.target.value,
                    )
                  }
                >
                  <option value="all">
                    Todos os status
                  </option>

                  {availableStatuses.map((statusValue) => (
                    <option
                      key={statusValue}
                      value={statusValue}
                    >
                      {statusValue}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-[11px] font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!hasActiveFilters}
                onClick={clearSearchFilters}
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        <div className="border-b border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Camadas
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                {activeLayerCount} ativas ·{" "}
                {visibleEntities.length} registros
              </p>
            </div>

            <span className="flex h-7 min-w-7 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 text-xs font-bold text-cyan-300">
              {visibleEntities.length}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              Object.keys(
                OPERATIONAL_ENTITY_CONFIG,
              ) as OperationalEntityType[]
            ).map((type) => {
              const config =
                OPERATIONAL_ENTITY_CONFIG[type];

              const active = layers[type];

              return (
                <button
                  key={type}
                  type="button"
                  className={[
                    "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] transition",
                    active
                      ? "border-slate-600 bg-slate-800/90 text-white"
                      : "border-slate-800 bg-slate-950 text-slate-500",
                  ].join(" ")}
                  onClick={() => toggleLayer(type)}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: active
                        ? config.color
                        : "#475569",
                    }}
                  />

                  <span className="truncate">
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-2 py-2 text-[10px] text-slate-300 transition hover:bg-slate-800"
              onClick={showAllLayers}
            >
              Exibir todas
            </button>

            <button
              type="button"
              className="rounded-lg border border-slate-700 px-2 py-2 text-[10px] text-slate-300 transition hover:bg-slate-800"
              onClick={hideAllLayers}
            >
              Ocultar todas
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Resultados
              </p>

              <p className="mt-1 text-[11px] text-slate-500">
                {visibleEntities.length} encontrados
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {visibleEntities.length === 0 ? (
              <div className="flex h-full min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-800 p-5 text-center">
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Nenhum registro encontrado
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Altere os filtros ou ative outras
                    camadas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleEntities.map((entity) => {
                  const config =
                    OPERATIONAL_ENTITY_CONFIG[
                      entity.type
                    ];

                  const priority =
                    OPERATIONAL_PRIORITY_CONFIG[
                      entity.priority ?? "normal"
                    ];

                  const isSelected =
                    selectedEntity?.id === entity.id;

                  return (
                    <button
                      key={entity.id}
                      type="button"
                      className={[
                        "w-full rounded-xl border p-3 text-left transition",
                        isSelected
                          ? "border-cyan-400/60 bg-cyan-400/10"
                          : "border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-800/80",
                      ].join(" ")}
                      onClick={() =>
                        selectEntity(entity)
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                            style={{
                              color: config.color,
                            }}
                          >
                            {config.singularLabel}
                          </p>

                          <p className="mt-1 truncate text-xs font-semibold text-white">
                            {entity.title}
                          </p>
                        </div>

                        <span
                          className="shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold"
                          style={{
                            color: priority.color,
                            backgroundColor:
                              priority.backgroundColor,
                          }}
                        >
                          {priority.label}
                        </span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-slate-500">
                        {entity.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-slate-600">
                        <span className="truncate">
                          {entity.reference}
                        </span>

                        <span className="shrink-0">
                          {entity.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 p-3">
            <button
              type="button"
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-[11px] text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200"
              onClick={returnToManaus}
            >
              Retornar à visão geral
            </button>
          </div>
        </div>
      </aside>

      {selectedEntity &&
        selectedEntityConfiguration &&
        selectedPriorityConfiguration && (
          <aside className="absolute bottom-4 right-4 top-4 z-20 flex w-[340px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/95 shadow-2xl backdrop-blur">
            <div
              className="h-1.5 w-full"
              style={{
                backgroundColor:
                  selectedEntityConfiguration.color,
              }}
            />

            <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{
                    color:
                      selectedEntityConfiguration.color,
                  }}
                >
                  {
                    selectedEntityConfiguration.singularLabel
                  }
                </p>

                <h3 className="mt-2 text-lg font-semibold leading-6 text-white">
                  {selectedEntity.title}
                </h3>
              </div>

              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                onClick={closeDetails}
                aria-label="Fechar painel de detalhes"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{
                    color:
                      selectedPriorityConfiguration.color,
                    backgroundColor:
                      selectedPriorityConfiguration.backgroundColor,
                  }}
                >
                  Prioridade{" "}
                  {selectedPriorityConfiguration.label}
                </span>

                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-[11px] font-medium text-slate-300">
                  {selectedEntity.status}
                </span>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-300">
                {selectedEntity.description}
              </p>

              <dl className="mt-6 space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Referência
                  </dt>

                  <dd className="mt-2 text-sm font-medium text-white">
                    {selectedEntity.reference}
                  </dd>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Localização
                  </dt>

                  <dd className="mt-2 text-sm font-medium text-white">
                    {selectedEntity.locationLabel}
                  </dd>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Coordenadas
                  </dt>

                  <dd className="mt-2 font-mono text-xs text-cyan-300">
                    {selectedEntity.coordinates[1].toFixed(
                      6,
                    )}
                    ,{" "}
                    {selectedEntity.coordinates[0].toFixed(
                      6,
                    )}
                  </dd>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Data do registro
                  </dt>

                  <dd className="mt-2 text-sm font-medium text-white">
                    {formattedSelectedDate}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-800 p-4">
              <button
                type="button"
                className="rounded-xl border border-slate-700 px-3 py-3 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                onClick={closeDetails}
              >
                Fechar
              </button>

              <button
                type="button"
                className="rounded-xl bg-cyan-400 px-3 py-3 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
                onClick={centerSelectedEntity}
              >
                Centralizar
              </button>
            </div>
          </aside>
        )}

      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

            <p className="mt-3 text-sm text-slate-300">
              Carregando mapa operacional...
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950 p-6">
          <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center">
            <p className="font-semibold text-red-300">
              Não foi possível carregar o mapa
            </p>

            <p className="mt-2 break-words text-sm leading-6 text-slate-300">
              {errorMessage}
            </p>

            <button
              type="button"
              className="mt-4 rounded-lg border border-slate-600 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
              onClick={reloadPage}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {status === "ready" &&
        !selectedEntity &&
        visibleEntities.length > 0 && (
          <div className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-lg border border-slate-700 bg-slate-950/85 px-3 py-2 text-xs text-slate-300 shadow-lg backdrop-blur">
            {visibleEntities.length} registros visíveis
          </div>
        )}
    </div>
  );
}