import express from 'express';
import wikipedia from "wikipedia"
import { translate } from '@vitalets/google-translate-api';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { apiKey, DATABASE_URL } from "./env.config.js"
import rateLimit from "express-rate-limit";

import { drizzle } from 'drizzle-orm/node-postgres';
import { ilike } from 'drizzle-orm';
import { summaryTable } from './db/schema.js';


const app = express();


app.use(express.json())

const limiter = rateLimit({
    windowMs: 18 * 60 * 1000, // 18 minutes
    max: 100, 
    message: "Too many requests, please try again later.",
    headers: true,
});

app.use(limiter);

const db = drizzle(DATABASE_URL);

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.get('/', async (req, res) => {
    if(!req.query?.title) {
        res.send({ message: "hello, world!" })
    }
    const thetitle = req.query?.title;
      
    try {
        const content = await db.select().from(summaryTable).where(ilike(summaryTable.title, thetitle));
        
        if(content[0]) {
            res.send({content, title: thetitle});
            return
        }
        
        const prompt = `You are an Ai version of Wikipedia and you should give me a a short (not too short) content about every matter I tell you. And don't give me the content in list structured way, tell me about ${thetitle}`;
        const result = await model.generateContent(prompt);
        
        const { text } = await translate(result.response.text(), { to: "ckb"});
        
        await db.insert(summaryTable).values({
            title: thetitle,
            content: text
        });
        
        res.send({content: text, title: thetitle})
        
    } catch(err) {
        console.error(err)
    }
});


app.listen(3000, () => {
    console.log("app running in port 3000, http://localhost:3000")
});