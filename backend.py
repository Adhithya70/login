from flask import Flask, request, jsonify
from web3 import Web3
import mysql.connector

app = Flask(__name__)

# Connect to MySQL
db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="password",
    database="sec_health"
)
cursor = db.cursor()

# Connect to Ethereum Blockchain
w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
contract_address = "DEPLOYED_CONTRACT_ADDRESS"
abi = [...]  # ABI from Hardhat deployment

sec_health = w3.eth.contract(address=contract_address, abi=abi)

@app.route('/store_record', methods=['POST'])
def store_record():
    data = request.json
    patient = data['patient']
    encrypted_data = data['encryptedData']
    
    txn = sec_health.functions.storeRecord(encrypted_data).transact({'from': patient})
    txn_receipt = w3.eth.wait_for_transaction_receipt(txn)

    # Store metadata in MySQL
    cursor.execute("INSERT INTO records (patient_address, record_hash) VALUES (%s, %s)", 
                   (patient, encrypted_data))
    db.commit()

    return jsonify({"message": "Record stored successfully", "transaction": txn_receipt.transactionHash.hex()})

if __name__ == '__main__':
    app.run(debug=True)
