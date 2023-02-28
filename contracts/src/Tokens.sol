// SPDX-License-Identifier: AGPL-1.0
pragma solidity 0.8.17;

import "solidity-kit/solc_0.8/ERC20/implementations/ERC20Base.sol";
import "solidity-kit/solc_0.8/ERC20/ERC2612/implementations/UsingPermitWithDynamicChainID.sol";

contract Tokens is ERC20Base, UsingPermitWithDynamicChainID {
	constructor(address to, uint256 amount) UsingPermitWithDynamicChainID(address(0)) {
		_mint(to, amount);
	}

	string public constant symbol = "TOKENS";

	function name() public pure override(Named, IERC20) returns (string memory) {
		return "Tokens";
	}
}
