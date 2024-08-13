# Club-Hub Project

Welcome to the Club-Hub project repository. This README provides an overview of the project, including links to key project artifacts, installation instructions, and other essential information.

## Project Artifacts

All project artifacts are available through GitHub:

1. **Project Source Code**:  
   - Already uploaded to GitHub: [Club-Hub Source Code](https://github.com/SENECA-PRJ-CLUBHUB/Club-Hub)

2. **Project Technical Documents**:  
   - Already Uploaded to GitHub: [Technical Documents](https://github.com/SENECA-PRJ-CLUBHUB/Club-Hub/tree/main/TechnicalDocuments)

## Installation Instructions

Follow these steps to set up the Club-Hub project on your local machine:

1. **Clone the Repository**:  
   ```bash
   git clone https://github.com/SENECA-PRJ-CLUBHUB/Club-Hub.git

2. **Navigate to the Project Directory**:  
   ```bash
   cd Club-Hub

3. **Install Dependencies**:  
   Ensure you have Node.js installed. Then run:
   ```bash
   npm install

4. **Set Up Environment Variables**:  
   Create a `.env` file in the root directory and add the required environment variables as per your setup:
   ```plaintext
   PORT=8080
   MONGO_URL=mongodb+srv://nishy:nishy2511@cluster0.m4wqcgx.mongodb.net/
   SECRET_KEY=mnr6vpPGyA1
5. **Start the Server**:  
   Run the following command to start the development server:
   ```bash
   node server.js
- The application should now be running on http://localhost:8080.

6. **Login Credentials**:</br>
   You can try the app using the usernames and passwords shown below.
   ```bash
   Admin Username: Mathew
   Admin Password: admin_password
   
   Student1 Username : ysingh88
   Student1 Password : sprint4Demo

   Student1 Username : ypadwani89
   Student1 Password : sprint4Demo 

## Deviations from PRJ566

1. Admin Profiles
| Original Proposal : At first, it was agreed that separate administrators would oversee each club.
| Final Implementation : Every club is supervised by a single admin.

## Contact Information
For any questions or support, please reach out to the project leader:

Nishit Gaurang Shah: ngshah3@myseneca.ca

---

This project is developed as part of PRJ566 and PRJ666 courses at Seneca College.
