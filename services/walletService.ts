export interface AgentWallet {
    address: string;
    privateKey: string;
    balance: string;
    network: string;
}

const STORAGE_KEY = 'mz_agent_wallet_v1';

export class WalletService {
    static getOrCreateWallet(): AgentWallet {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
        const newWallet: AgentWallet = {
            address: "0x0000000000000000000000000000000000000000",
            privateKey: "",
            balance: "0.00",
            network: "Disabled (Fiat/Paymob Primary)",
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newWallet));
        return newWallet;
    }

    static async getRealBalance(_address: string): Promise<string> {
        return "0.00";
    }

    static async approveTradeAllowance(_amount: number): Promise<boolean> {
        return false;
    }

    static async sendTransaction(_privateKey: string, _to: string, _amount: string): Promise<string> {
        throw new Error("Crypto wallet disabled in T2 Sovereign OS; use Paymob gateway.");
    }

    static async callContractWithdraw(_privateKey: string, _contractAddress: string): Promise<string> {
        throw new Error("Smart contract execution disabled in T2 Sovereign OS.");
    }
}
