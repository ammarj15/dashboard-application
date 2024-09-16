import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { toast, ToastContainer } from 'react-toastify';

const CryptoTransaction = ({ onTransactionSent, onTransactionConfirmed }) => {
    const [account, setAccount] = useState('');
    const [balance, setBalance] = useState('');
    const [recipientAddress, setRecipientAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        checkIfWalletConnected();
    }, []);

    const checkIfWalletConnected = async () => {
        try {
            const { ethereum } = window;

            if (!ethereum) {
                setStatus('Please install a Web3 wallet');
                return;
            }

            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length !== 0) {
                const account = accounts[0];
                setAccount(account);
                await getBalance(account);
            } else {
                setStatus('No accounts found');
            }
        } catch (error) {
            console.error(error);
            setStatus('Error checking wallet connection');
        }
    };

    const connectWallet = async () => {
        try {
            const { ethereum } = window;

            if (!ethereum) {
                setStatus('Please install a Web3 wallet');
                return;
            }

            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);
            await getBalance(accounts[0]);
        } catch (error) {
            console.error(error);
            setStatus('Error connecting wallet');
        }
    };

    const getBalance = async (address) => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const balance = await provider.getBalance(address);
            setBalance(ethers.formatEther(balance));
        } catch (error) {
            console.error(error);
            setStatus('Error fetching balance');
        }
    };

    const sendTransaction = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const tx = await signer.sendTransaction({
                to: recipientAddress,
                value: ethers.parseEther(amount.toString()),
            });

            // Notify parent that transaction has been sent
            if (onTransactionSent) onTransactionSent();

            setStatus(`Transaction sent! Hash: ${tx.hash}`);

            // Wait for transaction to be confirmed
            await tx.wait();

            // Notify parent that transaction has been confirmed
            if (onTransactionConfirmed) onTransactionConfirmed();

            setStatus('Transaction confirmed!');
            await getBalance(account);
        } catch (error) {
            console.error(error);
            setStatus('Error sending transaction');
        }
    };

    return (
        <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg max-w-md w-full mx-auto">
          <h2 className="text-xl font-bold mb-4">Crypto Transaction</h2>
          {!account ? (
            <button
              onClick={connectWallet}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-400">Account</p>
                <p className="font-mono text-sm break-all">{account}</p>
              </div>
              <div className="bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-400">Balance</p>
                <p className="font-bold">{balance} ETH</p>
              </div>
              <input
                type="text"
                placeholder="Recipient Address"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Amount (ETH)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-700 text-white p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendTransaction}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300"
              >
                Send Transaction
              </button>
              {status && (
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-xs text-gray-400">Status</p>
                  <p className="font-mono text-sm break-all">{status}</p>
                </div>
              )}
            </div>
          )}
          <ToastContainer position="bottom-right" />
        </div>
      );
    };

export default CryptoTransaction;
