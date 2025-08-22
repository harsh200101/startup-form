// api/register.js

import { createClient } from '@supabase/supabase-js';

// Load credentials from Vercel's environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- NEW: Function to generate the unique random ID ---
// Creates an ID like "GG" + 6 random digits (e.g., GG123456)
function generateUniqueId() {
    const prefix = 'GG';
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomNumber}`;
}

// The main serverless function
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // --- UPDATED: Get data that matches your database schema ---
        const { full_name, email, city, state } = request.body;
        
        // --- Generate the new unique ID ---
        const newUserId = generateUniqueId();

        // Basic validation for required fields
        if (!full_name || !email) {
            return response.status(400).json({ message: 'Full name and email are required.' });
        }

        // --- UPDATED: This is the exact object that will be saved to your database ---
        const userDataToInsert = {
            id: newUserId,
            full_name: full_name,
            email: email,
            city: city || null, // If city is not provided, save it as NULL
            state: state || null // If state is not provided, save it as NULL
        };

        // Insert the data into the 'users' table
        const { data, error } = await supabase
            .from('users')
            .insert([userDataToInsert])
            .select();

        // Handle errors from Supabase
        if (error) {
            console.error('Supabase error:', error);
            // Check for a duplicate email error
            if (error.code === '23505') {
                 return response.status(409).json({ message: 'This email address is already registered.' });
            }
            return response.status(500).json({ message: 'Error saving data.' });
        }

        // Success!
        return response.status(200).json({ message: 'Registration successful!', user: data });

    } catch (err) {
        console.error('Server error:', err);
        return response.status(500).json({ message: 'An unexpected error occurred.' });
    }
}