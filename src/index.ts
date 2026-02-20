import 'dotenv/config';
import { ethers } from 'ethers';
import { SEQUENCER_ABI } from './abi';
import { WorkDetector } from './core/WorkDetector';
import { JobMonitor } from './services/JobMonitor';
import { DiscordNotifier } from './infra/notifiers/DiscordNotifier';
import { ConsoleNotifier } from './infra/notifiers/ConsoleNotifier';

const RPC_URL = process.env.RPC_URL ?? ''
const SEQUENCER_ADDRESS = '0x238b4E35dAed6100C6162fAE4510261f88996EC9';
const WORK_SELECTOR = ethers.id('work(bytes32,bytes)').slice(0, 10);
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL ?? '';
const BLOCKS_TO_SCAN = 5000;
const POLL_INTERVAL_MS = 12_000;

async function main() {
  if (!DISCORD_WEBHOOK_URL) throw new Error('Falta DISCORD_WEBHOOK_URL');
  if (!RPC_URL) throw new Error('Falta RPC_URL');

  // Infraestructura
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(SEQUENCER_ADDRESS, SEQUENCER_ABI, provider);

  // Adaptadores: envolvemos ethers para que cumplan nuestras interfaces
  const blockchainProvider = {
    getBlockNumber: () => provider.getBlockNumber(),
    getBlock: (n: number) => provider.getBlock(n, true) as any,
  };

  const sequencerContract = {
    numJobs: () => contract.numJobs(),
    jobAt: (i: number) => contract.jobAt(i),
  };

  // Notificadores
  const notifiers = [
    new DiscordNotifier(DISCORD_WEBHOOK_URL),
    new ConsoleNotifier(),
  ];

  // Servicio principal
  const monitor = new JobMonitor(
    blockchainProvider,
    sequencerContract,
    new WorkDetector(),
    notifiers,
    WORK_SELECTOR
  );

  console.log('🚀 Monitor iniciado. Escaneando últimos', BLOCKS_TO_SCAN, 'bloques...');
  await monitor.scanPastBlocks(BLOCKS_TO_SCAN);
  console.log('✅ Escaneo histórico completo. Monitoreando nuevos bloques...');

  setInterval(async () => {
    try {
      await monitor.tick();
    } catch (error) {
      console.error(error);
    }
  }, POLL_INTERVAL_MS);
}

main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});