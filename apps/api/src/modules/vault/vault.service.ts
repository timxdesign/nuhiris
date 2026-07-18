import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface VaultSecrets {
  encryptionKey: string;
  hmacKey: string;
  dbPassword: string;
  redisPassword: string;
  keycloakClientSecret: string;
  minioSecretKey: string;
  [key: string]: string;
}

@Injectable()
export class VaultService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VaultService.name);
  private secrets: VaultSecrets | null = null;
  private renewalTimer: ReturnType<typeof setInterval> | null = null;
  private readonly enabled: boolean;
  private readonly address: string;
  private readonly mountPath: string;
  private readonly secretPath: string;
  private readonly authMethod: 'token' | 'approle';
  private token: string;
  private readonly roleId: string;
  private readonly secretId: string;
  private readonly renewalIntervalMs: number;

  constructor(private config: ConfigService) {
    this.enabled = this.config.get<boolean>('vault.enabled', false);
    this.address = this.config.get<string>('vault.address', 'http://127.0.0.1:8200');
    this.mountPath = this.config.get<string>('vault.mountPath', 'secret');
    this.secretPath = this.config.get<string>('vault.secretPath', 'nuhiris');
    this.authMethod = this.config.get<'token' | 'approle'>('vault.authMethod', 'token');
    this.token = this.config.get<string>('vault.token', '');
    this.roleId = this.config.get<string>('vault.roleId', '');
    this.secretId = this.config.get<string>('vault.secretId', '');
    this.renewalIntervalMs = this.config.get<number>('vault.renewalIntervalMs', 300000);
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.log('Vault disabled — using environment variables for secrets');
      return;
    }

    try {
      if (this.authMethod === 'approle') {
        await this.authenticateAppRole();
      }
      await this.loadSecrets();
      this.renewalTimer = setInterval(() => {
        this.renewToken().catch((err) =>
          this.logger.error('Vault token renewal failed', err),
        );
      }, this.renewalIntervalMs);
      this.logger.log('Vault secrets loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load Vault secrets — falling back to env vars', error);
    }
  }

  onModuleDestroy(): void {
    if (this.renewalTimer) {
      clearInterval(this.renewalTimer);
    }
  }

  getSecret(key: keyof VaultSecrets): string {
    if (this.secrets && this.secrets[key]) {
      return this.secrets[key];
    }

    const envMap: Record<string, string> = {
      encryptionKey: 'ENCRYPTION_KEY',
      hmacKey: 'HMAC_KEY',
      dbPassword: 'DB_PASSWORD',
      redisPassword: 'REDIS_PASSWORD',
      keycloakClientSecret: 'KEYCLOAK_CLIENT_SECRET',
      minioSecretKey: 'MINIO_SECRET_KEY',
    };

    const envKey: string = envMap[key] ?? String(key);
    return this.config.get<string>(envKey) ?? '';
  }

  getEncryptionKey(): string {
    return this.getSecret('encryptionKey');
  }

  getHmacKey(): string {
    return this.getSecret('hmacKey');
  }

  private async authenticateAppRole(): Promise<void> {
    const res = await fetch(`${this.address}/v1/auth/approle/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: this.roleId, secret_id: this.secretId }),
    });

    if (!res.ok) {
      throw new Error(`Vault AppRole auth failed: ${res.status}`);
    }

    const data = (await res.json()) as { auth: { client_token: string } };
    this.token = data.auth.client_token;
  }

  private async loadSecrets(): Promise<void> {
    const res = await fetch(
      `${this.address}/v1/${this.mountPath}/data/${this.secretPath}`,
      { headers: { 'X-Vault-Token': this.token } },
    );

    if (!res.ok) {
      throw new Error(`Vault read failed: ${res.status}`);
    }

    const data = (await res.json()) as { data: { data: VaultSecrets } };
    this.secrets = data.data.data;
  }

  private async renewToken(): Promise<void> {
    const res = await fetch(`${this.address}/v1/auth/token/renew-self`, {
      method: 'POST',
      headers: { 'X-Vault-Token': this.token },
    });

    if (!res.ok) {
      this.logger.warn(`Vault token renewal returned ${res.status}`);
      if (this.authMethod === 'approle') {
        await this.authenticateAppRole();
        await this.loadSecrets();
      }
    }
  }
}
