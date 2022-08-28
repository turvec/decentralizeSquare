pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "./Wallet.sol";

contract Dex is Wallet {
    using SafeMath for uint256;
    enum OrderType {
        BUY,
        SELL
    }

    struct Order{
        uint id;
        address trader;
        bytes32 ticker;
        OrderType orderType;
        uint amount;
        uint price;
        uint filled;
    }

    mapping(bytes32 => mapping(uint => Order[])) public orderBook;

    uint public nextOrderId = 0;

    function getOrderBook(bytes32 ticker, OrderType _orderType) public view returns(Order[] memory) {
        return orderBook[ticker][uint(_orderType)];
    }

    function createLimitOrder(OrderType _orderType, bytes32 _ticker, uint _amount, uint _price) external {
        if(_orderType == OrderType.BUY){
            require(balances[msg.sender]["ETH"] >= _amount.mul(_price));
        }else if(_orderType == OrderType.SELL){
            require(balances[msg.sender][_ticker] >= _amount);
        }

        //get and create a direct reference variable
        Order[] storage orders = orderBook[_ticker][uint(_orderType)];
        orders.push(Order(nextOrderId, msg.sender, _ticker, _orderType, _amount, _price, 0));
        nextOrderId = nextOrderId.add(1);

        //Sort the array using bubble sort(but no outer loop needed)
        if (_orderType == OrderType.BUY) {
            for (uint i = orders.length - 1; i > 0; i--) {
                if (orders[i].price < orders[i-1].price) {
                    break;
                }
                Order memory nextList = orders[i-1];
                orders[i-1] = orders[i];
                orders[i] = nextList;
            }
        } else if(_orderType == OrderType.SELL) {
            for (uint i = orders.length > 0 ? orders.length - 1 : 0; i > 0; i--) {
                if (orders[i].price > orders[i-1].price) {
                   break;
                }
                Order memory nextList = orders[i-1];
                orders[i-1] = orders[i];
                orders[i] = nextList;
            }
        }
    }

    function createMarketOrder(OrderType _orderType, bytes32 _ticker, uint _amount ) external {
        uint orderBookType;
        if (_orderType == OrderType.SELL ) {
            require(balances[msg.sender][_ticker] >= _amount,"Insufficient amount to make this request");
            orderBookType = 0;
        } else if (_orderType == OrderType.BUY ) {
            orderBookType = 1;
        }

        Order[] storage orders = orderBook[_ticker][orderBookType];

        uint totalFilled;

        for (uint i = 0; i < orders.length && totalFilled < _amount; i++) {
            //How much we can fill from orders[i]
            uint leftToFill = _amount.sub(totalFilled);
            uint availableAmount = orders[i].amount.sub(orders[i].filled);
            uint fillamount;
            if (availableAmount <= leftToFill) {
                fillamount = availableAmount;
            } else {
                fillamount = leftToFill;
            }
            
            //Execute the trade & shift balances between buyer/seller
            uint totalPrice = fillamount.mul(orders[i].price);
            if (_orderType == OrderType.BUY) {
                //Verify that the buyer has enough eth to cover the purchase
                require(balances[msg.sender]["ETH"] >= totalPrice,"Insufficient amount to make this request");
                balances[msg.sender]["ETH"] = balances[msg.sender]["ETH"].sub(totalPrice);
                balances[orders[i].trader]["ETH"] = balances[orders[i].trader]["ETH"].add(totalPrice);

                balances[orders[i].trader][_ticker] = balances[orders[i].trader][_ticker].sub(fillamount);
                balances[msg.sender][_ticker] = balances[msg.sender][_ticker].add(fillamount);

            }else if (_orderType == OrderType.SELL) {
                balances[msg.sender][_ticker] = balances[msg.sender][_ticker].sub(fillamount);
                balances[orders[i].trader][_ticker] = balances[orders[i].trader][_ticker].add(fillamount);

                balances[orders[i].trader]["ETH"] = balances[orders[i].trader]["ETH"].sub(totalPrice);
                balances[msg.sender]["ETH"] = balances[msg.sender]["ETH"].add(totalPrice);
            }
            
            //Update totalFilled and filled property
            totalFilled = totalFilled.add(fillamount);
            orders[i].filled = orders[i].filled.add(fillamount);

        }

        //Loop through the orderbook and remove the filled ones
        while( orders.length > 0 && orders[0].filled == orders[0].amount ){
            for (uint i = 0; i < orders.length - 1; i++) {
                orders[i] = orders[i+1];
            }
            orders.pop();
        }
    }
}