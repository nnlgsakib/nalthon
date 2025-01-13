contract EscrowSystem st
  # State variables
  owner: address
  escrowCount: uint256
  escrows: mapping(uint256 -> Escrow)

  struct Escrow st
    buyer: address
    seller: address
    amount: uint256
    isCompleted: bool
    isDisputed: bool
  en

  # Constructor to set the owner
  def constructor() st
    owner = msg.sender
    escrowCount = 0
  en

  # Function to create a new escrow
  def createEscrow(seller: address) payable st
    escrows[escrowCount] = Escrow(msg.sender, seller, msg.value, false, false)
    escrowCount = escrowCount + 1
  en

  # Function for the buyer to release funds to the seller
  def releaseFunds(escrowId: uint256) st
    escrow = escrows[escrowId]
    if msg.sender == escrow.buyer && !escrow.isCompleted && !escrow.isDisputed {
      escrow.seller.transfer(escrow.amount)
      escrow.isCompleted = true
    }
  en

  # Function for the buyer or seller to dispute the escrow
  def disputeEscrow(escrowId: uint256) st
    escrow = escrows[escrowId]
    if (msg.sender == escrow.buyer || msg.sender == escrow.seller) && !escrow.isCompleted {
      escrow.isDisputed = true
    }
  en

  # Function for the owner to resolve disputes
  def resolveDispute(escrowId: uint256, refundToBuyer: bool) onlyOwner st
    escrow = escrows[escrowId]
    if escrow.isDisputed && !escrow.isCompleted {
      if refundToBuyer {
        escrow.buyer.transfer(escrow.amount)
      } else {
        escrow.seller.transfer(escrow.amount)
      }
      escrow.isCompleted = true
    }
  en

  # Function to get details of an escrow
  def getEscrow(escrowId: uint256) view -> (address, address, uint256, bool, bool) st
    escrow = escrows[escrowId]
    return (escrow.buyer, escrow.seller, escrow.amount, escrow.isCompleted, escrow.isDisputed)
  en
en
