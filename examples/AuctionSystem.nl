contract AuctionSystem st
  # State variables
  owner: address
  auctions: mapping(uint256 -> Auction)
  nextAuctionId: uint256

  struct Auction st
    item: string
    minBid: uint256
    highestBid: uint256
    highestBidder: address
    isActive: bool
    bids: mapping(address -> uint256)
  en

  # Constructor to set the owner
  def constructor() st
    owner = msg.sender  # Set deployer as the owner
    nextAuctionId = 0  # Initialize auction ID counter
  en

  # Function to create a new auction (onlyOwner)
  def createAuction(item: string, minBid: uint256) onlyOwner st
    auctions[nextAuctionId] = Auction(item, minBid, 0, address(0), true, {})
    nextAuctionId = nextAuctionId + 1
  en

  # Function to place a bid
  def placeBid(auctionId: uint256) payable st
    auction = auctions[auctionId]
    if auction.isActive && msg.value > auction.minBid && msg.value > auction.highestBid {
      # Refund previous highest bidder
      if auction.highestBidder != address(0) {
        auction.highestBidder.transfer(auction.highestBid)
      }
      auction.highestBid = msg.value
      auction.highestBidder = msg.sender
      auction.bids[msg.sender] = msg.value
    }
  en

  # Function to close an auction (onlyOwner)
  def closeAuction(auctionId: uint256) onlyOwner st
    auction = auctions[auctionId]
    if auction.isActive {
      auction.isActive = false
    }
  en

  # Function to withdraw funds from a closed auction (onlyOwner)
  def withdrawFunds(auctionId: uint256) onlyOwner st
    auction = auctions[auctionId]
    if !auction.isActive {
      owner.transfer(auction.highestBid)
      auction.highestBid = 0  # Reset funds
    }
  en

  # Function to get the details of an auction
  def getAuction(auctionId: uint256) view -> (string, uint256, uint256, address, bool) st
    auction = auctions[auctionId]
    return (auction.item, auction.minBid, auction.highestBid, auction.highestBidder, auction.isActive)
  en
en
