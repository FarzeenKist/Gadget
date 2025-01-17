import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "./components/Navbar";
import { useState, useEffect } from "react";

import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import IERC from "./contract/IERC.abi.json";
import Gadget from "./contract/Gadget.abi.json";
import CreateGadget from "./components/CreateGadget";
import Gadgets from "./components/Gadgets";

const ERC20_DECIMALS = 18;

const contractAddress = "0xe535F77830beF5e20946356a47c161c6664f930C";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

function App() {
	const [contract, setcontract] = useState(null);
	const [address, setAddress] = useState(null);
	const [kit, setKit] = useState(null);
	const [cUSDBalance, setcUSDBalance] = useState(0);
	const [gadgets, setGadgets] = useState([]);

	const connectToWallet = async () => {
		if (window.celo) {
			try {
				await window.celo.enable();
				const web3 = new Web3(window.celo);
				let kit = newKitFromWeb3(web3);

				const accounts = await kit.web3.eth.getAccounts();
				const user_address = accounts[0];

				kit.defaultAccount = user_address;

				await setAddress(user_address);
				await setKit(kit);
			} catch (error) {
				console.log(error);
			}
		} else {
			console.log("Error Occurred");
		}
	};

	useEffect(() => {
		connectToWallet();
	}, []);

	useEffect(() => {
		if (kit && address) {
			getBalance();
		}
	}, [kit, address]);

	useEffect(() => {
		if (contract) {
			getGadget();
		}
	}, [contract]);

	const getBalance = async () => {
		try {
			const balance = await kit.getTotalBalance(address);
			const USDBalance = balance.cUSD
				.shiftedBy(-ERC20_DECIMALS)
				.toFixed(2);
			const contract = new kit.web3.eth.Contract(
				Gadget,
				contractAddress
			);
			setcontract(contract);
			setcUSDBalance(USDBalance);
		} catch (error) {
			console.log(error);
		}
	};

	const getGadget = async () => {
		const gadgetsLength = await contract.methods.getgadgetsLength().call();
		const _gadgett = [];
		for (let index = 0; index < gadgetsLength; index++) {
			let _gadgets= new Promise(async (resolve, reject) => {
				let gadget = await contract.methods.getGadget(index).call();

				resolve({
					index: index,
					owner: gadget[0],
					gadgetId:gadget[1],
					image:gadget[2],
					name:gadget[3],
					description:gadget[4],
					price: gadget[5],
					like: gadget[6]
					 
				});
			});
			_gadgett.push(_gadgets);
		}
		const _gadgets = await Promise.all(_gadgett);
		setGadgets(_gadgets);
	};

	const AddGadget = async (_image, _name, _description, price) => {
		const _price = new BigNumber(price)
			.shiftedBy(ERC20_DECIMALS)
			.toString();
		try {
			await contract.methods
				.addGadget(_image, _name, _description, _price)
				.send({ from: address });
			getGadget();
		} catch (error) {
			console.log(error);
		}
	};
 
 

	const buyGadget= async (_index) => {
		try {
			const cUSDContract = new kit.web3.eth.Contract(
				IERC,
				cUSDContractAddress
			);

			await cUSDContract.methods
				.approve(contractAddress, gadgets[_index].price)
				.send({ from: address });
			await contract.methods.buyGadget(_index).send({ from: address });
			getGadget();
			getBalance();
		} catch (error) {
			console.log(error);
		}
	};
	
	const RemoveGadget = async (_index) => {
		try {
		  await contract.methods.RemoveGadget(_index).send({ from: address });
		  getGadget();
		  getBalance();
		} catch (error) {
		  alert(error);
		}};

		const Like= async (_index) => {
		  try {
			await contract.methods.Like(_index).send({ from: address });
			getGadget();
			getBalance();
		  } catch (error) {
			alert.log(error);
		  }};
	return (
		<div>
			<Navbar balance={cUSDBalance} />
			
				<Gadgets gadgets={gadgets}
				buyGadget={buyGadget}
				RemoveGadget={RemoveGadget}
				Like={Like}
			/>
			<CreateGadget AddGadget={AddGadget} />
		</div>
	);
}

export default App;