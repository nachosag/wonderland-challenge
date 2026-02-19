import { describe, it, expect, vi, beforeEach } from 'vitest'
import { JobMonitor, INotifier } from '../../src/services/JobMonitor'
import { BlockchainService } from '../../src/infra/BlockchainService'
import { SequencerRepository } from '../../src/infra/SequencerRepository'
import { WorkDetector } from '../../src/core/WorkDetector'

describe('JobMonitor - tick()', () => {
  let monitor: JobMonitor;
  let mockBlockchain: any;
  let mockRepo: any;
  let mockNotifiers: INotifier[];
  const WORK_SELECTOR = '0x6191c782';

  beforeEach(() => {
    // 1. Mocks de Infraestructura
    mockBlockchain = {
      getLatestBlockNumber: vi.fn(),
      getBlockWithTransactions: vi.fn(),
    };

    mockRepo = {
      getActiveJobs: vi.fn().mockResolvedValue(['0xjob1']),
    };

    // 2. Mocks de Notificadores (usamos un array con dos para probar OCP)
    mockNotifiers = [
      { notify: vi.fn().mockResolvedValue(undefined) },
      { notify: vi.fn().mockResolvedValue(undefined) }
    ];

    monitor = new JobMonitor(
      mockBlockchain as unknown as BlockchainService,
      mockRepo as unknown as SequencerRepository,
      WorkDetector,
      mockNotifiers,
      WORK_SELECTOR
    );

    // Seteamos el estado inicial privado para los tests (hack de TS para testing)
    (monitor as any).lastProcessedBlock = 100;
  });

  it('no debería procesar nada si el bloque actual es igual al último procesado', async () => {
    mockBlockchain.getLatestBlockNumber.mockResolvedValue(100);

    await monitor.tick();

    expect(mockBlockchain.getBlockWithTransactions).not.toHaveBeenCalled();
    expect((monitor as any).lastProcessedBlock).toBe(100);
  });

  it('debería procesar el rango y actualizar lastProcessedBlock cuando hay bloques nuevos', async () => {
    mockBlockchain.getLatestBlockNumber.mockResolvedValue(101);
    mockBlockchain.getBlockWithTransactions.mockResolvedValue({
      number: 101,
      prefetchedTransactions: []
    });

    await monitor.tick();

    // Verificamos que pidió el bloque 101 (lastProcessedBlock + 1)
    expect(mockBlockchain.getBlockWithTransactions).toHaveBeenCalledWith(101);
    expect((monitor as any).lastProcessedBlock).toBe(101);
  });

  it('debería notificar a TODOS los notificadores cuando el WorkDetector encuentra un match', async () => {
    mockBlockchain.getLatestBlockNumber.mockResolvedValue(101);

    const mockTx = { to: '0xjob1', data: WORK_SELECTOR + '123', hash: '0xhash' };
    mockBlockchain.getBlockWithTransactions.mockResolvedValue({
      number: 101,
      prefetchedTransactions: [mockTx]
    });

    // Mockeamos el detector estático
    const spy = vi.spyOn(WorkDetector, 'detect').mockReturnValue({
      isMatch: true,
      jobAddress: '0xjob1'
    });

    await monitor.tick();

    // Verificar que cada notificador fue llamado
    mockNotifiers.forEach(notifier => {
      expect(notifier.notify).toHaveBeenCalledWith('0xjob1', '0xhash');
    });

    spy.mockRestore();
  });

  it('debería propagar errores de red con el contexto adecuado', async () => {
    mockBlockchain.getLatestBlockNumber.mockRejectedValue(new Error('Timeout'));

    await expect(monitor.tick())
      .rejects
      .toThrow('[JobMonitor] Error durante el ciclo (tick): Timeout');

    // El puntero no debería haberse movido
    expect((monitor as any).lastProcessedBlock).toBe(100);
  });
});