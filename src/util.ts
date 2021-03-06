import { ZapProvider } from "@zapjs/provider";
import { ZapSubscriber } from "@zapjs/subscriber";
const {fromWei, hexToUtf8}  = require("web3-utils")
import { join } from "path";
import * as readline from "readline";

/**
 * Ask a question and receive the result in stdin
 *
 * @param question - The question to ask
 * @return A promise resolved with the answer
 */
export function ask(question: string): Promise<string> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise((resolve, reject) => {
		rl.question(question, (answer: string) => {
			rl.close();
			resolve(answer);
		});
	});
}

/**
 * Promise that is resolved after a certain timeout
 *
 * @param timeout - Amount of ms to wait
 */
export function sleep(timeout: number): Promise<void> {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, timeout);
	})
}

/**
 * Loads the first account from the current loaded provider in a web3 instance
 *
 * @param web3 - Web3 instance to load accounts from
 * @returns The first account found
 */
export async function loadAccount(web3: any): Promise<string> {
	const accounts: string[] = await web3.eth.getAccounts();

	if ( accounts.length == 0 ) {
		console.error('Unable to find an account in the current web3 provider');
		process.exit(1);

		return "";
	}

	return accounts[0];
}

/**
 * Loads a ZapProvider from a given Web3 instance
 *
 * @param web3 - Web3 instance to load from
 * @returns ZapProvider instantiated
 */
export async function loadProvider(web3: any, owner: string|any): Promise<ZapProvider> {
	const contracts = {
		networkId: (await web3.eth.net.getId()).toString(),
		networkProvider: web3.currentProvider,
	};
	return new ZapProvider(owner, contracts);
}

/**
 * Loads a ZapProvider from a given Web3 instance
 *
 * @param web3 - Web3 instance to load from
 * @returns ZapProvider instantiated
 */
export async function loadSubscriber(web3: any, owner: string): Promise<ZapSubscriber> {
	const contracts = {
		artifactsDir: join(__dirname, '../', 'node_modules/@zapjs/artifacts/contracts/'),
		networkId: (await web3.eth.net.getId()).toString(),
		networkProvider: web3.currentProvider,
	};

	const handler = {
		handleIncoming: (data: string) => {
			console.log('handleIncoming', data);
		},
		handleUnsubscription: (data: string) => {
			console.log('handleUnsubscription', data);
		},
		handleSubscription: (data: string) => {
			console.log('handleSubscription', data);
		},
	};

	return new ZapSubscriber(owner, Object.assign(contracts, { handler }));
}

/**
 * View the info about a specific curve
 * @param web3 - Web3 instance to use
 */
export async function viewInfo({web3}: any) {
    const account: string = await loadAccount(web3);
    const subscriber: ZapSubscriber = await loadSubscriber(web3, account);
    const provider: ZapProvider = await loadProvider(web3, account);
    console.log(`Address: ${account}`);
    try{
        let title = await provider.getTitle();
        if(!!!title) throw "not existed"
        let pubkey = await provider.getPubkey()
        let endpoints = await provider.getEndpoints()
        console.log(`Provider is existed in Registry : \nTitle: ${title}, \nPublic Key : ${pubkey}\nEndpoints: ${endpoints}`)
    }catch(e){
        console.log("Provider is not existed with this account")
    }
    console.log(`ETH Balance: ${fromWei(await web3.eth.getBalance(account))} ETH`);
    console.log(`ZAP Balance: ${fromWei(await subscriber.getZapBalance())} ZAP`);
}

export async function getProviderInfo({web3}:any,{address}:any){
    // console.log(address)
    let provider = await loadProvider(web3, address);
		let providerParams:any={}
    try{
        let EP:any={}
        let title = await provider.getTitle();
        if(!!!title) throw "not existed"
        let pubkey = await provider.getPubkey()
        let endpoints = await provider.getEndpoints()
        let params = await provider.getAllProviderParams()
				for(let p of params){
					providerParams[hexToUtf8(p)] = hexToUtf8(await provider.getProviderParam(hexToUtf8(p)))
				}
        for(let e of endpoints) {
            EP[e] = {}
            EP[e]['Bonding Curve'] = await provider.getCurve(e)
            EP[e]['ZapBound'] = await provider.getZapBound(e)
            EP[e]['Params'] = (await provider.getEndpointParams(e)).map(i=>{return hexToUtf8(i)})
        }
        console.log(`Provider is existed in Registry :
            \nOwner: ${provider.providerOwner}
            \nTitle: ${title},
            \nPublic Key : ${pubkey}
            \nParams :`)
						console.dir(providerParams,{depth:null})
						console.log(`\nEndpoints: ${endpoints}`)
            console.dir(EP,{depth:null})
    }catch(e){
        console.error(e)
        console.log("Provider is not existed with this account")
    }
}
