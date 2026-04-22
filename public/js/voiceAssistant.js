(() => {
    'use strict'
    
    // --- Voice Assistant Logic ---
    const startBtn = document.querySelector("#start");
    const stopBtn = document.querySelector("#stop");
    const statusBadge = document.querySelector("#voice-status");

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn("Speech Recognition not supported in this browser.");
        if (startBtn) startBtn.style.display = 'none';
    } else {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            console.log("Voice Assistant: Active");
            sessionStorage.setItem("voice_assistant_active", "true");
            if(startBtn) startBtn.classList.add("d-none");
            if(stopBtn) stopBtn.classList.remove("d-none");
            if(statusBadge) {
                statusBadge.classList.remove("d-none");
                statusBadge.innerText = "System Listening...";
                statusBadge.classList.add("bg-danger");
            }
            // Only speak on manual start, not auto-start during navigation
            if(!window.isAutoStarting) {
                readOut("Welcome to Wanderlust! How can I help you today? Would you like me to tell you my features?");
            }
        };

        recognition.onend = () => {
            console.log("Voice Assistant: Inactive");
            if(startBtn) startBtn.classList.remove("d-none");
            if(stopBtn) stopBtn.classList.add("d-none");
            if(statusBadge) {
                statusBadge.classList.add("d-none");
            }
        };

        if(startBtn) {
            startBtn.addEventListener("click", () => {
                window.isAutoStarting = false;
                recognition.start();
            });
        }

        if(stopBtn) {
            stopBtn.addEventListener("click", () => {
                sessionStorage.removeItem("voice_assistant_active");
                recognition.stop();
            });
        }

        // Auto-start if it was active on previous page
        if (sessionStorage.getItem("voice_assistant_active") === "true") {
            window.isAutoStarting = true;
            recognition.start();
        }

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript.toLowerCase().trim();
            console.log(`Matched Word: ${transcript}`);

            const navigateTo = (url, message) => {
                readOut(message);
                setTimeout(() => {
                    window.location.href = url;
                }, 1200);
            };

            // --- Enhanced Command Patterns ---
            
            // 1. Navigation Commands
            if (transcript.includes("home page") || transcript.includes("open home") || transcript.includes("go home")) {
                navigateTo("/listings", "Opening the home page.");
            }
            else if (transcript.includes("dashboard") || transcript.includes("my properties") || transcript.includes("admin panel")) {
                navigateTo("/dashboard", "Taking you to your dashboard.");
            }
            else if (transcript.includes("add new listing") || transcript.includes("create listing") || transcript.includes("new property")) {
                navigateTo("/listings/new", "Opening the property creation form.");
            }
            else if (transcript.includes("sign up") || transcript.includes("register")) {
                navigateTo("/signup", "Opening registration.");
            }
            else if (transcript.includes("sign in") || transcript.includes("login")) {
                navigateTo("/login", "Opening login.");
            }
            
            // 2. Action Commands
            else if (transcript === "add" || transcript === "submit" || transcript === "save") {
                const addBtn = document.querySelector(".add-btn") || document.querySelector("button[type='submit']");
                if (addBtn) {
                    readOut("Submitting the form.");
                    addBtn.click();
                } else {
                    readOut("I couldn't find a submit button on this page.");
                }
            }
            
            // 3. Information / Conversational
            else if (transcript.includes("yes") || transcript.includes("tell me your features") || transcript.includes("what can you do") || transcript.includes("features")) {
                readOut("I can help you navigate Wanderlust. You can say: Open home page, Go to dashboard, Add new listing, or Login. I can also submit forms for you when you say 'Add'.");
            }
            else if (transcript.includes("nearest hotel") || transcript.includes("comfortable hotel") || transcript.includes("recommendation")) {
                readOut("I've found some highly-rated luxury stays in Tokyo and New York. Would you like to see all listings?");
            }
            else if (transcript.includes("hello") || transcript.includes("hi")) {
                readOut("Hi there! How can I assist you with your travels today?");
            }
            else if (transcript.includes("stop") || transcript.includes("exit")) {
                readOut("Goodbye! Voice assistant stopping.");
                sessionStorage.removeItem("voice_assistant_active");
                recognition.stop();
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech Error:", event.error);
        };
    }

    function readOut(message) {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance();
        speech.text = message;
        speech.volume = 1;
        speech.rate = 1;
        window.speechSynthesis.speak(speech);
    }
})();
