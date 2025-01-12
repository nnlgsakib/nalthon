contract BatchSender {
  owner: address;

  def constructor() {
    onlyOwner
    # Set the contract owner
    owner = msg.sender;
  }

  def batchSendETH(recipients: address[], amounts: uint256[]) {
    payable
    # Ensure the number of recipients matches the number of amounts
    # if (recipients.length != amounts.length) -> revert

    totalAmount: uint256 = 0;

    # Calculate the total amount to be sent
    for i in range(0, recipients.length) {
      totalAmount = totalAmount + amounts[i];
    }

    # Ensure the contract has enough ETH to send
    # if (address(this).balance < totalAmount) -> revert

    # Transfer ETH to each recipient
    for i in range(0, recipients.length) {
      # recipients[i].transfer(amounts[i])
    }
  }

  def batchSendTokens(token: address, recipients: address[], amounts: uint256[]) {
    onlyOwner
    # Ensure the number of recipients matches the number of amounts
    # if (recipients.length != amounts.length) -> revert

    # Transfer tokens to each recipient
    for i in range(0, recipients.length) {
      # token.call(abi.encodeWithSignature("transfer(address,uint256)", recipients[i], amounts[i]))
    }
  }

  def checkBalance() -> uint256 {
    view
    # Return the contract's ETH balance
    return address(this).balance;
  }
}
