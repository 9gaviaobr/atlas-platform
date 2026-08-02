"use client";

import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";

const MANAUS_CENTER: [number, number] = [-60.0217, -3.119];

type MapStatus = "loading" | "ready" | "error";

type EntityType = "occurrence" | "person" | "vehicle" | "alert";

type OperationalEntity = {
  id: string;
  type: EntityType;
  title: string;
  description: string;
  coordinates: [number, number];
};

type LayerVisibility = Record<EntityType, boolean>;

const ENTITY_CONFIG: Record<
  EntityType,
  {
    label: string;
    color: string;
  }
> = {
  occurrence: {
    label: "Ocorrências",
    color: "#f97316",
  },
  person: {
    label: "Pessoas",
    color: "#22d3ee",
  },
  vehicle: {
    label: "Veículos",
    color: "#a78bfa",
  },
  alert: {
    label: "Alertas",
    color: "#ef4444",
  },
};

const DEMO_ENTITIES: OperationalEntity[] = [
  {
    id: "occurrence-001",
    type: "occurrence",
    title: "Ocorrência demonstrativa",
    description: "Registro fictício utilizado para validar a camada.",
    coordinates: [-60.013, -3.108],
  },
  {
    id: "occurrence-002",
    type: "occurrence",
    title: "Registro georreferenciado",
    description: "Ponto sintético para testes de visualização.",
    coordinates: [-59.984, -3.122],
  },
  {
    id: "person-001",
    type: "person",
    title: "Pessoa demonstrativa",
    description: "Entidade fictícia sem vínculo com pessoa real.",
    coordinates: [-60.041, -3.095],
  },
  {
    id: "vehicle-001",
    type: "vehicle",
    title: "Veículo demonstrativo",
    description: "Registro sintético para validação cartográfica.",
    coordinates: [-60.026, -3.143],
  },
  {
    id: "alert-001",
    type: "alert",
    title: "Alerta operacional",
    description: "Alerta fictício de alta prioridade.",
    coordinates: [-59.997, -3.087],
  },
];

export function OperationalMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef = useRef<import("maplibre-gl").Marker[]>([]);

  const [status, setStatus] = useState<MapStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const [layers, setLayers] = useState<LayerVisibility>({
    occurrence: true,
    person: true,
    vehicle: true,
    alert: true,
  });

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
    async function renderMarkers() {
      const map = mapRef.current;

      if (!map || status !== "ready") {
        return;
      }

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const { Marker, Popup } = await import("maplibre-gl");

      const visibleEntities = DEMO_ENTITIES.filter(
        (entity) => layers[entity.type],
      );

      markersRef.current = visibleEntities.map((entity) => {
        const config = ENTITY_CONFIG[entity.type];

        const popup = new Popup({
          offset: 26,
          closeButton: true,
        }).setHTML(`
          <div style="
            min-width: 210px;
            font-family: Arial, sans-serif;
            color: #0f172a;
          ">
            <div style="
              margin-bottom: 8px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              color: ${config.color};
            ">
              ${config.label}
            </div>

            <strong style="font-size: 14px;">
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
  }, [layers, status]);

  function toggleLayer(type: EntityType) {
    setLayers((current) => ({
      ...current,
      [type]: !current[type],
    }));
  }

  function reloadPage() {
    window.location.reload();
  }

  return (
    <div className="relative h-[460px] w-full overflow-hidden bg-[#020617]">
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        aria-label="Mapa operacional de Manaus"
      />

      <div className="absolute left-4 top-4 z-20 w-52 rounded-xl border border-slate-700 bg-slate-950/90 p-3 shadow-xl backdrop-blur">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Camadas operacionais
        </p>

        <div className="space-y-2">
          {(Object.keys(ENTITY_CONFIG) as EntityType[]).map((type) => {
            const config = ENTITY_CONFIG[type];
            const active = layers[type];

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
                      backgroundColor: active
                        ? config.color
                        : "#475569",
                    }}
                  />

                  {config.label}
                </span>

                <span>{active ? "Ativa" : "Oculta"}</span>
              </button>
            );
          })}
        </div>
      </div>

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