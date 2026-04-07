// using vite, we can write our code with URLs that simply read
// /api/v2/xxx
// and vite will proxy them to whichever server is configured in vite.config.js,
// which is currently set to https://pixels-war.fly.dev
// so there's essentially no need for a global variable with the server URL..

// also note that it's probably wise to start with the TEST map

document.addEventListener("DOMContentLoaded",
    async () => {
        let NI = 0
        let NJ = 0
        let MAP_ID = "TEST"
        let API_KEY = undefined

        // for starters we get the list of maps from the server
        // and use that to populate the mapid input
        // so we don't have to guess the map ids

        console.log("Retrieving maps from the server...")
        const maps_response = await fetch(`/api/v2/maps`, {credentials: "include"})
        const maps_json = await maps_response.json()

        //SPOILER:
        // test for the response status code, and if not 2xx,
        // use alert() to display an ehopefully meaningful error
        if (!maps_response.ok) {
            alert(`Error retrieving maps: ${maps_response.status} ${maps_response.statusText}`)
            return
        }

        //SPOILER:
        // when the response is good, use the resulting JSON
        // to populate the dropdown in HTML,
        // so the user picks among actually available maps
        const select = document.getElementById("mapid-input")
        for (const {name, timeout} of maps_json) {
            const option = document.createElement("option")
            option.value = name
            const seconds = timeout / 1000000000
            option.textContent = `${name} (${seconds}s)`
            select.appendChild(option)
            console.log(`Map ${name} added to the dropdown`)
        }

        //TODO:
        // write the connect(..) function below,
        async function connect(event) {
            const mapid = document.getElementById("mapid-input").value;

            // requête init
            const res = await fetch(`/api/v2/${mapid}/init`, {
                method: "GET",
                credentials: "include"
            });

            if (!res.ok) {
                alert(`Erreur lors du init : ${res.status} ${res.statusText}`);
                return;
            }

            const json = await res.json();

            // json contient : ni, nj, data, api_key
            MAP_ID = mapid;
            API_KEY = json.api_key;
            NI = json.ni;
            NJ = json.nj;

            draw_map(json.ni, json.nj, json.data);
        }
        
    // on complétera après
    

        //TODO: and attach it to the Connect button
        document.getElementById("connect-button").addEventListener("click", connect);

        //TODO:
        // write a function that draws a map inside the griv div
        // - ni is the number of rows,
        // - nj the number of columns,
        // - and data is a 3D array of size ni x nj x 3,
        //   where the last dimension contains the RGB color of each pixel
        // do not forget to clean up any previously drawn map
        // also give the child div's the 'pixel' class to leverage the default css
        // also don't forget to set the gridTemplateColumns of the grid div
        function draw_map(ni, nj, data) {
            const grid = document.getElementById("grid");
            grid.innerHTML = "";
            grid.style.gridTemplateColumns = `repeat(${nj}, 1fr)`;

            for (let i = 0; i < ni; i++) {
                for (let j = 0; j < nj; j++) {

                    const [r, g, b] = data[i][j];

                    const pixel = document.createElement("div");
                    pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                    pixel.className = "pixel";

                    // rendre le pixel cliquable
                    pixel.addEventListener("click", () => {
                        const color = document.getElementById("colorpicker").value;
                        const [rr, gg, bb] = hex_to_rgb(color);
                        set_pixel(i, j, rr, gg, bb);
                    });

                    grid.appendChild(pixel);
                }
            }
        }

        draw_map(5, 5, [
            [ [255, 0, 0], [255, 255, 0], [255, 0, 0], [255, 255, 0], [255, 0, 0] ],
            [ [255, 255, 0], [255, 0, 0], [255, 255, 0], [255, 0, 0], [255, 255, 0] ],
            [ [255, 0, 0], [255, 255, 0], [255, 0, 0], [255, 255, 0], [255, 0, 0] ],
            [ [255, 0, 0], [255, 255, 0], [255, 0, 0], [255, 255, 0], [255, 0, 0] ],
            [ [255, 0, 0], [255, 255, 0], [255, 0, 0], [255, 255, 0], [255, 0, 0] ]
        ]);

        //TODO:
        // write a function that applies a set of color changes
        // the input is a collection of 5-tuples of the form i, j, r, g, b
        function apply_changes(ni, nj, changes) {
            const grid = document.getElementById("grid");
            const pixels = grid.children;

            for (const [i, j, r, g, b] of changes) {
                const index = i * nj + j;
                const pixel = pixels[index];
                pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            }
        }


        //TMP: to test the previous function, let's change the color of 3 pixels
        apply_changes(5, 5,[
            [1, 1, 0, 0, 255],
            [1, 2, 0, 0, 255],
            [1, 3, 0, 0, 255],
        ])

        //TODO:
        // now that we have the JSON data that describes the map, we can
        // display the grid, and retrieve the corresponding API-KEY


        //TODO:
        // now that we have the API-KEY,
        // write a refresh(...) function that updates the grid
        // and attach this function to the refresh button click
        async function refresh(ni, nj) {
            if (!MAP_ID || !API_KEY) return;

            try {
                const response = await fetch(`/api/v2/updates/${MAP_ID}`, {
                    method: "GET", // On précise GET explicitement
                    headers: { 
                        "API-KEY": API_KEY,
                        "Accept": "application/json" 
                    }
                });

                if (response.status === 422) {
                    console.error("Erreur 422 : Le serveur refuse les paramètres envoyés. Vérifiez le MAP_ID.");
                    return;
                }

                if (!response.ok) throw new Error(`Erreur ${response.status}`);

                const changes = await response.json();
                
                // Application des changements
                const pixels = document.getElementById("grid").children;
                for (const [i, j, r, g, b] of changes) {
                    const index = i * nj + j;
                    if (pixels[index]) {
                        pixels[index].style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                    }
                }
            } catch (err) {
                console.error("Erreur lors du refresh :", err);
            }
        }


        //TODO:
        // to be able to color a pixel: write a set_pixel(...)
        // function that sends a request to the server to color a pixel
        // and attach this function to each pixel in the grid click
        // the color is taken from the color picker (code provided below)
        // it's up to you to find a way to get the pixel coordinates
        async function set_pixel(i, j, r, g, b) {
            if (!MAP_ID || !API_KEY) {
                console.log("Impossible de set_pixel : MAP_ID ou API_KEY manquant");
                return;
            }

            const res = await fetch(`/api/v2/${MAP_ID}/set`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "API-KEY": API_KEY        // ← ajout ici
                },
                body: JSON.stringify({ i, j, r, g, b })
            });
    

            if (!res.ok) {
                alert(`Erreur lors du set_pixel : ${res.status} ${res.statusText}`);
                return;
            }

            await refresh();
}

        function hex_to_rgb(hex) {
            // hex est du type "#RRGGBB"
            const value = hex.slice(1); // enlève le "#"
            const int = parseInt(value, 16);

            const r = (int >> 16) & 255;
            const g = (int >> 8) & 255;
            const b = int & 255;

            return [r, g, b];
        }
        //TODO:
        // why not refresh the grid every 2 seconds?
        setInterval(refresh, 2000);
        // or even refresh the grid after clicking a pixel?

        // ---- cosmetic / convenience / bonus:

        //TODO: for advanced students, make it so we can change maps from the UI
        // using e.g. the Connect button in the HTML

        // TODO: to be efficient, it would be useful to display somewhere
        // the coordinates of the pixel hovered by the mouse

        //TODO: for the quick ones: display somewhere how much time
        // you need to wait before being able to post again

        //TODO: for advanced users: it could be useful to be able to
        // choose the color from a pixel?



        // no need to change anything below
        // just little helper functions for your convenience

        // retrieve RGB color from the color picker
        function getPickedColorInRGB() {
            const colorHexa = document.getElementById("colorpicker").value

            const r = parseInt(colorHexa.substring(1, 3), 16)
            const g = parseInt(colorHexa.substring(3, 5), 16)
            const b = parseInt(colorHexa.substring(5, 7), 16)

            return [r, g, b]
        }

        // in the other direction, to put the color of a pixel in the color picker
        // (the color picker insists on having a color in hexadecimal...)
        function pickColorFrom(div) {
            // rather than taking div.style.backgroundColor
            // whose format we don't necessarily know
            // we use this which returns a 'rgb(r, g, b)'
            const bg = window.getComputedStyle(div).backgroundColor
            // we keep the 3 numbers in an array of strings
            const [r, g, b] = bg.match(/\d+/g)
            // we convert them to hexadecimal
            const rh = parseInt(r).toString(16).padStart(2, '0')
            const gh = parseInt(g).toString(16).padStart(2, '0')
            const bh = parseInt(b).toString(16).padStart(2, '0')
            const hex = `#${rh}${gh}${bh}`
            // we put the color in the color picker
            document.getElementById("colorpicker").value = hex
        }
    }
)
