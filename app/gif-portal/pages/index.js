import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useState, useEffect } from 'react';
import idl from '../components/idl.json';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';
import kp from '../components/keypair.json';

// SystemProgram is a reference to the Solana runtime!
const {SystemProgram, Keypair} = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet(for development purpose only).
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const TEST_GIFS = [
	'https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp',
	'https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g',
	'https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g',
	'https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp'
]


export default function Home() {
  //state
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  //actions
  const onInputChange=(event)=>{
    const {value} = event.target;
    setInputValue(value);
  }

  const getProvider = ()=>{
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(connection, window.solana, opts.preflightCommitment);
    return provider;
  }

  const createGifAccount = async ()=>{
    try{
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log('ping');
      await program.rpc.initialize({
        accounts:{
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new Base Account w/ address: ", baseAccount.publicKey);
      await getGifList();
    }catch(error){
      console.log("Error creating BaseAccount account: ", error);
    }
  }

  const sendGIF = async ()=>{

    if(inputValue.length >0){
      console.log('gif link:', inputValue);
      // setGifList([...gifList, inputValue]);
      
      try{
        const provider = getProvider();
        const program = new Program(idl, programID, provider);
        await program.rpc.addGif(inputValue, {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
          }
        });

        console.log("GIF successfully sent to program", inputValue);

        await getGifList();

      }catch(error){
        console.log("Error sending GIF:", error);
      }

      setInputValue('');
    }else{
      console.log('Empty input. Try Again!');
    }
  }

  const getGifList = async()=>{
    try{
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account);
      setGifList(account.gifList);
    }catch(error){
      console.log("Error in getGifList: ", error);
      setGifList(null);
    }
  }

  const checkIfWalletIsConnected = async()=>{
    try{
      const{solana} = window;
      if(solana){
        if(solana.isPhantom){
          console.log('Phantom Wallet Found!');
          const response = await solana.connect();
          console.log('Connected with Public Key:', response.publicKey.toString());

          setWalletAddress(response.publicKey.toString());
        }
      }else{
        alert('Solana object not found! Get a Phantom Wallet');
      }
    }
    catch(error){
      console.log(error)
    }
  }

  const connectWallet = async ()=>{
    const {solana} = window;

    if(solana){
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());

      setWalletAddress(response.publicKey.toString());
    }
  };

  const renderNotConnectedContainer = ()=>{
    return(
    <button className='cta-button connect-wallet-button' onClick={connectWallet}>
      Connect to Wallet
    </button>
    )
  }

  const renderConnectedContainer = ()=>{

    // If we hit gifList == null, it means the program account hasn't been init
    if(gifList===null){
      return(
        <div className='connected-container'>
          <button className='cta-button submit-gif-button' onClick={createGifAccount}>
            Do One-Time Init for GIF Program Account
          </button>
        </div>
      )
    }

    return(
      <div className='connected-container'>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendGIF();
          }}
        >
          <input type="text" placeholder="Enter gif link!" value={inputValue} onChange={onInputChange}/>
          <button type="submit" className="cta-button submit-gif-button">Submit</button>
        </form>
        <div className='gif-grid'>
          {gifList.map((item, index)=>{
            return(<div className='gif-item' key={index}>
              <img src={item.gifLink} alt={item.gifLink}/>
            </div>)
          })}
        </div>
      </div>
    )
  }

  useEffect(()=>{
    const onLoad = async ()=>{
      await checkIfWalletIsConnected();
    }
    window.addEventListener('load', onLoad);
    return ()=> window.removeEventListener('load', onLoad);
  },[]);

  useEffect(()=>{
    if(walletAddress){
      console.log('fetching gif list...');
      getGifList();
    }
  }, [walletAddress])

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <h3 style={{color: 'lightgrey'}}>GIFs@2022</h3>
        </div>
      </div>
    </div>
  )
}
