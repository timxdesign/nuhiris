import { MetricsService } from '../metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  describe('incrementCounter', () => {
    it('creates and increments a counter', () => {
      service.incrementCounter('http_requests_total', { method: 'GET', status: '200' });
      service.incrementCounter('http_requests_total', { method: 'GET', status: '200' });

      const output = service.getPrometheusOutput();
      expect(output).toContain('http_requests_total{method="GET",status="200"} 2');
    });

    it('tracks different label combinations separately', () => {
      service.incrementCounter('http_requests_total', { status: '200' });
      service.incrementCounter('http_requests_total', { status: '500' });

      const output = service.getPrometheusOutput();
      expect(output).toContain('status="200"} 1');
      expect(output).toContain('status="500"} 1');
    });
  });

  describe('observeHistogram', () => {
    it('records histogram observations', () => {
      service.observeHistogram('request_duration', 0.5);
      service.observeHistogram('request_duration', 1.5);

      const output = service.getPrometheusOutput();
      expect(output).toContain('request_duration_sum 2');
      expect(output).toContain('request_duration_count 2');
    });
  });

  describe('setGauge', () => {
    it('sets a gauge value', () => {
      service.setGauge('active_connections', 42);
      const output = service.getPrometheusOutput();
      expect(output).toContain('active_connections 42');
    });

    it('overwrites previous gauge value', () => {
      service.setGauge('active_connections', 42);
      service.setGauge('active_connections', 10);
      const output = service.getPrometheusOutput();
      expect(output).toContain('10');
      expect(output).not.toContain('42');
    });
  });

  describe('getPrometheusOutput', () => {
    it('returns empty string when no metrics', () => {
      expect(service.getPrometheusOutput()).toBe('');
    });

    it('includes TYPE annotations', () => {
      service.incrementCounter('test_counter');
      const output = service.getPrometheusOutput();
      expect(output).toContain('# TYPE test_counter counter');
    });
  });
});
