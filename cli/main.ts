#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRegistry } from '@cofold/commands';
import { configGlobal } from '@cofold/config';
import { Program, runEntry } from '@cofold/terminal';
import { declareServe } from './serve.js';

/** The built page, beside this file in the package. */
const APP = fileURLToPath(new URL('../app/', import.meta.url));

const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string };

const registry = createRegistry();
declareServe(registry, APP);

const program = new Program({
  name: 'ahpw',
  version,
  description: 'A web UI for an AHP server',
  registry,
  globals: [configGlobal],
});

await runEntry(program, process.argv.slice(2));
