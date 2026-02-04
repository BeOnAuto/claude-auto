#!/usr/bin/env node

import { createCli } from '../src/cli/cli.js';

const program = createCli();
program.parse();
