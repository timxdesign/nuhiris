import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { OAuthClientService } from '../oauth-client.service';
import { OAuthClient } from '../entities/oauth-client.entity';

const mockClient: OAuthClient = {
  clientId: 'client-1',
  clientName: 'Test App',
  clientSecretHash: 'hash',
  organizationName: 'Test Org',
  contactEmail: 'test@example.com',
  scopes: ['fhir.read'],
  redirectUris: [],
  grantTypes: ['client_credentials'],
  status: 'active',
  rateLimit: 1000,
  registeredBy: 'admin-1',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('OAuthClientService', () => {
  let service: OAuthClientService;
  let repo: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([mockClient]),
      create: jest.fn().mockImplementation((d) => d),
      save: jest.fn().mockImplementation((d) => Promise.resolve({ ...mockClient, ...d })),
    };

    const module = await Test.createTestingModule({
      providers: [
        OAuthClientService,
        { provide: getRepositoryToken(OAuthClient), useValue: repo },
      ],
    }).compile();

    service = module.get(OAuthClientService);
  });

  describe('register', () => {
    it('registers a new client and returns secret', async () => {
      repo.findOne.mockResolvedValue(null);
      const { client, clientSecret } = await service.register({
        clientName: 'New App',
        organizationName: 'Org',
        contactEmail: 'a@b.com',
        scopes: ['fhir.read'],
      }, 'admin-1');

      expect(clientSecret).toBeDefined();
      expect(clientSecret.length).toBe(64);
      expect(repo.save).toHaveBeenCalled();
    });

    it('throws ConflictException for duplicate name', async () => {
      repo.findOne.mockResolvedValue(mockClient);
      await expect(
        service.register({
          clientName: 'Test App',
          organizationName: 'Org',
          contactEmail: 'a@b.com',
          scopes: [],
        }, 'admin-1'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findById', () => {
    it('returns client when found', async () => {
      repo.findOne.mockResolvedValue(mockClient);
      const result = await service.findById('client-1');
      expect(result.clientName).toBe('Test App');
    });

    it('throws NotFoundException', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateCredentials', () => {
    it('returns null for wrong secret', async () => {
      repo.findOne.mockResolvedValue(mockClient);
      const result = await service.validateCredentials('client-1', 'wrong');
      expect(result).toBeNull();
    });

    it('returns null for inactive client', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.validateCredentials('client-1', 'any');
      expect(result).toBeNull();
    });
  });

  describe('deactivate', () => {
    it('sets status to revoked', async () => {
      repo.findOne.mockResolvedValue({ ...mockClient });
      repo.save.mockImplementation((c) => Promise.resolve(c));
      const result = await service.deactivate('client-1');
      expect(result.status).toBe('revoked');
    });
  });

  describe('rotateSecret', () => {
    it('returns new secret', async () => {
      repo.findOne.mockResolvedValue({ ...mockClient });
      const { clientSecret } = await service.rotateSecret('client-1');
      expect(clientSecret.length).toBe(64);
    });
  });
});
