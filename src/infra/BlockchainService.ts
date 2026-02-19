export interface IBlockTransaction {
  readonly to: string | null;
  readonly data: string;
  readonly hash: string;
}

export interface IBlockWithTransactions {
  readonly number: number;
  readonly prefetchedTransactions: IBlockTransaction[];
}

export interface IBlockchainProvider {
  getBlockNumber(): Promise<number>;
  getBlock(blockNumber: number): Promise<IBlockWithTransactions | null>;
}

export class BlockchainService {
  
  constructor(private readonly provider: IBlockchainProvider) {}

  async getLatestBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber()
    } catch (error) {
      throw new Error(`[BlockchainService] Error al obtener block number: ${error instanceof Error ? error.message : error}`)
    }
  }

  async getBlockWithTransactions(blockNumber: number): Promise<IBlockWithTransactions | null> {
    try {
      return await this.provider.getBlock(blockNumber)
    } catch (error) {
      throw new Error(`[BlockchainService] Error al obtener bloque ${blockNumber}: ${error instanceof Error ? error.message : error}`)
    }
  }
}