export interface ISequencerContract {
  numJobs(): Promise<bigint>;
  jobAt(index: number | bigint): Promise<string>;
}

export class SequencerRepository {
  
  constructor(private readonly sequencer: ISequencerContract) {}

  async getActiveJobs(): Promise<string[]> {
    try {
      const totalJobsBigInt = await this.sequencer.numJobs()
      const totalJobs = Number(totalJobsBigInt)
      const jobPromises: Promise<string>[] = []

      if (!Number.isSafeInteger(totalJobs)) {
        throw new Error(`[SequencerRepository] numJobs (${totalJobsBigInt}) excede el límite seguro de JavaScript`)
      }

      for (let i = 0; i < totalJobs; i++) {
        jobPromises.push(this.sequencer.jobAt(i))
      }

      const jobAddresses = await Promise.all(jobPromises)
      
      return jobAddresses.map(address => address.toLowerCase())
    } catch (error) {
      throw new Error(`[SequencerRepository] Falló la carga de jobs: ${error instanceof Error ? error.message : error}`)
    }
  }
}