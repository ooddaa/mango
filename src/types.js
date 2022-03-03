/* @flow */
/**
 * Defines all types used in application in one place.
 * https://flow.org/en/docs/types/utilities/
 */
import { Success, Failure, Relationship, EnhancedNode } from ".";

export type Integer = { low: number, high: number };
declare type monthName =
  | "Jan"
  | "Feb"
  | "Mar"
  | "Apr"
  | "May"
  | "Jun"
  | "Jul"
  | "Aug"
  | "Sep"
  | "Oct"
  | "Nov"
  | "Dec";
declare type monthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
declare type weekDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type timeArray = [
  Integer | number,
  Integer | number,
  Integer | number,
  ?Integer | ?number,
  ?timestamp
]; // timeArray = [year, month, date, day_of_week, utc_timestamp]
export type dateObject = {
  year: [number, ?number], // if both numbers present, years are treated as inclusive range. [2014, 2016] == 2014, 2015, 2016
  month: ?[monthNumber, ?monthNumber], // if months are present, same as above, each year
};
export type timestamp = Integer | number;
export type properties = Object;
export type identity = number | string | null;

export type partialNodeObj = { labels: string[], properties: Object };
export type nodeObj = {
  labels: string[],
  properties: { required: Object, optional: Object },
};
export type transactionObj = {
  labels: ["Transaction"],
  properties: { required: Object, optional: Object },
};
export type HtransactionObj = {
  labels: ["HTransaction"],
  properties: { required: Object, optional: Object },
};
export type enhancedNodeObj = {
  labels: string[],
  properties: { required: Object, optional: Object },
  relationships: {
    inbound: Relationship[] | [],
    outbound: Relationship[] | [],
  },
};
export type relationshipObj = {
  labels: string[],
  startNode: Node,
  endNode: Node,
  properties?: Object,
  identity?: number | string | null,
};
export type relationshipsTemplate = {
  inbound: relationshipObj[],
  outbound: relationshipObj[],
};
export type Result = Success | Failure;

export type UpdatingPair = {
  updatee: Node | EnhancedNode,
  updater: Node | EnhancedNode,
};
export type UpdatedPair = { updatee: EnhancedNode, updater: EnhancedNode };

export type descriptionObj = {
  CATEGORY: String,
  SUBCATEGORY: String,
  DESCRIPTION: String,
};

const beneficiary_types = [
  "Entity",
  "ENTITY",
  "Person",
  "PERSON",
  "Company",
  "COMPANY",
  "LegalPerson",
  "LEGAL_PERSON",
  "NaturalPerson",
  "NATURAL_PERSON",
];
export { beneficiary_types };

export type SimplifiedRelationshipArray = [
  string[], // labels
  "required" | "optional", // necessity?
  Object, // properties?
  "outbound" | ">" | "inbound" | "<"
];

export type SimplifiedRelationshipObject = {
  labels: string[],
  properties?: Object,
  necessity?: "required" | "optional",
  direction?: "outbound" | ">" | "inbound" | "<",
  partnerNode?: SimplifiedEnhancedNodeObject | Node | EnhancedNode, // Node/EnhancedNodeCandidates??// startNode?: SimplifiedEnhancedNodeObject | Node | EnhancedNode, // Node/EnhancedNodeCandidates??
};

export type SimplifiedEnhancedNodeObject = {
  labels: string[],
  properties: Object,
  relationships: SimplifiedRelationshipObject[],
};
