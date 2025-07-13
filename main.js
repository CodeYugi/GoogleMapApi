  const GEMINI_API_KEY = "AIzaSyC2eCO9h0_HmqdwFqWUZwudoqkGPx0KPVY";
        
        // Wait for DOM to load
        document.addEventListener('DOMContentLoaded', function() {
            const input = document.getElementById("input-text");
            const button = document.getElementById("button-find");
            const coordsOutput = document.getElementById("coords-output");

            console.log("DOM loaded, elements found:", {
                input: !!input,
                button: !!button,
                coordsOutput: !!coordsOutput
            });

            if (button) {
                button.addEventListener("click", function(e) {
                    e.preventDefault();
                    handleGeminiMap();
                });
            }
            
            if (input) {
                input.addEventListener("keypress", function(e) {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        handleGeminiMap();
                    }
                });
            }

            async function handleGeminiMap() {
                console.log("handleGeminiMap called");
                
                if (!input || !coordsOutput) {
                    console.error("Required elements not found");
                    return;
                }

                const prompt = input.value.trim();
                console.log("Search prompt:", prompt);
                
                if (!prompt) {
                    coordsOutput.innerText = "Please enter a place description.";
                    return;
                }

                coordsOutput.innerText = "Searching for location...";

                try {
                    console.log("Making API call to Gemini...");
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    parts: [
                                        {
                                            text: "You are a travel assistant. Based on the description provided, return only the most accurate and low-crowded real-world location that matches it. Reply ONLY with the coordinates in this format: Latitude: xx.xxxx, Longitude: yy.yyyy Do not include any extra text, explanation, or multiple options. Here is the place description: " + prompt
                                        }
                                    ]
                                }
                            ],
                            generationConfig: {
                                temperature: 0.7,
                                topK: 1,
                                topP: 1,
                                maxOutputTokens: 50
                            }
                        })
                    });

                    console.log("API response status:", res.status);

                    if (!res.ok) {
                        throw new Error(`HTTP error! status: ${res.status}`);
                    }

                    const data = await res.json();
                    console.log("API response data:", data);
                    
                    if (data.error) {
                        throw new Error(data.error.message || "API Error");
                    }

                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
                    console.log("Gemini raw response:", text);
                    coordsOutput.innerText = text;

                    const latMatch = text.match(/Latitude:\s*(-?\d+(\.\d+)?)/);
                    const lngMatch = text.match(/Longitude:\s*(-?\d+(\.\d+)?)/);

                    console.log("Coordinate matches:", { latMatch, lngMatch });

                    if (latMatch && lngMatch) {
                        const lat = parseFloat(latMatch[1]);
                        const lng = parseFloat(lngMatch[1]);

                        console.log("Parsed coordinates:", { lat, lng });

                        // Check if Google Maps is loaded
                        if (typeof google !== 'undefined' && google.maps) {
                            const mapElement = document.getElementById("map");
                            if (mapElement) {
                                const map = new google.maps.Map(mapElement, {
                                    center: { lat, lng },
                                    zoom: 12,
                                });

                                new google.maps.Marker({
                                    position: { lat, lng },
                                    map: map,
                                    title: "Location found by Gemini AI",
                                });
                                
                                console.log("Map and marker created successfully");
                            } else {
                                console.error("Map element not found");
                            }
                        } else {
                            console.error("Google Maps not loaded");
                            coordsOutput.innerText = text + " (Google Maps not loaded)";
                        }
                    } else {
                        coordsOutput.innerText = "Could not parse coordinates from: " + text;
                        console.error("Failed to parse coordinates");
                    }
                } catch (error) {
                    coordsOutput.innerText = "Error: " + error.message;
                    console.error("Full error:", error);
                }
            }
        });

        // Initialize Google Maps callback
        function initMap() {
            console.log("Google Maps initialized");
        }