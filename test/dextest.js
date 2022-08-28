const Dex = artifacts.require("Dex")
const Link = artifacts.require("Link");
const truffleAsserts = require("truffle-assertions")

contract.skip("Dex", accounts => {
    //User most have have ETH deposited such that deposited eth >= BUY order value
    it("should throw an error when Eth balance in the wallet is too low when creating a BUY limit order", async () => {
        let dex = await Dex.deployed()
        await truffleAsserts.reverts(
            dex.createLimitOrder(0, web3.utils.fromUtf8('LINK'), 10, 1)
        )
        await dex.depositEth({value: 10})
        await truffleAsserts.passes(
            dex.createLimitOrder(0, web3.utils.fromUtf8('LINK'), 10, 1)
        )
    })

    //The user most have have token deposited such that token balance >= SELL order value
    it("should throw an error if token balance in the wallet is too low when creating a SELL limit order", async () => {
        let dex = await Dex.deployed()
        let link = await Link.deployed()
        await truffleAsserts.reverts(
            dex.createLimitOrder(1, web3.utils.fromUtf8('LINK'), 10, 1)
        )
        await link.approve(dex.address, 500)
        await dex.addToken(web3.utils.fromUtf8("LINK"), link.address)
        await dex.deposit(50, web3.utils.fromUtf8("LINK"))
        await truffleAsserts.passes(
            dex.createLimitOrder(1, web3.utils.fromUtf8('LINK'), 10, 1)
        )

    })

    //The BUY order book should be ordered by price from highest to lowest starting at index 0
    it("The BUY order book should be ordered by price from highest to lowest starting at index 0", async () => {
        let dex = await Dex.deployed()
        let link = await Link.deployed()
        await link.approve(dex.address, 500)
        await dex.depositEth({value: 3000})
        await dex.createLimitOrder(0, web3.utils.fromUtf8('LINK'), 1, 300)
        await dex.createLimitOrder(0, web3.utils.fromUtf8('LINK'), 1, 100)
        await dex.createLimitOrder(0, web3.utils.fromUtf8('LINK'), 1, 200)

        let orderbook = await dex.getOrderBook(web3.utils.fromUtf8('LINK'), 0);
        assert(orderbook.length>0);
        console.log(orderbook)
        for (let i = 0; i < orderbook.length - 1; i++) {
            assert(orderbook[i].price >= orderbook[i+1].price, "BUY orderbook not ordered correctly")
        }

    })

    //The SELL order book should be ordered by price from lowest to highest starting at index 0
    it("The SELL order book should be ordered by price from lowest to highest starting at index 0", async () => {
        let dex = await Dex.deployed()
        let link = await Link.deployed()
        await link.approve(dex.address, 500)
        await dex.addToken(web3.utils.fromUtf8("LINK"), link.address)
        await dex.deposit(2000, web3.utils.fromUtf8("LINK"))
        await dex.createLimitOrder(1, web3.utils.fromUtf8('LINK'), 1, 300)
        await dex.createLimitOrder(1, web3.utils.fromUtf8('LINK'), 1, 100)
        await dex.createLimitOrder(1, web3.utils.fromUtf8('LINK'), 1, 200)

        let orderbook = await dex.getOrderBook(web3.utils.fromUtf8('LINK'), 1);
        assert(orderbook.length>0);
        console.log(orderbook)
        for (let i = 0; i < orderbook.length - 1; i++) {
            assert(orderbook[i].price <= orderbook[i+1].price, "SELL orderbook not ordered correctly")
        }

    })

    //When creating a sell market order, the seller needs to have enough token for the trade
    it("When creating a sell market order, the seller needs to have enough token for the trade", async () => {
        let dex = await Dex.deployed()
        let link = await Link.deployed()
        await link.approve(dex.address, 500)
        await dex.addToken(web3.utils.fromUtf8("LINK"), link.address)
        await dex.deposit(100, web3.utils.fromUtf8("LINK"))
        await truffleAsserts.reverts(dex.createMarketOrder(1, web3.utils.fromUtf8('LINK'), 200));
        await truffleAsserts.passes(dex.createMarketOrder(1, web3.utils.fromUtf8('LINK'), 100));
    })
    //When creating a buy market order, the buyer needs to have enough eth for the trade
    it("When creating a buy market order, the buyer needs to have enough eth for the trade", async () => {
        let dex = await Dex.deployed()
        await truffleAsserts.reverts(dex.createMarketOrder(0, web3.utils.fromUtf8('LINK'), 200));
        await truffleAsserts.passes(dex.createMarketOrder(0, web3.utils.fromUtf8('LINK'), 100));
    })
    //Market order can be created when the orderbook is empty
    
    //Market order should be executed until it is 100% filled or the orderbook is empty
    //final eth trade amount should be removed from the buyer eth balance
    //final token trade amount should be removed from the seller token balance
    //filled or traded limit orders in the orderbook should be removed

})