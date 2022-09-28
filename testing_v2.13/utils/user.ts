import { wallet } from "@vite/vitejs";
import * as vuilder from "@vite/vuilder";

export function randomUser(provider: any) {
  return vuilder.newAccount(wallet.createMnemonics(), 0, provider);
}

export async function initValue(from: vuilder.UserAccount, to: vuilder.UserAccount, amount: string, tokenId: string="tti_5649544520544f4b454e6e40"){
  await from.sendToken(to.address, amount, tokenId);
  await to.receiveAll();
}

export function contractWithUser(
  user: vuilder.UserAccount,
  abi: any,
  contractAddress: string,
  contractName: string = "UnknownContract"
) {
  const result = new vuilder.Contract(contractName, "", abi);
  result.attach(contractAddress);
  result.setDeployer(user);
  result.setProvider(user._provider);
  return result;
}
