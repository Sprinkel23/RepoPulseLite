import { useState } from "react";
import "./style.css";

function App() {

  const [repoUrl, setRepoUrl] = useState("");
  const [repoData, setRepoData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);


  const analyzeRepo = async () => {

    if (!repoUrl) {
      setMessage("Please enter GitHub repository URL");
      return;
    }


    try {

      setLoading(true);
      setMessage("");
      setRepoData(null);


      const response = await fetch(
        "http://127.0.0.1:8000/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            repo_url: repoUrl
          })
        }
      );


      const data = await response.json();


      if (data.error) {
        setMessage(data.error);
      }
      else {
        setRepoData(data);
      }


    }
    catch(error) {

  console.log(error);
  setMessage("ERROR: " + error.message);

}
    finally {

      setLoading(false);

    }

  };



  const downloadReport = async () => {


    if (!repoData) {
      alert("Analyze repository first");
      return;
    }


    const response = await fetch(
      "http://127.0.0.1:8000/generate-report",
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify(repoData)

      }
    );


    const blob = await response.blob();


    const url = window.URL.createObjectURL(blob);


    const link = document.createElement("a");

    link.href = url;

    link.download = "RepoPulse_Report.pdf";


    document.body.appendChild(link);

    link.click();

    link.remove();

  };



  return (

    <div className="container">


      <div className="hero">

        <h1>
          🚀 RepoPulse Lite
        </h1>


        <p>
          Analyze any public GitHub repository using AI insights.
        </p>


      </div>


      <div className="search-box">


        <input

          className="input"

          type="text"

          placeholder="https://github.com/facebook/react"

          value={repoUrl}

          onChange={(e)=>setRepoUrl(e.target.value)}

        />


        <button

          className="button"

          onClick={analyzeRepo}

          disabled={loading}

        >

          {
            loading 
            ? "🔍 Analyzing..."
            : "Analyze Repository"
          }


        </button>


      </div>


      <h3 className="message">
        {message}
      </h3>

      {
        repoData &&

        <div className="results">


          <h2>
            📊 Repository Details
          </h2>


          <div className="stats-grid">


            <Card 
              title="📦 Name" 
              value={repoData.name}
            />


            <Card 
              title="⭐ Stars" 
              value={repoData.stars}
            />


            <Card 
              title="🍴 Forks" 
              value={repoData.forks}
            />


            <Card 
              title="💻 Language" 
              value={repoData.language}
            />


            <Card 
              title="👤 Owner" 
              value={repoData.owner}
            />


            <Card 
              title="❗ Issues" 
              value={repoData.open_issues}
            />


            <Card

              title="💚 Health Score"

              value={`${repoData.health_score}/100`}

            />


          </div>



          <Box title="❤️ Repository Health">


            <div className="health-bar">


              <div

                className="health-progress"

                style={{
                  width:`${repoData.health_score}%`
                }}

              >

              </div>


            </div>


          </Box>





          <Box title="📝 Description">


            <p className="description">

              {repoData.description}

            </p>


          </Box>





          <Box title="👥 Top Contributors">


          {
            repoData.contributors?.map((user,index)=>(


              <div 
                className="contributor-card"
                key={index}
              >


                <h3>
                  🥇 {user.username}
                </h3>


                <p>
                  Contributions: {user.contributions}
                </p>


                <a

                  href={user.profile}

                  target="_blank"

                  rel="noreferrer"

                >

                  View GitHub Profile

                </a>


              </div>


            ))
          }


          </Box>





          <Box title="📊 Language Statistics">


          {

            repoData.languages &&

            Object.entries(repoData.languages)

            .map(([language,bytes])=>(


              <div 

                className="language-card"

                key={language}

              >


                <h3>
                  {language}
                </h3>


                <p>
                  {bytes.toLocaleString()} bytes
                </p>


              </div>


            ))

          }
          </Box>

<Box title="📊 Commit Complexity Breakdown">

  <div className="stats-grid">

    <Card
      title="🟢 Tier 1"
      value={repoData.commit_analysis?.tier_breakdown?.tier1 ?? 0}
    />

    <Card
      title="🟡 Tier 2"
      value={repoData.commit_analysis?.tier_breakdown?.tier2 ?? 0}
    />

    <Card
      title="🔴 Tier 3"
      value={repoData.commit_analysis?.tier_breakdown?.tier3 ?? 0}
    />

  </div>

</Box>

<Box title="🤖 AI Repository Insights">

  <p className="ai-text">
    {repoData.ai_insight}
  </p>

</Box>




          <button

            className="download-button"

            onClick={downloadReport}

          >

            📄 Download PDF Report


          </button>



        </div>

      }


    </div>

  );

}





function Card({title,value}){


  return (

    <div className="card">


      <h3>
        {title}
      </h3>


      <h2>
        {value}
      </h2>


    </div>

  );


}





function Box({title,children}){


  return (

    <div className="box">


      <h3>
        {title}
      </h3>


      {children}


    </div>

  );


}





export default App;