"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  DEMO_OPERATIONAL_ENTITIES,
  MANAUS_CENTER,
  OPERATIONAL_ENTITY_CONFIG,
  OPERATIONAL_PRIORITY_CONFIG,
} from "@/features/operational-map/operational-map.data";

import type {
  OperationalEntity,
  OperationalEntityType,
  OperationalLayerVisibility,
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

        map.addControl(new FullscreenControl(), "top-right");

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
        console.error("Falha ao inicializar o mapa:", error);

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

      markersRef.current.forEach((marker) => marker.remove());
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

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const { Marker } = await import("maplibre-gl");

      if (cancelled) {
        return;
      }

      const visibleEntities = DEMO_OPERATIONAL_ENTITIES.filter(
        (entity) => layers[entity.type],
      );

      markersRef.current = visibleEntities.map((entity) => {
        const config = OPERATIONAL_ENTITY_CONFIG[entity.type];
        const isSelected = selectedEntity?.id === entity.id;

        const markerElement = document.createElement("button");

        markerElement.type = "button";
        markerElement.setAttribute(
          "aria-label",
          `Selecionar ${config.singularLabel.toLowerCase()}: ${entity.title}`,
        );

        markerElement.style.width = isSelected ? "42px" : "34px";
        markerElement.style.height = isSelected ? "42px" : "34px";
        markerElement.style.borderRadius = "999px";
        markerElement.style.border = isSelected
          ? "4px solid #ffffff"
          : "3px solid rgba(255, 255, 255, 0.95)";
        markerElement.style.backgroundColor = config.color;
        markerElement.style.boxShadow = isSelected
          ? `0 0 0 6px ${config.color}55, 0 10px 25px rgba(15, 23, 42, 0.45)`
          : "0 8px 18px rgba(15, 23, 42, 0.35)";
        markerElement.style.cursor = "pointer";
        markerElement.style.transition =
          "width 160ms ease, height 160ms ease, box-shadow 160ms ease";
        markerElement.style.position = "relative";

        const centerDot = document.createElement("span");

        centerDot.style.position = "absolute";
        centerDot.style.left = "50%";
        centerDot.style.top = "50%";
        centerDot.style.width = isSelected ? "10px" : "8px";
        centerDot.style.height = isSelected ? "10px" : "8px";
        centerDot.style.borderRadius = "999px";
        centerDot.style.backgroundColor = "#ffffff";
        centerDot.style.transform = "translate(-50%, -50%)";

        markerElement.appendChild(centerDot);

        markerElement.addEventListener("click", (event) => {
          event.stopPropagation();

          setSelectedEntity(entity);

          map.flyTo({
            center: entity.coordinates,
            zoom: Math.max(map.getZoom(), 13),
            duration: 900,
            essential: true,
          });
        });

        return new Marker({
          element: markerElement,
          anchor: "center",
        })
          .setLngLat(entity.coordinates)
          .addTo(map);
      });
    }

    void renderMarkers();

    return () => {
      cancelled = true;
    };
  }, [layers, selectedEntity, status]);

  function toggleLayer(type: OperationalEntityType) {
    const layerWillBeHidden = layers[type];

    if (layerWillBeHidden && selectedEntity?.type === type) {
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

  const activeLayerCount = Object.values(layers).filter(Boolean).length;

  const visibleEntityCount = DEMO_OPERATIONAL_ENTITIES.filter(
    (entity) => layers[entity.type],
  ).length;

  const selectedEntityConfiguration = selectedEntity
    ? OPERATIONAL_ENTITY_CONFIG[selectedEntity.type]
    : null;

  const selectedPriority = selectedEntity?.priority ?? "normal";

  const selectedPriorityConfiguration = selectedEntity
    ? OPERATIONAL_PRIORITY_CONFIG[selectedPriority]
    : null;

  const formattedSelectedDate = selectedEntity
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(selectedEntity.createdAt))
    : "";

  return (
    <div className="relative h-[520px] w-full overflow-hidden bg-[#020617]">
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Mapa operacional de Manaus"
      />

      <aside className="absolute left-4 top-4 z-20 w-60 rounded-xl border border-slate-700 bg-slate-950/90 p-3 shadow-xl backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Camadas operacionais
            </p>

            <p className="mt-1 text-[11px] text-slate-500">
              {activeLayerCount} camadas · {visibleEntityCount} registros
            </p>
          </div>

          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/10 text-xs font-bold text-cyan-300">
            {visibleEntityCount}
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {(
            Object.keys(
              OPERATIONAL_ENTITY_CONFIG,
            ) as OperationalEntityType[]
          ).map((type) => {
            const config = OPERATIONAL_ENTITY_CONFIG[type];
            const active = layers[type];

            const entityCount = DEMO_OPERATIONAL_ENTITIES.filter(
              (entity) => entity.type === type,
            ).length;

            return (
              <button
                key={type}
                type="button"
                className={[
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs transition",
                  active
                    ? "border-slate-600 bg-slate-800/90 text-white"
                    : "border-slate-800 bg-slate-950/70 text-slate-500",
                ].join(" ")}
                onClick={() => toggleLayer(type)}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: active ? config.color : "#475569",
                    }}
                  />

                  {config.label}
                </span>

                <span className="flex items-center gap-2">
                  <span>{entityCount}</span>
                  <span>{active ? "Ativa" : "Oculta"}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800 pt-3">
          <button
            type="button"
            className="rounded-lg border border-slate-700 px-2 py-2 text-[11px] text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
            onClick={showAllLayers}
          >
            Exibir todas
          </button>

          <button
            type="button"
            className="rounded-lg border border-slate-700 px-2 py-2 text-[11px] text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
            onClick={hideAllLayers}
          >
            Ocultar todas
          </button>
        </div>

        <button
          type="button"
          className="mt-2 w-full rounded-lg border border-slate-700 px-2 py-2 text-[11px] text-slate-300 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-200"
          onClick={returnToManaus}
        >
          Retornar à visão geral
        </button>
      </aside>

      {selectedEntity &&
        selectedEntityConfiguration &&
        selectedPriorityConfiguration && (
          <aside className="absolute bottom-4 right-4 top-4 z-20 flex w-[340px] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/95 shadow-2xl backdrop-blur">
            <div
              className="h-1.5 w-full"
              style={{
                backgroundColor: selectedEntityConfiguration.color,
              }}
            />

            <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{
                    color: selectedEntityConfiguration.color,
                  }}
                >
                  {selectedEntityConfiguration.singularLabel}
                </p>

                <h3 className="mt-2 text-lg font-semibold leading-6 text-white">
                  {selectedEntity.title}
                </h3>
              </div>

              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-sm text-slate-400 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
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
                    color: selectedPriorityConfiguration.color,
                    backgroundColor:
                      selectedPriorityConfiguration.backgroundColor,
                  }}
                >
                  Prioridade {selectedPriorityConfiguration.label}
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
                    {selectedEntity.coordinates[1].toFixed(6)},{" "}
                    {selectedEntity.coordinates[0].toFixed(6)}
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
                className="rounded-xl border border-slate-700 px-3 py-3 text-xs font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
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

      {status === "ready" && !selectedEntity && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-lg border border-slate-700 bg-slate-950/85 px-3 py-2 text-xs text-slate-300 shadow-lg backdrop-blur">
          Clique em um marcador para consultar os detalhes
        </div>
      )}
    </div>
  );
}