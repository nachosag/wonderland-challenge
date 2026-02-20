import { INotifier } from '../../services/JobMonitor';

export class ConsoleNotifier implements INotifier {
  async notify(jobAddress: string, transactionHash: string): Promise<void> {
    console.log('[ConsoleNotifier] Job trabajado:', {
      jobAddress,
      transactionHash,
      timestamp: new Date().toISOString(),
    });
  }
}