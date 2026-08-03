import { DEMO_OPERATIONAL_ENTITIES } from "./operational-map.data";

import type {
  OperationalEntity,
  OperationalEntityType,
  OperationalPriority,
} from "./operational-map.types";

export type OperationalEntityQuery = {
  query?: string;
  types?: OperationalEntityType[];
  priorities?: OperationalPriority[];
  statuses?: string[];
  createdFrom?: string;
  createdTo?: string;
};

export interface OperationalMapRepository {
  findAll(): Promise<OperationalEntity[]>;

  findById(id: string): Promise<OperationalEntity | null>;

  search(query: OperationalEntityQuery): Promise<OperationalEntity[]>;
}

function normalizeValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function matchesText(entity: OperationalEntity, query?: string) {
  const normalizedQuery = normalizeValue(query ?? "");

  if (!normalizedQuery) {
    return true;
  }

  const searchableValues = [
    entity.id,
    entity.title,
    entity.description,
    entity.reference,
    entity.status,
    entity.locationLabel,
    entity.type,
    entity.priority ?? "normal",
  ];

  const searchableText = searchableValues
    .map(normalizeValue)
    .join(" ");

  return searchableText.includes(normalizedQuery);
}

function matchesType(
  entity: OperationalEntity,
  types?: OperationalEntityType[],
) {
  return !types?.length || types.includes(entity.type);
}

function matchesPriority(
  entity: OperationalEntity,
  priorities?: OperationalPriority[],
) {
  const priority = entity.priority ?? "normal";

  return !priorities?.length || priorities.includes(priority);
}

function matchesStatus(
  entity: OperationalEntity,
  statuses?: string[],
) {
  if (!statuses?.length) {
    return true;
  }

  const normalizedStatus = normalizeValue(entity.status);

  return statuses.some(
    (status) => normalizeValue(status) === normalizedStatus,
  );
}

function matchesPeriod(
  entity: OperationalEntity,
  createdFrom?: string,
  createdTo?: string,
) {
  const entityTimestamp = new Date(entity.createdAt).getTime();

  if (Number.isNaN(entityTimestamp)) {
    return false;
  }

  if (createdFrom) {
    const initialTimestamp = new Date(createdFrom).getTime();

    if (
      !Number.isNaN(initialTimestamp) &&
      entityTimestamp < initialTimestamp
    ) {
      return false;
    }
  }

  if (createdTo) {
    const finalTimestamp = new Date(createdTo).getTime();

    if (
      !Number.isNaN(finalTimestamp) &&
      entityTimestamp > finalTimestamp
    ) {
      return false;
    }
  }

  return true;
}

class InMemoryOperationalMapRepository
  implements OperationalMapRepository
{
  private readonly entities: OperationalEntity[];

  constructor(entities: OperationalEntity[]) {
    this.entities = entities.map((entity) => ({
      ...entity,
      coordinates: [...entity.coordinates],
    }));
  }

  async findAll(): Promise<OperationalEntity[]> {
    return this.entities.map((entity) => ({
      ...entity,
      coordinates: [...entity.coordinates],
    }));
  }

  async findById(
    id: string,
  ): Promise<OperationalEntity | null> {
    const entity = this.entities.find(
      (currentEntity) => currentEntity.id === id,
    );

    if (!entity) {
      return null;
    }

    return {
      ...entity,
      coordinates: [...entity.coordinates],
    };
  }

  async search(
    query: OperationalEntityQuery,
  ): Promise<OperationalEntity[]> {
    return this.entities
      .filter(
        (entity) =>
          matchesText(entity, query.query) &&
          matchesType(entity, query.types) &&
          matchesPriority(entity, query.priorities) &&
          matchesStatus(entity, query.statuses) &&
          matchesPeriod(
            entity,
            query.createdFrom,
            query.createdTo,
          ),
      )
      .map((entity) => ({
        ...entity,
        coordinates: [...entity.coordinates],
      }));
  }
}

export const operationalMapRepository: OperationalMapRepository =
  new InMemoryOperationalMapRepository(
    DEMO_OPERATIONAL_ENTITIES,
  );