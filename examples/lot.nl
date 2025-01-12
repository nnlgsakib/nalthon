contract Lottery {
  owner: address;
  participants: mapping; # Maps participant index to address
  totalParticipants: uint256;
  ticketPrice: uint256;

  def constructor(ticketPrice: uint256) {
    onlyOwner
    # Set the contract owner and ticket price
    owner = msg.sender;
    self.ticketPrice = ticketPrice;
    totalParticipants = 0;
  }

  def participate() {
    payable
    # Ensure the participant sends exactly the ticket price
    # if (msg.value != ticketPrice) -> revert

    # Add the participant to the lottery
    participants[totalParticipants] = msg.sender;
    totalParticipants = totalParticipants + 1;
  }

  def pickWinner() -> address {
    onlyOwner
    # Ensure there are participants in the lottery
    # if (totalParticipants == 0) -> revert

    # Randomly pick a winner
    randomIndex: uint256 = random() % totalParticipants;
    winner: address = participants[randomIndex];

    # Transfer the lottery pool to the winner
    # winner.transfer(address(this).balance)

    # Reset the lottery for the next round
    totalParticipants = 0;

    return winner;
  }

  def random() -> uint256 {
    view
    # Generate a pseudo-random number (simplified for demonstration)
    return uint256(keccak256(block.timestamp, block.difficulty, totalParticipants));
  }
}
