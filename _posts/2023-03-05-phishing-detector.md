---
title: Phishing Detector – ML-Based Phishing Link Detection 
date: 2023-03-05 12:00:00 -500
categories: [Projects]
tags: [phishing, threat-detection, machine-learning]     # TAG names should always be lowercase
image:
  path: assets/attachments/phishing.png
---
## Overview  
Phishing Detector is a **machine learning-powered web application** designed to detect phishing links. Built using **Django**, the platform allows users to check URLs for potential phishing threats in real time. The ML model is trained on phishing datasets to distinguish between **malicious and legitimate links** effectively.  

## Features  
- **ML-Based Detection** – Analyzes URLs to classify them as phishing or safe.  
- **User-Friendly Interface** – Simple web UI for checking link security.  
- **Django-Powered Backend** – Efficient and scalable deployment.  
- **Real-Time Analysis** – Instant detection and classification of URLs.  

## Technologies Used  
- **Python** – Core programming language  
- **Machine Learning** – Model trained using phishing datasets  
- **Scikit-Learn** – ML library for model training and evaluation  
- **Django** – Web framework for backend implementation  
- **HTML/CSS** – Frontend for the user interface  

## Installation & Setup 
Follow these steps to set up and run the project locally:  
**Prerequisite:** Ensure you have **Python 3.11** installed on your system.  

1. Clone the Repository
   ```sh
    git clone https://github.com/Suryatejaeasari/Phishing-Detector.git
    cd phishing-detector
    ```
2. Create a Virtual Environment (Optional but Recommended)
   ```sh
   py -3.11 -m venv venv
   source venv/bin/activate  # For macOS/Linux
   venv\Scripts\activate     # For Windows
   ```
3. Install Dependencies
   ```sh
    pip install -r requirements.txt
   ```
4. Apply Migrations
   ```sh
   python manage.py migrate
   ```
5. Start the Django Server
   ```sh
   python manage.py runserver
   ```
The app will run on http://127.0.0.1:8000/

## Usage  
- Open the web app in your browser.
- Enter a URL in the provided field.
- Click **Submit** to analyze the link.
- The system will classify it as **Safe or Phishing** based on the ML model’s prediction.  

## Screenshots  
![img-description](https://github.com/user-attachments/assets/7cfd19ef-b7bd-40ca-8b18-3b2eea8a1ed6)
![img-description](https://github.com/user-attachments/assets/3766a6d0-4396-46c3-8abd-5d4288e58ae9)

## Future Enhancements  
- Improve model accuracy with **advanced feature engineering**.  
- Integrate an API for **real-time phishing detection**.  
- Deploy the model on a **cloud platform** for global accessibility.  
