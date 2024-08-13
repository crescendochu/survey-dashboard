import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import UserLogPage from './components/UserLogPage';
import { db } from './firebaseConfig';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import './App.css';

// Replace these with your actual IP addresses
const MY_IP_ADDRESS_1 = '18.29.47.47';
const MY_IP_ADDRESS_2 = '130.44.181.246';
const MY_IP_ADDRESS_3 ='18.29.30.113';

function App() {
  const [emailData, setEmailData] = useState([]);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        // Create a query to fetch a larger set of entries
        const q = query(
          collection(db, "surveyAnswers0727"),
          // orderBy("ipAddress","desc"),
          orderBy("timestamp", "desc"),
          limit(10000) // Fetch more than 5 to ensure uniqueness
        );

        const querySnapshot = await getDocs(q);
        const emailMap = new Map();

        querySnapshot.forEach(doc => {
          const email = doc.data().email;
          const ipAddress = doc.data().ipAddress;
          const timestamp = doc.data().timestamp;

          // Filter out entries from specific IP addresses
          if (email && ipAddress && ipAddress !== MY_IP_ADDRESS_1 && ipAddress !== MY_IP_ADDRESS_2 && ipAddress !== MY_IP_ADDRESS_3) {
            // Only add to the map if the email is not already present
            if (!emailMap.has(email)) {
              emailMap.set(email, { email, ipAddress, timestamp });
            }
          }
        });

        // Convert map to array, sort by timestamp, and limit to the last 5 entries
        const uniqueEmailData = Array.from(emailMap.values())
          .sort((a, b) => b.timestamp - a.timestamp)
          // .slice(0, 20);

        setEmailData(uniqueEmailData);
      } catch (error) {
        console.error("Error fetching emails: ", error);
      }
    };

    fetchEmails();
  }, []);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Route for the main page */}
          <Route path="/" element={<EmailList emailData={emailData} />} />
          {/* Route for the user log page */}
          <Route path="/logs/:email" element={<UserLogPage />} />
        </Routes>
      </div>
    </Router>
  );
}

function EmailList({ emailData }) {
  return (
    <div>
      <h1>Responses</h1>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>IP Address</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {emailData.map((data, index) => (
            <tr key={index}>
              <td>{data.email}</td>
              <td>{data.ipAddress}</td>
              <td><Link to={`/logs/${encodeURIComponent(data.email)}`}>View Logs</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
