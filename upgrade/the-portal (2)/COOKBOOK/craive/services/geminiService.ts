import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Suggestion, CraveScope, CraiveTypeProfile, QuizAnswer, User, FoodMixResult, CraveSyncUserInput, CraveSyncOption } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Running in Local AI fallback mode.");
}

const suggestionResponseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: 'The enticing name of the food dish or idea.'
            },
            description: {
                type: Type.STRING,
                description: 'A short, mouth-watering description of the food.'
            }
        },
        required: ['title', 'description']
    }
};

const craiveScopeResponseSchema = {
    type: Type.OBJECT,
    properties: {
        sign: { type: Type.STRING, description: "The user's astrological sign." },
        forecast: { type: Type.STRING, description: "Today's flavor forecast. e.g., 'You’re craving adventure today. Try something crunchy or spicy.'" },
        advice: { type: Type.STRING, description: "A piece of food-related advice. e.g., 'Stay away from repetition—you’ll feel restless.'" },
        bonusTip: { type: Type.STRING, description: "A fun, creative bonus tip. e.g., 'Bonus tip: grilled pineapple boosts your creativity today.'" }
    },
    required: ['sign', 'forecast', 'advice', 'bonusTip']
};

const craiveTypeResponseSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The official name of the CraiveType personality, chosen from the provided list." },
        title: { type: Type.STRING, description: "A catchy title for this personality type. e.g., 'The Nostalgic Nurturer'" },
        description: { type: Type.STRING, description: "A detailed paragraph describing the user's food personality, their tendencies, and their relationship with food." },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-4 food-related strengths." },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-4 food-related weaknesses or challenges." },
        comfortFoods: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-4 specific foods or types of food that comfort this personality." },
        riskyFlavors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 3-4 flavors or food types this personality might find challenging or should try exploring." },
    },
    required: ['name', 'title', 'description', 'strengths', 'weaknesses', 'comfortFoods', 'riskyFlavors']
};

const foodMixResponseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            craiveName: { type: Type.STRING, description: "A fun, viral, and creative name for the food combination. e.g., 'The Nacho Nomad' or 'The Midnight Volcano'." },
            personalityTag: { type: Type.STRING, description: "A personality tag for the dish, like '🔥 Spicy,' '💪 Comfort,' or '🌈 Sweet'."},
            craiveStory: { type: Type.STRING, description: "A short, funny, or poetic 'Craive Story' describing the dish." },
            instructions: { type: Type.STRING, description: "Clear, concise, step-by-step instructions on how to prepare the dish." },
        },
        required: ['craiveName', 'personalityTag', 'craiveStory', 'instructions']
    }
};

const craveSyncOptionsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "The name of the restaurant." },
            cuisine: { type: Type.STRING, description: "The primary cuisine type (e.g., Italian, Mexican, Sushi)." },
            price: { type: Type.STRING, description: "The price range, using '$', '$$', '$$$', or '$$$$'." },
            distance: { type: Type.STRING, description: "An estimated distance, e.g., '0.5 miles'." },
        },
        required: ['name', 'cuisine', 'price', 'distance']
    }
};

// ==========================================
// ====== LOCAL AI GENERATOR FALLBACK ======
// ==========================================
const localAI = {
    getFoodSuggestions: (userInput: string): Suggestion[] => {
        const cleaned = userInput.toLowerCase().trim();
        
        const dishes = [
            {
                keywords: ['sushi', 'fish', 'japanese', 'raw'],
                suggestions: [
                    { title: "Mila's Volcano Sushi Roll", description: "A fiery combination of spicy tuna, tempura shrimp, and cucumber, topped with avocado, dynamic unagi sauce, spicy aioli, and micro-greens." },
                    { title: "Creamy Truffle Salmon Nigiri", description: "Seared premium salmon belly over hand-formed sushi rice, glazed with fragrant white truffle oil and house soy reduction." },
                    { title: "Crispy Rice Spicy Tuna Bites", description: "Golden, crispy pan-fried sushi rice cubes topped with creamy spicy bluefin tuna tartare, fresh jalapeño rounds, and a splash of citrus ponzu." },
                    { title: "Ocean Breeze Poke Bowl", description: "A fresh mix of cubed yellowtail, sweet mango, edamame, and pickled radish on a warm bed of brown rice." }
                ]
            },
            {
                keywords: ['taco', 'mexican', 'burrito', 'salsa', 'quesadilla'],
                suggestions: [
                    { title: "Smoked Chipotle Birria Tacos", description: "Slow-braised beef birria folded into crispy corn tortillas with melted Chihuahua cheese, chopped sweet onions, cilantro, and rich dipping consommé." },
                    { title: "Crispy Avocado-Lime Street Tacos", description: "Panko-crusted fresh avocado slices nestled in warm flour tortillas with creamy chipotle cabbage slaw and mango salsa." },
                    { title: "Ancho Chili Grilled Shrimp Quesadilla", description: "Flour tortilla loaded with marinated shrimp, flame-roasted corn salsa, and gooey pepper jack cheese, served with fresh cilantro lime crema." },
                    { title: "Street-Style Elote Bowl", description: "Grilled corn off the cob mixed with cotija cheese, chili powder, lime, and creamy garlic sauce, served with crunchy tortilla chips." }
                ]
            },
            {
                keywords: ['dessert', 'sweet', 'chocolate', 'cake', 'cookie', 'ice cream'],
                suggestions: [
                    { title: "Molten Lavender Chocolate Lava Cake", description: "A rich dark chocolate cake with a warm liquid chocolate center subtly infused with organic lavender buds, served with vanilla bean gelato." },
                    { title: "Salted Caramel Banoffee Pie", description: "A crumbly graham cracker crust layered with creamy dulce de leche, sliced sweet bananas, and whipped espresso cream." },
                    { title: "Crispy Matcha-Stuffed Beignets", description: "Pillowy, golden-fried dough pockets dusted with powdered sugar and filled with a decadent, velvety white chocolate matcha ganache." },
                    { title: "Fresh Berry Rosewater Parfait", description: "Layers of creamy Greek yogurt, organic granola, and fresh summer berries tossed in a delicate rosewater syrup." }
                ]
            }
        ];

        // Find keyword match
        for (const dish of dishes) {
            if (dish.keywords.some(keyword => cleaned.includes(keyword))) {
                return dish.suggestions;
            }
        }

        // Default dynamic suggestion generator if no keywords match
        const capitalized = userInput.charAt(0).toUpperCase() + userInput.slice(1);
        return [
            { 
                title: `Mila's Signature ${capitalized} Fusion`, 
                description: `A stunning gourmet rendition of your craving for "${userInput}". It combines premium, fresh ingredients with a perfect balance of smoky, sweet, and savory flavor elements.` 
            },
            { 
                title: `Golden Crispy ${capitalized} Skewers`, 
                description: `Lightly breaded and cooked to golden perfection, these fun skewers bring a crispy, playful element to your craving for "${userInput}". Drizzled with a zesty herb-lemon glaze.` 
            },
            { 
                title: `Rustic Charcoal-Grilled ${capitalized} Bowl`, 
                description: `A warm, comforting bowl featuring charcoal-kissed ingredients themed around "${userInput}", laid over a bed of fluffy wild rice and paired with grilled seasonal vegetables.` 
            },
            { 
                title: `Crave-Worthy ${capitalized} Sliders`, 
                description: `Mini gourmet sliders loaded with flavor profiles of "${userInput}", tucked into toasted brioche buns with melted cheese and caramelized sweet onions.` 
            }
        ];
    },

    getCraiveScope: (birthday: string, isUnder21: boolean): CraveScope => {
        const signs = [
            { name: "Aries", traits: "bold, fiery, and impatient", forecast: "You are craving adventure and spices today. Your energy is high, so something crunchy, hot, or highly textured is perfect.", advice: "Avoid bland, repetitive meals. Experiment with a new spice cabinet discovery." },
            { name: "Taurus", traits: "sensual, comforting, and luxurious", forecast: "Today is a day for deep comfort. Rich, velvety, or sweet flavors will align beautifully with your ruling planet Venus.", advice: "Slow down and enjoy every bite. Do not rush through a quick lunch." },
            { name: "Gemini", traits: "curious, versatile, and energetic", forecast: "Your dual nature is seeking variety! A fusion dish or a sampler platter with sweet and savory bites will satisfy both sides of you.", advice: "Keep it fun and playful. Share food with a friend or order multiple small plates." },
            { name: "Cancer", traits: "intuitive, warm, and sentimental", forecast: "The stars suggest looking backward today. A warm, nostalgic comfort food from your childhood will heal and soothe your spirit.", advice: "Stick with warm bowls or home-cooked favorites. Warm tea is your ally." },
            { name: "Leo", traits: "bold, theatrical, and premium", forecast: "You deserve to dine like royalty today! Seek visually stunning dishes, bright colors, and premium ingredients that make you smile.", advice: "Don't settle for leftovers. Dine somewhere with excellent atmosphere or plate your food beautifully." },
            { name: "Virgo", traits: "clean, detailed, and organic", forecast: "Your body is asking for balance and clean, earthy, or fresh garden flavors. Fresh greens, perfectly steamed grains, or sharp citrus accents.", advice: "Avoid heavy, oily foods that slow you down. Drink clean water with lemon." },
            { name: "Libra", traits: "balanced, artistic, and sweet", forecast: "You are looking for perfect aesthetic and flavor harmony. A beautiful dessert, a sweet and savory dish, or an artisan pastry is in your future.", advice: "Find balance in your plating. Try sweet chili or honey-mustard glaze." },
            { name: "Scorpio", traits: "intense, mysterious, and rich", forecast: "Your craving today is intense and deeply complex. Dark chocolate, rich umami mushrooms, smoky BBQ, or deep fermented flavors will speak to you.", advice: "Go deep on flavor depth. Try black garlic or high-grade extra dark chocolate." },
            { name: "Sagittarius", traits: "adventurous, free-spirited, and worldly", forecast: "Your wanderlust is calling! Travel through your plate by ordering authentic international street food, like Thai, Mexican, or Indian.", advice: "Don't play it safe. Pick the absolute spiciest or most exotic option on the menu." },
            { name: "Capricorn", traits: "disciplined, classic, and structured", forecast: "You appreciate high-quality craft and tradition. A classic steak, wood-fired artisanal pizza, or a perfectly executed family recipe.", advice: "Stick to high craftsmanship. Avoid fast food shortcuts." },
            { name: "Aquarius", traits: "eccentric, innovative, and dynamic", forecast: "The stars are pushing you to try something completely off the wall. Weird food combinations or experimental dining will excite your brain.", advice: "Try an unusual fusion, like spicy peanut butter noodles or kimchi fries." },
            { name: "Pisces", traits: "dreamy, artistic, and oceanic", forecast: "A dreamy, comforting culinary journey is waiting. Think of soothing soups, fresh seafood, or creamy, melt-in-your-mouth textures.", advice: "Stay hydrated. Let your imagination run wild during dinner." }
        ];

        let index = 0;
        if (birthday) {
            const parts = birthday.split('-');
            const month = parseInt(parts[1]) || 1;
            index = (month - 1) % 12;
        } else {
            index = Math.floor(Math.random() * 12);
        }

        const picked = signs[index];
        const drinkTip = isUnder21 ? "fruit-infused sparkling water" : "a perfect craft brew or cocktail pairing";

        return {
            sign: picked.name,
            forecast: `Since you are a wonderful ${picked.name} (${picked.traits}), today's Flavor Forecast suggests: ${picked.forecast}`,
            advice: picked.advice,
            bonusTip: `Bonus Tip: Try pairing this meal with some ${drinkTip} for a boosted mood today!`
        };
    },

    getCraiveType: (answers: QuizAnswer[]): CraiveTypeProfile => {
        const types = [
            {
                name: 'The Adventurous Explorer',
                title: 'The Adventurous Explorer',
                description: 'You live for the thrill of the unknown! For you, food is an ongoing expedition. You love discovering new dishes, experimenting with exotic ingredients, and trying wild culinary fusions.',
                strengths: ['Fearless culinary curiosity', 'Highly adaptable palate', 'Pioneering taste preferences'],
                weaknesses: ['Impulsive ordering', 'Easily bored by repeat menus', 'Hard to satisfy at standard diners'],
                comfortFoods: ['Spicy Sichuan hotpot', 'Street-style Birria tacos', 'Aromatic Thai green curry'],
                riskyFlavors: ['Durian pastry', 'Bitter melon stir-fry', 'Gorgonzola blue cheese']
            },
            {
                name: 'The Nostalgic Nurturer',
                title: 'The Nostalgic Nurturer',
                description: 'To you, food is love, memory, and emotional connection. You associate specific dishes with warm childhood memories, family gatherings, and comforting emotional states.',
                strengths: ['Great home-cooking instincts', 'Deep appreciation for family recipes', 'Brings people together through food'],
                weaknesses: ['Reluctant to try highly experimental dishes', 'Can overindulge when feeling stressed', 'Loves carb-heavy meals'],
                comfortFoods: ['Mom\'s homemade lasagna', 'Warm chocolate chip cookies', 'Classic mac and cheese'],
                riskyFlavors: ['Deconstructed modernist food', 'Raw seafood sashimi', 'Extremely spicy hot sauces']
            },
            {
                name: 'The Sweet Seeker',
                title: 'The Sweet Seeker',
                description: 'Life is short—eat dessert first! You believe that sweetness is one of life\'s greatest joys. You have a highly refined appreciation for pastries, creams, and chocolate.',
                strengths: ['Expert on local bakeries', 'Joyful approach to dining', 'Great dessert-plating eye'],
                weaknesses: ['Easily distracted by sugar rushes', 'Can skip savory nutrition', 'Frequent midnight cravings'],
                comfortFoods: ['Warm fudge brownies', 'Fluffy Belgian waffles with syrup', 'Madagascar vanilla gelato'],
                riskyFlavors: ['Extremely bitter espresso', 'Sour pickles', 'Spicy chipotle chocolate']
            },
            {
                name: 'The Flavor Scientist',
                title: 'The Flavor Scientist',
                description: 'You look at food as a beautiful puzzle of chemistry, texture, and presentation. You love molecular gastronomy, meticulous recipe execution, and exploring why certain tastes align.',
                strengths: ['Unrivaled plating precision', 'Understand complex flavor profiles', 'Highly methodical cooker'],
                weaknesses: ['Can over-analyze a simple meal', 'Highly critical of restaurant errors', 'Takes too long to prepare meals'],
                comfortFoods: ['Perfectly balanced French onion soup', 'Slow-cooked sous vide duck', 'Artisanal cheese platter'],
                riskyFlavors: ['Raw sea urchin', 'Snail escargot', 'Unfiltered botanical tonics']
            },
            {
                name: 'The Comfort Craver',
                title: 'The Comfort Craver',
                description: 'For you, food is a warm hug. You look for rich, hearty, warm, and satisfying meals that soothe your mind and de-stress your body after a long day.',
                strengths: ['Appreciates simple classics', 'Loyal to high-quality staple restaurants', 'Amazing soup and stew maker'],
                weaknesses: ['Tends to stay in a food comfort zone', 'High sodium or carb intake', 'Less interested in fresh raw greens'],
                comfortFoods: ['Creamy chicken pot pie', 'Slow-braised beef stew', 'Gooey grilled cheese and tomato soup'],
                riskyFlavors: ['Sour kimchi', 'Raw octopus', 'Bitter matcha powder']
            },
            {
                name: 'The Mindful Minimalist',
                title: 'The Mindful Minimalist',
                description: 'You respect the purity of raw ingredients and nutritious value. You prefer clean, simple, and unpretentious meals that nourish the body without unnecessary clutter.',
                strengths: ['Excellent nutrition choices', 'Deeply mindful, slow eater', 'Appreciates delicate flavor notes'],
                weaknesses: ['Can be perceived as a picky eater', 'Slightly restrictive dining choices', 'Hard to find options at greasy diners'],
                comfortFoods: ['Fresh avocado toast', 'Steamed salmon with vegetables', 'Warm organic quinoa bowl'],
                riskyFlavors: ['Deep-fried greasy fair food', 'Artificial marshmallow toppings', 'Oversweet processed cakes']
            }
        ];

        let sum = 0;
        answers.forEach(a => sum += a.answer);
        const index = sum % types.length;
        return types[index];
    },

    generatePersonalizedWelcome: (user: User): string => {
        const name = user.name || 'Guest';
        return `Hey ${name}! Welcome to Craive! ✨ I'm Mila, your personal flavor guide. 🥣 I've saved your food preferences and am ready to discover some unbelievable dishes with you. What are you craving today? 🍕🍣🌮`;
    },

    generateFoodMix: (ingredients: string, user: User | null): FoodMixResult[] => {
        const ingList = ingredients.split(',').map(i => i.trim().toLowerCase());
        return [
            {
                craiveName: "The Midnight Pan-Fry Fusion",
                personalityTag: "🔥 Spicy Adventurer",
                craiveStory: "When leftovers meet the midnight flame, delicious chaos ensues. This dish turns your ingredients into a crispy, sizzling skillet masterwork.",
                instructions: "1. Heat 1 tbsp of oil in a hot pan.\n2. Toss in your ingredients: " + ingList.join(', ') + ".\n3. Season generously with garlic powder, salt, and chili flakes.\n4. Pan-fry until sizzling and caramelized. Garnish with chopped scallions."
            },
            {
                craiveName: "Mila's Cozy Comfort Casserole",
                personalityTag: "💪 Cozy Comfort",
                craiveStory: "A baked, bubbling, gooey combination designed to make you feel warm from the inside out.",
                instructions: "1. Preheat oven to 375°F.\n2. Mix " + ingList.join(', ') + " in a baking dish.\n3. Stir in a splash of cream or melted cheese, plus a pinch of black pepper.\n4. Bake for 20 minutes until the top is golden and bubbling."
            },
            {
                craiveName: "The Golden Herb-Crisped Bowls",
                personalityTag: "🌱 Mindful Freshness",
                craiveStory: "Clean, crisp, and beautifully seasoned. Designed to respect the natural, fresh flavors of your ingredients.",
                instructions: "1. Toss " + ingList.join(', ') + " with a drizzle of olive oil and lemon juice.\n2. Roast on a sheet pan at 400°F for 15 minutes.\n3. Arrange in a shallow bowl, top with toasted pumpkin seeds or sesame seeds, and enjoy warm."
            }
        ];
    },

    generateCraveSyncSuggestions: (
        groupInputs: CraveSyncUserInput[],
        location: { latitude: number; longitude: number } | null
    ): CraveSyncOption[] => {
        const allLoves = Array.from(new Set(groupInputs.flatMap(input => input.loves))).filter(Boolean);
        const cuisines = allLoves.length > 0 ? allLoves : ['Sushi', 'Tacos', 'Italian', 'Burgers', 'Ramen'];
        
        const restaurantNames = [
            "The Golden Fork", "Noodle Craft", "Volcano Shabu", "Taco Oasis", "Bella Italia",
            "Sizzling Wok", "Gourmet Garden", "The Velvet Crumb", "Oceanic Sushi", "Urban Bistro"
        ];

        return restaurantNames.map((name, i) => {
            const cuisine = cuisines[i % cuisines.length];
            const prices = ['$', '$$', '$$$', '$$$$'];
            const price = prices[i % prices.length];
            const distNum = ((i * 3 + 4) / 10).toFixed(1);
            return {
                name: `${name} (${cuisine})`,
                cuisine: cuisine,
                price: price,
                distance: `${distNum} miles`
            };
        });
    },

    generateSpeech: (textToSpeak: string): string | undefined => {
        return undefined;
    }
};

// ==========================================
// ========== EXPORTED AI FUNCTIONS =========
// ==========================================

export const getFoodSuggestions = async (userInput: string): Promise<Suggestion[]> => {
    if (!process.env.API_KEY) {
        console.log("No API Key detected, running Local AI Suggestions.");
        return localAI.getFoodSuggestions(userInput);
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `You are Mila, a friendly and creative AI flavor guide. A user is craving '${userInput}'. Generate exactly 4 crave-worthy, creative, and delicious food ideas based on this. Provide a short, mouth-watering description for each. Respond ONLY with a valid JSON array of objects, adhering to the provided schema.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: suggestionResponseSchema,
                temperature: 0.8,
                topP: 0.95,
            }
        });

        const jsonText = response.text.trim();
        const suggestions = JSON.parse(jsonText);
        
        if (!Array.isArray(suggestions) || suggestions.some(s => !s.title || !s.description)) {
          throw new Error("Invalid JSON structure received from API.");
        }

        return suggestions;

    } catch (error) {
        console.error("Gemini API suggestion call failed, falling back to Local AI:", error);
        return localAI.getFoodSuggestions(userInput);
    }
};

export const getCraiveScope = async (birthday: string, isUnder21: boolean): Promise<CraveScope> => {
    if (!process.env.API_KEY) {
        console.log("No API Key detected, running Local AI CraiveScope.");
        return localAI.getCraiveScope(birthday, isUnder21);
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `You are an AI astrologer named Mila, specializing in "Food Astrology."
        A user was born on ${birthday}. 
        Based on their birth date, determine their astrological sign and generate a "Flavor Forecast" for today.
        The forecast should blend astrological traits (e.g., Aries=bold, Virgo=clean) with seasonal food science (e.g., winter-borns crave carbs).
        ${isUnder21 ? 'The user is under 21, so DO NOT mention or allude to alcoholic beverages.' : ''}

        Respond ONLY with a valid JSON object adhering to the provided schema.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: craiveScopeResponseSchema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Gemini API CraiveScope call failed, falling back to Local AI:", error);
        return localAI.getCraiveScope(birthday, isUnder21);
    }
};

export const getCraiveType = async (answers: QuizAnswer[]): Promise<CraiveTypeProfile> => {
    if (!process.env.API_KEY) {
        console.log("No API Key detected, running Local AI CraiveType analysis.");
        return localAI.getCraiveType(answers);
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const answersString = answers.map(a => `- "${a.question}": ${a.answer}/10`).join('\n');
        
        const prompt = `You are a "Food Psychologist" AI named Mila. You will analyze a user's answers to a personality quiz and assign them one of the following CraiveTypes:
        - The Adventurous Explorer
        - The Nostalgic Nurturer
        - The Sweet Seeker
        - The Flavor Scientist
        - The Comfort Craver
        - The Mindful Minimalist

        Based on the user's quiz answers below, determine their primary CraiveType. Then, generate a detailed, warm, and insightful personality profile.
        
        Quiz Answers:
        ${answersString}
        
        Your response must be a valid JSON object adhering to the provided schema. The 'name' must be one of the CraiveTypes from the list above.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: craiveTypeResponseSchema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Gemini API CraiveType call failed, falling back to Local AI:", error);
        return localAI.getCraiveType(answers);
    }
};

export const generatePersonalizedWelcome = async (user: User): Promise<string> => {
    if (!process.env.API_KEY) {
        console.log("No API Key detected, running Local AI Welcome message.");
        return localAI.generatePersonalizedWelcome(user);
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const preferences = [
            user.allergies && `Allergies: ${user.allergies}`,
            user.dislikes && `Dislikes: ${user.dislikes}`,
            user.otherPrefs && `Other preferences: ${user.otherPrefs}`
        ].filter(Boolean).join(', ');

        const prompt = `You are Mila, a friendly AI flavor guide. A new user named ${user.name} has just completed onboarding. Their stated preferences are: "${preferences}". Craft a short, warm, and exciting welcome message (2-3 sentences). Acknowledge that you've saved their preferences and are ready to help. End by asking an open-ended question like "So, what are you craving today?". Use emojis.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Gemini API welcome call failed, falling back to Local AI:", error);
        return localAI.generatePersonalizedWelcome(user);
    }
};

export const generateFoodMix = async (ingredients: string, user: User | null): Promise<FoodMixResult[]> => {
    if (!process.env.API_KEY) {
        console.log("No API Key detected, running Local AI FoodMix combos.");
        return localAI.generateFoodMix(ingredients, user);
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let userContext = "The user is looking for creative food combinations.";
        if (user) {
            const preferences = [
                user.craiveTypeProfile ? `Their food personality is '${user.craiveTypeProfile.name}'.` : '',
                user.favoriteCuisines ? `They like these cuisines: ${user.favoriteCuisines}.` : '',
                user.spiceTolerance ? `Their spice tolerance is ${user.spiceTolerance}.` : '',
                user.dietGoals ? `Their diet goals are: ${user.dietGoals}.` : '',
                user.foodHabits ? `Their food habits include: ${user.foodHabits}.` : '',
                user.dislikes ? `They dislike: ${user.dislikes}.` : '',
                user.allergies ? `They have allergies to: ${user.allergies}.` : ''
            ].filter(Boolean).join(' ');
            if (preferences) {
                userContext = `Based on the following user profile, generate creative food combinations. ${preferences}`;
            }
        }

        const prompt = `You are Mila, a "Fridge Magician" AI. A user has the following ingredients: "${ingredients}".
        ${userContext}
        
        Your task is to generate up to 10 unique, AI-crafted food combinations. For each combination:
        1.  Create a fun, viral, and exciting "Craive Name".
        2.  Assign a "Personality Tag" (e.g., 🔥 The Midnight Volcano, 🌈 Sweet Symphony, 💪 The Hangry Healer).
        3.  Write a short, funny, or poetic "Craive Story" that describes the dish's personality.
        4.  Provide simple, clear instructions on how to make it.
        
        Be creative and bold! Think about flavor fusion and turning leftovers into art.
        Respond ONLY with a valid JSON array of objects, adhering to the provided schema.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: foodMixResponseSchema,
                temperature: 0.9,
                topP: 0.95,
            }
        });

        const jsonText = response.text.trim();
        const results = JSON.parse(jsonText);
        
        if (!Array.isArray(results) || results.some(r => !r.craiveName || !r.craiveStory)) {
          throw new Error("Invalid JSON structure received from API for FoodMix.");
        }

        return results;

    } catch (error) {
        console.error("Gemini API FoodMix call failed, falling back to Local AI:", error);
        return localAI.generateFoodMix(ingredients, user);
    }
};

export const generateCraveSyncSuggestions = async (
    groupInputs: CraveSyncUserInput[],
    location: { latitude: number; longitude: number } | null
): Promise<CraveSyncOption[]> => {
    if (!process.env.API_KEY) {
        console.log("No API Key detected, running Local AI CraveSync suggestions.");
        return localAI.generateCraveSyncSuggestions(groupInputs, location);
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const groupPreferencesString = groupInputs.map((input, index) => 
            `User ${index + 1}: Loves [${input.loves.join(', ')}], Hates [${input.hates.join(', ')}], Vibe: "${input.vibe}"`
        ).join('\n');

        const locationContext = location 
            ? `The group is located near latitude ${location.latitude} and longitude ${location.longitude}. Use real-world local data to find suggestions that are geographically close to them.`
            : `Assume the group is in a major metropolitan area with diverse dining options (e.g., New York, London, Tokyo).`;

        const prompt = `You are Mila, an AI dining concierge for a group of people. Analyze their collective preferences and generate a list of 10-15 diverse restaurant suggestions for them to vote on.

        ${locationContext}
        
        Group preferences are as follows:
        ${groupPreferencesString}
        
        RULES:
        1.  Absolutely DO NOT suggest any cuisine, restaurant, or food type mentioned in any user's 'Hates' list. This is a hard veto.
        2.  Prioritize options that satisfy multiple users' 'Loves' and the collective 'Vibe' of the group.
        3.  Include a diverse range of cuisines that fit the preferences.
        
        IMPORTANT: Your response MUST be a single, valid JSON array of objects, and nothing else. Do not wrap it in markdown backticks. Each object must contain exactly these properties:
        - "name": The restaurant's plain text name.
        - "cuisine": The primary cuisine type.
        - "price": The price range as "$", "$$", "$$$", or "$$$$".
        - "distance": An estimated distance like "0.5 miles".

        Do not include any URLs, links, markdown, or any text outside of the JSON array.`;

        const config: any = {
            temperature: 0.8,
        };

        if (location) {
            config.tools = [{ googleMaps: {} }];
            config.toolConfig = {
                retrievalConfig: {
                    latLng: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                    },
                },
            };
        } else {
            config.responseMimeType = "application/json";
            config.responseSchema = craveSyncOptionsSchema;
        }

         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config,
        });
        
        const jsonText = response.text.trim();
        const results = JSON.parse(jsonText);
        
        if (!Array.isArray(results) || results.some(r => !r.name || !r.cuisine)) {
          throw new Error("Invalid JSON structure received from API for CraveSync.");
        }

        return results;

    } catch (error) {
        console.error("Gemini API CraveSync call failed, falling back to Local AI:", error);
        return localAI.generateCraveSyncSuggestions(groupInputs, location);
    }
};

export const generateSpeech = async (textToSpeak: string): Promise<string | undefined> => {
    if (!process.env.API_KEY) {
        return localAI.generateSpeech(textToSpeak);
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: textToSpeak }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio;
    } catch (error) {
        console.error("Error generating speech from Gemini API:", error);
        return undefined;
    }
};
