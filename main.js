const GEMINI_API_KEY = "AIzaSyBtjoIudBeWF_abRJo68eBG8mrXOQlWtu4";

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

        const fullPrompt = `
You are a travel assistant. Based on this description: "${prompt}", return the following information in this exact format:

Name: (Name of place)
About: (General description about the place)
Geography: (Geographic details like elevation, area, major features)
History: (Short history)
Location: (City, Country or region)
BestTimeToVisit:
  Spring: (Spring visiting information)
  Summer: (Summer visiting information)
  Autumn: (Autumn visiting information)
  Winter: (Winter visiting information)
Activities:
  Mountain: (Mountain hiking description, if no mountains say "No mountains in this area")
  River: (River activities description, if no rivers say "No rivers in this area")
  Photo: (Photography opportunities description)
  Rock: (Rock climbing description, if no rock climbing say "No rock climbing available")
Latitude: xx.xxxx
Longitude: yy.yyyy

Make sure to complete all sections and provide coordinates for the location.`;

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
                                    text: fullPrompt
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 1,
                        topP: 1,
                        maxOutputTokens: 500
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

            // Extract data using regex with more robust patterns
            const name = text.match(/Name:\s*(.*?)(?=\n|$)/)?.[1]?.trim();
            const about = text.match(/About:\s*([\s\S]*?)(?=Geography:|$)/)?.[1]?.trim();
            const geography = text.match(/Geography:\s*([\s\S]*?)(?=History:|$)/)?.[1]?.trim();
            const history = text.match(/History:\s*([\s\S]*?)(?=Location:|$)/)?.[1]?.trim();
            const location = text.match(/Location:\s*(.*?)(?=\n|$)/)?.[1]?.trim();
            const spring = text.match(/Spring:\s*(.*?)(?=\n|$)/)?.[1]?.trim();
            const summer = text.match(/Summer:\s*(.*?)(?=\n|$)/)?.[1]?.trim();
            const autumn = text.match(/Autumn:\s*(.*?)(?=\n|$)/)?.[1]?.trim();
            const winter = text.match(/Winter:\s*(.*?)(?=\n|$)/)?.[1]?.trim();
            const mountain = text.match(/Mountain:\s*(.*?)(?=\n|$)/)?.[1]?.trim();
            const river = text.match(/River:\s*(.*?)(?=\n|$)/)?.[1]?.trim();
            const photo = text.match(/Photo:\s*(.*?)(?=\n|$)/)?.[1]?.trim();
            const rock = text.match(/Rock:\s*(.*?)(?=\n|$)/)?.[1]?.trim();
            const latMatch = text.match(/Latitude:\s*(-?\d+(?:\.\d+)?)/);
            const lngMatch = text.match(/Longitude:\s*(-?\d+(?:\.\d+)?)/);

            console.log("Extracted data:", { name, about, geography, history, location, spring, summer, autumn, winter, mountain, river, photo, rock });
            console.log("Coordinate matches:", { latMatch, lngMatch });

            // Update HTML elements with extracted information
            updateElement("nameof", name);
            updateElement("about-text", about);
            updateElement("Geography-text", geography); // Note: Capital G in HTML
            updateElement("history-text", history);
            updateElement("spring-text", spring);
            updateElement("summer-text", summer);
            updateElement("Autumn-text", autumn); // Note: Capital A in HTML
            updateElement("Winter-text", winter); // Note: Capital W in HTML
            updateElement("mountain-text", mountain);
            updateElement("river-text", river);
            updateElement("photo-text", photo);
            updateElement("rock-text", rock);

            // Handle coordinates and map
            if (latMatch && lngMatch) {
                const lat = parseFloat(latMatch[1]);
                const lng = parseFloat(lngMatch[1]);

                console.log("Parsed coordinates:", { lat, lng });
                coordsOutput.innerText = `${location || 'Location'}: Lat: ${lat}, Lng: ${lng}`;

                // Initialize map
                initializeMap(lat, lng, name);
            } else {
                coordsOutput.innerText = "Location found but coordinates unavailable";
                console.error("Failed to parse coordinates from:", text);
                
                // Show a placeholder map message
                const mapElement = document.getElementById("map");
                if (mapElement) {
                    mapElement.innerHTML = `
                        <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 300px; background: #f0f0f0; border-radius: 10px;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
                            <h3>Map Location</h3>
                            <p>Coordinates not available for this location</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            coordsOutput.innerText = "Error: " + error.message;
            console.error("Full error:", error);
        }
    }

    function updateElement(id, value) {
        const element = document.getElementById(id);
        if (element && value) {
            element.innerText = value;
        } else if (element) {
            console.warn(`No value found for element: ${id}`);
        } else {
            console.warn(`Element not found: ${id}`);
        }
    }

    function initializeMap(lat, lng, placeName) {
        // Check if Google Maps is loaded
        if (typeof google !== 'undefined' && google.maps) {
            const mapElement = document.getElementById("map");
            if (mapElement) {
                // Clear existing content
                mapElement.innerHTML = '';
                
                const map = new google.maps.Map(mapElement, {
                    center: { lat, lng },
                    zoom: 12,
                    styles: [
                        {
                            featureType: "water",
                            elementType: "geometry",
                            stylers: [{ color: "#e9e9e9" }, { lightness: 17 }]
                        },
                        {
                            featureType: "landscape",
                            elementType: "geometry",
                            stylers: [{ color: "#f5f5f5" }, { lightness: 20 }]
                        }
                    ]
                });

                new google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: placeName || "Location found by Gemini AI",
                    animation: google.maps.Animation.DROP
                });
                
                console.log("Map and marker created successfully");
            } else {
                console.error("Map element not found");
            }
        } else {
            console.error("Google Maps not loaded");
            // Show fallback map placeholder
            const mapElement = document.getElementById("map");
            if (mapElement) {
                mapElement.innerHTML = `
                    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 300px; background: #f0f0f0; border-radius: 10px;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🗺️</div>
                        <h3>Map Loading...</h3>
                        <p>Google Maps is loading. Please wait...</p>
                    </div>
                `;
            }
        }
    }
});

// Initialize Google Maps callback
function initMap() {
    console.log("Google Maps initialized and ready");
}