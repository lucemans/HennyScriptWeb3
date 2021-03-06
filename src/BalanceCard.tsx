import { useState, useEffect } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,

} from "@solana/web3.js";
import { Button, Text, Heading, VStack, HStack } from "@chakra-ui/react";
import Canvas from "./Canvas";

type DisplayEncoding = "utf8" | "hex";
type PhantomEvent = "disconnect" | "connect";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

interface PhantomProvider {
  publicKey: PublicKey | null;
  isConnected: boolean | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signMessage: (
    message: Uint8Array | string,
    display?: DisplayEncoding
  ) => Promise<any>;
  connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  on: (event: PhantomEvent, handler: (args: any) => void) => void;
  request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

const getProvider = (): PhantomProvider | undefined => {
  if ("solana" in window) {
    const anyWindow: any = window;
    const provider = anyWindow.solana;
    if (provider.isPhantom) {
      return provider;
    }
  }
  window.open("https://phantom.app/", "_blank");
};

const NETWORK = clusterApiUrl("mainnet-beta");

export default function BalanceCard() {
  const provider = getProvider();
  const connection = new Connection(NETWORK);

  const [balance, setBalance] = useState<number>();
  const [Hbalance, setHBalance] = useState<number>();
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (log: string) => setLogs([...logs, log]);
  useEffect(() => {
    if (provider) {
      return () => {
        provider.disconnect();
      };
    }
  }, [provider]);
  if (!provider) {
    return <h2>Could not find a provider</h2>;
  }

  const connect = async () => {
    try {
      const res = await provider.connect();
      addLog(JSON.stringify(res));
      //the public solana address
      //mintAccount = the token mint address
      const mintAccount = new PublicKey(
        "2Tp4hCJ24aRnsLShz9U96VtTSDHuaKL7eD7vj8Stvxhn"
      );
      const account = await connection.getTokenAccountsByOwner(res.publicKey, {
        mint: mintAccount
      });

      console.log(account.value[0].pubkey.toString());
      const HENDXKey = new PublicKey(account.value[0].pubkey.toString());
      connection.getTokenAccountBalance(HENDXKey).then((balance) => {
        console.log(balance);
        setHBalance(balance.value.uiAmount || undefined)
      });
      connection.getBalance(res.publicKey).then((balance) => {
        setBalance(balance / LAMPORTS_PER_SOL);
      });
    } catch (err) {
      console.warn(err);
      addLog("Error: " + JSON.stringify(err));
    }
  };

  const disconnect = async () => {
    try {
      const res = await provider.disconnect();
      addLog(JSON.stringify(res));
    } catch (err) {
      console.warn(err);
      addLog("Error: " + JSON.stringify(err));
    }
  };

  return (
    <VStack w="100%" align="start" background="gray.900" rounded="lg" p="4">
      {provider && provider.publicKey ? (
        <>
          <Heading size="md">Your Address:</Heading>
          <Text>{provider.publicKey?.toBase58()}</Text>
          <Text>SOL Balance: {balance} SOL</Text>
          <Text>HENDX Balance: {Hbalance} HENDX</Text>

          <Button onClick={disconnect}>Disconnect</Button>
          <Text fontWeight="bold">Logs</Text>
          {logs.map((log, i) => (
            <Text key={i}>{log}</Text>
          ))}
          {Hbalance ? Hbalance > 3000 && <HStack w="100%"><Text>You have enough tokens to see the secret code word: Hennessy</Text></HStack> : ""}
          {Hbalance ? Hbalance > 5000 && <Canvas /> : ""}
        </>
      ) : (
        <>
          <Button onClick={connect}>Connect to Phantom</Button>
        </>
      )}
    </VStack>
  );
}
