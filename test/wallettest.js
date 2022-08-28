const DEX = artifacts.require("Dex")
const Link = artifacts.require("Link")
const truffleAsserts = require("truffle-assertions")

contract.skip("Dex", accounts => {
    it("should only be possible for owner to add tokens", async () => {
        let dex = await DEX.deployed()
        let link = await Link.deployed()
        await truffleAsserts.passes(dex.addToken(web3.utils.fromUtf8("LINK"), link.address));
        await truffleAsserts.reverts(dex.addToken(web3.utils.fromUtf8("LINK"), link.address, {from: accounts[1]}));
    })

    it("should deposit correctly", async () => {
        let dex = await DEX.deployed()
        let link = await Link.deployed()
        await link.approve(dex.address, 300)
        await dex.deposit(200, web3.utils.fromUtf8("LINK"))
        let balance = await dex.balances(accounts[0], web3.utils.fromUtf8("LINK"))
        assert.equal(balance.toNumber(), 200);
    })

    it("should handle faulty withdrawals correctly", async () => {
        let dex = await DEX.deployed()
        truffleAsserts.reverts(dex.withdraw(300, web3.utils.fromUtf8("LINK")))
    })

    it("should handle right withdrawals correctly", async () => {
        let dex = await DEX.deployed()
        truffleAsserts.passes(dex.withdraw(200, web3.utils.fromUtf8("LINK")))
    })
})