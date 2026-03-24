document.addEventListener("DOMContentLoaded",
    async () => {

        let MAP_ID = "TEST"
        let API_KEY = undefined

        let current_ni = 0
        let current_nj = 0

        let refreshInterval = null

        console.log("Retrieving maps from the server...")
        const maps_response = await fetch(`/api/v2/maps`, {credentials: "include"})
        const maps_json = await maps_response.json()

        if (!maps_response.ok) {
            alert(`Error retrieving maps: ${maps_response.status} ${maps_response.statusText}`)
            return
        }

        const select = document.getElementById("mapid-input")
        for (const {name, timeout} of maps_json) {
            const option = document.createElement("option")
            option.value = name
            const seconds = timeout / 1000000000
            option.textContent = `${name} (${seconds}s)`
            select.appendChild(option)
            console.log(`Map ${name} added to the dropdown`)
        }

        async function connect(event) {
            MAP_ID = document.getElementById("mapid-input").value
            console.log(`Connecting to map ${MAP_ID}...`)

            const init_response = await fetch(`/api/v2/init/${MAP_ID}`, {credentials: "include"})

            if (!init_response.ok) {
                alert(`Error initializing map: ${init_response.status} ${init_response.statusText}`)
                return
            }

            const init_json = await init_response.json()
            console.log("Init response:", init_json)

            const { ni, nj, data } = init_json
            current_ni = ni
            current_nj = nj

            API_KEY = init_json.api_key
            console.log(`API key: ${API_KEY}`)

            draw_map(ni, nj, data)

            if (refreshInterval) clearInterval(refreshInterval)
            refreshInterval = setInterval(() => refresh(current_ni, current_nj), 2000)
        }

        document.getElementById("connect-button").addEventListener("click", connect)



        function apply_changes(ni, nj, changes) {
            const grid = document.getElementById("grid")
            for (const [i, j, r, g, b] of changes) {
                const index = i * nj + j
                const div = grid.children[index]
                if (div) {
                    div.style.backgroundColor = `rgb(${r}, ${g}, ${b})`
                }
            }
        }

        async function refresh(ni, nj) {
            if (!MAP_ID || !API_KEY) return

            const response = await fetch(`/api/v2/updates/${MAP_ID}`, {
                credentials: "include",
                headers: { "API-KEY": API_KEY }
            })

            if (!response.ok) {
                console.warn(`Refresh failed: ${response.status} ${response.statusText}`)
                return
            }

            const changes = await response.json()
            apply_changes(ni, nj, changes)
        }

        document.getElementById("refresh-button").addEventListener("click",
            () => refresh(current_ni, current_nj)
        )

        // ... (haut du fichier inchangé)

        function draw_map(ni, nj, data) {
            const grid = document.getElementById("grid");
            grid.innerHTML = "";

            // IMPORTANT : On définit le nombre de colonnes dynamiquement
            grid.style.gridTemplateColumns = `repeat(${nj}, 1fr)`;

            for (let i = 0; i < ni; i++) {
                for (let j = 0; j < nj; j++) {
                    const div = document.createElement("div");
                    div.classList.add("pixel");
                    
                    // On récupère la couleur (assure-toi que data[i][j] est [r,g,b])
                    const color = data[i][j];
                    div.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

                    // Tooltip coordonnées
                    div.addEventListener("mouseenter", () => {
                        document.getElementById("coords-display").textContent = `Coords: ${i}, ${j}`;
                    });

                    // Clic gauche pour peindre
                    div.addEventListener("click", () => set_pixel(div, i, j));
                    
                    // Clic droit pour pomper la couleur (pipette)
                    div.addEventListener("contextmenu", (e) => {
                        e.preventDefault();
                        pickColorFrom(div);
                    });

                    grid.appendChild(div);
                }
            }
        }

        async function set_pixel(div, i, j) {
            if (!MAP_ID || !API_KEY) {
                alert("Connectez-vous d'abord !");
                return;
            }

            const [r, g, b] = getPickedColorInRGB();

            // L'URL et le Body doivent correspondre exactement à ce que l'API attend
            try {
                const response = await fetch(`/api/v2/pixel/${MAP_ID}/${i}/${j}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "API-KEY": API_KEY,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ r, g, b }) 
                });

                if (response.status === 429) {
                    alert("Trop rapide ! Attendez le timeout.");
                    return;
                }

                if (!response.ok) {
                    throw new Error(`Erreur API: ${response.status}`);
                }

                // Mise à jour visuelle immédiate pour fluidité
                div.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
            } catch (error) {
                console.error("Erreur lors du set_pixel:", error);
            }
        }

        function getPickedColorInRGB() {
            const colorHexa = document.getElementById("colorpicker").value

            const r = parseInt(colorHexa.substring(1, 3), 16)
            const g = parseInt(colorHexa.substring(3, 5), 16)
            const b = parseInt(colorHexa.substring(5, 7), 16)

            return [r, g, b]
        }


        function pickColorFrom(div) {
            const bg = window.getComputedStyle(div).backgroundColor
            const [r, g, b] = bg.match(/\d+/g)
            const rh = parseInt(r).toString(16).padStart(2, '0')
            const gh = parseInt(g).toString(16).padStart(2, '0')
            const bh = parseInt(b).toString(16).padStart(2, '0')
            const hex = `#${rh}${gh}${bh}`
            document.getElementById("colorpicker").value = hex
        }
    }
)