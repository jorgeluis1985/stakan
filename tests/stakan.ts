import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
//import { Connection } from "@solana/web3.js";
import { Stakan } from "../target/types/stakan";

import Arweave from "arweave";
//import TestWeave from "testweave-sdk"
import { serialize, deserialize } from "borsh";
//import fetch from "node-fetch";
//import ArLocal from 'arlocal';
const axios = require('axios');

class Assignable {
  constructor(properties) {
    Object.keys(properties).map((key) => {
      return (this[key] = properties[key]);
    });
  }
}

class UserGameAccount extends Assignable { 
  public static deserialize(buffer: Buffer): UserGameAccount {
    const schema = new Map([
      [
        UserGameAccount, 
        { 
          kind: 'struct', 
          fields: [
              ['discriminant', [8]],
              ['max_score', 'u64'], 
              ['saved_game_sessions', 'u64']
            ] 
        }
      ]
    ]);
    let data = deserialize(schema, UserGameAccount, buffer);
    return data;
  }
}

class GameSessionArchive extends Assignable { 
  static schema = new Map([
    [
      GameSessionArchive, 
      { 
        kind: 'struct', 
        fields: [
            ['score', 'u64'], 
            ['duration', 'u64']
          ] 
      }
    ]
  ]);

  public static serialize(data): Uint8Array {
    let buffer = serialize(GameSessionArchive.schema, new GameSessionArchive(data));
    return buffer;
  }

  public static deserialize(buffer: Uint8Array) {
    try {
      const data = deserialize(GameSessionArchive.schema, GameSessionArchive, Buffer.from(buffer));
      console.log("Deser Archive: ", data);
      } catch(e) {
        console.log(e);
        throw e;
      }
  }

  public static async get(userWalletPublicKey) {
    const queryObject = { query: `{
      transactions(first: 100,
        tags: [
          {
            name: "App-Name",
            values: ["Stakan"]
          },
          {
            name: "User",
            values: ["${userWalletPublicKey}"]
          },
        ]
      ) {
        edges {
          node {
            id
            owner {
              address
            }
            data {
              size
            }
            block {
              height
              timestamp
            }
            tags {
              name,
              value
            }
          }
        }
      }
    }`}
//    console.log("queryObject: ", queryObject);
    let results = await arweave.api.post('/graphql', queryObject);

    const edges = results.data.data.transactions.edges;

    results.data.data.transactions.edges.map(async edge => {
      console.log("Node ID: " + edge.node.id);
      const buffer = await arweave.transactions.getData(
        edge.node.id,
        { decode: true, string: false }
      );

      console.log("BUFFER FROM ARCHIVE: ", buffer);

      try {
      const data = deserialize(GameSessionArchive.schema, GameSessionArchive, Buffer.from(buffer));
      console.log("Data from Arweave: score, ", data['score'].toString(), ", duration: ", data['duration'].toString() );
      } catch(e) {
        console.log(e);
        throw e;
      }
      //      const data =  Buffer.from(buffer);
    });

    return edges;
  }
}

/*
const arweave = Arweave.init({
  host: 'localhost',
  port: 1984,
  protocol: 'http',
  timeout: 20000,
  logging: false,
}); 
*/
import Bip39 from 'bip39';

let duration = 0;
let arweave: Arweave = undefined;
//let arLocal: ArLocal = undefined;

let arweaveWallet = undefined;

function simulateGameLoop(
  program: Program<Stakan>,
  gameSessionAccount: any,
  interval: number
) {

  const intervalId = setInterval( async () => {
    duration += interval;

    console.log("Game session running:  ", duration, " ms");
  }, interval);

  return intervalId;
}

let assert = require('assert');

const queryObject = { query: `{
  transactions(first: 100,
    tags: [
      {
        name: "App-Name",
        values: ["Stakan"]
      },
    ]
  ) {
    edges {
      node {
        id
        owner {
          address
        }
        data {
          size
        }
        block {
          height
          timestamp
        }
        tags {
          name,
          value
        }
      }
    }
  }
}`}

describe("stakan", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.Provider.env();
  
  anchor.setProvider(provider);

  const program = anchor.workspace.Stakan as Program<Stakan>;

  const programWallet = provider.wallet;

  const gameGlobalWallet = anchor.web3.Keypair.generate();
  const gameGlobalAccountKeypair = anchor.web3.Keypair.generate();

  const userWallet = anchor.web3.Keypair.generate();
  const gameSessionAccountKeypair = anchor.web3.Keypair.generate();

  const bip39 = require('bip39');

  const stakanMnemonicToSeed = bip39.mnemonicToSeedSync('Stakan').slice(0, 32);
  const seed = stakanMnemonicToSeed.map( (x, i) => x + userWallet.secretKey[i] );

  console.log("seed size: ", seed.length);

  const userGameAccountKeypair = anchor.web3.Keypair.fromSeed(
    seed 
  );

  const { SystemProgram } = anchor.web3;

  it("Arweave init!", async () => {
//    await arLocal.start();
/*
    arweave = Arweave.init({
      host: 'testnet.redstone.tools',
      port: 443,
      protocol: 'https'
    });
*/
    arweave = Arweave.init({
      host: 'localhost',
      port: 1984,
      protocol: 'http',
      timeout: 20000,
      logging: false,
    });
//    console.log("after init");

    arweaveWallet = await arweave.wallets.generate();
//    console.log("after wallet generate");

    const addr = await arweave.wallets.getAddress(arweaveWallet);
//    console.log("after wallet get address");

    const tokens = arweave.ar.arToWinston('10')

    await arweave.api.get(`/mint/${addr}/${tokens}`)
//    console.log("after minting token");
 
    const balance = await arweave.wallets.getBalance(addr)
    assert(balance, 10);
  });

  it("Arweave create test transaction!", async () => {
//    const testWeave = await TestWeave.init(arweave);

    let data = "BLABLABLA";

    const dataTransaction = await arweave.createTransaction({
      data
    });
    
    dataTransaction.addTag('App-Name', 'Stakan');

    await arweave.transactions.sign(dataTransaction, arweaveWallet)
    const statusBeforePost = await arweave.transactions.getStatus(dataTransaction.id)
    assert(statusBeforePost, 404);
    await arweave.transactions.post(dataTransaction)
    const statusAfterPost = await arweave.transactions.getStatus(dataTransaction.id)
    assert(statusAfterPost, 202);

//    await fetch('http://localhost:1984/mine');
    await axios.get('http://localhost:1984/mine');
    const statusAfterMine = await arweave.transactions.getStatus(dataTransaction.id)
    console.log(statusAfterMine); // this will return 200
    assert(statusAfterPost, 200);
    
    // use the TestWeave to instantly mine the block that contains the transaction
  /*  
    await testWeave.mine();
    const statusAfterMine = await arweave.transactions.getStatus(dataTransaction.id)
    console.log(statusAfterMine); // this will return 200
    assert(statusAfterPost, 200);
  */  
    
//    await arweave.transactions.
//    await arweave.api.
  });

  it("Arweave query test transaction!", async () => {
    let results = await arweave.api.post('/graphql', queryObject);

    const edges = results.data.data.transactions.edges;
//    console.log(edges);
  });

  it("Airdrop!", async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(gameGlobalWallet.publicKey, 100000000000)
    );
    
    const signature = await provider.connection.requestAirdrop(userWallet.publicKey, 1000000000);
    await provider.connection.confirmTransaction(signature);
  });
 
  it("SHOULD FAIL - action before Global state initialized!", async () => {
    try {
      await initGameSession(userWallet, gameSessionAccountKeypair, 1000000);
    }
    catch(e) {
//      console.log(e);
      return;
    }
    throw "Should have failed upon action before Global state initialization";
  });

  it("Global state is initialized!", async () => {
    const globalBalanceBefore = await provider.connection.getBalance(gameGlobalWallet.publicKey);
    console.log("Game account before init: ", globalBalanceBefore);

    const tx = await program.rpc.initGlobalState({
        accounts: {
          gameGlobalAccount: gameGlobalAccountKeypair.publicKey,
          globalWallet: programWallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [gameGlobalAccountKeypair],
      });

    const globalBalanceAfter = await provider.connection.getBalance(gameGlobalWallet.publicKey);
    console.log("Game account after init: ", globalBalanceAfter, ", delta: ", globalBalanceBefore - globalBalanceAfter);
  });

  it("SHOULD FAIL - Global state initialized twice!", async () => {
    try {
      const tx = await program.rpc.initGlobalState({
        accounts: {
          gameGlobalAccount: gameGlobalAccountKeypair.publicKey,
          globalWallet: gameGlobalWallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [gameGlobalAccountKeypair],
      });
    }
    catch(e) {
//      console.log(e);
      return;
    }
    throw "Should have failed upon double initialization";
  });

  it("User Game account is initialized!", async () => {
    //    await initGameSession(userWallet, gameSessionAccountKeypair, 1000000);
    await initUserGameAccount(userWallet, userGameAccountKeypair);
    const accountInfo = await provider.connection.getAccountInfo(userGameAccountKeypair.publicKey);
    console.log("User Game account data: ", accountInfo.data);
    
    let userGameAccountData = UserGameAccount.deserialize(accountInfo.data.slice(0, 8+8+8));
    console.log("User Game account data: ", 
      userGameAccountData['max_score'].toString(16),
      userGameAccountData['saved_game_sessions'].toString(16),
    );
  });

  it("SHOULD FAIL: User Game account is initialized twice!", async () => {
    //    await initGameSession(userWallet, gameSessionAccountKeypair, 1000000);
    try {
      await initUserGameAccount(userWallet, userGameAccountKeypair);
    }
    catch {
      return;
    }
    throw "Should have failed upon double initialization";
  });

  it("Game session is initialized!", async () => {
//    await initGameSession(userWallet, gameSessionAccountKeypair, 1000000);
    await initGameSession(userWallet, gameSessionAccountKeypair, 0);
  });

  it("Game session is saved!", async () => {

    await saveGameSession(userWallet, gameGlobalWallet, gameSessionAccountKeypair, 42, 1234);
  });
  
  it("SHOULD FAIL: Game session is initialized once again after saved & closed !", async () => {
    try {
      await initGameSession(userWallet, gameSessionAccountKeypair, 1000000);
    }
    catch {
        return;
    }
    throw "Should have failed upon session is initialized once again after saved & closed";
  });
/*
  it("SHOULD FAIL: Game session is saved twice!", async () => {
    try {
      await saveGameSession(userWallet, gameGlobalWallet, gameSessionAccountKeypair, 42, 1234);
    }
    catch {
        return;
    }
    throw "Should have failed upon session saving twice";
  });
  */
/*
  it("List of saved game sessions", async () => {
    const signatures = 
      await provider.connection.getSignaturesForAddress(userWallet.publicKey, {},'confirmed');

    for ( let i = 0; i < signatures.length; i++ ) {
      const sig = signatures[i].signature;
      const trans = await provider.connection.getTransaction(sig, {commitment: "confirmed"});
      if ( trans ) {
        console.log("transaction account keys: ", trans.transaction.message);
      }
    } 
  });
*/
async function initUserGameAccount(userWallet, userGameAccount) {      
  const tx = await program.rpc.initUserGameAccount(
    {
      accounts: {
        userGameAccount: userGameAccountKeypair.publicKey,
        userWallet: userWallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [userWallet, userGameAccount],
    }
  );
}
  

async function initGameSession(userWallet, sessionAccount, stake) {      
  const userBalanceBefore = await provider.connection.getBalance(userWallet.publicKey);
  const globalBalanceBefore = await provider.connection.getBalance(gameGlobalWallet.publicKey);
  
  console.log("User wallet before init: ", userBalanceBefore);
  console.log("Game account before init: ", globalBalanceBefore);

  const tx = await program.rpc.initGameSession(
    new anchor.BN(stake),
    {
      accounts: {
        gameSessionAccount: sessionAccount.publicKey,
        gameGlobalAccount: gameGlobalAccountKeypair.publicKey,
        userWallet: userWallet.publicKey,
        globalWallet: gameGlobalWallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [userWallet, sessionAccount],
    }
  );
  const userBalanceAfter = await provider.connection.getBalance(userWallet.publicKey);
  const globalBalanceAfter = await provider.connection.getBalance(gameGlobalWallet.publicKey);

  console.log("User wallet after init: ", userBalanceAfter, ", delta: ", userBalanceBefore - userBalanceAfter);
  console.log("Game account after init: ", globalBalanceAfter, ", delta: ", globalBalanceBefore - globalBalanceAfter);
/*
  const userBalanceAfter1 = await provider.connection.getBalance(userWallet.publicKey);
  const globalBalanceAfter1 = await provider.connection.getBalance(gameGlobalWallet.publicKey);

  console.log("User wallet after init: ", userBalanceAfter1, ", delta: ", userBalanceBefore - userBalanceAfter1);
  console.log("Game account after init: ", globalBalanceAfter1, ", delta: ", globalBalanceBefore - globalBalanceAfter1);
*/
}

async function saveToArweave(userPublicKey, data): Promise<string> {
  const serializedData = GameSessionArchive.serialize(data);

  console.log("SERIALIZED: ", serializedData);

  GameSessionArchive.deserialize(serializedData);

  const tx = await arweave.createTransaction({
    data: serializedData
  });
  console.log("Transaction DATa: ", tx.data);
  
  tx.addTag('App-Name', 'Stakan');
  tx.addTag('User', userPublicKey.toString());
  
  await arweave.transactions.sign(tx, arweaveWallet);
  await arweave.transactions.post(tx);

  await axios.get('http://localhost:1984/mine');

  const statusAfterPost = await arweave.transactions.getStatus(tx.id);
  console.log("status after post: ", statusAfterPost.confirmed);

  return statusAfterPost.status === 200 ? tx.id : undefined;
}

async function saveGameSession(userWallet, globalWallet, sessionAccount, score, duration) {
  const userBalanceBefore = await provider.connection.getBalance(userWallet.publicKey);
  const globalBalanceBefore = await provider.connection.getBalance(gameGlobalWallet.publicKey);
  
  console.log("User wallet before saving: ", userBalanceBefore);
  console.log("Game account before saving: ", globalBalanceBefore);

  const archiveId = await saveToArweave(userWallet.publicKey,
    { score, duration }
  );

  if (!archiveId) throw "Failed to create Arweave transaction";

  console.log("ARCHIVE ID: ", archiveId);

  const delay = time => new Promise(res=>setTimeout(res,time));
  let status = await arweave.transactions.getStatus(archiveId);
/*  for(let i = 0; i < 100; i++) {
    console.log("status: ", status);
    await delay(500);
  }
*/
  const edges = await GameSessionArchive.get(userWallet.publicKey);

//  edges.forEach(edge => console.log("edges: ", edge.node.data));

  const signers = [userWallet, globalWallet];
  const tx = await program.rpc.saveGameSession(
    new anchor.BN(score),
    new anchor.BN(duration),
    {
      accounts: {
        gameSessionAccount: sessionAccount.publicKey,
        gameGlobalAccount: gameGlobalAccountKeypair.publicKey,
        userGameAccount: userGameAccountKeypair.publicKey,
        userWallet: userWallet.publicKey,
        globalWallet: gameGlobalWallet.publicKey,
        systemProgram: SystemProgram.programId,
    },
    signers,
  });

  const userBalanceAfter = await provider.connection.getBalance(userWallet.publicKey);
  const globalBalanceAfter = await provider.connection.getBalance(gameGlobalWallet.publicKey);

  console.log("User wallet after saving: ", userBalanceAfter, ", delta: ", userBalanceBefore - userBalanceAfter);
  console.log("Game account after saving: ", globalBalanceAfter, ", delta: ", globalBalanceBefore - globalBalanceAfter);

  const signatures = 
    await provider.connection.getSignaturesForAddress(sessionAccount.publicKey, {},'confirmed');

  if (signatures.length !== signers.length) 
    throw "Failed to get transaction signature for game session, num. of signatures: " + signatures.length;
}

/*
  it("Short game loop run!", async () => {
    const interval = 400;
    const intervalId = simulateGameLoop(program, gameSessionAccountKeypair.publicKey, interval);
  
    setTimeout( async () => {
        clearInterval(intervalId);

        console.log("before saving session");

        console.log("User wallet before saving: ", 
          await provider.connection.getBalance(userWallet.publicKey));
        console.log("Program wallet before saving: ", 
          await provider.connection.getBalance(programWallet.publicKey));

        const tx = await program.rpc.saveGameSession(
          new anchor.BN(42),
          new anchor.BN(duration),
          {
            accounts: {
              gameSessionAccount: gameSessionAccountKeypair.publicKey,
              gameGlobalAccount: gameGlobalAccountKeypair.publicKey,
              userWalletForReward: userWallet.publicKey,
              globalWallet: programWallet.publicKey,
              systemProgram: SystemProgram.programId,
          },
//          signers: [],
          signers: [],
        });


      console.log("after saving: ");

      console.log("User wallet after saving: ", 
          await provider.connection.getBalance(userWallet.publicKey));
        console.log("Game account after saving: ", 
          await provider.connection.getBalance(programWallet.publicKey));

        const gameSession = 
          await program.account.gameSession.fetch(gameSessionAccountKeypair.publicKey);
  
        console.log("Game session after saved: ", gameSession);


        const gameGlobalAccount = 
          await program.account.gameGlobalState.fetch(gameGlobalAccountKeypair.publicKey);
  
        console.log("Game global account after saved: ", gameGlobalAccount);

        await program.rpc.closeGameSessionAccount(
          {
            accounts: {
              gameSessionAccount: gameSessionAccountKeypair.publicKey,
              userWallet: userWallet.publicKey,
              systemProgram: SystemProgram.programId,
          },
          signers: [userWallet],
        });

        console.log("after closing account");

        const signatures = 
      await provider.connection.getSignaturesForAddress(
        SystemProgram.programId,
 //       gameSessionAccountKeypair.publicKey, 
        {},
        'confirmed');
    console.log("After Game session transactions: ");
  
    for ( let i = 0; i < signatures.length; i++ ) {
      const sig = signatures[i].signature;
      const trans = await provider.connection.getTransaction(sig, {commitment: "confirmed"});
      if ( trans ) {
//        console.log("transaction account keys: ", trans);
      }
    }
    
      }, 4*interval + 10 
    );
  });
*/
  /*
  it("Transaction list!", async () => {
    
    console.log("Before Game session transactions: ");
    console.log("connection commitment: ", provider.connection.commitment);
    const signatures = 
      await provider.connection.getSignaturesForAddress(
        gameSessionAccountKeypair.publicKey, 
        {},
        'confirmed');
    console.log("After Game session transactions: ");
  
    for ( let i = 0; i < signatures.length; i++ ) {
      const sig = signatures[i].signature;
      const trans = await provider.connection.getTransaction(sig, {commitment: "confirmed"});
      if ( trans ) {
        console.log(trans);
      }
    }
  });
*/

});
