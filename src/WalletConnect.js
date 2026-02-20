import React, { useState } from "react";
import * as StellarSdk from "stellar-sdk";
import { requestAccess, signTransaction } from "@stellar/freighter-api";
import "./WalletConnect.css";

const server = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org"
);

function WalletConnect() {
  const [publicKey, setPublicKey] = useState("");
  const [balance, setBalance] = useState("");
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");

  // CONNECT
  const connectWallet = async () => {
    try {
      setStatus("Connecting wallet...");

      const result = await requestAccess();

      const address =
        typeof result === "string"
          ? result
          : result.address;

      setPublicKey(address);

      const account = await server.loadAccount(address);
      const xlm = account.balances.find(
        (b) => b.asset_type === "native"
      );

      setBalance(xlm.balance);
      setStatus("Wallet connected ✅");

    } catch (e) {
      console.error("CONNECT ERROR:", e);
      setStatus("Connection failed ❌");
    }
  };

  // SEND
  const sendXLM = async () => {
  try {
    if (!publicKey) return;

    setStatus("Waiting for Freighter approval...");

    const source = await server.loadAccount(publicKey);
    const fee = await server.fetchBaseFee();

    const tx = new StellarSdk.TransactionBuilder(source, {
      fee,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination,
          asset: StellarSdk.Asset.native(),
          amount,
        })
      )
      .setTimeout(30)
      .build();

    const signed = await signTransaction(tx.toXDR(), {
      networkPassphrase: StellarSdk.Networks.TESTNET,
    });

    await server.submitTransaction(
      StellarSdk.TransactionBuilder.fromXDR(
        signed.signedTxXdr,
        StellarSdk.Networks.TESTNET
      )
    );

    // ⭐ REFRESH BALANCE AFTER TX
    const updatedAccount = await server.loadAccount(publicKey);
    const updatedXlm = updatedAccount.balances.find(
      (b) => b.asset_type === "native"
    );
    setBalance(updatedXlm.balance);

    setStatus("Transaction successful ✅");

  } catch (e) {
    console.error("SEND ERROR:", e);
    setStatus("Transaction failed ❌");
  }
};
  return (
    <div className="wallet-container">
      <div className="wallet-card">
        <h2>Stellar White Belt 🚀</h2>

        {!publicKey && (
          <button onClick={connectWallet} className="connect-btn">
            Connect Wallet
          </button>
        )}

        {publicKey && (
          <>
            <div className="label">Your Public Key</div>
            <div className="address-box">{publicKey}</div>

            <div className="label">XLM Balance</div>
            <div className="balance">{balance} XLM</div>

            <div className="label">Destination Address</div>
            <input
              placeholder="Enter destination address"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />

            <div className="label">Amount (XLM)</div>
            <input
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <button onClick={sendXLM} className="send-btn">
              Send XLM
            </button>
          </>
        )}

        <div className="status">{status}</div>
      </div>
    </div>
  );
}

export default WalletConnect;