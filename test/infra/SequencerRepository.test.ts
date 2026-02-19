import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SequencerRepository } from '../../src/infra/SequencerRepository'
import { ISequencerContract } from '../../src/infra/SequencerRepository'

const SequencerContractMock: ISequencerContract = {
  numJobs: async () => 3n,
  jobAt: async (index: number | bigint) => {
    const jobs = [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333'
    ]

    const i = Number(index)

    if (i >= jobs.length) throw new Error("Index out of bounds")

    return jobs[i]
  }
}

describe('SequencerRepository', () => {
  let mockContract: ISequencerContract
  let repository: SequencerRepository

  beforeEach(() => {
    mockContract = {
      numJobs: vi.fn(),
      jobAt: vi.fn()
    }
    repository = new SequencerRepository(mockContract)
  })

  it('debería retornar una lista vacía si numJobs es 0', async () => {
    vi.mocked(mockContract.numJobs).mockResolvedValue(0n)

    const jobs = await repository.getActiveJobs()

    expect(jobs).toEqual([])
    expect(mockContract.jobAt).not.toHaveBeenCalled()
  })

  it('debería retornar todas las direcciones en minúsculas', async () => {
    vi.mocked(mockContract.numJobs).mockResolvedValue(2n)
    vi.mocked(mockContract.jobAt)
      .mockResolvedValueOnce('0xABC123')
      .mockResolvedValueOnce('0xDEF456')

    const jobs = await repository.getActiveJobs()

    expect(jobs).toEqual(['0xabc123', '0xdef456'])
    expect(mockContract.jobAt).toHaveBeenCalledTimes(2)
  })

  it('debería lanzar un error descriptivo si numJobs falla', async () => {
    vi.mocked(mockContract.numJobs).mockRejectedValue(new Error('RPC Timeout'))

    await expect(repository.getActiveJobs()).rejects.toThrow(`[SequencerRepository] Falló la carga de jobs: RPC Timeout`)
  })

  it('debería lanzar un error si una de las llamadas a jobAt falla', async () => {
    vi.mocked(mockContract.numJobs).mockResolvedValue(2n)
    vi.mocked(mockContract.jobAt)
    .mockResolvedValueOnce('0xABC123')
    .mockRejectedValueOnce(new Error('Invalid index'))

    await expect(repository.getActiveJobs()).rejects.toThrow('[SequencerRepository] Falló la carga de jobs: Invalid index')
  })

  it('debería manejar correctamente valores de BigInt seguros para Number', async () => {
    vi.mocked(mockContract.numJobs).mockResolvedValue(100n)
    vi.mocked(mockContract.jobAt).mockResolvedValue('0xADDRESS')

    const jobs = await repository.getActiveJobs()

    expect(jobs.length).toBe(100)
    expect(mockContract.jobAt).toHaveBeenCalledWith(99)
  })
})