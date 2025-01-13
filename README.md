# Nalthon - A Custom Programming Language Compiler

Welcome to the Nalthon repository! This project contains a compiler for the Nalthon language, a language designed with simplicity and flexibility in mind. The compiler is built in TypeScript and is capable of parsing, tokenizing, and compiling code written in Nalthon into executable programs.

## About Nalthon

Nalthon is a custom programming language designed to be both beginner-friendly and powerful enough to support advanced use cases. It features a unique syntax and set of constructs aimed at providing developers with an efficient and intuitive experience.

## Features

- **Custom Syntax**: Nalthon syntax is clean and straightforward, making it easy to learn and use.
- **Full Compiler**: The compiler handles tokenization, parsing, and error reporting.
- **Extensible**: The language and compiler are designed to be extended easily for new features.

## Getting Started

1. **Clone the Repository**:

```shell
git clone https://github.com/nnlgsakib/nalthon.git
```
   

## Besic contract example 

**Here is an example of a Nalthon code snippet that you can compile with the Nalthon compiler:**

*besic storage*

```javascript
    # Simple Smart Contract Example: Storage and Addition

contract SimpleStorage st
  # State variable to store a number
  storedNumber: uint256

  # Constructor to initialize the stored number
  def constructor(initialValue: uint256) st
    storedNumber = initialValue
  en

  # Function to set a new value for storedNumber
  def setStoredNumber(newValue: uint256) st
    storedNumber = newValue
  en

  # Function to get the current stored value
  def getStoredNumber() view -> uint256 st
    return storedNumber
  en

  # Function to add two numbers and return the result
  def addNumbers(a: uint256, b: uint256) -> uint256 st
    return a + b
  en

en

```
*besic counter*

```javascript

contract Counter st
  count: uint256  # Counter value

  def constructor() st
    count = 0  # Initialize counter to 0
  en

  def increment(by: uint256 = 1) st
    count = count + by
  en

  def getCount() -> uint256 st
    return count
  en
en


```

## Contributing

Feel free to fork the repository and submit pull requests. Whether it's bug fixes, improvements, or new features, contributions are always welcome!

## License
This project is open-source and available under the MIT License.

Author
Name: NLG
GitHub: https://github.com/nnlgsakib
Contact
For any questions, feel free to reach out to me via GitHub.

Happy coding! 🚀



You can copy and paste this `README.md` content directly into your project. It provides a comprehensive introduction, installation steps, usage instructions, and contact information.
