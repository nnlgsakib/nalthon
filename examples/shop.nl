contract ClothStore {
  owner: address;
  prices: mapping;
  stock: mapping;

  def constructor() {
    onlyOwner
    # Set the contract owner
    owner = msg.sender;
  }

  def addItem(itemId: uint256, price: uint256, quantity: uint256) {
    onlyOwner
    # Creates or updates an item with its price and available stock
    prices[itemId] = price;
    stock[itemId] = quantity;
  }

  def buyItem(itemId: uint256, qty: uint256) {
    payable
    # 1. Check if enough items are in stock
    # 2. Check if msg.value >= (price * qty)
    # 3. Decrease the stock
    # if (stock[itemId] < qty) -> revert
    # if (msg.value < prices[itemId] * qty) -> revert

    stock[itemId] = stock[itemId] - qty;
  }

  def setPrice(itemId: uint256, newPrice: uint256) {
    onlyOwner
    prices[itemId] = newPrice;
  }

  def getPrice(itemId: uint256) -> uint256 {
    view
    return prices[itemId];
  }

  def getStock(itemId: uint256) -> uint256 {
    view
    return stock[itemId];
  }
}
