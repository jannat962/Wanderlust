(() => {
    'use strict'
    
    // Bootstrap validation logic
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach((form) => {
        form.addEventListener('submit', (event) => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add("was-validated");
        }, false);
    });

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
            if(startBtn) startBtn.classList.add("d-none");
            if(stopBtn) stopBtn.classList.remove("d-none");
            if(statusBadge) {
                statusBadge.classList.remove("d-none");
                statusBadge.innerText = "System Listening...";
                statusBadge.classList.add("bg-danger");
            }
            readOut("Wanderlust Assistant active. Listening for commands.");
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
                recognition.start();
            });
        }

        if(stopBtn) {
            stopBtn.addEventListener("click", () => {
                recognition.stop();
            });
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

            // Enhanced Command Patterns
            if (transcript.includes("listings") || transcript.includes("list") || transcript.includes("home")) {
                navigateTo("/listings", "Opening all listings.");
            }
            else if (transcript.includes("add new") || transcript.includes("create") || transcript.includes("new property") || transcript.includes("new list")) {
                navigateTo("/listings/new", "Opening property form.");
            }
            else if (transcript.includes("login") || transcript.includes("sign in")) {
                navigateTo("/login", "Opening login.");
            }
            else if (transcript.includes("signup") || transcript.includes("register") || transcript.includes("sign up")) {
                navigateTo("/signup", "Opening registration.");
            }
            else if (transcript.includes("logout") || transcript.includes("sign out")) {
                navigateTo("/logout", "Logging out.");
            }
            else if (transcript.includes("hello") || transcript.includes("hi")) {
                readOut("Assalamu Alaikum! Tell me a command like 'Open listings'.");
            }
            else if (transcript.includes("about") || transcript.includes("yourself")) {
                readOut("I am your Wanderlust voice assistant. I can navigate the site for you.");
            }
            else if (transcript.includes("stop") || transcript.includes("shut down") || transcript.includes("exit")) {
                readOut("Stopping system.");
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
