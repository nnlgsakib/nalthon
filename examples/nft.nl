contract SimpleNFT {
  owner: address;
  tokenOwners: mapping; # Maps tokenId to the owner address
  tokenURIs: mapping;   # Maps tokenId to the token URI
  totalSupply: uint256;

  def constructor() {
    onlyOwner
    # Set the contract owner and initialize total supply to 0
    owner = msg.sender;
    totalSupply = 0;
  }

  def mint(to: address, tokenId: uint256, tokenURI: string) {
    onlyOwner
    # Mint a new NFT with a unique tokenId and associate a token URI
    # if (tokenOwners[tokenId]) -> revert  # Ensure tokenId is unique
    tokenOwners[tokenId] = to;
    tokenURIs[tokenId] = tokenURI;
    totalSupply = totalSupply + 1;
  }

  def transfer(from: address, to: address, tokenId: uint256) {
    payable
    # Ensure the sender is the owner of the token
    # if (tokenOwners[tokenId] != from) -> revert
    tokenOwners[tokenId] = to;
  }

  def ownerOf(tokenId: uint256) -> address {
    view
    # Return the owner of a specific tokenId
    return tokenOwners[tokenId];
  }

  def tokenURI(tokenId: uint256) -> string {
    view
    # Return the metadata URI of the token
    return tokenURIs[tokenId];
  }

  def getTotalSupply() -> uint256 {
    view
    # Return the total number of NFTs minted
    return totalSupply;
  }
}
