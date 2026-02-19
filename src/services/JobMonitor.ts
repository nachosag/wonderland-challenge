import { WorkDetector } from "../core/WorkDetector";
import { BlockchainService, IBlockWithTransactions } from "../infra/BlockchainService";
import { SequencerRepository } from "../infra/SequencerRepository";

export interface INotifier {
  notify(jobAddress: string, transactionHash: string): Promise<void>
}

export class JobMonitor {
  private lastProcessedBlock = 0

  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly sequencerRepo: SequencerRepository,
    private readonly workDetector: typeof WorkDetector,
    private readonly notifiers: INotifier[],
    private readonly workSelector: string
  ) { }

  async scanPastBlocks(blocksBack: number): Promise<void> {
    const currentBlock = await this.blockchainService.getLatestBlockNumber()
    const startBlock = currentBlock - blocksBack
    const activeJobs = new Set(await this.sequencerRepo.getActiveJobs())

    await this.processBlockRange(startBlock, currentBlock, activeJobs)

    this.lastProcessedBlock = currentBlock
  }

  private async processBlockRange(start: number, end: number, jobs: Set<string>): Promise<void> {
    const CHUNK_SIZE = 10

    for (let i = start; i <= end; i += CHUNK_SIZE) {
      const chunkPromises: Array<Promise<IBlockWithTransactions | null>> = []
      const endOfChunk = Math.min(i + CHUNK_SIZE - 1, end)

      for (let blockNumber = i; blockNumber <= endOfChunk; blockNumber++) {
        chunkPromises.push(this.blockchainService.getBlockWithTransactions(blockNumber))
      }

      const blocks: Array<IBlockWithTransactions | null> = await Promise.all(chunkPromises)

      for (const block of blocks) {
        if (!block) continue

        for (const tx of block.prefetchedTransactions) {
          const result = this.workDetector.detect(
            tx,
            jobs,
            this.workSelector
          )

          if (!result.isMatch || !result.jobAddress) continue

          for (const notifier of this.notifiers) {
            notifier.notify(result.jobAddress, tx.hash)
          }
        }
      }
    }
  }

  async tick(): Promise<void> {
    try {
      const currentBlock = await this.blockchainService.getLatestBlockNumber()
      const activeJobs = new Set(await this.sequencerRepo.getActiveJobs())

      if (currentBlock > this.lastProcessedBlock) {
        await this.processBlockRange(this.lastProcessedBlock + 1, currentBlock, activeJobs)

        this.lastProcessedBlock = currentBlock
      }
    } catch (error) {
      throw new Error(`[JobMonitor] Error durante el ciclo (tick): ${error instanceof Error ? error.message : error}`)
    }
  }

  async start(): Promise<void> {
    if (this.lastProcessedBlock === 0) {
      this.lastProcessedBlock = await this.blockchainService.getLatestBlockNumber()
    }

    while (true) {
      await this.tick()
      await new Promise(resolve => setTimeout(resolve, 12000))
    }
  }
}