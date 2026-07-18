import { registerAs } from '@nestjs/config';

export default registerAs('vault', () => ({
  enabled: process.env.VAULT_ENABLED === 'true',
  address: process.env.VAULT_ADDR ?? 'http://127.0.0.1:8200',
  token: process.env.VAULT_TOKEN ?? '',
  roleId: process.env.VAULT_ROLE_ID ?? '',
  secretId: process.env.VAULT_SECRET_ID ?? '',
  mountPath: process.env.VAULT_MOUNT_PATH ?? 'secret',
  secretPath: process.env.VAULT_SECRET_PATH ?? 'nuhiris',
  transitKeyName: process.env.VAULT_TRANSIT_KEY ?? 'nuhiris-column-key',
  authMethod: (process.env.VAULT_AUTH_METHOD ?? 'token') as 'token' | 'approle',
  renewalIntervalMs: parseInt(process.env.VAULT_RENEWAL_INTERVAL_MS ?? '300000', 10),
}));
