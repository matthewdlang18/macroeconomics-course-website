/**
 * Supabase Client Initialization
 * This file initializes the Supabase client with the credentials from env.js
 */

// Initialize Supabase client
(function() {
    try {
        // Check if we should use the mock client (for development/testing)
        const useMockClient = true; // Set to true to force using the mock client

        if (useMockClient) {
            console.warn('Using mock Supabase client for development/testing');
            initializeMockClient();
            return;
        }

        // Check if supabaseUrl and supabaseKey are defined
        if (typeof supabaseUrl === 'undefined' || typeof supabaseKey === 'undefined') {
            console.warn('Supabase credentials not found in env.js, using hardcoded values');
            window.supabaseUrl = 'https://clyyjcjwcbbmdlccmtaa.supabase.co';
            window.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNseXlqY2p3Y2JibWRsY2NtdGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NTk3NDQsImV4cCI6MjA2MDQzNTc0NH0.ADHB7McgJ29pMWmLgjMZYiU9Tnk2ZodKvf4PBndmxbQ';
        } else {
            window.supabaseUrl = supabaseUrl;
            window.supabaseKey = supabaseKey;
        }

        console.log('Initializing Supabase client with URL:', window.supabaseUrl);

        // Try to initialize Supabase client
        try {
            window.supabase = supabase.createClient(window.supabaseUrl, window.supabaseKey);
            console.log('Supabase client initialized successfully');
        } catch (clientError) {
            console.error('Error creating Supabase client:', clientError);
            initializeMockClient();
        }
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        initializeMockClient();
    }

    // Function to initialize a mock Supabase client
    function initializeMockClient() {
        console.warn('Initializing mock Supabase client');

        // Create a more robust mock Supabase client
        window.supabase = {
            // Mock from method for table operations
            from: function(table) {
                console.log(`Mock Supabase: Accessing table '${table}'`);

                // Get data from localStorage based on table name
                const getTableData = function() {
                    const storageKey = `supabase_mock_${table}`;
                    return JSON.parse(localStorage.getItem(storageKey) || '[]');
                };

                // Save data to localStorage
                const saveTableData = function(data) {
                    const storageKey = `supabase_mock_${table}`;
                    localStorage.setItem(storageKey, JSON.stringify(data));
                };

                // Initialize table if it doesn't exist
                if (!localStorage.getItem(`supabase_mock_${table}`)) {
                    // Create sample data for specific tables
                    if (table === 'sections') {
                        const sampleSections = [
                            { id: '1', day: 'Monday', time: '10:00-11:30', location: 'Room 101', ta_id: '1', profiles: { name: 'Akshay' } },
                            { id: '2', day: 'Tuesday', time: '13:00-14:30', location: 'Room 102', ta_id: '2', profiles: { name: 'Simran' } },
                            { id: '3', day: 'Wednesday', time: '15:00-16:30', location: 'Room 103', ta_id: '3', profiles: { name: 'Camilla' } },
                            { id: '4', day: 'Thursday', time: '10:00-11:30', location: 'Room 104', ta_id: '4', profiles: { name: 'Hui Yann' } },
                            { id: '5', day: 'Friday', time: '13:00-14:30', location: 'Room 105', ta_id: '5', profiles: { name: 'Lars' } }
                        ];
                        saveTableData(sampleSections);
                    } else if (table === 'leaderboard') {
                        const sampleLeaderboard = [
                            { id: '1', user_id: 'student1', user_name: 'John Doe', final_value: 15000, game_mode: 'single', created_at: new Date().toISOString() },
                            { id: '2', user_id: 'student2', user_name: 'Jane Smith', final_value: 18000, game_mode: 'single', created_at: new Date().toISOString() },
                            { id: '3', user_id: 'student3', user_name: 'Bob Johnson', final_value: 12000, game_mode: 'class', created_at: new Date().toISOString() }
                        ];
                        saveTableData(sampleLeaderboard);
                    } else {
                        saveTableData([]);
                    }
                }

                return {
                    // Mock select method
                    select: function(columns) {
                        console.log(`Mock Supabase: Selecting columns '${columns}' from '${table}'`);
                        let selectedData = getTableData();
                        let filters = [];
                        let orderByColumn = null;
                        let orderAscending = true;
                        let limitCount = null;
                        let rangeFrom = null;
                        let rangeTo = null;

                        return {
                            // Mock eq method for filtering
                            eq: function(column, value) {
                                console.log(`Mock Supabase: Adding filter ${column} = ${value}`);
                                filters.push({ column, value, operator: 'eq' });
                                return this;
                            },

                            // Mock order method for sorting
                            order: function(column, { ascending } = { ascending: true }) {
                                console.log(`Mock Supabase: Ordering by ${column} ${ascending ? 'ASC' : 'DESC'}`);
                                orderByColumn = column;
                                orderAscending = ascending !== false;
                                return this;
                            },

                            // Mock limit method
                            limit: function(count) {
                                console.log(`Mock Supabase: Limiting to ${count} results`);
                                limitCount = count;
                                return this;
                            },

                            // Mock range method
                            range: function(from, to) {
                                console.log(`Mock Supabase: Setting range from ${from} to ${to}`);
                                rangeFrom = from;
                                rangeTo = to;
                                return this;
                            },

                            // Mock single method
                            single: function() {
                                console.log(`Mock Supabase: Getting single result`);

                                // Apply filters
                                let filteredData = selectedData;
                                filters.forEach(filter => {
                                    if (filter.operator === 'eq') {
                                        filteredData = filteredData.filter(item => item[filter.column] === filter.value);
                                    }
                                });

                                return {
                                    data: filteredData.length > 0 ? filteredData[0] : null,
                                    error: null
                                };
                            },

                            // Execute the query and return results
                            then: function(callback) {
                                // Apply filters
                                let filteredData = selectedData;
                                filters.forEach(filter => {
                                    if (filter.operator === 'eq') {
                                        filteredData = filteredData.filter(item => item[filter.column] === filter.value);
                                    }
                                });

                                // Apply sorting
                                if (orderByColumn) {
                                    filteredData.sort((a, b) => {
                                        if (a[orderByColumn] < b[orderByColumn]) return orderAscending ? -1 : 1;
                                        if (a[orderByColumn] > b[orderByColumn]) return orderAscending ? 1 : -1;
                                        return 0;
                                    });
                                }

                                // Apply limit
                                if (limitCount !== null) {
                                    filteredData = filteredData.slice(0, limitCount);
                                }

                                // Apply range
                                if (rangeFrom !== null && rangeTo !== null) {
                                    filteredData = filteredData.slice(rangeFrom, rangeTo + 1);
                                }

                                const result = {
                                    data: filteredData,
                                    error: null,
                                    count: selectedData.length
                                };

                                callback(result);
                                return this;
                            }
                        };
                    },

                    // Mock insert method
                    insert: function(data) {
                        console.log(`Mock Supabase: Inserting data into '${table}'`, data);
                        const tableData = getTableData();

                        // Generate an ID if not provided
                        if (!data.id) {
                            data.id = Date.now().toString();
                        }

                        // Add created_at if not provided
                        if (!data.created_at) {
                            data.created_at = new Date().toISOString();
                        }

                        tableData.push(data);
                        saveTableData(tableData);

                        return {
                            select: function() {
                                return {
                                    single: function() {
                                        return { data: data, error: null };
                                    }
                                };
                            }
                        };
                    },

                    // Mock update method
                    update: function(data) {
                        console.log(`Mock Supabase: Updating data in '${table}'`, data);
                        let tableData = getTableData();
                        let idToUpdate = null;

                        return {
                            eq: function(column, value) {
                                console.log(`Mock Supabase: Updating where ${column} = ${value}`);

                                // Find the item to update
                                const index = tableData.findIndex(item => item[column] === value);
                                if (index !== -1) {
                                    // Update the item
                                    tableData[index] = { ...tableData[index], ...data };
                                    saveTableData(tableData);
                                    return { data: tableData[index], error: null };
                                }

                                return { data: null, error: null };
                            }
                        };
                    },

                    // Mock delete method
                    delete: function() {
                        console.log(`Mock Supabase: Deleting from '${table}'`);
                        let tableData = getTableData();

                        return {
                            eq: function(column, value) {
                                console.log(`Mock Supabase: Deleting where ${column} = ${value}`);

                                // Filter out the items to delete
                                const newData = tableData.filter(item => item[column] !== value);
                                saveTableData(newData);

                                return { data: null, error: null };
                            }
                        };
                    }
                };
            },

            // Mock auth methods
            auth: {
                signUp: function() {
                    return Promise.resolve({ user: null, session: null, error: null });
                },
                signIn: function() {
                    return Promise.resolve({ user: null, session: null, error: null });
                },
                signOut: function() {
                    return Promise.resolve({ error: null });
                },
                onAuthStateChange: function(callback) {
                    callback('SIGNED_OUT', null);
                    return { data: { subscription: { unsubscribe: function() {} } } };
                }
            }
        };

        console.warn('Mock Supabase client initialized');
    }
})();
