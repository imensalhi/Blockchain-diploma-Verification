export const NETWORKS = {
  localhost: {
    name: 'Localhost',
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545'
  },
};


export function getCurrentNetwork() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return detectNetworkFromMetaMask();
  }
  const chainId = '31337';
  return Object.values(NETWORKS).find(network => 
    network.chainId.toString() === chainId
  ) || NETWORKS.localhost;
}

export function getContractAddress(network = null) {
  const currentNetwork = network || getCurrentNetwork();
  const networkName = Object.keys(NETWORKS).find(key => 
    NETWORKS[key].chainId === currentNetwork.chainId
  );
  const address = CONTRACT_ADDRESSES[networkName];
  if (!address) {
    throw new Error(`Contract not deployed on ${currentNetwork.name} (Chain ID: ${currentNetwork.chainId})`);
  }
  return address;
}

export async function detectNetworkFromMetaMask() {
  if (!window.ethereum) return NETWORKS.localhost;
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const numericChainId = parseInt(chainId, 16);
    return Object.values(NETWORKS).find(network => 
      network.chainId === numericChainId
    ) || NETWORKS.localhost;
  } catch (error) {
    console.warn('Could not detect network from MetaMask:', error);
    return NETWORKS.localhost;
  }
}

export function updateContractAddress(network, address) {
  CONTRACT_ADDRESSES[network] = address;
  localStorage.setItem(`contract_address_${network}`, address);
  console.log(`Updated ${network} contract address to: ${address}`);
}

export function loadContractAddresses() {
  Object.keys(NETWORKS).forEach(network => {
    const stored = localStorage.getItem(`contract_address_${network}`);
    if (stored) {
      CONTRACT_ADDRESSES[network] = stored;
    }
  });
}

export async function ensureCorrectNetwork(targetNetwork = 'sepolia') {
  if (!window.ethereum) {
    throw new Error('MetaMask not detected');
  }
  const currentNetwork = await detectNetworkFromMetaMask();
  const target = NETWORKS[targetNetwork];
  if (currentNetwork.chainId !== target.chainId) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${target.chainId.toString(16)}` }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${target.chainId.toString(16)}`,
              chainName: target.name,
              rpcUrls: [target.rpcUrl],
              blockExplorerUrls: [target.blockExplorer],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }
}