import { config } from 'dotenv';
import { getEnvPath } from '../common/helper/env.helper';

// Load the env file at import time so JWT_SECRET is available before the
// feature modules register JwtModule (they read jwtConstants.secret during
// their own import). Mirrors app.module.ts path logic:
//   prod -> dist/common/envs   dev -> src/common/envs
// dotenv does not override vars already present in the real environment.
config({ path: getEnvPath(`${__dirname}/../common/envs`) });

if (!process.env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is not set. Add it to the env file (src/common/envs/.env and development.env).',
  );
}

export const jwtConstants = {
  secret: process.env.JWT_SECRET,
};
