// SPDX-License-Identifier: MIT
import "./NativeTokenReceiver.sol";
import "./TokenRecover.sol";
import "hardhat/console.sol";

pragma solidity 0.8.9;

contract KingOfTheFools is NativeTokenReceiver, TokenRecover {
    event EthDepositAccepted(address from, uint value);
    event DepositTranferred(address from, address to, uint value);

    uint private lastDeposit = 0;
    address private previousDepositor;

    receive() external override payable {
        emit ReceivedWithEmptyCalldata(_msgSender(), msg.value);
        processEthDeposit(msg.value);
    }

    // solhint-disable-next-line no-complex-fallback
    fallback() external override payable {
        emit ReceivedByFallback(_msgSender(), msg.value);
        processEthDeposit(msg.value);
    }

    function processEthDeposit(uint value) internal {
      require(value >= (15 * lastDeposit + 5) / (10), "Insufficient deposit");
      lastDeposit = value;
      address receiver = previousDepositor;
      address from = _msgSender();
      if (receiver != address(0)){
        payable(receiver).transfer(value);
        emit DepositTranferred(from, receiver, value);
      }
      previousDepositor = from;
      emit EthDepositAccepted(from, value);
    }
}
