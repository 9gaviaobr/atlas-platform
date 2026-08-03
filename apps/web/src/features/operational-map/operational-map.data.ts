import type {
  OperationalEntity,
  OperationalEntityConfiguration,
  OperationalEntityType,
} from "./operational-map.types";

export const MANAUS_CENTER: [number, number] = [-60.0217, -3.119];

export const OPERATIONAL_ENTITY_CONFIG: Record<
  OperationalEntityType,
  OperationalEntityConfiguration
> = {
  occurrence: {
    label: "Ocorrências",
    singularLabel: "Ocorrência",
    color: "#f97316",
  },

  person: {
    label: "Pessoas",
    singularLabel: "Pessoa",
    color: "#22d3ee",
  },

  vehicle: {
    label: "Veículos",
    singularLabel: "Veículo",
    color: "#a78bfa",
  },

  alert: {
    label: "Alertas",
    singularLabel: "Alerta",
    color: "#ef4444",
  },
};

/*
 * Registros exclusivamente demonstrativos.
 * Não representam pessoas, veículos ou ocorrências reais.
 *
 * Futuramente esta constante será substituída por dados
 * provenientes da API e do banco de dados do Atlas.
 */
export const DEMO_OPERATIONAL_ENTITIES: OperationalEntity[] = [
  {
    id: "occurrence-demo-001",
    type: "occurrence",
    title: "Ocorrência demonstrativa",
    description:
      "Registro fictício utilizado para validar a camada de ocorrências.",
    coordinates: [-60.013, -3.108],
    createdAt: "2026-08-02T12:00:00-04:00",
    priority: "medium",
  },

  {
    id: "occurrence-demo-002",
    type: "occurrence",
    title: "Registro georreferenciado",
    description:
      "Ponto sintético utilizado para testes de visualização cartográfica.",
    coordinates: [-59.984, -3.122],
    createdAt: "2026-08-02T12:15:00-04:00",
    priority: "normal",
  },

  {
    id: "person-demo-001",
    type: "person",
    title: "Pessoa demonstrativa",
    description:
      "Entidade fictícia criada exclusivamente para validação da interface.",
    coordinates: [-60.041, -3.095],
    createdAt: "2026-08-02T12:30:00-04:00",
    priority: "normal",
  },

  {
    id: "vehicle-demo-001",
    type: "vehicle",
    title: "Veículo demonstrativo",
    description:
      "Registro sintético utilizado para validar a camada de veículos.",
    coordinates: [-60.026, -3.143],
    createdAt: "2026-08-02T12:45:00-04:00",
    priority: "normal",
  },

  {
    id: "alert-demo-001",
    type: "alert",
    title: "Alerta operacional demonstrativo",
    description:
      "Alerta fictício de alta prioridade utilizado para validação visual.",
    coordinates: [-59.997, -3.087],
    createdAt: "2026-08-02T13:00:00-04:00",
    priority: "high",
  },
];