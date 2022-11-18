// SPDX-License-Identifier: MIT
import "./NativeTokenReceiver.sol";
import "./TokenRecover.sol";

pragma solidity 0.8.9;

contract KingOfTheFools is NativeTokenReceiver, TokenRecover {
    uint lastDeposit = 0;
    address previousDepositor;

    receive() external override payable {
        emit ReceivedWithEmptyCalldata(_msgSender(), msg.value);
        process(msg.value);
    }

    fallback() external override payable {
        emit ReceivedByFallback(_msgSender(), msg.value);
        process(msg.value);
    }

    function process(uint value) private {
      require(value >= (15 * lastDeposit + 5) / (10), "Did not reach 1.5x more than previous deposit");
      if (previousDepositor != address(0)){
        payable(previousDepositor).transfer(value);
      }
      previousDepositor = _msgSender();
      lastDeposit = value;
    }
}
