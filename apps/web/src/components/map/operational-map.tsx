"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  DEMO_OPERATIONAL_ENTITIES,
  MANAUS_CENTER,
  OPERATIONAL_ENTITY_CONFIG,
} from "@/features/operational-map/operational-map.data";

import type {
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

      const { Marker, Popup } = await import("maplibre-gl");

      if (cancelled) {
        return;
      }

      const visibleEntities = DEMO_OPERATIONAL_ENTITIES.filter(
        (entity) => layers[entity.type],
      );

      markersRef.current = visibleEntities.map((entity) => {
        const config = OPERATIONAL_ENTITY_CONFIG[entity.type];

        const priorityLabel = {
          normal: "Normal",
          medium: "Média",
          high: "Alta",
        }[entity.priority ?? "normal"];

        const formattedDate = new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(entity.createdAt));

        const popup = new Popup({
          offset: 26,
          closeButton: true,
          closeOnClick: false,
        }).setHTML(`
          <div style="
            min-width: 230px;
            font-family: Arial, sans-serif;
            color: #0f172a;
          ">
            <div style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              margin-bottom: 10px;
            ">
              <span style="
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: ${config.color};
              ">
                ${config.singularLabel}
              </span>

              <span style="
                border-radius: 999px;
                background: #e2e8f0;
                padding: 3px 8px;
                font-size: 10px;
                font-weight: 700;
                color: #334155;
              ">
                ${priorityLabel}
              </span>
            </div>

            <strong style="
              display: block;
              font-size: 14px;
              line-height: 1.4;
            ">
              ${entity.title}
            </strong>

            <p style="
              margin: 8px 0 0;
              font-size: 12px;
              line-height: 1.5;
              color: #475569;
            ">
              ${entity.description}
            </p>

            <div style="
              margin-top: 12px;
              border-top: 1px solid #e2e8f0;
              padding-top: 10px;
              font-size: 11px;
              color: #64748b;
            ">
              Registrado em ${formattedDate}
            </div>
          </div>
        `);

        return new Marker({
          color: config.color,
        })
          .setLngLat(entity.coordinates)
          .setPopup(popup)
          .addTo(map);
      });
    }

    void renderMarkers();

    return () => {
      cancelled = true;
    };
  }, [layers, status]);

  function toggleLayer(type: OperationalEntityType) {
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
  }

  function reloadPage() {
    window.location.reload();
  }

  const activeLayerCount = Object.values(layers).filter(Boolean).length;
  const visibleEntityCount = DEMO_OPERATIONAL_ENTITIES.filter(
    (entity) => layers[entity.type],
  ).length;

  return (
    <div className="relative h-[480px] w-full overflow-hidden bg-[#020617]">
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
      </aside>

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

      {status === "ready" && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-lg border border-slate-700 bg-slate-950/85 px-3 py-2 text-xs text-slate-300 shadow-lg backdrop-blur">
          Dados demonstrativos · OpenStreetMap
        </div>
      )}
    </div>
  );
}