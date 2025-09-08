/** 
* Filename: scripts.js
* Author: Isaac Musuayi
* Description: This code will display three pages for an art print and reproduction website. 
* 
* As users make selections of prints to buy, the details will be added to a shopping cart.
*/
'use strict';

// Check if the document is still loading. If so, wait until DOM is 
// fully loaded before running display()
if (document.readyState == 'loading') {
    document.addEventListener('DOMContentLoaded', display);
} else {
    display();
}

function display () {
    const uploadFile = document.getElementById('upload-file');
    const textAreaContainer = document.getElementById("textAreaContainer");
    const cross = document.getElementById("cross");
    const humanizeBtn = document.getElementById("humanize-btn");

    if (uploadFile) {
        uploadFile.addEventListener("change",  handleFileUpload);
    }
    
    if (textAreaContainer) {
        textAreaContainer.addEventListener("input", function(e) {
            e.preventDefault();
            //limitWord();
        });
    }

    if (cross) {
        cross.addEventListener("click", function(e) {
            e.preventDefault();
            deleteContent();
        });
    }  

    if (humanizeBtn) {
        humanizeBtn.addEventListener("click", summarizeText);
    }
}

function handleFileUpload(event) {
    let textAreaContainer = document.getElementById("textAreaContainer");
    let textInput = document.getElementById("text-input");
    const file = event.target.files[0];
    if (file && file.type.startsWith("text")) {
        const reader = new FileReader();
        reader.onload = function (e) {
        const content = e.target.result;
        textInput.value = content;
        textAreaContainer.style.display = "block";   
       // limitWord();   
        };
        reader.readAsText(file);
    } else {
        alert("Please upload a text file.")
    }
}

function deleteContent () {
    let textInput = document.getElementById("text-input");
    let wordElement = document.getElementById("wordCount");

    textInput.value = "";
   // wordElement.textContent = `0/600words`;
}

/*function limitWord () {
    let textInput = document.getElementById("text-input");
    let wordElement = document.getElementById("wordCount");
    let textTrimed = textInput.value.trim();
    let words = textTrimed.split(/\s+/);
    let countWord = 0;

    if (textTrimed === "") {
        countWord = 0;
    } else {
        countWord = words.length;
    }

    if (countWord <= 600) {
        wordElement.textContent = `${countWord}/600words`;
    } else {
        alert("Your text has to be less than 600 words");
        let limitedText = words.slice(0, 600).join(" ");
        textInput.value = limitedText;
        wordElement.textContent = "600/600 words";
    }
}*/

async function summarizeText () {
    const textInput = document.getElementById("text-input").value.trim();
    const output = document.getElementById("text-summarized");
    let spinner = document.getElementById("spinner");

    if (!textInput) {
        alert("Please enter or upload some text first.");
        return;
    }

    // Show spinner before starting processing
    spinner.style.display = "block";

    try {
        const response = await fetch('/summarize',  {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text: textInput})
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        output.innerHTML = `
            <h2>Summarized version:</h2>
            <section class="output-container">
                <textarea id="output-text" placeholder="Your text here...">${result.summarizedText}</textarea>
                <button id="copy-btn">Copy</button>   
            </section>
        `;

        // Add event listener to new Copy button
        document.getElementById("copy-btn").addEventListener("click", copyHumanizedText);
    } catch (error) {
        alert("Failed to humanize text. Please try again");
    } finally {
        // Hide spinner once processing is complete
        spinner.style.display = "none";
    }
}

function copyHumanizedText() {
    const outputText = document.getElementById("output-text");
    outputText.select();
    outputText.setSelectionRange(0, 99999); // for mobile support

    navigator.clipboard.writeText(outputText.value)
        .then(() => {
            alert("Copied to clipboard!");
        })
        .catch(err => {
            alert("Failed to copy text: " + err);
        });
}



/*async function showTextArea () {
    const textAreaContainer = document.getElementById("textAreaContainer");
    let textInput = document.getElementById("text-input");
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            textInput.value = text;
            textAreaContainer.style.display = "block";
        }else {
            alert("Clipboard is empty or inaccessible")
        }
    } catch (err) {
        alert("Clipboard access failed. Try using Ctrl+v.")
    }
   
} */