const anchor = require('@project-serum/anchor');

// Need the system program
const {SystemProgram} = anchor.web3;

const main = async()=>{
  console.log("Starting test...");

  // create and set the provider
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Project;

  // create an account keypair for the program to use
  const baseAccount = anchor.web3.Keypair.generate();

  // Call initialize and pass params
  const tx = await program.rpc.initialize({
    accounts:{
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers:[baseAccount],
  });

  console.log("Your transaction signature", tx);
  // Fetch the data from the account
  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('GIF Count', account.totalGifs.toString());

  // Call add_gif!
  await program.rpc.addGif("giphy_link_here",{
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    },
  });

  // Get the account again to see what changed.
  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('GIF Count ', account.totalGifs.toString());

  // Access gif_list on the account
  console.log('GIF List', account.gifList);
}

const runMain = async ()=>{
  try{
    await main();
    process.exit(0);
  }catch(error){
    console.error(error);
    process.exit(1);
  }
}

runMain();