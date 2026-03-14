require("dotenv").config({ path: ".env.local" });
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`)
  .then(res => res.json())
  .then(data => {
    if (data.error) {
       console.error("API Error:", data.error);
    } else {
       console.log("Got models:", data.models.map(m => m.name));
    }
  });
