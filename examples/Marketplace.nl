contract Marketplace
st
    # State variables
    owner: address
    itemCount: uint256
    items: mapping(uint256 -> mapping(address -> uint256)) # itemId -> (seller -> price)
    listings: mapping(uint256 -> string) # itemId -> item name

    # Constructor
    def constructor(ownerAddress: address)
    st
        owner = ownerAddress
        itemCount = 0
    en

    # Function to add a new item to the marketplace
    def addItem(itemName: string, price: uint256)
    st
        if price <= 0
        {
            return false
        }

        listings[itemCount] = itemName
        items[itemCount][msg.sender] = price
        itemCount = itemCount + 1
        return true
    en

    # Function to get item details by itemId
    def getItem(itemId: uint256) view -> (string, address, uint256)
    st
        if !items[itemId][msg.sender]
        {
            return ("", address(0), 0)
        }

        return (listings[itemId], msg.sender, items[itemId][msg.sender])
    en

    # Function to buy an item
    def buyItem(itemId: uint256) payable
    st
        seller: address
        price: uint256
        price = items[itemId][msg.sender]

        if msg.value < price || price == 0
        {
            return false
        }

        seller = msg.sender
        items[itemId][msg.sender] = 0
        seller.transfer(price)
        return true
    en

    # Function to withdraw all funds for the owner
    def withdraw()
    st
        if msg.sender != owner
        {
            return
        }

        owner.transfer(address(this).balance)
    en
en
