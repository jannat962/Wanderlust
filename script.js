
(() => {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation')
  
    // Loop over them and prevent submission
    Array.from(forms).forEach((form) => {
      form.addEventListener(
        'submit', 
        (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
  
        form.classList.add("was-validated");
      },
       false);
    });
  });

  // --------------------------

const startBtn = document.querySelector("#start");
const stopBtn = document.querySelector("#stop");

const speakoutBtn = document.querySelector("#speakout");


// speechrecognition setup
const SpeechRecognition = 
window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

// sr start
recognition.onstart = function(){
  console.log("vr active");
};

// sr end
recognition.onend = function(){
  console.log("vr deactive");
};

//SR CONTINUOS
recognition.continuous = true;


startBtn.addEventListener("click", () =>{
  recognition.start();
});

stopBtn.addEventListener("click",()=>{
  recognition.stop();
});

// result
recognition.onresult = function (event) {
  let current = event.resultIndex;
  let transcript = event.results[current][0].transcript;
  transcript = transcript.toLowerCase();
 // let userData = localStorage.getItem("jarvis_setup");
  console.log( `my words: ${transcript}`);
  // createMsg("usermsg", transcript);
  // commands
  // hi - hello

  if(localStorage.getItem("lang") === "en-US"){
    if (transcript.includes(" hi ")) {
     // readOut("hello mam");
      readOut(" Assalamu alaikum maa ")
      }
    //};
  }
    if (transcript.includes("open list")) {
      //search nearby hotels
      //show hotel details
      readOut("opening mam")
      window.open("http://localhost:8080/listings")
      //("https://www.youtube.com")
      
    
    //

  }if (transcript.includes("open youtube")) {
      readOut("opening youtube sir")
      window.open("https://www.youtube.com")
  }

  if (transcript.includes("hello")) {
    readOut("As salamu alaikum maa")
    //window.open("https://www.youtube.com")
}

  if (transcript.includes("add new list")) {
    readOut("Create a New Listing");
    window.open("http://localhost:8080/listings/new");
  }
  if (transcript.includes("nearest hotels")) {
  readOut("showing your most near by hotel from listings");
  window.open("http://localhost:8080/listings/661d71cef13cbd7ab275dc26"); 
  } 
  if (transcript.includes("show new list")) {
    readOut("show new listing mam");
    window.open("http://localhost:8080/listings/new");
  }
  
  if (transcript.includes("edit downtown")) {
    readOut("editing Modern Loft in Downtown");
    window.open("http://localhost:8080/listings/6619dce69eea3d3e47547b3e");
  }
  if (transcript.includes("edit mountain")) {
    readOut("editing Mountain Retreat");
    window.open("http://localhost:8080/listings/6619dce69eea3d3e47547b3f");
  }

  



   // jarvis bio
  if (transcript.includes("about yourself")) {
    readOut
    ("Mam,i am a Wanderlust Private limited.  Wanderlust is an online marketplace that connects people who want to rent out their property with people who are looking for accommodations, typically for short stays.Wanderlust offers hosts a relatively easy way to earn some income from their property.Guests often find that Wanderlust rentals are cheaper and homier than hotels.Wanderlust makes the bulk of its revenue by charging fees to both guests and hosts.")
    
  };

  // ----------------------------------------------->
  // some casual commands
  if (transcript.includes("what's the current charge")) {
    readOut(`the current charge is ${charge}`);
  }
  if (transcript.includes("what's the charging status")) {
    readOut(`the current charging status is ${chargeStatus}`);
  }
  if (transcript.includes("current time")) {
    readOut(currentTime);
  }
  if (transcript.includes("connection status")) {
    readOut(`you are ${connectivity} sir`);
  }
  // availability check
  if (transcript.includes("are you there")) {
    readOut("yes sir");
  }
  // close voice recognition
  if (transcript.includes("shut down")) {
    readOut("Ok sir i will take a nap");
    stopingR = true;
    recognition.stop();
  }

  // news commands
  if (transcript.includes("top headlines")) {
    readOut("These are today's top headlines sir")
    getNews()

  }

  if (transcript.includes("news regarding")) {
    // readOut("These are today's top headlines sir")
    let input = transcript
    let a = input.indexOf("regarding")
    input = input.split("")
    input.splice(0,a+9)
    input.shift()
    input.pop()

    readOut(`here's some headlines on ${input.join("")}`)
    getCategoryNews(input.join(""))

  }
}    

if(localStorage.getItem("lang") === "hi-IN"){
  if(transcript.includes("हैलो जार्विस")){
    readOutHindi("हैलो सर")
  }

  if(transcript.includes("इंग्लिश में बदलो")){
    readOutHindi("इंग्लिश में बदल रहा हूँ")
    speech_lang = "en-US"
    localStorage.setItem("lang", "en-US")
    stopingR = true
    recognition.stop()
    location.reload()
    readOut("ready to go sir")
  }
// ----------------------------------------->


};


// wanderlust speech
function readOut(message) {
  const speech = new SpeechSynthesisUtterance();
  const allVoices = speechSynthesis.getVoices()
  //speech.voice = allVoices[13];
  speech.text = message;
  speech.volume = 1;
  window.speechSynthesis.speak(speech);
  console.log("Speaking out");
  // createMsg("jmsg", message);
}

function readOutHindi(message) {
  
  const speech = new SpeechSynthesisUtterance();
  speech.text = message;
  speech.volume = 1;
  speech.lang = "hi-IN"
  window.speechSynthesis.speak(speech);
  console.log("Speaking out");
  // createMsg("jmsg", message);
}

// example

speakoutBtn.addEventListener("click", ()=>{
  readOut(" As salamu Alaikum" );
})