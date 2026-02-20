import { describe, it, expect, vi, beforeEach, type Mocked } from 'vitest';
import { JobMonitor, INotifier } from '../../src/services/JobMonitor';
import { IBlockchainProvider } from '../../src/infra/BlockchainService';
import { ISequencerContract } from '../../src/infra/SequencerRepository';
import { IWorkDetector } from '../../src/core/WorkDetector';

describe('JobMonitor - tick()', () => {
  let monitor: JobMonitor;
  let mockBlockchain: Mocked<IBlockchainProvider>;
  let mockRepo: Mocked<ISequencerContract>;
  let mockDetector: Mocked<IWorkDetector>;
  let mockNotifiers: Mocked<INotifier>[];
  const WORK_SELECTOR = '0x6191c782';

  beforeEach(() => {
    // Mocks de las dependencias de infraestructura y dominio
    mockBlockchain = {
      getBlockNumber: vi.fn(),
      getBlock: vi.fn(),
    }

    mockRepo = {
      numJobs: vi.fn(),
      jobAt: vi.fn(),
    }

    mockDetector = {
      detect: vi.fn(),
    };

    mockNotifiers = [
      { notify: vi.fn().mockResolvedValue(undefined) },
      { notify: vi.fn().mockResolvedValue(undefined) }
    ];

    // Inyección de dependencias siguiendo el nuevo diseño instanciable
    monitor = new JobMonitor(
      mockBlockchain,
      mockRepo,
      mockDetector,
      mockNotifiers,
      WORK_SELECTOR
    );

    // Seteamos el estado inicial manualmente para evitar dependencia del valor por defecto (0)
    (monitor as any).lastProcessedBlock = 100;
  });

  it('no debería procesar nada si el bloque actual es igual al último procesado', async () => {
    mockBlockchain.getBlockNumber.mockResolvedValue(100);

    await monitor.tick();

    expect(mockBlockchain.getBlock).not.toHaveBeenCalled();
    expect(mockRepo.numJobs).not.toHaveBeenCalled();
    expect((monitor as any).lastProcessedBlock).toBe(100);
  });

  it('debería procesar bloques nuevos y actualizar el puntero de bloque', async () => {
    mockBlockchain.getBlockNumber.mockResolvedValue(101);
    mockRepo.numJobs.mockResolvedValue(0n); // No hay jobs para simplificar el flujo
    mockBlockchain.getBlock.mockResolvedValue({
      number: 101,
      prefetchedTransactions: []
    });

    await monitor.tick();

    expect(mockBlockchain.getBlock).toHaveBeenCalledWith(101);
    expect((monitor as any).lastProcessedBlock).toBe(101);
  });

  it('debería ejecutar todos los notificadores cuando el detector encuentra un match', async () => {
    mockBlockchain.getBlockNumber.mockResolvedValue(101);
    mockRepo.numJobs.mockResolvedValue(1n);
    mockRepo.jobAt.mockResolvedValue('0xjob1');

    const mockTx = { to: '0xjob1', data: WORK_SELECTOR, hash: '0xhash' };
    mockBlockchain.getBlock.mockResolvedValue({
      number: 101,
      prefetchedTransactions: [mockTx]
    });

    // Simulamos un match positivo del detector inyectado
    mockDetector.detect.mockReturnValue({
      isMatch: true,
      jobAddress: '0xjob1'
    });

    await monitor.tick();

    mockNotifiers.forEach(notifier => {
      expect(notifier.notify).toHaveBeenCalledWith('0xjob1', '0xhash');
    });
    expect((monitor as any).lastProcessedBlock).toBe(101);
  });

  it('debería procesar múltiples bloques en orden si el puntero está retrasado', async () => {
    mockBlockchain.getBlockNumber.mockResolvedValue(102);
    mockRepo.numJobs.mockResolvedValue(0n);

    mockBlockchain.getBlock
      .mockResolvedValueOnce({ number: 101, prefetchedTransactions: [] })
      .mockResolvedValueOnce({ number: 102, prefetchedTransactions: [] });

    await monitor.tick();

    expect(mockBlockchain.getBlock).toHaveBeenCalledTimes(2);
    expect(mockBlockchain.getBlock).toHaveBeenNthCalledWith(1, 101);
    expect(mockBlockchain.getBlock).toHaveBeenNthCalledWith(2, 102);
    expect((monitor as any).lastProcessedBlock).toBe(102);
  });

  it('debería propagar errores decorados si el provider de blockchain falla', async () => {
    const errorMsg = 'Conexión perdida con el RPC';
    mockBlockchain.getBlockNumber.mockRejectedValue(new Error(errorMsg));

    await expect(monitor.tick())
      .rejects
      .toThrow(`[JobMonitor] Error en el ciclo: ${errorMsg}`);
  });
});

describe('JobMonitor - scanPastBlocks()', () => {
  let monitor: JobMonitor;
  let mockBlockchain: Mocked<IBlockchainProvider>;
  let mockRepo: Mocked<ISequencerContract>;
  let mockDetector: Mocked<IWorkDetector>;
  let mockNotifiers: Mocked<INotifier>[];
  const WORK_SELECTOR = '0x6191c782';

  beforeEach(() => {
    mockBlockchain = {
      getBlockNumber: vi.fn(),
      getBlock: vi.fn(),
    } as unknown as Mocked<IBlockchainProvider>;

    mockRepo = {
      numJobs: vi.fn(),
      jobAt: vi.fn(),
    } as unknown as Mocked<ISequencerContract>;

    mockDetector = {
      detect: vi.fn(),
    };

    mockNotifiers = [
      { notify: vi.fn().mockResolvedValue(undefined) }
    ];

    monitor = new JobMonitor(
      mockBlockchain,
      mockRepo,
      mockDetector,
      mockNotifiers,
      WORK_SELECTOR
    );
  });

  it('debería procesar el rango correcto y actualizar lastProcessedBlock al finalizar', async () => {
    const currentBlock = 100;
    const blocksBack = 10; // Rango: 90 a 100 (11 bloques)

    mockBlockchain.getBlockNumber.mockResolvedValue(currentBlock);
    mockRepo.numJobs.mockResolvedValue(0n);
    mockBlockchain.getBlock.mockResolvedValue({
      number: 0,
      prefetchedTransactions: []
    });

    await monitor.scanPastBlocks(blocksBack);

    // Verificamos que se consultaron todos los bloques del rango
    expect(mockBlockchain.getBlock).toHaveBeenCalledTimes(11);
    expect(mockBlockchain.getBlock).toHaveBeenCalledWith(90);
    expect(mockBlockchain.getBlock).toHaveBeenCalledWith(100);

    // Verificamos sincronización final del puntero
    expect((monitor as any).lastProcessedBlock).toBe(100);
  });

  it('debería manejar casos donde blocksBack es mayor al bloque actual (empezar desde 0)', async () => {
    mockBlockchain.getBlockNumber.mockResolvedValue(5);
    mockRepo.numJobs.mockResolvedValue(0n);
    mockBlockchain.getBlock.mockResolvedValue({
      number: 0,
      prefetchedTransactions: []
    });

    // Pedimos 10 bloques atrás estando en el bloque 5
    await monitor.scanPastBlocks(10);

    // Debe procesar desde 0 hasta 5 (6 bloques)
    expect(mockBlockchain.getBlock).toHaveBeenCalledTimes(6);
    expect(mockBlockchain.getBlock).toHaveBeenNthCalledWith(1, 0);
    expect((monitor as any).lastProcessedBlock).toBe(5);
  });

  it('debería procesar solo el bloque actual si blocksBack es 0', async () => {
    mockBlockchain.getBlockNumber.mockResolvedValue(500);
    mockRepo.numJobs.mockResolvedValue(0n);
    mockBlockchain.getBlock.mockResolvedValue({
      number: 500,
      prefetchedTransactions: []
    });

    await monitor.scanPastBlocks(0);

    expect(mockBlockchain.getBlock).toHaveBeenCalledTimes(1);
    expect(mockBlockchain.getBlock).toHaveBeenCalledWith(500);
    expect((monitor as any).lastProcessedBlock).toBe(500);
  });

  it('no debería actualizar el puntero si ocurre un error durante el procesamiento', async () => {
    mockBlockchain.getBlockNumber.mockResolvedValue(100);
    mockRepo.numJobs.mockResolvedValue(0n);

    // El primer bloque funciona, el segundo falla
    mockBlockchain.getBlock
      .mockResolvedValueOnce({ number: 90, prefetchedTransactions: [] })
      .mockRejectedValueOnce(new Error('RPC Timeout'));

    await expect(monitor.scanPastBlocks(10)).rejects.toThrow();

    // El puntero no debe haberse actualizado al bloque 100 porque falló a mitad de camino
    expect((monitor as any).lastProcessedBlock).toBe(0);
  });

  it('debería disparar notificaciones si encuentra jobs ejecutados en el pasado', async () => {
    mockBlockchain.getBlockNumber.mockResolvedValue(10);
    mockRepo.numJobs.mockResolvedValue(1n);
    mockRepo.jobAt.mockResolvedValue('0xjob_past');

    const tx = { to: '0xjob_past', data: WORK_SELECTOR, hash: '0xhash_past' };
    mockBlockchain.getBlock.mockResolvedValue({
      number: 10,
      prefetchedTransactions: [tx]
    });

    mockDetector.detect.mockReturnValue({ isMatch: true, jobAddress: '0xjob_past' });

    await monitor.scanPastBlocks(1);

    expect(mockNotifiers[0].notify).toHaveBeenCalledWith('0xjob_past', '0xhash_past');
  });
});