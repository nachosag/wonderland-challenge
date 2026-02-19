import { WorkDetector } from '../core/WorkDetector';
import { IBlockchainProvider } from '../infra/BlockchainService';
import { ISequencerContract } from '../infra/SequencerRepository';

export interface INotifier {
  notify(jobAddress: string, transactionHash: string): Promise<void>;
}

export class JobMonitor {
  private lastProcessedBlock: number = 0;

  constructor(
    private readonly blockchainService: IBlockchainProvider, // Interface, no clase
    private readonly sequencerRepo: ISequencerContract,      // Interface, no clase
    private readonly workDetector: typeof WorkDetector,
    private readonly notifiers: INotifier[],
    private readonly workSelector: string
  ) { }

  /**
   * Sincroniza el estado inicial y arranca el bucle infinito.
   */
  async start(): Promise<void> {
    if (this.lastProcessedBlock === 0) {
      this.lastProcessedBlock = await this.blockchainService.getBlockNumber();
    }

    while (true) {
      await this.tick();
      await new Promise(resolve => setTimeout(resolve, 12000));
    }
  }

  /**
   * Escanea bloques históricos hacia atrás.
   */
  async scanPastBlocks(blocksBack: number): Promise<void> {
    const currentBlock = await this.blockchainService.getBlockNumber();
    const startBlock = currentBlock - blocksBack;
    const activeJobs = new Set(await this.getActiveJobsFromRepo());

    await this.processBlockRange(startBlock, currentBlock, activeJobs);
    this.lastProcessedBlock = currentBlock;
  }

  /**
   * Unidad de trabajo para el monitoreo en tiempo real.
   */
  async tick(): Promise<void> {
    try {
      const currentBlock = await this.blockchainService.getBlockNumber();

      if (currentBlock > this.lastProcessedBlock) {
        const activeJobs = new Set(await this.getActiveJobsFromRepo());
        await this.processBlockRange(this.lastProcessedBlock + 1, currentBlock, activeJobs);
        this.lastProcessedBlock = currentBlock;
      }
    } catch (error) {
      throw new Error(`[JobMonitor] Error en el ciclo: ${error instanceof Error ? error.message : error}`);
    }
  }

  private async processBlockRange(start: number, end: number, jobs: Set<string>): Promise<void> {
    for (let i = start; i <= end; i++) {
      const block = await this.blockchainService.getBlock(i);
      if (!block) continue;

      for (const tx of block.prefetchedTransactions) {
        const result = this.workDetector.detect(tx, jobs, this.workSelector);
        if (result.isMatch && result.jobAddress) {
          await Promise.all(this.notifiers.map(n => n.notify(result.jobAddress!, tx.hash)));
        }
      }
    }
  }

  private async getActiveJobsFromRepo(): Promise<string[]> {
    const totalJobs = Number(await this.sequencerRepo.numJobs());
    const promises: Promise<string>[] = [];
    for (let i = 0; i < totalJobs; i++) {
      promises.push(this.sequencerRepo.jobAt(i));
    }
    const addresses = await Promise.all(promises);
    return addresses.map(a => a.toLowerCase());
  }
}