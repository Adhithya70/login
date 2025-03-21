import tkinter as tk
from tkinter import messagebox
import requests

def store_health_record():
    patient = patient_address.get()
    encrypted_data = health_data.get()

    response = requests.post("http://127.0.0.1:5000/store_record", json={
        "patient": patient,
        "encryptedData": encrypted_data
    })
    
    if response.status_code == 200:
        messagebox.showinfo("Success", "Health record stored successfully!")
    else:
        messagebox.showerror("Error", "Failed to store record")

root = tk.Tk()
root.title("Secure Health Record System")

tk.Label(root, text="Patient Address:").pack()
patient_address = tk.Entry(root)
patient_address.pack()

tk.Label(root, text="Encrypted Health Data:").pack()
health_data = tk.Entry(root)
health_data.pack()

tk.Button(root, text="Store Record", command=store_health_record).pack()

root.mainloop()
