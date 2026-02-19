import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BlockchainService, IBlockchainProvider } from '../../src/infra/BlockchainService'

describe('BlockchainService', () => {
  let mockProvider: IBlockchainProvider
  let service: BlockchainService

  beforeEach(() => {
    mockProvider = {
      getBlockNumber: vi.fn(),
      getBlock: vi.fn()
    }
    service = new BlockchainService(mockProvider)
  })

  describe('getLatestBlockNumber', () => {
    it('debería retornar el número de bloques actual', async () => {
      vi.mocked(mockProvider.getBlockNumber).mockResolvedValue(1000)

      const result = await service.getLatestBlockNumber()

      expect(result).toBe(1000)
    })

    it('debería decorar el error si falla la comunicación', async () => {
      vi.mocked(mockProvider.getBlockNumber).mockRejectedValue(new Error('Connection lost'))

      await expect(service.getLatestBlockNumber())
      .rejects
      .toThrow('[BlockchainService] Error al obtener block number: Connection lost')
    })
  })

  describe('getBlocksWithTransactions', () => {
    it('debería retornar el bloque con sus transacciones cuando existe', async () => {
      const mockBlock = {
        number: 500,
        prefetchedTransactions: [
          { to: '0x1', data: '0xabc', hash: '0xhash1' }
        ]
      }

      vi.mocked(mockProvider.getBlock).mockResolvedValue(mockBlock)
      
      const result = await service.getBlockWithTransactions(500)

      expect(result).toEqual(mockBlock)
      expect(mockProvider.getBlock).toHaveBeenCalledWith(500)
    })

    it('debería retornar null de forma segura si el bloque no existe', async () => {
      vi.mocked(mockProvider.getBlock).mockResolvedValue(null)

      const result = await service.getBlockWithTransactions(999999)

      expect(result).toBeNull()
    })

    it('debería decorrar el error si la consulta del bloque falla', async () => {
      vi.mocked(mockProvider.getBlock).mockRejectedValue(new Error('Internal Server Error'))

      await expect(service.getBlockWithTransactions(500))
      .rejects
      .toThrow('[BlockchainService] Error al obtener bloque 500: Internal Server Error')
    })
  })
})