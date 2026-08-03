import {
  operationalMapRepository,
  type OperationalEntityQuery,
} from "./operational-map.repository";

import type {
  OperationalEntity,
  OperationalEntityType,
  OperationalPriority,
} from "./operational-map.types";

export type OperationalMapSummary = {
  total: number;
  byType: Record<OperationalEntityType, number>;
  byPriority: Record<OperationalPriority, number>;
  activeAlerts: number;
};

function createEmptyTypeSummary(): Record<
  OperationalEntityType,
  number
> {
  return {
    occurrence: 0,
    person: 0,
    vehicle: 0,
    alert: 0,
  };
}

function createEmptyPrioritySummary(): Record<
  OperationalPriority,
  number
> {
  return {
    normal: 0,
    medium: 0,
    high: 0,
  };
}

export async function getOperationalEntities() {
  return operationalMapRepository.findAll();
}

export async function getOperationalEntityById(id: string) {
  return operationalMapRepository.findById(id);
}

export async function searchOperationalEntities(
  query: OperationalEntityQuery,
) {
  return operationalMapRepository.search(query);
}

export async function getOperationalMapSummary(): Promise<OperationalMapSummary> {
  const entities = await operationalMapRepository.findAll();

  const byType = createEmptyTypeSummary();
  const byPriority = createEmptyPrioritySummary();

  let activeAlerts = 0;

  for (const entity of entities) {
    byType[entity.type] += 1;

    const priority = entity.priority ?? "normal";
    byPriority[priority] += 1;

    if (
      entity.type === "alert" &&
      entity.status.toLocaleLowerCase("pt-BR") === "ativo"
    ) {
      activeAlerts += 1;
    }
  }

  return {
    total: entities.length,
    byType,
    byPriority,
    activeAlerts,
  };
}

export function sortOperationalEntitiesByDate(
  entities: OperationalEntity[],
) {
  return [...entities].sort(
    (firstEntity, secondEntity) =>
      new Date(secondEntity.createdAt).getTime() -
      new Date(firstEntity.createdAt).getTime(),
  );
}