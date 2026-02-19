import { describe, it, expect, vi, beforeEach, type Mocked } from 'vitest';
import { JobMonitor, INotifier } from '../../src/services/JobMonitor';
import { IBlockchainProvider } from '../../src/infra/BlockchainService';
import { ISequencerContract } from '../../src/infra/SequencerRepository';
import { WorkDetector } from '../../src/core/WorkDetector';

describe('JobMonitor - tick()', () => {
  let monitor: JobMonitor;
  let mockBlockchain: Mocked<IBlockchainProvider>;
  let mockRepo: Mocked<ISequencerContract>;
  let mockNotifiers: Mocked<INotifier>[];
  const WORK_SELECTOR = '0x6191c782';

  beforeEach(() => {
    // Inicialización de mocks contra interfaces
    mockBlockchain = {
      getBlockNumber: vi.fn(),
      getBlock: vi.fn(),
    };

    mockRepo = {
      numJobs: vi.fn(),
      jobAt: vi.fn(),
    };

    mockNotifiers = [
      { notify: vi.fn().mockResolvedValue(undefined) },
      { notify: vi.fn().mockResolvedValue(undefined) }
    ];

    // Inyección limpia sin necesidad de casts 'as any'
    monitor = new JobMonitor(
      mockBlockchain,
      mockRepo,
      WorkDetector,
      mockNotifiers,
      WORK_SELECTOR
    );

    // Seteamos estado inicial para los tests
    (monitor as any).lastProcessedBlock = 100;
  });

  it('no debería procesar nada si el bloque actual es igual al último procesado', async () => {
    mockBlockchain.getBlockNumber.mockResolvedValue(100);

    await monitor.tick();

    expect(mockBlockchain.getBlock).not.toHaveBeenCalled();
    expect((monitor as any).lastProcessedBlock).toBe(100);
  });

  it('debería procesar bloques nuevos y actualizar el puntero', async () => {
    mockBlockchain.getBlockNumber.mockResolvedValue(101);
    mockRepo.numJobs.mockResolvedValue(0n);
    mockBlockchain.getBlock.mockResolvedValue({
      number: 101,
      prefetchedTransactions: []
    });

    await monitor.tick();

    expect(mockBlockchain.getBlock).toHaveBeenCalledWith(101);
    expect((monitor as any).lastProcessedBlock).toBe(101);
  });

  it('debería ejecutar todos los notificadores ante un match', async () => {
    mockBlockchain.getBlockNumber.mockResolvedValue(101);
    mockRepo.numJobs.mockResolvedValue(1n);
    mockRepo.jobAt.mockResolvedValue('0xjob1');

    const mockTx = { to: '0xjob1', data: WORK_SELECTOR, hash: '0xhash' };
    mockBlockchain.getBlock.mockResolvedValue({
      number: 101,
      prefetchedTransactions: [mockTx]
    });

    const spy = vi.spyOn(WorkDetector, 'detect').mockReturnValue({
      isMatch: true,
      jobAddress: '0xjob1'
    });

    await monitor.tick();

    mockNotifiers.forEach(n => {
      expect(n.notify).toHaveBeenCalledWith('0xjob1', '0xhash');
    });

    spy.mockRestore();
  });

  it('debería propagar errores del provider correctamente', async () => {
    mockBlockchain.getBlockNumber.mockRejectedValue(new Error('Network Fail'));

    await expect(monitor.tick())
      .rejects
      .toThrow('[JobMonitor] Error en el ciclo: Network Fail');
  });
});