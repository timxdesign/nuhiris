import { Injectable } from '@nestjs/common';

interface MetricEntry {
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

@Injectable()
export class MetricsService {
  private counters = new Map<string, MetricEntry[]>();
  private histograms = new Map<string, MetricEntry[]>();
  private gauges = new Map<string, MetricEntry>();

  incrementCounter(name: string, labels: Record<string, string> = {}, value = 1): void {
    const key = this.labelKey(name, labels);
    const entries = this.counters.get(name) ?? [];
    const existing = entries.find((e) => this.labelKey(name, e.labels) === key);
    if (existing) {
      existing.value += value;
    } else {
      entries.push({ value, labels, timestamp: Date.now() });
      this.counters.set(name, entries);
    }
  }

  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const entries = this.histograms.get(name) ?? [];
    entries.push({ value, labels, timestamp: Date.now() });
    this.histograms.set(name, entries);
  }

  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.labelKey(name, labels);
    this.gauges.set(key, { value, labels, timestamp: Date.now() });
  }

  getPrometheusOutput(): string {
    const lines: string[] = [];

    for (const [name, entries] of this.counters) {
      lines.push(`# TYPE ${name} counter`);
      for (const e of entries) {
        lines.push(`${name}${this.formatLabels(e.labels)} ${e.value}`);
      }
    }

    for (const [name, entries] of this.histograms) {
      const grouped = new Map<string, number[]>();
      for (const e of entries) {
        const key = this.labelKey(name, e.labels);
        const vals = grouped.get(key) ?? [];
        vals.push(e.value);
        grouped.set(key, vals);
      }
      lines.push(`# TYPE ${name} summary`);
      for (const [, vals] of grouped) {
        const sum = vals.reduce((a, b) => a + b, 0);
        const count = vals.length;
        lines.push(`${name}_sum ${sum}`);
        lines.push(`${name}_count ${count}`);
      }
    }

    for (const [key, entry] of this.gauges) {
      const name = key.split('{')[0] ?? key;
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name}${this.formatLabels(entry.labels)} ${entry.value}`);
    }

    return lines.join('\n');
  }

  private labelKey(name: string, labels: Record<string, string>): string {
    const sorted = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
    return `${name}{${sorted.map(([k, v]) => `${k}="${v}"`).join(',')}}`;
  }

  private formatLabels(labels: Record<string, string>): string {
    const entries = Object.entries(labels);
    if (entries.length === 0) return '';
    return `{${entries.map(([k, v]) => `${k}="${v}"`).join(',')}}`;
  }
}
