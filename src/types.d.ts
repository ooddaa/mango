// export interface Node {
//   labels: string[];
//   properties: {
//     _hash: string;
//     [key: string]: string | boolean | (string[] | number[] | boolean[]);
//   };
//   identity: { low: number; high: number };
// };

export interface nodeObj {
  labels: string[],
  properties: { required: Object, optional: Object, _private: Object },
  identity: any; /**@todo tighten - Node.js toNodeObj() identity: node.identity || null - what's node.identity? */
};

export type Integer = { low: number, high: number };
