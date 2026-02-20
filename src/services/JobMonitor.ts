import { IWorkDetector } from '../core/WorkDetector';
import { IBlockchainProvider } from '../infra/BlockchainService';
import { ISequencerContract } from '../infra/SequencerRepository';

export interface INotifier {
  notify(jobAddress: string, transactionHash: string): Promise<void>;
}

export class JobMonitor {
  private lastProcessedBlock: number = 0;

  constructor(
    private readonly blockchainService: IBlockchainProvider,
    private readonly sequencerRepo: ISequencerContract,
    private readonly workDetector: IWorkDetector,
    private readonly notifiers: INotifier[],
    private readonly workSelector: string
  ) { }

  /**
   * Escanea una cantidad determinada de bloques hacia atrás desde el bloque actual.
   * Utilizado principalmente al arranque del proceso.
   */
  async scanPastBlocks(blocksBack: number): Promise<void> {
    const currentBlock = await this.blockchainService.getBlockNumber();
    const startBlock = Math.max(0, currentBlock - blocksBack);

    const activeJobs = await this.getActiveJobsWhitelist();

    await this.processBlockRange(startBlock, currentBlock, activeJobs);

    // Sincronizamos el puntero para evitar que tick() vuelva a procesar lo mismo
    this.lastProcessedBlock = currentBlock;
  }

  /**
   * Ejecuta una unidad de trabajo de monitoreo. 
   * Identifica si hay nuevos bloques y coordina su procesamiento.
   */
  async tick(): Promise<void> {
    try {
      const currentBlock = await this.blockchainService.getBlockNumber();

      if (currentBlock > this.lastProcessedBlock) {
        // En cada tick obtenemos la lista actualizada de jobs del Sequencer
        const activeJobs = await this.getActiveJobsWhitelist();

        const start = this.lastProcessedBlock + 1;
        await this.processBlockRange(start, currentBlock, activeJobs);

        this.lastProcessedBlock = currentBlock;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`[JobMonitor] Error en el ciclo: ${message}`);
    }
  }

  /**
   * Itera sobre un rango de bloques y delega la detección de transacciones.
   */
  private async processBlockRange(start: number, end: number, jobs: Set<string>): Promise<void> {
    for (let i = start; i <= end; i++) {
      const block = await this.blockchainService.getBlock(i);
      if (!block) continue;

      const detectionPromises = block.prefetchedTransactions.map(async (tx) => {
        const result = this.workDetector.detect(tx, jobs, this.workSelector);

        if (result.isMatch && result.jobAddress) {
          await Promise.all(this.notifiers.map(n => n.notify(result.jobAddress!, tx.hash)));
        }
      });

      await Promise.all(detectionPromises);
    }
  }

  /**
   * Obtiene y normaliza los jobs activos desde el repositorio.
   */
  private async getActiveJobsWhitelist(): Promise<Set<string>> {
    const totalJobs = Number(await this.sequencerRepo.numJobs());

    const jobPromises: Promise<string>[] = [];
    for (let i = 0; i < totalJobs; i++) {
      jobPromises.push(this.sequencerRepo.jobAt(i));
    }

    const jobAddresses = await Promise.all(jobPromises);

    return new Set(jobAddresses.map(addr => addr.toLowerCase()));
  }
}