const Web3 = require('web3');
const readline = require('readline');
const mysql = require('mysql');
const contractAbi = require('../backend/ABI/abi.json');

// Initialize Web3 with your Avalanche testnet WebSocket endpoint
const web3 = new Web3('https://avalanche-fuji-c-chain.publicnode.com/');

// Replace with the address of your TetherToken contract
const contractAddress = '0xDB354d183120EBd4B3E43140fFC877Ea890f7Edb';

// Replace with the private key of the sender account
const privateKey = [process.env.PRIVATE_KEY];

// Create a Web3 account using the private key
const account = web3.eth.accounts.privateKeyToAccount(privateKey);
web3.eth.accounts.wallet.add(account);

// Create a contract instance
const tetherTokenContract = new web3.eth.Contract(contractAbi, contractAddress);

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Connect to your MySQL database
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'transaction_db',
});

// Function to get user input
function getUserInput(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to execute SQL queries
function executeQuery(query, values) {
  return new Promise((resolve, reject) => {
    connection.query(query, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

// Function to close the readline interface and database connection
function closeResources() {
  rl.close();
  connection.end();
}

// Function to perform ERC-20 token transfer
async function performTokenTransfer() {
  try {
    // Get user input for receivers address and transfer amount
    const recipientAddress = await getUserInput('Enter receiver address: ');
    const transferAmount = await getUserInput('Enter transfer amount: ');

    // Get the current gas price
    const gasPrice = await web3.eth.getGasPrice();

    // Build the transaction data
    const transactionData = tetherTokenContract.methods.transfer(recipientAddress, transferAmount).encodeABI();

    // Build the transaction object
    const txObject = {
      from: account.address,
      to: contractAddress,
      gas: 200000, // Adjust the gas limit accordingly
      gasPrice: gasPrice,
      data: transactionData,
    };

    // Sign the transaction
    const signedTransaction = await web3.eth.accounts.signTransaction(txObject, privateKey);

    // Send the signed transaction to the network
    const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
    console.log('Transaction submitted to the network. Receipt:', receipt);

    // Update database with transaction details
    await updateDatabase(receipt);
  } catch (error) {
    console.error('Error performing token transfer:', error);
  } finally {
    // Close the resources
    closeResources();
  }
}


// Function to perform ERC-20 token transferFrom
async function performTokenTransferFrom() {
  try {
    // Get user input for spender address and transfer amount
    const fromAddress= await getUserInput('Enter owner address: ');
    const spenderAddress = await getUserInput('Enter receiver address: ');
    const transferAmount = await getUserInput('Enter transfer amount: ');

    // Get the current gas price
    const gasPrice = await web3.eth.getGasPrice();

    // Build the transaction data
    const transactionData = tetherTokenContract.methods.transferFrom(account.address, spenderAddress, transferAmount).encodeABI();

    // Build the transaction object
    const txObject = {
      from: account.address,
      to: contractAddress,
      gas: 200000, // Adjust the gas limit accordingly
      gasPrice: gasPrice,
      data: transactionData,
    };

    // Sign the transaction
    const signedTransaction = await web3.eth.accounts.signTransaction(txObject, privateKey);

    // Send the signed transaction to the network
    const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
    console.log('TransferFrom transaction submitted to the network. Receipt:', receipt);

    // Update database with transaction details
    await updateDatabase(receipt);
  } catch (error) {
    console.error('Error performing transferFrom:', error);
  } finally {
    // Close the database connection
    closeResources();
  }
}

// Function to perform ERC-20 token approve
async function performTokenApprove() {
  try {
    // Get user input for spender address and approve amount
    const spenderAddress = await getUserInput('Enter spender address: ');
    const approveAmount = await getUserInput('Enter approve amount: ');

    // Get the current gas price
    const gasPrice = await web3.eth.getGasPrice();

    // Build the transaction data
    const transactionData = tetherTokenContract.methods.approve(spenderAddress, approveAmount).encodeABI();

    // Build the transaction object
    const txObject = {
      from: account.address,
      to: contractAddress,
      gas: 200000, // Adjust the gas limit accordingly
      gasPrice: gasPrice,
      data: transactionData,
    };

    // Sign the transaction
    const signedTransaction = await web3.eth.accounts.signTransaction(txObject, privateKey);

    // Send the signed transaction to the network
    const receipt = await web3.eth.sendSignedTransaction(signedTransaction.rawTransaction);
    console.log('Approve transaction submitted to the network. Receipt:', receipt);

    // Update database with transaction details
    await updateDatabase(receipt);
  } catch (error) {
    console.error('Error performing approve:', error);
  } finally {
    // Close the database connection
    closeResources();
  }
}

// Function to update the database with transaction details
async function updateDatabase(receipt) {
  const { transactionHash, blockNumber, from, to, status } = receipt;

  // Check if the table exists, if not create the table
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transactionHash VARCHAR(66) NOT NULL,
      blockNumber INT NOT NULL,
      senderAddress VARCHAR(42) NOT NULL,
      recipientAddress VARCHAR(42) NOT NULL,
      status VARCHAR(10) NOT NULL
    );
  `;
  await executeQuery(createTableQuery);

  // Insert transaction details into the database
  const insertQuery = `
    INSERT INTO transactions (transactionHash, blockNumber, senderAddress, recipientAddress, status)
    VALUES (?, ?, ?, ?, ?);
  `;
  await executeQuery(insertQuery, [transactionHash, blockNumber, from, to, status]);

  console.log('Transaction details updated in the database.');
}

// Call the ERC-20 token transfer function only if the database connection is successful
// ... (previous code)

// Function to display the menu and get user choice
async function displayMenu() {
  console.log('Choose an operation:');
  console.log('1. Token Transfer');
  console.log('2. Token TransferFrom');
  console.log('3. Token Approve');
  console.log('4. Exit');

  const choice = await getUserInput('Enter your choice (1-4): ');

  switch (choice) {
    case '1':
      await performTokenTransfer();
      break;
    case '2':
      await performTokenTransferFrom();
      break;
    case '3':
      await performTokenApprove();
      break;
    case '4':
      console.log('Exiting...');
      break;
    default:
      console.log('Invalid choice. Please enter a number between 1 and 4.');
      await displayMenu();
  }
}

// Call the displayMenu function after connecting to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    closeResources(); // Close resources if the database connection fails
  } else {
    console.log('Connected to MySQL');
    displayMenu(); // Display the menu for user choice
  }
});
