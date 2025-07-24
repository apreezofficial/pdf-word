const fileInput = document.getElementById("fileInput");
const uploadBox = document.getElementById("uploadBox");
const fileName = document.getElementById("fileName");
const convertBtn = document.getElementById("convertBtn");
const statusText = document.getElementById("status");
const downloadLink = document.getElementById("downloadLink");

let selectedFile = null;

// Handle file selection
fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    handleFile(file);
});

// Handle drag and drop
uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadBox.style.borderColor = "#007bff";
});

uploadBox.addEventListener("dragleave", () => {
    uploadBox.style.borderColor = "#ccc";
});

uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    uploadBox.style.borderColor = "#ccc";

    const file = e.dataTransfer.files[0];
    handleFile(file);
});

// Handle file validation and UI updates
function handleFile(file) {
    if (!file) {
        fileName.textContent = "";
        convertBtn.disabled = true;
        return;
    }

    if (file.type === "application/pdf") {
        selectedFile = file;
        fileName.textContent = selectedFile.name;
        convertBtn.disabled = false;
        statusText.textContent = "";
        downloadLink.hidden = true;
    } else {
        alert("Please upload a valid PDF file.");
        fileInput.value = "";
        convertBtn.disabled = true;
    }
}

// Handle conversion
convertBtn.addEventListener("click", async () => {
    if (!selectedFile) {
        alert("Please upload a PDF file first.");
        return;
    }

    convertBtn.disabled = true;
    statusText.textContent = "Converting...";

    try {
        const reader = new FileReader();
        reader.onload = async function (event) {
            const pdfData = new Uint8Array(event.target.result);

            // Load the PDF using pdfjs-dist
            const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
            let extractedText = "";

            // Extract text from each page
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                extractedText += textContent.items.map(item => item.str).join(" ") + "\n\n";
            }

            // Convert extracted text to DOCX
            const doc = new docx.Document({
                sections: [{
                    properties: {},
                    children: [
                        new docx.Paragraph({ text: extractedText })
                    ]
                }]
            });

            const docBlob = await docx.Packer.toBlob(doc);
            const docUrl = URL.createObjectURL(docBlob);

            // Enable download link
            downloadLink.href = docUrl;
            downloadLink.download = selectedFile.name.replace(".pdf", ".docx");
            downloadLink.style.display = '';

            statusText.textContent = "Conversion complete!";
            convertBtn.disabled = false;
        };

        reader.readAsArrayBuffer(selectedFile);
    } catch (error) {
        console.error("Conversion failed:", error);
        statusText.textContent = "Conversion failed. Please try again.";
        convertBtn.disabled = false;
    }
});
