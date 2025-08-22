// Import the Supabase client library
import { createClient } from '@supabase/supabase-js';

// These details are safe to use in a serverless function
// They will be loaded from Vercel's environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// This is the main function that Vercel will run
export default async function handler(request, response) {
    // We only want to handle POST requests, reject others
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        // Get the user data from the request body
        const { name, email, age } = request.body;

        // Basic validation: check if required fields are present
        if (!name || !email || !age) {
            return response.status(400).json({ message: 'Name, email, and age are required.' });
        }

        // Insert the data into the 'users' table in Supabase
        const { data, error } = await supabase
            .from('users')
            .insert([{ name, email, age }])
            .select();

        // If there was an error inserting data
        if (error) {
            console.error('Supabase error:', error);
            // Check for specific errors, like a duplicate email
            if (error.code === '23505') { // Postgres code for unique violation
                 return response.status(409).json({ message: 'This email is already registered.' });
            }
            return response.status(500).json({ message: 'Error saving data to the database.' });
        }

        // If data was inserted successfully
        return response.status(200).json({ message: 'User registered successfully!', user: data });

    } catch (error) {
        console.error('Server error:', error);
        return response.status(500).json({ message: 'An unexpected error occurred.' });
    }
}