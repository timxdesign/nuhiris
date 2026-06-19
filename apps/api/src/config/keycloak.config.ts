import { registerAs } from '@nestjs/config';

export default registerAs('keycloak', () => ({
  baseUrl: process.env.KEYCLOAK_BASE_URL ?? 'http://localhost:8080',
  realm: process.env.KEYCLOAK_REALM ?? 'nuhiris',
  clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'nuhiris-api',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? '',
  adminUser: process.env.KEYCLOAK_ADMIN_USER ?? 'admin',
  adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD ?? 'admin',
  jwksUrl: process.env.JWT_PUBLIC_KEY_URL ??
    'http://localhost:8080/realms/nuhiris/protocol/openid-connect/certs',
}));
