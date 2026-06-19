import { HealthController } from '../health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('returns ok for /health/live', () => {
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('returns ok for /health/ready', () => {
    expect(controller.ready()).toEqual({ status: 'ok' });
  });

  it('returns ok for /health/startup', () => {
    expect(controller.startup()).toEqual({ status: 'ok' });
  });
});
