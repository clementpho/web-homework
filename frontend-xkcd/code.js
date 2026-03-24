const XKCD = "https://xkcd.now.sh/?comic="

document.addEventListener("DOMContentLoaded", () => {
    const fetchIssue = (issue) => {
        const url = `${XKCD}${issue}`;
        console.log(`Fetching issue ${issue}...at ${url}`)
        const response = await fetch(url)
        console.log(response)
    }
    
    const form = document.querySelector("form")
    form.addEventListener("submit", (event) => {
        event.preventDefault()
        const issue = document.querySelector("#issue").value
        fetchIssue(issue)
    })
})

