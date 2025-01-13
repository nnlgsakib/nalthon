contract LotterySystem st
  # State variables
  owner: address
  ticketPrice: uint256
  participants: address[]
  totalTickets: uint256

  # Constructor to initialize the lottery
  def constructor(initialTicketPrice: uint256) st
    owner = msg.sender
    ticketPrice = initialTicketPrice
    totalTickets = 0
  en

  # Function to buy a ticket
  def buyTicket() payable st
    if msg.value != ticketPrice {
      revert("Invalid ticket price")
    }
    participants.push(msg.sender)
    totalTickets = totalTickets + 1
  en

  # Function to pick a winner (onlyOwner)
  def pickWinner() onlyOwner -> address st
    if participants.length == 0 {
      revert("No participants to pick from")
    }
    randomIndex = random() % participants.length
    winner = participants[randomIndex]
    winner.transfer(address(this).balance) # Transfer all funds to the winner
    return winner
  en

  # Function to reset the lottery (onlyOwner)
  def resetLottery(newTicketPrice: uint256) onlyOwner st
    participants = []
    ticketPrice = newTicketPrice
    totalTickets = 0
  en

  # Helper function to generate a pseudo-random number
  def random() view -> uint256 st
    return uint256(keccak256(block.timestamp, block.difficulty, participants.length))
  en
en
