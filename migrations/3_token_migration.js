const Link = artifacts.require("Link");
const Wallet = artifacts.require("Wallet");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(Link);
  
  // let link = await Link.deployed()
  // await wallet.addToken(web3.utils.fromUtf8("LINK"), link.address)
  // await wallet.deposit(web3.utils.fromUtf8("LINK"), 300)
  // let balanceOfLink = await wallet.balances(accounts[0], web3.utils.fromUtf8("LINK"))
  // console.log(balanceOfLink);
};
