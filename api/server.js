import express from "express";
import fs from "node:fs";
import axios from "axios";
import FormData from "form-data";
import path from "path";
import multer from "multer";
import cors from "cors";
import OpenAI from "openai";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;
const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
const UPSTAGE_API_KEY = process.env.UPSTAGE_API_KEY;
const upload = multer();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const openai = new OpenAI({
  apiKey: UPSTAGE_API_KEY,
  baseURL: 'https://api.upstage.ai/v1/solar'
});

app.post('/api/generate-image', upload.none(), async (req, res) => {
  try {
    const { imageId, description } = req.body;

    const imagePath = path.join(__dirname, `../public/img/cake_template_${imageId}.png`);
    const maskPath = path.join(__dirname, `../public/img/cake_template_mask_${imageId}.png`);

    const payload = {
      image: fs.createReadStream(imagePath),
      mask: fs.createReadStream(maskPath),
      prompt: description,
      output_format: "jpeg"
    };

    const response = await axios.postForm(
      `https://api.stability.ai/v2beta/stable-image/edit/inpaint`,
      axios.toFormData(payload, new FormData()),
      {
        validateStatus: undefined,
        responseType: "arraybuffer",
        headers: { 
          Authorization: `Bearer ${STABILITY_API_KEY}`, 
          Accept: "image/*" 
        },
      },
    );

    if (response.status === 200) {
      const outputFilePath = path.join(__dirname, `../public/output/result_generated.jpeg`);
      fs.writeFileSync(outputFilePath, Buffer.from(response.data));
      res.status(200).json({ imageUrl: `output/result_generated.jpeg` });
    } else {
      res.status(response.status).send(response.data.toString());
    }
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).send("Image generation failed.");
  }
});

app.post('/api/translate', async (req, res) => {
  const { description } = req.body;

  if (!description) {
      return res.status(400).json({ error: 'Description is required' });
  }

  try {
      // Upstage API를 사용하여 번역 요청
      const chatCompletion = await openai.chat.completions.create({
          model: 'solar-1-mini-chat',  // Upstage 모델명
          messages: [
            {
              role: "system",
              content: "You are an assistant that passes user input to the image generation model. If the input is in Korean, translate it to English. If the input is in English, you can return it as is. Trim the sentence to a form suitable for instructing the model to generate an image of the cake design."
            },
            {
              role: 'user',
              content: description,
            },
          ],
          stream: false // 스트리밍 옵션 비활성화
      });

      // 스트리밍이 비활성화된 경우, 결과를 바로 반환
      const translatedText = chatCompletion.choices[0].message.content.trim();

      res.json({ translatedText });
  } catch (error) {
      console.error("Error translating text:", error);
      res.status(500).json({ error: "Translation failed" });
  }
});

// app.use(express.static('public')); // 이미지와 정적 파일 제공

app.listen(PORT, () => {
   console.log(`Server running on http://localhost:${PORT}`);
 });

// export default (req, res) => {
//   app(req, res);
// };

