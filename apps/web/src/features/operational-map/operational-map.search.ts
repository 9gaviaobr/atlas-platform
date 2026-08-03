import type {
  OperationalEntity,
  OperationalEntityType,
  OperationalPriority,
} from "./operational-map.types";

export type OperationalSearchFilters = {
  query: string;
  type: OperationalEntityType | "all";
  priority: OperationalPriority | "all";
  status: string | "all";
};

export const INITIAL_OPERATIONAL_SEARCH_FILTERS: OperationalSearchFilters = {
  query: "",
  type: "all",
  priority: "all",
  status: "all",
};

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function entityMatchesQuery(entity: OperationalEntity, query: string) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return true;
  }

  const searchableContent = [
    entity.id,
    entity.title,
    entity.description,
    entity.status,
    entity.reference,
    entity.locationLabel,
    entity.type,
    entity.priority ?? "normal",
  ]
    .map(normalizeSearchValue)
    .join(" ");

  return searchableContent.includes(normalizedQuery);
}

function entityMatchesType(
  entity: OperationalEntity,
  type: OperationalSearchFilters["type"],
) {
  return type === "all" || entity.type === type;
}

function entityMatchesPriority(
  entity: OperationalEntity,
  priority: OperationalSearchFilters["priority"],
) {
  const entityPriority = entity.priority ?? "normal";

  return priority === "all" || entityPriority === priority;
}

function entityMatchesStatus(
  entity: OperationalEntity,
  status: OperationalSearchFilters["status"],
) {
  return (
    status === "all" ||
    normalizeSearchValue(entity.status) === normalizeSearchValue(status)
  );
}

export function filterOperationalEntities(
  entities: OperationalEntity[],
  filters: OperationalSearchFilters,
) {
  return entities.filter((entity) => {
    return (
      entityMatchesQuery(entity, filters.query) &&
      entityMatchesType(entity, filters.type) &&
      entityMatchesPriority(entity, filters.priority) &&
      entityMatchesStatus(entity, filters.status)
    );
  });
}

export function getOperationalStatuses(entities: OperationalEntity[]) {
  return Array.from(
    new Set(
      entities
        .map((entity) => entity.status.trim())
        .filter((status) => status.length > 0),
    ),
  ).sort((firstStatus, secondStatus) =>
    firstStatus.localeCompare(secondStatus, "pt-BR"),
  );
}