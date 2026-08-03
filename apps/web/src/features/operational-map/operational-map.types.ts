export type OperationalEntityType =
  | "occurrence"
  | "person"
  | "vehicle"
  | "alert";

export type OperationalCoordinates = [longitude: number, latitude: number];

export type OperationalEntity = {
  id: string;
  type: OperationalEntityType;
  title: string;
  description: string;
  coordinates: OperationalCoordinates;
  createdAt: string;
  priority?: "normal" | "medium" | "high";
};

export type OperationalLayerVisibility = Record<
  OperationalEntityType,
  boolean
>;

export type OperationalEntityConfiguration = {
  label: string;
  singularLabel: string;
  color: string;
};