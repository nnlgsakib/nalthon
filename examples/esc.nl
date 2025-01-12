contract Escrow {
  owner: address;
  payer: address;
  payee: address;
  amount: uint256;
  isPaid: bool;

  def constructor(payer: address, payee: address, amount: uint256) {
    onlyOwner
    # Set the initial contract participants and amount
    owner = msg.sender;
    self.payer = payer;
    self.payee = payee;
    self.amount = amount;
    isPaid = false;
  }

  def deposit() {
    payable
    # Ensure the sender is the payer and sends the exact amount
    # if (msg.sender != payer) -> revert
    # if (msg.value != amount) -> revert

    isPaid = true;
  }

  def releaseFunds() {
    onlyOwner
    # Ensure the payment has been made
    # if (!isPaid) -> revert

    # Transfer funds to the payee
    # payee.transfer(amount)

    # Reset contract state
    isPaid = false;
  }

  def cancel() {
    onlyOwner
    # Ensure the payment has not been made yet
    # if (isPaid) -> revert

    # Reset contract state and allow the payer to reclaim funds
    # payer.transfer(address(this).balance)
  }

  def checkBalance() -> uint256 {
    view
    # Return the contract's balance
    return address(this).balance;
  }
}
