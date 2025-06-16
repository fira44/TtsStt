const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const cors = require('cors');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.static('public'));

const elevenlabs = new ElevenLabsClient({
    apiKey : process.env.ELEVEN_API_KEY
});
const upload = multer({ dest: 'uploads/' });
const PORT = 3000;

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

const getManualResponse = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('merhaba')) return 'merhaba! size nasıl yardımcı olabilirim?';
    if (lower.includes('çalışma saatleri')) return 'pazartesiden cumaya dokuz ile on sekiz arası çalışıyoruz.';
    return 'üzgünüm, anlayamadım. lütfen tekrar eder misiniz?';
};

app.post('/process-audio', upload.single('audio'), async(req,res) => {
    const inputPath = req.file.path;

    const sttResponse = await elevenlabs.speechToText.convert({
        file : fs.createReadStream(inputPath),
        modelId: "scribe_v1",
        languageCode : "tr"
    })
    console.log(sttResponse.text);
    const text = getManualResponse(sttResponse.text);



    const audio = await elevenlabs.textToSpeech.stream('JBFqnCBsd6RMkjVDRZzb', {
        text: text,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
      });

    res.set('Content-Type', 'audio/mpeg');
    const buffer = await streamToBuffer(audio);
    res.send(buffer);
    await fs.unlink(inputPath); //delete uplaoded file 
})


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
