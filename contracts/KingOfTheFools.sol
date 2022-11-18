// SPDX-License-Identifier: MIT
import "./NativeTokenReceiver.sol";
import "./TokenRecover.sol";
import "hardhat/console.sol";

pragma solidity 0.8.9;

contract KingOfTheFools is NativeTokenReceiver, TokenRecover {
    event EthDepositAccepted(address from, uint value);

    uint lastDeposit = 0;
    address previousDepositor;

    receive() external override payable {
        emit ReceivedWithEmptyCalldata(_msgSender(), msg.value);
        processEthDeposit(msg.value);
    }

    fallback() external override payable {
        emit ReceivedByFallback(_msgSender(), msg.value);
        processEthDeposit(msg.value);
    }

    function processEthDeposit(uint value) private {
      require(value >= (15 * lastDeposit + 5) / (10), "Did not reach 1.5x more than previous deposit");
      if (previousDepositor != address(0)){
        payable(previousDepositor).transfer(value);
      }
      previousDepositor = _msgSender();
      lastDeposit = value;
      emit EthDepositAccepted(_msgSender(), value);
    }
}
