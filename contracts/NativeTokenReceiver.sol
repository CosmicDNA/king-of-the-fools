// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./OwnershipByAccessControl.sol";

contract NativeTokenReceiver is OwnershipByAccessControl {
    event ReceivedWithEmptyCalldata(address from, uint256 value);
    event ReceivedByFallback(address from, uint256 value);

    receive() external payable virtual {
        emit ReceivedWithEmptyCalldata(msg.sender, msg.value);
    }

    fallback() external payable virtual {
        emit ReceivedByFallback(msg.sender, msg.value);
    }

    // Function to withdraw all Native tokens from this contract.
    function withdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        // get the amount of Native tokens stored in this contract
        uint256 amount = address(this).balance;

        // send all Native tokens to owner
        payable(owner).transfer(amount);
    }
}
