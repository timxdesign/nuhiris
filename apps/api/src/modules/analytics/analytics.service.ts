import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patient/entities/patient.entity';
import { Encounter } from '../encounter/entities/encounter.entity';

interface DailyStat {
  date: string;
  count: number;
}

interface RegistrationBreakdown {
  total: number;
  provisional: number;
  biometricVerified: number;
  upgradeRate: number;
  byState: { state: string; count: number }[];
  dailyTrend: DailyStat[];
}

interface EncounterBreakdown {
  total: number;
  open: number;
  closed: number;
  byType: { type: string; count: number }[];
  dailyTrend: DailyStat[];
}

export interface AnalyticsSummary {
  registrations: RegistrationBreakdown;
  encounters: EncounterBreakdown;
  generatedAt: string;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Patient) private patientRepo: Repository<Patient>,
    @InjectRepository(Encounter) private encounterRepo: Repository<Encounter>,
  ) {}

  async getSummary(days = 30): Promise<AnalyticsSummary> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [registrations, encounters] = await Promise.all([
      this.getRegistrationStats(since),
      this.getEncounterStats(since),
    ]);

    return {
      registrations,
      encounters,
      generatedAt: new Date().toISOString(),
    };
  }

  private async getRegistrationStats(since: Date): Promise<RegistrationBreakdown> {
    const total = await this.patientRepo.count();

    const provisional = await this.patientRepo.count({
      where: { registrationType: 'provisional' as never },
    });

    const biometricVerified = await this.patientRepo.count({
      where: { registrationType: 'biometric_verified' as never },
    });

    const upgradeRate = total > 0 ? (biometricVerified / total) * 100 : 0;

    const byState = await this.patientRepo
      .createQueryBuilder('p')
      .select('p.state', 'state')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.state')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany<{ state: string; count: string }>();

    const dailyTrend = await this.patientRepo
      .createQueryBuilder('p')
      .select("DATE(p.created_at)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('p.created_at >= :since', { since })
      .groupBy("DATE(p.created_at)")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    return {
      total,
      provisional,
      biometricVerified,
      upgradeRate: Math.round(upgradeRate * 10) / 10,
      byState: byState.map((r) => ({ state: r.state, count: parseInt(r.count, 10) })),
      dailyTrend: dailyTrend.map((r) => ({ date: r.date, count: parseInt(r.count, 10) })),
    };
  }

  private async getEncounterStats(since: Date): Promise<EncounterBreakdown> {
    const total = await this.encounterRepo.count();
    const open = await this.encounterRepo.count({ where: { status: 'open' as never } });
    const closed = await this.encounterRepo.count({ where: { status: 'closed' as never } });

    const byType = await this.encounterRepo
      .createQueryBuilder('e')
      .select('e.encounter_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('e.encounter_type')
      .orderBy('count', 'DESC')
      .getRawMany<{ type: string; count: string }>();

    const dailyTrend = await this.encounterRepo
      .createQueryBuilder('e')
      .select("DATE(e.date_time)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('e.date_time >= :since', { since })
      .groupBy("DATE(e.date_time)")
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();

    return {
      total,
      open,
      closed,
      byType: byType.map((r) => ({ type: r.type, count: parseInt(r.count, 10) })),
      dailyTrend: dailyTrend.map((r) => ({ date: r.date, count: parseInt(r.count, 10) })),
    };
  }
}
