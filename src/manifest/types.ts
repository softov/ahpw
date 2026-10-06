import type { JsonSchemaField } from '@softov/scena/ui';

/**
 * The command surface a daemon publishes at `/api/cli-manifest`.
 *
 * The shape `@cofold/remote` serves, declared here rather than imported because
 * that package is written for Node and this runs in a browser.
 */
export interface ProgramManifest {
  cofold: number;
  program: { name: string; version: string; description?: string };
  groups?: readonly ManifestGroup[];
  commands: readonly ManifestCommand[];
}

/** A named group of commands, when the program declares any. */
export interface ManifestGroup {
  name: string;
  title?: string;
  /** What the activity bar shows for it, when the program names one. */
  icon?: string;
}

/** One command, as the terminal and the API both know it. */
export interface ManifestCommand {
  id: string;
  /** Literal words and `:slot` arguments: `:x?` optional, `:x...` one or more, `:x?...` any. */
  pattern: readonly string[];
  summary: string;
  description?: string;
  group?: string;
  arguments?: Record<string, { schema: JsonSchemaField; description?: string }>;
  options?: readonly ManifestOption[];
  http: HttpBinding;
}

/** One `--flag` of a command. */
export interface ManifestOption {
  name: string;
  short?: string;
  value?: string;
  description: string;
  schema: JsonSchemaField;
  repeatable?: boolean;
  required?: boolean;
  env?: string;
  /** The name the request carries it under. */
  field?: string;
}

/** Where a command is served. */
export interface HttpBinding {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  contentType?: 'application/json' | 'application/x-www-form-urlencoded';
  /** `/user/add/{id}`: each `{name}` is filled from the input. */
  path: string;
  /** Fields sent as the query string, when the command overrides the default. */
  query?: readonly string[];
  /** Fields sent in the body; `"*"` is everything the path and query left. */
  body?: readonly string[];
}
