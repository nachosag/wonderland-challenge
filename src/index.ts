import { Block, ethers } from "ethers";

const RPC_URL = 'https://eth.llamarpc.com'
const SEQUENCER_ADDRESS = '0x238b4E35dAed6100C6162fAE4510261f88996EC9'
const SEQUENCER_ABI = [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [{ "internalType": "uint256", "name": "startIndex", "type": "uint256" }, { "internalType": "uint256", "name": "exclEndIndex", "type": "uint256" }], "name": "BadIndicies", "type": "error" }, { "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }, { "internalType": "uint256", "name": "length", "type": "uint256" }], "name": "IndexTooHigh", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "network", "type": "address" }], "name": "JobDoesNotExist", "type": "error" }, { "inputs": [{ "internalType": "address", "name": "job", "type": "address" }], "name": "JobExists", "type": "error" }, { "inputs": [{ "internalType": "bytes32", "name": "network", "type": "bytes32" }], "name": "NetworkDoesNotExist", "type": "error" }, { "inputs": [{ "internalType": "bytes32", "name": "network", "type": "bytes32" }], "name": "NetworkExists", "type": "error" }, { "inputs": [{ "internalType": "bytes32", "name": "network", "type": "bytes32" }], "name": "WindowZero", "type": "error" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "job", "type": "address" }], "name": "AddJob", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "network", "type": "bytes32" }, { "indexed": false, "internalType": "uint256", "name": "windowSize", "type": "uint256" }], "name": "AddNetwork", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "usr", "type": "address" }], "name": "Deny", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "usr", "type": "address" }], "name": "Rely", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "job", "type": "address" }], "name": "RemoveJob", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "network", "type": "bytes32" }], "name": "RemoveNetwork", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "job", "type": "address" }], "name": "addJob", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "network", "type": "bytes32" }, { "internalType": "uint256", "name": "windowSize", "type": "uint256" }], "name": "addNetwork", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "usr", "type": "address" }], "name": "deny", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "getMaster", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "network", "type": "bytes32" }], "name": "getNextJobs", "outputs": [{ "components": [{ "internalType": "address", "name": "job", "type": "address" }, { "internalType": "bool", "name": "canWork", "type": "bool" }, { "internalType": "bytes", "name": "args", "type": "bytes" }], "internalType": "struct Sequencer.WorkableJob[]", "name": "", "type": "tuple[]" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "network", "type": "bytes32" }, { "internalType": "uint256", "name": "startIndex", "type": "uint256" }, { "internalType": "uint256", "name": "endIndexExcl", "type": "uint256" }], "name": "getNextJobs", "outputs": [{ "components": [{ "internalType": "address", "name": "job", "type": "address" }, { "internalType": "bool", "name": "canWork", "type": "bool" }, { "internalType": "bytes", "name": "args", "type": "bytes" }], "internalType": "struct Sequencer.WorkableJob[]", "name": "", "type": "tuple[]" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "job", "type": "address" }], "name": "hasJob", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "network", "type": "bytes32" }], "name": "hasNetwork", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "network", "type": "bytes32" }], "name": "isMaster", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "jobAt", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "index", "type": "uint256" }], "name": "networkAt", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "numJobs", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "numNetworks", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "usr", "type": "address" }], "name": "rely", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "job", "type": "address" }], "name": "removeJob", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "network", "type": "bytes32" }], "name": "removeNetwork", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "totalWindowSize", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "wards", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "name": "windows", "outputs": [{ "internalType": "uint256", "name": "start", "type": "uint256" }, { "internalType": "uint256", "name": "length", "type": "uint256" }], "stateMutability": "view", "type": "function" }]

const provider = new ethers.JsonRpcProvider(RPC_URL)
const sequencer = new ethers.Contract(SEQUENCER_ADDRESS, SEQUENCER_ABI, provider)

async function main() {
  console.log('🚀 Monitor de Jobs de MakerDAO iniciado...');

  try {
    const jobs = await getActiveJobs()
    await checkPastBlock(jobs, 1000)
    monitorNewBlocks(jobs)
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

async function getActiveJobs() {
  const totalJobs = Number(await sequencer.numJobs())

  const jobPromises: Promise<string>[] = []

  for (let index = 0; index < totalJobs; index++) {
    jobPromises.push(sequencer.jobAt(index))
  }

  const jobAddresses = await Promise.all(jobPromises)

  return jobAddresses
}

async function checkPastBlock(jobAddresses: string[], blocksToCheck: number) {
  const currentBlock = await provider.getBlockNumber()
  const startBlock = currentBlock - blocksToCheck
  const workSelector = ethers.id('work(bytes32,bytes)').slice(0, 10)
  const normalizedAddresses = jobAddresses.map(address => address.toLowerCase());
  const CHUNK_SIZE = 10


  for (let i = startBlock; i <= currentBlock; i += CHUNK_SIZE) {
    const chunkPromises: Array<Promise<Block | null>> = []
    const endOfChunk = Math.min(i + CHUNK_SIZE - 1, currentBlock)

    for (let blockNumber = i; blockNumber <= endOfChunk; blockNumber++) {
      chunkPromises.push(provider.getBlock(blockNumber, true))
    }
    
    const blocks: Array<Block | null> = await Promise.all(chunkPromises)
    
    for (const block of blocks) {
      if (!block) continue
  
      for (const tx of block.prefetchedTransactions) {
        if (!tx.to) continue
  
        const isPresent = normalizedAddresses.includes(tx.to.toLowerCase());
        const startsWith = tx.data.startsWith(workSelector)
  
        if (isPresent && startsWith) {
          console.log('BlockNumber:', block.number, 'To:', tx.to, 'Hash:', tx.hash);
        }
      }
    }
    await new Promise(resolve => setTimeout(resolve, 300))
  }
}

async function monitorNewBlocks(jobAddresses: string[]) {
  console.log('👀 Monitoreando nuevos bloques...');

  const workSelector = ethers.id('work(bytes32,bytes)').slice(0, 10);
  const normalizedAddresses = jobAddresses.map(a => a.toLowerCase());

  let lastProcessedBlock = await provider.getBlockNumber();

  setInterval(async () => {
    try {
      const latestBlock = await provider.getBlockNumber();

      if (latestBlock > lastProcessedBlock) {
        for (let blockNumber = lastProcessedBlock + 1; blockNumber <= latestBlock; blockNumber++) {
          const block = await provider.getBlock(blockNumber, true)

          if (!block) continue
          
          for (const tx of block.prefetchedTransactions) {
            if (!tx.to) continue

            const isJob = normalizedAddresses.includes(tx.to.toLowerCase());
            const isWorkCall = tx.data.startsWith(workSelector);

            if (isJob && isWorkCall) {
              console.log({
                block: blockNumber,
                job: tx.to,
                hash: tx.hash,
                time: new Date().toISOString()
              })
            }
          }
          lastProcessedBlock = blockNumber
        }
      }
    } catch (error) {
      console.error('Error en monitor:', error);
    }
  }, 12000);
}

main().catch(console.error)