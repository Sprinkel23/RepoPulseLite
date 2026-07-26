import { useState } from "react";


function App() {

  const [repoUrl, setRepoUrl] = useState("");
  const [repoData, setRepoData] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);



  const analyzeRepo = async()=>{


    if(!repoUrl){

      setMessage("Please enter GitHub repository URL");
      return;

    }


    try{


      setLoading(true);
      setMessage("");
      setRepoData(null);



      const response = await fetch(
        "https://repopulselite.onrender.com/analyze",
        {

          method:"POST",

          headers:{
            "Content-Type":"application/json"
          },

          body:JSON.stringify({

            repo_url:repoUrl

          })

        }
      );



      const data = await response.json();



      if(data.error){

        setMessage(data.error);

      }
      else{

        setRepoData(data);

      }


    }

    catch(error){

      setMessage("Backend is not running!");

    }

    finally{

      setLoading(false);

    }


  };





  const downloadReport = async()=>{


    if(!repoData){

      alert("Analyze repository first");

      return;

    }



    const response = await fetch(

      "https://repopulselite.onrender.com/generate-report",

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


    link.href=url;

    link.download="RepoPulse_Report.pdf";


    document.body.appendChild(link);
 

    link.click();


    link.remove();


  };





return (

<div

style={{

maxWidth:"1000px",

margin:"40px auto",

fontFamily:"Arial",

textAlign:"center"

}}

>


<h1>🚀 RepoPulse Lite</h1>


<p>
Analyze any public GitHub repository.
</p>




<input

type="text"

placeholder="https://github.com/facebook/react"

value={repoUrl}

onChange={(e)=>setRepoUrl(e.target.value)}

style={{

width:"90%",

padding:"14px",

fontSize:"16px",

borderRadius:"8px",

border:"1px solid #aaa"

}}

/>



<br/><br/>





<button

onClick={analyzeRepo}

disabled={loading}

style={{

padding:"12px 30px",

fontSize:"16px",

borderRadius:"8px",

cursor:"pointer"

}}

>

{

loading ?

"🔍 Analyzing..."

:

"Analyze Repository"

}


</button>



<h3>{message}</h3>





{

repoData &&

<div>



<h2>📊 Repository Details</h2>





<div

style={{

display:"grid",

gridTemplateColumns:"repeat(2,1fr)",

gap:"20px"

}}

>



<Card title="📦 Name" value={repoData.name}/>

<Card title="⭐ Stars" value={repoData.stars}/>

<Card title="🍴 Forks" value={repoData.forks}/>

<Card title="💻 Language" value={repoData.language}/>

<Card title="👤 Owner" value={repoData.owner}/>

<Card title="❗ Issues" value={repoData.open_issues}/>


<Card

title="💚 Health Score"

value={`${repoData.health_score}/100`}

/>



</div>





<Box title="❤️ Repository Health">


<div

style={{

height:"25px",

background:"#eee",

borderRadius:"20px"

}}

>


<div

style={{

width:`${repoData.health_score}%`,

height:"25px",

background:"#4caf50",

borderRadius:"20px"

}}

>


</div>


</div>



</Box>






<Box title="📝 Description">


<p>

{repoData.description}

</p>


</Box>







<Box title="👥 Top Contributors">


{

repoData.contributors?.map((user,index)=>(


<div

key={index}

style={{

padding:"15px",

margin:"10px",

border:"1px solid #ddd",

borderRadius:"10px"

}}

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


<div key={language}>


<h3>{language}</h3>


<p>

{bytes.toLocaleString()} bytes

</p>


</div>


))


}


</Box>








<Box title="🤖 AI Repository Insights">


<p

style={{

whiteSpace:"pre-line",

textAlign:"left",

lineHeight:"1.6"

}}

>

{repoData.ai_insight}

</p>


</Box>







<button

onClick={downloadReport}

style={{

marginTop:"30px",

padding:"15px 35px",

fontSize:"18px",

borderRadius:"10px",

cursor:"pointer"

}}

>

📄 Download PDF Report

</button>





</div>

}



</div>

);

}





function Card({title,value}){


return(

<div

style={{

padding:"20px",

border:"1px solid #ddd",

borderRadius:"12px",

boxShadow:"0 3px 10px rgba(0,0,0,0.1)"

}}

>


<h3>{title}</h3>

<h2>{value}</h2>


</div>

);


}






function Box({title,children}){


return(

<div

style={{

marginTop:"30px",

padding:"20px",

border:"1px solid #ddd",

borderRadius:"12px"

}}

>


<h3>{title}</h3>

{children}


</div>


);


}



export default App;