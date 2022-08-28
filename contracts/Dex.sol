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
        orders.push(Order(nextOrderId, msg.sender, _ticker, _orderType, _amount, _price));
        nextOrderId.add(1);

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
}