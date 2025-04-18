/**
 * Student Import Script for Investment Odyssey
 *
 * This script imports student usernames and passcodes from a CSV file
 * and creates profiles in the Supabase database.
 */

// Import required modules
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to import students
async function importStudents(csvFilePath) {
  console.log('Starting student import...');

  const students = [];

  // Read CSV file
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      const id = uuidv4();
      students.push({
        id: id,
        custom_id: id, // Use the same UUID for both id and custom_id
        name: row.username,
        role: 'student',
        passcode: row.passcode,
        created_at: new Date().toISOString(),
        last_login: null
      });
    })
    .on('end', async () => {
      console.log(`Read ${students.length} students from CSV file.`);

      // Insert students in batches of 100
      const batchSize = 100;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);

        const { data, error } = await supabase
          .from('profiles')
          .insert(batch);

        if (error) {
          console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        } else {
          console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} students)`);
        }
      }

      console.log('Student import completed.');
    });
}

// Run the import
const csvFilePath = process.argv[2] || 'course_materials/username_passcode.csv';
importStudents(csvFilePath);
