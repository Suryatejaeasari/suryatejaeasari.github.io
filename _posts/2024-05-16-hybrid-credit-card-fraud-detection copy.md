---
title: Advancing Financial Security - A Hybrid Fusion of Neural Network & Rule-Based System
date: 2024-05-16 12:00:00 -500
categories: [Projects]
tags: [machine-learning, neural-networks, fraud-detection, python, rule-based-system]     # TAG names should always be lowercase
image:
  path: assets/attachments/fraud_detection.png
---

**Published in:** [Journal of Information and Optimization Sciences (JIOS), Taru Publications](https://www.tarupublications.com/doi/10.47974/JIOS-1932)  
**DOI:** [10.47974/JIOS-1932](https://www.tarupublications.com/doi/10.47974/JIOS-1932)  

## Overview  
This project implements a **hybrid fraud detection system** that integrates:  
- **Neural Network** for learning fraud patterns  
- **Rule-Based System** for improved interpretability & accuracy  

The hybrid system improves **accuracy to 98.41%**, outperforming traditional models by leveraging both **AI-based detection** and **human-understandable rules**.  


## Dataset Used  
- **IEEE-CIS 2019 Credit Card Fraud Detection Dataset**  
- Available on Kaggle: [🔗 IEEE Fraud Detection Dataset](https://www.kaggle.com/competitions/ieee-fraud-detection/data)

## **How It Works**  
1. **Model Training** (`training.py`)  
   - The **deep learning model** is trained on transaction data.  
   - **Techniques used**: Log transformation, focal loss, Nadam optimizer.  
   - The trained model detects fraudulent transactions based on patterns in the data.  

2. **Hybrid Integration** (`hybrid.py`)  
   - The trained model’s predictions are passed to the **rule-based system**.  
   - The system applies **expert-defined fraud detection rules** to refine results.  
   - This improves interpretability and reduces false positives.


## Features  
- **Neural Network Training**: Uses **log transformation, focal loss, and Nadam optimizer**  
- **Rule-Based System**: Applies expert-defined fraud detection rules  
- **Hybrid Approach**: Improves model performance & interpretability  
- **Optimized for Real-World Fraud Detection**  

## Technologies Used  
- **Python 3.12.9**  
- **TensorFlow/Keras**  
- **Scikit-Learn**  
- **Pandas & NumPy**  
- **Matplotlib & Seaborn**  


## Installation Guide  

1. Clone the Repository
   ```sh
    git clone https://github.com/Suryatejaeasari/Hybrid-Credit-Card-Fraud-Detection.git
    cd Hybrid-Credit-Card-Fraud-Detection
    ```
2. Create a Virtual Environment (Optional but Recommended)
   ```sh
   python -m venv venv
   source venv/bin/activate  # For macOS/Linux
   venv\Scripts\activate     # For Windows
   ```
3. Install Dependencies
   ```sh
    pip install -r requirements.txt
   ```
4. Run the Project
   ```sh
   python training.py  # Train the model
   python hybrid.py  # Apply rule-based system

   ```