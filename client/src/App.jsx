import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";

function App() {
  const socket = io("http://localhost:5000");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isSignup, setIsSignup] = useState(false);
  const [leads, setLeads] = useState([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [selectedLead, setSelectedLead] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [message, setMessage] = useState("");

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [search, setSearch] = useState("");

  // add lead
 const addLead = async () => {
  const res = await axios.post("http://localhost:5000/leads",
    form, {
  headers: {
    Authorization: token,
  },
}
  );

  setLeads([res.data, ...leads]);
  setMessage("Lead added!");
setTimeout(() => setMessage(""), 2000);
};

const updateStatus = async (id, status) => {
  await axios.put(`http://localhost:5000/leads/${id}`,  {status}, {
  headers: {
    Authorization: token,
  },
}, {
  
  });

  setLeads((prev) =>
    prev.map((lead) =>
      lead._id === id ? { ...lead, status } : lead
    )
  );
};

const addNote = async () => {
  const res = await axios.post(
    `http://localhost:5000/leads/${selectedLead._id}/notes`,
    { text: noteText }, {
  headers: {
    Authorization: token,
  },
}
  );

  setSelectedLead(res.data);
  setNoteText("");

  setLeads((prev) =>
    prev.map((lead) =>
      lead._id === res.data._id ? res.data : lead
    )
  );
};

useEffect(() => {
  const getLeads = async () => {
    try {
      const res = await axios.get("http://localhost:5000/leads", {
        headers: {
          // Add 'Bearer ' before your token variable
          Authorization: `Bearer ${token}`, 
        },
      });
      setLeads(res.data);
    } catch (err) {
      console.error("Auth Error:", err.response?.status); // Helps you debug
    }
  };
  
  if (token) { // Only run if token exists to avoid immediate 401s
    getLeads();
  }
}, [token]); 

useEffect(() => {
  socket.on("newLead", (lead) => {
    setLeads((prev) => [lead, ...prev]);
    setMessage("New Lead Received 🚀");
  });

  return () => socket.off("newLead");
}, [socket]);


  const totalLeads = leads.length;

const closedLeads = leads.filter(
  (l) => l.status === "closed"
).length;

const conversionRate =
  totalLeads === 0
    ? 0
    : ((closedLeads / totalLeads) * 100).toFixed(1);

if (!token) {
  return (

    
    <div style={{ padding: 20 }}>
      <style>
        {`
          input {
            padding: 8px;
            margin: 5px;
          }
          button{
            padding: 8px;
            margin:5px;
            cursor: "pointer";
          }
        `}
      </style>
      <h2>{isSignup ? "Signup" : "Login"}</h2>

      {isSignup && (
        <input 
          placeholder="Name"
          onChange={(e) => (window.name = e.target.value)}
        />
      )}

      <input
        placeholder="Email"
        onChange={(e) => (window.email = e.target.value)}
      />

      <input
        placeholder="Password"
        type="password"
        onChange={(e) => (window.password = e.target.value)}
      />

      <br /><br />

      <button
        onClick={async () => {
          if (isSignup) {
            await axios.post("http://localhost:5000/signup", {
              name: window.name,
              email: window.email,
              password: window.password,
            });

            alert("Signup successful! Now login.");
            setIsSignup(false);
          } else {
            const res = await axios.post(
              "http://localhost:5000/login",
              {
                email: window.email,
                password: window.password,
              }
            );

            localStorage.setItem("token", res.data.token);
            setToken(res.data.token);
          }
        }}
      >
        {isSignup ? "Signup" : "Login"}
      </button>

      <br /><br />

      <p
        style={{ cursor: "pointer", color: "blue",backdropFilter:'blur(5px)' }}
        onClick={() => setIsSignup(!isSignup)}
      >
        {isSignup
          ? "Already have an account? Login"
          : "New user? Signup"}
      </p>
    </div>
  );
}

return (
  
  <div style={{ padding: 20,maxWidth: 1200, margin: "auto" }}>
    <style>
        {`
          input {
            padding: 8px;
            margin: 5px;
          }

          button,select{
            padding: 5px;
            margin-left: 5px;
            font-size:15px;
          }
          select > option{
          font-size: 13px;
          }
        `}
      </style>
    <button
  onClick={() => {
    localStorage.removeItem("token");
    setToken(null);
  }}
>
  Logout
</button>
    <div style={{ marginBottom: 20 }}>
  <h2>Dashboard</h2>

  <p>Total Leads: {totalLeads}</p>
  <p>Closed Leads: {closedLeads}</p>
  <p>Conversion Rate: {conversionRate}%</p>
</div>
    <h1>CRM Pipeline</h1>
    

    {message && (
  <div
    style={{
      position: "fixed",
      top: 20,
      right: 20,
      background: "#65ff68",
      color: "#000000",
      padding: 10,
      borderRadius: 5,
    }}
  >
    {message}
  </div>
)}

    {/* FORM */}
    <div style={{ marginBottom: 20 }}>
      <input
        placeholder="Name"
        onChange={(e) =>
          setForm({ ...form, name: e.target.value })
        }
      />
      <input
        placeholder="Email"
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
      />
      <button onClick={addLead}>Add Lead</button>
    </div>
    <div style={{ marginBottom: 20 }}>
  <input
    placeholder="Search..."
    onChange={(e) => setSearch(e.target.value)}
  />

  <select onChange={(e) => setFilterStatus(e.target.value)}>
    <option value="all">All Status</option>
    <option value="new">New</option>
    <option value="contacted">Contacted</option>
    <option value="qualified">Qualified</option>
    <option value="closed">Closed</option>
  </select>

  <select onChange={(e) => setFilterSource(e.target.value)}>
    <option value="all">All Sources</option>
    <option value="manual">Manual</option>
    <option value="facebook">Facebook</option>
    <option value="instagram">Instagram</option>
  </select>
    </div>

    <div style={{ display: "flex", gap: 20 }}>
      {["new", "contacted", "qualified", "closed"].map((status) => (
        <div
          key={status}
          style={{
            border: "1px solid gray",
            padding: 10,
            width: 200,
          }}
        >
          <h3>{status.toUpperCase()}</h3>

          {leads
  .filter((lead) => {
    if (filterStatus !== "all" && lead.status !== filterStatus)
      return false;

    if (filterSource !== "all" && lead.source !== filterSource)
      return false;

    if (
      search &&
      !lead.name.toLowerCase().includes(search.toLowerCase())
    )
      return false;

    return true;
  })
  .filter((lead) => lead.status === status)
            .map((lead) => (
              <div
                key={lead._id}
                style={{
                  border: "1px solid #ccc",
                  padding: 10,
                  borderRadius: 10,
                  background: "#f9f9f9",
                  marginBottom: 10,  
                }}
              >
                <b onClick={() => setSelectedLead(lead)} style={{ cursor: "pointer" }}>
                  {lead.name}
                </b>
                <p>Source: {lead.source}</p>
                <p>Assigned: {lead.assignedTo}</p>

                <br />

                <select
                  value={lead.status}
                  onChange={(e) =>
                    updateStatus(lead._id, e.target.value)
                  }
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                value={lead.source}
  onChange={(e) =>
    setForm({ ...form, source: e.target.value })
  }
>
  <option value="manual">Manual</option>
  <option value="facebook">Facebook</option>
  <option value="instagram">Instagram</option>
</select>
              </div>
            ))}

            
        </div>
      ))}

  
    </div>

        {selectedLead && (
  <div
    style={{
      position: "fixed",
      right: 0,
      top: 0,
      width: 300,
      height: "100vh",
      background: "#fff",
      borderLeft: "2px solid black",
      padding: 20,
    }}
  >
    <h2>{selectedLead.name}</h2>
    <p>{selectedLead.email}</p>

    <h3>Notes</h3>
    <input
      placeholder="Add note"
      value={noteText}
      onChange={(e) => setNoteText(e.target.value)}
    />

    <button onClick={addNote}>Add</button>

    <br />
    <br />

    <button onClick={() => setSelectedLead(null)}>
      Close
    </button>

    {selectedLead.notes?.map((note, i) => (
      <div key={i}>
        - {note.text}
      </div>
    ))}

    
  </div>
)}
  </div>
);


}

export default App;